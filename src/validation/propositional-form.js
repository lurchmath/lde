
import CNFTools from './conjunctive-normal-form.js'
import { Environment } from '../environment.js'
import { LogicConcept } from '../logic-concept.js'

/**
 * Any {@link LogicConcept LogicConcept} can be interpreted as a proposition,
 * in the usual sense of propositional logic, as follows.
 * 
 *  * An {@link Expression Expression} (no matter how complex) is treated as
 *    atomic, and considered equal only to another expression with the exact
 *    same structure.
 *  * An {@link Environment Environment} containing no children is treated as
 *    the constant "true."
 *  * An {@link Environment Environment} containing exactly one child is
 *    treated the same as if it were just the child alone.
 *  * An {@link Environment Environment} containing two claim children is
 *    treated as the conjunction of those children, after viewing each as a
 *    proposition itself.
 *  * An {@link Environment Environment} containing a given $G$ followed by a
 *    claim $C$ is treated as the conditional expression "$G$ implies $C$."
 *  * An {@link Environment Environment} with more than two children, $C_1$
 *    through $C_n$, is viewed as if it contained only two children, first
 *    $C_1$ and then an environment containing $C_2$ through $C_n$.
 * 
 * For example, if we use {@link LogicConcept.fromPutdown putdown notation} to
 * express environments and expressions, then the {@link LogicConcept
 * LogicConcept} written as
 * ```
 * {
 *     :(> x 5)
 *     (> y 10)
 *     (= z 15)
 * }
 * ```
 * might correspond to the proposition $P\Rightarrow(Q\wedge R)$, if $P$, $Q$,
 * and $R$ were the propositional letters for the three expressions, in that
 * order.
 * 
 * This conversion preserves the intended meaning of the notions of
 * {@link Environment Environment} and given/claim.  Although
 * {@link LogicConcept LogicConcepts} can be more complex than that (including
 * declared variables, quantifiers, etc.), there are ways to reduce that
 * complexity to propositional form.  Once a {@link LogicConcept LogicConcept}
 * is in propositional form, it can be checked using a propositional tautology
 * checker, either intuitionistic or classical.
 * 
 * We will later add the preprocessing steps that can simplify variable and
 * constant declarations down into content amenable to propositional checking.
 * Those tools are not yet present in this version of the class.
 */
export class PropositionalForm {

    // Clients should not construct PropositionalForm instances themselves;
    // use one of the static builder functions documented below.
    constructor ( catalog ) {
        this._children = [ ]
        this._catalog = catalog || [ ]
    }

    /**
     * Construct a new instance of the PropositionalForm class, an atomic one
     * representing the logical constant "true."  Note that this is not a
     * member function, but a static method, so you would invoke it using
     * `PropositionalForm.constantTrue()`.  In fact, one does not ever
     * construct instances of the PropositionalForm class in any way other
     * than using the static methods of this class that create specific types
     * of PropositionalForms.
     * 
     * @returns {PropositionalForm} a PropositionalForm object representing
     *   the logical constant "true"
     * 
     * @see {@link PropositionalForm#isConstantTrue isConstantTrue()}
     * @see {@link PropositionalForm.atomic atomic()}
     * @see {@link PropositionalForm.conditional conditional()}
     */
    static constantTrue () {
        const result = new PropositionalForm()
        result.text = ' ' // not a possible .toPutdown() result
        return result
    }

    /**
     * Check whether this instance of the PropositionalForm class is an atomic
     * one representing the logical constant "true."  You can create such an
     * instance using the static member function
     * {@link PropositionalForm.constantTrue constantTrue()}.  Note that if
     * this function returns true, then
     * {@link PropositionalForm#isAtomic isAtomic()} will also return true.
     * 
     * @returns {boolean} whether this instance represents the constant "true"
     * 
     * @see {@link PropositionalForm.constantTrue constantTrue()}
     * @see {@link PropositionalForm#isAtomic isAtomic()}
     */
    isConstantTrue () { return this.text == ' ' }

