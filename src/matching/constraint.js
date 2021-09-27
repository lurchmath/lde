
import { Symbol } from '../symbol.js'
import { Application } from '../application.js'
import { Binding } from '../binding.js'
import { LogicConcept } from '../logic-concept.js'
import { isAnEFA } from './expression-functions.js'
import { CaptureConstraint, CaptureConstraints } from './capture-constraint.js'
import { Problem } from './problem.js'

// Utility function used below.  It means that the LC is an Application type,
// but not an Expression Function Application.
const isASimpleApplication = x => ( x instanceof Application ) && !isAnEFA( x )
// This does not appear documented in the source code documentation, because it
// is internal to this module.  It is a list of the predicates for classifying
// constraints, in increasing order of complexity, for use in the rank()
// function documented in the Constraint class below.
const predicates = [
    // failure type: Constraints that can never be satisfied
    {
        name : 'failure',
        predicate : C => {
            if ( !Constraint.containsAMetavariable( C.pattern )
              && !C.pattern.equals( C.expression ) )
                return true
            if ( isASimpleApplication( C.pattern ) ) {
                if ( !( C.expression instanceof Application )
                  || C.pattern.numChildren() != C.expression.numChildren() )
                    return true
            }
            if ( C.pattern instanceof Binding ) {
                if ( !( C.expression instanceof Binding )
                  || C.pattern.numChildren() != C.expression.numChildren() )
                    return true
            }
            return false
        }
    },
    // success type: Constraints that are already satisfied
    {
        name : 'success',
        predicate : C => !Constraint.containsAMetavariable( C.pattern )
            && C.pattern.equals( C.expression )
    },
    // instantiation type: Constraints that are just metavar |--> expression
    {
        name : 'instantiation',
        predicate : C => C.canBeApplied()
    },
    // children type: Constraints that depend on many smaller constraints,
    // built from the children of this Constraint's pattern and expression
    {
        name : 'children',
        predicate : C => ( isASimpleApplication( C.pattern )
                        && ( C.expression instanceof Application ) )
                      || ( ( C.pattern instanceof Binding )
                        && ( C.expression instanceof Binding ) )
    },
    // EFA type: Constraints that can only be satisfied by exploring the many
    // sub-options coming from an Expression Function Application pattern
    {
        name : 'EFA',
        predicate : C => isAnEFA( C.pattern )
    }
    // All Constraints should satisfy one of the categories above.
    // There are no other possibilities.
]
const failure = predicates[0]
const success = predicates[1]
const instantiation = predicates[2]
const children = predicates[3]
const EFA = predicates[4]

/**
 * @see {@link Constraint#metavariable metavariable}
 */
export const metavariable = 'LDE MV'

/**
 * A Constraint is a pattern-expression pair often written $(p,e)$ and used to
 * express the idea that the expression $e$ matches the pattern $p$.  The $e$
 * will be an instance of {@link Expression Expression} and the $p$ will be as
 * well, but it may contain metavariables, as defined
 * {@link Constraint#metavariable here}.
 * 
 * Note that a Constraint need not be true or satisfiable.  Here are three
 * examples using ordinary mathematical notation.  For the purposes of these
 * examples, let us assume that capital letter symbols stand for metavariables,
 * and no other symbols are metavariables.
 * 
 *  * The constraint $(3-t,3-t)$ is clearly satisfiable, because its expression
 *    already exactly matches its pattern, with no metavariables even coming
 *    into play at all.
 *  * The constraint $(A+B,3x+y^2)$ is satisfiable, because we could instantiate
 *    the metavariables with $A\mapsto 3x,B\mapsto y^2$ to demonstrate that $e$
 *    is of the form expressed by $p$.
 *  * The constraint $(3,\forall x.P(x))$ is not satisfiable, because $p\neq e$
 *    and $p$ contains no metavariables that we might instantiate to change $p$.
 *  * The constraint $(A+B,\forall x.P(x))$ is not satisfiable, because no
 *    possible instantiations of the metavariables $A,B$ can make the summation
 *    in $p$ into the universal quantifier in $e$.
 * 
 * Typically Constraints are arranged into sets, and there are algorithms for
 * solving sets of Constraints.  See the {@link Problem Problem} class for more
 * details.
 */
