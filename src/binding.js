
import { MathConcept } from './math-concept.js'
import { Expression } from './expression.js'
import { Symbol } from './symbol.js'

/**
 * Many mathematical expressions include "dummy variables," also called "bound
 * variables."  For example, a summation from `i=1` to `n` uses `i` as a
 * "dummy" or "bound" variable.  An integral ending in "dx" has x as a bound
 * variable.  There are many other examples, including (but not limited to)
 * the following.
 * 
 *  * indexed sums, products, unions, and intersections throughout mathematics
 *  * for set-builder notation like `{ x+y | 0 < x < y }`
 *  * existentially and universally quantified expressions, such as
 *    "for all x > 0, |x|=x."
 *  * lambda functions from computer science
 * 
 * We say that such expressions "bind" the dummy/bound variable, and we
 * therefore call such expressions Bindings, and implement them in this class.
 * 
 * These were inspired by a structure of the same name defined in
 * {@link https://openmath.org/about/ the OpenMath Standard}, but the reader
 * is not expected to read that standard; we define in this documentation our
 * version of what a Binding is.
 * 
 * A Binding is defined by a sequence of children, each of which is an
 * {@link Expression}.  These children must meet specific requirements, given
 * below.
 * 
 *  * The first child will be the operator or quantifier that binds the
 *    variable(s).  (Note that a single operator can bind multiple variables,
 *    such as when we say "for all x, y, and z in Q...")  This first child is
 *    often called the "head."
 *  * Following that operator will be the sequence of bound variables, all as
 *    siblings of the operator, that is, children of the Binding.
 *  * Following the bound variables will be exactly one final expression, the
 *    "body."  This is what "sits inside" the operator, such as the integrand
 *    in an integral, the summand in a summation, the inner statement in a
 *    quantification, etc.
 * 
 * Consequently, a Binding will always have at least three children, because
 * the head is required, at least one bound variable is required, and the body
 * is required.  THe bound variables must all be {@link Symbol Symbols}.  The
 * constructor defined below enforces this.
 * 
 * The head may be a single symbol (such as the universal quantifier) or it
 * may be a compound expression (such as an integral with lower and upper
 * limits, or a summation with lower and upper limits, or a union with an
 * index set over which the union is to be taken, etc.).
 * 
 * This head {@link Expression} is not technically inside the scope of the
 * Binding.  By this, we mean that any instance of the bound variables that
 * appears in the head technically sits outside the Binding.  Although this
 * would be extremely confusing notation, and thus is almost never relevant,
 * one can imagine nested summations that both use the index `i`, where the
 * bounds on the inner sum are written to include the `i` from the outer sum.
 * There is a natural and sensible interpretation of such notation, even
 * though we never use it in practice, because it is needlessly confusing.
 */
export class Binding extends Expression {
    
    static className = MathConcept.addSubclass( 'Binding', Binding )

    /**
     * Construct a new Binding instance from the given head (requried
     * {@link Expression}), list of bound variables (one or more
     * {@link Symbol Symbols}), and body (required {@link Expression}).  For
     * example, to construct "for all x, -1 < x^2", you might do something
     * like the following.  Let us assume that `forAll` is the universal
     * quantifier (perhaps defined as a {@link Symbol}), `x` is the
     * {@link Symbol} `x`, and we have symbols `lessThan` and `power`.
     * 
     * ```
     * new Binding( forAll, x,
     *     new Application( lessThan, Symbol( -1 ),
     *         new Application( power, x, Symbol( 2 ) ) ) )
     * ```
     * 
     * To construct the summation from `i=1` to `n` of `i^2`, we might do
     * something like the following, assuming {@link Symbol Symbols} `i`,
     * `n`, and `Sum`.  This might be read as "the sum from 1 to `n`, using
     * bound variable `i`, of the formula `i^2`."
     * 
     * ```
     * new Binding(
     *     new Application( Sum, Symbol( 1 ), n ),
     *     i,
     *     new Application( power, i, Symbol( 2 ) )
     * )
     * ```
     * 
     * Note that while it is possible later to remove children from a Binding
     * so that it does not have the required structure of head-variables-body,
     * this is likely to result in the members of this class malfunctioning or
     * throwing errors.  Clients should not remove the necessary children of a
     * Binding; that is not supported.
     * 
     * Although it is nonsensical to repeat the same variable twice on the
     * list of bound variables, we do not explicitly forbid it.
     * 
     * @param {Expression} head - The operator or quantifier that is being
     *   used to bind variables in the context of the body expression.  This
     *   argument is required, and must be an {@link Expression}.
     * @param  {...Symbol} boundVars - The list of one or more variables that
     *   this expression binds.  Any nonempty sequence of
     *   {@link Symbol Symbols} is permitted; we make no distinction here
     *   between what mathematicians often call variables vs. constants.
     * @param {Expression} body - The interior of the Binding, whose meaning
     *   varies based on the `head`.  In a summation, this is the summand;
     *   in an integral, it is the integrand; etc.
     * @throws This constructor throws an error if the first or last argument
     *   (which will be interpreted as the head and body, respectively) are
     *   not both {@link Expression Expressions}, or if any of the arguments
     *   in between (the bound variables) are not {@link Symbol Symbols}, or
     *   if the list of bound variables is empty.
     */
    constructor ( ...args ) {
        const head = args.shift()
        const body = args.pop()
        const boundVars = args
        if ( !( head instanceof Expression ) )
            throw new Error( 'The head in a Binding constructor '
                           + 'must be an Expression instance' )
        if ( !( body instanceof Expression ) )
            throw new Error( 'The body in a Binding constructor '
                            + 'must be an Expression instance' )
        if ( boundVars.length === 0 )
            throw new Error( 'A Binding constructor requires at least one '
                           + 'bound variable' )
        if ( !boundVars.every( v => v instanceof Symbol ) )
            throw new Error( 'Every bound variable given to a Binding '
                           + 'constructor must be a Symbol instance' )
        super( head, ...boundVars, body )
    }

