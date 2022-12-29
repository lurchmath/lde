
import { Symbol as LurchSymbol } from '../symbol.js'
import { Application } from "../application.js"
import { BindingExpression } from "../binding-expression.js"
import { LogicConcept } from "../logic-concept.js"
import { metavariable, metavariableNamesIn } from "./metavariables.js"
import { Constraint } from "./constraint.js"
import { Substitution } from "./substitution.js"
import { Solution } from "./solution.js"
import {
    constantEF, projectionEF, applicationEF, fullBetaReduce, alphaRenamed
} from './expression-functions.js'
import { NewSymbolStream } from "./new-symbol-stream.js"

/**
 * This class expresses a matching problem, that is, a set of matching
 * {@link Constraint Constraints}, and includes an algorithm for solving them
 * simultaneously, producing a list of {@link Solution Solutions} (which may
 * be empty).  For more information on the concept of matching in general,
 * see {@link module:Matching the documentation for the Matching module}.
 */
export class Problem {

    /**
     * Construct a new matching problem with no constraints in it.  Then, if any
     * argument are provided, they are passed directly to the
     * {@link Problem#add add()} function.  See its documentation for how they
     * are processed.
     * 
     * @param {...any} args constraints to add to this problem after its
     *   construction, in a wide variety of forms, as documented in this class's
     *   {@link Problem#add add()} function
     * 
     * @see {@link Problem#add add()}
     */
    constructor ( ...args ) {
        this.constraints = [ ]
        this.add( ...args )
    }

    /**
     * Add constraints to this problem.  Arguments are accepted in any of the
     * following forms.
     * 
     *  * `p.add( p1, e1, p2, e2, ... )`, where `p1`,`p2`,... are patterns and
     *    `e1`,`e2`,... are expressions, as defined in the
     *    {@link Constraint Constraint} class, so that we might construct
     *    {@link Constraint Constraint} instances from them
     *  * `p.add( [ p1, e1, p2, e2, ... ] )`, same as the previous, but in array
     *    form rather than separate arguments
     *  * `p.add( [ [ p1, e1 ], [ p2, e2 ], ... ] )`, same as the previous, but
     *    as an array of pairs rather than flattened
     *  * `p.add( c1, c2, ... )`, where each of `c1`,`c2`,... is a
     *    {@link Constraint Constraint} instance
     *  * `p.add( [ c1, c2, ... ] )`, same as the previous, but in array form
     *    rather than separate arguments
     *  * `p.add( other )`, where `other` is another instance of the Problem
     *    class, and we are to add all of its constraints to `p`
     * 
     * No {@link Constraint Constraint} is added if it is already present, in
     * the sense of there being an {@link Constraint#equals equal Constraint}
     * already stored in this object.
     * 
     * {@link Constraint Constraints} are stored internally in increasing order
     * of {@link Constraint#complexity complexity()}, and this function
     * preserves that order when adding new constraints.  This makes it easy for
     * algorithms to find an easy constraint to process, by taking the first one
     * off the internal list.
     * 
     * @param  {...any} args constraints to add to this problem, in any of the
     *   forms given above
     */
    add ( ...args ) {
        // ensure there is an args[0] to ask questions about
        if ( args.length == 0 ) return
        // if args[0] looks like a pattern, build constraints and recur on them
        if ( args[0] instanceof LogicConcept ) {
            for ( let i = 0 ; i < args.length - 1 ; i += 2 )
                this.add( new Constraint( args[i], args[i+1] ) )
            return
        }
        // if args[0] is an array, there are many possibilities:
        if ( args[0] instanceof Array ) {
            // ensure non-empty
            if ( args[0].length == 0 ) return
            // if it looks like it might be p1,e1,..., or c1,c2,...,
            // handle via recursion
            if ( args[0][0] instanceof LogicConcept
              || args[0][0] instanceof Constraint ) {
                this.add( ...args[0] )
                return
            }
            // if it looks like it might be [p1,e1],..., also recur, flattening
            if ( args[0][0] instanceof Array ) {
                this.add( ...args[0].flat() )
                return
            }
            // else invalid arguments
            throw 'Cannot add this type of data to a Problem'
        }
        // all that's left is to add Constraint instances; this is the main
        // workhorse part of this function, to which all other cases devolve
        args.forEach( constraint => {
            // can add only constraints, and only if we don't already have it
            if ( !( constraint instanceof Constraint ) )
                throw 'Cannot add this type of data to a Problem'
            if ( this.constraints.some(
                    already => already.equals( constraint ) ) )
                return // no need to add two copies of a constraint
            // find location to insert that preserves increasing complexity
            const index = this.constraints.findIndex( already =>
                already.complexity() >= constraint.complexity() )
            this.constraints.splice(
                index == -1 ? this.constraints.length : index, 0, constraint )
        } )
    }

