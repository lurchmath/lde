
/**
 * A matching problem is a set of {@link Constraint Constraints} to be solved.
 * Some problems have just one solution and others have many.  Examples:
 * 
 *  * If we have a single constraint $(f(x,y),k+3)$, with $f,x,y$
 *    {@link Constraint.metavariable metavariables}, then there is a single
 *    solution: $f\mapsto +$, $x\mapsto k$, $y\mapsto 3$.
 *  * If we have a single constraint $(P(3),3=3)$, with $P$ a
 *    {@link Constraint.metavariable metavariable}, then there are four
 *    solutions, shown below.  Note that the dummy variable used in the
 *    $\lambda$ expression is irrelevant; it could be any symbol other than 3.
 *     * $P\mapsto\lambda x.3=3$
 *     * $P\mapsto\lambda x.x=3$
 *     * $P\mapsto\lambda x.3=x$
 *     * $P\mapsto\lambda x.x=x$
 *
 * With more than one constraint, solving the problem becomes more complex,
 * because all constraints must be satisfied at once, and there may be many
 * metavariables.  It is also important that any solution must avoid variable
 * capture, that is, we cannot assign a metavariable $X\mapsto y$ if performing
 * the substitution $X\mapsto y$ in some pattern would require replacing a free
 * $X$ at a location where $y$ is not free to replace that $X$.
 * 
 * This class expresses a matching problem, that is, a set of matching
 * {@link Constraint Constraints}, and includes an algorithm for solving them
 * simultaneously, producing a list of solutions (which may be empty).  Each
 * solution on the list is also a set of {@link Constraint Constraints}, but
 * each one will have a single metavariable as its pattern, that is, it will
 * pass the {@link Constraint#canBeApplied canBeApplied()} test, and thus it is
 * fully reduced, in the sense that there is no more "solving" work to be done.
 */
export class Problem {

    /**
     * Construct a new matching problem with no constraints in it.
     */
    constructor () {
        this.constraints = [ ]
    }

}
