
import { LogicConcept } from '../logic-concept.js'
import { Application } from '../application.js'
import { BindingExpression } from '../binding-expression.js'
import { Symbol as LurchSymbol } from '../symbol.js'
import {
    expressionFunctionApplication, isAnEF, newEF, parametersOfEF, bodyOfEF
} from './expression-functions.js'
import { metavariable } from './metavariables.js'

/**
 * ## What are de Bruijn indices?
 * 
 * One way to express bound variables without giving them explicit names is to
 * use *de Bruijn indices,* a technique that replaces symbols with numbers.  The
 * standard version of this method applies to the $\lambda$-calculus, replacing
 * a bound variable $x$ with a natural number $n$ that is equal to the number of
 * levels of nested $\lambda$ expressions one must walk up the syntax tree to
 * find the one that binds $x$.
 * 
 * For example, $\lambda f.\lambda g.(f~(g~x))$ could be expressed as
 * $\lambda.\lambda.(2~(1~x))$.  Notice these properties of the example:
 * 
 *  1. The inner $f$ of the original expression is replaced with a 2, because
 *     one must walk out two "$\lambda$ levels" to find the $\lambda$ that
 *     originally bound $f$.
 *  1. The inner $g$ is now a 1 because it was bound by the first $\lambda$
 *     above it.
 *  1. The bound variable names are not needed, because the order of
 *     quantification is clear from the indices.
 * 
 * Had the example been something like $(\circ~(\lambda~x.x)~(\lambda~y.y))$,
 * it would have become $(\circ~(\lambda.1)~(\lambda.1))$, showcasing how de
 * Bruijn indices reduce $\alpha$-equivalence to mere expression equality.
 * 
 * ## Purpose of this module
 * 
 * This module provides tools to encode {@link MathConcept} instances using de
 * Bruijn indices, but we make the following changes to extend the method from
 * the standard version introduced above to a version that supports the full
 * range of {@link MathConcept MathConcepts}.
 * 
 *  1. It is not only $\lambda$ expressions that are supported, but any kind of
 *     {@link BindingExpression}.  For example, we can encode $\forall~x.(P~x)$
 *     as $\forall.(P~1)$.
 *  2. Because a {@link BindingExpression} can bind multiple variables, we must
 *     distinguish them, so our indices will be pairs, one index for the binding
 *     level (as above) and one index for which position within that binding was
 *     occupied by the symbol being encoded.  For example, $\forall x,y.(>~x~y)$
 *     can be encoded as $\forall.(>~(1,1)~(1,2))$, where I'm using the
 *     standard notation for pairs.  This applies even if the binder binds only
 *     one variable, so the example from item 1., above, would actually be
 *     encoded as $\forall.(P~(1,1))$.
 *  3. Unlike the original de Bruijn notation, we will use zero-based indexing,
 *     to be consistent with everything else in our codebase, which uses
 *     zero-based indexing.  Thus the two examples from item 2., above, would
 *     actually be encoded as $\forall.(>~(0,0)~(0,1))$ and $\forall.(P~(0,0))$,
 *     respectively.
 * 
 * The notation used above is to illustrate the general concept of the de Bruijn
 * conversion only.  Obviously pairs like $(a,b)$ and bindings with no bound
 * symbols like $\lambda.1$ are not valid {@link LogicConcept#fromPutdown
 * putdown notation}, so they do not represent the actual encoding.  The details
 * of that encoding appear in the next section.
 * 
 * ## Functions in this module
 * 
 * Given a {@link Symbol}, we can compute its encoding as a pair of de Bruijn
 * indices with {@link module:deBruijn.encodeSymbol encodeSymbol()}.  We
 * represent that pair as another {@link Symbol} whose name is a JSON encoding
 * that includes the pair of indices, and that has the original symbol name
 * stored as an attribute, so that the conversion can
 * be inverted later (with {@link module:deBruijn.decodeSymbol decodeSymbol()}).
 * However, if you wish to fetch just the indices of the encoded symbol, you can
 * do so with {@link module:deBruijn.encodedIndices encodedIndices()}.
 * 
 * The {@link module:deBruijn.encodeSymbol encodeSymbol()} function is not,
 * however, of much use to clients, who typically want to encode entire
 * {@link Expression Expressions}, not just individual symbols within them.
 * Given an {@link Expression}, we can compute its de Bruijn encoding using
 * {@link module:deBruijn.encodeExpression encodeExpression()}.  It yields
 * another expression with the following properties.
 * 
 *  * At each position where a {@link Symbol} had sat, its encoding (under
 *    {@link module:deBruijn.encodeSymbol encodeSymbol()}) will sit instead.
 *  * The entire resulting expression contains no
 *    {@link BindingExpression BindingExpressions}.
 *  * At each position where a {@link BindingExpression} had sat as a
 *    subexpression, instead an {@link Application} now sits, of the form
 *    `(A B)`, where `A` is a special symbol indicating that a
 *    {@link BindingExpression} has been encoded, and `B` is the encoding of the
 *    body of the original {@link BindingExpression}.
 *  * Each such `A` will be decorated with an attribute that records the
 *    original names of the bound symbols, so that this encoding is invertible
 *    (using {@link module:deBruijn.decodeExpression decodeExpression()}).
 * 
 * To give one full, explicit example, consider the {@link Expression} (in
 * {@link LogicConcept#fromPutdown putdown notation})
 * `(forall (x y) , (> x y))`.  Its de Bruijn encoding, according to this
 * module, would be the following.  I will use the symbol `"LDE DB"` as the
 * special symbol meaning "encoded binding" and also as the attribute key for
 * all de Bruijn attributes.  Some JSON encodings have been simplified for
 * readability, as you can see below.
 * 
 * ```
 * (forall
 *   ("LDE DB" +{"LDE DB":"['x','y']"} // list of bound variable names
 *     (>
 *       "['LDE DB',0,0]" +{"LDE DB":"JSON encoding of original x symbol"}
 *       "['LDE DB',0,1]" +{"LDE DB":"JSON encoding of original y symbol"}
 *     )
 *   )
 * )
 * ```
 * 
 * The module also provides a {@link module:deBruijn.free freeness test} for de
 * Bruijn indices, which returns true for an index $(n,m)$ iff there are at
 * least $n+1$ encoded bindings surrounding the symbol.
 * 
 * ## Coordinating with matching
 * 
 * There are two exceptions to the above encoding description, each of which
 * helps this module integrate correctly with the larger module in which it
 * sits, {@link module:Matching the Matching module}.
 * 
 * First, when encoding a symbol, if the symbol is a metavariable, then don't
 * encode it at all, but leave it in its original form.
 * 
 * Second, one of the special symbols in the matching package, the one that
 * marks Expression Functions Applications, is not encoded, but is left
 * unchanged under the de Bruijn encoding.  That way, Expression Function
 * Applications retain their meanings under the de Bruijn encoding.
 * 
 * Finally, we do not need to apply the same protection to the Expression
 * Function symbol, because we will not be applying the de Bruijn encoding to
 * Expression Functions, and it would break them anyway, since it removes all
 * bindings.  But when decoding the image of a metavariable in a solution, an
 * Expression Function may be present, so the
 * {@link module:deBruijn.decodeExpression decodeExpression()} function recurs
 * inside such structures.
 * 
 * ## Expression equality
 * 
 * As mentioned above, one of the benefits of de Bruijn indices is that two
 * expressions are $\alpha$-equivalent iff their de Bruijn encodings are exactly
 * equal.  However, the implementation above mentions that our encoding function
 * stores the original names of the bound symbols as attributes so that the
 * encoding is invertible.  Thus if we encode the identity function
 * $\lambda x.x$ and also encode the identity function $\lambda y.y$, although
 * the resulting expressions would seem equal, both being something like
 * $\lambda.(0,0)$, but their attributes would distinguish them:
 * 
 * ```
 * // Encoding of (lambda x , x):
 * (lambda
 *   ("LDE DB" +{"LDE DB":['x']}
 *     "['LDE DB',0,0]" +{"LDE DB":"JSON encoding of the symbol x"}
 *   )
 * )
 * // Encoding of (lambda y , y):
 * (lambda
 *   ("LDE DB" +{"LDE DB":['y']}
 *     "['LDE DB',0,0]" +{"LDE DB":"JSON encoding of the symbol y"}
 *   )
 * )
 * ```
 * 
 * Without the attributes, we would be comparing
 * `(lambda ("LDE DB" "['LDE DB',0,0]"))` to itself.  With the attributes, we
 * can still distinguish formerly-$x$ from formerly-$y$, which is undesirable.
 * 
 * Thus we need a way to compare two expressions for equality, but ignore these
 * hidden attributes that are present only to enable the inversion of the de
 * Bruijn encoding.  We define the {@link module:deBruijn.equal equal()}
 * function for this purpose.  It simply calls the {@link MathConcept#equals
 * equals()} function in the {@link MathConcept} class, passing an optional
 * argument that tells it to ignore the attributes in question when doing its
 * comparison.
 * 
 * @module deBruijn
 */

