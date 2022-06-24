
/**
 * Many mathematical expressions include "dummy variables," also called "bound
 * variables."  For example, $\sum_{i=1}^n a_i$ uses $i$ as a "dummy" or "bound"
 * variable.  Similarly, $\int x^2\;dx$ has $x$ as a bound varibale.  There are
 * many other examples, including (but not limited to) the following.
 * 
 *  * indexed sums, products, unions, and intersections throughout mathematics
 *  * set-builder notation, e.g., $\left\\{ x+y \mid 0 < x < y \right\\}$
 *  * existentially and universally quantified expressions, such as
 *    $\forall x > 0, ~|x|=x$.
 *  * $\lambda$ expressions from computer science, as in $\lambda x.x$
 * 
 * We say that such expressions "bind" the dummy/bound variable, and we have two
 * types of them in Lurch: {@link BindingExpression BindingExpressions} and
 * {@link BindingEnvironment BindingEnvironments}.  In order to factor the
 * common attributes out of those two classes, we implement the notion of
 * binding as what some languages call an "interface," here.  We place it in the
 * {@link BindingInterface BindingInterface} namespace, and it can be added to
 * any class by calling the {@link BindingInterface.addTo addTo()} function.
 * 
 * Each of the example types of expressions given above include not only a body
 * in which a variable is bound, but also an operator applied to that body.  For
 * example, in $\bigcup_i A_i$, we not only have the body $A_i$ in which $i$ is
 * bound, but we are also applying the union operator to that body.  However, we
 * do not include the operator in the binding itself, because not all cases use
 * an operator; in particular, {@link BindingEnvironment BindingEnvironments} do
 * not have an operator.
 * 
 * Consequently, when encoding something like $\bigcup_i A_i$, we would encode
 * the $A_i$ as the body of a {@link BindingExpression BindingExpression} with a
 * bound variable list of length 1, containing just $i$, and then wrap that
 * {@link BindingExpression BindingExpression} in an
 * {@link Application Application} of the $\cup$ {@link Symbol Symbol}.  One
 * might construct it with code like the following example (though this is not
 * the only possible way to encode such an idea).
 * 
 * ```js
 * new Application(
 *     new LurchSymbol( '⋃' ),
 *     new BindingExpression(
 *         new LurchSymbol( 'i' ),
 *         new Application(
 *             new LurchSymbol( 'subscript' ),
 *             new LurchSymbol( 'A' ),
 *             new LurchSymbol( 'i' )
 *         )
 *     )
 * )
 * ```
 * 
 * Bindings were inspired by a structure of the same name defined in
 * {@link https://openmath.org/about/ the OpenMath Standard}, but the reader
 * is not expected to read that standard; we define in this documentation our
 * version of what a binding is, both for {@link Expression Expressions} and
 * {@link Environment Environments}.
 * 
 * A binding is defined by a sequence of $n$ children satisfying the following
 * requirements.  Most functions in this interface depend upon these
 * requirements being satisfied in order for the functions to work correctly.
 * Constructors for classes implementing this interface should check to ensure
 * that these requirements are satisfied at construction time, and provide
 * documentation stating that clients should not violate these requirements with
 * tree manipulation later.
 * 
 *  * The first $n-1$ children will be the sequence of bound variables.  There
 *    must be at least one bound variable, so we have that $n>1$.  Each bound
 *    variable must be a {@link Symbol Symbol}.  You can use
 *    {@link BindingInterface.allAreSymbols allAreSymbols()} to help verify the
 *    requirement.
 *  * The last child is called the {@link BindingInterface.body body()}.  This
 *    is what "sits inside" the binding, such as the integrand in an integral,
 *    the summand in a summation, the inner statement in a quantification, etc.
 *    Although it is most commonly an {@link Expression Expression}, it does not
 *    have to be; a binding with an {@link Expression Expression} body is a
 *    {@link BindingExpression BindingExpression} and a binding with an
 *    {@link Environment Environment} body is a
 *    {@link BindingEnvironment BindingEnvironment}.  Binding environments are
 *    typically subproofs that begin with the declaration of one or more
 *    arbitrary variables, which act as bound within that subproof.
 * 
 * The API provided in this namespace can be added to any class by calling the
 * {@link BindingInterface.addTo addTo()} function on the class's prototype.
 * Then all the functions documented below will be available in members of that
 * class.
 * 
 * @namespace BindingInterface
 */

import { Symbol as LurchSymbol } from './symbol.js'