    /**
     * Construct a new Problem just like this one, except with the given
     * {@link Constraint Constraints} added.  In other words, just call this
     * instance's {@link Problem#copy copy()} function, and then call
     * {@link Problem#add add()} in the copy, then return the new object.
     * 
     * @param  {...any} args the constraints to add to the problem, in any of
     *   the forms supported by the {@link Problem#add add()} function
     * @returns {Problem} a new problem instance equal to this one plus the new
     *   constraints specified as arguments
     */
    plus ( ...args ) {
        const result = this.copy()
        result.add( ...args )
        return result
    }

    /**
     * Most clients will not call this function; it is mostly for internal use.
     * Various algorithms within this class occasionally need to remove a
     * constraint, and this function is used to do so.
     * 
     * @param {integer|Constraint} toRemove the caller can provide an integer
     *   between 0 and this problem's length minus 1, inclusive, to have this
     *   function remove the constraint at that index; or the caller can provide
     *   a {@link Constraint Constraint} instance, and this function will remove
     *   any constraint equal to that one, if this Problem contains such a copy
     * 
     * @see {@link Problem#add add()}
     * @see {@link Problem#empty empty()}
     */
    remove ( toRemove ) {
        if ( toRemove instanceof Constraint )
            toRemove = this.constraints.findIndex( constraint =>
                constraint.equals( toRemove ) )
        if ( /^\d+$/.test( toRemove ) && toRemove < this.length )
            this.constraints.splice( toRemove, 1 )
    }

    /**
     * Construct a new Problem just like this one, except with the constraint at
     * the given index removed.  In other words, just call this instance's
     * {@link Problem#copy copy()} function, and then call
     * {@link Problem#remove remove()} in the copy, then return the new object.
     * 
     * @param {integer|Constraint} toRemove the {@link Constraint Constraint}
     *   to remove, or a copy of it, or the index of it; this argument will be
     *   passed directly to {@link Problem.remove remove()}, so see the
     *   documentation there for details
     * @returns {Problem} a new problem instance equal to this one minus the
     *   constraint at the given index
     */
    without ( toRemove ) {
        const result = this.copy()
        result.remove( toRemove )
        return result
    }

    /**
     * The length of a problem is the number of constraints in it.  Note that
     * as a problem is solved, the algorithm successively removes constraints as
     * it satisfies them (sometimes replacing them with one or more simpler
     * ones), so this value may change over time, up or down.
     * 
     * @returns {integer} the number of constraints in this problem
     * 
     * @see {@link Problem#empty empty()}
     */
    get length () {
        return this.constraints.length
    }

    /**
     * Is this problem empty?  That is, does it have zero constraints?  Return
     * true if so, false otherwise
     * 
     * @returns {boolean} whether this problem is empty (no constraints)
     * 
     * @see {@link Problem#length length}
     */
    empty () {
        return this.constraints.length == 0
    }

    /**
     * Create a shallow copy of this object, which will include a shallow copy
     * of its constraint set.
     * 
     * @returns {Problem} a shallow copy of this object
     */
    copy () {
        const result = new Problem()
        result.constraints = this.constraints.slice()
        if ( this._stream )
            result._stream = this._stream.copy()
        result._debug = this._debug
        return result
    }

    /**
     * Equality of two problems is determined solely by the content of their
     * constraint sets.  This function returns true if and only if the set of
     * constraints is the same in both problems.
     * 
     * @param {Problem} other another instance of the Problem class with which
     *   to compare this one
     * @returns {boolean} whether the two instances are equal
     */
    equals ( other ) {
        if ( this.constraints.length != other.constraints.length ) return false
        return this.constraints.every( c1 =>
            other.constraints.some( c2 => c1.equals( c2 ) ) )
    }

