
import { metavariable } from './constraint.js'
import { Symbol } from '../symbol.js'
import { Binding } from '../binding.js'
import { LogicConcept } from '../logic-concept.js'
import { Constraint } from './constraint.js'

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
     * @param {boolean} [check=true] whether to perform the check that both
     *   parameters must be symbols.  If this is false, no check is done, which
     *   can be more efficient in cases where you know the check will pass, or
     *   can let you create invalid capture constraints (if you know what you
     *   are doing!)
     */
    constructor ( bound, free, check ) {
        if ( typeof( check ) === 'undefined' ) check = true
        if ( check &&
             ( !( bound instanceof Symbol ) || !( free instanceof Symbol ) ) )
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
        return new CaptureConstraint( this.bound, this.free, false )
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

    /**
     * The string representation of a capture constraint is simply the string
     * "(b,f)" where b is the {@link LogicConcept#toPutdown putdown}
     * representation of the bound symbol of the constraint and f is the
     * {@link LogicConcept#toPutdown putdown} representation of the free symbol
     * (or expression) of the constraint.
     *
     * It also replaces some overly wordy notation with briefer notation for
     * ease of reading when debugging:
     * 
     *  * JSON notation for {@link Constraint#metavariable metavariables} is
     *    replaced with a double-underscore, as in `v__` for a metavariable `v`
     *  * The EFA symbol `"LDE EFA"` becomes `@`
     *  * The EF symbol `"LDE lambda"` becomes `𝝺`
     * 
     * @returns {string} a string representation of the constraint, useful in
     *   debugging
     * 
     * @see {@link CaptureConstraints#toString toString() for constraint sets}
     */
    toString () {
        return `(${this.bound.toPutdown()},${this.free.toPutdown()})`
            .replace( / \+\{"_type_LDE MV":true\}\n/g, '__' )
            .replace( /"LDE EFA"/g, '@' )
            .replace( /"LDE lambda"/g, '𝝺' )
    }

}

/**
 * A capture constraint (singular) is defined in the
 * {@link CaptureConstraint CaptureConstraint class}, but a set of capture
 * constraints (plural) is defined here, in the
 * {@link CaptureConstraints CaptureConstraints class}.
 */
export class CaptureConstraints {

    /**
     * Create a new set of capture constraints by providing a list of objects to
     * add to the set.  Depending on what types of objects are provided,
     * different actions are performed.
     * 
     *  * For any argument that is a
     *    {@link CaptureConstraint CaptureConstraint}, it is added to the list
     *    of capture constraints in this set as long as an identical one does
     *    not already appear on that list (judging by
     *    {@link CaptureConstraint#equals equality for capture constraints}).
     *    We add it using {@link CaptureConstraints#add the add() function}.
     *  * For any argument that is a {@link LogicConcept LogicConcept}, it is
     *    treated as a pattern (as documented at the top of the
     *    {@link Constraint Constraint} module) and scanned to find all pairs
     *    of variables $u,v$ where at least one is a metavariable and $v$
     *    appears free inside a binding that binds $u$.  It then adds the
     *    corresponding capture constraint to this object.  The pairs are found
     *    with the {@link CaptureConstraints#scan scan()} function and the
     *    constraints added using the {@link CaptureConstraints#add add()}
     *    function.
     *  * For any argument that is a {@link Constraint Constraint}, we ignore
     *    its expression and just process its pattern, as in the previous bullet
     *    point.
     *  * Any other type of argument throws an error.
     * 
     * @param  {...Constraint|...LogicConcept|...CaptureConstraint} args the
     *   constraints to add to this list, as documented above
     * 
     * @see {@link CaptureConstraints#add add()}
     * @see {@link CaptureConstraints#scan scan()}
     */
    constructor ( ...args ) {
        this.constraints = [ ]
        for ( let arg of args ) {
            if ( arg instanceof CaptureConstraint ) {
                this.add( arg )
            } else if ( arg instanceof Constraint ) {
                this.scan( arg.pattern )
            } else if ( arg instanceof LogicConcept ) {
                this.scan( arg )
            } else {
                throw 'Invalid argument to CaptureConstraints constructor'
            }
        }
    }

    /**
     * Is this capture constraint set empty?  Return true if it is empty and
     * false if it contains any capture constraints.
     * 
     * @returns {boolean} whether this set is empty
     */
    empty () {
        return this.constraints.length == 0
    }

    /**
     * Create a shallow copy of this object.  It will contain the same set of
     * {@link CaptureConstraint CaptureConstraint} instances, but it will be a
     * distinct object in memory.
     * 
     * @returns {CaptureConstraints} a shallow copy of this object
     * 
     * @see {@link CaptureConstraint#deepCopy deepCopy()}
     */
    copy () {
        const result = new CaptureConstraints()
        result.constraints = this.constraints.slice()
        return result
    }

