
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
     *  * A {@link Binding Binding} expression (quantifier, summation, etc.)
     *    is written just like a function application but with a comma before
     *    the body.  All children before the body and after the first child
     *    must be {@link Symbol Symbols}, and are the bound variables.
     *    Example:  `(∀ x, (P x))` means $\forall x, P(x)$.
     *  * A variable {@link Declaration Declaration} lists the declared
     *    {@link Symbol Symbols} in brackets, followed by the keyword `var`
     *    followed by an optional body that is an assumption made about the
     *    variables.  Example: `[x var (P x)]` means "Let $x$ be arbitary and
     *    assume $P(x)$."
     *  * A constant {@link Declaration Declaration} is the same but with
     *    `const` instead of `var`.  Again, the body is optional, so
     *    `[pi const]` declares the symbol `pi` to be a constant.
     *  * An {@link Environment Environment} is written with its children
     *    separated by spaces and surrounded in curly brackets.  Example:
     *    `{ child1 child2 etc }`.
     *  * A {@link Formula Formula} (which is a subclass of
     *    {@link Environment Environment}) by using `{*` and `*}` as the
     *    grouping markers instead of undecorated curly brackets.
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
     */
    static fromPutdown ( string ) {
        // linear string processing tools
        const original = string
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
        const groupers =
            [ [ '{*', '*}' ], [ '{', '}' ], [ '(', ')' ], [ '[', ']' ] ]
        const openGroupRE = /^\{\*|^\{|^\(|^\[/
        const closeGroupRE = /^\*\}|^\}|^\)|^\]/
        const stringRE = /^"(?:[^"\\\n]|\\"|\\\\)*"|^'(?:[^'\\\n]|\\'|\\\\)*'/
        const commentRE = /^\/\/.*\n/
        const givenRE = /^:/
        const bindingRE = /^,/
        const declarationRE = /^var\b|^const\b/
        const attributesRE = /^[+][{].*(?:\n|$)/
        const whitespaceRE = /^\s/
        const symbolRE = /^(?:(?!,|\(|\)|\{|\}|\[|\]|:)\S)+/
        // parsing tools
        const isOpenGrouper = g => groupers.some( pair => pair[0] == g )
        const isGrouperPair = ( g, h ) =>
            groupers.some( pair => pair[0] == g && pair[1] == h )
        const evalAttributes = () => JSON.parse( match[0].substring( 1 ) )
        // stack management
        const stack = [ ]
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
                // can't modify a comma, colon, var/const, or nothing
                if ( stack.length == 0 || isLast( givenRE )
                  || isLast( bindingRE ) || isLast( declarationRE )
                  || isOpenGrouper( stack.last() ) )
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
                // we do not police formulas inside declarations here, because
                // they are disallowed at any depth, not just one, and an error
                // will be thrown later anyway, if and when the declaration
                // construction is attempted
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
                if ( givenRE.test( group.contents[n-1] ) )
                    problem( 'Cannot end an environment with a colon' )
                // handle meaning of a declaration, or errors it might contain:
                if ( group.type == '[ ]' ) {
                    // 1. wrong number of var/const in a declaration
                    if ( group.contents.filter( x =>
                            declarationRE.test( x ) ).length != 1 )
                        problem( 'A declaration must have '
                               + 'exactly one var/const' )
                    // 2. not enough children
                    if ( group.contents.length <= 1 )
                        problem( 'A declaration must have at least 2 children' )
                    // 3. wrong placement of var/const in a declaration
                    if ( declarationRE.test( group.contents[n-1] ) ) {
                        group.declarationType = group.contents.pop()
                        group.hasBody = false
                    } else if ( declarationRE.test( group.contents[n-2] ) ) {
                        const body = group.contents.pop()
                        group.declarationType = group.contents.pop()
                        group.contents.push( body )
                        group.hasBody = true
                    } else {
                        problem( 'Var/const appears too early in declaration' )
                    }
                }
                // handle meaning of an expr, or errors it might contain:
                if ( group.type == '( )' ) {
                    // 1. Empty expression is invalid syntax
                    if ( group.contents.length == 0 )
                        problem( 'Empty applications are not permitted' )
                    // 2. More than one comma is invalid syntax
                    const numCommas = group.contents.filter( x =>
                        bindingRE.test( x ) ).length
                    if ( numCommas > 1 )
                        problem( 'An expression can have at most one comma' )
                    // 3. If 2nd-to-last item is a comma, group is a binding
                    if ( n >= 2 && bindingRE.test( group.contents[n-2] ) ) {
                        group.isBinding = true
                        group.contents = group.contents.without( n-2 )
                    // 4. Otherwise the comma is misplaced
                    } else if ( numCommas > 0 ) {
                        problem( 'Misplaced comma inside expression' )
                    } else {
                        group.isBinding = false
                    }
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
                // make sure it's inside an expression
                if ( lastOpenGrouper() != '(' )
                    problem( 'Cannot put a comma outside an expression' )
                save()
                shiftNext()
            } else if ( isNext( declarationRE ) ) {
                // make sure it's inside a declaration
                if ( lastOpenGrouper() != '[' )
                    problem( 'Cannot put var/const outside a declaration' )
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
                // Formulas
                if ( tree.type == '{* *}' ) {
                    const Formula = MathConcept.subclasses.get( 'Formula' )
                    return new Formula( ...children )
                // Environments
                } else if ( tree.type == '{ }' ) {
                    const Environment =
                        MathConcept.subclasses.get( 'Environment' )
                    return new Environment( ...children )
                // Expressions
                } else if ( tree.type == '( )' ) {
                    if ( tree.isBinding ) {
                        const Binding =
                            MathConcept.subclasses.get( 'Binding' )
                        return new Binding( ...children )
                    } else {
                        const Application =
                            MathConcept.subclasses.get( 'Application' )
                        return new Application( ...children )
                    }
                // Declarations
                } else if ( tree.type == '[ ]' ) {
                    const Declaration =
                        MathConcept.subclasses.get( 'Declaration' )
                    const type = tree.declarationType == 'var' ?
                        Declaration.Variable : Declaration.Constant
                    return tree.hasBody ?
                        new Declaration( type,
                            children.slice( 0, -1 ),
                            children.last() ) :
                        new Declaration( type, children )
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
     * {@link LogicConcept#fromPutdown fromPutdown()}, which creates
     * LogicConcept instances from text in putdown notation.  This function
     * writes putdown notation for any LogicConcept.  It should be the case
     * that this function outputs valid putdown notation for any LogicConcept
     * in which it is called, and that
     * {@link LogicConcept#fromPutdown fromPutdown()} applied to that notation
     * produces an object that {@link MathConcept#equals equals()} the
     * original.
     * 
     * @returns {String} putdown notation for this LogicConcept instance
     */
    toPutdown () {
        // Although normally it would make sense to use the dynamic dispatch
        // built into the JavaScript language to accompish this task, we will
        // reinvent the wheel a little bit here just in order to keep this
        // code located all in the same file as the fromPutdown() code.
        // Doing it all here also allows us to factor some common tools out,
        // up above the switch statement, as you can see below.
        const indent = ( text, depth ) => `  ${text.replace( /\n/g, '\n  ' )}`
        const isTooBig = text => /\n/.test( text ) || text.length > 50
        const childResults = this.children().map( child => child.toPutdown() )
        const Environment = MathConcept.subclasses.get( 'Environment' )
        const given = ( ( !this.parent()
                       || this.parent() instanceof Environment )
                     && this.isA( 'given' ) ) ? ':' : ''
        const finalize = ( text, skip = [ ] ) => {
            let attributes = [ ]
            skip.push( '_type_given' ) // bad style, but concise
            for ( let key of this.getAttributeKeys() )
                if ( !skip.includes( key ) )
                    attributes.push( '+{' + JSON.stringify( key ) + ':'
                        + JSON.stringify( this.getAttribute( key ) ) + '}' )
            if ( attributes.length == 0 )
                attributes = ''
            else if ( attributes.length == 1 )
                attributes = ` ${attributes[0]}\n`
            else
                attributes = `\n    ${attributes.join('\n    ')}\n`
            return given + text.replace( /\n\s*\n/g, '\n' ) + attributes
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
            case 'Binding':
                const body = childResults.pop()
                return finalize( `(${childResults.join( ' ' )} , ${body})` )
            case 'Declaration':
                const Declaration = MathConcept.subclasses.get( 'Declaration' )
                const type = this.type() == Declaration.Variable ?
                    'var' : 'const'
                if ( this.expression() ) {
                    const body = childResults.pop()
                    return finalize(
                        `[${childResults.join( ' ' )} ${type} ${body}]`,
                        [ 'declaration type' ] )
                } else {
                    return finalize( `[${childResults.join( ' ' )} ${type}]`,
                        [ 'declaration type' ] )
                }
            case 'Environment':
                const envInside = childResults.join( ' ' )
                return finalize( envInside == '' ? '{ }' :
                             isTooBig( envInside ) ?
                             `{\n${indent(childResults.join( '\n' ))}\n}` :
                             `{ ${envInside} }` )
            case 'Formula':
                const forInside = childResults.join( ' ' )
                return finalize( forInside == '' ? '{* *}' :
                             isTooBig( forInside ) ?
                             `{*\n${indent(childResults.join( '\n' ))}\n*}` :
                             `{* ${forInside} *}` )
            default:
                throw 'Cannot convert this class to putdown: '
                    + this.constructor.className
        }
    }

}
