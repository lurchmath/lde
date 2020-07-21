
import { Environment } from '../../src/environment.js'

suite( 'Environment', () => {

    test( 'Ensure all expected global identifiers are declared', () => {
        expect( Environment ).to.be.ok()
    } )

} )
