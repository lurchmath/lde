
import { MathConcept } from './math-concept.js'
import { Expression } from './expression.js'

/**
 * Many mathematical expressions are the application of some function or
 * operator to zero or (typically) more arguments.  For example $f(x)$ applies
 * the function $f$ to the argument $x$.  As another example, $17.2-p$ applies
 * the operation $-$ to the arguments $17.2$ and $p$.  We call such
 * expressions Applications, and implement them in this class.
 * 
 * These were inspired by a structure of the same name defined in
 * {@link https://openmath.org/about/ the OpenMath Standard}, but the reader
 * is not expected to read that standard; we define in this documentation our
 * version of what an Application is.
 * 
 * An Application is defined by a sequence of children, each of which is an
 * {@link Expression}.  The first such child will be the function or operator
 * that is applied to the rest of the children, and consequently, there must
 * always be at least one child of any Application.  The constructor defined
 * below requires this.
 * 
 * It is acceptable for there to be only one child, the function or operator
 * itself, and no other children.  Such functions are uncommon in mathematics,
 * but they are common in computer science.  For example, a function that
 * generates new pseudo-random numbers each time it is called is a function
 * that takes zero arguments.
 */
export class Application extends Expression {
    
    static className = MathConcept.addSubclass( 'Application', Application )

    /**
     * Construct a new Application instance from the given operator (requried)
     * and list of operands (zero or more).  For example, to construct $f(x)$,
     * call `new Application(f,x)`, where we assume that `f` and `x` are
     * already defined elsewhere (perhaps as {@link Symbol Symbols}).  Or to
     * construct $17.2-p$, call `new Application(m,s,p)`, where `m` is the
     * subtraction operator, `s` is the constant $17.2$ and `p` is the
     * variable $p$.  Each of these three (`m`,`s`,`p`) would most likely be
     * an instance of the {@link Symbol} class.
     * 
     * Note that while it is possible later to remove children from an
     * Application until it has none, this is likely to result in the members
     * of this class malfunctioning or throwing errors.  Clients should not
     * remove the final child of an Application; that is not supported.
     * 
     * @param {Expression} operator - The function or operation that is being
     *   applied to the operands.  This argument is required, and must be an
     *   {@link Expression}.
     * @param  {...Expression} operands - The list of zero or more operands
     *   to which the operator is being applied.  This may be an empty list,
     *   but each entry on the list must be an {@link Expression}.
     * @throws If any of the arguments is not an {@link Expression}, this
     *   constructor throws an error.
     */
    constructor ( operator, ...operands ) {
        if ( !( operator instanceof Expression ) || operands.some( x =>
             !( x instanceof Expression ) ) )
            throw new Error( 'All arguments to the Application constructor '
                           + 'must be Expression instances' )
        super( operator, ...operands )
    }

    /**
     * Applications store their operator and operands as children, in the same
     * order as in LISP S-expressions, that is, with the operator as the first
     * child, and the operands in order therafter (if there are any).  Thus
     * this function returns the first child of this object, when considering
     * it as an {@link Expression} (or more generally as a
     * {@link MathConcept}).
     * 
     * If the children have not been manipulated since construction of the
     * object, then this is the original operator given at construction time.
     * If a new first child has been inserted since then, or the old first
     * child removed, the new first child is assumed to be the operator.
     * 
     * @returns {Expression} the operator that this Application instance
     *   applies to its operands
     * @see {@link Application#operands operands()}
     * @see {@link MathConcept#firstChild firstChild()}
     */
    operator () { return this.firstChild() }

    /**
     * Applications store their operator and operands as children, in the same
     * order as in LISP S-expressions, that is, with the operator as the first
     * child, and the operands in order therafter (if there are any).  Thus
     * this function returns the list of all but the first child of this
     * object, when considering it as an {@link Expression} (or more generally
     * as a {@link MathConcept}).
     * 
     * If the children have not been manipulated since construction of the
     * object, then this is the original array of operands given at
     * construction time.  If children have been added or removed since then,
     * the new array of children (after the first) is assumed to be the list
     * of operands.
     * 
     * @returns {...Expression} the operands to which this Application
     *   instance applies its operator
     * @see {@link Application#operator operator()}
     * @see {@link MathConcept#allButFirstChild allButFirstChild()}
     */
    operands () { return this.allButFirstChild() }
    
}
