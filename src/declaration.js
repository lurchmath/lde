
import { MathConcept } from './math-concept.js'
import { LogicConcept } from './logic-concept.js'
import { Symbol as LurchSymbol } from './symbol.js'

/**
 * In mathematics, we declare new variables and constants regularly, when we
 * write text such as, "Let $n$ be any integer," or "So let $k$ be the unique
 * value making $f(k)=t-1$ hold."  We call these Declarations.
 * 
 * We do not distinguish different types of declaration (variable, constant,
 * operator, symbol, etc.) but treat all declarations as behaving the same.
 * 
 * Each Declaration instance has a list of symbols being declared (which are
 * instances of the {@link Symbol Symbol} class), and optionally a body that
 * stipulates some fact about the symbols that is being stated by the
 * declaration.  For instance, in the declaration "Let $x\in A$ be arbitrary,"
 * the list of symbols contains just one entry, $x$, and the body is the
 * statement being made about $x$, which is $x\in A$.
 * 
 * Unlike {@link Expression Expressions} and {@link Environment Environments},
 * Declarations do not respect the "given" attribute.  A Declaration marked with
 * such an attribute will not use that attribute in any algorithm, such as when
 * validating the correctness of a deduction, or rendering a text-based form of
 * the Declaration (such as {@link LogicConcept#toPutdown putdown}).
 * 
 * To see how Declarations impact how {@link Symbol Symbols} are processed, see
 * {@link module:Scoping the Scoping module}.
 */
export class Declaration extends LogicConcept {
    
    static className = MathConcept.addSubclass( 'Declaration', Declaration )

    static _emptyBody = null
    static emptyBody = () => {
        if ( !Declaration._emptyBody )
            Declaration._emptyBody = new LurchSymbol( 'LDE empty' )
        return Declaration._emptyBody
    }

    /**
     * Construct a declaration.  The first argument must be either the
     * {@link Symbol Symbol} to be declared or an array of one or more
     * {@link Symbol Symbols} to be declared.  The optional final argument is
     * the body of the declaration.
     * 
     * In mathematics, we often declare symbols with certain conditions, such as
     * "Let $x$ be any real number greater than $N$."  In that sentence, we are
     * declaring a variable $x$ and imposing on it a two-part condition (a
     * conjunction), that $x$ is a real number and it is greater than $N$.  Thus
     * the body of the declaration would be that mathematical expression,
     * $x\in\mathbb{R}\wedge x>N$.  Or it could be formulated as an
     * {@link Environment Environment} with two claims, which are
     * $x\in\mathbb{R}$ and $x>N$.
     * 
     * However, it is also possible to declare symbols with no conditions
     * attached, as in the mathematical statement "Let $x$ be arbitrary."  So
     * the body of a declaration is optional.
     * 
     * The resulting Declaration instance will have as its children list the
     * list of symbols it declares followed by the body, if a body is present.
     * 
     * @param {Symbol|Symbol[]} symbols - Either a single
     *   {@link Symbol Symbol} instance or an array of Symbol instances.  Note
     *   that this must be a Symbol in the sense of the class defined in this
     *   repository, rather than the standard JavaScript Symbol type.  If a
     *   single symbol is passed, it will be treated as an array of just one
     *   symbol.
     * @param {LogicConcept} [body] - An optional body of the declaration, as
     *   described above.  The body may be any
     *   {@link LogicConcept LogicConcept}.  If a declaration comes with several
     *   assumptions about the declared variables, they can be placed inside an
     *   {@link Environment Environment} to conjoin them.
     * 
     * @see {@link Declaration#symbols symbols()}
     * @see {@link Declaration#body body()}
    */
    constructor ( symbols, body ) {
        if ( arguments.length > 2 )
            throw new Error( 'Too many arguments to Declaration constructor: '
                + `expected 2, got ${arguments.length}` )
        if ( symbols instanceof LurchSymbol ) symbols = [ symbols ]
        if ( !( symbols instanceof Array ) )
            throw 'First argument to Declaration constructor must be '
                + 'either a Symbol or an array'
        if ( !symbols.every( symbol => symbol instanceof LurchSymbol ) )
            throw 'Not every entry in the array given to the '
                + 'Declaration constructor was a Symbol'
        if ( body ) {
            if ( !( body instanceof LogicConcept ) )
                throw 'Optional second parameter to Declaration constructor, '
                    + 'if provided, must be a LogicConcept'
        } else {
            body = Declaration.emptyBody().copy()
        }
        super( ...symbols, body )
    }

    /**
     * We override here the {@link LogicConcept#copy default copy() method}
     * for {@link LogicConcept LogicConcepts} because that method assumes that
     * the arguments the constructor requires are the
     * {@link LogicConcept LogicConcept}'s children.  But in this case, we
     * may need to collect several children into an array, passed as the first
     * parameter.
     * 
     * @returns {Declaration} a structural copy of this object
     * 
     * @see {@link LogicConcept#copy copy()}
     * @see {@link LogicConcept#equals equals()}
     */
    copy () {
        const result = new Declaration(
            this.symbols().map( symbol => symbol.copy() ),
            this.body() ? this.body().copy() : undefined
        )
        result._attributes = this._attributes.deepCopy()
        return result
    }

    /**
     * Return the array of {@link Symbol Symbols} provided to this object at
     * construction time.  This will be of length at least one, since the
     * constructor requires there to be at least one symbol.  The only
     * exception to this rule is that Declarations, once constructed, can be
     * modified by removing their children, so one could theoretically remove
     * all symbols from a Declaration, putting it into an invalid form, so
     * clients of this class should not do so.
     * 
     * @returns {Symbol[]} An array of {@link Symbol Symbol} instances, those
     *   symbols being declared by this object
     * 
     * @see {@link Declaration#body body()}
     */
    symbols () {
        return this.allButLastChild()
    }

    /**
     * Returns the body of this declaration.  For an explanation of the
     * meaning of a declaration body, see
     * {@link Declaration the documentation for the constructor}.
     *
     * In those cases where the Declaration has a body, it will also be the
     * Declaration's last child.  Declarations that were not constructed with a
     * body will have a simple placeholder object as their last child, a symbol
     * indicating where the body would go if there were one.  For such
     * Declarations, this function returns undefined.
     * 
     * @returns {LogicConcept|undefined} The body provided to this object at
     *   construction time, if there was one, or undefined if not.
     *   If there was one, it is guaranteed to be an instance of the
     *   {@link LogicConcept LogicConcept} class.
     *
     * @see {@link Declaration#symbols symbols()}
     * @see {@link Declaration#replaceBody replaceBody()}
     */
    body () {
        const last = this.lastChild()
        return last.equals( Declaration.emptyBody() ) ? undefined : last
    }

    /**
     * Remove the body of this Declaration, if there is one, replacing it with
     * a placeholder indicating that the Declaration now has no body.
     * Thereafter, calling {@link Declaration#body body()} will return
     * undefined.
     * 
     * @see {@link Declaration#body body()}
     * @see {@link Declaration#setBody setBody()}
     */
    removeBody () {
        this.setBody( Declaration.emptyBody().copy() )
    }

    /**
     * Set a new body for this Declaration, replacing any old body that it had
     * before (or, if it had none, replacing the placeholder that sits where a
     * body would go).  Thereafter, calling {@link Declaration#body body()} will
     * return the new body provided to this function.
     * 
     * @see {@link Declaration#body body()}
     * @see {@link Declaration#removeBody removeBody()}
     */
    setBody ( newBody ) {
        this.lastChild().replaceWith( newBody )
    }

}