    /**
     * Alter this object by applying the given
     * {@link Substitution Substitutions} to it, in-place.
     * {@link Constraint Constraints} in this Problem whose patterns contain any
     * of the metavariables on the LHS of any of the given
     * {@link Substitution Substitutions} will be replaced with new
     * {@link Constraint Constraints} whose patterns have been altered by those
     * {@link Substitution Substitutions}.
     * 
     * @param  {...Substitution|...Substitution[]} subs one or more
     *   substitutions to apply to this Problem, or Arrays of substitutions
     * 
     * @see {@link Problem#afterSubstituting afterSubstituting()}
     */
    substitute ( ...subs ) {
        // save the capture constraints for processing later
        const savedCache = this._captureConstraints
        // flatten arrays of substitutions into the main list
        subs = subs.flat()
        // figure out which constraints in this object actually need processing
        const metavars = subs.map( s => s.metavariable.text() )
        const toReplace = this.constraints.filter( c =>
            c.pattern.hasDescendantSatisfying( d =>
                ( d instanceof LurchSymbol ) && metavars.includes( d.text() )
             && d.isA( metavariable ) ) )
        if ( toReplace.length > 0 ) {
            // remove those constraints
            toReplace.forEach( c => this.remove( c ) )
            // compute new patterns for each one by doing substitutions
            const patternsWrapper = new Application(
                ...toReplace.map( c => c.pattern.copy() ) )
            subs.forEach( s => s.applyTo( patternsWrapper ) )
            // add the new constraints built from the new patterns, same expressions
            for ( let i = 0 ; i < patternsWrapper.numChildren() ; i++ )
                this.add( new Constraint( patternsWrapper.child( i ),
                                          toReplace[i].expression ) )
        }
        // now restore and process the capture constraints
        if ( savedCache ) {
            savedCache.constraints.forEach( cc =>
                subs.forEach( sub => sub.applyTo( cc ) ) )
            this._captureConstraints = savedCache
        }
    }

    /**
     * This function behaves the same as
     * {@link Problem#substitute substitute()}, except that it works on and
     * returns a copy of the Problem, rather than altering the original.
     * 
     * @param  {...Substitution|...Substitution[]} subs one or more
     *   substitutions to apply, or Arrays of substitutions
     * 
     * @see {@link Problem#substitute substitute()}
     */
    afterSubstituting ( ...subs ) {
        const result = this.copy()
        result.substitute( ...subs )
        return result
    }

    /**
     * The string representation of a Problem is simply the comma-separated list
     * of string representations of its {@link Constraint Constraints},
     * surrounded by curly brackets to suggest a set.  For example, it might be
     * "{(A,(- x)),(B,(+ 1 t))}" or "{}".
     * 
     * @returns {string} a string representation of the Problem, useful in
     *   debugging
     * 
     * @see {@link Constraint#toString toString() for individual Constraints}
     */
    toString () {
        return `{${this.constraints.map(x=>x.toString()).join(',')}}`
    }

    // For internal use.  Applies beta reduction to all the patterns in all the
    // problem's constraints.
    betaReduce () {
        this.constraints.slice().forEach( con => {
            const reduced = fullBetaReduce( con.pattern )
            if ( !reduced.equals( con.pattern ) ) {
                this.remove( con )
                this.add( new Constraint( reduced, con.expression ) )
            }
        } )
    }

    /**
     * Compute all solutions to this Problem instance, one at a time, using this
     * generator function.  This function implements the matching algorithm;
     * it calls an internal workhorse function, `allSolutions()`, to do the
     * heavy lifting.  Clients should first populate the Problem instance with
     * {@link Constraint Constraints} using {@link Problem#add add()}, then call
     * this function to compute the set of {@link Solution Solutions}.
     * 
     * @yields {Solution} the next solution to this Problem
     * 
     * @see {@link Problem#firstSolution firstSolution()}
     * @see {@link Problem#isSolvable isSolvable()}
     * @see {@link Problem#numSolutions numSolutions()}
     */
    *solutions () {
        const solutionsSeen = [ ]
        // Turn every bound variable into a metavariable, to simulate support
        // for alpha-equivalence during matching.  We will use a proxy Problem
        // object for this, so that our own set of metavariables (and thus
        // expected Solution domain) does not get altered.
        const stream = new NewSymbolStream(
            ...this.constraints.map( constraint => constraint.pattern ),
            ...this.constraints.map( constraint => constraint.expression )
        )
        const proxy = new Problem()
        if ( this._debug ) proxy._debug = this._debug
        this.constraints.forEach( constraint => proxy.add( new Constraint(
            this.convertAllBoundVarsToMetavars( constraint.pattern, stream ),
            constraint.expression ) ) )
        // Now compute the set of all solutions to this Problem, using the
        // *allSolutions() method of the proxy, but the metavariables list of
        // the original problem.
        const start = new Solution( proxy )
        start._metavariables = this.constraints.map(
            constraint => metavariableNamesIn( constraint.pattern )
        ).reduce( ( A, B ) => new Set( [ ...A, ...B ] ), new Set() )
        proxy.constraints.forEach( constraint => constraint.removeBindings() )
        for ( let solution of proxy.allSolutions( start ) ) {
            // Is this really a solution?  Only if no capture would occur...
            solution.restoreBindings()
            if ( solution.betaWouldCapture() ) continue
            // When we find a solution, though, yield it iff we have not seen it
            // before (nor any other solution to which it's alpha-equivalent):
            if ( !solutionsSeen.some( old => old.equals( solution ) ) ) {
                solutionsSeen.push( solution.copy() )
                yield solution
            }
        }
        // For debugging purposes, at the end, show all solutions found.
        if ( this._debug ) {
            console.log( 'Final solution set:' )
            solutionsSeen.map( ( solution, index ) =>
                console.log( `${index}. ${solution}` ) )
        }
        return
    }

