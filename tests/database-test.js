
import Database from '../src/database.js'

describe( 'Database', () => {

    it( 'Should export several querying functions', () => {
        expect( Database.keys ).to.be.ok
        expect( Database.keysStartingWith ).to.be.ok
        expect( Database.keysPaths ).to.be.ok
        expect( Database.getMetadata ).to.be.ok
        expect( Database.getPutdown ).to.be.ok
        expect( Database.getPutdownWithoutIncludes ).to.be.ok
        expect( Database.getLogicConcepts ).to.be.ok
        expect( Database.getLogicConcept ).to.be.ok
    } )

} )
