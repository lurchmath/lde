
import { Expression } from './expression.js'
import { Application } from './application.js'
import { Binding } from './binding.js'
import { Symbol } from './symbol.js'
import { setAPI, makeExpressionFunction, makeExpressionFunctionApplication,
    Constraint, ConstraintList, MatchingChallenge
} from '../node_modules/second-order-matching/src/matching-without-om.js'

// The following function call teaches the second-order-matching module
// imported from npm the specific expression API used in this repository.

/**
 * The matching module we [import from npm](https://www.npmjs.com/package/second-order-matching)
 * requires us to specify how it should interact with the mathematical
 * expressions in the client project.  We make a call to the matching module's
 * `setAPI()` function and provide it with all the tools it needs to interface
 * with {@link LogicConcept LogicConcept} instances.  We document in this
 * namespace all those tools.
 * 
 * To use this in other code, import it with code something like
 * `import Matching from '../src/matching.js'` (or whatever path is required
 * based on where you're importing it from).  In the rest of this
 * documentation, we assume you have issued a call like the one above and thus
 * have access to a `Matching` object representing this module.
 * 
 * It will contain the following five members, all from the npm package linked
 * to above.
 * 
 *  * `Matching.Constraint`, used for constructing constraints.  A constraint
 *    is a pair of expressions, the left of which may contain metavariables
 *    and is called the "pattern."  It is a constraint in that we use such
 *    pairs to describe the problems the matching module must solve for us.
 *    The given pattern must be instantiated in some way to equal the given
 *    expression.  To mark a {@link Symbol Symbol} as a metavariable, simply
 *    call `s.makeIntoA( 'metavariable' )`, using the existing
 *    {@link MathConcept.makeIntoA function from MathConcepts}.
 *  * `Matching.ConstraintList`, used to collect multiple constraints into a
 *    list, which has two purposes.  It can be used to pose a matching problem
 *    to the matching module, and it can also be used to report a solution
 *    back from the module to the client.  When reporting a solution, all the
 *    patterns will be atomic metavariables.
 *  * `Matching.makeExpressionFunction`, used to construct expressions whose
 *    meaning is a function that can build other expressions.  For instance,
 *    the expression function $\lambda x.x+3$ can be applied to the expression
 *    $5$ to produce the expression $5+3$.  You would create $\lambda x.x+3$
 *    by calling `Matching.makeExpressionFunction(x,y)`, where `x` contains
 *    the expression $x$ and `y` contains the expression $x+3$.
 *  * `Matching.makeExpressionFunctionApplication`, used to construct
 *    expressions whose meaning is the application of an expression function
 *    to another expression.  This is most often required when writing $P(x)$
 *    inside a rule of inference, as in "from $\forall x,P(x)$ we can conclude
 *    $P(t)$."  To construct the latter of these two expressions, you would
 *    call `Matching.makeExpressionFunctionApplication(P,t)`, where `P` and
 *    `t` are atomic expressions, probably metavariables.
 *  * `Matching.MatchingChallenge`, used to both pose and solve matching
 *    problems.  The code block below shows examples.
 * 
 * ```javascript
 * // Let's say we want to check the rule "from A and B, conclude and(A,B)"
 * // against the instance "from X and or(Y,Z), conclude and(X,or(Y,Z))."
 * 
 * // First, create all the ingredients
 * const A = new Symbol( 'A' ).makeIntoA( 'metavariable' )
 * const B = new Symbol( 'B' ).makeIntoA( 'metavariable' )
 * const AandB = new Application( new Symbol( 'and' ), A.copy(), B.copy() )
 * const X = new Symbol( 'X' )
 * const YorZ = LogicConcept.fromPutdown( '(or Y Z)' )[0]
 * const XandYorZ = LogicConcept.fromPutdown( '(and X (or Y Z))' )[0]
 * 
 * // Next, set up the problem
 * const challenge = new Matching.MatchingChallenge( [ A,     X ],
 *                                                   [ B,     YorZ ],
 *                                                   [ AandB, XandYorZ ] )
 * 
 * // Finally, get the set of solutions
 * const solutions = challenge.getSolutions()
 * 
 * // If solutions.length == 0, the challenge has no solutions.
 * // If solutions.length > 1, the challenge has many solutions.
 * // In this case, solutions.length == 1.
 * const only = solutions[0]
 * // And if we checked, we would find that it was a constraint list
 * // containing the constraints (A,X) and (B,or(Y,Z)) (not necessarily in
 * // that order).
 * // There is a (mostly undocumented) Matching.display function that can
 * // print constraints, constraint lists, and expressions, so we could do:
 * console.log( Matching.display( only ) )
 * // And we would see:  { (A,X), (B,(or Y Z)) }
 * ```
 * 
 * All the functions documented below in this namespace are not for use in the
 * LDE.  Rather, they are created to give the matching module (which is not
 * part of the LDE) the language it needs (in terms of functions that already
 * exist in the LDE) to interface with things like {@link Symbol Symbols},
 * {@link Expression Expressions}, etc.  Thus the rest of this file is just
 * documenting the API we provide to the matching module, not the API for our
 * own use in the LDE.  For that, see the documentation of all the other
 * classes such as {@link Symbol Symbol}, {@link Expression Expression}, etc.
 * 
 * @namespace Matching
 */

