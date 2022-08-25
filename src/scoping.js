
/**
 * ## What is scoping?
 * 
 * The Lurch Deductive Engine supports the common notion of nested scopes for
 * symbols, a notion that appears in various ways in both mathematical language
 * and computer programming languages.
 * 
 *  * In mathematics, when we begin a proof by saying, "Let $x$ be an arbitrary
 *    real number," we do not expect that once the proof is over, we are still
 *    going to talk about $x$.  There is a notion of what computer scientists
 *    call "variable scope" that would say that the symbol $x$ is no longer
 *    accessible, or "in scope," after the proof has closed.
 *  * In almost all programming languages, this same principle appears.  For
 *    example, in JavaScript, the language in which the LDE is developed, one
 *    can write `function ( x ) { ... }` and the `x` is defined only within the
 *    curly brackets.  That is its "scope."
 * 
 * In Lurch, we use {@link Environment Environments} to delimit scope.  But how
 * do we know where a symbol's scope begins?  Notice in the two examples above
 * that explicit syntax marks the beginning of a variable's scope (in
 * mathematics, "Let...be arbitrary" and in JavaScript `function (...)`).  In
 * Lurch, we have three methods for marking the beginning of a variable's scope,
 * each of which could be used to represent mathematical content like the
 * example above.
 * 
 *  1. A {@link Declaration Declaration} of a symbol marks the beginning of a
 *     scope for that symbol, and includes the declaration's body (if it has
 *     one) and any other {@link LogicConcept LogicConcepts} that follow the
 *     declaration in its parent environment.
 *      * We say that symbols declared in this way are *explicitly declared.*
 *      * You can find out which symbols a {@link Declaration Declaration}
 *        declares with its {@link Declaration#symbols symbols()} function.
 *  2. A {@link BindingEnvironment BindingEnvironment} that binds a symbol $x$
 *     is itself the scope for $x$; that is, the scope lasts from the first
 *     through the last children of the environment, inclusive.
 *      * Symbols declared in this way are also said to be
 *        *explicitly declared.*
 *      * You can find out which symbols a {@link BindingEnvironment
 *        BindingEnvironment} declares with its
 *        {@link BindingInterface.boundSymbolNames boundSymbolNames()}
 *        function.
 *  3. A {@link BindingExpression BindingExpression} functions just like a
 *     {@link BindingEnvironment BindingEnvironment}, except within one single
 *     expression.  These are used for quantification, indexed operators,
 *     dummy variables in integration and $\lambda$ notation, and more.
 *      * Symbols introduced in this way are said to be *bound.*
 *      * You can find out which symbols a {@link BindingExpression
 *        BindingExpression} declares with its
 *        {@link BindingInterface.boundSymbolNames boundSymbolNames()}
 *        function.
 *  4. Any {@link LogicConcept LogicConcept} can be marked as implicitly
 *     declaring a symbol.  If the {@link LogicConcept LogicConcept} so marked
 *     is an {@link Environment Environment}, then the implicit declaration
 *     functions just like case 2, above, and otherwise, it functions like case
 *     1.
 *      * Naturally, we say that a symbol declared in this way is
 *        *implicitly declared.*
 *      * You can add implicit declarations to any
 *        {@link LogicConcept LogicConcept} with the
 *        {@link module:Scoping.addImplicitDeclaration addImplicitDeclaration()}
 *        function in this module, but you should do so only during the
 *        appropriate phase of scope checking.  Refer to the documentation of
 *        {@link module:Scoping.validate validate()} for details.
 *      * You can find out which symbols a {@link LogicConcept LogicConcept}
 *        implicitly declares with this module's
 *        {@link module:Scoping.implicitDeclarations implicitDeclarations()}
 *        function.
 * 
 * The fourth case may seem redundant, since it just repeats the functionality
 * of the earlier cases, but we will use that case to represent in a natural
 * way those mathematical situations in which it is typical to begin using
 * symbols without declaring them, such as in an algebra exercise (where
 * almost nobody says "let $x$ be arbitrary" before they solve for $x$), or a
 * derivation in propositional logic (where almost nobody says "let $P$ and
 * $Q$ be arbitrary propositions" before they write a propositional proof).
 * There are many other cases where symbols are used without being introduced,
 * but these are just two common examples.
 * 
 * This module provides two types of functionality.  First, while scoping
 * information (including implicit symbol declarations and scoping error
 * feedback) is stored in the attributes of {@link LogicConcept LogicConcepts},
 * and thus there is really no strict need for an API to manipulate such data,
 * an API makes it easier, more readable, and less error-prone.  So we provide
 * the following functions to that end.
 * 
 *  * For manipulating implicit symbol declaration data:
 *     * {@link module:Scoping.implicitDeclarations implicitDeclarations()}
 *     * {@link module:Scoping.addImplicitDeclaration addImplicitDeclaration()}
 *     * {@link module:Scoping.removeImplicitDeclaration removeImplicitDeclaration()}
 *     * {@link module:Scoping.clearImplicitDeclarations clearImplicitDeclarations()}
 *  * For manipulating feedback about scoping errors:
 *     * {@link module:Scoping.scopeErrors scopeErrors()}
 *     * {@link module:Scoping.addScopeError addScopeError()}
 *     * {@link module:Scoping.clearScopeErrors clearScopeErrors()}
 * 
 * Second, the main workhorse function of this module is to run a scope checking
 * algorithm on any given {@link Environment Environment}.  That function is
 * called {@link module:Scoping.validate validate()}, and you can read its
 * documentation for greater details.
 * 
 * Note also that this module sort of shares a name with the function
 * {@link MathConcept#scope scope()} (and its related functions) because for any
 * {@link Declaration Declaration} D, the scope of the symbols introduced in
 * that declaration is precisely `D.scope()`, as defined in
 * {@link MathConcept#scope the documentation of the scope() function}.
 * 
 * @module Scoping
 */