export class Constraint {

    /**
     * Any {@link Symbol Symbol} can be marked as a "metavariable," which means
     * that it is usable for substitution or pattern matching, when comparing
     * one expression to another.  For instance, if we compare $a+b$ to
     * $3x+y^2$, and the $a$ and $b$ are metavariables, then we can see that
     * $3x+y^2$ has the form $a+b$, demonstrable by substituting
     * $a\mapsto 3x,b\mapsto y^2$.
     * 
     * You can make any symbol into a metavariable using this value, with code
     * such as `mySymbol.makeIntoA(Constraint.metavariable)`.  Note that the
     * Constraint module also exports a constant of the same name
     * (`metavariable`), so if you import that, you can shorten the above code
     * to `mySymbol.makeIntoA(metavariable)`.
     * 
     * Although it is also possible to mark other kinds of
     * {@link MathConcept MathConcept} instances as a metavariable, that has no
     * sensible meaning, and will be ignored.  The metavariable flag is only
     * important on {@link Symbol Symbols}, and thus should be put only there.
     * 
     * *WARNING:* JavaScript does not support `static const` members in classes,
     * so technically this field is writable, even though it should not be
     * changed.  Do not alter the value of this static member.  If and when
     * ECMAScript7 supports `static const` members, we will upgrade this to a
     * `static const` member.
     * 
     * @see {@link Constraint#isAPattern isAPattern()}
     */
    static metavariable = metavariable

    /**
     * A pattern is an {@link Expression Expression} that may contain a
     * metavariable, and hence *all* {@link Expression Expressions} are
     * patterns, though an {@link Expression Expression} without any
     * metavariables is a pattern only in a degenerate sense.  But sometimes we
     * need to know we are working with an {@link Expression Expression} that
     * does *not* contain a metavariable.  This function is therefore useful.
     * 
     * Recall that a metavariable is any {@link Symbol Symbol} that has been
     * marked as a metavariable as described in the documentation for
     * {@link Constraint#metavariable metavariable}.
     * 
     * @param {LogicConcept} LC the {@link LogicConcept LogicConcept} to test
     *   for whether it contains any metavariables
     * @returns {boolean} true if and only if `LC` contains no metavariables
     * @static
     */
    static containsAMetavariable ( LC ) {
        return LC.hasDescendantSatisfying( d => d.isA( metavariable ) )
    }

    /**
     * Constructs a new Constraint with the given pattern and expression.
     * Throws an error if `expression` satisfies
     * {@link Constraint.containsAMetavariable containsAMetavariable()}.
     * 
     * Constraints are to be treated as immutable.  Do not later alter the
     * pattern or expression of this constraint.  If you need a different
     * constraint, simply construct a new one.
     * 
     * @param {Expression} pattern any {@link Expression Expression} instance,
     *   but typically one containing metavariables, to be used as the pattern
     *   for this Constraint, as documented at the top of this page
     * @param {Expression} expression any {@link Expression Expression} instance
     *   that contains no instance of a metavariable, so that it can be used as
     *   the expression for this Constraint
     * 
     * @see {@link Constraint#pattern pattern getter}
     * @see {@link Constraint#expression expression getter}
     */
    constructor ( pattern, expression ) {
        if ( Constraint.containsAMetavariable( expression ) )
            throw 'The expression in a constraint may not contain metavariables'
        this._pattern = pattern
        this._expression = expression
    }

