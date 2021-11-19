
import { metavariable } from './metavariables.js'
import { Symbol } from '../symbol.js'
import { LogicConcept } from '../logic-concept.js'
import { Expression } from '../expression.js'

/**
 * A substitution is a metavariable-expression pair $(m,e)$ that can be used for
 * substitution in other expressions.  (See also the definitions of
 * {@link module:Metavariables.metavariable metavariable} and
 * {@link Expression Expression}.)
 * 
 * For example, if $x$ is a metavariable and $(x,2k-1)$ is a substitution, then
 * if we consider the expression $x^2+px$, applying the substitution would yield
 * the expression $(2k-1)^2+p(2k-1)$.
 */
export class Substitution {

    /**
     * Constructs a new Substitution instance from a variety of types of inputs.
     * See the documentation at the top of this class for the explanation of how
     * a Substitution instance is a metavariable-expression pair $(m,e)$.
     * 
     *  * If two inputs are given, a metavariable $m$ and an expression $e$,
     *    construct a Substitution from the pair $(m,e)$.
     *  * If one input is given, a {@link Constraint Constraint}, and that
     *    constraint passes the {@link Constraint#canBeApplied canBeApplied()}
     *    test, then it can be interpreted as a Substitution.  The constraint
     *    $(p,e)$ is such that $p$ is a metavariable, and thus if we let $m=p$,
     *    we have a substitution $(m,e)$.
     *  * In all other cases, throw an error, because the cases above are the
     *    only supported cases.
     * 
     * @see {@link Substitution#metavariable metavariable getter}
     * @see {@link Substitution#expression expression getter}
     */
    constructor ( ...args ) {
        // Case 1: a single Constraint that can be applied
        if ( args.length == 1 && ( args[0] instanceof Constraint )
                              && args[0].canBeApplied() ) {
            this._metavariable = args[0].pattern
            this._expression = args[0].expression
        // Case 2: a metavariable-expression pair
        } else if ( args.length == 2 && ( args[0] instanceof Symbol )
                                     && args[0].isA( metavariable )
                                     && ( args[1] instanceof Expression ) ) {
            this._metavariable = args[0]
            this._expression = args[1]
        // No other cases are supported
        } else {
            throw 'Invalid parameters to Substitution constructor'
        }
    }

    /**
     * Getter for the metavariable provided at construction time.  This function is
     * useful for making the metavariable member act as a read-only member, even
     * though no member is really read-only in JavaScript.
     * 
     * @returns {Symbol} the metavariable given at construction time
     */
    get metavariable () { return this._metavariable }

    /**
     * Getter for the expression provided at construction time.  This function
     * is useful for making the expression member act as a read-only member,
     * even though no member is really read-only in JavaScript.
     * 
     * @returns {Expression} the expression given at construction time
     */
    get expression () { return this._expression }

    /**
     * Creates a deep copy of this Substitution, that is, its metavariable and
     * expression are copies of the ones in this object.
     * 
     * @returns {Substitution} a deep copy of this Substitution
     */
    copy () {
        return new Substitution( this._metavariable.copy(),
                                 this._expression.copy() )
    }

    /**
     * Two Substitutions are equal if they have the same metavariable and the
     * same expression.  Comparison of metavariables and expressions is done
     * using the {@link MathConcept#equals equals()} member of the
     * {@link MathConcept MathConcept} class.
     * 
     * @param {Substitution} other another instance of this class, to be
     *   compared with this one for equality
     * @returns {boolean} whether the two instances are structurally equal
     */
    equals ( other ) {
        return this._metavariable.equals( other._metavariable )
            && this._expression.equals( other._expression )
    }

    /**
     * Apply this Substitution to the given {@link LogicConcept LogicConcept},
     * in place.  That is, find all subexpressions of the given `LC` that are
     * {@link MathConcept#equals structurally equal} to the metavariable of this
     * Substitution, and replace all of them simultaneously with the expression
     * of this Substitution.
     * 
     * The word "simultaneously" is important because if the expression that is
     * inserted as part of the replacement contains any metavariables, they will
     * not be considered for substitution.
     * 
     * Note that there is one case in which this may fail to produce the desired
     * results:  If `LC` is itself a copy of this Substitution's metavariable,
     * and has no parent, then it cannot be replaced in-place, due to the nature
     * of the {@link MathConcept MathConcept} replacement API.  If such a case
     * may occur, you may prefer to use the
     * {@link Substitution#appliedTo appliedTo()} function instead.
     * 
     * @param {LogicConcept} LC the target to which we should apply this
     *   Substitution, in place
     * 
     * @see {@link Substitution#appliedTo appliedTo()}
     */
    applyTo ( LC ) {
        if ( !( LC instanceof LogicConcept ) )
            throw 'Target of applyTo() must be a LogicConcept instance'
        // Compute the list of metavariables to replace:
        const toReplace = LC.descendantsSatisfying( d =>
            d.equals( this._metavariable ) && d.isA( metavariable ) )
        // Replace them all:
        toReplace.forEach( d => d.replaceWith( this._expression.copy() ) )
    }

    /**
     * Apply this Substitution to the given {@link LogicConcept LogicConcept},
     * returning the result as a new instance (not altering the original).
     * 
     * This is identical to {@link MathConcept#copy making a copy of `LC`} and
     * then calling {@link Substitution#applyTo applyTo()} on it, except for one
     * case:  If the `LC` is equal to the metavariable of this Substitution, and
     * has no parent, then {@link Substitution#applyTo applyTo()} will have no
     * effect, but this routine will return a copy of the Substitution's
     * expression, as expected.
     * 
     * @param {LogicConcept} LC the object to which we should apply this
     *   Substitution, resulting in a copy
     * @returns {LogicConcept} a new copy of the `LC` with the application of
     *   this Substitution having been done
     * 
     * @see {@link Substitution#applyTo applyTo()}
     * @see {@link LogicConcept#copy copy()}
     */
    appliedTo ( LC ) {
        if ( !( LC instanceof LogicConcept ) )
            throw 'Target of appliedTo() must be a LogicConcept instance'
        // Handle the corner case that applyTo() cannot handle:
        if ( LC.equals( this._metavariable ) && LC.isA( metavariable ) )
            return this._expression.copy()
        // Otherwise, just use applyTo() on a copy:
        const copy = LC.copy()
        this.applyTo( copy )
        return copy
    }

    /**
     * The string representation of a Substitution $(m,e)$ is simply the string
     * "(M,E)" where M is the {@link LogicConcept#toPutdown putdown}
     * representation of $m$ and E is the {@link LogicConcept#toPutdown putdown}
     * representation of $e$.
     *
     * This function also improves brevity and clarity when debugging by making
     * a few text replacements, as follows:
     * 
     *  * The JSON notation for the metavariable attribute is replaced with a
     *    double underscore, so rather than seeing `'P +{"_type_LDE MV":true}'`,
     *    you will see simply `P__`.
     *  * The binder for expression functions, `"LDE lambda"`, is replaced with
     *    the more compact and intuitive `𝝺`.
     *  * The symbol for expression function application, `"LDE EFA"`, is
     *    replaced with the more compact `@`, which can be read as shorthand for
     *    "apply."
     * 
     * @returns {string} a string representation of the Substitution, useful in
     *   debugging
     */
    toString () {
        return `(${this._metavariable.toPutdown()},${this._expression.toPutdown()})`
            .replace( / \+\{"_type_LDE MV":true\}\n/g, '__' )
            .replace( /"LDE EFA"/g, '@' )
            .replace( /"LDE lambda"/g, '𝝺' )
    }

}
