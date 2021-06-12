
import Database from '../src/database.js'

describe( 'Database', () => {

    it( 'Should export several querying functions', () => {
        expect( Database.keys ).to.be.ok
        expect( Database.keysStartingWith ).to.be.ok
        expect( Database.keysPaths ).to.be.ok
        expect( Database.filterByMetadata ).to.be.ok
        expect( Database.getMetadata ).to.be.ok
        expect( Database.getPutdown ).to.be.ok
        expect( Database.getPutdownWithoutIncludes ).to.be.ok
        expect( Database.getLogicConcepts ).to.be.ok
        expect( Database.getLogicConcept ).to.be.ok
    } )

    it( 'Should know that the database contains several entries', () => {
        // The database was created with 14 entries, so there should always be
        // more than 10, going forward
        expect( Database.keys() ).to.have.lengthOf.above( 10 )
        // There is a subfolder entitled "parsing tests"
        expect( Database.keysStartingWith( '/parsing tests/' ) )
            .to.have.lengthOf.above( 0 )
        // There is a subfolder entitled "propositional logic"
        expect( Database.keysStartingWith( '/propositional logic/' ) )
            .to.have.lengthOf.above( 0 )
    } )

    it( 'Should verify that entries with valid syntax can be parsed', () => {
        // The database contains at least one entry marked as "valid syntax"
        const validSyntax = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.syntax &&
            metadata.testing.syntax == 'valid' )
        expect( validSyntax ).to.have.lengthOf.above( 0 )
        // For every such entry, asking for its LogicConcepts does not throw
        // an error, and in fact yields the number of LogicConcepts that the
        // database entry claims it should (if indeed the entry contains such
        // a claim).
        validSyntax.forEach( key => {
            let parsed
            expect( () => { parsed = Database.getLogicConcepts( key ) },
                `Parsing ${key}` ).not.to.throw()
            const metadata = Database.getMetadata( key )
            if ( metadata.testing
              && metadata.testing.hasOwnProperty( 'length' ) )
                expect( parsed, `Testing # of LogicConcepts in ${key}` )
                    .to.have.lengthOf( metadata.testing.length )
        } )
    } )

    it( 'Should verify that entries with invalid syntax do not parse', () => {
        // The database contains at least one entry marked as "invalid syntax"
        const invalidSyntax = Database.filterByMetadata( metadata =>
            metadata.testing && metadata.testing.syntax &&
            metadata.testing.syntax == 'invalid' )
        expect( invalidSyntax ).to.have.lengthOf.above( 0 )
        // For every such entry, asking for its LogicConcepts throws an error.
        invalidSyntax.forEach( key => {
            expect( () => Database.getLogicConcepts( key ),
                `Parsing ${key}` ).to.throw()
        } )
    } )

    it( 'Should verify that all prop logic rules parse successfully', () => {
        // The database contains at least 10 entries in the prop logic folder
        const propLogic = Database.keysPaths( '/propositional logic/' )
        expect( propLogic ).to.have.lengthOf.above( 9 )
        // For every such entry, asking for its LogicConcepts does not throw
        // an error.
        propLogic.forEach( key => {
            expect( () => Database.getLogicConcepts( key ),
                `Parsing ${key}` ).not.to.throw()
        } )
    } )

    it( 'Should have getLogicConcept/s correspond correctly', () => {
        // See comments below "Test 1," "Test 2," and "Test 3" for details of
        // what this test does.
        Database.keys().forEach( key => {
            // Run getLogicConcepts() and see what happens.
            let parsed
            try {
                parsed = Database.getLogicConcepts( key )
            } catch ( e ) {
                parsed = e
            }
            // Depending on the result, we test getLogicConcept()...
            if ( parsed instanceof Array && parsed.length == 1 ) {
                // Test 1: Every time getLogicConcepts() yields a list of
                // length 1, getLogicConcept() will yield that 1 thing.
                let one
                expect( () => one = Database.getLogicConcept( key ) )
                    .not.to.throw()
                expect( one ).to.equal( parsed[0] )
            } else {
                // Test 2: Whenever getLogicConcepts() yields 0 or 2+ things,
                // getLogicConcept() throws an error.
                // Test 3: Whenever getLogicConcepts() throws an error, then
                // also getLogicConcept() throws an error.
                expect( () => Database.getLogicConcept( key ) ).to.throw()
            }
        } )
    } )

    it( 'Should process "include" metadata correctly', () => {
        // Ensure that the putdown file that includes all the rules of
        // propositional logic parses to include at least 10 expressions.
        const allPropKey = '/propositional logic/all rules.putdown'
        let allPropRules
        expect( () => allPropRules = Database.getLogicConcepts( allPropKey ) )
            .not.to.throw()
        expect( allPropRules ).to.have.lengthOf.above( 9 )
        // Ensure that you can ask for its putdown source code, and it's
        // very long (over 100 characters) because it contains all 10 rules.
        const fullPutdown = Database.getPutdown( allPropKey )
        expect( fullPutdown ).to.have.lengthOf.above( 100 )
        // Ensure that you can ask for its putdown source code without
        // includes, and it's very short, and all whitespace.
        const origPutdown = Database.getPutdownWithoutIncludes( allPropKey )
        expect( origPutdown ).to.have.lengthOf.not.above( 10 )
        expect( origPutdown ).to.match( /^\s*$/ )
    } )

} )
