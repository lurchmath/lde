
import { MathConcept } from './math-concept.js'

/**
 * A LogicConcept is a specific type of MathConcept.  It is one that can be
 * processed by the LDE when validating the correctness of steps of a user's
 * work.  MathConcepts are more high-level, and in order to be processed by
 * the LDE, must be broken down into LogicConcepts.
 * 
 * There are three types of LogicConcepts, described only vaguley here, but
 * you can view the documentation in the appropriate subclasses for details.
 * 
 *  * An {@link Expression} is what we typically think of as a piece of
 *    mathematics--an equation, a statement, a formula, which is often
 *    enclosed in `$...$` in a LaTeX document
 *  * An {@link Environment} is any larger structure in a document that
 *    contains many expressions, such as a theorem, a proof, a section, an
 *    example, or a chain of connected equations.
 *  * A {@link Declaration} introduces a new variable or constant.  This is
 *    common in both computer programming (where many languages require us
 *    to define our variables) and in mathematics (where we say things like
 *    "Let x be an arbitrary real number" or "Let D be the constant provided
 *    by Theorem 6.1."
 */
export class LogicConcept extends MathConcept {

    static className = MathConcept.addSubclass( 'LogicConcept', LogicConcept )

    /**
     * Constructs a LogicConcept from the given list of children, which may
     * be empty.  All children must also be instances of LogicConcept; those
     * that are not are filtered out.
     * 
     * Newly constructed LogicConcept instances (unlike MathConcepts) are
     * marked dirty by default, indicating that they probably need validation.
     * 
     * @param  {...LogicConcept} children child LogicConcepts to be added to
     *   this one (as in the constructor for {@link MathConcept})
     */
    constructor ( ...children ) {
        super( ...children.filter( child => child instanceof LogicConcept ) )
        this.markDirty()
    }

    /**
     * Overrides the behavior in {@link MathConcept#markDirty the parent class},
     * where the default behavior is to propagate dirtiness up to ancestors,
     * whereas we do not want that here.  The reason is that MathConcepts use
     * the dirty flag to indicate whether they need to have their interpretation
     * recomputed, but LogicConcepts use the dirty flag to indicate whether they
     * need to have their validation recomputed.  Interpretation tends to depend
     * on the interpretation of children, whereas validation does not.
     * 
     * @param {boolean} [on=true] same meaning as in
     *   {@link MathConcept#markDirty the parent class}
     * @param {boolean} [propagate=false] same meaning as in
     *   {@link MathConcept#markDirty the parent class}, except the default is
     *   now false
     */
    markDirty ( on = true, propagate = false ) {
        super.markDirty( on, propagate )
    }

}
