
import Matching from '../src/matching.js'
import { Application } from '../src/application.js'
import { Environment } from '../src/environment.js'
import { BindingExpression } from '../src/binding-expression.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'
import Database from '../src/database.js'
import Formula from '../src/formula.js'

describe( 'Multiple pattern instantiations', () => {

    it( 'Should declare the expected global identifiers', () => {
        expect( Matching ).to.be.ok
        expect( Matching.allInstantiations ).to.be.ok
        expect( Matching.allOptionalInstantiations ).to.be.ok
    } )

    // Utility function used by tests below to build solutions w/expr. indices
    const pairToSolution = ( key, exprIndices, instantiation ) => {
        // process the expression indices
        const newMap = { }
        for ( let j = 0 ; j < exprIndices.numChildren() ; j++ )
            newMap[j] = parseInt( exprIndices.child( j ).text() )
        const result = { expressionIndices : newMap }
        // process the solution mapping
        expect( instantiation.numChildren() % 2 == 0 ).equals( true,
            `Expected solution of even length in ${key}: ${instantiation}` )
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
            ...lc.lastChild().boundSymbols(), lc.lastChild().lastChild() )
            instantiation.descendantsSatisfying( isEFNotation )
            .map( d => d.replaceWith( convertToEF( d ) ) )
        // Now form the parts into a mapping
        const solution = { }
        for ( let i = 0 ; i < instantiation.numChildren() - 1 ; i += 2 ) {
            expect( instantiation.child( i ) ).to.be.instanceOf( LurchSymbol,
                `Expected solution in ${key} has ${instantiation.child(i)}`
              + ` where a metavariable belongs` )
            expect( instantiation.child( i ).isA( Matching.metavariable) )
                .equals( true,
                    `Expected solution in ${key} has ${instantiation.child(i)}`
                  + ` where a metavariable belongs` )
            solution[instantiation.child(i).text()] =
                instantiation.child( i + 1 )
        }
        result.solution = solution
        return result
    }

    // Utility function used by tests below to extract meaning from the
    // test formatting convention described in the comments below.
    const getTestComponents = ( key, LCs ) => {
        expect( LCs.length ).equals( 3,
            `Malformed test: ${key} had ${LCs.length} LCs instead of 3` )
        // Use a copy so we don't mess up the database
        LCs = LCs.map( LC => LC.copy() )
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
        for ( let i = 1 ; i < LCs[2].numChildren() ; i += 2 )
            expectedSols.push( pairToSolution(
                key, LCs[2].child( i ), LCs[2].child( i + 1 ) ) )
        return { constraints, expectedSols }
    }

    // Utility function used below for comparing two solution sets
    const hackyEquals = ( expSol, compSol ) => {
        const intKeys = obj =>
            Object.keys( obj ).map( x => parseInt( x ) ).sort()
        if ( !JSON.equals( intKeys( expSol.expressionIndices ),
                           intKeys( compSol.expressionIndices ) ) )
            return false
        for ( let key of intKeys( expSol.expressionIndices ) )
            if ( expSol.expressionIndices[key]
              != compSol.expressionIndices[key] )
                return false
        const expDom = Object.keys( expSol.solution )
        const compDom = compSol.solution ?
            Array.from( compSol.solution.domain() ) : [ ]
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
        // Get all multi-matching tests from the database
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

    it( 'Should compute degenerate optional solutions for the database', () => {
        // This test just repeates the one above, but uses the "optional"
        // multi-matching algorithm in allOptionalInstantiations(), but in the
        // degenerate case where it has nothing marked "optional."  We should
        // therefore get the exact same results as in the previous test.
        // See the comment below marked with this symbol: <------- ***

        // Get all multi-matching tests from the database
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
            const G = Matching.allOptionalInstantiations(
                constraints.map( c => c.child( 1 ) ),
                constraints.map( c => c.children().slice( 2 ) ),
                constraints.length, // this says none are optional <------- ***
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

    it( 'Should compute optional solutions for the database', () => {
        // Get all optional multi-matching tests from the database
        const matchingTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'optional multi-matching' )
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
            // Find out which is the first one marked "optional":
            const optionalSymbol = new LurchSymbol( 'optional' )
            const firstOptional = constraints.findIndex( constraint =>
                constraint.child( 2 ).equals( optionalSymbol ) )
            if ( firstOptional > -1 )
                constraints[firstOptional].child( 2 ).remove()
            // constraints.forEach( ( c, i ) =>
            //     console.log( `Constraint ${i}: ${c.toPutdown()}` ) )
            // expectedSols.forEach( ( es, i ) =>
            //     console.log( `Expected solution ${i}: ${expSolStr(es)}` ) )
            // console.log( 'First optional constraint:', firstOptional )

            // Finally, make the function call that creates a generator that
            // will actually solve the problem
            const debug = false
            const G = Matching.allOptionalInstantiations(
                constraints.map( c => c.child( 1 ) ),
                constraints.map( c => c.children().slice( 2 ) ),
                firstOptional, null, debug )
            // Now actually run the matching algorithm
            let debugText = debugHeader( constraints, expectedSols )
            let computedSols
            expect( () => computedSols = Array.from( G ),
                `Error when running allOptionalInstantiations on ${key}:\n${debugText}`
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

    // Utility function used in the test below
    const getPSIComponents = ( key, LCs ) => {
        // number of entries
        expect( LCs, `Malformed test: ${key} has wrong # entries` )
            .to.have.length( 5 )
        // metavariables entry
        expect( LCs[0].child( 0 ).equals( new LurchSymbol( 'metavariables' ) ),
            `Malformed test: ${key} first entry is not "metavariables"` )
            .to.equal( true )
        const metavariables = LCs[0].allButFirstChild()
        // formula entry
        expect( LCs[1] instanceof Environment,
            `Malformed test: ${key} has non-environment as child #2` )
            .to.equal( true )
        const formula = LCs[1]
        metavariables.forEach( mv => {
            formula.descendantsSatisfying( d =>
                d.equals( mv ) || d.equals( mv.asA( 'given' ) )
            ).forEach( d => d.makeIntoA( Matching.metavariable ) )
        } )
        // sequent entry
        expect( LCs[2] instanceof Environment,
            `Malformed test: ${key} has non-environment as child #3` )
            .to.equal( true )
        const sequent = LCs[2]
        // options entry
        expect( LCs[3].child( 0 ).equals( new LurchSymbol( 'options' ) ),
            `Malformed test: ${key} child #4 entry is not "options"` )
            .to.equal( true )
        const options = { }
        LCs[3].allButFirstChild().forEach( option => {
            if ( [ 'direct', 'intuitionistic' ].includes( option.text() ) )
                options[option.text()] = true
        } )
        // solutions entry
        expect( LCs[4].child( 0 ).equals( new LurchSymbol( 'solutions' ) ),
            `Malformed test: ${key} child #5 entry is not "solutions"` )
            .to.equal( true )
        // LCs[4] is of the form
        //     (solutions (indices...) (mv1 exp1 mv2 exp2...) ...)
        // and thus even-index things in each solution are metavariables
        metavariables.forEach( mv => {
            LCs[4].descendantsSatisfying( d =>
                d.equals( mv )
             && d.address( LCs[4] ).length == 2
             && d.address( LCs[4] )[0] > 1
             && d.address( LCs[4] )[0] % 2 == 0
             && d.address( LCs[4] )[1] % 2 == 0
            ).forEach( d => d.makeIntoA( Matching.metavariable ) )
        } )
        let solutions = [ ]
        for ( let i = 1 ; i < LCs[4].numChildren() ; i += 2 )
            solutions.push( pairToSolution(
                key, LCs[4].child( i ), LCs[4].child( i + 1 ) ) )
        return { formula, sequent, options, solutions }
    }

    const debugHeader2 = ( formula, sequent, options, expectedSols ) => {
        let debugText = 'Formula = ' + formula.toPutdown() + '\n'
                      + 'Sequent = ' + sequent.toPutdown() + '\n'
                      + 'Options = ' + JSON.stringify( options ) + '\n'
        debugText += `Expected solutions:\n`
        for ( let i = 0 ; i < expectedSols.length ; i++ )
            debugText += `\t#${i+1}.\n${expSolStr( expectedSols[i] )}\n`
        return debugText
    }

    it( 'Should compute possible sufficient instantiations for the database', () => {
        // Get all possible sufficient instantiations tests from the database
        const matchingTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'possible sufficient instantiations' )
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
            const {
                formula, sequent, options, solutions
            } = getPSIComponents( key, LCs )
            let debugText = `In ${key}:\n`
              + debugHeader2( formula, sequent, options, solutions )
            const expectedSols = solutions

            // Finally, make the function call that creates a generator that
            // will actually solve the problem
            // options.debug = key.endsWith( '13.putdown' )
            const G = Formula.possibleSufficientInstantiations(
                sequent, formula, options )
            // Now actually run the matching algorithm
            let computedSols
            expect( () => computedSols = Array.from( G ),
                `Error when running possibleSufficientInstantiations on ${key}:\n${debugText}`
            ).not.to.throw()
            debugText += debugFooter( computedSols )
            // And check to see if it gave the expected answer
            expect( computedSols.length ).to.equal( expectedSols.length,
                `Length of result doesn't match length of expectation:\n${debugText}` )
            const missing = expectedSols.find( sol1 =>
                !computedSols.some( sol2 => hackyEquals( sol1, sol2 ) ) )
            if ( missing ) console.log( expSolStr(missing) + '\n' + debugText )
            expect( missing,
                `Missing this expected solution:\n${expSolStr(missing)}\n`
              + `in this problem:\n${debugText}`
            ).to.be.undefined
        } )
    } )

} )
