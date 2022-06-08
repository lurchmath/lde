
import { Problem } from './problem.js'
import { fullBetaReduce } from './expression-functions.js'

const applyWithBeta = ( solution, pattern ) => {
    if ( !solution ) return pattern
    for ( let symbol of solution.domain() ) {
        const subst = solution._substitutions[symbol]
        pattern = subst.appliedTo( pattern )
    }
    return fullBetaReduce( pattern )
}

const unionOfSolutions = ( s1, s2 ) => {
    if ( !s1 ) return s2
    const result = s1.copy()
    for ( let symbol of s2.domain() )
        result.add( s2._substitutions[symbol] )
    return result
}

// Input:
//   patterns : JavaScript array of LCs with metavariables
//   expressionLists : array of array of LCs without metavariables,
//     must be the same length as patterns; one list per pattern
//   extendThis : Solution, optional, defaults to empty solution
// Output:
//   array of { solution : Solution, expressionIndices : [ i1,...,iN ] }
//   where N == patterns.length
//   and solution instantiates patterns[j][ik] to expressionLists[i][k]
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
