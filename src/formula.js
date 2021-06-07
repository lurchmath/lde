
import { MathConcept } from './math-concept.js'
import { Environment } from './environment.js'

/**
 * A Formula is an {@link Environment Environment} that has not just one
 * meaning, but a potentially infinite class of meanings, by virtue of
 * substitution.  For a mathematical example, when we state the principle of
 * mathematical induction about some statement $P(n)$, we do not mean that the
 * principle holds only for some specific statement called $P(n)$, but rather
 * for any statement about a natural number, which we might substitute in for
 * the generic placeholder $P$.
 * 
 * In logic, this is sometimes referred to as the distinction between an axiom
 * and an axiom scheme.  If an {@link Environment Environment} might be used
 * as an axiom then a Formula can be used as an axiom scheme.
 * 
 * The rules for how we can substitute into a Formula to produce instances of
 * it are not yet written here; this class is just a placeholder and we will
 * return to complete both its implementation and its documentation at a
 * future time.
 */
export class Formula extends Environment {
    
    static className = MathConcept.addSubclass( 'Formula', Formula )

    // Class implementation not yet complete; we will return to this later.

}
