
import { MathConcept } from './math-concept.js'
import { Environment } from './environment.js'
import BindingInterface from './binding-interface.js'

/**
 * A binding in general is defined in the documentation for the
 * {@link BindingInterface BindingInterface}.  Refer there for the general
 * principles.  This class uses that interface to implement bindings whose
 * bodies are {@link Environment Environments}.
 */
export class BindingEnvironment extends Environment {
    
    static className = MathConcept.addSubclass(
        'BindingEnvironment', BindingEnvironment )

    /**
     * Construct a new BindingEnvironment instance from the given array of bound
     * variables (one or more {@link Symbol Symbols}) and body (required
     * {@link Environment}).  Recall from the documentation of the
     * {@link BindingInterface BindingInterface} that bindings do not contain an
     * operator, but {@link BindingEnvironment BindingEnvironments} typically do
     * not want one, so there is not always a need to wrap the resulting object
     * in a larger {@link LogicConcept LogicConcept}.
     * 
     * For example, when encoding something like a subproof that treats $x$ as
     * an arbitrary variable and eventually proves some expression $P$
     * containing $x$, we might use a
     * {@link BindingEnvironment BindingEnvironment} like the following to
     * represent it.
     * 
     * ```js
     * new BindingEnvironment(
     *     new LurchSymbol( 'x' ),
     *     new Environment(
     *         step1, // some Expression
     *         step2, // some Expression
     *         // and so on, eventually reaching the expression:
     *         P
     *     )
     * )
     * ```
     * 
     * Note that while it is possible later to remove children from a
     * BindingEnvironment so that it does not have the required structure of
     * symbols-then-body, this is almost certain to result in the members of
     * this class malfunctioning or throwing errors.  Clients should not remove
     * the necessary children of a BindingEnvironment; that is not supported.
     * 
     * Although it is unnecessarily to repeat the same variable twice on the
     * list of bound variables, we do not explicitly forbid it.
     * 
     * @param  {...LogicConcept} args - the list of one or more
     *   {@link Symbol Symbols} that this environment binds, followed by its
     *   body, which must be of type {@link Environment Environment}.
     * @throws This constructor throws an error if any argument is not a
     *   {@link LogicConcept LogicConcept}, or if any argument but the last is
     *   not a {@link Symbol Symbols}, or the last argument is not an
     *   {@link Environment Environment}, or if the list of bound symbols is
     *   empty.
     */
    constructor ( ...args ) {
        if ( args.length < 2 )
            throw new Error( 'A BindingEnvironment requires at least 2 arguments' )
        const body = args.pop()
        if ( !BindingInterface.allAreSymbols( args ) )
            throw new Error( 'Every argument given to a BindingEnvironment '
                           + 'constructor (except the last) must be a Symbol' )
        if ( !( body instanceof Environment ) )
            throw new Error( 'The body in a BindingEnvironment constructor '
                           + 'must be an Environment' )
        super( ...args, body )
    }

}

// Install the interface into the class defined above.
BindingInterface.addTo( BindingEnvironment.prototype )
