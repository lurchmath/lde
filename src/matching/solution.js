
import { Binding } from "../binding.js"
import { Symbol } from "../symbol.js"
import { metavariable } from "./metavariables.js"
import { Problem } from "./problem.js"
import { CaptureConstraints } from "./capture-constraint.js"

/**
 * A Solution is a set of {@link Substitution Substitutions}, together with
 * some other data that helps apply them efficiently.  It can be applied to a
 * {@link LogicConcept LogicConcept}, which means that it will apply all of
 * its {@link Substitution Substitutions} simultaneously to that
 * {@link LogicConcept LogicConcept}.
 * 
 * A Solution is so named because it can be used to store the solution for a
 * matching {@link Problem Problem}.  Hence the {@link Problem Problem} class
 * provides methods for computing sets of Solutions, and the constructor for
 * this class expects a given {@link Problem Problem}, from which it computes
 * and caches information that will improve its own efficiency.  See the
 * methods below for details.
 */
export class Solution {

    /**
     * Construct an empty Solution object for the given `problem`.  Extend it
     * later with the {@link Solution#add add()} or
     * {@link Solution#plus plus()} method.
     * 
     * @param {Problem} problem the problem for which the contructed object is
     *   to be the solution.  The newly constructed object is not yet a
     *   solution to the given `problem`, but caches several data about the
     *   problem so that it is prepared to grow into a solution for it later.
     *   Those data include the `problem`'s
     *   {@link module:Metavariables.metavariable metavariables} and
     *   {@link CaptureConstraints CaptureConstraints}.
     * @param {boolean} skip Clients should not use this parameter; it is for
     *   internal use only, to make copying Solution objects more efficient.
     * 
     * @see {@link Solution#add add()}
     * @see {@link Solution#plus plus()}
     */
    constructor ( problem, skip = false ) {
        // Ensure this object is created from a real Problem instance:
        if ( !( problem instanceof Problem ) )
            throw new Error(
                'Solution constructor requires a Problem instance' )
        this._problem = problem

        // Compute data from the problem only if requested to do so:
        if ( !skip ) {
            const pats = problem.constraints.map(
                constraint => constraint.pattern )
            this._captureConstraints = new CaptureConstraints( ...pats )
            this._metavariables = new Set( pats.map( pattern =>
                pattern.descendantsSatisfying( d => d.isA( metavariable ) )
                       .map( d => d.text() )
            ).flat( 1 ) )
            this._bound = new Set( pats.map( pattern =>
                pattern.descendantsSatisfying( d => d instanceof Binding )
                       .map( b => b.boundVariables()
                                   .filter( v => v.isA( metavariable ) )
                                   .map( mv => mv.text() ) )
            ).flat( 2 ) )
        }

        // We initialize an empty member here, but it is an important one, so
        // we document its format.  The _substitutions object is as follows:
        // Each key is a metavariable name, as a string.
        // Each value is an object containing:
        //  - key "substitution" mapping to a Substitution instance whose
        //    metavariable is the one in question
        //    (This isn't redundant; the original key is for fast lookup.)
        //  - key "metavariables" mapping to the list of metavariables
        //    appearing in the Expression, for faster substitution
        //  - key "original" mapping to a boolean that is true iff the
        //    metavariable for this substitution was one of the originals
        //    in the problem
        this._substitutions = { }
    }

    /**
     * Create a copy of this object.  It is not strictly a shallow copy or a
     * deep copy; it has the following properties.
     * 
     *  * It keeps the same {@link Substitution Substitution} instances
     *    internally, since these are typically immutable objects anyway, but
     *    it creates its own set of those instances, so that adding or
     *    removing entries changes only the copy.
     *  * It makes a copy of the {@link CaptureConstraints CaptureConstraints}
     *    set, but as documented in that class, such copies are shallow.
     *  * It uses the same metavariable and bound metavariable sets as in the
     *    original object, because those members do not change throughout the
     *    lifetime of a Solution.
     */
    copy () {
        // Pass skip=true to avoid computing data we're about to provide:
        const result = new Solution( this._problem, true )
        // Now provide that data:
        for ( let metavariable in this._substitutions ) {
            if ( this._substitutions.hasOwnProperty( metavariable ) ) {
                const innerObject = this._substitutions[metavariable]
                result._substitutions[metavariable] = {
                    substitution : innerObject.substitution,
                    metavariables : innerObject.metavariables,
                    original : innerObject.original
                }
            }
        }
        result._captureConstraints = this._captureConstraints.copy()
        result._metavariables = this._metavariables
        result._bound = this._bound
        // Done, return the copy:
        return result
    }