/**
 * This string is used for several purposes in this module.
 * 
 *  * Encoded {@link Symbol Symbols} use this string as the key for the
 *    attribute that stores their original text.
 *  * Encoded {@link BindingExpression BindingExpressions} use this string as
 *    the key for the attribute that stores their original list of bound symbol
 *    names.
 *  * Encoded {@link BindingExpression BindingExpressions} are
 *    {@link Application Applications} whose operator is a symbol with this
 *    string as its text.
 */
export const deBruijn = 'LDE DB'
// A symbol whose value is the above constant
const deBruijnSymbol = new LurchSymbol( deBruijn )

// Given any symbol, compute the i and j that form its index pair (i,j),
// defined in the documentation at the top of this module.
// Or, if the symbol is free where it sits, return undefined.
const symbolToIndices = symbol => {
    const binders = symbol.ancestorsSatisfying(
        a => a instanceof BindingExpression )
    for ( let i = 0 ; i < binders.length ; i++ ) {
        const boundSymbols = binders[i].boundSymbols()
        for ( let j = 0 ; j < boundSymbols.length ; j++ )
            if ( boundSymbols[j].text() == symbol.text() )
                return [ i, j ]
    }
}

/**
 * This function takes an input {@link Symbol} and returns an output
 * {@link Symbol} whose name encodes the de Bruijn index of the first symbol.
 * Recall from the definition at the top of this module that, in this module, a
 * de Bruijn index is a pair of natural numbers.  Note that the context of the
 * input {@link Symbol} (its ancestor chain, and whether it is bound by any of
 * those ancestors) is what determines the result of this function.
 * 
 * The encoded symbol returned by this function has an attribute that stores the
 * original name of this symbol, so that this encoding can be reversed by
 * {@link module:deBruijn.decodeSymbol decodeSymbol()}.  For two important
 * details about how symbol encoding coordinates with the Matching module, see
 * the documentation at the top of this module.
 * 
 * @function
 * @param {Symbol} symbol the symbol to be encoded
 * @returns {Symbol} a new symbol whose name encodes the de Bruijn indices of
 *   the input
 * @see {@link module:deBruijn.encodedIndices encodedIndices()}
 * @see {@link module:deBruijn.decodeSymbol decodeSymbol()}
 * @see {@link module:deBruijn.encodeExpression encodeExpression()}
 */