import { Symbol as LurchSymbol } from './symbol.js'
import { Expression } from './expression.js'
import { Declaration } from './declaration.js'
import { Environment } from './environment.js'
import { BindingEnvironment } from './binding-environment.js'
import { BindingExpression } from './binding-expression.js'

/**
 * Given a {@link LogicConcept LogicConcept} in which we wish to save some
 * data about its scoping errors, this function writes that data into the
 * appropriate attribute, merging it with any data already there.  It is
 * assumed that the scoping error data is an object containing key-value
 * pairs as is common in JSON data, and that the `newData` will be merged
 * with any old data already in the `target` using `Object.assign()`.
 * 
 * This function is made static so that any client can easily make use of
 * the same convention for storing scoping errors in a
 * {@link LogicConcept LogicConcept}, but the standard way to compute and
 * store such errors is with
 * {@link module:Scoping.validate validate()}.
 * 
 * @function
 * @param {LogicConcept} target the {@link LogicConcept LogicConcept} in
 *   which to add data about scope errors
 * @param {Object} newData an object that can be treated as JSON data, to be
 *   merged with existing scope error data in the `target`
 * 
 * @see {@link module:Scoping.scopeErrors scopeErrors()}
 * @see {@link module:Scoping.clearScopeErrors clearScopeErrors()}
 * @see {@link module:Scoping.validate validate()}
 */
export const addScopeError = ( target, newData ) => {
    target.setAttribute( 'scope errors',
        Object.assign( scopeErrors( target ) || { }, newData ) )
}

/**
 * This function reads the data stored by
 * {@link module:Scoping.addScopeError addScopeError()}.  It could just as
 * easily be done with {@link MathConcept#getAttribute getAttribute()} and
 * the appropriate key, but this API makes it easy to remain consistent if
 * the underlying data storage method were to change.
 * 
 * The result will be an object, JSON data of key-value pairs, the keys of
 * which will be the types of scoping errors, such as "invalid" for invalid
 * symbol declaratiosn or "undeclared" for variables that appear free and
 * undeclared.  If any such key is missing, there are no errors of that
 * type.
 * 
 * @function
 * @param {LogicConcept} target the {@link LogicConcept LogicConcept} from
 *   which to read the scope error data
 * @return {Object|undefined} the scope error data in the `target`, or
 *   undefined if none has been stored there
 * 
 * @see {@link module:Scoping.addScopeError addScopeError()}
 * @see {@link module:Scoping.clearScopeErrors clearScopeErrors()}
 * @see {@link module:Scoping.validate validate()}
 */
