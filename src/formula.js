
/**
 * A formula is a {@link LogicConcept LogicConcept} that includes symbols
 * intended to be used for substitution, that is, what
 * {@link module:Matching the Matching module} calls
 * {@link module:Matching.metavariable metavariables}.  This namespace
 * provides functions for dealing with formulas, including
 * {@link Formula.from converting} a {@link LogicConcept LogicConcept} into a
 * formula, computing the {@link Formula.domain domain} of a formula, and
 * {@link Formula.instantiate instantiating} a formula.
 * 
 * Import this namespace with code such as
 * `import Formula from './formula.js'` and then make calls such as
 * `Formula.domain( myLC )`.
 * 
 * @namespace Formula
 */

import { LogicConcept } from './logic-concept.js'
import { BindingEnvironment } from './binding-environment.js'
import { BindingExpression } from './binding-expression.js'
import { Declaration } from './declaration.js'
import { Expression } from './expression.js'
import { Symbol as LurchSymbol } from './symbol.js'
import Matching from './matching.js'

/**
 * A {@link LogicConcept LogicConcept} can be converted into a formula by
 * replacing any subset of its {@link Symbol Symbols} with metavariables.
 * Recall that a metavariable can be any symbol, but with
 * {@link module:Matching.metavariable a specific attribute} set to "true."
 * 
 * Which {@link Symbol Symbols} should be converted into metavariables?  Any
 * one that is not in the scope of a {@link Declaration Declaration} of that
 * same {@link Symbol Symbol}.  For example, if we consider the
 * {@link LogicConcept LogicConcept} indicated by the
 * {@link LogicConcept.fromPutdown putdown notation} `{ :(= a b) (= b a) }`
 * and we assume it is in the scope of a {@link Declaration Declaration} of
 * the `=` {@link Symbol Symbol}, but not of the `a` or `b` {@link Symbol
 * Symbols}.  Then converting `{ :(= a b) (= b a) }` to a formula would
 * produce a copy in which each instance of `a` and `b` have had their
 * metavariable attribute set to "true" (via a call to the
 * {@link LogicConcept#makeIntoA makeIntoA()} member).
 * 
 * @param {LogicConcept} LC - the {@link LogicConcept LogicConcept} to convert
 *   into a formula
 * @returns {LogicConcept} a structural copy of `LC`, except with the relevant
 *   {@link Symbol Symbol} atoms converted into
 *   {@link module:Matching.metavariable metavariables}
 * @memberof Formula
 * @alias Formula.from
 */
const from = LC => {
    // what symbol names were already declared?
    const declared = new Set( LC.accessibles().filter(
        a => a instanceof Declaration
    ).map( d => d.symbols() ).flat().map( s => s.text() ) )
    // and what were bound?
    const bound = new Set( LC.ancestors().filter(
        a => a != LC && ( a instanceof BindingEnvironment )
    ).map( be => be.boundSymbolNames() ).flat() )
    // make a copy and change all of its undeclared symbols into metavariables
    const result = LC.copy()
    result.descendantsSatisfying( d => d instanceof LurchSymbol )
    .forEach( s => {
        if ( !declared.has( s.text() ) && !bound.has( s.text() ) )
            s.makeIntoA( Matching.metavariable )
    } )
    // return it
    return result
}

/**
 * Once a {@link LogicConcept LogicConcept} has been {@link Formula.from
 * converted into a formula}, it will have zero or more metavariables.  This
 * function returns the set of names of those metavariables.  If the formula
 * has no metavariables, or if a non-formula {@link LogicConcept LogicConcept}
 * was passed as input, this function will return the empty set.
 * 
 * @param {LogicConcept} formula - the {@link LogicConcept LogicConcept} to
 *   view as a formula, and whose metavariables should be investigated to
 *   compute this function's result
 * @returns {Set} the set of names of {@link Symbol Symbols} in the given
 *   `formula` that appear as a metavariable therein
 * @memberof Formula
 * @alias Formula.domain
 */
const domain = formula =>
    new Set( formula.descendantsSatisfying(
        d => ( d instanceof LurchSymbol ) && d.isA( Matching.metavariable )
    ).map( metavar => metavar.text() ) )