    /**
     * Create a deep copy of this object.  It will contain copies of the
     * {@link CaptureConstraint CaptureConstraint} instances that are in this
     * object.
     * 
     * @returns {CaptureConstraints} a deep copy of this object
     * 
     * @see {@link CaptureConstraint#copy copy()}
     */
    deepCopy () {
        const result = new CaptureConstraints()
        result.constraints = this.constraints.map( c => c.copy() )
        return result
    }

    /**
     * Add to this object all the given {@link CaptureConstraint capture
     * constraints}, except any that are already present in this set.  We detect
     * which ones are already present by comparing new ones to old ones using
     * the {@link CaptureConstraint#equals equals()} function for capture
     * constraints.
     * 
     * @param  {...CaptureConstraint} constraints a list of capture constraints
     *   to add to this object
     */
    add ( ...constraints ) {
        for ( let newOne of constraints )
            if ( !this.constraints.some( oldOne => oldOne.equals( newOne ) ) )
                this.constraints.push( newOne )
    }

    /**
     * This method is for internal use only.  It scans a pattern and finds all
     * capture constraints in it and adds them to this class (using the
     * {@link CaptureConstraints#add add()} function).  A capture constraint
     * $(b,f)$ is one in which either $b$ or $f$ is a metavariable (or both are)
     * and $f$ occurs free inside a binding that binds $b$ in the given pattern.
     * 
     * @param {Expression} pattern the expression (typically containing
     *   metavariables) to scan for capture constraints
     * @param {...Symbol} [bound] a list of variables bound above the `pattern`
     *   being scanned; this pattern is typically used only in recursive calls,
     *   and clients can ignore it
     * 
     * @see {@link CaptureConstraints#add add()}
     */
    scan ( pattern, bound = [ ] ) {
        if ( pattern instanceof Symbol
          && !bound.some( bv => bv.equals( pattern ) ) )
            bound.forEach( bv => {
                if ( ( bv.isA( metavariable ) || pattern.isA( metavariable ) )
                  && !bv.equals( pattern ) )
                    this.add( new CaptureConstraint( bv, pattern ) )
            } )
        let recurOn = pattern.children()
        if ( pattern instanceof Binding ) {
            // process the head not as part of the quantified scope
            this.scan( recurOn.shift(), bound )
            // process everything else as part of the quantified scope later
            bound = bound.slice()
            pattern.boundVariables().forEach( newBV => {
                if ( !bound.some( oldBV => oldBV.equals( newBV ) ) )
                    bound.push( newBV )
            } )
        }
        recurOn.forEach( child => this.scan( child, bound ) )
    }

    /**
     * Returns true if and only if all capture constraints in this set are
     * {@link CaptureConstraint#satisfied satisfied()}.  If any are
     * {@link CaptureConstraint#complete incomplete} or violated, it will return
     * false.
     * 
     * @returns {boolean} whether all the constraints in this set are satisfied
     * 
     * @see {@link CaptureConstraints#violated violated()}
     * @see {@link CaptureConstraints#simplify simplify()}
     */
    satisfied () {
        return this.constraints.every( constraint => constraint.satisfied() )
    }
    
    /**
     * Returns true if and only if any capture constraint in this set is
     * {@link CaptureConstraint#violated violated()}.  If all are either
     * {@link CaptureConstraint#complete incomplete} or
     * {@link CaptureConstraint#satisfied satisfied()}, it will return false.
     * 
     * @returns {boolean} whether any constraint in this set is violated
     * 
     * @see {@link CaptureConstraints#satisfied satisfied()}
     * @see {@link CaptureConstraints#simplify simplify()}
     */
    violated () {
        return this.constraints.some( constraint => constraint.violated() )
    }
    
    /**
     * Simplify this set by removing any entry that is
     * {@link CaptureConstraint#complete complete()} and
     * {@link CaptureConstraint#satisfied satisfied()}, because no such
     * constraints change whether this set of constraints is
     * {@link CaptureConstraints#satisfied satisfied()} or
     * {@link CaptureConstraints#violated violated()}.
     * 
     * @see {@link CaptureConstraints#satisfied satisfied()}
     * @see {@link CaptureConstraints#violated violated()}
     */
    simplify () {
        this.constraints = this.constraints.filter( constraint =>
            !constraint.complete() || !constraint.satisfied() )
    }

    /**
     * The string representation of a capture constraint set is simply the
     * comma-separated list of string representations of its capture
     * constraints, surrounded by curly brackets to suggest a set.  For example,
     * it might be "{(x,3),(y,K)}" or "{}".
     * 
     * @returns {string} a string representation of the set, useful in
     *   debugging
     * 
     * @see {@link CaptureConstraint#toString toString() for individual capture
     *   constraints}
     */
    toString () {
        return `{${this.constraints.map(x=>x.toString()).join(',')}}`
    }

}
