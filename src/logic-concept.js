
import { MathConcept } from './math-concept.js'

/**
 * A LogicConcept is a specific type of MathConcept.  It is one that can be
 * processed by the LDE when validating the correctness of steps of a user's
 * work.  MathConcepts are more high-level, and in order to be processed by
 * the LDE, must be broken down into LogicConcepts.
 * 
 * There are three types of LogicConcepts, described only vaguley here, but
 * you can view the documentation in the appropriate subclasses for details.
 * 
 *  * An {@link Expression} is what we typically think of as a piece of
 *    mathematics--an equation, a statement, a formula, which is often
 *    enclosed in `$...$` in a LaTeX document
 *  * An {@link Environment} is any larger structure in a document that
 *    contains many expressions, such as a theorem, a proof, a section, an
 *    example, or a chain of connected equations.
 *  * A {@link Declaration} introduces a new variable or constant.  This is
 *    common in both computer programming (where many languages require us
 *    to define our variables) and in mathematics (where we say things like
 *    "Let x be an arbitrary real number" or "Let D be the constant provided
 *    by Theorem 6.1."
 */
export class LogicConcept extends MathConcept {

    static className = MathConcept.addSubclass( 'LogicConcept', LogicConcept )

    /**
     * Constructs a LogicConcept from the given list of children, which may
     * be empty.  All children must also be instances of LogicConcept; those
     * that are not are filtered out.
     * 
     * Newly constructed LogicConcept instances (unlike MathConcepts) are
     * marked dirty by default, indicating that they probably need validation.
     * 
     * @param  {...LogicConcept} children child LogicConcepts to be added to
     *   this one (as in the constructor for {@link MathConcept})
     */
    constructor ( ...children ) {
        super( ...children.filter( child => child instanceof LogicConcept ) )
        this.markDirty()
        this._origin = null
        this._feedbackEnabled = true
        this._feedbackQueue = [ ]
    }

    /**
     * Overrides the behavior in {@link MathConcept#markDirty the parent class},
     * where the default behavior is to propagate dirtiness up to ancestors,
     * whereas we do not want that here.  The reason is that MathConcepts use
     * the dirty flag to indicate whether they need to have their interpretation
     * recomputed, but LogicConcepts use the dirty flag to indicate whether they
     * need to have their validation recomputed.  Interpretation tends to depend
     * on the interpretation of children, whereas validation does not.
     * 
     * @param {boolean} [on=true] same meaning as in
     *   {@link MathConcept#markDirty the parent class}
     * @param {boolean} [propagate=false] same meaning as in
     *   {@link MathConcept#markDirty the parent class}, except the default is
     *   now false
     */
    markDirty ( on = true, propagate = false ) {
        super.markDirty( on, propagate )
    }

    /**
     * Whether a LogicConcept has an ancestor chain that is all claims is often
     * a crucial query.  It is a large part of the definition of
     * {@link Expression#isAConclusionIn conclusions}, for example, but can also
     * be applied to {@link Environment Environments} and other LogicConcepts.
     * 
     * This function returns true if this LogicConcept or any of its ancestors
     * is marked as a given (using the {@link MathConcept#isA isA()} function),
     * up to but not including the ancestor passed as the `inThis` parameter.
     * If that parameter is omitted, all ancestors up to and including the
     * topmost are searched, and if any is a given, this function returns false.
     * Otherwise it returns true.
     * 
     * @param {LogicConcept} [inThis] - the ancestor in which to perfrom this
     *   test, which can be omitted to mean the top-level
     *   {@link MathConcept MathConcept} in the hierarchy
     * @returns {boolean} whether this LogicConcept has only claim ancestors,
     *   up to but not including the given ancestor `inThis`
     * 
     * @see {@link Expression#isAConclusionIn isAConclusionIn()}
     */
    hasOnlyClaimAncestors ( inThis ) {
        for ( let walk = this ; walk && walk != inThis ;
                walk = walk.parent() )
            if ( walk.isA( 'given' ) ) return false
        return true
    }