    /**
     * Construct a new instance of the PropositionalForm class, an atomic one
     * representing the given {@link LogicConcept LogicConcept}.  Note that
     * this is not a member function, but a static method, so you would invoke
     * it using `PropositionalForm.atomic(L,c)`.  In fact, one does not ever
     * construct instances of the PropositionalForm class in any way other
     * than using the static methods of this class that create specific types
     * of PropositionalForms.
     * 
     * Note that every {@link LogicConcept LogicConcept} gets represented by a
     * different propositional letter.  The internal structure of the
     * {@link LogicConcept LogicConcept} is completely lost in this
     * conversion.  The second parameter is for internal use, to ensure that
     * the same {@link LogicConcept LogicConcept} gets converted the same way
     * each time.
     * 
     * @param {LogicConcept} LC the {@link LogicConcept LogicConcept} to
     *   represent in propositional form
     * @param {Array} [catalog] a list of the text representations of previous
     *   {@link LogicConcept LogicConcept} instances that have been converted
     *   to PropositionalForm, so that later conversions of structurally
     *   identical {@link LogicConcept LogicConcepts} get the same results;
     *   this parameter is primarily used internally, and clients may omit it
     * @returns {PropositionalForm} a PropositionalForm object representing
     *   the given {@link LogicConcept LogicConcept} `LC`
     * 
     * @see {@link PropositionalForm.constantTrue constantTrue()}
     * @see {@link PropositionalForm#isAtomic isAtomic()}
     * @see {@link PropositionalForm.conditional conditional()}
     */
    static atomic ( LC, catalog ) {
        const result = new PropositionalForm( catalog )
        result.text = LC.toPutdown().replace( /^[:]/, '' )
        result.index( result ) // add it to its own catalog
        return result
    }

    /**
     * Check whether this instance of the PropositionalForm class is an atomic
     * one.  This includes those PropositionalForm instances that represent
     * the logical constant "true," as created with the
     * {@link PropositionalForm.constantTrue constantTrue()} function, as well
     * as those created with the
     * {@link PropositionalForm.atomic atomic()} function.
     * 
     * @returns {boolean} whether this instance is atomic, in either of the
     *   two ways documented above
     * 
     * @see {@link PropositionalForm.constantTrue constantTrue()}
     * @see {@link PropositionalForm.atomic atomic()}
     * @see {@link PropositionalForm#isConditional isConditional()}
     */
    isAtomic () { return this._children.length == 0 }

    /**
     * Construct a new instance of the PropositionalForm class, a compound one
     * representing a conditional expression, that is, one of the form
     * $A\to B$, where $A$ is called the "antecedent" and $B$ the
     * "consequent."  Note that this is not a member function, but a static
     * method, so you would invoke it using `PropositionalForm.conditional(A,C,c)`.
     * In fact, one does not ever construct instances of the PropositionalForm
     * class in any way other than using the static methods of this class that
     * create specific types of PropositionalForms.
     * 
     * The third parameter is for internal use, to ensure that atomic
     * {@link LogicConcept LogicConcepts} gets represented consistently.
     * 
     * @param {LogicConcept} antecedent the {@link LogicConcept LogicConcept}
     *   to use for the left-hand side of the conditional
     * @param {LogicConcept} consequent the {@link LogicConcept LogicConcept}
     *   to use for the right-hand side of the conditional
     * @param {Array} [catalog] this parameter is passed recursively to inner
     *   construction methods, so that eventually it can be used as documented
     *   in {@link PropositionalForm.atomic atomic()}
     * @returns {PropositionalForm} a PropositionalForm object representing
     *   the conditional expression described above
     * 
     * @see {@link PropositionalForm.constantTrue constantTrue()}
     * @see {@link PropositionalForm.atomic atomic()}
     * @see {@link PropositionalForm#isConditional isConditional()}
     */
    static conditional ( antecedent, consequent, catalog ) {
        // start at the end, with an atomic conclusion
        let result = consequent instanceof PropositionalForm ?
            consequent : PropositionalForm.atomic( consequent, catalog )
        catalog = result._catalog
        // the antecedent might yield multiple propositional forms
        const premises = antecedent instanceof Environment ?
            PropositionalForm.fromConclusionsIn(
                antecedent, result._catalog ) :
            [  PropositionalForm.atomic( antecedent, result._catalog ) ]
        // so prepend them all to the conclusion one at a time, A->(B->(...))
        for ( let i = premises.length - 1 ; i >= 0 ; i-- ) {
            const next = new PropositionalForm( result._catalog )
            next._children = [ premises[i], result ]
            next.text = `[${premises[i].text},${result.text}]`
            result = next
        }
        return result
    }