export const scopeErrors = target => {
    return target.getAttribute( 'scope errors' )
}

/**
 * This function clears any data stored by
 * {@link module:Scoping.addScopeError addScopeError()}.  It could just as
 * easily be done with {@link MathConcept#clearAttributes clearAttributes()}
 * and the appropriate key, but this API makes it easy to remain consistent
 * if the underlying data storage method were to change.
 * 
 * After this function has been run on the `target`, the result of
 * {@link module:Scoping.scopeErrors scopeErrors()} for that same target is
 * guaranteed to be undefined.
 * 
 * @function
 * @param {LogicConcept} target the {@link LogicConcept LogicConcept} from
 *   which to remove the scope error data
 * 
 * @see {@link module:Scoping.scopeErrors scopeErrors()}
 * @see {@link module:Scoping.clearScopeErrors clearScopeErrors()}
 * @see {@link module:Scoping.validate validate()}
 */
export const clearScopeErrors = target => {
    target.clearAttributes( 'implicitly declares' )
    target.clearAttributes( 'scope errors' )
    target.children().forEach( clearScopeErrors )
}

/**
 * Given a {@link LogicConcept LogicConcept} in which we wish to mark some
 * symbols as implicitly declared, this function writes that data into the
 * appropriate attribute, merging it with any data already there.  It is
 * assumed that the implicit symbol declaration data is an array of symbol
 * names, and that the new symbol given here is to be appended to the end of
 * that array, if and only if it wasn't already on the array.
 * 
 * This function is made static so that any client can easily make use of
 * the same convention for storing implicit declarations in a
 * {@link LogicConcept LogicConcept}, but the standard way to compute and
 * store such errors is by passing an implicit symbol declaration handler
 * to {@link module:Scoping.validate validate()}.
 * 
 * @function
 * @param {LogicConcept} target the {@link LogicConcept LogicConcept} in
 *   which to add a new implicitly declared symbol
 * @param {Object} symbolName the name of the symbol to mark implicitly
 *   declared
 * 
 * @see {@link module:Scoping.implicitDeclarations implicitDeclarations()}
 * @see {@link module:Scoping.validate validate()}
 */
export const addImplicitDeclaration = ( target, symbolName ) => {
    target.setAttribute( 'implicitly declares', Array.from( new Set( [
        ...( implicitDeclarations( target ) || [ ] ),
        symbolName
    ] ) ) )
}

/**
 * Given a {@link LogicConcept LogicConcept} in which we have marked some
 * symbols as implicitly declared, this function modifies data in the target,
 * removing the given symbol from the implicitly declared list in the target.
 * If it isn't already there, this function takes no action.
 * 
 * This function is made static so that any client can easily make use of
 * the same convention for storing implicit declarations in a
 * {@link LogicConcept LogicConcept}, but the standard way to compute and
 * store such errors is by passing an implicit symbol declaration handler
 * to {@link module:Scoping.validate validate()}.
 * 
 * @function
 * @param {LogicConcept} target the {@link LogicConcept LogicConcept} from
 *   which to remove the implicitly declared symbol
 * @param {Object} symbolName the name of the symbol to remove
 * 
 * @see {@link module:Scoping.implicitDeclarations implicitDeclarations()}
 * @see {@link module:Scoping.validate validate()}
 */
export const removeImplicitDeclaration = ( target, symbolName ) => {
    if ( !target.hasAttribute( 'implicitly declares' ) ) return // efficiency
    const newList = ( implicitDeclarations( target ) || [ ] )
        .filter( x => x != symbolName )
    if ( newList.length > 0 )
        target.setAttribute( 'implicitly declares', newList )
    else
        clearImplicitDeclarations( target )
}