export const encodeSymbol = symbol => {
    // Exceptions: Don't modify special symbol used for EFAs, nor metavariables:
    if ( symbol.equals( expressionFunctionApplication )
      || symbol.isA( metavariable ) )
        return symbol.copy()
    // Okay, now do the normal de Bruijn encoding:
    const indices = symbolToIndices( symbol )
    return new LurchSymbol( JSON.stringify(
        indices ? [ deBruijn, ...indices ] : [ deBruijn, symbol.text() ]
    ) ).attr( [ [ deBruijn, symbol.toJSON() ] ] )
}

/**
 * This function takes a {@link Symbol} encoded by the
 * {@link module:deBruijn.encodeSymbol encodeSymbol()} function and returns the
 * de Bruijn indices stored within its name.
 * 
 * @function
 * @param {Symbol} symbol a symbol that was de Bruijn-encoded
 * @returns {number[]} a pair of natural numbers, the de Bruijn indices of the
 *   input
 * @see {@link module:deBruijn.encodeSymbol encodeSymbol()}
 * @see {@link module:deBruijn.decodeSymbol decodeSymbol()}
 */
export const encodedIndices = symbol => {
    if ( !( symbol instanceof LurchSymbol ) ) return
    try {
        const parts = JSON.parse( symbol.text() )
        return parts.length == 3 && parts[0] == deBruijn ?
            parts.slice( 1 ) : undefined
    } catch {
        return undefined
    }
}

