
/**
 * @file Defines functions for working with expression functions and their
 *   applications
 * 
 * Let $\mathcal{L}$ be the set of expressions in a language.  Here, we will
 * think of $\mathcal{L}$ as all possible {@link Expression Expressions}, in
 * the technical sense of that word (not just saying "expression" informally,
 * but now referring to instances of the {@link Expression Expressions} class).
 * 
 * An *Expression Function* (or EF for short) is a function whose signature is
 * $f:\mathcal{L}^n\to\mathcal{L}$ for some $n\in\mathbb{N}$.  We need a way to
 * represent Expression Functions as {@link LogicConcept LogicConcepts}.
 * This module provides functions that let us do so.
 * 
 * We will write an Expression Function using standard $\lambda$ notation, as in
 * $\lambda v_1,\ldots,v_n.B$, where each $v_i$ is a parameter to the function
 * (represented using a {@link Symbol Symbol} with the name `v_1`, `v_2`, etc.))
 * and the body $B$ is any {@link Expression Expression} that may contain free
 * instances of the $v_i$ that can be replaced with other
 * {@link Expression Expressions} when the function is applied to arguments.
 * For example, if $f=\lambda v_1,v_2.v_1+\cos(v_2+1)$, then we could apply $f$
 * to the {@link Expression Expressions} $3$ and $k$ to obtain the new
 * {@link Expression Expression} $3+\cos(k+1)$.
 * 
 * The above paragraph uses ordinary mathematical notation, but we will need to
 * be able to write expression functions in
 * {@link LogicConcept.fromPutdown putdown} notation so that we can express
 * them as {@link LogicConcept LogicConcepts}.  We define a constant in this
 * module to be `"LDE lambda"` so that we can express the $f$ from above as
 * `("LDE lambda" v_1 , v_2 , (+ v_1 (cos (+ v_2 1))))`.
 * That constant may change in later versions of the LDE, so clients should not
 * hard-code that name into their code, but instead use
 * {@link module:ExpressionFunctions.newEF newEF()} and
 * {@link module:ExpressionFunctions.isAnEF isAnEF()}.
 * 
 * You can also check the number of arguments of an expression function with
 * {@link module:ExpressionFunctions.arityOfEF arityOfEF()} and apply them with
 * {@link module:ExpressionFunctions.applyEF applyEF()}.  And you can create
 * simple types of expression functions with
 * {@link module:ExpressionFunctions.constantEF constantEF()} and
 * {@link module:ExpressionFunctions.projectionEF projectionEF()}.
 * 
 * An *Expression Function Application* (or EFA for short) is an
 * {@link Expression Expression} expressing the idea that we are applying some
 * Expression Function to a list of arguments.  For example, the application
 * above was $f(3,k)$, but we cannot write this in
 * {@link LogicConcept.fromPutdown putdown notation} as `(f 3 k)` because that
 * would be indistinguishable from normal function application.  Thus we need a
 * new symbol.  We define a constant in this module to be `"LDE EFA"` so that we
 * can express $f(3,k)$ as `("LDE EFA" f 3 k)`.  That constant may change in
 * later versions of the LDE, so clients should not hard-code that name into
 * their code, but instead use {@link module:ExpressionFunctions.newEF newEFA()}
 * and {@link module:ExpressionFunctions.isAnEF isAnEFA()}.  You can also check
 * whether an EFA is evaluatable with
 * {@link module:ExpressionFunctions.canBetaReduce canBetaReduce()} and evaluate
 * it (or any possible $\beta$-reduction inside it) with
 * {@link module:ExpressionFunctions.betaReduce betaReduce()} and
 * {@link module:ExpressionFunctions.fullBetaReduce fullBetaReduce()}.
 * 
 * Since we have functions in this module for $\beta$-reduction, we also have
 * two related to $\alpha$-equivalence.  You can check if two expressions are
 * $\alpha$-equivalent with
 * {@link module:ExpressionFunctions.alphaEquivalent alphaEquivalent()} and you
 * can convert a binding to an $\alpha$-equivalent version of itself by renaming
 * its variables, using
 * {@link module:ExpressionFunctions.alphaRenamed alphaRenamed()}.
 *
 * @module ExpressionFunctions
 */

