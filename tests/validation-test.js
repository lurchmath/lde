
// Import what we're testing
import Validation from '../src/validation.js'
import { } from '../src/validation/float-arithmetic.js'

// Import other classes we need to do the testing
import { MathConcept } from '../src/math-concept.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Environment } from '../src/environment.js'
import { BindingEnvironment } from '../src/binding-environment.js'
import { Application } from '../src/application.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'
import Formula from '../src/formula.js'
import Scoping from '../src/scoping.js'
import Database from '../src/database.js'

// Import the spy function tool for testing callbacks/handlers
import { makeSpy } from './test-utils.js'

// Test suite begins here.

describe( 'Validation', () => {

    it( 'Module should import successfully', () => {
        expect( Validation ).to.be.ok
    } )

    it( 'Should report presence of built-in tools', () => {
        // installedToolNames is a function
        expect( Validation.installedToolNames ).to.be.ok
        // it returns a non-empty array
        let test = Validation.installedToolNames()
        expect( test ).to.be.instanceof( Array )
        expect( test ).to.have.lengthOf.above( 0 )
        // it includes at least the following default validation tools
        expect( test ).to.include( 'floating point arithmetic' )
        expect( test ).to.include( 'classical propositional logic' )
        expect( test ).to.include( 'intuitionistic propositional logic' )
        expect( test ).to.include( 'CAS' )
        // some tool is the default and it's on the list
        expect( Validation.getOptions ).to.be.ok
        expect( test ).to.include( Validation.getOptions().tool )
    } )

    const dummySpy = makeSpy()
    const dummyResult = {
        result : 'indeterminate',
        reason : 'Just a dummy tool'
    }
    const dummyTool = ( ...args ) => {
        dummySpy( ...args )
        return dummyResult
    }

    it( 'Should let us install new tools', () => {
        expect( Validation.installedToolNames() ).to.not.include( 'dummy' )
        expect( Validation.installTool ).to.be.ok
        expect(
            () => Validation.installTool( 'dummy',
                Validation.functionToTool( dummyTool ) )
        ).not.to.throw()
        expect( Validation.installedToolNames() ).to.include( 'dummy' )
        expect(
            () => Validation.installConclusionsVersion( 'dummy' )
        ).not.to.throw()
        expect( Validation.installedToolNames() ).to.include(
            'dummy on conclusions' )
    } )

    it( 'Should call validation tools on all conclusions', () => {
        // Create an LC with several conclusions and several non-conclusions
        let test = LogicConcept.fromPutdown( `
        {
            {
                concl1
                :given1
                {
                    (this is concl2)
                }
            }
            :{ none of these are conclusions }
            concl3
        }
        ` )[0]
        // Set the dummy validation tool as the default
        expect(
            () => Validation.setOptions( 'tool', 'dummy on conclusions' )
        ).not.to.throw()
        // Clear the dummy tool's call record,
        // then run validation on the above LC
        dummySpy.callRecord = [ ]
        expect( () => Validation.validate( test ) ).not.to.throw()
        // Ensure that all the conclusions got validated
        expect( dummySpy.callRecord ).to.have.lengthOf( 3 )
        expect( dummySpy.callRecord[0] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[0][0] ).to.equal( test.child( 0, 0 ) )
        expect( dummySpy.callRecord[0][1] ).to.eql( { 'tool' : 'dummy' } )
        expect( dummySpy.callRecord[1] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[1][0] ).to.equal( test.child( 0, 2, 0 ) )
        expect( dummySpy.callRecord[1][1] ).to.eql( { 'tool' : 'dummy' } )
        expect( dummySpy.callRecord[2] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[2][0] ).to.equal( test.child( 2 ) )
        expect( dummySpy.callRecord[2][1] ).to.eql( { 'tool' : 'dummy' } )
        // Ensure that all the relevant data was stored in those conclusions
        expect( Validation.result( test.child( 0, 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 0, 2, 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 2 ) ) )
            .to.eql( dummyResult )
        // Ensure that no other descendants of the document had validation
        // results stored into them
        expect( Validation.result( test.child( 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 0 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 1 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 2 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 3 ) ) )
            .to.be.undefined
        expect( Validation.result( test.child( 1, 4 ) ) )
            .to.be.undefined
    } )

    it( 'Should let us clear validation results out of conclusions', () => {
        // Re-run same test as in previous function
        let test = LogicConcept.fromPutdown( `
        {
            {
                concl1
                :given1
                {
                    (this is concl2)
                }
            }
            :{ none of these are conclusions }
            concl3
        }
        ` )[0]
        Validation.setOptions( 'tool', 'dummy on conclusions' )
        Validation.validate( test )
        // Ensure that all the relevant data was stored in those conclusions
        expect( Validation.result( test.child( 0, 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 0, 2, 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 2 ) ) )
            .to.eql( dummyResult )
        // Now erase it
        expect( () => {
            Validation.clearResult( test.child( 0, 0 ) )
            Validation.clearResult( test.child( 0, 2, 0 ) )
            Validation.clearResult( test.child( 2 ) )
        } ).not.to.throw()
        // And verify that it is gone
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 2, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
    } )

    it( 'Should do simple arithmetic validation', () => {
        Validation.setOptions( 'tool',
            'floating point arithmetic on conclusions' )
        // Yes, 2+5=10-3
        let test = LogicConcept.fromPutdown( `
        {
            (= (+ 2 5) (- 10 3))
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'valid',
            reason : 'JavaScript floating point check'
        } )
        // No, 5/2 is not the same as 2/5
        test = LogicConcept.fromPutdown( `
        {
            (= (/ 5 2) (/ 2 5))
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'JavaScript floating point check'
        } )
        // Invalid structures cause errors
        test = LogicConcept.fromPutdown( `
        {
            (= (/ 1 2 3) 6)
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        let result = Validation.result( test.child( 0 ) )
        expect( result ).to.be.instanceof( Object )
        expect( result.result ).to.equal( 'invalid' )
        expect( result.reason ).to.equal( 'Invalid expression structure' )
        expect( result.message ).to.match( /Wrong number of arguments/ )
        expect( result.stack ).not.to.be.undefined
    } )

    it( 'Should do simple CAS validation', () => {
        Validation.setOptions( 'tool', 'CAS on conclusions' )
        // Yes, 2x+5x=10x-3x
        let test = LogicConcept.fromPutdown( `
        {
            (= (+ (* 2 x) (* 5 x)) (- (* 10 x) (* 3 x)) )
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        Validation.validate( test.child( 0 ) )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'valid',
            reason : 'CAS',
            value : '1'
        } )
        // No, 5/(2+x) is not the same as (2+x)/5 (except for x=3 and x=-7 :))
        test = LogicConcept.fromPutdown( `
        {
            (= (/ 5 (+ 2 x)) (/ (+ 2 x) 5))
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child(0) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'CAS',
            value : 'check(5/(x+2)=(x+2)*1/5)'
        } )
        // Invalid structures are also invalid
        test = LogicConcept.fromPutdown( `
        {
            (= (/ 1 2 x) 6)
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child(0) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'CAS',
            value : '0'
        } )
    } )

    it( 'Should give options the correct priorities', () => {
        // Set a module-level option
        Validation.setOptions( 'tool',
            'floating point arithmetic on conclusions' )
        // Create a test that has one conclusion-level option
        let test = LogicConcept.fromPutdown( `
        {
            (= (+ 9 2) (- 13 2))
            (= (+ (* 2 x) (* 5 x)) (- (* 10 x) (* 3 x)) )
                +{"validation options":{"tool":"CAS"}}
        }
        ` )[0]
        // Validate all and ensure the latter overrode the former in one case:
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test.child( 0 ) ) ).to.eql( {
            result : 'valid',
            reason : 'JavaScript floating point check'
        } )
        expect( Validation.result( test.child( 1 ) ) ).to.eql( {
            result : 'valid',
            reason : 'CAS',
            value : '1'
        } )
        // Now re-validate but pass the dummy tool as the one that should be
        // used, and it should apply it to each conclusion in the document that
        // did not already have a validation function specified:
        dummySpy.callRecord = [ ]
        Validation.validate( test, { tool : 'dummy on conclusions' } )
        expect( dummySpy.callRecord ).to.have.length( 1 )
        expect( dummySpy.callRecord[0] ).to.have.lengthOf( 2 )
        expect( dummySpy.callRecord[0][0] ).to.equal( test.child( 0 ) )
        expect( dummySpy.callRecord[0][1] ).to.eql( { 'tool' : 'dummy' } )
        expect( Validation.result( test.child( 0 ) ) )
            .to.eql( dummyResult )
        expect( Validation.result( test.child( 1 ) ) ).to.eql( {
            result : 'valid',
            reason : 'CAS',
            value : '1'
        } )
    } )

    it( 'Should do simple propositional validation', () => {
        Validation.setOptions( 'tool',
            'classical propositional logic on conclusions' )
        // Yes, things follow from given copies of the exact same thing
        let test = LogicConcept.fromPutdown( `
        {
            :A :B A B
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 3 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        expect( Validation.result( test.child( 3 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        // Yes, modus ponens works, even on compound expressions, but the
        // unjustified conclusion does not validate.
        test = LogicConcept.fromPutdown( `
        {
            :{ :(= a b) (> 3 -1) } (= a b) (> 3 -1)
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'Classical Propositional Logic'
        } )
        expect( Validation.result( test.child( 2 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Classical Propositional Logic'
        } )
        // Repeat the same two tests again, this time using intuitionistic
        // propositional logic instead of classical.
        Validation.setOptions( 'tool',
            'intuitionistic propositional logic on conclusions' )
        // Repeating Test 1...
        test = LogicConcept.fromPutdown( `
        {
            :A :B A B
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 3 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Intuitionistic Propositional Logic'
        } )
        expect( Validation.result( test.child( 3 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Intuitionistic Propositional Logic'
        } )
        // Repeating Test 2...
        test = LogicConcept.fromPutdown( `
        {
            :{ :(= a b) (> 3 -1) } (= a b) (> 3 -1)
        }
        ` )[0]
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 2 ) ) ).to.be.undefined
        Validation.validate( test )
        expect( Validation.result( test ) ).to.be.undefined
        expect( Validation.result( test.child( 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 0 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 0, 1 ) ) ).to.be.undefined
        expect( Validation.result( test.child( 1 ) ) ).to.eql( {
            result : 'invalid',
            reason : 'Intuitionistic Propositional Logic'
        } )
        expect( Validation.result( test.child( 2 ) ) ).to.eql( {
            result : 'valid',
            reason : 'Intuitionistic Propositional Logic'
        } )
    } )

    it( 'should correctly validate propositional database entries', () => {
        // Get all propositional validation tests from the database
        const propositionalTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'validation' &&
            metadata.testing.subtype &&
            metadata.testing.subtype == 'propositional' )
        // they are all entitled "/path/filename N.putdown" for some N,
        // so sort them by that value of N in increasing order.
        const getNum = key => {
            const parts = key.split( ' ' )
            return parseInt( parts.last().split( '.' )[0] )
        }
        propositionalTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )
        
        // Now run each test as follows...
        Validation.setOptions( 'tool',
            'classical propositional logic on conclusions' )
        propositionalTests.forEach( key => {
            // Look up the test with the given key and ensure it contains
            // exactly one LogicConcept
            const LCs = Database.getObjects( key )
            expect( LCs.length ).equals( 1,
                `Malformed test: ${key} had ${LCs.length} LCs instead of 1` )
            const test = LCs[0]
            // Compute the set of conclusions in the LC to be validated and
            // ensure that none of them have been validated yet.
            const conclusions = test instanceof Environment ?
                test.conclusions() : [ test ]
            expect( conclusions.every( C => !Validation.result( C ) ) )
                .equals( true,
                    `Malformed test: ${key} has at least 1 validation result` )
            // Validate the entire LC we loaded.
            Validation.validate( test )
            test.descendantsSatisfying( d => true ).forEach( d => {
                const result = Validation.result( d )
                const expected = d.getAttribute( 'expected validation result' )
                if ( typeof expected == 'undefined' )
                    expect( result, `${key}@${d.address( test )}` )
                        .to.be.undefined
                else
                    expect( result.result, `${key}@${d.address( test )}` )
                        .equals( expected )
            } )
        } )
    } )

    // Utility function to find any command of the form \[in]valid[{...}] and
    // turn it into an attribute on its previous sibling, marking it as
    // expecting it to be valid/invalid for this test.
    // Used in tests below.
    const processValidityCommands = LC => {
        LC.descendantsSatisfying( d => {
            const interpAs = d.getAttribute( "Interpret as" )
            return ( interpAs instanceof Array )
                && interpAs[0] == 'command'
                && ( interpAs[1] == 'valid' || interpAs[1] == 'invalid' )
        } ).map( validityMarker => {
            const interpAs = validityMarker.getAttribute( "Interpret as" )
            const target = validityMarker.previousSibling()
            if ( !target ) throw new Error(
                `${validityMarker.toSmackdown()} with no previous sibling` )
            const expected = { result : interpAs[1] }
            const message = interpAs.slice( 2 ).join( ' ' )
            if ( message ) expected.message = message
            target.setAttribute( 'expected validation result', expected )
            validityMarker.remove()
        } )
    }

    // Utility function to find any LC of the form
    // (instantiation
    //   (formula "formula name")
    //   (pairs...) // e.g. ((P a) (Q b))
    //   (result [in]valid)
    //   (reason "some text") // this line optional
    // )
    // and parse it into a corresponding JSON structure.
    const parseInstantiation = LC => {
        // Verify overall form
        if ( !( LC instanceof Application ) )
            throw new Error( 'Instantiation must be an Application LC' )
        if ( LC.numChildren() != 4 && LC.numChildren() != 5 )
            throw new Error( 'Wrong number of children in instantiation LC' )
        if ( !LC.allButFirstChild().every(
                child => child instanceof Application ) )
            throw new Error(
                'Every child of an instantiation must be an Application' )
        // Verify formula block (child at index 1)
        if ( !LC.child( 1, 0 ).equals( new LurchSymbol( 'formula' ) )
          || !( LC.child( 1, 1 ) instanceof LurchSymbol )
          || LC.child( 1 ).numChildren() != 2 )
            throw new Error( 'Incorrect formula block in instantiation' )
        const formula = LC.child( 1, 1 ).text()
        // Verify pairs block (child at index 2)
        if ( !LC.child( 2 ).children().every(
                child => child instanceof Application )
          || !LC.child( 2 ).children().every(
                child => child.numChildren() == 2 )
          || !LC.child( 2 ).children().every(
                child => child.child( 0 ) instanceof LurchSymbol ) )
            throw new Error( 'Incorrect pairs list in instantiation' )
        const pairs = { }
        LC.child( 2 ).children().forEach( pair =>
            pairs[pair.child( 0 ).text()] = pair.child( 1 ) )
        // Verify result block (child at index 3)
        if ( !LC.child( 3, 0 ).equals( new LurchSymbol( 'result' ) )
          || !( LC.child( 3, 1 ) instanceof LurchSymbol )
          || LC.child( 3 ).numChildren() != 2 )
            throw new Error( 'Incorrect result block in instantiation' )
        const result = LC.child( 3, 1 ).text()
        // Construct final result now, although we may edit it below
        const parsed = {
            formula : formula,
            instantiation : pairs,
            result : result,
            original : LC
        }
        // Verify reason block (child at index 4, if any)
        if ( LC.numChildren() == 5 ) {
            if ( !LC.child( 4, 0 ).equals( new LurchSymbol( 'reason' ) )
              || !( LC.child( 4, 1 ) instanceof LurchSymbol )
              || LC.child( 4 ).numChildren() != 2 )
                throw new Error( 'Incorrect reason block in instantiation' )
            const reason = LC.child( 4, 1 ).text()
            parsed.reason = reason
        }
        // Done
        return parsed
    }

    // Utility function used by tests below.  Find the mapping of label texts
    // to labeled LCs.
    const labelMapping = LC => {
        const result = { }
        LC.descendantsSatisfying( d => d.hasAttribute( 'label' ) ).forEach(
            labeled => result[labeled.getAttribute( 'label' )] = labeled )
        return result
    }

    // Utility function used by tests below to build a sequent from a conclusion
    // (Just piles all the accessibles into an environment, except it ensures
    // that all of them are marked givens, and it does not include any symbols
    // bound by a BindingEnvironment, which are technically accessible by the
    // tree definition of accessibility, but not logically usable as premises.)
    const getSequent = concl => {
        const isBoundInAnEnv = x =>
            ( x.parent() instanceof BindingEnvironment )
         && x != x.parent().lastChild()
        const accessibles = concl.accessibles( false, document )
            .filter( a => !isBoundInAnEnv( a ) ).reverse()
        return new Environment(
            ...accessibles.map( a => a.copy().makeIntoA( 'given' ) ),
            concl.copy() )
    }

    it( 'should correctly check formula instantiations', () => {
        // Get all formula instantiation tests from the database
        const formulaTests = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.type &&
            metadata.testing.type == 'validation' &&
            metadata.testing.subtype &&
            metadata.testing.subtype == 'formula' )
        // they are all entitled "/path/filename N.putdown" for some N,
        // so sort them by that value of N in increasing order.
        const getNum = key => {
            const parts = key.split( ' ' )
            return parseInt( parts.last().split( '.' )[0] )
        }
        formulaTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )
        
        // Now run each test as follows...
        Validation.setOptions( 'tool', 'classical propositional logic' )
        formulaTests.forEach( key => {
            // Look up the test with the given key and ensure it contains
            // more than one LogicConcept, the first being the "document" and
            // the rest being the instantiation blocks.
            const LCs = Database.getObjects( key )
            expect( LCs.length ).to.be.above( 1,
                `Malformed test: ${key} had only one LogicConcept in it` )
            let document = LCs[0]
            const instantiations = LCs.slice( 1 )
            // Process \[in]valid[{...}] commands
            expect(
                () => processValidityCommands( document ),
                `Processing \\[in]valid[{...}] commands in ${key}`
            ).not.to.throw()
            // Now we should be able to convert the document to an LC
            document = document.interpret()
            // Ensure the document passes a scoping check
            Scoping.validate( document, Scoping.declareInAncestor )
            expect(
                document.hasDescendantSatisfying(
                    d => !!Scoping.scopeErrors( d ) ),
                `Ensuring no scoping errors in document for ${key}`
            ).to.equal( false )
            // Process instantiation test blocks
            let instantiationTests = [ ]
            instantiations.forEach( ( MC, index ) => {
                expect(
                    () => instantiationTests.push(
                        parseInstantiation( MC.interpret() ) ),
                    `parsing instantiation #${index+1} in ${key}`
                ).not.to.throw()
            } )
            // Get mapping from labels to LCs
            const labelLookup = labelMapping( document )

            // Now run the instantiation tests in that test file
            instantiationTests.forEach( test => {
                // Ensure cited formula exists
                if ( !labelLookup.hasOwnProperty( test.formula ) ) {
                    expect(
                        test.result,
                        `Should fail to find ${test.formula} in ${key}`
                    ).to.equal( 'invalid' )
                    expect(
                        !test.hasOwnProperty( 'reason' )
                     || test.reason == 'no such formula',
                        `Should know there's no ${test.formula} in ${key}`
                    ).to.equal( true )
                    return
                }
                const original = labelLookup[test.formula]
                const formula = Formula.from( original )
                formula.clearAttributes()
                formula.makeIntoA( 'given' )
                // Ensure the correct set of metavariables was used
                const testDomain = new Set()
                Object.keys( test.instantiation ).forEach( key => {
                    if ( test.instantiation.hasOwnProperty( key ) )
                        testDomain.add( key )
                } )
                const formulaDomain = Formula.domain( formula )
                // Could be the instantiation contains some non-metavars:
                const badNonMetaVars = testDomain.difference( formulaDomain )
                if ( badNonMetaVars.size > 0 ) {
                    const reason = 'not a metavariable: '
                                 + Array.from( badNonMetaVars ).join( ',' )
                    expect(
                        test.result,
                        `There were non-metavars ${test.formula} in ${key}`
                    ).to.equal( 'invalid' )
                    expect(
                        !test.hasOwnProperty( 'reason' )
                     || test.reason == reason,
                        `Should know non-metavars ${test.formula} in ${key}`
                    ).to.equal( true )
                    return
                }
                // Could be the instantiation doesn't hit all the metavars:
                const missingMetaVars = formulaDomain.difference( testDomain )
                if ( missingMetaVars.size > 0 ) {
                    const reason = 'uninstantiated metavariable: '
                                 + Array.from( missingMetaVars ).join( ',' )
                    expect(
                        test.result,
                        `There were missing metavars ${test.formula} in ${key}`
                    ).to.equal( 'invalid' )
                    expect(
                        !test.hasOwnProperty( 'reason' )
                     || test.reason == reason,
                        `Should know missing metavars ${test.formula} in ${key}`
                    ).to.equal( true )
                    return
                }
                // Could be the instantiation causes variable capture:
                const variableCapture = Array.from( testDomain ).some( mv =>
                    formula.descendantsSatisfying(
                        d => ( d instanceof LurchSymbol ) && d.text() == mv
                    ).some(
                        d => !test.instantiation[mv].isFreeToReplace( d, formula )
                    ) )
                if ( variableCapture ) {
                    expect(
                        test.result,
                        `Variable capture ${test.formula} in ${key}`
                    ).to.equal( 'invalid' )
                    expect(
                        !test.hasOwnProperty( 'reason' )
                     || test.reason == 'variable capture',
                        `Should know about capture ${test.formula} in ${key}`
                    ).to.equal( true )
                    return
                }
                // All errors have been checked; this should succeed:
                let result
                expect(
                    () => {
                        result = Formula.instantiate(
                            formula, test.instantiation,
                            [ MathConcept.typeAttributeKey( 'given' ) ] )
                        Scoping.clearImplicitDeclarations( result )
                        Scoping.clearScopeErrors( result )
                    },
                    `Doing the instantiation of ${test.formula} in ${key}`
                ).not.to.throw()
                // And the test should have expected that:
                expect( test.result ).to.equal( 'valid' )
                // Insert the instantiated version after the formula
                original.parent().insertChild(
                    result, original.indexInParent() + 1 )
            } )

            // Now run the validation tests in that file
            // What was marked valid/invalid, and thus needs validating?
            document.descendantsSatisfying(
                d => d.hasAttribute( 'expected validation result' )
            ).forEach( toValidate => {
                const location = `${key}@${toValidate.address()}`
                // ensure it's a conclusion
                expect(
                    toValidate.isAConclusionIn( document ),
                    `${location} has non-conclusion marked valid`
                ).to.equal( true )
                // validate it
                const sequent = getSequent( toValidate )
                Validation.validate( sequent )
                // check to see if we got the right result
                const expected = toValidate.getAttribute(
                    'expected validation result' )
                const actual = Validation.result( sequent.lastChild() )

                if ( actual.result != expected.result )
                    console.log( sequent.toPutdown() )

                expect( actual.result ).to.equal( expected.result,
                    `${location} has wrong validation result` )
                if ( expected.hasOwnProperty( 'message' ) )
                    expect( actual.message ).to.equal( expected.message,
                        `${location} has wrong validation message` )
            } )
        } )
    } )

} )