/**
 * Alter the name of a de Bruijn index (an encoded {@link Symbol}) so that it
 * still encodes a de Bruijn index, but the two components have been adjusted
 * (up or down) by the differences given in the latter two arguments.  That is,
 * a de Bruijn index $(i,j)$ can be adjusted with $(\Delta_i,\Delta_j)$ to
 * become $(i+\Delta_i,j+\Delta_j)$.
 * 
 * If the first argument is an {@link Application}, this function distributes
 * itself across the {@link Application}'s children.  If it is neither a
 * {@link Symbol} nor an {@link Application}, this function does nothing.
 * 
 * @function
 * @param {Symbol} target an encoded de Bruijn index
 * @param {integer} deltaI the amount by which to adjust the first component of
 *   the index
 * @param {integer} deltaJ the amount by which to adjust teh second component of
 *   the index
 */
export const adjustIndices = ( target, deltaI, deltaJ ) => {
    if ( target instanceof Application )
        return target.children().forEach( child =>
            adjustIndices( child, deltaI, deltaJ ) )
    const original = encodedIndices( target )
    if ( !original ) return
    target.setAttribute( 'symbol text', JSON.stringify(
        [ deBruijn, original[0] + deltaI, original[1] + deltaJ ] ) )
}

/**
 * This function takes a {@link Symbol} encoded by the
 * {@link module:deBruijn.encodeSymbol encodeSymbol()} function and returns (a
 * copy of) the original symbol that was passed to the encoding function.  The
 * de Bruijn indices encoded in the input are discarded, and its original name
 * (stored in an attribute) is restored.
 * 
 * If it receives a symbol that has no de Bruijn encoding information stored in
 * an attribute, it returns the symbol untouched.
 * 
 * @function
 * @param {Symbol} symbol a symbol that was de Bruijn-encoded
 * @returns {Symbol} a copy of the original {@link Symbol} that was encoded to
 *   produce the input `symbol`
 * @see {@link module:deBruijn.encodeSymbol encodeSymbol()}
 * @see {@link module:deBruijn.encodedIndices encodedIndices()}
 * @see {@link module:deBruijn.decodeExpression decodeExpression()}
 */
export const decodeSymbol = symbol => {
    const serialized = symbol.getAttribute( deBruijn )
    return serialized ? LogicConcept.fromJSON( serialized ) : symbol.copy()
}

/**
 * This function takes an input {@link Expression} and returns an output
 * {@link Expression} that is the de Bruijn-encoded form of the input.  The full
 * list of guarantees this function provides, and the properties its output will
 * have, is given in the documentation at the top of this module.
 * 
 * In summary, all of its {@link BindingExpression BindingExpressions} have been
 * replaced with {@link Application Applications} with no bound symbols, and all
 * formerly-bound symbols have been replaced with their encoded versions as de
 * Bruijn indices, as computed by the
 * {@link module:deBruijn.encodeSymbol encodeSymbol()}) function.
 * 
 * This operation can be reversed by applying the
 * {@link module:deBruijn.decodeExpression decodeExpression()} function.
 * 
 * @function
 * @param {Expression} expression the expression to be encoded
 * @returns {Expression} the encoded version, with the properties described
 *   above
 * @see {@link module:deBruijn.encodeSymbol encodeSymbol()}
 * @see {@link module:deBruijn.decodeExpression decodeExpression()}
 */
export const encodeExpression = expression =>
    expression instanceof LurchSymbol ? encodeSymbol( expression ) :
    expression instanceof Application ? new Application(
        ...expression.children().map( encodeExpression ) ) :
    // therefore expression instanceof BindingExpression:
    new Application(
        deBruijnSymbol.copy().attr( [ [
            deBruijn, expression.boundSymbols().map( symbol => symbol.toJSON() )
        ] ] ),
        encodeExpression( expression.body() ) )

