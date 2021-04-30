
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
        this._origin = null
        this._feedbackEnabled = true
        this._feedbackQueue = [ ]
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

    //////
    //
    //  Feedback functions
    //
    //////

    /**
     * Many LogicConcept instances will be created by interpreting a
     * MathConcept, and breaking it down into smaller, simpler parts, expressed
     * as LogicConcepts.  We will typically want to track, for any given
     * LogicConcept, which MathConcept it came from, in that sense.  This
     * function returns that value.
     * 
     * There is no corresponding setter function, because it is not expected
     * that clients should be changing the origin of a LogicConcept.  Later,
     * when we implement interpretation of MathConcepts into LogicConcepts,
     * we will populate this value in that code.
     * 
     * @returns {MathConcept} the object whose interpretation led to the
     *   construction of this LogicConcept
     */
    origin () { return _origin }

    /**
     * This method does one of two things, depending on whether feedback for
     * this instance is enabled, which can be customized using
     * {@link LogicConcept#enableFeedback enableFeedback()}.
     * 
     * If feedback is enabled and this object has an
     * {@link LogicConcept#origin origin()}, then this method just calls the
     * {@link MathConcept#feedback feedback()} method in that origin, with the
     * same parameter.  The reason for this is that feedback to the LDE about
     * a LogicConcept should always be mediated through the MathConcept that
     * gave rise to that LogicConcept.
     * 
     * If feedback is disabled, then the feedback given as the parameter will
     * be stored in a feedback queue, which can be discarded or flushed later,
     * using {@link LogicConcept#enableFeedback enableFeedback()}.
     * 
     * Note that there is no third option; if feedback is enabled, but this
     * object has no {@link LogicConcept#origin origin()}, then there is no
     * way for this object to send the requested feedback, so this method will
     * take no action.
     * 
     * @param {Object} feedbackData - Any data that can be encoded using
     *   `JSON.stringify()` (or
     *   {@link predictableStringify predictableStringify()}), to be transmitted
     * @see {@link MathConcept.feedback MathConcept static feedback() method}
     * @see {@link MathConcept#feedback MathConcept feedback() method for instances}
     */
    feedback ( feedbackData ) {
        if ( this._feedbackEnabled && this._origin instanceof MathConcept ) {
            this._origin.feedback( feedbackData )
        } else {
            this._feedbackQueue.push( feedbackData )
        }
    }

    /**
     * Enable or disable feedback, optionally flushing the queue of any old,
     * stored feedback from when feedback was disabled.
     * 
     * To understand what it means for feedback to be enabled or disabled,
     * see the documentation for {@link LogicConcept#feedback feedback()}.
     * 
     * @param {boolean} enable - whether to enable feedback (if true) or
     *   disable it (if false)
     * @param {boolean} flushQueue - when enabling feedback, there may be
     *   a backlog of old feedback that was stored (and not sent) when
     *   feedback was disabled.  If this parameter is true, then that
     *   backlog of old feedback is all sent immediately, in the same
     *   order it was enqueued.  If this parameter is false, then taht
     *   backlog of old feedback is discarded.
     * @see {@link LogicConcept#feedback feedback()}
     */
    enableFeedback ( enable = true, flushQueue = false ) {
        this._feedbackEnabled = enable
        if ( this._feedbackEnabled && flushQueue )
            this._feedbackQueue.map( data => this.feedback( data ) )
        this._feedbackQueue = [ ]
    }

}
