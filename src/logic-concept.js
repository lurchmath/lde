
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
 *  * An {@link Expression Expression} is what we typically think of as a
 *    piece of mathematics--an equation, a statement, a formula, which is
 *    often enclosed in `$...$` in a LaTeX document
 *  * An {@link Environment Environment} is any larger structure in a
 *    document that contains many expressions, such as a theorem, a proof,
 *    a section, an example, or a chain of connected equations.
 *  * A {@link Declaration Declaration} introduces a new variable or constant.
 *    This is common in both computer programming (where many languages
 *    require us to define our variables) and in mathematics (where we say
 *    things like "Let x be an arbitrary real number" or "Let D be the
 *    constant provided by Theorem 6.1."
 */
export class LogicConcept extends MathConcept {

    static className = MathConcept.addSubclass( 'LogicConcept', LogicConcept )

}