import { MathConcept } from '../math-concept.js'
import { Symbol as LurchSymbol } from "../symbol.js"
import { Application } from "../application.js"
import { BindingExpression } from "../binding-expression.js"
import { metavariable } from "./metavariables.js"
import { NewSymbolStream } from "./new-symbol-stream.js"
import { isEncodedBinding, adjustIndices } from "./de-bruijn.js"

/**
 * The constant used in this module as the operator when encoding Expression
 * Functions as LogicConcepts.  See the documentation at the top of this module
 * for more information.
 */
export const expressionFunction = new LurchSymbol( 'LDE lambda' )

/**
 * Creates a new expression function, encoded as a
 * {@link LogicConcept LogicConcept}, as described at the top of this file.
 * The arguments are not copied; if you do not wish them removed from their
 * existing contexts, pass copies to this function.
 * 
 * For example, if `x` and `y` are {@link Symbol Symbol} instances with the
 * names "x" and "y" and `B` is an Application, such as `(+ x y)`, then
 * `newEF(x,y,B)` will be the {@link Expression Expression}
 * `("LDE lambda" (x y) , (+ x y))`.
 * 
 * @param  {...Expression} args a list of {@link Expression Expressions} to use
 *   in forming the expression function, which must begin with one or more
 *   {@link Symbol Symbol} instances followed by exactly one
 *   {@link Expression Expression} of any type, representing the arguments
 *   and the body of the function, respectively
 * @returns {Application} an Expression Function encoded as described in the
 *   documentation at the top of this file
 * 
 * @see {@link module:ExpressionFunctions.isAnEF isAnEF()}
 */
export const newEF = ( ...args ) =>
    new Application( expressionFunction.copy(),
                     new BindingExpression( ...args ) )

/**
 * Test whether the given {@link Expression Expression} encodes an Expression
 * Function, as defined by the encoding documented at the top of this file, and
 * as produced by the function {@link module:ExpressionFunctions.newEF newEF()}.
 * 
 * @param {Expression} expr the {@link Expression Expression} to test whether it
 *   encodes an Expression Function
 * @returns {boolean} true if and only if `expr` encodes an Expression Function
 * 
 * @see {@link module:ExpressionFunctions.newEF newEF()}
 */
export const isAnEF = expr => expr instanceof Application
                           && expr.numChildren() == 2
                           && expr.firstChild().equals( expressionFunction )
                           && expr.lastChild().binds()

/**
 * Compute the arity of a given expression function.  If `ef` is not an
 * expression function (as judged by
 * {@link module:ExpressionFunctions.isAnEF isAnEF()}) then an error is thrown.
 * Otherwise, a positive integer is returned representing the arity of the given
 * function, 1 for a unary function, 2 for a binary function, etc.
 * 
 * @param {Expression} ef the expression function whose arity is to be computed
 * @param {boolean=false} skipCheck whether to skip the check that `ef` is an
 *   expression function, and just trust the caller that it is (and thus no
 *   error will be thrown)
 * @returns {integer} the arity of `ef`
 * 
 * @see {@link module:ExpressionFunctions.isAnEF isAnEF()}
 * @see {@link module:ExpressionFunctions.applyEF applyEF()}
 * @see {@link module:ExpressionFunctions.parametersOfEF parametersOfEF()}
 */
export const arityOfEF = ( ef, skipCheck=false ) => {
    if ( !skipCheck && !isAnEF( ef ) )
        throw new Error( 'arityOfEF requires an expression function as first argument' )
    return ef.lastChild().numChildren() - 1
}

/**
 * Get the list of parameters for a given expression function.  If `ef` is not
 * an expression function (as judged by
 * {@link module:ExpressionFunctions.isAnEF isAnEF()}) then an error is thrown.
 * Otherwise, an array of its parameters is returned, the exact descendants that
 * are {@link Symbol Symbol} instances.
 * 
 * @param {Expression} ef the expression function whose parameters are to be
 *   returned
 * @returns {Symbol[]} the parameter list of `ef`
 * 
 * @see {@link module:ExpressionFunctions.isAnEF isAnEF()}
 * @see {@link module:ExpressionFunctions.applyEF applyEF()}
 * @see {@link module:ExpressionFunctions.arityOfEF arityOfEF()}
 * @see {@link module:ExpressionFunctions.bodyOfEF bodyOfEF()}
 */