    /**
     * LogicConcepts can be thought of as expression a fragment of propositional
     * logic if we view givens (that is, LogicConcepts satisfying
     * `.isA( 'given' )`) as saying "if this is true..." and those that are not
     * givens as saying "...then this is true."  For example, we would view the
     * LogicConcept expressed by the {@link LogicConcept#fromPutdown putdown
     * notation} `{ :{ A B } C D }` as saying "if A and B are true then C and D
     * are true," or in propositional logic notation as
     * $(A\wedge B)\to(C\wedge D)$.
     * 
     * This function helps us express such propositional sentences using only
     * conditionals, that is, not needing conjunctions.  The above example would
     * be written as two separate sentences, one saying "if A then if B then C"
     * and another saying "if A then if B then D," or in propositional logic
     * notation as the sentences $A\to B\to C$ and $A\to B\to D$, where the
     * conditional arrow associates to the right.  We interpret the set of such
     * propositional expressions as meaning their conjunction.  Thus there is
     * one implied conjunction over all of the conditional expressions, and so
     * this is a type of normal form.
     * 
     * It returns a list of LogicConcepts, each of which is either a single
     * {@link Expression}, which should be interpreted as a single propositional
     * letter, or an {@link Environment} whose only claim child is its last,
     * that is, one of the form `{ :G_1 ... :G_n C }`, containing $n$ givens and
     * 1 claim.
     * 
     * The current version of this function supports only inputs containing
     * nested {@link Environment Environments} and {@link Expression
     * Expressions}, not inputs that may contain {@link Declaration
     * Declarations}.  Any {@link Declaration Declarations} are just ignored.
     * 
     * @returns {LogicConcept[]} the conditional form of this LogicConcept, as
     *   documented above
     */
    conditionalForm () {
        // The conditional form of an Expression E is just E (not as a given)
        const Expression = MathConcept.subclasses.get( 'Expression' )
        if ( this instanceof Expression )
            return [ this.copy().unmakeIntoA( 'given' ) ]
        // The conditional form of a Declaration is [ ], because we ignore Decls
        const Environment = MathConcept.subclasses.get( 'Environment' )
        if ( !( this instanceof Environment ) )
            return [ ]
        // The conditional form of an Environment is the concatenation of all
        // of the conditional forms of its conclusion sequents.
        const result = [ ]
        const conclusions = this.conclusions().filter(
            x => x instanceof Expression ) // again, we ignore Declarations
        for ( let conclusion of conclusions ) {
            // build the inner sequent for this conclusion
            const next = new Environment()
            const context = conclusion.accessibles( false, this ).reverse()
            const strictContext = context.filter( x => x.isA( 'given' ) )
            for ( let premise of strictContext )
                for ( let sequent of premise.conditionalForm() )
                    next.pushChild( sequent.makeIntoA( 'given' ) )
            next.pushChild( conclusion.copy() )
            // if it is degenerate, drop the unneeded Environment wrapper
            result.push( next.numChildren() > 1 ? next : next.firstChild() )
        }
        return result
    }

    //////
    //
    //  Feedback functions
    //
    //////

    /**
     * Many LogicConcept instances will be created by interpreting a
     * MathConcept, and breaking it down into smaller, simpler parts, expressed
     * as LogicConcepts.  We will typically want to track, for any given
     * LogicConcept, which MathConcept it came from, in that sense.  This
     * function returns that value.
     * 
     * There is no corresponding setter function, because it is not expected
     * that clients should be changing the origin of a LogicConcept.  Later,
     * when we implement interpretation of MathConcepts into LogicConcepts,
     * we will populate this value in that code.
     * 
     * @returns {MathConcept} the object whose interpretation led to the
     *   construction of this LogicConcept
     */
    origin () { return _origin }

