
// We import this because it's the subject of this test suite.
import { LogicConcept } from '../src/logic-concept.js'

// Test suites begin here.

describe( 'LogicConcept module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( LogicConcept ).to.be.ok
    } )

} )
