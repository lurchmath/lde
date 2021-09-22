
import { metavariable } from './constraint.js'
import { Symbol } from '../symbol.js'

/**
 * A capture constraint is a pair of variables $(b,f)$, where the former appears
 * as a bound variable (hence the name $b$) and in its scope, the latter appears
 * free (hence the name $f$).  It is called a capture constraint because the
 * variable $f$ cannot be replaced by any expression containing $b$ free, or
 * variable capture would occur.  (The reader may recall that the standard
 * definition of variable capture is that a variable that appears free in an
 * expression becomes bound when that expression is placed in a new context,
 * typically through substitution.)
 * 
 * This class will store the $b$ and $f$ internally, but note that either of
 * them might be a metavariable.  Such metavariables are interpreted as meaning
 * "we do not yet know the value of this variable, but it will be determined
 * later, and replaced here when we determine it."  Consequently, we might have
 * a capture constraint whose meaning is still uncertain, until the
 * metavariables in it have been instantiated.  See the
 * {@link CaptureConstraint#complete complete()} function below for more
 * details.
 */
export class CaptureConstraint {

    /**
     * Construct a capture constraint $(b,f)$, as defined above, by specifying
     * the bound and free variables $b$ and $f$, in that order, as parameters.
     * Although both should be {@link Symbol Symbols}, the latter may be a
     * metavariable that is later replaced by an entire expression.
     * 
     * @param {Symbol} bound the bound variable $b$ in the definition of capture
     *   constraint at the top of this page
     * @param {Symbol} free the free variable $f$ in the definition of capture
     *   constraint at the top of this page
     */
    constructor ( bound, free ) {
        if ( !( bound instanceof Symbol ) || !( free instanceof Symbol ) )
            throw 'CaptureConstraints can only be constructed from two Symbols'
        this.bound = bound
        this.free = free
    }

    /**
     * Recall that the bound and free members of this class, provided at
     * construction time, are instances of the {@link MathConcept MathConcept}
     * class.  (They begin as {@link Symbol Symbols}, but may be substituted
     * later.)  One instance of this class equals another if their corresponding
     * bound and free members are equal, as per
     * {@link MathConcept#equals the equality checking routine in the
     * MathConcept class}.
     * 
     * @param {CaptureConstraint} other another instance of this class
     * @returns {boolean} whether this instance equals the other instance, in
     *   the sense that they have the same bound and free members
     */
    equals ( other ) {
        return this.bound.equals( other.bound ) && this.free.equals( other.free )
    }

    /**
     * Create and return a new CaptureConstraint instance that has the same
     * bound and free members as this one.  It is a shallow copy, so the two
     * members are the exact same objects, not structural copies.
     * 
     * @returns {CaptureConstraint} a shallow copy of this object
     */
    copy () {
        return new CaptureConstraint( this.bound, this.free )
    }

    /**
     * A capture constraint is complete if neither its bound nor free variables
     * is a metavariable.  If either is a metavariable, its eventual value has
     * not yet been determined (or not yet communicated to this object) and thus
     * we can't judge everything about it that we might like to (such as
     * {@link CaptureConstraint#satisfied satisfied()} or
     * {@link CaptureConstraint#violated violated()}).  This function lets us
     * know whethe we have enough information to evaluate such predicates.
     * 
     * @returns {boolean} true iff this constraint contains no metavariables
     * @see {@link CaptureConstraint#satisfied satisfied()}
     * @see {@link CaptureConstraint#violated violated()}
     */
    complete () {
        return !this.bound.isA( metavariable ) && !this.free.isA( metavariable )
    }

    /**
     * A constraint is satisfied if its bound variable does not occur free in
     * its free expression.  Although this suggests that this function should
     * return a boolean, it actually may return undefined if this object is not
     * {@link CaptureConstraint#complete complete()}, because we don't have
     * enough information to answer the question.
     * 
     * @returns {boolean|undefined} true if the object is complete and its bound
     *   variable does not occur free in its free expression, false if it is
     *   complete and its bound variable does occur free in its free expression,
     *   and undefined if it is not complete
     * @see {@link CaptureConstraint#complete complete()}
     * @see {@link CaptureConstraint#violated violated()}
     */
    satisfied () {
        return this.complete() ? !this.free.occursFree( this.bound, this.free )
                               : undefined
    }

    /**
     * A constraint is violated if it is complete and not satisfied.  That is,
     * a constraint cannot be violated unless we have enough information to say
     * whether it is satisfied (hence the check for whether it is
     * {@link CaptureConstraint#complete complete()}), but once it is complete,
     * then violated means the same thing as not
     * {@link CaptureConstraint#satisfied satisfied()}.
     * 
     * Unlike {@link CaptureConstraint#satisfied satisfied()}, this function
     * will never return undefined.  The constraint is not yet violated if we do
     * not yet have non-metavariable values for both the bound and free members.
     * 
     * @returns {boolean} whether this constraint is (known to be) violated
     * @see {@link CaptureConstraint#complete complete()}
     * @see {@link CaptureConstraint#satisfied satisfied()}
     */
    violated () {
        return this.satisfied() === false
    }

}