    /**
     * Getter for the pattern provided at construction time.  This function is
     * useful for making the pattern member act as a read-only member, even
     * though no member is really read-only in JavaScript.
     * 
     * @returns {LogicConcept} the pattern given at construction time
     */
    get pattern () { return this._pattern }

    /**
     * Getter for the expression provided at construction time.  This function
     * is useful for making the expression member act as a read-only member,
     * even though no member is really read-only in JavaScript.
     * 
     * @returns {LogicConcept} the expression given at construction time
     */
    get expression () { return this._expression }

    /**
     * Creates a copy of this Constraint.  It is a shallow copy, in the sense
     * that it shares the same pattern and expression instances with this
     * Constraint, but that should be irrelevant, because Constraints are
     * immutable.  That is, they never alter their own patterns or expressions,
     * and the client is instructed not to alter them either, as per the
     * documentation in {@link Constraint the constructor}.
     * 
     * @returns {Constraint} a copy of this Constraint
     */
    copy () { return new Constraint( this._pattern, this._expression ) }

    /**
     * Two Constraints are equal if they have the same pattern and the same
     * expression.  Comparison of patterns and expressions is done using the
     * {@link MathConcept#equals equals()} member of the
     * {@link MathConcept MathConcept} class.
     * 
     * @param {Constraint} other another instance of this class, to be compared
     *   with this one for equality
     * @returns {boolean} whether the two instances are structurally equal
     */
    equals ( other ) {
        return this._pattern.equals( other._pattern )
            && this._expression.equals( other._expression )
    }

    /**
     * If a Constraint's pattern is a single metavariable, then that Constraint
     * can be used as a tool for substitution.  For instance, the Constraint
     * $(A,2)$ can be applied to the expression $A-\frac{A}{B}$ to yield
     * $2-\frac{2}{B}$.  A Constraint is only useful for application if its
     * pattern is a single metavariable.  This function tests whether that is
     * the case.
     * 
     * @returns {boolean} true if and only if this Constraint can be applied
     *   like a function (that is, whether its pattern is just a single
     *   metavariable)
     * 
     * @see {@link Constraint#applyTo applyTo()}
     * @see {@link Constraint#appliedTo appliedTo()}
     */
    canBeApplied () {
        return this.pattern instanceof Symbol
            && this.pattern.isA( metavariable )
    }

    /**
     * Apply this Constraint, as a substitution instruction, to the given
     * `target`, in place.  Each type of target is treated differently, as
     * follows.
     * 
     *  * If the `target` is a {@link LogicConcept LogicConcept}, replace every
     *    instance in it of this Constraint's pattern with a copy of this
     *    Constraint's expression.
     *  * If the `target` is a {@link CaptureConstraint CaptureConstraint},
     *    apply this Constraint to both its bound and free members, in place.
     *  * If the `target` is a {@link CaptureConstraints set of Capture
     *    Constraints}, then just apply the above action to each one.
     *  * If the `target` is a {@link Problem matching Problem}, apply this
     *    Constraint to each of its patterns.  (Technically, we make new
     *    Constraints to replace the old, since Constraints are immutable.)
     * 
     * Because this function operates in-place, it cannot be applied to another
     * Constraint; such objects are to be immutable.  Instead, use the
     * {@link Constraint#appliedTo appliedTo()} form, which can operate on
     * Constraint instances.  Note that if the `target` is a top-level
     * {@link MathConcept MathConcept} (i.e., has no parent), and is a
     * metavariable that needs to be replaced by this Constraint, this function
     * will do nothing, because it replaces things within their parents.  See
     * {@link Constraint#appliedTo appliedTo()} for what you can use in that
     * context.
     * 
     * If this Constraint does not pass the
     * {@link Constraint#canBeApplied canBeApplied()} test, then this function
     * throws an error.  It also throws an error if the target is not one of the
     * two types mentioned above.
     * 
     * @param {LogicConcept|CaptureConstraint|CaptureConstraints|Problem} target
     *   the object to which we should apply this Constraint, in place
     * 
     * @see {@link Constraint#canBeApplied canBeApplied()}
     * @see {@link Constraint#appliedTo appliedTo()}
     */
    applyTo ( target ) {
        if ( !this.canBeApplied() )
            throw 'Cannot apply a Constraint whose pattern is not a metavariable'
        if ( target instanceof LogicConcept ) {
            target.descendantsSatisfying( d => d.equals( this.pattern )
                                       && d.isA( metavariable )
            ).forEach( d => d.replaceWith( this.expression.copy() ) )
        } else if ( target instanceof CaptureConstraint ) {
            target.bound = this.appliedTo( target.bound )
            target.free = this.appliedTo( target.free )
        } else if ( target instanceof CaptureConstraints ) {
            target.constraints.forEach(
                constraint => this.applyTo( constraint ) )
        } else if ( target instanceof Problem ) {
            target.constraints.slice().forEach( constraint => {
                target.remove( constraint )
                target.add( this.appliedTo( constraint ) )
            } )
        } else {
            throw 'Cannot apply a constraint to that kind of target'
        }
    }

