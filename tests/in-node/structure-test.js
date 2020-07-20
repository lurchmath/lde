
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

        // Ensure that previous and next sibling functions work as expected.
        expect( root.previousSibling() ).to.be( undefined )
        expect( root.nextSibling() ).to.be( undefined )
        expect( A.previousSibling() ).to.be( undefined )
        expect( A.nextSibling() ).to.be( B )
        expect( AA.previousSibling() ).to.be( undefined )
        expect( AA.nextSibling() ).to.be( AB )
        expect( AB.previousSibling() ).to.be( AA )
        expect( AB.nextSibling() ).to.be( undefined )
        expect( B.previousSibling() ).to.be( A )
        expect( B.nextSibling() ).to.be( undefined )
    } )

    test( 'Structure constructor ignores invalid child parameters', () => {
        // Make a similar small structure hierarchy to the one in the previous test,
        // but add a few erroneous items.
        let A, AA, AB, B
        const root = new Structure(
            7,
            A = new Structure(
                AA = new Structure,
                AB = new Structure,
                'This is not a Structure'
            ),
            /regular expression/,
            B = new Structure
        )

        // Ensure that parent pointers and child arrays are exactly as they were in
        // the previous test, because the erroneous new stuff has been ignored.
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )
        expect( B.parent() ).to.be( root )
        expect( root.children() ).to.eql( [ A, B ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
    } )

    test( 'Structure constructor should prevent cyclic hierarchies', () => {
        // Create a single Structure and try to make it a child of itself.  This should
        // fail, leaving the Structure in its original state.
        let C, D
        let A = new Structure
        A.insertChild( A )
        expect( A.parent() ).to.be( null )
        expect( A.children() ).to.eql( [ ] )

        // Create another Structure B and insert it as a child of A.  Then try to insert A
        // as a child of B.  This should succeed, but should have removed B from being
        // a child of A, so that the structure remains acyclic.
        let B = new Structure
        A.insertChild( B )
        expect( A.parent() ).to.be( null )
        expect( A.children() ).to.eql( [ B ] )
        expect( B.parent() ).to.be( A )
        expect( B.children() ).to.eql( [ ] )
        B.insertChild( A )
        expect( A.parent() ).to.be( B )
        expect( A.children() ).to.eql( [ ] )
        expect( B.parent() ).to.be( null )
        expect( B.children() ).to.eql( [ A ] )

        // The same test should succeed if we do it with a structure with several nodes
        // rather than just two.
        A = new Structure(
            B = new Structure,
            C = new Structure(
                D = new Structure
            )
        )
        D.insertChild( A )
        expect( A.parent() ).to.be( D )
        expect( B.parent() ).to.be( A )
        expect( C.parent() ).to.be( A )
        expect( D.parent() ).to.be( null )
        expect( A.children() ).to.eql( [ B, C ] )
        expect( B.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( D.children() ).to.eql( [ A ] )
    } )

    test( 'Correct computation of indices in parent Structure', () => {
        // Make the same small structure hierarchy as in an earlier test.
        let A, AA, AB, B
        const root = new Structure(
            A = new Structure(
                AA = new Structure,
                AB = new Structure
            ),
            B = new Structure
        )

        // Check the index in parent of each node.
        expect( root.indexInParent() ).to.be( undefined )
        expect( A.indexInParent() ).to.be( 0 )
        expect( AA.indexInParent() ).to.be( 0 )
        expect( AB.indexInParent() ).to.be( 1 )
        expect( B.indexInParent() ).to.be( 1 )
    } )

    test( 'Supports removing structures from parents', () => {
        // Make the same small structure hierarchy as in the previous test.
        let A, AA, AB, B
        const root = new Structure(
            A = new Structure(
                AA = new Structure,
                AB = new Structure
            ),
            B = new Structure
        )

        // Remove a child of the root and verify that the structure is as expected.
        B.remove()
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )
        expect( B.parent() ).to.be( null )

        // Remove a grandchild of the root and verify that the structure is as
        // expected.
        AA.remove()
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( null )
        expect( AB.parent() ).to.be( A )
        expect( B.parent() ).to.be( null )

        // Remove something that has already been removed, and verify that nothing
        // changes or causes an error.
        AA.remove()
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( null )
        expect( AB.parent() ).to.be( A )
        expect( B.parent() ).to.be( null )
    } )

    test( 'Supports removing child structures', () => {
        // Make the same small structure hierarchy as in the previous test.
        let A, AA, AB, B
        const root = new Structure(
            A = new Structure(
                AA = new Structure,
                AB = new Structure
            ),
            B = new Structure
        )

        // Remove a child of the root and verify that the structure is as expected.
        root.removeChild( 1 )
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )
        expect( B.parent() ).to.be( null )

        // Remove a grandchild of the root and verify that the structure is as
        // expected.
        A.removeChild( 0 )
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( null )
        expect( AB.parent() ).to.be( A )
        expect( B.parent() ).to.be( null )

        // Remove an invalid index, and verify that nothing changes or causes an error.
        A.removeChild( 1 )
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( null )
        expect( AB.parent() ).to.be( A )
        expect( B.parent() ).to.be( null )
    } )

    test( 'should support inserting structures', () => {
        // Make the same small structure hierarchy as in the previous test.
        let A, AA, AB, B
        const root = new Structure(
            A = new Structure(
                AA = new Structure,
                AB = new Structure
            ),
            B = new Structure
        )
        
        // Add a new child of the root and verify that the structure is as expected.
        const C = new Structure
        expect( C.parent() ).to.be( null )
        expect( C.children() ).to.eql( [ ] )
        root.insertChild( C, 1 )
        expect( root.children() ).to.eql( [ A, C, B ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )
        expect( C.parent() ).to.be( root )
        expect( B.parent() ).to.be( root )
        
        // Append a child to the end of the list of children of a child of the root and
        // verify that the structure is as expected.
        const D = new Structure
        expect( D.parent() ).to.be( null )
        expect( D.children() ).to.eql( [ ] )
        A.insertChild( D, 2 )
        expect( root.children() ).to.eql( [ A, C, B ] )
        expect( A.children() ).to.eql( [ AA, AB, D ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( D.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )
        expect( D.parent() ).to.be( A )
        expect( C.parent() ).to.be( root )
        expect( B.parent() ).to.be( root )
        
        // Insert as the first child of the root a child from elsewhere in the
        // hierarchy, and verify that it is removed from one place and inserted in the
        // other.
        root.insertChild( AA, 0 )
        expect( root.children() ).to.eql( [ AA, A, C, B ] )
        expect( A.children() ).to.eql( [ AB, D ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( D.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( root )
        expect( AB.parent() ).to.be( A )
        expect( D.parent() ).to.be( A )
        expect( C.parent() ).to.be( root )
        expect( B.parent() ).to.be( root )
        
        // Do the same test again, but this time just moving something to be a later
        // sibling within the same parent.
        root.insertChild( A, 2 )
        expect( root.children() ).to.eql( [ AA, C, A, B ] )
        expect( A.children() ).to.eql( [ AB, D ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( D.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( root )
        expect( AB.parent() ).to.be( A )
        expect( D.parent() ).to.be( A )
        expect( C.parent() ).to.be( root )
        expect( B.parent() ).to.be( root )
    } )

} )