/**
 * This function reads the data stored by
 * {@link module:Scoping.addImplicitDeclaration addImplicitDeclaration()}.  It
 * could just as easily be done with
 * {@link MathConcept#getAttribute getAttribute()} and the appropriate key,
 * but this API makes it easy to remain consistent if the underlying data
 * storage method were to change.
 * 
 * The result will be an array of symbol names, possibly empty if no symbols
 * are implicitly declared in the `target`.
 * 
 * @function
 * @param {LogicConcept} target the {@link LogicConcept LogicConcept} from
 *   which to read the implicit symbol declaration data
 * @return {Array|undefined} the implicit symbol declaration data in the
 *   `target`, or undefined if none has been stored there
 * 
 * @see {@link module:Scoping.addImplicitDeclaration addImplicitDeclaration()}
 * @see {@link module:Scoping.validate validate()}
 */
export const implicitDeclarations = target => {
    return target.getAttribute( 'implicitly declares' )
}

/**
 * This function clears any data stored by
 * {@link module:Scoping.addScopeError addScopeError()}.  It could just as
 * easily be done with {@link MathConcept#clearAttributes clearAttributes()}
 * and the appropriate key, but this API makes it easy to remain consistent
 * if the underlying data storage method were to change.
 * 
 * After this function has been run on the `target`, the result of
 * {@link module:Scoping.scopeErrors scopeErrors()} for that same target is
 * guaranteed to be undefined.
 * 
 * @function
 * @param {LogicConcept} target the {@link LogicConcept LogicConcept} from
 *   which to remove the scope error data
 * 
 * @see {@link module:Scoping.scopeErrors scopeErrors()}
 * @see {@link module:Scoping.clearScopeErrors clearScopeErrors()}
 * @see {@link module:Scoping.validate validate()}
 */
export const clearImplicitDeclarations = target => {
    target.clearAttributes( 'implicitly declares' )
    target.children().forEach( clearImplicitDeclarations )
}