    /**
     * This method does one of two things, depending on whether feedback for
     * this instance is enabled, which can be customized using
     * {@link LogicConcept#enableFeedback enableFeedback()}.
     * 
     * If feedback is enabled and this object has an
     * {@link LogicConcept#origin origin()}, then this method just calls the
     * {@link MathConcept#feedback feedback()} method in that origin, with the
     * same parameter.  The reason for this is that feedback to the LDE about
     * a LogicConcept should always be mediated through the MathConcept that
     * gave rise to that LogicConcept.
     * 
     * If feedback is disabled, then the feedback given as the parameter will
     * be stored in a feedback queue, which can be discarded or flushed later,
     * using {@link LogicConcept#enableFeedback enableFeedback()}.
     * 
     * Note that there is no third option; if feedback is enabled, but this
     * object has no {@link LogicConcept#origin origin()}, then there is no
     * way for this object to send the requested feedback, so this method will
     * take no action.
     * 
     * @param {Object} feedbackData - Any data that can be encoded using
     *   `JSON.stringify()` (or
     *   {@link predictableStringify predictableStringify()}), to be transmitted
     * @see {@link MathConcept.feedback MathConcept static feedback() method}
     * @see {@link MathConcept#feedback MathConcept feedback() method for instances}
     */
    feedback ( feedbackData ) {
        if ( this._feedbackEnabled && this._origin instanceof MathConcept ) {
            this._origin.feedback( feedbackData )
        } else {
            this._feedbackQueue.push( feedbackData )
        }
    }

    /**
     * Enable or disable feedback, optionally flushing the queue of any old,
     * stored feedback from when feedback was disabled.
     * 
     * To understand what it means for feedback to be enabled or disabled,
     * see the documentation for {@link LogicConcept#feedback feedback()}.
     * 
     * @param {boolean} enable - whether to enable feedback (if true) or
     *   disable it (if false)
     * @param {boolean} flushQueue - when enabling feedback, there may be
     *   a backlog of old feedback that was stored (and not sent) when
     *   feedback was disabled.  If this parameter is true, then that
     *   backlog of old feedback is all sent immediately, in the same
     *   order it was enqueued.  If this parameter is false, then taht
     *   backlog of old feedback is discarded.
     * @see {@link LogicConcept#feedback feedback()}
     */
    enableFeedback ( enable = true, flushQueue = false ) {
        this._feedbackEnabled = enable
        if ( this._feedbackEnabled && flushQueue )
            this._feedbackQueue.map( data => this.feedback( data ) )
        this._feedbackQueue = [ ]
    }
    
