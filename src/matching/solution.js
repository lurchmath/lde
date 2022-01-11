
import { Binding } from "../binding.js"
import { Symbol } from "../symbol.js"
import { metavariable, metavariableNamesIn } from "./metavariables.js"
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
            this._metavariables = pats.map( metavariableNamesIn )
                .reduce( ( A, B ) => new Set( [ ...A, ...B ] ), new Set() )
            this._bound = new Set( pats.map( pattern =>
                pattern.descendantsSatisfying( d => d instanceof Binding )
                       .map( b => b.boundVariables()
                                   .filter( v => v.isA( metavariable ) )
                                   .map( mv => mv.text() ) )
            ).flat( 2 ) )
        }

        // We initialize an empty member here, but it is an important one, so
        // we document its format.  The _substitutions object maps metavariable
        // names to Substitution instances that replace that metavariable.
        // This isn't redundant; it makes for fast lookup.
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
        for ( let metavariable in this._substitutions )
            if ( this._substitutions.hasOwnProperty( metavariable ) )
                result._substitutions[metavariable] =
                    this._substitutions[metavariable]
        result._captureConstraints = this._captureConstraints.copy()
        result._metavariables = this._metavariables
        result._bound = this._bound
        // Done, return the copy:
        return result
    }

    /**
     * Two Solutions are equal if they have the same
     * {@link Solution#domain domain()} and, for each metavariable in that
     * domain, they map the metavariable to
     * {@link Substitution Substitution} instances that are
     * {@link Substitution#equals equal as Substitutions}.
     * 
     * @param {Solution} other the Solution with which to compare this one
     * @returns {boolean} whether the two Solutions are structurally equal,
     *   as defined above
     */
    equals ( other ) {
        const d1 = Array.from( this.domain() )
        const d2 = other.domain()
        return d1.length == d2.size
            && d1.every( mv => d2.has( mv ) )
            && d1.every( mv => this.get( mv ).equals( other.get( mv ) ) )
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
     * @returns {Expression|undefined} the {@link Expression Expression} to
     *   which this Solution maps the given metavariable, or undefined if this
     *   solution does not map the metavariable to any
     *   {@link Expression Expression}
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
     *   added to this object via {@link Solution#add add()}
     * @returns {boolean} whether adding the proposed `substitution` will
     *   succeed (as opposed to throw an error)
     * 
     * @see {@link Solution#add add()}
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
     * This method is designed to support the
     * {@link Substitution#applyTo applyTo()} method in the
     * {@link Substitution Substitution} class.  See the documentation there
     * for details.
     * 
     * @param  {...Substitution} subs a list of substitutions to apply
     * 
     * @see {@link Substitution#applyTo applyTo() in the Substitution class}
     */
    substitute ( ...subs ) {
        subs.forEach( sub => {
            // Apply sub to each Substitution in this Solution
            for ( let metavariable in this._substitutions )
                if ( this._substitutions.hasOwnProperty( metavariable ) )
                    this._substitutions[metavariable] =
                        this._substitutions[metavariable].afterSubstituting(
                            sub )
            // Apply sub to each Capture Constraint in this Solution
            this._captureConstraints = new CaptureConstraints(
                ...this._captureConstraints.constraints.map( cc =>
                    sub.appliedTo( cc ) ) )
        } )
    }

    /**
     * This method is designed to support the
     * {@link Substitution#appliedTo appliedTo()} method in the
     * {@link Substitution Substitution} class.  See the documentation there
     * for details.
     * 
     * @param  {...Substitution} subs a list of substitutions to apply
     * 
     * @see {@link Substitution#appliedTo appiedTo() in the Substitution class}
     */
    afterSubstituting ( ...subs ) {
        const result = this.copy()
        result.substitute( ...subs )
        return result
    }

    /**
     * Add a new {@link Substitution Substitution} to this object.  (Recall
     * from the definition of this class that it functions as a set of
     * {@link Substitution Substitutions}.)  Or, if the
     * {@link Solution#canAdd canAdd()} function fails for the given
     * {@link Substitution Substitution}, throw an error instead.
     * 
     * This also includes applying the given {@link Substitution Substitution}
     * to the contents of this object before inserting the given
     * {@link Substitution Substitution} object into this one.
     * 
     * @param {Substitution} sub the substitution to add
     * @param {boolean} check whether to first call
     *   {@link Solution#canAdd canAdd()} to check whether `substitution` can
     *   be added (the default) or not to check and just trust the caller,
     *   thus not throwing an error
     */
    add ( sub, check = true ) {
        // throw an error if the check fails (unless the caller says skip it)
        if ( check && !this.canAdd( sub ) )
            throw new Error( 'Adding an invalid Substitution to a Solution' )
        // modify inner substitutions and capture constraints
        this.substitute( sub )
        // add the sub to our list
        this._substitutions[sub.metavariable.text()] = sub
        // delete now-satisfied capture constraints
        this._captureConstraints.constraints =
            this._captureConstraints.constraints.filter(
                cc => !cc.satisfied() )
    }

    /**
     * One common workflow will be to extend a solution by first making a copy
     * (using the {@link Solution#copy copy()} function) and then adding a new
     * {@link Substitution Substitution} to it (using the
     * {@link Solution#add add()} function).  This function makes that easier
     * by making it possible to do it with just one function call.  If `S` is
     * a Solution, then `S.plus(sub)` is a copy of `S`, but after `S.add(sub)`
     * has been called on it.
     * 
     * Note that if you are not certain whether the
     * {@link Substitution Substitution} can be added, you may need to call
     * {@link Solution#canAdd canAdd()} first, or this routine will throw an
     * error.
     * 
     * @param {Substitution} sub the substitution to add
     * @param {boolean} check functions the same as it does in
     *   {@link Solution#add add()}
     * @returns {Solution} a {@link Solution#copy copy()} of this object, but
     *   with `sub` added, via a call to {@link Solution#add add()}
     */
    plus ( sub, check = true ) {
        const result = this.copy()
        result.add( sub, check )
        return result
    }

    /**
     * A Solution can be viewed as a partial function from metavariables to
     * expressions.  That is, it is a finite set
     * $\\{(m_1,e_1),\ldots,(m_n,e_n)\\}$, where each $m_i$ is a metavariable
     * and each $e_i$ is an expression, and the Solution maps each $m_i$ to
     * its corresponding $e_i$.  In such a case, the *domain* of the Solution
     * is the set $\\{m_1,\ldots,m_n\\}$ of metavariables that are in the
     * mapping.
     * 
     * @returns {Set} the set of metavariables in the domain of this
     *   Solution, when it is viewed as a partial function from
     *   metavariables to expressions
     *
     * @see {@link Solution#restrict restrict()}
     * @see {@link Solution#restricted restricted()}
     */
    domain () {
        const result = new Set()
        for ( let metavariable in this._substitutions )
            if ( this._substitutions.hasOwnProperty( metavariable ) )
                result.add( metavariable )
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
     * @see {@link Substitution#domain domain()}
     * @see {@link Substitution#restricted restricted()}
     */
    restrict () {
        for ( let metavariable in this._substitutions )
            if ( this._substitutions.hasOwnProperty( metavariable )
              && !this._metavariables.has( metavariable ) )
                delete this._substitutions[metavariable]
    }

    /**
     * Return a copy of this Solution, but with
     * {@link Substitution#restrict restrict()} having been applied to the
     * copy.
     * 
     * @see {@link Substitution#domain domain()}
     * @see {@link Substitution#restrict restrict()}
     * @see {@link Substitution#copy copy()}
     */
    restricted () {
        const result = this.copy()
        result.restrict()
        return result
    }

    /**
     * A Solution is satisfied if all its
     * {@link CaptureConstraints CaptureConstraints} are satisfied.  This
     * method is a convenience for asking that question.
     * 
     * @returns {boolean} whether all
     *   {@link CaptureConstraints CaptureConstraints} are satisfied
     * 
     * @see {@link Solution#complete complete()}
     */
    satisfied () {
        return this._captureConstraints.satisfied()
    }

    /**
     * A Solution is complete if all of the metavariables appearing in the
     * original {@link Problem Problem} (from which the Solution was
     * constructed) have assignments in this solution, and those assignments
     * do not include any metavariables.  If a solution is complete, it could
     * be applied to the original problem's patterns to produce expressions
     * containing no metavariables.
     * 
     * @return {boolean} whether this Solution is complete, as defined above
     * 
     * @see {@link Solution#satisfied satisfied()}
     */
    complete () {
        const d = this.domain()
        return Array.from( this._metavariables ).every( mv => d.has( mv ) )
            && Array.from( d ).every( mv =>
                this._substitutions[mv].metavariableNames().size == 0 )
    }

}