/**
 * Refer to the documentation at the top of this page for information on what
 * scoping is in general.  This function is the main workhorse that validates
 * symbol scoping inside an arbitrary {@link Environment Environment}.  It will
 * typically be called on the topmost environment provided as input to Lurch, so
 * that all symbols in the entire input have been analyzed for where their
 * scopes begin and end.
 * 
 * This function can be called in two ways.  First, it can be called with just
 * one argument, in which case only the following tasks are done:
 * 
 *  * Any symbol declaration (by a {@link BindingEnvironment BindingEnvironment}
 *    or a {@link Declaration Declaration}) that declares a symbol $x$ while
 *    sitting in the scope of some other declaration of the same symbol $x$ is
 *    {@link module:Scoping.scopeErrors marked with a scoping error} of the
 *    form `{ redeclared : [ 'x' ] }`.  If more than one symbol is redeclared,
 *    the array may contain multiple entries.
 *  * Any symbol $x$ bound by a {@link BindingExpression BindingExpression} in
 *    the scope of a declaration of the same symbol $x$ or another binding of
 *    the same symbol $x$ is {@link module:Scoping.scopeErrors marked with a
 *    scoping error} of the form `{ redeclared : [ 'x' ] }`.  If more than one
 *    symbol is redeclared by the binding, the array may contain multiple
 *    entries.
 *  * Any symbol $x$ used {@link MathConcept#isFree free} in an
 *    {@link Expression Expression} but not in the scope of any declaration (by
 *    a {@link BindingEnvironment BindingEnvironment} or a
 *    {@link Declaration Declaration}) is
 *    {@link module:Scoping.scopeErrors marked with a scoping error} of the form
 *    `{ undeclared : [ 'x' ] }`.  If more than one symbol is used
 *    {@link MathConcept#isFree free} and undeclared, the array may contain
 *    multiple entries.  Such an error is placed only on the first use of the
 *    symbol in any given scope; later uses of the same symbol in the same scope
 *    are not also marked.
 * 
 * Note that a single {@link LogicConcept LogicConcept} might have more than one
 * type of error.  For instance, a {@link Declaration Declaration} that attempts
 * to re-declare a symbol $x$, and whose body contains the symbols $y$ and $z$
 * free and undeclared might have an error of the form
 * `{ redeclared : [ 'x' ], undeclared : [ 'y', 'z' ] }`.
 * 
 * There are a variety of sensible ways to handle variables that are free and
 * undeclared.  On the permissive end of the spectrum, a client may wish to
 * simply ignore them, in which case the error feedback under the `undeclared`
 * headings can be ignored.  On the strict end of the spectrum, a client may
 * refuse to process input that contains free and undeclared symbols.  Such
 * clients can pay particular attention to the feedback under the `undeclared`
 * headings.  But many clients will take a middle road of some type, such as
 * treating the first use of the symbol as an implicit declaration of the
 * symbol, either at that location, or at the beginning of its parent
 * environment, or something else.
 * 
 * To help clients who wish to take this middle road, this function has an
 * optional second argument.  If a function is provided as the second argument,
 * it will be called on the first instance of every free and undeclared symbol
 * *before* the validation work described above is executed.  The function will
 * be passed two parameters at each call: the name of the symbol that appears
 * free and undeclared, and the {@link LogicConcept LogicConcept} in which it
 * appears.  These calls will take place in tree-traversal order (that is,
 * {@link MathConcept#isEarlierThan earlier nodes} first).
 * 
 * The callback function will often want to mark some
 * {@link LogicConcept LogicConcept} as the location of the implicit declaration
 * of the symbol in question.  It can do so by calling
 * {@link module:Scoping.addImplicitDeclaration addImplicitDeclaration()}.  Note
 * that an implicit declaration marked in a {@link LogicConcept LogicConcept} L
 * takes effect exactly at L, in the sense that the scope of the declaration
 * includes L itself and continues on through the rest of L's scope.
 * 
 * While callers can provide a callback function for whatever behavior they
 * desire, we also provide some pre-built callback functions, for common actions
 * the caller may desire:
 * {@link module:Scoping.declareWhenSeen declareWhenSeen()},
 * {@link module:Scoping.declareInAncestor declareInAncestor()},
 * {@link module:Scoping.declareGlobal declareGlobal()}, and
 * {@link module:Scoping.doNotDeclare doNotDeclare()}.
 * 
 * @function
 * @param {LogicConcept} target the LogicConcept in which to do the work
 * @param {Function} [callback] the handler for all symbols that are
 *   eligible for implicit declaration, as described above
 * 
 * @see {@link module:Scoping.implicitDeclarations implicitDeclarations()}
 * @see {@link module:Scoping.addImplicitDeclaration addImplicitDeclaration()}
 * @see {@link module:Scoping.clearImplicitDeclarations clearImplicitDeclarations()}
 * @see {@link module:Scoping.scopeErrors scopeErrors()}
 * @see {@link module:Scoping.addScopeError addScopeError()}
 * @see {@link module:Scoping.clearScopeErrors clearScopeErrors()}
 * @see {@link module:Scoping.declareWhenSeen declareWhenSeen()}
 * @see {@link module:Scoping.declareInAncestor declareInAncestor()}
 * @see {@link module:Scoping.declareGlobal declareGlobal()}
 * @see {@link module:Scoping.doNotDeclare doNotDeclare()}
 */
export const validate = ( target, callback ) => {
    // If the user provided a handler for symbols that are eligible for implicit
    // validation, find those symbols and call the handler on each one:
    // (Note that findUndeclaredSymbols is a private function in this module.)
    if ( callback )
        findUndeclaredSymbols( target ).forEach(
            ( [ symbolName, target ] ) => callback( symbolName, target ) )
    // Now that any desired implicit declarations are done, validate all
    // declarations (and any lack thereof), including both implicit and explicit
    // declarations:
    // (Note that validateDeclarations is a private function in this module.)
    validateDeclarations( target )
}

