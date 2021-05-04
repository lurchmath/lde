
import { MathConcept } from '../src/math-concept.js'
import { LogicConcept } from '../src/logic-concept.js'

/**
 * An Expression is a type of {@link LogicConcept}.  (For the other types, see
 * the documentation of that class.)  Expressions are mathematical statements
 * and their sub-parts, in the usual manner of organizing into tree form what
 * many mathematicians informally call "mathematical expressions" as trees.
 * 
 * For instance, `3 + k = 9` and `58/(1+x) < e` are two mathematical
 * expressions, written here without the usual mathematical notation, for
 * simplicity.  Their subexpressions are also expressions, including, for
 * example, `9`, `3+k`, `1+x`, and `58/(1+x)`.  Even `+` and `=` are
 * subexpressions; they are functions that are being applied to arguments.
 * 
 * When we speak of "tree form," we refer to the idea that every expression
 * can be organized into a tree by following the order of operations.  For
 * example, `3 + k = 9` might have `=` at the root, with right child `9` and
 * left child a subtree with `+` over `3` and `k`.  Although that is one way
 * to organize expressions into trees, we actually choose a slightly different
 * means of applying functions/operators to arguments, which will be covered
 * in the documentation for the {@link Application} class.
 * 
 * Expressions are analogous to what mathematicians typically write inside
 * `$...$` or `$$...$$` math mode in LaTeX.  This distinguishes them from
 * larger structures that appear in mathematical writing, such as a proof,
 * or a section, or an axiom, or an exercise.
 * 
 * There are three types of Expressions:
 * 
 *  1. A {@link Symbol}, which is atomic (a one-node tree), and can contain
 *     any mathematical symbol, such as `x`, `5`, `e`, `pi`, `B_4`, etc.
 *     (Note that notation here is in text form just for the documentation;
 *     actual symbols need not use this style.)
 *  2. An {@link Application} of a function or operator to zero or more
 *     arguments, as in the example of `3 + k`, above, which applies `+` to
 *     the arguments `3` and `k`.  Applications are not atomic.
 *  3. A {@link Binding}, which applies a quantifier or ranged operator to
 *     a body, using a bound variable.  There are many examples of this in
 *     mathematics, including indexed sums and products, existential and
 *     universal quantifiers, and more.  Bindings are not atomic.
 * 
 * We do not define these further here; see the documentation of each of
 * the classes linked to above for details.  The Expression class is an
 * abstract base class, and every instance should be an instance of one of
 * those three subclasses.
 */
export class Expression extends LogicConcept {
    
    static className = MathConcept.addSubclass( 'Expression', Expression )

    /**
     * If this Expression has an Expression parent, then it is not the
     * outermost expression in the hierarchy.  However, if it has a parent
     * that is some other kind of {@link MathConcept} or
     * {@link LogicConcept}, then it is the outermost Expression in the
     * hierarchy.  If it has no parent, it is the outermost.
     * 
     * @returns {boolean} Whether this expression is the outermost
     *   Expression in the {@link MathConcept} hierarchy in which it sits
     * @see {@link Expression#getOutermost getOutermost()}
     */
    isOutermost () {
        return this._parent === null
            || !( this._parent instanceof Expression )
    }

    /**
     * This function walks up the {@link MathConcept} hierarchy containing
     * this Expression until it finds an ancestor satisfying
     * {@link Expression#isOutermost isOutermost()}, and then it returns that
     * Expression.
     * 
     * @returns {Expression} the outermost Expression ancestor of this
     *   Expression
     */
    getOutermost () {
        return this.isOutermost() ? this : this._parent.getOutermost()
    }

    /**
     * Many mathematical expressions have standard interpretations.  We permit
     * Expression instances to be marked with an attribute indicating that
     * they have a standard interpretation, and what that interpretation is.
     * This function looks for such attributes and applies them, computing the
     * value of the Expression, if it has one, and returning undefined if it
     * does not.
     * 
     * An Expression that has a value will have an attribute whose key is the
     * string `"evaluate as"` and whose value is a string such as `"integer"`
     * or `"integer base 2"` or `"string"` or `"ordered pair"` or any of a
     * wide variety of other ways to evaluate the Expression's content.
     * 
     * It is intended that this list can grow over time, and this function be
     * updated to support new types of simple mathematical values as they are
     * needed.  It is not intended that every kind of possible interpretation
     * should show up on this list, but rather just those types that are
     * common/standard across enough of mathematics that they will be used in
     * any kind of mathematics software.
     * 
     * This initial implementation provides support for *none* of the types of
     * valuation described above, because each is best implemented in one of
     * this class's subclasses ({@link Symbol}, {@link Application}, or
     * {@link Binding}) instead.  A stub is implemented here as a pure virtual
     * method, to guarantee that the function exists for all Expression
     * instances and returns undefined by default.
     * 
     * @returns {*} any basic JavaScript value representing this Expression,
     *   or undefined if it there is no such value
     */
    value () { }
    
}
