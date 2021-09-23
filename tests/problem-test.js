
import M from '../src/matching.js'

describe( 'Problem', () => {

    it( 'Should declare the correct global identifiers', () => {
        expect( M.Problem ).to.be.ok
    } )

    xit( 'Should let us construct empty problems and query them', () => {
        // to do
    } )

    xit( 'Should let us add constraints in a wide variety of ways', () => {
        // to do
        // don't forget to test that already present constraints aren't added 2x
        // also test empty and length in each case here
    } )

    xit( 'Should let us add constraints at construction time', () => {
        // to do
        // also test empty and length in each case here
    } )

    xit( 'Should let us add constraints while copying, with plus()', () => {
        // to do
        // also test empty and length in each case here
    } )

    xit( 'Should preserve increasing complexity ordering of constraints', () => {
        // to do
    } )

    xit( 'Should remove constraints correctly, even using without()', () => {
        // to do
        // also test empty and length in each case here
    } )

    xit( 'Should compare problems for equality correctly', () => {
        // to do
    } )

    xit( 'Should make shallow copies correctly', () => {
        // to do
    } )

} )
