
/**
 * @see {@link Constraint#metavariable metavariable}
 */
export const metavariable = 'LDE MV'

/**
 * A Constraint is a pattern-expression pair often written $(p,e)$ and used to
 * express the idea that the expression $e$ matches the pattern $p$.  Although
 * we call $e$ the "expression," and it almost always is an instance of the
 * {@link Expression Expression} class, this implementation is sufficiently
 * general to permit both $p$ and $e$ to be any instances of the
 * {@link LogicConcept LogicConcept} class, provided that $e$ contains no
 * metavariables (a concept defined {@link Constraint#metavariable here}).
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
 *  * The constraint $(3,\forall x,P(x))$ is not satisfiable, because $p\neq e$
 *    and $p$ contains no metavariables that we might instantiate to change $p$.
 *  * The constraint $(A+B,\forall x,P(x))$ is not satisfiable, because no
 *    possible instantiations of the metavariables $A,B$ can make the summation
 *    in $p$ into the universal quantifier in $e$.
 * 
 * Typically Constraints are arranged into sets, and we will provide an
 * algorithm for solving a set of Constraints, or saying that it is not
 * solvable.  That has not yet been implemented, and this documentation will be
 * updated later when it has been implemented.
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
     * EcmaScript7 supports `static const` members, we will upgrade this to a
     * `static const` member.
     * 
     * @see {@link Constraint#isAPattern isAPattern()}
     */
    static metavariable = metavariable

    /**
     * A pattern is a {@link LogicConcept LogicConcept} that may contain a
     * metavariable, and hence *all* {@link LogicConcept LogicConcepts} are
     * patterns, though a {@link LogicConcept LogicConcept} without any
     * metavariables is a pattern only in a degenerate sense.  But sometimes we
     * need to know we are working with a {@link LogicConcept LogicConcept} that
     * does *not* contain a metavariable.  This function is therefore useful.
     * 
     * Recall that a metavariable is any {@link Symbol Symbol} that has been
     * marked as a metavariable as described in the documentation for
     * {@link Constraint#metavariable metavariable}.
     * 
     * @param {LogicConcept} LC the {@link LogicConcept LogicConcept} to test
     *   for whether it contains any metavariables
     * @returns {boolean} true if and only if `LC` contains no metavariables
     */
    static containsAMetavariable ( LC ) {
        return LC.hasDescendantSatisfying( d => d.isA( metavariable ) )
    }

    /**
     * Constructs a new Constraint with the given pattern and expression.
     * Throws an error if `expression` satisfies
     * {@link Constraint#containsAMetavariable containsAMetavariable()}.
     * 
     * Constraints are to be treated as immutable.  Do not later alter the
     * pattern or expression of this constraint.  If you need a different
     * constraint, simply construct a new one.
     * 
     * @param {LogicConcept} pattern any {@link LogicConcept LogicConcept}
     *   instance, but typically one containing metavariables, to be used as
     *   the pattern for this Constraint, as documented at the top of this page
     * @param {LogicConcept} expression any {@link LogicConcept LogicConcept}
     *   instance that contains no instance of a metavariable, so that it can be
     *   used as the expression for this Constraint
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

}