    /**
     * Check whether this instance of the PropositionalForm class is a
     * conditional expression.  Note that the only non-atomic form supported
     * by this class is a conditional expression, because we need to support
     * only sequents whose conclusion is an {@link Expression Expression},
     * and (for detailed reasons not discussed here) such sequents can be
     * expressed as nested conditional PropositionalForm instances.
     * 
     * @returns {boolean} whether this instance is a conditional; note that
     *   this is true iff {@link PropositionalForm#isAtomic isAtomic()} is
     *   false
     * 
     * @see {@link PropositionalForm.conditional conditional()}
     * @see {@link PropositionalForm#isConstantTrue isConstantTrue()}
     * @see {@link PropositionalForm#isAtomic isAtomic()}
     */
    isConditional () { return this._children.length > 0 }

    /**
     * Construct a new instance of the PropositionalForm class, a compound one
     * representing a sequent, that is, one of the form
     * $P_1,\ldots,P_n\vdash C$, for some list of premises $P_i$ and
     * conclusion $C$.  This is not actually a new type of compound expression
     * different from a {@link PropositionalForm.conditional conditional()};
     * it is simply a convenience function that will build nested conditionals
     * to express the sequent in question.  If each $P_i$ were an
     * {@link Expression Expression}, the sequent is equivalent to
     * $P_1\to(P_2\to\cdots\to(P_n\to C)\cdots)$, but for more complex $P_i$,
     * some conversion/factoring takes place to represent the final result as
     * only nested conditionals.
     * 
     * @param  {...any} args a sequence of {@link LogicConcept LogicConcept}
     *   instances representing the contents $P_1,\ldots,P_n,C$ of the
     *   sequent.  Optionally, an additional last argument may be a catalog,
     *   which functions the same as it does in both
     *   {@link PropositionalForm.atomic atomic()} and
     *   {@link PropositionalForm.conditional conditional()}; clients rarely
     *   need to use it.
     * @returns {PropositionalForm} a PropositionalForm instance representing
     *   the sequent, as documented above
     */
    static sequent ( ...args ) {
        let catalog = undefined
        if ( !( args.last() instanceof LogicConcept ) ) catalog = args.pop()
        let result = PropositionalForm.atomic( args.pop(), catalog )
        for ( let i = args.length - 1 ; i >= 0 ; i-- )
            result = PropositionalForm.conditional( args[i], result )
        return result
    }

    /**
     * Build a PropositionalForm instance representing the sequent for a given
     * conclusion.  Recall that the notion of a "conclusion" within an
     * {@link Environment Environment} is
     * {@link Environment#conclusions documented here} and
     * {@link Expression#isAConclusionIn also here}.  The sequent for a
     * conclusion is a conditional $P_1\to\cdots\to P_n\to C$, whose meaning
     * is like that of the sequent $P_1,\ldots,P_n\vdash C$, where $C$ is the
     * conclusion and $P_1,\ldots,P_n$ are its accessibles.
     * 
     * @param {LogicConcept} conclusion a conclusion inside a larger
     *   {@link Environment Environment}, the sequent for which should be
     *   represented as a PropositionalForm instance
     * @param {Environment} [ancestor] the outer {@link Environment
     *   Environment} in which to do the computation (i.e., no accessibles
     *   outside this {@link Environment Environment} will be included)
     * @param {Array} [catalog] this parameter functions the same way that it
     *   does in {@link PropositionalForm.atomic atomic()} and
     *   {@link PropositionalForm.conditional conditional()}; clients rarely
     *   need to use it.
     * @returns {PropositionalForm} a PropositionalForm instance representing
     *   the sequent whose conclusion is given as the first parameter and
     *   whose premises are the accessibles to that conclusion, within the
     *   given ancestor
     */
    static fromConclusion ( conclusion, ancestor, catalog ) {
        const context = conclusion.accessibles( false, ancestor ).reverse()
        const strictContext = context.filter(
            accessible => accessible.isA( 'given' ) )
        return PropositionalForm.sequent(
            ...strictContext, conclusion, catalog )
    }

