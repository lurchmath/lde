
/**
 * This module defines a constant and function that formalize the concept of a
 * "metavariable."  We often want to treat an expression as a pattern (or an
 * expression scheme) that represents the infinite family of expressions
 * achievable by substituting expressions in for some or all of the symbols in
 * the original expression.
 * 
 * For example, we may sometimes treat $x+y$ as literally the expression $x+y$,
 * but other times we may want to treat it as a general scheme into which we can
 * substitute values, such as replacing $x=3a,y=\sqrt{6}$ to obtain
 * $3a+\sqrt{6}$.
 * 
 * When an expression contains symbols that can be replaced by entire
 * expressions, we call those symbols *metavariables.*  For example, the $x$ and
 * $y$ in the second half of the previous example are metavariables, but the $+$
 * symbol in that same expression was not, even though it (like $x$ and $y$) is
 * a symbol.
 * 
 * @see {@link module:Metavariables.metavariable metavariable} - for marking
 *   certain symbols as metavariables
 * @see {@link module:Metavariables.containsAMetavariable containsAMetavariable()} - for
 *   testing whether expressions contain metavariables
 * 
 * @module Metavariables
 */

/**
 * To facilitate marking some symbols as metavariables (and not others), we
 * declare a string constant that can be used with the
 * {@link MathConcept#isA isA()} and {@link MathConcept#asA asA()} and
 * {@link MathConcept#makeIntoA makeIntoA()} functions in the
 * {@link MathConcept MathConcept} class.  For example, to mark a symbol `A` as
 * a metavariable, one can import this module (call it `M`) and then call
 * `A.makeIntoA( M.metavariable )`.  You can later test to see if `A` is a
 * metavariable with `A.isA( M.metavariable )`.
 * 
 * @see {@link module:Metavariables.containsAMetavariable containsAMetavariable()}
 */
export const metavariable = 'LDE MV'

/**
 * A *pattern* is an {@link Expression Expression} that *may* contain a
 * metavariable.  Hence *all* {@link Expression Expressions} are
 * patterns, though an {@link Expression Expression} without any
 * metavariables is a pattern only in a degenerate sense.  But sometimes we
 * need to know we are working with an {@link Expression Expression} that
 * does *not* contain a metavariable, that is, a non-pattern expression.
 * This function is useful for detecting that case.
 * 
 * Recall that a metavariable is any {@link Symbol Symbol} that has been
 * marked as a metavariable as described in the documentation for
 * {@link module:Metavariables.metavariable metavariable}.
 * 
 * @param {LogicConcept} LC the {@link LogicConcept LogicConcept} to test
 *   for whether it contains any metavariables
 * @returns {boolean} true if and only if `LC` contains no metavariables
 * @static
 */
export const containsAMetavariable = LC => {
    return LC.hasDescendantSatisfying( d => d.isA( metavariable ) )
}