export const parametersOfEF = ef => {
    if ( !isAnEF( ef ) )
        throw new Error( 'parametersOfEF requires an expression function as first argument' )
    return ef.lastChild().boundSymbols()
}

/**
 * Get the body of a given expression function.  If `ef` is not an expression
 * function (as judged by
 * {@link module:ExpressionFunctions.isAnEF isAnEF()}) then an error is thrown.
 * Otherwise, its function body returned, which is one of its descendants.
 * 
 * @param {Expression} ef the expression function whose body is to be returned
 * @returns {Expression} the body of `ef`
 * 
 * @see {@link module:ExpressionFunctions.isAnEF isAnEF()}
 * @see {@link module:ExpressionFunctions.applyEF applyEF()}
 * @see {@link module:ExpressionFunctions.arityOfEF arityOfEF()}
 * @see {@link module:ExpressionFunctions.parametersOfEF parametersOfEF()}
 */
 export const bodyOfEF = ef => {
    if ( !isAnEF( ef ) )
        throw new Error( 'bodyOfEF requires an expression function as first argument' )
    return ef.lastChild().lastChild()
}

/**
 * Applies `ef` as an expression function to a list of arguments.  If `ef` is
 * not an expression function (as per
 * {@link module:ExpressionFunctions.isAnEF isAnEF()}) or the list of arguments
 * is the wrong length, an error is thrown.  Otherwise, a copy of the body of
 * `ef` is returned with all parameters substituted with arguments.
 * 
 * For example, if `ef` is an {@link Expression Expression} representing
 * $\lambda v_1,v_2.\sqrt{v_1^2+v_2^2}$ and `A` another representing $x-1$ and
 * `B` another representing $y+1$, then `applyEF(ef,A,B)` would be a newly
 * constructed {@link Expression Expression} instance (sharing no subtrees with
 * any of those already mentioned) representing $\sqrt{(x-1)^2+(y+1)^2}$.
 * 
 * No check is made regarding whether this might cause variable capture, and no
 * effort is made to do $\alpha$-substitution to avoid variable capture.  Thus
 * this routine is of limited value; it should be used only in situations where
 * the caller knows that no variable capture will take place.  For example, if
 * `ef` is $\lambda v.\sum_{i=1}^n i^v$ then `applyEF(ef,i)` is
 * $\sum_{i=1}^n i^i$.  No error is thrown; the capture simply happens.
 * 
 * @param {Expression} ef an {@link Expression Expression} representing an
 *   expression function, that is, one that would be judged to be an expression
 *   function by the {@link module:ExpressionFunctions.isAnEF isAnEF()} function
 * @param {...Expression} args the arguments to which to apply `ef`
 * @returns {Expression} a new {@link Expression Expression} instance
 *   representing the application of `ef` to the given `args`
 * 
 * @see {@link module:ExpressionFunctions.isAnEF isAnEF()}
 * @see {@link module:ExpressionFunctions.arityOfEF arityOfEF()}
 */
export const applyEF = ( ef, ...args ) => {
    // verify that all arguments are the way they are supposed to be
    if ( !isAnEF( ef ) )
        throw 'applyEF() requires an expression function as first argument'
    if ( args.length != arityOfEF( ef ) )
        throw 'Incorrect number of arguments given to expression function'
    // prepare the necessary components used below
    const parameters = ef.lastChild().boundSymbolNames()
    const lookup = symbol => {
        const paramIndex = parameters.indexOf( symbol.text() )
        return paramIndex > -1 ? args[paramIndex].copy() : symbol.copy()
    }
    const body = bodyOfEF( ef )
    // if it's a projection function, replaceWith() won't work correctly
    if ( body instanceof LurchSymbol ) return lookup( body )
    // otherwise we actually have to do replacement within a copy of the body
    const result = body.copy()
    const replaceRespectingDeBruijn = ( toReplace, replacement ) => {
        const depth = toReplace.ancestorsSatisfying( isEncodedBinding ).length
        adjustIndices( replacement, depth, 0 )
        toReplace.replaceWith( replacement )
    }
    result.descendantsSatisfying(
        d => ( d instanceof LurchSymbol ) && d.isFree( result )
          && parameters.includes( d.text() )
    ).forEach( sym => replaceRespectingDeBruijn( sym, lookup( sym ) ) )
    return result
}