    /**
     * This function simply repeats the work of
     * {@link PropositionalForm.fromConclusion fromConclusion()} multiple
     * times, once for each conclusion appearing in the given
     * {@link Environment Environment}, using that environment for the context
     * in each case.  The result is thus an array of the results one would get
     * by running the loop.
     * 
     * One can view the conjunction of these PropositionalForm results as the
     * meaning of the given {@link Environment Environment}.
     * 
     * @param {Environment} environment the {@link Environment Environment}
     *   whose conclusions should be used
     * @param {Array} [catalog] this parameter functions the same way that it
     *   does in {@link PropositionalForm.atomic atomic()} and
     *   {@link PropositionalForm.conditional conditional()}; clients rarely
     *   need to use it.
     * @returns {PropositionalForm[]} an array of PropositionalForm instances,
     *   one for each conclusion in the given {@link Environment Environment},
     *   each one representing the sequent for that conclusion in that
     *   {@link Environment Environment}
     */
    static fromConclusionsIn ( environment, catalog ) {
        return environment.conclusions().map( conclusion =>
            PropositionalForm.fromConclusion(
                conclusion, environment, catalog ) )
    }

    /**
     * The representation of this PropositionalForm object in conjunctive
     * normal form, and thus ready for use in satisfiability checking.  This
     * function can be called by clients, but it is more likely to be called
     * by them only indirectly, when they call
     * {@link PropositionalForm#isAClassicalTautology isAClassicalTautology()}
     * or {@link PropositionalForm#isAnIntuitionisticTautology
     * isAnIntuitionisticTautology()}.
     * 
     * @returns {Array[]} a representation of this PropositionalForm object
     *   in conjunctive normal form, as documented in
     *   {@link CNF the CNF namespace}
     * 
     * @see {@link PropositionalForm#isAClassicalTautology
     *   isAClassicalTautology()}
     * @see {@link PropositionalForm#isAnIntuitionisticTautology
     *   isAnIntuitionisticTautology()}
     * @see {@link PropositionalForm#negatedCNF negatedCNF()}
     */
    CNF () {
        if ( this.isConstantTrue() ) return CNFTools.constantTrue()
        if ( this.isAtomic() ) return CNFTools.proposition( this.index() )
        // (A -> B) <=> (-A v B)
        return CNFTools.or( this.LHS().negatedCNF(), this.RHS().CNF(),
                            () => this.unused() )
    }

    /**
     * The representation of *the negation of* this PropositionalForm object
     * in conjunctive normal form, and thus ready for use in satisfiability
     * checking.  This function can be called by clients, but it is more
     * likely to be called by them only indirectly, when they call
     * {@link PropositionalForm#isAClassicalTautology isAClassicalTautology()}
     * or {@link PropositionalForm#isAnIntuitionisticTautology
     * isAnIntuitionisticTautology()}.
     * 
     * Note: Negating a CNF once created is a bothersome process, so it is
     * much easier at the outset to have a routine that simply creates a CNF
     * of the negation of the expression desired.  That is the motivation for
     * the creation of this method.
     * 
     * @returns {Array[]} a representation of *the negation of* this
     *   PropositionalForm object in conjunctive normal form, as documented in
     *   {@link CNF the CNF namespace}
     * 
     * @see {@link PropositionalForm#isAClassicalTautology
     *   isAClassicalTautology()}
     * @see {@link PropositionalForm#isAnIntuitionisticTautology
     *   isAnIntuitionisticTautology()}
     * @see {@link PropositionalForm#CNF CNF()}
     */
    negatedCNF () {
        if ( this.isConstantTrue() ) return CNFTools.constantFalse()
        if ( this.isAtomic() ) return CNFTools.proposition( -this.index() )
        // -(A -> B) <=> (A ^ -B)
        return CNFTools.and( this.LHS().CNF(), this.RHS().negatedCNF() )
    }

