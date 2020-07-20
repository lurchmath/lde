
import expect from 'expect.js'
import { Declaration } from '../../src/declaration.js'

suite( 'Declaration', () => {

    test( 'Ensure all expected global identifiers are declared', () => {
        expect( Declaration ).to.be.ok()
    } )

} )