/**
 * Instantiating a formula means making a copy of that formula and then
 * replacing each metavariable in it with another {@link LogicConcept
 * LogicConcept}, according to some predetermined mapping of metavariable
 * names to {@link LogicConcept LogicConcepts}, called the "instantiation."
 * This function performs exactly that operation, with two exceptions.
 * 
 * First, this function does not check to ensure that the domain of the given
 * `instantiation` matches the {@link Formula.domain domain} of the given
 * `formula`.  If that is important to the caller, they should verify that
 * themselves in advance, using an {@link Set#equals equality check} between
 * the two sets.
 * 
 * Second, this function also applies {@link module:Matching.fullBetaReduce
 * beta reduction} to the result before returning it (if necessary) because
 * the instantiation may have introduced an explicit expression function in a
 * position where it should be applied to its arguments.  Note the warnings in
 * the beta reduction documentation about infinite loops.
 * 
 * @param {LogicConcept} formula - the {@link LogicConcept LogicConcept} to
 *   instantiate with the given `instantiation`
 * @param {Substitution|Solution|Object|Map} instantiation - either a
 *   {@link Substitution Substitution} instance (which describes a single
 *   metavariable's replacement) or a {@link Solution Solution} instance
 *   (which describes the substitution of zero or more metavariables) or a
 *   JavaScript Object or Map (which should map metavariable names to the
 *   desired instantiations) to be used as the function to apply to each
 *   metavariable in the `formula`
 * @param {String[]} preserve - the list of attributes to preserve while doing
 *   the instantiation.  Any metavariable having these attributes will have the
 *   values of those attributes copied over to its instantiation.  All other
 *   attributes of the metavariable (including, typically, the fact that it is a
 *   metavariable) will be lost during the instantiation.  This defaults to the
 *   empty array, but the client can pass whatever attributes they choose here.
 * @memberof Formula
 * @alias Formula.instantiate
 */
const instantiate = ( formula, instantiation, preserve = [ ] ) => {
    // handle the atomic case, where .replaceWith() would fail, and where we
    // don't need to check any restrictions on the parent, because there is no
    // parent in this case (since we're making a copy).  Furthermore, in this
    // case, we cannot possibly have created a case of
    // ("LDE EFA" ("LDE lambda" ...) ...), so we do not beta-reduce.
    if ( ( formula instanceof LurchSymbol )
      && formula.isA( Matching.metavariable ) ) {
        const result = lookup( instantiation, formula )
        preserve.forEach( attrKey => {
            if ( formula.hasAttribute( attrKey ) )
                result.setAttribute( attrKey,
                    JSON.copy( formula.getAttribute( attrKey ) ) )
        } )
        return result
    }
    // handle the usual case, where we may have multiple substitutions to make
    // and since each one is inside a parent, that may bring restrictions.
    const result = formula.copy()
    result.descendantsSatisfying(
        d => ( d instanceof LurchSymbol ) && d.isA( Matching.metavariable )
    ).forEach( metavar =>
        replaceIfPossible( metavar, lookup( instantiation, metavar ), preserve )
    )
    // if there are any expression function applications, try beta reducing.
    if ( result instanceof Expression )
        return betaIfNeeded( result )
    result.descendantsSatisfying(
        d => ( d instanceof Expression ) && d.isOutermost()
    ).forEach( d => d.replaceWith( betaIfNeeded( d ) ) )
    return result
}

// Helper function:  Look up a given metavariable in a given instantiation,
// whether that instantiation is a Solution, a Substitution, a Map, or an
// Object, and return a copy of the image, if there is one.
const lookup = ( instantiation, metavar ) => {
    if ( instantiation instanceof Matching.Substitution )
        return instantiation.metavariable.equals( metavar ) ?
            instantiation.expression.copy() : metavar
    if ( instantiation instanceof Matching.Solution ) {
        const mapsTo = instantiation.get( metavar )
        return mapsTo ? mapsTo.copy() : metavar
    }
    if ( instantiation instanceof Map ) {
        if ( !instantiation.has( metavar.text() ) ) return metavar
        const mapsTo = instantiation.get( metavar.text() )
        return mapsTo instanceof LogicConcept ? mapsTo.copy() : metavar
    }
    if ( instantiation instanceof Object ) {
        if ( !instantiation.hasOwnProperty( metavar.text() ) ) return metavar
        const mapsTo = instantiation[metavar.text()]
        return mapsTo instanceof LogicConcept ? mapsTo.copy() : metavar
    }
    throw new Error( `Invalid instantiation: ${instantiation}` )
}

