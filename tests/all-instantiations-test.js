
import Matching from '../src/matching.js'
import { Application } from '../src/application.js'
import { BindingExpression } from '../src/binding-expression.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'
import Database from '../src/database.js'

describe( 'Multiple pattern instantiations', () => {

    it( 'Should declare the expected global identifiers', () => {
        expect( Matching ).to.be.ok
        expect( Matching.allInstantiations ).to.be.ok
    } )

    // Utility function used by tests below to extract meaning from the
    // test formatting convention described in the comments below.
    const getTestComponents = ( key, LCs ) => {
        expect( LCs.length ).equals( 3,
            `Malformed test: ${key} had ${LCs.length} LCs instead of 3` )
        // Convert all instances of the problem's metavariables into actual
        // metavariables (which would be prohibitive in putdown)
        const metavars = LCs[0].children().slice( 1 )
        metavars.forEach( mv => {
            // LCs[1] is of the form (problem
            //     (constraint pat1 exprs...) (constraint pat2 exprs...)
            // ...)
            // and thus every LCs[1][i][1] is a pattern
            LCs[1].descendantsSatisfying( d =>
                d.equals( mv )
             && d.address( LCs[1] )[0] > 0
             && d.address( LCs[1] )[1] == 1
            ).forEach( d => d.makeIntoA( Matching.metavariable ) )
            // LCs[2] is of the form
            //     (solutions (indices...) (mv1 exp1 mv2 exp2...) ...)
            // and thus even-index things in each solution are metavariables
            LCs[2].descendantsSatisfying( d =>
                d.equals( mv )
             && d.address( LCs[2] ).length == 2
             && d.address( LCs[2] )[0] > 1
             && d.address( LCs[2] )[0] % 2 == 0
             && d.address( LCs[2] )[1] % 2 == 0
            ).forEach( d => d.makeIntoA( Matching.metavariable ) )
        } )
        // Extract the constraints that define the problem.
        let constraints = LCs[1].children().slice( 1 )
        // The tests use the notation (@apply x y) for EFAs,
        // so we need to find each such expression and convert it into an
        // actual EFA.
        const apply = new LurchSymbol( '@apply' )
        const isEFANotation = lc => ( lc instanceof Application )
                                 && lc.numChildren() == 3
                                 && lc.child( 0 ).equals( apply )
        const convertToEFA = lc =>
            Matching.newEFA( lc.child( 1 ), lc.child( 2 ) )
        const wrapper = new Application( ...constraints )
        wrapper.descendantsSatisfying( isEFANotation )
               .map( d => d.replaceWith( convertToEFA( d ) ) )
        constraints = wrapper.children()
        // Extract the solutions and define the expected solution objects
        // from them.
        let expectedSols = [ ]
        for ( let i = 1 ; i < LCs[2].numChildren() ; i++ ) {
            const child = LCs[2].child( i )
            if ( i % 2 == 1 ) { // process the expression indices
                const newMap = { }
                for ( let j = 0 ; j < child.numChildren() ; j++ )
                    newMap[j] = parseInt( child.child( j ).text() )
                expectedSols.push( { expressionIndices : newMap } )
            } else { // process the solution mapping
                const last = expectedSols[expectedSols.length-1]
                expect( child.numChildren() % 2 == 0 ).equals( true,
                    `Expected solution of even length in ${key}: ${child}` )
                // The tests use the notation (@lambda (x , y)) for EFs,
                // so we need to find each such expression and convert it into
                // an actual EF.
                const lambda = new LurchSymbol( '@lambda' )
                const isEFNotation = lc =>
                    ( lc instanceof Application )
                 && lc.numChildren() == 2
                 && lc.firstChild().equals( lambda )
                 && ( lc.lastChild() instanceof BindingExpression )
                 && lc.lastChild().boundSymbols().length == 1
                const convertToEF = lc => Matching.newEF(
                    ...lc.lastChild().boundSymbols(),
                    lc.lastChild().lastChild() )
                child.descendantsSatisfying( isEFNotation )
                    .map( d => d.replaceWith( convertToEF( d ) ) )
                // Now form the parts into a mapping
                const result = { }
                for ( let i = 0 ; i < child.numChildren() - 1 ; i += 2 ) {
                    expect( child.child( i ) ).to.be.instanceOf( LurchSymbol,
                        `Expected solution in ${key} has ${child.child(i)}`
                      + ` where a metavariable belongs` )
                    expect( child.child( i ).isA( Matching.metavariable) )
                        .equals( true,
                            `Expected solution in ${key} has ${child.child(i)}`
                          + ` where a metavariable belongs` )
                    result[child.child(i).text()] = child.child( i + 1 )
                }
                last.solution = result
            }
        }
        return { constraints, expectedSols }
    }

    // Utility function used below for comparing two solution sets
    const hackyEquals = ( expSol, compSol ) => {
        if ( JSON.stringify( expSol.expressionIndices )
          != JSON.stringify( compSol.expressionIndices ) )
            return false
        const expDom = Object.keys( expSol.solution )
        const compDom = Array.from( compSol.solution.domain() )
        return expDom.length == compDom.length
            && expDom.every( name => compDom.indexOf( name ) > -1 )
            && expDom.every( name => Matching.alphaEquivalent(
                compSol.solution.get( name ),
                expSol.solution[name]
            ) )
    }

    // Utilities used below to create debugging strings
    const expSolStr = es => {
        if ( !es ) return undefined
        let result = '\t' + JSON.stringify( es.expressionIndices )
        for ( let k in es.solution )
            if ( es.solution.hasOwnProperty( k ) )
                result += `\n\t${k} => ${es.solution[k].toPutdown()}`
        return result
    }
    const debugHeader = ( constraints, expectedSols ) => {
        let debugText = 'Patterns = [ '
        debugText += constraints.map( c => 
            c.child( 1 ).toString() ).join( ', ' )
        debugText += ' ]\nExpressionLists = [ '
        debugText += constraints.map( c =>
            '\n           [ '
          + c.children().slice(2).map( e => e.toString() ).join( ', ' )
          + ' ]' ).join( ',' )
        debugText += `\n]\nExpected solutions:\n`
        for ( let i = 0 ; i < expectedSols.length ; i++ )
            debugText += `\t#${i+1}.\n${expSolStr( expectedSols[i] )}\n`
        return debugText
    }
    const debugFooter = computedSols => {
        let debugText = `Computed solutions:\n`
        for ( let i = 0 ; i < computedSols.length ; i++ ) {
            debugText += `\t#${i+1}.\n\t`
                       + JSON.stringify( computedSols[i].expressionIndices )
                       + '\n'
            for ( let k of computedSols[i].solution.domain() )
                debugText +=
                    `\t${k} => ${computedSols[i].solution.get(k).toPutdown()}\n`
        }
        return debugText
    }

    it( 'Should compute correct solutions for the whole database', () => {
        // Get all matching tests from the database
        const matchingTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'multi-matching' )
        // they are all entitled "/path/to/test N.putdown" for some N,
        // so sort them by that value of N in increasing order.
        const getNum = key => {
            const parts = key.split( ' ' )
            return parseInt( parts[parts.length-1].split( '.' )[0] )
        }
        matchingTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )
        // Now run each test as follows...

        matchingTests.forEach( key => {
            // Look up the test with the given key and process all its content
            // using the utility function above
            const LCs = Database.getObjects( key )
            const { constraints, expectedSols } = getTestComponents( key, LCs )
            // Finally, make the function call that creates a generator that
            // will actually solve the problem
            const debug = false // getNum( key ) == 4
            const G = Matching.allInstantiations(
                constraints.map( c => c.child( 1 ) ),
                constraints.map( c => c.children().slice( 2 ) ),
                null, debug )
            // Now actually run the matching algorithm
            let debugText = debugHeader( constraints, expectedSols )
            let computedSols
            expect( () => computedSols = Array.from( G ),
                `Error when running allInstantiations on ${key}:\n${debugText}`
            ).not.to.throw()
            debugText += debugFooter( computedSols )
            // And check to see if it gave the expected answer
            expect( computedSols.length ).to.equal( expectedSols.length,
                `Length of result doesn't match length of expectation:\n${debugText}` )
            const missing = expectedSols.find( sol1 =>
                !computedSols.some( sol2 => hackyEquals( sol1, sol2 ) ) )
            expect( missing,
                `Missing this expected solution:\n${expSolStr(missing)}\n`
              + `in this problem:\n${debugText}`
            ).to.be.undefined
        } )
    } )

} )