/**
 * As documented at the top of this page, the body of a binding is the last
 * child of the {@link MathConcept MathConcept}, which will either be an
 * {@link Expression Expression} or {@link Environment Environment}, depending
 * on the type of binding.  This function returns that body.
 * 
 * @returns {MathConcept} the body of this binding
 *
 * @memberof BindingInterface
 * @alias BindingInterface.body
 * 
 * @see {@link BindingInterface.boundSymbols boundSymbols()}
 */
export const body = function () { return this.lastChild() }

/**
 * As documented at the top of this page, the bound symbols in a binding are all
 * the children except the last, and they should be all instances of the
 * {@link Symbol Symbol} class.  This function returns those children in an
 * array, in the same order they appear as children of this object.  The actual
 * children are returned, not copies, and they are {@link Symbol Symbol}
 * instances, not just their names as strings.
 * 
 * Just in case the client has manipulated this object since construction time,
 * thus causing one of its initial children to be something other than a
 * {@link Symbol Symbol}, this function filters its return list to include only
 * instances of the {@link Symbol Symbol} class.  Note that this routine does
 * not need to provide any guarantees in such a case, because the client has
 * invalidated its structure as a binding.  However, in such a case, for a
 * {@link MathConcept MathConcept} with $n$ children, this function may return
 * fewer than $n-1$ results.
 * 
 * @returns {Symbol[]} an array of {@link Symbol Symbols} bound by this
 *   binding, in the order they appear as the children of this
 *   {@link MathConcept MathConcept}
 *
 * @memberof BindingInterface
 * @alias BindingInterface.boundSymbols
 * 
 * @see {@link BindingInterface.boundSymbols boundSymbols()}
 * @see {@link BindingInterface.boundSymbolNames boundSymbolNames()}
 */
export const boundSymbols = function () {
    return this.allButLastChild()
               .filter( child => child instanceof LurchSymbol )
}

/**
 * This function behaves exactly like {@link BindingInterface.boundSymbols
 * boundSymbols()}, but instead of returning actual {@link Symbol Symbol}
 * instances, it returns only their names, as strings, in the same order.
 * 
 * @returns {string[]} an array of the names of the symbols bound by this
 *   binding, in the order they appear as the children of this
 *   {@link MathConcept MathConcept}
 *
 * @memberof BindingInterface
 * @alias BindingInterface.boundSymbolNames
 * 
 * @see {@link BindingInterface.boundSymbols boundSymbols()}
 */
export const boundSymbolNames = function () {
    return this.boundSymbols().map( symbol => symbol.text() )
}

/**
 * Does this binding bind a specific symbol?  You can provide the symbol to this
 * function (in any of the formats documented below) and this function will do a
 * search and return true if it finds such a symbol among this binding's bound
 * symbols, and false if not.
 * 
 * If the parameter is omitted, then this function simply returns the constant
 * true, indicating that it is a binding type of
 * {@link MathConcept MathConcept}, that is, it has the capacity to bind
 * {@link Symbol Symbols}.
 * 
 * @param {Symbol|string|any} [symbol] - the symbol to search for, either as an
 *   instance of class {@link Symbol Symbol}, or as a string containing just the
 *   symbol's name, or as any other type of data that will be converted to a
 *   string and treated as the name to search for; this parameter can be omitted
 *   to test whether this {@link MathConcept MathConcet} is a binding.
 * @returns {boolean} whether this binding binds a {@link Symbol Symbol}
 *   matching the parameter
 *
 * @memberof BindingInterface
 * @alias BindingInterface.binds
 */
export const binds = function ( symbol ) {
    if ( typeof( symbol ) == 'undefined' ) return true
    const name = symbol instanceof LurchSymbol ? symbol.text() : `${symbol}`
    return this.boundSymbols().some( bound => bound.text() == name )
}

/**
 * Document function here
 * 
 * @returns {type} foo bar baz
 *
 * @memberof BindingInterface
 * @alias BindingInterface.allAreSymbols
 */
export const allAreSymbols = array =>
    array.every( element => element instanceof LurchSymbol )

/**
 * Document function here
 * 
 * @returns {type} foo bar baz
 *
 * @memberof BindingInterface
 * @alias BindingInterface.addTo
 */
export const addTo = prototype => {
    prototype.body = body
    prototype.boundSymbols = boundSymbols
    prototype.boundSymbolNames = boundSymbolNames
    prototype.binds = binds
}

export default { allAreSymbols, addTo }