// Helper function:  Check whether it's acceptable to call x.replaceWith( y ),
// in the sense that the resulting LogicConcept hierarchy would still be valid
// (only symbols are bound, no environments inside expressions, etc.).
// The "preserve" attribute is documented above, in instantiate().
const replaceIfPossible = ( target, replacement, preserve ) => {
    const parent = target.parent()
    // bound symbols must be symbols, not anything else
    if ( ( ( parent instanceof BindingEnvironment )
        || ( parent instanceof BindingExpression ) )
      && !( replacement instanceof LurchSymbol )
      && ( target != parent.body() ) )
        throw new Error( 'Cannot replace a bound symbol with a non-symbol' )
    // declared symbols must be symbols, not anything else
    if ( ( parent instanceof Declaration )
      && !( replacement instanceof LurchSymbol )
      && parent.symbols().includes( target ) )
        throw new Error( 'Cannot replace a delcared symbol with a non-symbol' )
    // expressions can contain only other expressions
    if ( ( parent instanceof Expression )
      && !( replacement instanceof Expression ) )
        throw new Error( 'Cannot place a non-expression inside an expression' )
    // no restrictions forbid us, so proceed
    target.replaceWith( replacement )
    preserve.forEach( attrKey => {
        if ( target.hasAttribute( attrKey ) )
            replacement.setAttribute( attrKey,
                JSON.copy( target.getAttribute( attrKey ) ) )
    } )
}

/**
 * What are all instantiations of the given formula that produce the given
 * candidate?
 * 
 * On the one hand, it may seem like this is a simple application of
 * {@link module:Matching the Matching module}, and this is somewhat true.  The
 * only additional feature provided here is that the formula and its candidate
 * instantiation need not be {@link Expression Expressions}.  If they are not,
 * then they must have isomorphic structure except for any {@link Expression
 * Expressions} inside the two, which will be paired up to construct a matching
 * problem, whose solutions will be returned.
 * 
 * In other words, this function extends matching to support a single pair of
 * inputs that do not need to be {@link Expression Expressions}, and it does
 * exactly what you'd expect in that case.
 * 
 * @param {LogicConcept} formula a {@link LogicConcept} that has had
 *   metavariables added to it using {@link Formula.from}
 * @param {LogicConcept} candidate a {@link LogicConcept} that may or may not
 *   be an instantiation of the given `formula`
 * @yields {Solution} zero or more ways to instantiation `formula` to produce
 *   `candidate`; all possible ways will be enumerated, though it may be that
 *   there are no such ways, in which case the enumeration will be empty
 */
const allPossibleInstantiations = function* ( formula, candidate ) {
    const problem = problemFromExpressionsWithin( formula, candidate )
    if ( !problem ) return // no isomorphism == no results
    yield* problem.solutions()
}

// Helper function used by allPossibleInstantiations(), above.
// Given two LogicConcepts that are not necessarily expressions, this ensures
// that they have the same structure outside of all expressions, and if so, it
// pairs up the corresponding expressions to produce a matching problem, which
// it then returns.  Otherwise, it returns null (no such pairing possible).
// Third argument is for internal use only; clients provide just the first two.
const problemFromExpressionsWithin = ( formula, candidate, result = null ) => {
    // create a problem if we were not passed one
    if ( result == null ) result = new Matching.Problem()
    // Case 1: The formula is an expression
    if ( formula instanceof Expression ) {
        if ( ( candidate instanceof Expression )
          && ( formula.isA( 'given' ) == candidate.isA( 'given' ) ) ) {
            // If the candidate is, they pair up in the matching problem
            result.add( formula.copy().unmakeIntoA( 'given' ),
                        candidate.copy().unmakeIntoA( 'given' ) )
            return result
        } else {
            return null // otherwise there can be no possible instantiation
        }
    } else { // Case 2: the formula is not an expression
        if ( ( candidate instanceof Expression )
          || ( formula.constructor.className
            != candidate.constructor.className )
          || ( formula.numChildren() != candidate.numChildren() )
          || ( formula.isA( 'given' ) != candidate.isA( 'given' ) ) ) {
            return null // candidate has diff. structure; no pairing possible
        } else {
            // Candidate has the same shape; proceed recursively
            for ( let i = 0 ; i < formula.numChildren() ; i++ ) {
                result = problemFromExpressionsWithin(
                    formula.child( i ), candidate.child( i ), result )
                if ( !result ) return null // if any child fails, all fails
            }
            return result // return the recursively-produced result
        }
    }
}

// Helper function:  Beta reduce an Expression only if necessary.
const betaIfNeeded = expr =>
    expr.hasDescendantSatisfying( Matching.isAnEFA ) ?
    Matching.fullBetaReduce( expr ) : expr

export default { from, domain, instantiate, allPossibleInstantiations }
