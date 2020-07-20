
import expect from 'expect.js'
import { Structure } from '../../src/structure.js'

suite( 'Structure module', () => {

    test( 'Ensure all expected global identifiers are declared', () => {
        expect( Structure ).to.be.ok()
    } )

} )

suite( 'Structure trees', () => {

    test( 'Structure objects can be built with constructors', () => {
        // Make a small structure and name each node.
        // This alsoo verifies that no error occurs.
        let A, AA, AB, B
        const root = new Structure(
            A = new Structure(
                AA = new Structure,
                AB = new Structure
            ),
            B = new Structure
        )
        // Ensure that all parent pointers were correctly established in the forming of
        // the hierarchy.
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )
        expect( B.parent() ).to.be( root )

        // Ensure that all child arrays are equivalent in structure to what's expected
        // based on the construction code above.
        expect( root.children() ).to.eql( [ A, B ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
    } )

} )