/**
 * Create an expression function (as defined
 * {@link module:ExpressionFunctions.isAnEF here}) that is a constant function
 * (that is, it always returns the same expression).  That is, the function can
 * be expressed as $\lambda v_1,\ldots,v_n. E$ for some expression $E$ not
 * containing any of the $v_i$.  The variables will have names chosen so that
 * none of them appears free in $E$.
 * 
 * @param {integer} arity the number of parameters for the function that will be
 *   created; this must be at least 1.
 * @param {Expression} output the output that the function should give on any
 *   input (because it is a constant function)
 * @returns {Expression} an expression function (that is, something that will
 *   pass the {@link module:ExpressionFunctions.isAnEF isAnEF()} test) with the
 *   given number of arguments, that always returns the given `output`
 * 
 * @see {@link module:ExpressionFunctions.isAnEF isAnEF()}
 * @see {@link module:ExpressionFunctions.newEF newEF()}
 * @see {@link module:ExpressionFunctions.projectionEF projectionEF()}
 */
export const constantEF = ( arity, output ) => {
    const parameters = new NewSymbolStream( output ).nextN( arity )
    return newEF( ...parameters, output.copy() )
}

/**
 * Create an expression function (as defined
 * {@link module:ExpressionFunctions.isAnEF here}) that returns one of its
 * arguments.  That is, the function can be expressed as
 * $\lambda v_1,\ldots,v_n. v_i$ for some $i$ between 1 and $n$.
 * 
 * @param {integer} arity the number of parameters for the function that will be
 *   created; this must be at least 1.
 * @param {integer} index the index of the parameter that will also be the body
 *   of the function; the function will always return the argument at this index
 * @returns {Expression} an expression function (that is, something that will
 *   pass the {@link module:ExpressionFunctions.isAnEF isAnEF()} test) with the
 *   given number of arguments, that always returns the argument with the given
 *   index
 * 
 * @see {@link module:ExpressionFunctions.isAnEF isAnEF()}
 * @see {@link module:ExpressionFunctions.newEF newEF()}
 * @see {@link module:ExpressionFunctions.constantEF constantEF()}
 */
export const projectionEF = ( arity, index ) => {
    const parameters = new NewSymbolStream().nextN( arity )
    return newEF( ...parameters, parameters[index].copy() )
}

/**
 * Construct a function whose body is an application of the form shown below.
 * The caller provides the arity of the function as well as a list of symbols to
 * be used in constructing the function's body, as shown below.  Assume the
 * given arity is $n$ and the list of symbols given is $F_1,\ldots,F_m$.
 * Further assume that the symbol used to indicate an EFA (as defined
 * {@link module:ExpressionFunctions.isAnEFA here}) is $A$.  Then the
 * expression function created will be
 * $$ \lambda v_1,\ldots,v_n.((A~F_1~v_1~\cdots~v_n)~\cdots~(A~F_m~v_1~\cdots~v_n)). $$
 * This particular form is useful in the matching algorithm in the
 * {@link Problem Problem} class.  The bound variables will be chosen so that
 * none of them is equal to any of the symbols $F_1,\ldots,F_m$.
 * 
 * @param {integer} arity the number of parameters to give the new function
 * @param {...Symbol|...string} symbols an array of symbols or names of symbols
 *   to be used to construct the function, as documented above
 */
export const applicationEF = ( arity, symbols ) => {
    const parameters = new NewSymbolStream( ...symbols ).nextN( arity )
    return newEF( ...parameters,
        new Application( ...symbols.map( sym =>
            newEFA( sym instanceof LurchSymbol ? sym : new LurchSymbol( sym ),
                    ...parameters.map( p => p.copy() ) ) ) ) )
}

/**
 * The constant used in this module as the operator when encoding Expression
 * Function Applications as LogicConcepts.  See the documentation at the top of
 * this module for more information.
 */
