
// Import what we're testing
import Validation from '../src/validation.js'
import { } from '../src/validation/float-arithmetic.js'

// Import other classes we need to do the testing
import { LogicConcept } from '../src/logic-concept.js'
import { Environment } from '../src/environment.js'
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
        // some tool is the default and it's on the list
        expect( Validation.options ).to.be.ok
        expect( test ).to.include( Validation.options().tool )
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
            () => Validation.installTool( 'dummy', dummyTool )
        ).not.to.throw()
        expect( Validation.installedToolNames() ).to.include( 'dummy' )
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
        expect( () => Validation.setOptions( 'tool', 'dummy' ) ).not.to.throw()
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
        Validation.setOptions( 'tool', 'dummy' )
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
        Validation.setOptions( 'tool', 'floating point arithmetic' )
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

    it( 'Should do simple propositional validation', () => {
        Validation.setOptions( 'tool', 'classical propositional logic' )
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
        Validation.setOptions( 'tool', 'intuitionistic propositional logic' )
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
        Validation.setOptions( 'tool', 'classical propositional logic' )
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

} )
