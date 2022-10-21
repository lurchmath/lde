
import { MathConcept } from '../math-concept.js'
import { Environment } from '../environment.js'
import { BindingEnvironment } from '../binding-environment.js'

/**
 * In formal logic, a sequent, written using notation like
 * $P_1,\ldots,P_n\vdash C$, expresses the notion that the conclusion $C$
 * follows from the premises $P_1,\ldots,P_n$.  A sequent might be derivable or
 * not, and one can look for particular derivations that result in the sequent,
 * etc.
 * 
 * This class is a data structure for holding a sequent whose premises and
 * conclusion are all {@link LogicConcept LogicConcepts}.  It does not provide
 * any formal way to assess whether the sequent is valid; such tools are left
 * to other functionality in {@link module:Validation the Validation module}.
 * But it is useful to have this class because the construction of a sequent is
 * a rather technical thing to get right, and compartmentalizing all of those
 * technicalities into one file is good code organization.
 * 
 * Specifically, given a claim, one might try to form a sequent from it by just
 * computing its {@link MathConcept#accessibles list of accessibles}.  However,
 * there are several reasons why this does not always result in the correct set
 * of {@link LogicConcept LogicConcepts}.  None of these is deep or meaningful;
 * all are somewhat annoying technicalities whose handling we factor into the
 * tools in this class so that we might ignore it elsewhere.  All notation used
 * below is {@link MathConcept.fromPutdown putdown}.
 * 
 *  1. In a {@link BindingEnvironment}, say `(x y) , { A B }`, there is a body
 *     (the last child) and there are bound symbols (the children preceding the
 *     last).  In this case, the children of the {@link BindingEnvironment} are
 *     `x`, `y`, and `{ A B }`.  Thus if we considered what's accessible to
 *     `B`, we would find both `x` and `y`, even though neither is a
 *     proposition, nor is it "citable" at `B`.  Thus we would want to remove
 *     the bound variables of {@link BindingEnvironment}s from consideration
 *     when forming a sequent.
 *  2. Support for declared variables already exists in our class hierarchy,
 *     even though (at the time of this writing) it is not yet supported in our
 *     validation tools.  But when it is, we will want to reduce the contents
 *     of some premises to remove unusable children from them.  For example, if
 *     $E$ is an environment that begins with premise $P$ and later contains a
 *     claim $C$, we expect $E$ to mean at least `{ :P C }`.  However, if
 *     inside $E$ we declare $c$ to be a constant and thereafter prove several
 *     facts about $c$, including, say, $Q(c)$, then we would *not* expect the
 *     meaning of $E$ to include `{ :P Q(c) }`, because the scope of $c$ ends
 *     at the end of $E$.  So when adding $E$ to the premise list for a
 *     sequent, we will need to modify it to remove conclusions that cannot be
 *     safely "exported" from $E$.
 *  3. When we later add support for document dependencies, one possibility is
 *     to include dependencies as attributes of the document.  But that would
 *     put them nowhere in the document's parent/child hierarchy, and thus they
 *     would not ever show up as accessible to any {@link LogicConcept}.  Of
 *     course, they should be accessible to every {@link LogicConcept} in the
 *     document, so a sequent should know to add dependency content to its
 *     premise list.
 *  4. Similar to the previous, as formulas get instantiated, we plan to cache
 *     those relevant instantiations within the formula itself, as attributes.
 *     To make those accessible to any claim in the scope of the formula, a
 *     sequent that includes the formula as a premise would need to extract and
 *     include its instantiations also.
 * 
 * As a consequence of all this, a sequent does not store the original
 * {@link LogicConcept} instances from the context in which it was created; it
 * must make copies so that it can modify them in (zero or more of) the ways
 * described above.
 * 
 * Furthemore, the original copies of the {@link LogicConcept} instances
 * accessible to a given conclusion may have extraneous attributes that are not
 * relevant to validation (and indeed might confound validation if they were
 * left in place).  Thus this class, when making copies of
 * {@link LogicConcept}s, also removes any unneeded attributes from them.  It
 * also ensures that all premises are marked as givens, and the conclusion is
 * not marked as a given, because a sequent has one item in positive position
 * (the conclusion) and $n-1$ items in negative position (the premises).
 * 
 * Again, all of these little details are technicalities that must be handled,
 * but that are not very conceptually interesting.  So we lump the handling of
 * them all into this one class.  The end result is stored as a single
 * {@link Environment} whose children are the contents of the sequent,
 * `{ :P_1 ... :P_n C }`, with the premises marked given and the conclusion not
 * marked given, with all of the above manipulations already applied.
 */