    /**
     * Look up the {@link Expression Expression} to which this Solution maps
     * the given metavariable, and return it (or undefined if there isn't
     * one).  Recall that Solutions function as sets of
     * {@link Substitution Substitutions}, that is, as a set of ordered pairs,
     * and thus as a (partial) function.  This method is therefore just
     * (partial) function application.
     * 
     * @param {Symbol|String} metavariable a metavariable (or just the name of
     *   a metavariable) to be looked up in this Solution
     * @return {[Expression]} the {@link Expression Expression} to which this
     *   Solution maps the given metavariable, or undefined if this solution
     *   does not map the metavariable to any {@link Expression Expression}
     */
    get ( metavariable ) {
        if ( metavariable instanceof Symbol )
            metavariable = metavariable.text()
        return this._substitutions.hasOwnProperty( metavariable ) ?
            this._substitutions[metavariable].expression : undefined
    }

    /**
     * There are three reasons why a {@link Substitution Substitution}
     * instance may not be able to be added to a given Solution.
     * 
     *  1. If the {@link Substitution Substitution}'s metavariable already
     *     appears in the given Solution, but mapped to a different
     *     {@link Expression Expression}.  This fails because a
     *     {@link Substitution Substitution} is a function, and so it cannot
     *     map the same input to more than one output.
     *  2. If the {@link Substitution Substitution} maps a metavariable to a
     *     non-{@link Symbol Symbol}, and yet the metavariable appears as the
     *     bound variable in a quantifier.  This fails because quantifiers can
     *     bind only variables, so we cannot replace a bound metavariable with
     *     anything but another variable.
     *  3. If applying the given {@link Substitution Substitution} violates
     *     any one of the {@link CaptureConstraints CaptureConstraints} stored
     *     in this Solution.  This fails because if we later apply the
     *     Solution to the original {@link Problem Problem} from which it was
     *     created, we must variable capture, and those constraints are
     *     precisely what must be satisfied in order to do so.
     * 
     * In any of those three cases, this function returns false.  Otherwise,
     * it returns true.
     * 
     * @param {Substitution} substitution the proposed substitution to be
     *   added to this object via {@link Solution.add add()}
     * @returns {boolean} whether adding the proposed `substitution` will
     *   succeed (as opposed to throw an error)
     * 
     * @see {@link Solution.add add()}
     */
    canAdd ( substitution ) {
        const mvName = substitution.metavariable.text()
        const oldValue = this.get( mvName )
        const newValue = substitution.expression
        // Check #1: The metavariable isn't already mapped to something else
        return ( !oldValue || oldValue.equals( newValue ) )
        // Check #2: The substitution wouldn't make us try to bind a non-var
            && ( !this._bound.has( mvName ) || newValue instanceof Symbol )
        // Check #3: The substitution doesn't violate any capture constraints
            && !this._captureConstraints.constraints.some( cc =>
                cc.afterSubstituting( substitution ).violated() )
        // None of the checks failed, so this whole function returns true.
    }

    /**
     * Alter this object by removing any internal
     * {@link Substitution Substitution} whose metavariable does not appear in
     * the original {@link Problem Problem} from which this Solution was
     * constructed.
     * 
     * This is useful because some intermediate computations en route to a
     * complete solution sometimes add new metavariables, but they should not
     * be part of the final solution, since they were only part of the solving
     * process, not the actual solution.
     * 
     * @see {@link Substitution#restricted restricted()}
     */
    restrict () {
        for ( let metavariable in this._substitutions )
            if ( this._substitutions.hasOwnProperty( metavariable )
              && !this._substitutions.original )
                delete this._substitutions[metavariable]
    }

    /**
     * Return a copy of this Solution, but with
     * {@link Substitution#restrict restrict()} having been applied to the
     * copy.
     * 
     * @see {@link Substitution#restrict restrict()}
     * @see {@link Substitution#copy copy()}
     */
    restricted () {
        const result = this.copy()
        result.restrict()
        return result
    }

}