    // for internal use only, by *solutions()
    convertAllBoundVarsToMetavars ( pattern, stream ) {
        // base case
        if ( pattern.isAtomic() ) return pattern.copy()
        // recursive case 1: application
        if ( pattern instanceof Application )
            return new Application(
                ...pattern.children().map( child =>
                    this.convertAllBoundVarsToMetavars( child, stream ) ) )
        // recursive case 2: binding
        if ( !( pattern instanceof BindingExpression ) )
            throw new Error( `Invalid pattern: ${pattern}` )
        const copy = pattern.copy()
        copy.body().replaceWith( this.convertAllBoundVarsToMetavars(
            copy.body(), stream ) )
        const newBoundVars = copy.boundSymbols().map( old =>
            old.isA( metavariable ) ? old :
            new LurchSymbol( `${old.text()}_${stream.next().text()}` )
                .asA( metavariable ) )
        return alphaRenamed( copy, newBoundVars )
    }
    deBruijnEncode () {
        this.constraints = this.constraints.map(
            constraint => constraint.copy() )
        this.constraints.forEach( constraint => constraint.deBruijnEncode() )
    } //

    // for internal use only, by *solutions()
    *allSolutions ( soFar ) {

        const dbg = ( ...args ) => { if ( this._debug ) console.log( ...args ) }
        dbg( `solve ${this} / ${this.constraints.map(x=>x.complexity())}` )
        dbg( `\tw/soFar = ${soFar}` )

        // We need our own personal symbol stream that will avoid all symbols in
        // this matching problem.  If we don't have one yet, create one.
        if ( !this._stream ) this._stream = new NewSymbolStream(
            ...this.constraints.map( c => c.pattern ),
            ...this.constraints.map( c => c.expression )
        )

        // If this problem is empty, the solution set contains exactly one
        // entry, the soFar solution passed to us.
        if ( this.empty() ) {
            yield soFar
            return
        }

        // But if it isn't empty, then consider the first constraint.  Note that
        // constraints are ordered so that the easiest to process come first, so
        // index 0 is the right place to start.
        const constraint = this.constraints[0]
        const complexity = constraint.complexity()

        // If that constraint says that this problem is unsolvable, stop now.
        if ( complexity == 0 ) return

        // If that constraint is already satisfied, remove it and recur on the
        // rest.  This modifies this object in place.
        if ( complexity == 1 ) {
            this.remove( 0 )
            yield* this.allSolutions( soFar )
            return
        }
        
        // If that constraint is a metavariable instantiation, remove it from
        // the problem, add it to the solution, and apply it to the remaining
        // constraints.  If doing so is impossible, stop.  Otherwise, recur on
        // what remains.
        if ( complexity == 2 ) {
            const newSub = new Substitution( constraint )
            try { soFar.add( newSub ) } catch { return }
            this.remove( 0 )
            this.substitute( newSub )
            yield* this.allSolutions( soFar.plus( newSub, false ) )
            return
        }
        
        // If that constraint is one that can be broken up into multiple,
        // smaller constraints, one for each pair of children from the pattern
        // and expression, do so, updating this problem object and recurring.
        if ( complexity == 3 ) {
            this.remove( 0 )
            this.add( ...constraint.children() )
            yield* this.allSolutions( soFar )
            return
        }

        // Finally, the complicated case.  If the constraint is an expression
        // function application case, then we may generate multiple solutions,
        // in all the ways documented below.
        if ( complexity == 4 ) {

            // We need a utility function for extending recursively computed
            // solutions with new constraints.
            const problem = this
            function* addEF ( metavar, expressionFunction ) {
                const newSub = new Substitution( metavar, expressionFunction )
                dbg( `try this EF: ${newSub}` )
                let extended
                try {
                    extended = soFar.plus( newSub )
                } catch {
                    dbg( `\tcannot add to current solution:\n\t${soFar}` )
                    return
                }
                const copy = problem.afterSubstituting( newSub )
                dbg( `gives this problem: ${copy}` )
                copy.betaReduce()
                dbg( `\t=β=>` )
                for ( let solution of copy.allSolutions( extended ) ) {
                    dbg( `recursive solution: ${solution}` )
                    yield solution.restricted()
                }
            }

            // Remove this constraint and lift out its various components,
            // because we know it is an expression function application
            // constraint.
            const head = constraint.pattern.child( 1 )
            const args = constraint.pattern.children().slice( 2 )
            const expr = constraint.expression
            // Do some quick sanity checks to be sure the structure is as
            // expected.
            if ( !head.isA( metavariable ) )
                throw 'Invalid head of expression function application'
            if ( args.length == 0 )
                throw 'Empty argument list in expression function application'

            // Solution method 1: Head instantiated with a constant function.
            dbg( '--1--' )
            yield* addEF( head, constantEF( args.length, expr ) )
            
            // Solution method 2: Head instantiated with a projection function.
            dbg( '--2--' )
            for ( let i = 0 ; i < args.length ; i++ )
                yield* addEF( head, projectionEF( args.length, i ) )
            
            // Solution method 3: If the expression is compound, we could
            // imitate each child using a different expression function,
            // combining the results into one big answer.  Because we have
            // already converted bindings to applications with removeBindings(),
            // we know this case will involve only applications.
            dbg( '--3--' )
            const children = expr.children()
            if ( children.length > 0 ) {
                const metavars = this._stream.nextN( children.length )
                    .map( symbol => symbol.asA( metavariable ) )
                yield* addEF( head, applicationEF( args.length, metavars ) )
            } else dbg( 'case 3 does not apply' )

            // Those are the only three solution methods for the EFA case.
            return
        }

        // We should never get here, because complexity should be only 0,1,2,3,
        // or 4.  So the following is just a sanity check.
        throw `Invalid value for constraint complexity: ${complexity}`
    }