    /**
     * Apply this Constraint, as a substitution instruction, to the given
     * `target`, returning the result as a new object (not altering the
     * original).  Each type of target is treated differently, as follows.
     * 
     *  * If the `target` is a {@link LogicConcept LogicConcept}, create a copy
     *    of it and then call {@link Constraint#applyTo applyTo()} on the copy,
     *    returning the copy afterwards.  In other words, this behaves exactly
     *    like {@link Constraint#applyTo applyTo()}, but instead of operating on
     *    the `target` in place, it operates on a copy and returns the copy.
     *  * If the `target` is a Constraint, build a new constraint with the same
     *    expression as the given Constraint, but with a pattern built by
     *    running the original Constraint's pattern through this same function,
     *    as defined in the previous paragraph.  That is, `appliedTo()` run on a
     *    Constraint $(p,e)$ yields a constraint $(p',e)$, where $p'$ is the
     *    result of `appliedTo(p)`.
     *  * If the `target` is a {@link CaptureConstraint CaptureConstraint},
     *    create a copy of it with bound and free members that have been run
     *    through this function, each one treated as a
     *    {@link LogicConcept LogicConcept}.
     *  * If the `target` is a {@link CaptureConstraints set of Capture
     *    Constraints}, then make a copy, apply this Constraint to the copy, and
     *    return that copy.
     *  * If the `target` is a {@link Problem matching Problem}, then make a
     *    copy, apply this Constraint to the copy, and return that copy.
     * 
     * @param {LogicConcept|Constraint|CaptureConstraint|CaptureConstraints|Problem} target
     *   the object to which we should apply this Constraint, resulting in a copy
     * @returns {LogicConcept|Constraint|CaptureConstraint} a new copy of the
     *   `target` with the application of this Constraint having been done
     * 
     * @see {@link Constraint#canBeApplied canBeApplied()}
     * @see {@link Constraint#applyTo applyTo()}
     * @see {@link Constraint#copy copy()}
     */
    appliedTo ( target ) {
        if ( target instanceof LogicConcept ) {
            if ( target.equals( this.pattern ) ) return this.expression.copy()
            const copy = target.copy()
            this.applyTo( copy )
            return copy
        } else if ( target instanceof Constraint ) {
            return new Constraint( this.appliedTo( target.pattern ),
                                   target.expression )
        } else if ( target instanceof CaptureConstraint ) {
            const copy = target.copy()
            copy.bound = this.appliedTo( copy.bound )
            copy.free = this.appliedTo( copy.free )
            return copy
        } else if ( ( target instanceof CaptureConstraints )
                 || ( target instanceof Problem ) ) {
            const copy = target.copy()
            this.applyTo( copy )
            return copy
        } else {
            throw 'Cannot apply a constraint to that kind of target'
        }
    }