export class Sequent extends Environment {

    /**
     * Construct a new sequent ending in the given `conclusion`.  Its list of
     * accessibles will be the premises, except with all of the modifications
     * described at the top of this file then applied to them.  This function
     * is the workhorse of the class; it ensures that the sequent is not just
     * the conclusion preceded by its accessibles, but rather that all the
     * necessary adjustments have been made, as described above.
     * 
     * @param {LogicConcept} conclusion the final child of the sequent to
     *   construct
     * @param {LogicConcept} [container] the ancestor of `conclusion` in which
     *   to do the operation; only accessibles within this ancestor are
     *   considered for inclusion in the sequent, and this ancestor is treated
     *   as if it were the top-level "document" in which `conclusion` sits
     */
    constructor ( conclusion, container ) {

        // get the list of accessibles, which we will then modify
        // (we reverse it to get it in the order the sequent expects, with
        // lower-indexed elements coming earlier in the container)
        let accessibles = conclusion.accessibles( false, container ).reverse()

        // remove any accessible that is just a bound symbol inside a binding
        // environment, and thus should not count as a sequent premise
        accessibles = accessibles.filter( acc =>
            !( acc.parent() instanceof BindingEnvironment )
         || acc == acc.parent().lastChild() )
        
        // now make copies of all the accessibles, because code below may
        // modify the contents of the accessibles array, and we must ensure
        // that we do not alter the original LogicConcepts
        accessibles = accessibles.map( acc => acc.copy() )

        // TO DO LATER:
        // add support for including document dependencies, when that feature
        // is added more broadly across the entire project

        // TO DO LATER:
        // add support for filtering certain claims out of premise environments
        // containing constant declarations, when support for declarations is
        // added more broadly to the validation module

        // TO DO LATER:
        // add support for caching within a formula those of its instantiations
        // that are currently being used, and respect that cache in this
        // function by placing those instantiations after the formula itself
        // (this can be done any time, as formulas are already supported)

        // ensure that all accessibles are marked as givens and that the
        // conclusion is marked as a claim (but don't modify the original)
        accessibles.forEach( acc => acc.makeIntoA( 'given' ) )
        conclusion = conclusion.copy().unmakeIntoA( 'given' )

        // form an Environment from the premises and the conclusion
        super( ...accessibles, conclusion )

        // remove any attribute that will not be used subsequently by any
        // validation algorithm applied to this sequent.  see the documentation
        // below for the attributesToKeep member.
        Array.from( this.descendantsIterator() ).forEach( LC => {
            const attributesItHas = new Set( LC.getAttributeKeys() )
            const attributesToErase = Array.from(
                attributesItHas.difference( Sequent.attributesToKeep ) )
            if ( attributesToErase.length > 0 )
                LC.clearAttributes( ...attributesToErase )
        } )
    }

    /**
     * The set of attribute keys that should be retained by the premises and
     * conclusion of a sequent.  All other attribute keys will be removed, to
     * prevent incorrect results arising when comparing for equality two
     * {@link LogicConcept}s that differ only in their attributes.  Thus we
     * place on this list only the most relevant attributes for the meaning of
     * a {@link LogicConcept} for the purposes of validation--those are the
     * text of a symbol and the given flag for any {@link LogicConcept}.
     */
    static attributesToKeep = new Set( [
        'symbol text',
        MathConcept.typeAttributeKey( 'given' )
    ] )

    /**
     * For a sequent, the premises are all the children but the last.  See the
     * documentation at the top of this file for more information on the
     * structure of a sequent.  Note that these premises do not appear anywhere
     * in the user's {@link MathConcept} hierarchy; they are children only of
     * this sequent object.
     * 
     * @return {LogicConcept[]} the array of premises, as computed by the
     *   constructor
     * @see {@link Sequent#conclusion conclusion()}
     */
    premises () { return this.allButLastChild() }

    /**
     * For a sequent, conclusion is the last child.  See the documentation at
     * the top of this file for more information on the structure of a sequent.
     * Note that the conclusion is not the same one provided to the constructor
     * of this sequent, but a copy created and stored in this sequent.
     * 
     * @return {LogicConcept} the conclusion, as created by the constructor
     * @see {@link Sequent#premises premises()}
     */
     conclusion () { return this.lastChild() }

}