// Not documented because it's used only internally for this module.
// It represents a stack of scopes; e.g., [ ['x'], ['y','z'], [ ] ] represents
// an outermost parent scope with x declared, a child scope with y and z
// declared, and a grandchild scope with nothing declared in it.
class BindingStack extends Array {
    // A new BindingStack is one with exactly one empty scope
    constructor () {
        super()
        this.push( [ ] )
    }
    // A symbol is declared if it shows up in any scope in the stack
    isDeclared ( symbolName ) {
        return this.some( scope => scope.includes( symbolName ) )
    }
    // Undeclared == not declared
    isUndeclared ( symbolName ) { return !this.isDeclared( symbolName ) }
    // The current scope is the last one in the stack, so declaring always
    // pushes onto that scope.  You can do any of these types of argument:
    //  - bs.declare( symbolName )
    //  - bs.declare( symbol )
    //  - bs.declare( arrayOfEitherOfThose )
    declare ( arg ) {
        if ( arg instanceof Array )
            arg.forEach( entry => this.declare( entry ) )
        else if ( arg instanceof LurchSymbol )
            this.declare( arg.text() )
        else
            this.last().push( arg )
    }
    // Make it easy to ensure that pushes and pops are always paired.
    // If you want to do something inside a scope, just pass it as a callback
    // to this function.  Then you never push or pop, and you ensure they are
    // always paired.
    callInNewScope ( scope, func ) {
        this.push( scope )
        const result = func()
        this.pop()
        return result
    }
    // At the given location, if any of the given names were already declared,
    // mark them redeclared there.
    markIfRedeclared ( location, names ) {
        const redeclared = names.filter( name => this.isDeclared( name ) )
        if ( redeclared.length > 0 )
            addScopeError( location, { redeclared } )
    }
    // At the given location, if any of the given names were undeclared,
    // mark them as such.
    markIfUndeclared ( location, names ) {
        const undeclared = names.filter( name => this.isUndeclared( name ) )
        if ( undeclared.length > 0 )
            addScopeError( location, { undeclared } )
    }
}

// Phase 1: Record where symbols are implicitly declared.
// We return an array of length-2 arrays, each of the form
//   [ 'symbol name', the LC that implicitly declares it ],
// in isEarlierThan order of the implicit declaration LCs.
const findUndeclaredSymbols = ( location, scopeStack = new BindingStack ) => {
    if ( location instanceof Environment ) {
        // Recur inside environments, but if they're binding
        // environments, then use a new layer on the scope stack
        return scopeStack.callInNewScope(
            location instanceof BindingEnvironment ?
                location.boundSymbolNames() : [ ],
            () => location.children().map( child =>
                findUndeclaredSymbols( child, scopeStack ) )
        ).flat( 1 )
    } else if ( location instanceof Expression ) {
        // Notice any implicit declarations in expressions.
        // This is the main point of this phase.
        const result = [ ]
        location.freeSymbolNames().forEach( symbolName => {
            if ( scopeStack.isUndeclared( symbolName ) ) {
                result.push( [ symbolName, location ] )
                scopeStack.declare( symbolName )
            }
        } )
        return result
    } else if ( location instanceof Declaration ) {
        // Note any declared variables and process any declaration body.
        scopeStack.declare( location.symbols() )
        return location.body() ?
            findUndeclaredSymbols( location.body(), scopeStack ) : [ ]
    }
}

