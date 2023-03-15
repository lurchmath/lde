
/**
 * ## What is matching?
 * 
 * It is very common in mathematics to say that one mathematical expression
 * "is of the form" of another.  For example, we might say that $2x^2-5$ is of
 * the form $A-B$, where what we mean is that substituting $A=2x^2$ and $B=5$
 * into $A-B$ produces the expression $2x^2-5$.
 * 
 * For us to be able to speak this way requires no special treatment of the
 * first expression (in this case, the expression $2x^2-5$), but the other
 * expression (in this case, the expression $A-B$) must be treated as a
 * structure or pattern into which we may do substitutions.
 * 
 * Given two mathematical expressions, *pattern matching* (or just *matching*)
 * is the act of determining the substitution (like $A=2x^2$ and $B=5$ from
 * that example) that demonstrates that one expression is of the form of the
 * other.
 * 
 * ## Terminology
 * 
 * When performing pattern matching, one of the two expressions is the one
 * intended for substitution, and the other expression is the goal to be built
 * by doing the substitution.  The one into which substitution happens is
 * called the *pattern* and the other is simply the *expression.*
 * 
 * The symbols that will be replaced by substitution ($A$ and $B$ in the
 * example above) have a special status; we call them *metavariables.*  Not
 * all symbols in the pattern are metavariables; for example, the operator $-$
 * in the expression $A-B$ is not a metavariable, because the intent is not to
 * replace it with another operator; it should remain unchanged.  (We would not
 * say that $2^k$ is of the form $A-B$, even though both are a binary operator
 * applied to two operands.)
 * 
 * In mathematics, one usually figures out what is a metavariable from context
 * and common sense, but in software, it will be important to mark out
 * metavariables explicitly.  To that end, this module imports all the tools
 * defined in the
 * {@link module:Metavariables metavariables module} and exposes them to
 * clients.  For more information about determining metavariables from context,
 * see {@link Formula the Formula namespace}.
 * 
 * Thus the problem of matching can be stated like so: Given a pattern $P$ and
 * an expression $E$, where $P$ may contain metavariables and $E$ may not,
 * find a mapping $S$ from the metavariables in $P$ into the space of all
 * expressions such that $S(P)=E$ (or determine that no such $S$ exists).
 * This is the simplest way to state the problem, but it is actually slightly
 * more complex.
 * 
 * ## Expression functions
 * 
 * In mathematics, we often want to perform matching while paying attention to
 * certain key parameters.  For example, we could express the general rule for
 * mathematical induction as
 *     $$ (P(0) \text{ and } \forall k,P(k)\Rightarrow P(k+1))\Rightarrow \forall n,P(n). $$
 * Here, it is important that $P$ be a metavariable that takes a single
 * parameter, and that $P(0)$, $P(k)$, and $P(n)$ be the expressions obtained
 * by substituting $0$, $k$, and $n$ (respectively) in for that parameter.
 * 
 * We call such a $P$ an *expression function,* because it takes an expression
 * as input and generates another expression as output.  We call an expression
 * like $P(0)$ an *expression function application* because it applies an
 * expression function to an argument, and thus represents the output
 * expression of $P$ applied to $0$.  To handle these details, this module
 * imports all the tools defined in the
 * {@link module:ExpressionFunctions ExpressionFunctions} module and exposes
 * them to clients.
 * 
 * Providing support for expression functions makes the job of matching more
 * difficult.  For example, consider performing matching with $P=Q(x)$ and
 * $E=3x+e^x$, and $Q$ the only metavariable, also an expression function.
 * Which of the following is the correct substitution $S$?
 * 
 *  * $S(Q)$ is the expression function $t\mapsto 3t+e^t$
 *  * $S(Q)$ is the expression function $t\mapsto 3x+e^t$
 *  * $S(Q)$ is the expression function $t\mapsto 3t+e^x$
 *  * $S(Q)$ is the expression function $t\mapsto 3x+e^x$
 * 
 * The answer is that all are correct, and thus there is more than one correct
 * answer to the question, and thus there must be more than one output from
 * the matching algorithm.
 * 
 * Thus the matching algorithm takes as input a pattern-expression pair
 * $(P,E)$ as stated above, but its output is a set of substitutions
 * $\\{S_1,\ldots,S_n\\}$, with $n=0$ (empty set) if the problem has no
 * solutions.  But it's actually one step more complex than that, also.
 * 
 * ## Matching, fully stated
 * 
 * We will often want to match multiple pattern-expression pairs at the same
 * time.  For example, a user might claim that a conclusion $X$ follows from
 * some premises $J\Rightarrow X$ and $J$ using the law of modus ponens,
 * typically written $A$, $A\Rightarrow B$, therefore $B$.  We thus have not
 * one matching problem, but three in one; we want to know whether there is a
 * substitution $S$ that maps the tuple $(A,A\Rightarrow B,B)$ to the tuple
 * $(J,J\Rightarrow X,X)$.  Certainly, we could simply put a dummy wrapper
 * around the tuples to create a single expression, as in
 *     $$ Wrapper(A,A\Rightarrow B,B)\text{ and }Wrapper(J,J\Rightarrow X,X). $$
 * But it is more natural to simply support multiple inputs to the matching
 * algorithm in the first place.
 * 
 * Thus we come to the following final statement of the problem:  The matching
 * algorithm takes as input a set of pairs $\\{(P_1,E_1),\ldots,(P_n,E_n)\\}$,
 * where each $P_i$ is a pattern (may contain metavariables) and each $E_i$ is
 * an expression (may not contain metavariables).  It returns a set
 * $S=\\{S_1,\ldots,S_m\\}$ of solutions such that for all $i,j$, we have
 * $S_j(P_i)=E_i$.  Furthermore, the set $S$ is comprehensive, in that any
 * possible solution is either present in the set $S$ or can be obtained by
 * composing $S$ with another function.  (I.e., $S$ is the set of most general
 * solutions.)
 * 
 * We call a set of inputs $\\{(P_1,E_1),\ldots,(P_n,E_n)\\}$ a
 * *matching problem,* and we define the {@link Problem Problem class} to
 * let clients create matching problems and call an algorithm to solve them.
 * Each pair $(P_i,E_i)$ is called a *constraint* and can be represented by
 * an instance of the {@link Constraint Constraint class}.
 * 
 * We call each $S_j$ a *matching solution* and we define the
 * {@link Solution Solution class} to represent such objects; the output of
 * the matching algorithm will be a JavaScript array of
 * {@link Solution Solutions}.  Each pair $a\mapsto b$ in a solution mapping
 * is called a *substitution,* and will be represented by a member of the
 * {@link Substitution Substitution class}.  To apply a {@link Substitution
 * Substitution} or a {@link Solution Solution} to an {@link LogicConcept
 * LogicConcept}, see {@link Formula the Formula namespace}.
 * 
 * ## Technical details
 * 
 * A substitution that would cause variable capture does not count as a
 * solution to a matching problem.  This is for two reasons:  First, the very
 * definition of substitution does not permit variable capture.  Second, the
 * mathematical uses to which we will put the algorithm do not want such
 * solutions anyway.  Consider the following example.
 * 
 * A standard rule of predicate logic is universal instantiation, which says
 * that from $\forall x,P(x)$, one can conclude any instance $P(t)$.  However,
 * if we were to consider the premise $\forall x,\exists y,y=x+1$, we cannot
 * from it conclude $\exists y,y=y+1$.  We might try to justify such an
 * inference by pointing out that it is indeed an instance of the rule in
 * question, by way of the substitution $S(x)=y$.  But such a substitution
 * replaces $x$ with $y$ at a location where $y$ is not free to replace $x$,
 * and thus introduces variable capture.  So such an $S$ is not actually a
 * solution to the matching problem inherent in that attempted inference.
 * 
 * To ensure that our matching algorithm does not introduce variable capture,
 * we use {@link module:deBruijn de Bruijn indices} to represent patterns and
 * expressions internally during the matching process.
 * 
 * Recall the example above, in which an expression function $Q$ was assigned
 * the value $t\mapsto 3t+e^t$.  This dummy variable $t$ was chosen because it
 * did not appear anywhere in the problem, so it could not be confused with
 * any variable already in use.  There are many times in the course of working
 * with expressions and matching when it is convenient to have a source that
 * can generate an arbitrary number of unused variables.  We thus also have
 * the {@link NewSymbolStream NewSymbolStream class}, for that purpose.
 *
 * @module Matching
 */

