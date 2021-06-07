
import { Formula } from '../src/formula.js'
import { Environment } from '../src/environment.js'

describe( 'Formula', () => {

    it( 'Should declare the expected global identifiers', () => {
        expect( Formula ).to.be.ok
        expect( Formula.__proto__ ).to.equal( Environment )
    } )

} )
