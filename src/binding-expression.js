
import { MathConcept } from './math-concept.js'
import { Expression } from './expression.js'
import BindingInterface from './binding-interface.js'

/**
 * A binding in general is defined in the documentation for the
 * {@link BindingInterface BindingInterface}.  Refer there for the general
 * principles.  This class uses that interface to implement bindings whose
 * bodies are {@link Expresison Expressions}.
 */
export class BindingExpression extends Expression {
    
    static className = MathConcept.addSubclass(
        'BindingExpression', BindingExpression )

    /**
     * Construct a new BindingExpression instance from the given array of bound
     * variables (one or more {@link Symbol Symbols}) and body (required
     * {@link Expression}).  Recall from the documentation of the
     * {@link BindingInterface BindingInterface} that bindings do not contain an
     * operator, so {@link BindingExpression BindingExpressions} are almost
     * always wrapped in an application to add an operator to them.
     * 
     * For example, when encoding something like $\bigcup_i A_i$, the
     * documentation for {@link BindingInterface BindingInterface} gives the
     * following example way to do so.
     * 
     * ```js
     * new Application(
     *     new LurchSymbol( '⋃' ),
     *     new BindingExpression(
     *         new LurchSymbol( 'i' ),
     *         new Application(
     *             new LurchSymbol( 'subscript' ),
     *             new LurchSymbol( 'A' ),
     *             new LurchSymbol( 'i' )
     *         )
     *     )
     * )
     * ```
     * 
     * As a second example, $\sum_{i=1}^n i^2$, could be encoded as follows, if
     * we already had {@link Symbol Symbols} `i`, `n`, `Sum`, and `power`
     * defined.
     * 
     * ```
     * new Application(
     *     Sum, Symbol( 1 ), n,
     *     new BindingExpression( i, new Application( power, i, Symbol( 2 ) ) )
     * )
     * ```
     * 
     * Note that while it is possible later to remove children from a
     * BindingExpression so that it does not have the required structure of
     * variables-then-body, this is almost certain to result in the members of
     * this class malfunctioning or throwing errors.  Clients should not remove
     * the necessary children of a BindingExpression; that is not supported.
     * 
     * Although it is unnecessarily to repeat the same variable twice on the
     * list of bound variables, we do not explicitly forbid it.
     * 
     * @param  {...Expression} args - the list of one or more
     *   {@link Symbol Symbols} thatthis expression binds, followed by its body,
     *   which must be of type {@link Expression Expression}.
     * @throws This constructor throws an error if any argument is not an
     *   {@link Expression Expressions}, or if any argument but the last is not
     *   a {@link Symbol Symbols}, or if the list of bound symbols is empty.
     */
    constructor ( ...args ) {
        if ( args.length < 2 )
            throw new Error( 'A BindingExpression requires at least 2 arguments' )
        const body = args.pop()
        if ( !BindingInterface.allAreSymbols( args ) )
            throw new Error( 'Every argument given to a BindingExpression '
                           + 'constructor (except the last) must be a Symbol' )
        if ( !( body instanceof Expression ) )
            throw new Error( 'The body in a BindingExpression constructor '
                            + 'must be an Expression' )
        super( ...args, body )
    }

}

// Install the interface into the class defined above.
BindingInterface.addTo( BindingExpression.prototype )
