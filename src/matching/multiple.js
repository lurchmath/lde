
import { Problem } from './problem.js'
import { Solution } from './solution.js'
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
        if ( !soFar ) soFar = new Solution( new Problem() )
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

// Utility function used below to convert index maps into arrays
const indexMapToArray = map => {
    const indices = Object.keys( map ).map( key => parseInt( key ) )
    const length = indices.length > 0 ? Math.max( ...indices ) + 1 : 0
    const result = Array( length ).fill( 0 )
    result.forEach( ( _, i ) => result[i] = map[i] )
    return result
}

/**
 * There will be situations in which we want to seek instantiations of patterns
 * but not require absolutely every pattern to be instantiated.
 * 
 * The simplest example is probably the following:  Imagine we have a formula
 * for the introduction of a conditional, such as `:{ :{ :A B } (=> A B) }` if
 * we're using {@link LogicConcept.fromPutdown putdown notation}.  We're
 * checking to see if it justifies conclusion `(=> P Q)`, so we need to find a
 * premise of the form `{ :P Q }`.  But actually, we would accept a premise
 * that's just of the form `Q` even if there is no `P` in sight, because that
 * could be strictly stronger than `{ :P Q }`, so we would want to run it
 * through validation to see if it works.  Thus we do not need to match both
 * `P` and `Q` when searching; we must match `Q` and can optionally also match
 * `P`.
 * 
 * That's not an excellent example, because of course just matching the final
 * conclusion `(=> A B)` to `(=> P Q)` provides us with the full instantiation,
 * but there are many example of rules with environment premises, and not all
 * are so simple.
 * 
 * We therefore create this function, which behaves exactly like
 * {@link module:Matching.allInstantiations allInstantiations()}, except that
 * you can provide an index that indicates how to separate the constraints into
 * the required ones and the optional ones.  We call that index
 * `firstOptional`, and it has the meaning that it is the index of the first
 * optional constraint, in the sense that all previous ones are required, and
 * any constraint from that point onward is optional.
 * 
 * The return values will be exactly like those for
 * {@link module:Matching.allInstantiations allInstantiations()}, except that
 * some of the expression indices may be $-1$, indicating that the pattern was
 * not matched to any expression.  Only optional constraints will have an
 * expression index of $-1$; all required constraints will have non-negative
 * expression indices.
 * 
 * @param {LogicConcept[]} patterns this parameter has the same meaning as it
 *   has in {@link module:Matching.allInstantiations allInstantiations()}; see
 *   the documentation there
 * @param {LogicConcept[][]} expressionLists this parameter has the same
 *   meaning as it has in {@link module:Matching.allInstantiations
 *   allInstantiations()}; see the documentation there
 * @param {integer} firstOptional the index of the first optional constraint.
 *   To indicate that all constraints are required, set this value to be less
 *   than 0 or larger than the last valid index into `patterns`.
 * @param {Solution} soFar this parameter has the same meaning as it has in
 *   {@link module:Matching.allInstantiations allInstantiations()}; see the
 *   documentation there
 * @param {boolean} debug this parameter has the same meaning as it has in
 *   {@link module:Matching.allInstantiations allInstantiations()}; see the
 *   documentation there
 * @returns {Object[]} the return value has the same format as it has in
 *   {@link module:Matching.allInstantiations allInstantiations()}; see the
 *   documentation there, plus the comments above about $-1$ expression indices
 *   for unmatched and optional constraints
 * @alias module:Matching.allOptionalInstantiations
 */
export function* allOptionalInstantiations (
    patterns, expressionLists, firstOptional = -1, soFar = null, debug = false
) {
    // Degenerate case: Nothing optional; just call allInstantiations()
    if ( firstOptional < 0 || firstOptional >= patterns.length ) {
        yield* allInstantiations( patterns, expressionLists, soFar, debug )
        return
    }
    // Generate all solutions for the non-optional portion of the input,
    // and build upon those with various extensions...
    const outerGenerator = allInstantiations(
        patterns.slice( 0, firstOptional ),
        expressionLists.slice( 0, firstOptional ),
        soFar, debug )
    for ( let nonOptionalSolution of outerGenerator ) {
        let innerGenerator
        // Extend it to all solutions for which
        // patterns[firstOptional],expressionLists[firstOptional] has a match.
        // Just recursively call this function to extend nonOptionalSolution,
        // requiring index 0 to be matched:
        innerGenerator = allOptionalInstantiations(
            patterns.slice( firstOptional ),
            expressionLists.slice( firstOptional ), 1,
            nonOptionalSolution.solution )
        for ( let optionalSolution of innerGenerator ) {
            // Then concatenate the two expression index lists before yielding:
            optionalSolution.expressionIndices = [
                ...indexMapToArray( nonOptionalSolution.expressionIndices ),
                ...indexMapToArray( optionalSolution.expressionIndices )
            ]
            yield optionalSolution
        }
        // Also extend it to all solutions for which
        // patterns[firstOptional],expressionLists[firstOptional] has no match.
        // Just recursively call this function to extend nonOptionalSolution,
        // leaving out that first pair entirely:
        innerGenerator = allOptionalInstantiations(
            patterns.slice( firstOptional + 1 ),
            expressionLists.slice( firstOptional + 1 ), 0,
            nonOptionalSolution.solution )
        for ( let optionalSolution of innerGenerator ) {
            // Then concatenate the two expression index lists before yielding,
            // marking the missing pair as not used:
            optionalSolution.expressionIndices = [
                ...indexMapToArray( nonOptionalSolution.expressionIndices ),
                -1, ...indexMapToArray( optionalSolution.expressionIndices )
            ]
            yield optionalSolution
        }
    }
}