export const isEncodedBinding = expression =>
    ( expression instanceof Application )
 && equal( expression.child( 0 ), deBruijnSymbol )

/**
 * This function takes an {@link Expression} encoded by the
 * {@link module:deBruijn.encodeExpression encodeExpression()} function
 * and returns (a copy of) the original expression that was passed to the
 * encoding function.
 * 
 * @function
 * @param {Symbol} symbol an expression that was de Bruijn-encoded
 * @returns {Symbol} a copy of the original {@link Expression} that was encoded
 *   to produce the input `expression`
 * @see {@link module:deBruijn.encodeExpression encodeExpression()}
 * @see {@link module:deBruijn.decodeSymbol decodeSymbol()}
 */
export const decodeExpression = expression => {
    // Case 1: Symbols have their own decoding routine
    if ( expression instanceof LurchSymbol )
        return decodeSymbol( expression )
    // Case 2: Expression Functions
    if ( isAnEF( expression ) )
        return newEF(
            ...parametersOfEF( expression ).map( v => v.copy() ),
            decodeExpression( bodyOfEF( expression ) )
        )
    // Case 3: (Other) Applications
    if ( expression instanceof Application ) {
        if ( equal( expression.child( 0 ), deBruijnSymbol ) ) {
            // subcase 1: application that encodes what used to be a binding
            const symbolNames = expression.child( 0 ).getAttribute( deBruijn )
            if ( !symbolNames )
                throw new Error( 'Missing de Bruijn attribute on Application' )
            return new BindingExpression(
                ...symbolNames.map( json => LogicConcept.fromJSON( json ) ),
                decodeExpression( expression.child( 1 ) ) )
        } else {
            // subcase 2: application that is just an application
            return new Application(
                ...expression.children().map( decodeExpression ) )
        }
    }
    // therefore expression instanceof BindingExpression, which means this is
    // not a correctly-encoded de Bruijn expression
    throw new Error( 'No bindings permitted in de Bruijn encodings' )
}

/**
 * See the documentation at the top of this module for why it is important to be
 * able to test two expressions for equivalence, ignoring the attributes that
 * may have been added during the de Bruijn encoding process that produced those
 * two expressions.  This function does exactly that, using the
 * `attributesToIgnore` feature of the {@link MathConcept#equals equals()}
 * function in the {@link MathConcept} class.
 * 
 * @function
 * @param {Expression} expression1 the left-hand side of the equality test; this
 *   function asks if this is equal to `expression2`
 * @param {Expression} expression2 the right-hand side of the equality test;
 *   this function asks if this is equal to `expression1`
 * @returns {boolean} whether the two {@link Expression Expressions} are equal
 *   except for any attributes that were added as part of the de Bruijn encoding
 *   process
 */
export const equal = ( expression1, expression2 ) =>
    expression1.equals( expression2, [ deBruijn ] )

/**
 * A de Bruijn index, as defined at the top of this module, is a symbol encoding
 * a pair of natural numbers, the first of which says how many bindings one must
 * pass as one walks up the ancestor chain of this symbol before we encounter
 * the binding that binds this symbol.  Thus a de Bruijn index is free if the
 * number of bindings in its ancestor chain is greater than or equal to that
 * first index.
 * 
 * This function tests that and returns true if that freeness condition is met,
 * false if the first component of the de Bruijn index is smaller than the
 * number of bindings above the symbol, and undefined if the argument given is
 * not a de Bruijn index.  Note that, because we are working with
 * {@link Expressions} that have been encoded with
 * {@link module:deBruijn.encodeExpression encodeExpression()}, a binding is not
 * a {@link BindingExpression}, but an encoded version thereof.
 * 
 * @param {Symbol} symbol the symbol to test for freeness
 * @returns {boolean} whether the symbol is a free de Bruijn index
 */
export const free = symbol => {
    const indices = encodedIndices( symbol )
    if ( !indices ) return undefined
    const encodedBindings = symbol.ancestorsSatisfying( isEncodedBinding )
    return indices[0] >= encodedBindings.length
}