// Phase 3: Validate declarations of all types.
// Require that all variables are explicitly declared somewhere
// (which can include _implicitlyDeclares attributes).
// Now, the actual function that recursively marks all scoping errors:
const validateDeclarations = ( location, scopeStack = new BindingStack ) => {
    const implicitHere = implicitDeclarations( location ) || [ ]
    if ( location instanceof Environment ) {
        // The only possible error is that a binding environment might
        // attempt to redeclare some already-declared symbol:
        const explicitHere = location instanceof BindingEnvironment ?
            location.boundSymbolNames() : [ ]
        const declaredHere = [ ...explicitHere, ...implicitHere ]
        scopeStack.markIfRedeclared( location, declaredHere )
        // Now just recur inside, while extending the scope stack:
        scopeStack.callInNewScope(
            declaredHere,
            () => location.children().forEach( 
                child => validateDeclarations( child, scopeStack ) )
        )
    } else if ( location instanceof Expression ) {
        // Three possible types of errors:
        // 1. Invalid implicit declarations (which happens only if the
        // implicit declaration callbacks are erroneous! Let's hope not!)
        scopeStack.markIfRedeclared( location, implicitHere )
        scopeStack.declare( implicitHere )
        // 2. Undeclared variables, which happens only if the user has
        // chosen an implicit declaration method that doesn't handle
        // every case, and some symbols got left undeclared.
        scopeStack.markIfUndeclared( location, location.freeSymbolNames() )
        // 3. Bound variables that were already bound/declared in our context.
        // Mark any such as a redeclaration.
        validateBindingExpressions( location, scopeStack )
    } else if ( location instanceof Declaration ) {
        // Two possible types of errors:
        // 1. Same as the type for Binding Environments, above.
        const explicitHere = location.symbols().map( s => s.text() )
        scopeStack.markIfRedeclared( location, explicitHere )
        scopeStack.declare( explicitHere )
        // 2. Same as type 1. for Expressions, above.
        scopeStack.markIfRedeclared( location, implicitHere )
        scopeStack.declare( implicitHere )
        // Recur on the body, if there is one.
        if ( location.body() )
            validateDeclarations( location.body(), scopeStack )
    }
}

// Utility function for use in Phase 3, above:
// Find all binding expressions inside an outermost expression (including the
// outermost expression itself) and if any bind a symbol that's declared or
// bound outside the binding expression, mark it as a redeclaration.
const validateBindingExpressions = ( location, scopeStack ) => {
    if ( location instanceof BindingExpression ) {
        // This is a binding expression, so anything bound here that was
        // already declared or bound in the enclosing scope is a problem:
        const boundHere = location.boundSymbolNames()
        scopeStack.markIfRedeclared( location, boundHere )
        // Recur inside this binding expression, extending the scope stack:
        scopeStack.callInNewScope(
            boundHere,
            () => validateBindingExpressions( location.body(), scopeStack )
        )
    } else {
        // This is not a binding expression, so no problems can arise at this
        // exact node.  Just check each of its children, in the same scope.
        location.children().forEach( child =>
            validateBindingExpressions( child, scopeStack ) )
    }
}

/**
 * A callback function that can be used with the
 * {@link module:Scoping.validate validate()} function, as in
 * `Scoping.validate(L,Scoping.declareWhenSeen)`.  If used in that manner,
 * for every free and undeclared symbol in `L`, this function will add an
 * implicit declaration of it at the first occurrence of that symbol in any
 * given scope.  (The {@link module:Scoping.validate validate()} routine calls
 * the callback only on the first occurrence in any given scope, so this
 * function just adds an implicit declaration every time it is called.)
 * 
 * @function
 * @param {string} symbolName the name of the symbol to implicitly declare
 * @param {LogicConcept} target the location at which the symbol appears
 *   free and undeclared
 * 
 * @see {@link module:Scoping.declareInAncestor declareInAncestor()}
 * @see {@link module:Scoping.declareGlobal declareGlobal()}
 * @see {@link module:Scoping.doNotDeclare doNotDeclare()}
 */
export const declareWhenSeen = ( symbolName, target ) =>
    addImplicitDeclaration( target, symbolName )

