
import { Symbol as LurchSymbol } from "../symbol.js"
import { metavariable, metavariableNamesIn } from "./metavariables.js"
import { Substitution } from "./substitution.js"
import { Problem } from "./problem.js"
import {
    fullBetaReduce, alphaEquivalent, isAnEFA
} from './expression-functions.js'
import { equal as deBruijnEquals } from './de-bruijn.js'

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
     *   solution to the given `problem`, but caches the problem's
     *   {@link module:Metavariables.metavariable metavariables} and Expression
     *   Function Applications, so that it is prepared to grow into a solution
     *   for it later.
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
            this._metavariables = pats.map( metavariableNamesIn )
                .reduce( ( A, B ) => new Set( [ ...A, ...B ] ), new Set() )
            this._EFAs = pats.map( pattern =>
                pattern.descendantsSatisfying( isAnEFA ) ).flat( 1 )
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
        result._metavariables = this._metavariables
        result._EFAs = this._EFAs
        // Done, return the copy:
        return result
    }

    /**
     * Two Solutions are equal if they have the same
     * {@link Solution#domain domain()} and, for each metavariable in that
     * domain, they map the metavariable to
     * {@link Substitution Substitution} instances that are
     * {@link module:ExpressionFunctions.alphaEquivalent $\alpha$-equivalent}.
     * 
     * @param {Solution} other the Solution with which to compare this one
     * @returns {boolean} whether the two Solutions are equal, as defined above
     */
    equals ( other ) {
        const d1 = Array.from( this.domain() )
        const d2 = other.domain()
        return d1.length == d2.size
            && d1.every( mv => d2.has( mv ) )
            && d1.every( mv =>
                alphaEquivalent( this.get( mv ), other.get( mv ) ) )
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
        if ( metavariable instanceof LurchSymbol )
            metavariable = metavariable.text()
        return this._substitutions.hasOwnProperty( metavariable ) ?
            this._substitutions[metavariable].expression : undefined
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
            for ( let metavariable in this._substitutions )
                if ( this._substitutions.hasOwnProperty( metavariable ) )
                    this._substitutions[metavariable] =
                        this._substitutions[metavariable].afterSubstituting(
                            sub )
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

    // For internal use.  Applies beta reduction to all the patterns in all the
    // solution's substitutions.
    betaReduce () {
        this.domain().forEach( mv => {
            const sub = this._substitutions[mv]
            const reduced = fullBetaReduce( sub.expression )
            if ( !reduced.equals( sub.expression ) )
                this._substitutions[mv] = new Substitution(
                    new LurchSymbol( mv ).asA( metavariable ), reduced )
        } )
    }

    /**
     * Add a new {@link Substitution Substitution} to this object.  (Recall
     * from the definition of this class that it functions as a set of
     * {@link Substitution Substitutions}.)  Or, if the
     * {@link Substitution Substitution} fails, throw an error instead.
     * 
     * The function can fail if the {@link Substitution}'s metavariable already
     * appears in the given Solution, but mapped to a different
     * {@link Expression}.  This fails because a {@link Substitution} is a
     * function, and so it cannot map the same input to more than one output.
     * This comparison is done {@link module:deBruijn.equal modulo de Bruijn
     * attributes}.
     * 
     * This also includes applying the given {@link Substitution Substitution}
     * to the contents of this object before inserting the given
     * {@link Substitution Substitution} object into this one.
     * 
     * @param {Substitution} sub the substitution to add
     * @param {boolean} check whether to check whether `substitution` can
     *   be added (the default) or not to check and just trust the caller,
     *   thus not throwing an error
     */
    add ( sub, check = true ) {
        // if we're checking to prevent errors, do so now:
        if ( check ) {
            const mvName = sub.metavariable.text()
            const oldValue = this.get( mvName )
            if ( oldValue && !deBruijnEquals( oldValue, sub.expression ) )
                throw new Error(
                    `Function condition failed for metavariable ${mvName}` )
        }
        // modify inner substitutions
        this.substitute( sub )
        this.betaReduce()
        // add the sub to our list
        this._substitutions[sub.metavariable.text()] = sub
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
     * Note that if the {@link Substitution Substitution} cannot be added, this
     * routine will throw an error, so you may wish to use `try`/`catch`.
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
     *   metavariables to expressions; the set contains the *name* of each
     *   metavariable as a string, not as a {@link Symbol Symbol} instance
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
     * A Solution is complete if all of the metavariables appearing in the
     * original {@link Problem Problem} (from which the Solution was
     * constructed) have assignments in this solution, and those assignments
     * do not include any metavariables.  If a solution is complete, it could
     * be applied to the original problem's patterns to produce expressions
     * containing no metavariables.
     * 
     * @return {boolean} whether this Solution is complete, as defined above
     */
    complete () {
        const d = this.domain()
        return Array.from( this._metavariables ).every( mv => d.has( mv ) )
            && Array.from( d ).every( mv =>
                this._substitutions[mv].metavariableNames().size == 0 )
    }

    /**
     * The string representation of a Solution is simply the comma-separated
     * list of string representations of its
     * {@link Substitution Substitutions},
     * surrounded by curly brackets to suggest a set.  For example, it might be
     * "{(A,(- x)),(B,(+ 1 t))}" or "{}".
     * 
     * @returns {string} a string representation of the Solution, useful in
     *   debugging
     * 
     * @see {@link Substitution#toString toString() for individual Substitutions}
     */
    toString () {
        const d = Array.from( this.domain() )
        d.sort()
        return `{${d.map(x=>this._substitutions[x].toString()).join(',')}}`
    }

    // for internal use only, by *solutions() member of "friend" class Problem
    deBruijnDecode () {
        for ( let metavariable in this._substitutions )
            if ( this._substitutions.hasOwnProperty( metavariable ) )
                this._substitutions[metavariable].deBruijnDecode()
    }

}
