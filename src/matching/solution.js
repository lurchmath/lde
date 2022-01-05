
import { Binding } from "../binding.js"
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