export const expressionFunctionApplication = new LurchSymbol( 'LDE EFA' )

/**
 * Creates a new Expression Function Application, encoded as an
 * {@link Expression Expression}, as described at the top of this file.
 * The arguments are not copied; if you do not wish them removed from their
 * existing contexts, pass copies to this function.
 * 
 * For example, if `F` is an {@link Expression Expression} representing an
 * Expression Function (or a metavariable that might later be instantiated as
 * one) and `x` and `y` are any other {@link Expression Expressions} (let's just
 * say the symbols "x" and "y" for this example) then `newEFA(F,x,y)` will be
 * the {@link Expression Expression} `("LDE EFA" F x y)`.
 * 
 * If the first argument is a metavariable then there must be one or more
 * additional arguments of any type.  If the first argument is an Expression
 * Function (as per {@link module:ExpressionFunctions.isAnEF isAnEF()}) then there must
 * be a number of arguments following it that are equal to its arity.  If these
 * rules are not followed, an error is thrown.
 * 
 * @param  {Expression} operator the {@link Expression Expression} to be used as
 *   the expression function in the result; this should be either an Expression
 *   Function (that is, it satisfies
 *   {@link module:ExpressionFunctions.isAnEF isAnEF()}) or a metavariable (that is,
 *   it satisfies `.isA( metavariable )`, as defined in
 *   {@link module:Metavariables.metavariable the Metavariables module}),
 *   because no other type of {@link Expression Expression} can be applied as an
 *   Expression Function
 * @param {...Expression} operands the arguments to which `operator` will be
 *   applied
 * @returns {Application} an Expression Function Application encoded as
 *   described in the documentation at the top of this file
 * 
 * @see {@link module:ExpressionFunctions.isAnEFA isAnEFA()}
 */
export const newEFA = ( operator, ...operands ) => {
    if ( operator.isA( metavariable ) && operands.length == 0 )
        throw 'Expression Function Applications require at least one argument'
    if ( isAnEF( operator ) && operands.length != arityOfEF( operator ) )
        throw 'Expression Function applied to the wrong number of arguments'
    return new Application( expressionFunctionApplication.copy(),
        operator, ...operands )
}

/**
 * Test whether the given expression encodes an Expression Function Application,
 * as defined by the encoding documented at the top of this file, and as
 * produced by the function {@link module:ExpressionFunctions.newEFA newEFA()}.
 * 
 * @param {Expression} expr the expression to test whether it encodes an
 *   Expression Function Application
 * @returns {boolean} true if and only if `expr` encodes an Expression Function
 *   Application
 * 
 * @see {@link module:ExpressionFunctions.newEFA newEFA()}
 */
export const isAnEFA = expr =>
    expr instanceof Application && expr.numChildren() > 2
 && expr.firstChild().equals( expressionFunctionApplication )

/**
 * An expression can be $\beta$-reduced if it is an expression function
 * application and the expression function in question is not a metavariable,
 * but an actual expression function.  To help distinguish these two
 * possibilities, consider:
 * 
 *  * If `P` is a {@link module:Metavariables.metavariable metavariable} and `x`
 *    is a {@link Symbol Symbol}, we could create an expression function
 *    application with, for example, `newEFA(P,new Symbol(5))`, but we could not
 *    evaluate it, because we do not know the meaning of `P`.
 *  * If `f` is an expression function, that is, it would pass the test
 *    `isAnEF(f)` defined {@link module:ExpressionFunctions.isAnEF here}, and
 *    `x` is as above, then (assuming the arity of `f` is 1) the expression
 *    `newEFA(f,new Symbol(5))` can be evaluated, because `f` has a body and we
 *    can substitute 5 into its body in the appropriate places.
 * 
 * Thus we need a function to distinguish these two cases.  Both will pass the
 * test {@link module:ExpressionFunctions.isAnEFA isAnEFA()}, but only one can
 * be applied.  Such application is called $\beta$-reduction, so we have this
 * function `canBetaReduce()` that can detect when we are in the second case,
 * above, rather than the first.  That is, does the expression being applied
 * pass the {@link module:ExpressionFunctions.isAnEF isAnEF()} test, or is it
 * just a metavariable?  This function returns true only in the former case,
 * plus it also verifies that the correct number of arguments are present; if
 * not, it returns false for that reason.
 * 
 * Examples:
 * 
 *  * `canBetaReduce(newEFA(metavar,arg))` returns false
 *  * `canBetaReduce(newEFA(newEF(symbol,body),arg))` returns true
 *  * `canBetaReduce(newEFA(newEF(symbol,body),too,many,args))` returns false
 * 
 * @param {Expression} expr the expression to test whether it is amenable to
 *   $\beta$-reduction
 * @returns {boolean} whether the given expression can be $\beta$-reduced
 */