    /**
     * Sometimes it is useful to just get one example solution for the
     * problem, rather than computing all solutions.  Although that can be
     * done efficiently using the {@link Problem#solutions solutions()}
     * iterator, this function is a convenience to make it easier.  It returns
     * either the first solution, as an instance of the {@link Solution
     * Solution} class, or it returns undefined if the problem has no
     * solutions.
     * 
     * Note that this function operate completely independently of the
     * {@link Problem#solutions solutions()} iterator, in that if you are
     * partway through computing the list of solutions with that iterator,
     * you can still ask for the *first* solution using this function, and it
     * will give that first solution and will have no effect on the ongoing
     * iterator.
     * 
     * Caching of solutions is not implemented for problems, so the work of
     * finding and computing the first solution is done again when you call
     * this function, even if it has been computed in the past.  One could
     * implement a cache, which would need to be invalidated by functions
     * like {@link Problem#add add()}, but that has not been done.
     * 
     * @returns {Solution} the first solution to this matching problem, or
     *   `undefined` if the problem has no solutions
     * 
     * @see {@link Problem#solutions solutions()}
     * @see {@link Problem#isSolvable isSolvable()}
     * @see {@link Problem#numSolutions numSolutions()}
     */
    firstSolution () {
        for ( let solution of this.solutions() ) return solution
    }

    /**
     * If you do not need to fetch any solutions, but rather just check to see
     * whether any exist, this function is more efficient than running the
     * full {@link Problem#solutions solutions()} iterator, which computes all
     * possible solutions.  This function returns a boolean, whether any
     * solutions exist.  Calling `P.isSolvable()` is equivalent to computing
     * `!!P.firstSolution()`, but is more readable, and more efficient than
     * computing `P.numSolutions() > 0`.
     * 
     * @returns {boolean} `true` if and only if there is at least one solution
     *   to this matching problem, and `false` otherwise
     * 
     * @see {@link Problem#solutions solutions()}
     * @see {@link Problem#firstSolution firstSolution()} (including comments about
     *   caching)
     * @see {@link Problem#numSolutions numSolutions()}
     */
    isSolvable () {
        return !!this.firstSolution()
    }

    /**
     * If you do not need the solution set, but just need to know its size,
     * call this function instead of the {@link Problem#solutions solutions()}
     * iterator.  Note that the full iterator will be traversed to compute its
     * size, which is thus the same amount of computational effort as finding
     * and returning all the solutions, so no time is saved.  This function is
     * provided for those cases where `P.numSolutions()` is more readable than
     * computing the full array of solutions and then asking for its length.
     * 
     * @returns {integer} the number of solutions to this matching problem
     * 
     * @see {@link Problem#solutions solutions()}
     * @see {@link Problem#isSolvable isSolvable()}
     * @see {@link Problem#firstSolution firstSolution()} (including comments about
     *   caching)
     */
    numSolutions () {
        return Array.from( this.solutions() ).length
    }

}