    /**
     * Whether a propositional logic expression is a classical tautology can
     * be checked by the laborious but straightforward method of truth tables.
     * Such a method, however, is exponential in running time.  So instead, we
     * ask whether the negation of the expression is satisfiable, an
     * equivalent question, but one that is amenable to the efficiencies in
     * the satisfiability checker {@link CNF.isSatisfiable documented here}.
     * 
     * @returns {boolean} whether this PropositionalForm object is (when
     *   interpreted as a propositional logic expression) a tautology, using
     *   the rules of classical propositional logic
     * 
     * @see {@link PropositionalForm#CNF CNF()}
     * @see {@link PropositionalForm#negatedCNF negatedCNF()}
     * @see {@link PropositionalForm#isAnIntuitionisticTautology
     *   isAnIntuitionisticTautology()}
     */
    isAClassicalTautology () {
        // classical tautology <=> negation is not satisfiable
        return !CNFTools.isSatisfiable( this.negatedCNF(),
                                        this._catalog.length )
    }

    /**
     * Whether a propositional logic expression is an intuitionistic tautology
     * can be checked by attempting to construct a proof.  Because we are
     * limiting ourselves to expressions that contain only the conditional
     * operator, there are only three possible logical rules in play, making
     * the proof search a straightforward one.  In the worst case scenario,
     * the search still takes exponential time, but we incorporate a number of
     * efficienceies into the search process to minimize that problem.
     * 
     * @returns {boolean} whether this PropositionalForm object is (when
     *   interpreted as a propositional logic expression) a tautology, using
     *   the rules of intuitionistic propositional logic
     * 
     * @see {@link PropositionalForm#CNF CNF()}
     * @see {@link PropositionalForm#negatedCNF negatedCNF()}
     * @see {@link PropositionalForm#isAnIntuitionisticTautology
     *   isAnIntuitionisticTautology()}
     */
    isAnIntuitionisticTautology () {
        return canProveInIPL( [ ], [ ], this, true, new Set() )
    }

    ////////////////
    //
    //  The remaining functions are primarily used internally by this class,
    //  and thus we do not document them for clients to call (that is, there
    //  are no JSDoc comments below).  We provide, instead, brief JavaScript
    //  comments for reference by the developers of this class.
    //
    /////////////////

    // Convenience functions for getting the arguments of a conditional
    LHS () { return this._children[0] }
    RHS () { return this._children[1] }

    // For an atomic, what is my index in my own catalog?
    // This has the side effect of adding it to the catalog if it's not
    // already there.  Thus it is reasonable to call this function and just
    // discard the value, if your goal is just to add something to the catalog.
    index () {
        const text = this.text
        const index = this._catalog.indexOf( text )
        if ( index > -1 ) return index + 1
        this._catalog.push( text )
        return this._catalog.length
    }

    // A new symbol generator for the catalog stored in this object.
    // Each time it is called it will produce a new integer (which is how we
    // represent symbols, because we will be using them in CNFs) that has not
    // been used for any atomic before, and is now reserved so that it will
    // not be used by any atomic in the future.
    unused () {
        this._catalog.push( null )   // does not matter what we push, because:
        return this._catalog.length  // this will be its 1-based index
    }

    // Does a PropositionalForm object with the same the text representation
    // as this one appear in the given array?
    isIn ( array ) { return array.some( entry => entry.text == this.text ) }

    // Yields the given array with this object added.
    // More specifically:  Given an array of PropositionalForm objects, if one
    // with this object's text representation is already in the array, then
    // return the array unchanged.  Otherwise return a new array equal to the
    // old, plus this object appended to the end.
    addedTo ( array ) {
        return this.isIn( array ) ? array : array.concat( [ this ] )
    }

    // Does this PropositionalForm follow classically from the list of other
    // PropositionalForm objects P_1,...,P_n given as arguments?
    // (They must all have the same catalog for this to be checkable.)
    followsClassicallyFrom ( ...premises ) {
        if ( premises.some( premise => premise._catalog != this._catalog ) )
            throw new Error(
                'All premises must share a catalog with the conclusion' )
        let asAConditional = this
        premises.forEach( premise => {
            const next = new PropositionalForm( asAConditional._catalog )
            next._children = [ premise, asAConditional ]
            asAConditional = next
        } )
        return asAConditional.isAClassicalTautology()
    }

}