export const canBetaReduce = expr =>
    isAnEFA( expr ) && isAnEF( expr.child( 1 ) )
 && expr.numChildren() == arityOfEF( expr.child( 1 ), true ) + 2

/**
 * If {@link module:ExpressionFunctions.canBetaReduce canBetaReduce()} returns
 * true, we may want to act upon that and perform the $\beta$-reduction.  This
 * function does so.  It requires an argument that passes the
 * {@link module:ExpressionFunctions.canBetaReduce canBetaReduce()} test, and it
 * will perform exactly one step of $\beta$-reduction.  That is, it will
 * substitute the arguments of the expression function application into (a copy
 * of) the body of the expression function and return the result.
 * 
 * Note that the process of $\beta$-reduction is usually considered to be the
 * repetition of this process in all possible ways until it termintes (if it
 * does).  That process is implemented in the function
 * {@link module:ExpressionFunctions.fullBetaReduce fullBetaReduce()}.  This
 * function does just one step.
 * 
 * @param {Expression} expr an expression to be $\beta$-reduced, if possible
 * @returns {Expression} a copy of the given expression, with $\beta$-reduction
 *   applied to it once, or undefined if the expression is not an expression
 *   function application applied to the correct number of arguments (as judged
 *   by {@link module:ExpressionFunctions.canBetaReduce canBetaReduce()})
 * 
 * @see {@link module:ExpressionFunctions.canBetaReduce canBetaReduce()}
 * @see {@link module:ExpressionFunctions.fullBetaReduce fullBetaReduce()}
 */
export const betaReduce = expr => canBetaReduce( expr ) ?
    applyEF( expr.child( 1 ), ...expr.children().slice( 2 ) )
        .copyAttributesFrom( expr ) : undefined

/**
 * Make a copy of the given {@link Expression Expression}, then find inside it
 * all subexpressions passing the test in
 * {@link module:ExpressionFunctions.canBetaReduce canBetaReduce()}, and apply
 * each such $\beta$-reduction using
 * {@link module:ExpressionFunctions.betaReduce betaReduce()}.  Continue this
 * process until there are no more opportunities for $\beta$-reduction.
 * 
 * This process is, in general, not guaranteed to terminate.  Clients should
 * take care to call it only in situations where it is guaranteed to terminate.
 * For example, the following expression function application will
 * $\beta$-reduce to itself, and thus enter an infinite loop.
 * $$ ((\lambda v. (v~v))~(\lambda v. (v~v))) $$
 * In the LDE, we are unlikely to permit users to write input that requires us
 * to apply expression functions to other expression functions, thus preventing
 * cases like this one.
 * 
 * @param {Expression} expr the {@link Expression Expression} in which to seek
 *   all opportunities for $\beta$-reduction and apply them
 * @param {boolean=true} makeCopy whether to return a copy even if the
 *   expression needs no beta reduction.  (If it does, a copy is always
 *   returned, but if no beta reduction needs to be done, and you set this to
 *   false, then the original expression will be returned, for efficiency.)
 * @returns {Expression} a copy of the original expression, but with all
 *   opportunities for $\beta$-reduction taken
 * 
 * @see {@link module:ExpressionFunctions.canBetaReduce canBetaReduce()}
 * @see {@link module:ExpressionFunctions.betaReduce betaReduce()}
 */
