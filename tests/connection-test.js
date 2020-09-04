
// We import this because it's the subject of this test suite.
import { Connection } from '../src/connection.js'

// Test suites begin here.

describe( 'Connection module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( Connection ).to.be.ok
    } )

} )
