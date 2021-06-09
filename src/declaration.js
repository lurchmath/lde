
import { MathConcept } from './math-concept.js'
import { LogicConcept } from './logic-concept.js'
import { Symbol as LurchSymbol } from './symbol.js'
import { Expression } from './expression.js'
import { Environment } from './environment.js'
import { Formula } from './formula.js'

/**
 * In mathematics, we declare new variables and constants regularly, when we
 * write text such as, "Let $n$ be any integer," or "So let $k$ be the unique
 * value making $f(k)=t-1$ hold."  We call these Declarations.
 * 
 * They come in two types:
 * 
 *  * A variable declaration is the kind where the declared symbols are to be
 *    used as variables, typically at the beginning of a subproof that will
 *    justify a universal statement.  For instance, "Let $x\in A$ be
 *    arbitrary."
 *  * A constant declaration is the kind where the declared symbols are not
 *    intended to vary in meaning throughout the subsequent discussion.  These
 *    symbols are often global in scope and are typically inappropriate for
 *    use in quantifiers.  For instance, the declaration of the symbol 0 in
 *    the Peano axioms is a constant declaration.
 * 
 * Each Declaration instance has a type (variable or constant), a list of
 * symbols being declared (which are instances of the {@link Symbol Symbol}
 * class), and optionally a body that stipulates some fact about the symbols
 * that is being stated by the declaration.  For instance, in the declaration
 * "Let $x\in A$ be arbitrary," the type is a variable declaration, the list
 * of symbols contains just one entry, $x$, and the body is the statement
 * $x\in A$ being made about $x$.
 * 
 * The body of a declaration can be any LogicConcept that does not include
 * (at any level of depth) a {@link Formula Formula} or another Declaration.
 */
export class Declaration extends LogicConcept {
    
    static className = MathConcept.addSubclass( 'Declaration', Declaration )

    /**
     * A class-level constant that functions like an enum.
     * When constructing a Declaration, pass as the first argument either
     * this value or {@link Declaration.Constant the Constant type} instead.
     * 
     * Passing this as the declaration type indicates that the constructed
     * Declaration declares one or more variables, rather than one or more
     * constants.
     * 
     * Example: `new Declaration( Declaration.Variable, x )`
     */
    static Variable = Symbol.for( 'Variable' )
    /**
     * A class-level constant that functions like an enum.
     * When constructing a Declaration, pass as the first argument either
     * this value or {@link Declaration.Variable the Variable type} instead.
     * 
     * Passing this as the declaration type indicates that the constructed
     * Declaration declares one or more constants, rather than one or more
     * variables.
     * 
     * Example: `new Declaration( Declaration.Constant, pi )`
     */
    static Constant = Symbol.for( 'Constant' )
    /**
     * An array containing all valid options for the first parameter to the
     * Declaration constructor, collecting all the constants in the
     * makeshift enum, including:
     * 
     *  * {@link Declaration.Variable Variable}
     *  * {@link Declaration.Constant Constant}
     */
    static Types = [
        Declaration.Variable,
        Declaration.Constant
    ]