export const fullBetaReduce = ( expr, makeCopy = true ) => {
    // This function used to be written more elegantly, but slowly.
    // This is a more efficient version that is not as clear or simple to read.
    if ( canBetaReduce( expr ) )
        return fullBetaReduce( betaReduce( expr ), false )
    let oneChanged = false
    const childReducts = expr._children.map( child => {
        const result = fullBetaReduce( child, makeCopy )
        oneChanged ||= result != child
        return result
    } )
    if ( !makeCopy ) {
        if ( !oneChanged ) return expr
        for ( let i = 0 ; i < expr._children.length ; i++ )
            if ( childReducts[i] == expr._children[i] )
                childReducts[i] = childReducts[i].copy()
    }
    const className = expr.constructor.className
    const classObject = MathConcept.subclasses.get( className )
    const result = new classObject( ...childReducts )
    result._attributes = expr._attributes.deepCopy()
    return result
}

/**
 * Perform $\alpha$-renaming on a {@link MathConcept#binds binding}, producing a
 * new {@link MathConcept MathConcept} that is
 * {@link module:ExpressionFunctions.alphaEquivalent $\alpha$-equivalent} to
 * the original, but with different names for the bound variables.
 * 
 * If you pass an argument to the `binding` parameter that does not pass the
 * {@link MathConcept#binds binds()} test, the result of this function is
 * undefined.
 * 
 * @param {MathConcept} binding the MathConcept in which to do the work
 * @param {Symbol[]} newBoundSyms the list of new variables to use, which must
 *   have the same length as {@link MathConcept#boundSymbols
 *   `binding.boundSymbols()`}, and which will be used to replace those bound
 *   symbols in the order given (that is, the first of `newBoundSyms` replaces
 *   the first of `binding.boundSymbols()`, and so on)
 * @returns {MathConcept} a copy of the original `binding`, but with the
 *   $\alpha$-renaming having been performed; the original `binding` is
 *   unchanged
 */
export const alphaRenamed = ( binding, newBoundSyms ) => {
    // This function used to be written more elegantly, but slowly.
    // This is a more efficient version that is not as clear or simple to read.
    const origNames = binding.boundSymbols().map( symbol => symbol.text() )
    const body = binding.lastChild()
    const rebuild = ( node = body ) => {
        if ( node instanceof LurchSymbol ) {
            const index = origNames.indexOf( node.text() )
            return (
                index == -1         ? node :
                node.isFree( body ) ? newBoundSyms[index] : node
            ).copy()
        }
        const className = node.constructor.className
        const classObject = MathConcept.subclasses.get( className )
        const childCopies = node._children.map( rebuild )
        const result = new classObject( ...childCopies )
        result._attributes = node._attributes.deepCopy()
        return result
    }
    return new BindingExpression( ...newBoundSyms, rebuild() )
}

/**
 * Two expressions are $\alpha$-equivalent if renaming the bound variables in
 * one makes it exactly equal to the other.  For example, $\forall x,R(x,2)$ is
 * $\alpha$-equivalent to $\forall y,R(y,2)$, but not to $\forall y,R(y,y)$.
 * 
 * @param {Expression} expr1 the first expression to compare
 * @param {Expression} expr2 the second expression to compare
 * @param {NewSymbolStream} [stream] only for use in recursion; clients should
 *   omit this parameter
 */
export const alphaEquivalent = ( expr1, expr2, stream ) => {
    // atomic case:
    if ( expr1.isAtomic() ) return expr1.equals( expr2 )
    // easy cases:
    if ( expr1.numChildren() != expr2.numChildren() ) return false
    if ( expr1.binds() != expr2.binds() ) return false
    // we may need the stream, so create it
    if ( !stream ) stream = new NewSymbolStream( expr1, expr2 )
    // compound case 1: no symbols bound
    if ( !expr1.binds() ) {
        for ( let i = 0 ; i < expr1.numChildren() ; i++ )
            if ( !alphaEquivalent( expr1.child( i ), expr2.child( i ),
                                   stream ) ) return false
        return true
    }
    // compound case 2: recur on body, but only after renaming all
    // bound variables to standardize the two bodies
    const newBoundVars = stream.nextN( expr1.boundSymbols().length )
                               .map( v => new LurchSymbol( v ) )
    return alphaEquivalent( alphaRenamed( expr1, newBoundVars ).lastChild(),
                            alphaRenamed( expr2, newBoundVars ).lastChild(),
                            stream )
}