import { NewSymbolStream } from "./matching/new-symbol-stream.js"
import {
    metavariable, containsAMetavariable, metavariablesIn, metavariableNamesIn
} from "./matching/metavariables.js"
import {
    deBruijn, equal, encodeSymbol, encodeExpression, encodedIndices,
    adjustIndices, decodeSymbol, decodeExpression
} from './matching/de-bruijn.js'
import { Constraint } from "./matching/constraint.js"
import { Substitution } from "./matching/substitution.js"
import {
    newEF, isAnEF, arityOfEF, applyEF, constantEF, projectionEF, applicationEF,
    newEFA, isAnEFA, canBetaReduce, betaReduce, fullBetaReduce, alphaEquivalent,
    bodyOfEF, parametersOfEF, expressionFunction, expressionFunctionApplication
} from '../src/matching/expression-functions.js'
import { Problem } from "./matching/problem.js"
import { Solution } from "./matching/solution.js"
import {
    allInstantiations, allOptionalInstantiations
} from "./matching/multiple.js"

export default {
    NewSymbolStream, expressionFunction, expressionFunctionApplication,
    metavariable, containsAMetavariable, metavariablesIn, metavariableNamesIn,
    deBruijn, equal, encodeSymbol, encodeExpression, encodedIndices,
    adjustIndices, decodeSymbol, decodeExpression,
    Constraint, Substitution,
    newEF, isAnEF, arityOfEF, applyEF, constantEF, projectionEF, applicationEF,
    newEFA, isAnEFA, canBetaReduce, betaReduce, fullBetaReduce, alphaEquivalent,
    bodyOfEF, parametersOfEF,
    Problem, Solution,
    allInstantiations, allOptionalInstantiations
}