    /**
     * Bindings store their head, bound variables, and body as children, in
     * that order.  Thus this function returns the first child of this object,
     * when considering it as an {@link Expression} (or more generally as a
     * {@link MathConcept}).
     * 
     * If the children have not been manipulated since construction of the
     * object, then this is the original head given at construction time.
     * If a new first child has been inserted since then, or the old first
     * child removed, the new first child is assumed to be the head.
     * 
     * @returns {Expression} the head that represents what type of Binding
     *   structure this object is (e.g., quantifier, summation, etc.)
     * @see {@link Binding#boundVariables boundVariables()}
     * @see {@link Binding#body body()}
     * @see {@link MathConcept#firstChild firstChild()}
     */
    head () { return this.firstChild() }

    /**
     * Bindings store their head, bound variables, and body as children, in
     * that order.  Thus this function returns the last child of this object,
     * when considering it as an {@link Expression} (or more generally as a
     * {@link MathConcept}).
     * 
     * If the children have not been manipulated since construction of the
     * object, then this is the original body given at construction time.
     * If a new last child has been added since then, or the old last child
     * removed, the new last child is assumed to be the body.
     * 
     * @returns {Expression} the body enclosed by this Binding expression
     *   (e.g., the summand in a summation, etc.)
     * @see {@link Binding#head head()}
     * @see {@link Binding#boundVariables boundVariables()}
     * @see {@link MathConcept#lastChild lastChild()}
     */
    body () { return this.lastChild() }

    /**
     * Bindings store their head, bound variables, and body as children, in
     * that order.  Thus this function returns the list of children of this
     * object, when considering it as an {@link Expression} (or more generally
     * as a {@link MathConcept}), but excluding the first and last child.
     * 
     * If the children have not been manipulated since construction of the
     * object, then this is the original list of bound variables given at
     * construction time.  If they have been manipulated, then the new list of
     * children, excluding the first and last, are assumed to be the list of
     * bound variables.
     * 
     * @returns {...Symbol} the list of variables bound by this Binding
     * @see {@link Binding#head head()}
     * @see {@link Binding#body body()}
     * @see {@link MathConcept#children children()}
     */
    boundVariables () { return this.children().slice( 1, -1 ) }

    /**
     * While the {@link Binding#boundVariables boundVariables()} method
     * returns actual {@link Symbol} instances, this method converts each to
     * its text name by calling the {@link Symbol#text text()} method in each,
     * in order, and returning the results of those calls instead.  Obiously
     * the client could do this on their own, but this is a convenience method
     * that improves code readability.
     * 
     * @returns {...String} an Array of strings, the names of the bound
     *   variables in this binding, in the same order that they appear in the
     *   binding
     */
    boundVariableNames () {
        return this.boundVariables().map( v =>
            v instanceof Symbol ? v.text() : undefined )
    }

    /**
     * Test whether this Binding binds a variable with a given name.
     * 
     * @param {any} symbol - the symbol to test whether it's bound; this can
     *   be a string containing the variable name, or a {@link Symbol}
     *   instance (which will be converted to its {@link Symbol#text text()}),
     *   or anything else, which will be converted to a string
     * @returns {boolean} whether this Binding instance binds a variable with
     *   the given name
     */
    binds ( symbol ) {
        if ( symbol instanceof Symbol ) symbol = symbol.text()
        return this.boundVariableNames().includes( String( symbol ) )
    }

}