    /**
     * Compute and return the complexity of this Constraint.  The return value
     * is cached, so that future calls to this function do not recompute it.
     * The cache is never invalidated, because Constraints are viewed as
     * immutable.  Complexities include:
     * 
     *  * 0, or "failure": any constraint not matching any of the categories
     *    listed below, and therefore impossible to reconcile into a solution
     *  * 1, or "success": any constraint $(p,e)$ for which $p=e$ (and thus $p$
     *    contains no metavariables)
     *  * 2, or "instantiation": any constraint $(p,e)$ for which $p$ is a lone
     *    metavariable, so that the clear unique solution is $p\mapsto e$
     *  * 3, or "children": any constraint $(p,e)$ where $p$ and $e$ are both
     *    compound expressions with the same structure, so that the appropriate
     *    next step en route to a solution is to pair up their corresponding
     *    children and see if a solution exists to that Constraint set
     *  * 4, or "EFA": any constraint $(p,e)$ where $p$ is an Expression
     *    Function Application, as defined in the documentation for the
     *    {@link ExpressionFunctions ExpressionFunctions} namespace
     * 
     * This value can be used to sort Constraints so that constraints with lower
     * complexity are processed first in algorithms, for the sake of efficiency.
     * For example, the {@link Problem Problem} class has algorithms that make
     * use of this function.
     * 
     * @returns {integer} the complexity of this Constraint, ranked on a scale
     *   beginning with zero (trivial) and counting upwards towards more
     *   complex constraints
     * @see {@link Constraint#complexityName complexityName()}
     */
    complexity () {
        if ( !this.hasOwnProperty( '_complexity' ) ) {
            let index = predicates.findIndex( obj => obj.predicate( this ) )
            this._complexity = index
        }
        return this._complexity
    }

    /**
     * This function returns a single-word description of the
     * {@link Constraint#complexity complexity()} of this Constraint.  It is
     * mostly useful in debugging.  The names listed after each integer in the
     * documentation for the {@link Constraint#complexity complexity()} function
     * are the names returned by this function.
     * 
     * @returns {string} a description of this Constraint's complexity
     * 
     * @see {@link Constraint#complexity complexity()}
     */
    complexityName () {
        return predicates[this.complexity()].name
    }

    /**
     * If a Constraint has {@link Constraint#complexity complexity()} = 3,
     * and thus {@link Constraint#complexityName complexityName()} = "children",
     * then the pattern and expression are either both
     * {@link Application Applications} or both {@link Binding Bindings}, and
     * have the same number of children.  It is therefore useful when solving
     * this constraint to pair up the corresponding children into new Constraint
     * instances.  This function does so, returning them as an array.
     * 
     * For example, if we have a pattern $p=(a~b~c)$ and an expression
     * $e=(x~y~z)$ then the Constraint $(p,e)$ has complexity 3, and we can call
     * this function on it, yielding three new Constraints, $(a,x)$, $(b,y)$,
     * and $(c,z)$.
     * 
     * @returns {...Constraint} all child constraints computed from this
     *   Constraint, as a JavaScript array, in the same order that the children
     *   appear in the pattern (and expression) of this constraint
     */
    children () {
        if ( this.complexity() != predicates.indexOf( children ) )
            throw 'Cannot compute children for this type of Constraint'
        return this.pattern.children().map( ( child, index ) =>
            new Constraint( child, this.expression.child( index ) ) )
    }

    /**
     * The string representation of a Constraint $(p,e)$ is simply the string
     * "(P,E)" where P is the {@link LogicConcept#toPutdown putdown}
     * representation of $p$ and E is the {@link LogicConcept#toPutdown putdown}
     * representation of $e$.
     * 
     * @returns {string} a string representation of the Constraint, useful in
     *   debugging
     */
    toString () {
        return `(${this.pattern.toPutdown()},${this.expression.toPutdown()})`
    }

}
