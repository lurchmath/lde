
import * as Matching from '../src/matching.js'

describe( 'Matching', () => {

    it( 'Should declare the expected tools', () => {
        expect( Matching.makeExpressionFunction ).to.be.ok
        expect( Matching.makeExpressionFunctionApplication ).to.be.ok
        expect( Matching.MatchingChallenge ).to.be.ok
    } )

} )
