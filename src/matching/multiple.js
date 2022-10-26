
import { Problem } from './problem.js'
import { fullBetaReduce } from './expression-functions.js'

// Utility function used by allInstantiations(), below.
// Applies the given solution to the metavariables in the given pattern,
// doing full beta reduction thereafter, in case it is necessary.
const applyWithBeta = ( solution, pattern ) => {
    if ( !solution ) return pattern
    for ( let symbol of solution.domain() ) {
        const subst = solution._substitutions[symbol]
        pattern = subst.appliedTo( pattern )
    }
    return fullBetaReduce( pattern )
}

// Utility function used by allInstantiations(), below.
// Creates a new Solution instances that is equal to a copy of s1 with all the
// pairs from s2 added.  Note that this will throw an error if s1 and s2
// disagree on the image of any metavariable.
const unionOfSolutions = ( s1, s2 ) => {
    if ( !s1 ) return s2
    const result = s1.copy()
    for ( let symbol of s2.domain() )
        result.add( s2._substitutions[symbol] )
    return result
}

/**
 * {@link Problem Matching problems} are of the form
 * $\\{(p_1,e_1),\ldots,(p_n,e_n)\\}$, where each $p_i$ is pattern and each
 * $e_i$ is an expression.  A {@link Solution Solution} $S$ to such a problem
 * is such that for every $i\in\\{1,\ldots,n\\}$, $S(p_i)=e_i$.  You can
 * compute the full set of such solutions with {@link Problem#solutions the
 * solutions() member}.  More details are given in the documentation for
 * {@link module:Matching the Matching module}.
 * 
 * This function generalizes that capability as follows.
 * 
 * It supports problems of the form $\\{(p_1,E_1),\ldots,(p_n,E_n)\\}$, where
 * the $p_i$ are as before but the $E_i$ are sets of expressions.  It yields
 * all solutions $S$ satisfying $S(p_i)\in E_i$.  (The special case where each
 * $E_i$ has exactly one entry is the original notion of a matching problem as
 * stated above.)  This algorithm is designed to explore the wider space of
 * possible solutions created by permitting larger $E_i$, but in the most
 * efficient way, organizing the exploration to prune the largest branches in
 * the search tree as early as possible.
 * 
 * In addition to producing solutions $S$ satisfying $S(p_i)\in E_i$, because
 * each $E_i$ is not just a set but an array, each $S$ can come with a mapping
 * $f:\mathbb{N}\to\mathbb{N}$ that tells us exactly which entry of each $E_i$
 * was matched: not only is $S(p_i)\in E_i$ but $S(p_i)=E_i[f(i)]$, that is,
 * the $f(i)$th entry in the list $E_i$.  This mapping is returned for each
 * solution $S$ generated, and in the parameters below is named the
 * "expressionIndices" list for that solution.  Specifically, we encode such an
 * $f$ as a simple JavaScript array $[f(1),\ldots,f(n)]$.  Each such
 * expressionIndices array has length $n$, where $n$ comes from the original
 * input to this function.
 * 
 * @param {LogicConcept[]} patterns JavaScript array of LogicConcept instances,
 *   each of which may contain {@link module:Matching.metavariable
 *   metavariables}, and each will be used as a pattern.  The elements
 *   `patterns[i]` in this array are the patterns documented as $p_i$ above.
 * @param {LogicConcept[][]} expressionLists array of arrays of LogicConcept
 *   instances, none of which should contain metavariables; the outer array
 *   must be the same length as `patterns`, because each array within it
 *   corresponds to an entry in `patterns`, as discussed above.  That is, the
 *   elements `expressionLists[i]` in this array are the "sets" documented as
 *   $E_i$ above.
 * @param {Solution} [soFar] used in recursion, defaults to an empty Solution;
 *   clients typically do not provide this value
 * @param {boolean} [debug] whether to print debugging information to the
 *   console while it does its job, defaults to false
 * @returns {Object[]} an array of objects, each of which has two entries:
 *   one under the key "solution" maps to a solution as described above, and
 *   the entry under the key "expressionIndices" is an array of integers that
 *   indicates which entry in each of the `expressionLists` is matched by each
 *   of the `patterns`
 * @alias module:Matching.allInstantiations
 */
export function* allInstantiations (
    patterns, expressionLists, soFar = null, debug = false
) {
    const DEBUG = debug ? console.log : () => {}
    DEBUG( `
allIn(  patterns = [ ${patterns.map(x=>x.toString()).join(', ')} ],
        expressionLists = [ ${expressionLists.map(L=>'\n            [ '+L.map(e=>e.toString()).join(', ')+' ]').join(',')}
        ], soFar = ${soFar}  )`)
    // base cases
    if ( patterns.length == 0 ) {
        DEBUG( '    base case - one solution: soFar w/indices { }' )
        yield { solution : soFar, expressionIndices : { } }
        return
    }
    if ( expressionLists.some( list => list.length == 0 ) ) {
        DEBUG( '    base case - no solutions' )
        return
    }
    // recursive case
    // 1. find pattern with minimal number of matches on its expr list
    let min = null
    outerloop:
    for ( let i = 0 ; i < patterns.length ; i++ ) {
        let current = {
            patternIndex : i,
            solutions : [ ],
            expressionIndices : [ ]
        }
        for ( let j = 0 ; j < expressionLists[i].length ; j++ ) {
            const nextProblem = new Problem(
                applyWithBeta( soFar, patterns[i].copy() ),
                expressionLists[i][j] )
            DEBUG( `    will try to match ${nextProblem.toString()}` )
            for ( let solution of nextProblem.solutions() ) {
                current.solutions.push( solution )
                DEBUG( `        FOUND: ${solution}` )
                current.expressionIndices.push( j )
                if ( min
                  && current.solutions.length >= min.solutions.length ) {
                    DEBUG( `    ${i} got >= shortest...skipping` )
                    continue outerloop
                }
            }
        }
        min = current
        DEBUG( `    shortest is @ ${i} w/len ${min.solutions.length}` )
        if ( min.solutions.length == 0 ) {
            // signal to point 2., below, that there are no solutions:
            min = null
            break
        }
    }
    // 2. other base case: maybe no matches succeeded, so no instantiations
    if ( !min ) {
        DEBUG( '    base case - all match lists empty - no solutions' )
        return
    }
    // 3. do all possible recursions and bundle them into our solutions, too
    DEBUG( '    recurring...' )
    const insertedExpressionIndex = ( newIndex, oldData ) => {
        // oldData is of the form { solution, expressionIndices }
        const newMap = { }
        for ( let k in oldData.expressionIndices )
            newMap[k >= min.patternIndex ? parseInt(k) + 1 : parseInt(k)] =
                oldData.expressionIndices[k]
        newMap[min.patternIndex] = newIndex
        oldData.expressionIndices = newMap
        return oldData
    }
    for ( let i = 0 ; i < min.solutions.length ; i++ ) {
        const recursiveGenerator = allInstantiations(
            patterns.without( min.patternIndex ),
            expressionLists.without( min.patternIndex ),
            unionOfSolutions( soFar, min.solutions[i] ), debug )
        for ( let recursiveSol of recursiveGenerator ) {
            recursiveSol = insertedExpressionIndex(
                min.expressionIndices[i], recursiveSol )
            recursiveSol.solution = unionOfSolutions( soFar,
                recursiveSol.solution )
            DEBUG( `...rec - ${recursiveSol.solution} with indices `
                 + JSON.stringify( recursiveSol.expressionIndices ) )
            yield recursiveSol
        }
    }
}