setAPI( {

    /**
     * How can the matching module tell what an expression is?
     * In the LDE, it's any instance of the {@link Expression Expression}
     * class.
     * 
     * @memberof Matching
     * @param {*} object - any type of input, to be tested for whether it is
     *   an expression, in the LDE's sense of that term
     * @returns {boolean} whether the input is an expression
     */
    isExpression : object => object instanceof Expression,

    /**
     * How can the matching module get a list of all subexpressions of a given
     * expression that satisfy a certain predicate?  We use the
     * {@link MathConcept#descendantsSatisfying descendantsSatisfying()}
     * function for this purpose.
     * 
     * @memberof Matching
     * @param {Expression} expression - the expression whose descendants should
     *   be searched
     * @param filter - a function that takes {@link Expression Expression}
     *   instances as inputs and yields boolean outputs
     * @returns {Expression[]} a JavaScript array of all descendants satisfying
     *   the given predicate
     */
    filterSubexpressions : ( expression, filter ) =>
        expression.descendantsSatisfying( filter ),
    
    /**
     * How can the matching module tell when two expressions have the same
     * type?  We check to ensure they have the same class (e.g.,
     * {@link Symbol Symbol}, {@link Application Application}, etc.).
     * 
     * @memberof Matching
     * @param {Expression} expression1 - the first expression to compare
     * @param {Expression} expression2 - the second expression to compare
     * @returns {boolean} whether the two expressions have the same type
     */
    sameType : ( expression1, expression2 ) =>
        expression1.constructor.className == expression2.constructor.className,
    
    /**
     * How can the matching module make a deep copy of an expression?
     * The {@link MathConcept MathConcept} class has a built-in
     * {@link MathConcept#copy copy()} function for this purpose.
     * 
     * @memberof Matching
     * @param {Expression} expression - the expression to deep copy
     * @returns {Expression} a deep copy
     */
    copy : expression => expression.copy(),

    /**
     * How can the matching module test two expressions for deep structural
     * equality?  The {@link MathConcept MathConcept} class has a built-in
     * {@link MathConcept#equals equals()} function for this purpose.
     * 
     * @memberof Matching
     * @param {Expression} expression1 - the first expression to compare
     * @param {Expression} expression2 - the second expression to compare
     * @returns {boolean} whether the two expressions are equal as tree
     *   structures
     */
    equal : ( expression1, expression2 ) => expression1.equals( expression2 ),
    
    /**
     * How can the matching module replace any expression in its parent context
     * with another expression?  The {@link MathConcept MathConcept} class has
     * a built-in {@link MathConcept#replaceWith replaceWith()} function for
     * this purpose.
     * 
     * @memberof Matching
     * @param {Expression} toReplace - the expression to replace, in its parent
     *   context, with another expression
     * @param {Expression} withThis - the expression to replace the other with
     */
    replace : ( toReplace, withThis ) => toReplace.replaceWith( withThis ),

    /**
     * How can the matching module tell when an expression is a variable?
     * The LDE does not distinguish constants from variables internally, so we
     * will artificially prefix any {@link Symbol Symbol} that the matching
     * module wants to call a "symbol" with the prefix `"symbol: "` and use
     * that as an indicator.
     * 
     * See {@link Matching.symbol symbol()} further below for details.
     * 
     * @memberof Matching
     * @param {Expression} expression - the expression to test for whether it
     *   is a variable
     * @returns {boolean} whether the expression is a variable
     */
    isVariable : expression => expression instanceof Symbol
                            && !expression.text().startsWith( 'symbol: ' ),
    
    /**
     * Given a variable, how can the matching module fetch its name?
     * The {@link Symbol Symbol} class provides a {@link Symbol#text text()}
     * function for exactly this purpose.
     * 
     * @memberof Matching
     * @param {Expression} expression - the variable whose name we need
     * @returns {string} the name of the variable
     */
    getVariableName : expression => expression.text(),

    /**
     * How can the matching module construct a variable with a given name?
     * We use the {@link Symbol Symbol} class to store both what the matching
     * module calls "variables" and what it calls "symbols," but we store
     * variables with whatever name is requested, whereas we store symbols with
     * the prefix `"symbol: "` in front of their name, to distinguish them from
     * variables.
     * 
     * While there is a small chance that this could cause ambiguity if you
     * have a variable whose name literally begins with the text `"symbol: "`,
     * that event is unlikely in the extreme, and a bad idea anyway.
     * 
     * @memberof Matching
     * @param {string} text - the name to use for the variable being created
     * @returns {Symbol} an instance of the {@link Symbol Symbol} class, the
     *   variable that was created
     */
    variable : text => new Symbol( text ),

    /**
     * How can the matching module construct a variable with a given name?
     * We use the {@link Symbol Symbol} class to store both what the matching
     * module calls "variables" and what it calls "symbols," but we store
     * variables with whatever name is requested, whereas we store symbols with
     * the prefix `"symbol: "` in front of their name, to distinguish them from
     * variables.
     * 
     * While there is a small chance that this could cause ambiguity if you
     * have a variable whose name literally begins with the text `"symbol: "`,
     * that event is unlikely in the extreme, and a bad idea anyway.
     * 
     * @memberof Matching
     * @param {string} text - the name to use for the symbol being created;
     *   this text will be prefixed with `"symbol: "`
     * @returns {Symbol} an instance of the {@link Symbol Symbol} class, the
     *   symbol that was created
     */
    symbol : text => new Symbol( `symbol: ${text}` ),

    /**
     * How can the matching module tell when an expression is the application
     * of a function or operator?  The LDE has a class,
     * {@link Application Application}, for exactly this purpose; we just check
     * to see if the object is an instance of that class.
     * 
     * @memberof Matching
     * @param {Expression} expression - the expression to test for whether it
     *   is an application
     * @returns {boolean} whether the expression is an application
     */
    isApplication : expression => expression instanceof Application,

    /**
     * How can the matching module construct a function application with a
     * given set of expressions to use as children?  (By convention, the first
     * is the operator/function being applied, and the rest are its arguments,
     * in order.)  We simply call the {@link Application Application}
     * constructor.
     * 
     * Note that all children provided in the first argument will be deep
     * copied, because the matching module expects and relies upon that
     * behavior.  It is not possible, using this function, to move/share
     * subexpressions between expressions.
     * 
     * @memberof Matching
     * @param {Expression[]} children - a JavaScript array of the child
     *   expressions, in the order described above
     * @returns {Application} an instance of the
     *   {@link Application Application} class, which this function creates
     */
    application : children =>
        new Application( ...children.map( c => c.copy() ) ),

    /**
     * How can the matching module query the list of children expression of a
     * given expression?  The {@link MathConcept MathConcept} class provides
     * the {@link MathConcept#children children()} function for this purpose.
     * 
     * A few notes about it:
     * 
     *  * An {@link Application Application}'s children are returned in the
     *    order explained {@link Matching.application here}.
     *  * A {@link Binding Binding}'s children are its head, then its list of
     *    bound variables ({@link Symbol Symbol} instances), in order, then its
     *    body.
     *  * An atomic expression will have an empty children list.
     * 
     * @memberof Matching
     * @param {Expression} expression - the expression whose children are
     *   being requested
     * @returns {Expression[]} the JavaScript array of all children of this
     *   expression
     */
    getChildren : expression => expression.children(),

    /**
     * How can the matching module tell when an expression is a binding
     * expression?  The LDE has a class, {@link Binding Binding}, for exactly
     * this purpose; we just check to see if the object is an instance of that
     * class.
     * 
     * @memberof Matching
     * @param {Expression} expression - the expression to test for whether it
     *   is a binding
     * @returns {boolean} whether the expression is a binding
     */
    isBinding : expression => expression instanceof Binding,

    /**
     * How can the matching module construct a binding expression with a
     * given head, variable list, and body?  We simply call the
     * {@link Binding Binding} constructor.
     * 
     * Note that all children provided in the arguments will be deep copied,
     * because the matching module expects and relies upon that behavior.  It
     * is not possible, using this function, to move/share subexpressions
     * between expressions.
     * 
     * @memberof Matching
     * @param {Expression} symbol - the head of the binding, which is often a
     *   symbol, but can also be a compound expression
     * @param {Symbol[]} variables - a JavaScript array of the variables to be
     *   bound by the expression created (or one single variable that will be
     *   placed into an array)
     * @param {Expression} body - the body of the new binding to be created
     * @returns {Binding} an instance of the {@link Binding Binding} class,
     *   which this function creates
     */
    binding : ( symbol, variables, body ) => new Binding(
        symbol.copy(), ...variables.map( v => v.copy() ), body.copy() ),

    /**
     * How can the matching module query the head symbol or expression in a
     * binding expression?  We give it access to the built-in
     * {@link Binding#head head()} function in the {@link Binding Binding}
     * class.
     * 
     * @memberof Matching
     * @param {Binding} binding - the binding expression whose head is to be
     *   retrieved
     * @returns {Expression} the head of the given binding expression, which is
     *   often a {@link Symbol Symbol} instance, but may be a compound
     *   expression
     */
    bindingHead : binding => binding.head(),

    /**
     * How can the matching module query the list of bound variables in a
     * binding expression?  We give it access to the built-in
     * {@link Binding#boundVariables boundVariables()} function in the
     * {@link Binding Binding} class.  Note that these are the actual
     * {@link Symbol Symbol} instances, not their names.
     * 
     * @memberof Matching
     * @param {Binding} binding - the binding expression whose list of bound
     *   variables is to be retrieved
     * @returns {Symbol[]} the bound variables in the binding expression
     *   (the actual instances, not copies, and not just the names as text)
     */
    bindingVariables : binding => binding.boundVariables(),

    /**
     * How can the matching module query the body of a binding expression?
     * We give it access to the built-in {@link Binding#body body()} function
     * in the {@link Binding Binding} class.
     * 
     * @memberof Matching
     * @param {Binding} binding - the binding expression whose body is to be
     *   retrieved
     * @returns {Expression} the body of the given binding expression
     */
    bindingBody : binding => binding.body(),

    /**
     * How can the matching module tell whether a particular instance of a
     * variable is free in a given ancestor expression?  We give it access to
     * the built-in {@link MathConcept#isFree isFree()} function in the
     * {@link MathConcept MathConcept} class.
     * 
     * @memberof Matching
     * @param {Symbol} variable - the variable to test for freeness; note that
     *   this is an actual {@link Symbol Symbol} instance whose ancestor
     *   context is relevant to this function, not just the name or another
     *   copy of the same variable
     * @param {Expression} [expression] - optional ancestor context in which to
     *   test for freeness; if this is provided, only bindings within this
     *   ancestor are relevant, but if it is omitted, all ancestor bindings are
     *   relevant
     * @returns {boolean} whether the given variable is free in the given
     *   ancestor expression (or its topmost ancestor if no ancestor expression
     *   is provided)
     */
    variableIsFree : ( variable, expression ) => variable.isFree( expression ),

    /**
     * How can the matching module mark a given variable as a metavariable?  We
     * leverage the built-in {@link MathConcept#makeIntoA makeIntoA()} function
     * in the {@link MathConcept MathConcept} class.
     * 
     * @memberof Matching
     * @param {Symbol} variable - the variable to mark as a metavariable
     * @see {@link Matching.isMetavariable isMetavariable}
     * @see {@link Matching.clearMetavariable clearMetavariable}
     */
    setMetavariable : variable => variable.makeIntoA( 'metavariable' ),

    /**
     * How can the matching module check whether a given variable has been
     * marked as a metavariable?  We leverage the built-in
     * {@link MathConcept#isA isA()} function in the
     * {@link MathConcept MathConcept} class.
     * 
     * @memberof Matching
     * @param {Symbol} variable - the variable to check for whether it is a
     *   metavariable
     * @see {@link Matching.setMetavariable setMetavariable}
     * @see {@link Matching.clearMetavariable clearMetavariable}
     */
    isMetavariable : variable => variable.isA( 'metavariable' ),

    /**
     * How can the matching module unmark a given variable as a metavariable?
     * We leverage the built-in {@link MathConcept#unmakeIntoA unmakeIntoA()}
     * function in the {@link MathConcept MathConcept} class.
     * 
     * @memberof Matching
     * @param {Symbol} variable - the variable to unmark as a metavariable
     * @see {@link Matching.setMetavariable setMetavariable}
     * @see {@link Matching.isMetavariable isMetavariable}
     */
    clearMetavariable : variable => variable.unmakeIntoA( 'metavariable' )

} )

export const display = matchingData => {
    if ( matchingData instanceof Constraint )
        return ( '(' + matchingData.pattern.toPutdown()
              + ', ' + matchingData.expression.toPutdown() + ')' )
            .replace( / \+\{"_type_metavariable":true\}\n/g, '' )
    if ( matchingData instanceof ConstraintList )
        return '{ ' + matchingData.contents.map( display ).join( ', ' ) + ' }'
    if ( matchingData instanceof Array
      && matchingData.every( entry => entry instanceof ConstraintList ) )
        return matchingData.length == 0 ? 'No solutions' :
            matchingData.map( ( entry, index ) =>
                `${index}. ${display( entry )}` ).join( '\n' )
    return String( matchingData )
}

export {
    Constraint,
    ConstraintList,
    makeExpressionFunction,
    makeExpressionFunctionApplication,
    MatchingChallenge
}