// Helper function, not public.  Checks if a sequent is valid in
// intuitionistic propositional logic (IPL).
// The sequent has a list of PropositionalForms (PFs) on the left and one PF
// on the right.  More specifically, the parameters are:
//   atomics = an array of all premises satisfying .isAtomic()
//   conditionals = an array of all premises satisfying .isConditional()
//   conclusion = the conclusion of the sequent to be checked; may or may not
//     be atomic
//   checkCPLFirst = boolean, true iff we should check CPL first.  Reason:
//     If a sequent is not CPL valid then it is not IPL valid.  Since we have
//     a fast algorithm for checking CPL validity, we run that first, and if
//     it says false, we say false.  However, there may be times when the
//     caller already knows that the sequent is CPL valid, and in that case
//     the caller may set this to false, to not waste time re-verifying that.
//   proven = JavaScript Set of texts of PFs that we already know follow from
//     the LHS of the sequent.  This set is not just atomics.  It grows as we
//     try recursive subproofs that don't end up succeeding, but that do prove
//     some new PFs before they fail, and we don't want to forget them.
const canProveInIPL = (
    atomics, conditionals, conclusion, checkCPLFirst, proven
) => {

    // console.log( 'IPL: '
    //            + atomics.map( x=>x.text ).join( ',' ) + '; '
    //            + conditionals.map( x=>x.text ).join( ',' ) + '; '
    //            + [...proven].join( ',' ) + ' |- '
    //            + conclusion.text + ' (' + checkCPLFirst + ')' )

    // If the conclusion is literally the constant true, we're done.
    if ( conclusion.isConstantTrue() ) {
        return true
    }

    // don't bother with FIC if SAT says no...unless the caller told us not to
    // do this check.  (Recursive calls that already know the check will pass
    // may tell us to skip it to save time.)
    if ( checkCPLFirst
      && !conclusion.followsClassicallyFrom( ...atomics, ...conditionals ) )
        return false

    // If the conclusion is already known, just stop now.
    if ( proven.has( conclusion.text ) ) return true

    // apply the GR rule as many times as needed to achieve an atomic RHS
    while ( conclusion.isConditional() ) {
        const A = conclusion.LHS()
        if ( A.isAtomic() ) {
            atomics = A.addedTo( atomics )
        } else {
            conditionals = A.addedTo( conditionals )
        }
        conclusion = conclusion._children[1]
    }

    // console.log( ' ... '
    //            + atomics.map( x=>x.text ).join( ',' ) + '; '
    //            + conditionals.map( x=>x.text ).join( ',' ) + '; '
    //            + [...proven].join( ',' ) + ' |- '
    //            + conclusion.text + ' (' + checkCPLFirst + ')' )

    // conclusion is now atomic.  if the S rule applies, done
    if ( conclusion.isIn( atomics ) ) return true

    // recursive applications of GL rule
    for ( let i = 0 ; i < conditionals.length ; i++ ) {
        // Try the left subproof, and record anything you prove while you work
        // on it, so that even if it fails, we increase our knowledge.  If
        // that left subproof fails, move on to the next conditional.
        const LHS = conditionals[i].LHS()
        if ( canProveInIPL(
                atomics, conditionals.without( i ), LHS, true, proven ) )
            proven.add( LHS.text )
        else
            continue
        // The left subproof succeeds, so the whole question is now equivalent
        // to whether the right subproof succeeds.
        // Note: No need to call SAT in either of the following recursions,
        // because in both cases, the sequent we're deferring to in recursion
        // is provable (in both IPL and CPL) iff the current sequent is.
        // Since we already know that the current one is CPL-provable, we know
        // the one in the recursion is, so there's no need to waste time
        // verifying that fact.
        const RHS = conditionals[i].RHS()
        return RHS.isAtomic() ?
            canProveInIPL( RHS.addedTo( atomics ), conditionals.without( i ),
                conclusion, false, proven ) :
            canProveInIPL( atomics, RHS.addedTo( conditionals.without( i ) ),
                conclusion, false, proven )
    }

    // failed to prove it in any of the legal ways, so it is not
    // intuitionistically true
    return false

}