/**
 * A callback function that can be used with the
 * {@link module:Scoping.validate validate()} function, as in
 * `Scoping.validate(L,Scoping.declareInAncestor)`.  If used in that manner,
 * for every free and undeclared symbol in `L`, this function will add an
 * implicit declaration of it at the smallest enclosing
 * {@link Environment Environment} in which the symbol was used free and
 * undeclared.  This behavior is complex enough that it bears illustrating
 * with a few examples.
 * 
 * **Example 1:** If the symbol appears free and undeclared in only one
 * expression, then that expression's parent environment is the one in which
 * it will be marked implicitly declared.
 * 
 * **Example 2:** If the symbol appears free and undeclared in an expression,
 * and then also in another expression that sits in an enclosing environment
 * (an ancestor a few levels above the target), then it will be marked
 * implicitly declared in that outer, ancestor environment, and not anywhere
 * else.  Because the implicit declaration acts as a declaration at the start
 * of the enclosing ancestor, its scope includes all the descendants,
 * including both expressions in which it appears free and undeclared.
 * 
 * **Example 3:** If the symbol appears free and undeclared twice, once in an
 * expression in an environment $E_1$ and the other time in an expression in
 * an environment $E_2$, and both $E_1$ and $E_2$ are children of the same
 * parent, then implicit declarations will be added to both $E_1$ and $E_2$,
 * because they are each the smallest enclosing environment for the free and
 * undeclared instance of the symbol within them.
 * 
 * @function
 * @param {string} symbolName the name of the symbol to implicitly declare
 * @param {LogicConcept} target the location at which the symbol appears
 *   free and undeclared
 * 
 * @see {@link module:Scoping.declareWhenSeen declareWhenSeen()}
 * @see {@link module:Scoping.declareGlobal declareGlobal()}
 * @see {@link module:Scoping.doNotDeclare doNotDeclare()}
 */
export const declareInAncestor = ( symbolName, target ) => {
    // this should happen only in pathological cases used in testing,
    // but just in case, we check it here:
    if ( !target.parent() ) return
    // if some ancestor already has it implicitly declared, do nothing
    if ( target.hasAncestorSatisfying( anc =>
            ( implicitDeclarations( anc ) || [ ] ).includes( symbolName ) ) )
        return
    // since we will be declaring it inside our own nearest environment
    // ancestor, if any earlier sibling declared it more deeply down in the LC
    // tree, remove that declaration, since ours will supercede it
    const earlierSiblings = target.parent().children().slice(
        0, target.indexInParent() )
    earlierSiblings.descendantsSatisfying( d => d instanceof Environment )
        .forEach( e => removeImplicitDeclaration( e, symbolName ) )
    // okay, now do our own declaration
    addImplicitDeclaration( target.parent(), symbolName )
}

/**
 * A callback function that can be used with the
 * {@link module:Scoping.validate validate()} function, as in
 * `Scoping.validate(L,Scoping.declareGlobal)`.  If used in that manner, for
 * every free and undeclared symbol in `L`, this function will add an implicit
 * declaration of it at the top-level ancestor (the "global" scope) for each
 * free and undeclared symbol.  Each symbol is added only once to that global
 * scope, because implicit symbol declaration lists are actually sets, not
 * lists.
 * 
 * @function
 * @param {string} symbolName the name of the symbol to implicitly declare
 * @param {LogicConcept} target the location at which the symbol appears
 *   free and undeclared
 * 
 * @see {@link module:Scoping.declareWhenSeen declareWhenSeen()}
 * @see {@link module:Scoping.declareInAncestor declareInAncestor()}
 * @see {@link module:Scoping.doNotDeclare doNotDeclare()}
 */
export const declareGlobal = ( symbolName, target ) => {
    const topLevelAncestor = target.ancestorsSatisfying(
        anc => !anc.parent() )[0]
    addImplicitDeclaration( topLevelAncestor, symbolName )
}

/**
 * A callback function that can be used with the
 * {@link module:Scoping.validate validate()} function, as in
 * `Scoping.validate(L,Scoping.doNotDeclare)`.  Because this function does
 * absolutely nothing, that code is equivalent to calling
 * `Scoping.validate(L)`, but we provide this function for those times when
 * the caller wishes to make it obvious, in the code, that implicit
 * declarations are being expressly omitted.
 * 
 * @function
 * @see {@link module:Scoping.declareWhenSeen declareWhenSeen()}
 * @see {@link module:Scoping.declareInAncestor declareInAncestor()}
 * @see {@link module:Scoping.declareGlobal declareGlobal()}
 */
export const doNotDeclare = () => { }


// Export public API only:
export default {
    validate,
    scopeErrors, addScopeError, clearScopeErrors,
    implicitDeclarations, addImplicitDeclaration, clearImplicitDeclarations,
    declareWhenSeen, declareInAncestor, declareGlobal, doNotDeclare
}