    /**
     * This function takes putdown notation for one or more LogicConcepts and
     * builds instances of them by parsing the input, returning an array of
     * the results.  Putdown is a simple format, and so it plays on the name
     * of the famous simple format "markdown," but turns it into something
     * that sounds undesirable (and humorous?).  Putdown and Markdown have no
     * connection, neither historically nor in the format itself.
     * 
     * Putdown notation is defined as follows.
     * 
     *  * A {@link Symbol Symbol} is written using any sequence of
     *    non-whitespace characters that does not include or conflict with the
     *    special characters below.  Thus symbols are quite flexible,
     *    including things like `x` and `y` as well as `-459.7001` and
     *    `$===_-_@_-_===$` and much more.
     *  * A {@link Symbol Symbol} can also be written as a string literal
     *    whose only escape characters are `\"` inside double-quoted literals,
     *    `\'` inside single-quoted literals, and `\n` or `\\` in any case.
     *    Thus you can create just about any symbol at all, including
     *    `"{ yes it's (a symbol) }"`, which is not a compound expression, but
     *    is a single atomic symbol.
     *  * An {@link Application Application} is written using LISP notation.
     *    Function application requires at least one argument (no empty paren
     *    pairs).  For example, you might write $\sin x$ as `(sin x)`.
     *  * A {@link BindingExpression BindingExpression} is written as a series
     *    of {@link Symbol Symbols}, separated by commas, followed by another
     *    comma, and then the body expression.  All children before the body and
     *    after the first child must be {@link Symbol Symbols}, and are the
     *    bound variables.  Example:  `x , (P x)` means $P(x)$ with $x$ bound.
     *    Consequently, could write, for example, `(∀ x , (P x))` to mean the
     *    application of the `∀` symbol to the binding `x , (P x)`.
     *  * A {@link Declaration Declaration} lists the declared {@link Symbol
     *    Symbols} in brackets, followed optionally by a comma and then a
     *    body, which is any LogicConcept. that is an assumption made about the
     *    variables.  Example: `[x , (P x)]` means "Declare $x$ about which
     *    $P(x)$ is true."  This can be used for arbitrary variables (in which
     *    we would be assuming $P(x)$) or declaring constants we know to exist
     *    (in which we would be concluding $P(x)$) or for anything else the
     *    user's library wants to use declarations for.
     *  * An {@link Environment Environment} is written with its children
     *    separated by spaces and surrounded in curly brackets.  Example:
     *    `{ child1 child2 etc }`.
     *  * Any {@link Environment Environment},
     *    {@link Declaration Declaration}, or
     *    {@link Expression#isOutermost outermost Expression} can be marked
     *    as a "given" by preceding it with a colon, `:`.
     *  * Any {@link Environment Environment},
     *    {@link Declaration Declaration}, or
     *    {@link Expression Expression} can be given additional attributes by
     *    following it with `+{` and then for the rest of the line (that is,
     *    until the next newline) writing as much JSON code as you like,
     *    beginning with that initial `{`, as attributes to add to the
     *    preceding object.  For example, to add the color green to a
     *    {@link Symbol Symbol}, we might do this:
     *    `my_symbol +{"color":"green"}`.  To add more attributes than can fit
     *    on one line, simply start another `+{...}` block on the next line.
     *  * The notation `//` is used for one-line comments.  Anything after it
     *    is ignored, up until the next newline.  The previous rule has some
     *    conflict with this one, and we resolve it as follows.  If a `//`
     *    occurs before a `+{` on a line, then the `//` takes precedence and
     *    the rest of the line is a comment, so the `+{` is ignored.  But if
     *    the `+{` appears first, it takes precedence, and the rest of the
     *    line is interpreted as JSON code, so a trailing `//` comment will
     *    most likely create invalid JSON, and thus should be avoided.
     * 
     * @param {String} string - should contain putdown notation for one or
     *   more LogicConcepts
     * @returns {LogicConcept[]} an Array of the LogicConcepts described in
     *   putdown notation in the argument
     * 
     * @see {@link MathConcept.fromSmackdown fromSmackdown()}
     */
    static fromPutdown ( string ) {
        // linear string processing tools
        let processed = ''
        let match = null
        const isNext = regexp => match = regexp.exec( string )
        const isLast = regexp => typeof( stack.last() ) == 'string'
            && regexp.test( stack.last() )
        const problem = reason => {
            const lines = processed.split( '\n' )
            const last = lines.last()
            throw `${reason}, line ${lines.length} col ${last.length}`
        }
        const shiftNext = () => {
            processed += string.substring( 0, match[0].length )
            string = string.substring( match[0].length )
        }
        // parsing data
        const groupers = [ [ '{', '}' ], [ '(', ')' ], [ '[', ']' ] ]
        const openGroupRE = /^\{\*|^\{|^\(|^\[/
        const closeGroupRE = /^\*\}|^\}|^\)|^\]/
        const stringRE = /^"(?:[^"\\\n]|\\"|\\\\)*"|^'(?:[^'\\\n]|\\'|\\\\)*'/
        const commentRE = /^\/\/.*\n/
        const givenRE = /^:/
        const bindingRE = /^,/
        const attributesRE = /^[+][{].*(?:\n|$)/
        const whitespaceRE = /^\s/
        const symbolRE = /^(?:(?!,|\(|\)|\{|\}|\[|\]|:)\S)+/
        // parsing tools
        const isOpenGrouper = g => groupers.some( pair => pair[0] == g )
        const isGrouperPair = ( g, h ) =>
            groupers.some( pair => pair[0] == g && pair[1] == h )
        const evalAttributes = () => JSON.parse( match[0].substring( 1 ) )
        const exactMatch = ( re, str ) => {
            const match = re.exec( str )
            return match && match[0].length == str.length
        }
        // stack management
        let stack = [ ]
        const save = x => stack.push( x || match[0] )
        const restore = () => {
            let result = [ ]
            while ( stack.length > 0 &&
                    ( result.length == 0 || !isOpenGrouper( result[0] ) ) )
                result.unshift( stack.pop() )
            return result
        }
        const lastOpenGrouper = () => {
            for ( let i = stack.length - 1 ; i >= 0 ; i-- )
                if ( isOpenGrouper( stack[i] ) ) return stack[i]
            return
        }
        // tool for processing commas into bindings
        const handleCommas = group => {
            // groups may not begin or end with commas
            if ( exactMatch( bindingRE, group.contents[0] ) )
                problem( 'Group begins with a comma' )
            if ( exactMatch( bindingRE, group.contents.last() ) )
                problem( 'Group ends with a comma' )
            // utility function
            const isSymbol = x => typeof( x ) == 'string' &&
                ( exactMatch( stringRE, x ) || exactMatch( symbolRE, x ) )
            const isModifier = x => x.type == 'attributes'
            // process all "sym , body" segments inside this group
            for ( let i = group.contents.length - 1 ; i >= 0 ; i-- ) {
                if ( exactMatch( bindingRE, group.contents[i] ) ) {
                    // find the next thing that is not a JSON modifier
                    let j
                    for ( j = i - 1 ; j >= 0 ; j-- )
                        if ( !isModifier( group.contents[j] ) ) break
                    let lhs = group.contents[j]
                    // unary case: symbol , body
                    // (just convert it to the n-ary case)
                    if ( isSymbol( lhs ) ) {
                        group.contents.splice( j, i-j, lhs = {
                            type : '( )',
                            contents : group.contents.slice( j, i ),
                            isBinding : false
                        } )
                        i = j + 1
                    }
                    // ensure that in n-ary case, no modifier applies to the
                    // whole list of attributes
                    if ( j != i - 1 )
                        problem( 'Cannot modify a list of bound symbols' )
                    // n-ary case: ( symbols... ) , body
                    let rhs = group.contents[i+1]
                    if ( lhs.type == '( )'
                      && lhs.hasOwnProperty( 'contents' )
                      && lhs.contents.every( x =>
                            isSymbol( x ) || isModifier( x ) ) ) {
                        group.contents.splice( j, i-j+2, {
                            type : rhs.type ? rhs.type : '( )',
                            contents : [ ...lhs.contents, rhs ],
                            isBinding : true
                        } )
                    // error case: you can't do anything else , body
                    } else {
                        problem( 'Invalid left hand side of binding' )
                    }
                }
            }
        }
        // tokenize and do a little parsing
        while ( string.length > 0 ) {
            // skip comments and whitespace
            if ( isNext( commentRE ) || isNext( whitespaceRE ) ) {
                shiftNext()
            // handle +{...} JSON notation
            } else if ( isNext( attributesRE ) ) {
                let json
                try {
                    json = evalAttributes()
                } catch ( e ) {
                    problem( 'Invalid JSON attribute: ' + e.message )
                }
                // can't modify a comma, colon, or nothing
                if ( stack.length == 0 || isLast( givenRE )
                  || isLast( bindingRE ) || isOpenGrouper( stack.last() ) )
                    problem( 'Attribute JSON has no target to modify' )
                save( { type : 'attributes', data : json } )
                shiftNext()
            // handle open groupers
            } else if ( isNext( openGroupRE ) ) {
                const inner = match[0]
                const outer = lastOpenGrouper()
                if ( outer == '(' && inner != '(' )
                    problem( 'Expressions can contain only Symbols or '
                           + 'other Expressions' )
                save()
                shiftNext()
            // handle close groupers
            } else if ( isNext( closeGroupRE ) ) {
                save()
                const groupSoFar = restore()
                const pairText = `${groupSoFar[0]} ${match[0]}`
                if ( !isGrouperPair( groupSoFar[0], match[0] ) )
                    problem( `Mismatched groupers: ${pairText}` )
                const group = {
                    type : pairText,
                    contents : groupSoFar.slice( 1, -1 )
                }
                const n = group.contents.length
                // can't end an environment with a colon
                if ( exactMatch( givenRE, group.contents[n-1] ) )
                    problem( 'Cannot end an environment with a colon' )
                // handle meaning of a declaration, or errors it might contain:
                if ( group.type == '[ ]' ) {
                    // 1. cannot mark a declaration as given
                    // KM Temporarily commenting this out
                    // if ( isLast( givenRE ) )
                    //     problem( 'Cannot mark a declaration as given' )
                    // END KM
                    // 2. not enough children
                    if ( group.contents.length == 0 )
                        problem( 'Empty declarations are not permitted' )
                    // 3. More than one comma is invalid syntax
                    const numCommas = group.contents.filter( x =>
                        exactMatch( bindingRE, x ) ).length
                    if ( numCommas > 1 )
                        problem( 'A declaration can have at most one comma' )
                    // 4. If 2nd-to-last item (but not item #0) is a comma,
                    //    declaration has a body
                    if ( n >= 3
                      && exactMatch( bindingRE, group.contents[n-2] ) ) {
                        group.hasBody = true
                        group.contents = group.contents.without( n-2 )
                    // 5. If some other item is a comma, it's misplaced.
                    } else if ( numCommas > 0 ) {
                        problem( 'Misplaced comma inside declaration' )
                    // 6. No item is a comma, so it's a no-body binding.
                    } else {
                        group.hasBody = false
                    }
                }
                // handle meaning of an expr, or errors it might contain:
                if ( group.type == '( )' ) {
                    // Empty expression is invalid syntax
                    if ( group.contents.length == 0 )
                        problem( 'Empty applications are not permitted' )
                    // Non-empty is good...process any interior bindings
                    handleCommas( group )
                }
                // handle meaning of an env:
                if ( group.type == '{ }' ) {
                    handleCommas( group )
                }
                save( group )
                shiftNext()
            // handle all other tokens, but prioritize symbols last
            } else if ( isNext( stringRE ) ) {
                save()
                shiftNext()
            } else if ( isNext( givenRE ) ) {
                // make sure it's not inside an expression or a declaration
                if ( lastOpenGrouper() == '(' )
                    problem( 'Cannot put a colon inside an expression' )
                if ( lastOpenGrouper() == '[' )
                    problem( 'Cannot put a colon inside a declaration' )
                // make sure it's not after another colon
                if ( isLast( givenRE ) )
                    problem( 'Cannot put two colons in a row' )
                save()
                shiftNext()
            } else if ( isNext( bindingRE ) ) {
                // make sure it's not after another comma
                if ( isLast( bindingRE ) )
                    problem( 'Cannot put two commas in a row' )
                save()
                shiftNext()
            } else if ( isNext( symbolRE ) ) {
                // make sure it's not a malformed string literal
                if ( match[0].startsWith( '"' )
                  || match[0].startsWith( "'" ) )
                    problem( 'Incorrectly formed string literal' )
                save()
                shiftNext()
            // this case should be impossible, but just to be sure:
            } else {
                problem( 'Unrecognized content' )
            }
        }
        // if there are still unclosed open groupers, that's bad
        const unclosed = stack.filter( isOpenGrouper )
        if ( unclosed.length > 0 )
            problem( 'Reached end of input while still inside '
                + unclosed.join( ' and ' ) )
        // there may be "v1 , ... vn , body" sequences at the top level
        const virtualGroup = { type : '{ }', contents : stack }
        handleCommas( virtualGroup )
        stack = virtualGroup.contents
        // how to process a sequence of tokens and apply modifiers to siblings
        const applyModifiers = sequence => {
            let i = 0
            while ( i < sequence.length ) {
                // if an entry is a colon, mark the next as a given
                if ( givenRE.test( sequence[i] ) ) {
                    sequence[i+1].makeIntoA( 'given' )
                    sequence = sequence.without( i )
                // if an entry is an attributes object, modify the previous
                } else if ( sequence[i] instanceof Object
                         && sequence[i].type == 'attributes' ) {
                    for ( let key in sequence[i].data )
                        if ( sequence[i].data.hasOwnProperty( key ) )
                            sequence[i-1].setAttribute( key,
                                sequence[i].data[key] )
                    sequence = sequence.without( i )
                // if an entry is a LogicConcept, it's all set
                } else if ( sequence[i] instanceof LogicConcept ) {
                    i++
                // the following should never happen, but just to check:
                } else {
                    problem( 'Unknown tokenized object: '
                           + String( sequence[i] ) )
                }
            }
            return sequence
        }
        // how we will finish parsing
        const build = tree => {
            // base cases
            if ( typeof( tree ) == 'string' ) {
                // colons get kept as non-LCs for later application
                if ( givenRE.test( tree ) )
                    return tree
                // strings get interpreted into symbols
                const LurchSymbol = MathConcept.subclasses.get( 'Symbol' )
                if ( stringRE.test( tree ) ) {
                    const delim = tree[0]
                    return new LurchSymbol( tree.substring( 1, tree.length-1 )
                        .replace( RegExp( '\\\\'+delim, 'g' ), delim )
                        .replace( /\\\\/g, '\\' ).replace( /\n/g, '\\n' ) )
                }
                // everything else is already a symbol
                return new LurchSymbol( tree )
            }
            if ( tree instanceof Object && tree.type == 'attributes' ) {
                // JSON that will be attached to a previous sibling when the
                // applyModifiers function is called by our parent
                return tree
            }
            // induction step
            if ( tree instanceof Object && tree.contents instanceof Array ) {
                let children = tree.contents.map( build )
                // handle all special types of children:
                children = applyModifiers( children )
                // now all children are LogicConcepts, so we can build them
                // into whatever compound object is appropriate by tree.type:
                // Environments
                if ( tree.type == '{ }' ) {
                    if ( tree.isBinding ) {
                        const BindingEnvironment =
                            MathConcept.subclasses.get( 'BindingEnvironment' )
                        return new BindingEnvironment( ...children )
                    } else {
                        const Environment =
                            MathConcept.subclasses.get( 'Environment' )
                        return new Environment( ...children )
                    }
                // Expressions
                } else if ( tree.type == '( )' ) {
                    if ( tree.isBinding ) {
                        const BindingExpression =
                            MathConcept.subclasses.get( 'BindingExpression' )
                        return new BindingExpression( ...children )
                    } else {
                        const Application =
                            MathConcept.subclasses.get( 'Application' )
                        return new Application( ...children )
                    }
                // Declarations
                } else if ( tree.type == '[ ]' ) {
                    const Declaration =
                        MathConcept.subclasses.get( 'Declaration' )
                    return tree.hasBody ?
                        new Declaration( children.slice( 0, -1 ),
                                         children.last() ) :
                        new Declaration( children )
                // This should never happen:
                } else {
                    problem( 'Unknown group type: ' + tree.type )
                }
            }
            // this should never happen
            problem( 'Unknown tokenized object: ' + String( tree ) )
        }
        // parsing actually returns an array of parsed things
        return applyModifiers( stack.map( build ) )
    }

    /**
     * This function is the inverse of
     * {@link LogicConcept.fromPutdown fromPutdown()}, which creates
     * LogicConcept instances from text in putdown notation.  This function
     * writes putdown notation for any LogicConcept.  It should be the case
     * that this function outputs valid putdown notation for any LogicConcept
     * in which it is called, and that
     * {@link LogicConcept.fromPutdown fromPutdown()} applied to that notation
     * produces an object that {@link MathConcept#equals equals()} the
     * original.
     * 
     * @param {Function} [formatter] - an optional function that takes three
     *   arguments and returns the desired corresponding text output for them.
     *   This can be used to greatly customize the output of this function.  By
     *   default, the formatter used produces standard putdown.  If you use a
     *   different formatter, you can customize your putdown with colors, HTML
     *   tags, etc., as needed.  The three arguments are (1) the LC whose
     *   putdown is being computed, (2) the putdown string computed for it so
     *   far, with no attributes attached, and (3) the array of keys of
     *   attributes that should be included in the output.  The formatter
     *   function is responsible for creating the corresponding JSON for these
     *   attributes.
     * 
     * @returns {String} putdown notation for this LogicConcept instance
     */
    toPutdown ( formatter ) {
        // Although normally it would make sense to use the dynamic dispatch
        // built into the JavaScript language to accompish this task, we will
        // reinvent the wheel a little bit here just in order to keep this
        // code located all in the same file as the fromPutdown() code.
        // Doing it all here also allows us to factor some common tools out,
        // up above the switch statement, as you can see below.
        const indent = text => `  ${text.replace( /\n/g, '\n  ' )}`
        const isTooBig = text => /\n/.test( text ) || text.length > 50
        const Environment = MathConcept.subclasses.get( 'Environment' )
        const Declaration = MathConcept.subclasses.get( 'Declaration' )
        const given = ( !( this instanceof Declaration )
                     && ( !this.parent()
                       || this.parent() instanceof Environment )
                     && this.isA( 'given' ) ) ? ':' : ''
        if ( !formatter ) formatter = ( lc, putdown, keys ) => {
            const attrText = key => '+{' + JSON.stringify(key) + ':'
                + JSON.stringify(lc.getAttribute(key)) + '}\n'
            if ( keys.length == 0 )
                return putdown
            else if ( keys.length == 1 )
                return putdown + ' ' + attrText( keys[0] )
            else
                return putdown + '\n    '
                     + keys.map( attrText ).join( '    ' )
        }
        const childResults = this.children().map( child => child.toPutdown(formatter) )
        const finalize = ( text, skip = [ ] ) => {
            let keys = [ ]
            skip.push( '_type_given' ) // bad style, but concise
            for ( let key of this.getAttributeKeys() )
                if ( !skip.includes( key ) )
                    keys.push( key )
            return formatter( this,
                              given + text.replace( /\n\s*\n/g, '\n' ),
                              keys )
        }
        switch ( this.constructor.className ) {
            case 'Symbol':
                const text = this.text()
                const result = finalize(
                    !/\(|\)|\{|\}|\[|\]|:|\s|"|'/.test( text ) ? text :
                    ( '"' + text.replace( /\\/g, '\\\\' )
                                .replace( /"/g, '\\"' )
                                .replace( /\n/g, '\\n' ) + '"' ),
                    [ 'symbol text' ] )
                return result
            case 'Application':
                return finalize( `(${childResults.join( ' ' )})` )
            case 'BindingExpression':
            case 'BindingEnvironment':
                const last = childResults.pop()
                const first = childResults.length > 1 ?
                    '(' + childResults.join( ' ' ) + ')' : childResults[0]
                return finalize( first + ' , ' + last )
            case 'Declaration':
                const bodyPutdown = childResults.pop()
                if ( this.body() ) {
                    return finalize(
                        `[${childResults.join( ' ' )} , ${bodyPutdown}]` )
                } else {
                    return finalize( `[${childResults.join( ' ' )}]` )
                }
            case 'Environment':
                const envInside = childResults.join( ' ' )
                return finalize( envInside == '' ? '{ }' :
                             isTooBig( envInside ) ?
                             `{\n${indent(childResults.join( '\n' ))}\n}` :
                             `{ ${envInside} }` )
            default:
                throw 'Cannot convert this class to putdown: '
                    + this.constructor.className
        }
    }

}