    /**
     * Construct a variable or constant declaration.  You must provide a flag
     * as the first argument indicating the type of declaration
     * ({@link Declaration.Variable variable} or
     * {@link Declaration.Constant constant}), and then the second argument
     * must be either the {@link Symbol Symbol} to be declared or an array of
     * one or more {@link Symbol Symbols} to be declared.  The optional final
     * argument is the body of the declaration.
     * 
     * In mathematics, we often declare variables or constants with certain
     * conditions, such as "Let $x$ be any real number greater than $N$."  In
     * that sentence, we are declaring a variable $x$ and imposing on it a
     * two-part condition (a conjunction), that $x$ is a real number and it is
     * greater than $N$.  Thus the body of the declaration would be that
     * mathematical expression, $x\in\mathbb{R}\wedge x>N$.
     * 
     * However, it is also possible to declare variables with no conditions
     * attached, as in the mathematical statement "Let $x$ be arbitrary."  So
     * the body of a declaration is optional.
     * 
     * The resulting Declaration instance will have as its children list the
     * list of symbols it declares followed by the body, if a body is present.
     * 
     * @param {Symbol} type - Must be one of the valid types listed in the
     *   array {@link Declaration.Types Declaration.Types}, indicating whether
     *   this declaration is intended to declare variables or constants.  Note
     *   that this must be a JavaScript `Symbol` instance, not an instance of
     *   the {@link Symbol Symbol} class defined in this repository.  See
     *   {@link Declaration.Variable Variable} and
     *   {@link Declaration.Constant Constant} for example calls to this
     *   constructor using those values.
     * @param {Symbol|Symbol[]} symbols - Either a single
     *   {@link Symbol Symbol} instance or an array of Symbol instances.  Note
     *   that this must be a Symbol in the sense of the class defined in this
     *   repository, rather than the standard JavaScript Symbol type.  If a
     *   single symbol is passed, it will be treated as an array of just one
     *   symbol.
     * @param {LogicConcept} [body] - An optional body of the declaration, as
     *   described above.  The body may be any
     *   {@link Expression Expression}, or any {@link Environment Environment}
     *   that does not contain a {@link Formula Formula} or another
     *   {@link Declaration Declaration}.  If a declaration comes with several
     *   assumptions about the declared variables, they can be placed inside
     *   an {@link Environment Environment} to conjoin them.
     * @see {@link Declaration#type type()}
     * @see {@link Declaration#symbols symbols()}
     * @see {@link Declaration#expression expression()}
    */
    constructor ( type, symbols, body ) {
        if ( arguments.length > 3 )
            throw 'Too many arguments to Declaration constructor: '
                + `expected 3, got ${arguments.length}`
        if ( !Declaration.Types.includes( type ) )
            throw `Invalid declaration type: ${String(type)}`
        if ( symbols instanceof LurchSymbol ) symbols = [ symbols ]
        if ( !( symbols instanceof Array ) )
            throw 'Second argument to Declaration constructor must be '
                + 'either a Symbol or an array'
        if ( !symbols.every( symbol => symbol instanceof LurchSymbol ) )
            throw 'Not every entry in the array given to the '
                + 'Declaration constructor was a Symbol'
        if ( body ) {
            if ( !( body instanceof Expression )
              && !( body instanceof Environment ) )
                throw 'Optional third parameter to Declaration constructor, '
                    + 'if provided, must be an Expression or Environment'
            if ( body instanceof Environment && body.hasDescendantSatisfying(
                    d => d instanceof Formula || d instanceof Declaration ) )
                throw 'Body of a Declaration may contain neither a Formula '
                    + 'nor another Declaration'
            super( ...symbols, body )
        } else {
            super( ...symbols )
        }
        this._body = body
        this.setAttribute( 'declaration type', Symbol.keyFor( type ) )
    }

    /**
     * We override here the {@link LogicConcept#copy default copy() method}
     * for {@link LogicConcept LogicConcepts} because that method assumes that
     * the arguments the constructor requires are the
     * {@link LogicConcept LogicConcept}'s children.  But in this case, we
     * have an extra first parameter for the Declaration type.
     * 
     * @returns {Declaration} a structural copy of this object
     * @see {@link LogicConcept#copy copy()}
     * @see {@link LogicConcept#equals equals()}
     */
    copy () {
        return new Declaration(
            this.type(),
            this.symbols().map( symbol => symbol.copy() ),
            this.expression() ? this.expression().copy() : undefined
        )
    }

    /**
     * Return the type of declaration, which is the first argument passed to
     * the constructor.  It will be one of the items in
     * {@link Declaration.Types the list of types}.
     * 
     * @returns {Symbol} A JavaScript Symbol (not a Lurch
     *   {@link Symbol Symbol} instance) representing the
     *   {@link Declaration.Types type of declaration}, such as variable or
     *   constant
     * @see {@link Declaration#symbols symbols()}
     * @see {@link Declaration#expression expression()}
     */
    type () { return Symbol.for( this.getAttribute( 'declaration type' ) ) }

    /**
     * Return the array of {@link Symbol Symbols} provided to this object at
     * construction time.  This will be of length at least one, since the
     * constructor requires there to be at least one symbol.  The only
     * exception to this rule is that Declarations, once constructed, can be
     * modified by removing their children, but this creates invalid forms,
     * so clients should not do so.
     * 
     * @returns {Symbol[]} An array of {@link Symbol Symbol} instances, those
     *   symbols being declared by this object
     * @see {@link Declaration#type type()}
     * @see {@link Declaration#expression expression()}
     */
    symbols () {
        return this._body ? this.allButLastChild() : this.children()
    }

    /**
     * Returns the body of this declaration.  For an explanation of the
     * meaning of a declaration body, see
     * {@link Declaration the documentation for the constructor}.
     *
     * In those cases where the Declaration has a body, it will also be the
     * Declaration's last child.  If the body has been deleted by modifying
     * this Declaration after its construction, this function returns
     * undefined.
     * 
     * @returns {Expression|undefined} The body expression provided to this
     *   object at construction time, if there was one, or undefined if not.
     *   If there was one, it is guaranteed to be an instance of the
     *   {@link Expression Expression} class.
     * @see {@link Declaration#type type()}
     * @see {@link Declaration#symbols symbols()}
     */
    expression () {
        return this._body == this.lastChild() ? this._body : undefined
    }

}
