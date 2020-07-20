
import expect from 'expect.js'
import { Structure } from '../../src/structure.js'

suite( 'Structure module', () => {

    test( 'Ensure all expected global identifiers are declared', () => {
        expect( Structure ).to.be.ok()
    } )

} )

suite( 'Structure manipulation', () => {

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

        // Ensure that numChildren() and isAtomic() give the right answer in each case
        expect( root.numChildren() ).to.be( 2 )
        expect( A.numChildren() ).to.be( 2 )
        expect( AA.numChildren() ).to.be( 0 )
        expect( AB.numChildren() ).to.be( 0 )
        expect( B.numChildren() ).to.be( 0 )
        expect( root.isAtomic() ).to.be( false )
        expect( A.isAtomic() ).to.be( false )
        expect( AA.isAtomic() ).to.be( true )
        expect( AB.isAtomic() ).to.be( true )
        expect( B.isAtomic() ).to.be( true )

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

        // Ensure that numChildren() and isAtomic() give the right answer in each case
        expect( root.numChildren() ).to.be( 2 )
        expect( A.numChildren() ).to.be( 2 )
        expect( AA.numChildren() ).to.be( 0 )
        expect( AB.numChildren() ).to.be( 0 )
        expect( B.numChildren() ).to.be( 0 )
        expect( root.isAtomic() ).to.be( false )
        expect( A.isAtomic() ).to.be( false )
        expect( AA.isAtomic() ).to.be( true )
        expect( AB.isAtomic() ).to.be( true )
        expect( B.isAtomic() ).to.be( true )
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

        // Ensure that numChildren() and isAtomic() still give the right answer in each case
        expect( root.numChildren() ).to.be( 1 )
        expect( A.numChildren() ).to.be( 1 )
        expect( AA.numChildren() ).to.be( 0 )
        expect( AB.numChildren() ).to.be( 0 )
        expect( B.numChildren() ).to.be( 0 )
        expect( root.isAtomic() ).to.be( false )
        expect( A.isAtomic() ).to.be( false )
        expect( AA.isAtomic() ).to.be( true )
        expect( AB.isAtomic() ).to.be( true )
        expect( B.isAtomic() ).to.be( true )
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

        // Ensure that numChildren() and isAtomic() still give the right answer in each case
        expect( root.numChildren() ).to.be( 4 )
        expect( A.numChildren() ).to.be( 2 )
        expect( AA.numChildren() ).to.be( 0 )
        expect( AB.numChildren() ).to.be( 0 )
        expect( B.numChildren() ).to.be( 0 )
        expect( root.isAtomic() ).to.be( false )
        expect( A.isAtomic() ).to.be( false )
        expect( AA.isAtomic() ).to.be( true )
        expect( AB.isAtomic() ).to.be( true )
        expect( B.isAtomic() ).to.be( true )
    } )

    test( 'Should support replacing structures', () => {

        // Make the same small structure hierarchy as in the previous test.
        let A, AA, AB, B
        const root = new Structure(
            A = new Structure(
                AA = new Structure,
                AB = new Structure
            ),
            B = new Structure
        )

        // Replace one child of the root with a new structure and verify that all comes
        // out as expected.
        const C = new Structure
        expect( C.parent() ).to.be( null )
        expect( C.children() ).to.eql( [ ] )
        B.replaceWith( C )
        expect( root.children() ).to.eql( [ A, C ] )
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
        expect( B.parent() ).to.be( null )

        // Replace one grandchild of the root with the former child of the root, and
        // verify that all comes out as expected.
        AA.replaceWith( B )
        expect( root.children() ).to.eql( [ A, C ] )
        expect( A.children() ).to.eql( [ B, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( root )
        expect( AA.parent() ).to.be( null )
        expect( AB.parent() ).to.be( A )
        expect( C.parent() ).to.be( root )
        expect( B.parent() ).to.be( A )

        // Replace A with one of its own children, as a corner case test.
        A.replaceWith( AB )
        expect( root.children() ).to.eql( [ AB, C ] )
        expect( A.children() ).to.eql( [ B ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( null )
        expect( AA.parent() ).to.be( null )
        expect( AB.parent() ).to.be( root )
        expect( C.parent() ).to.be( root )
        expect( B.parent() ).to.be( A )
    } )
        
    test( 'Should handle push/pop/shift/unshift of children correctly', () => {
        // Make a set of structures that we will build into a hierarchy.
        const root = new Structure
        const A = new Structure
        const AA = new Structure
        const AB  = new Structure
        const B = new Structure
   
        // Verify that at first no one has any parent/child.
        expect( root.isAtomic() ).to.be( true )
        expect( A.isAtomic() ).to.be( true )
        expect( AA.isAtomic() ).to.be( true )
        expect( AB.isAtomic() ).to.be( true )
        expect( B.isAtomic() ).to.be( true )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( null )
        expect( AA.parent() ).to.be( null )
        expect( AB.parent() ).to.be( null )
        expect( B.parent() ).to.be( null )

        // Push a child of root and verify the results
        root.pushChild( A )
        expect( root.isAtomic() ).to.be( false )
        expect( root.numChildren() ).to.be( 1 )
        expect( root.children() ).to.eql( [ A ] )
        expect( A.parent() ).to.be( root )

        // Push another child of root and verify the results
        root.pushChild( B )
        expect( root.isAtomic() ).to.be( false )
        expect( root.numChildren() ).to.be( 2 )
        expect( root.children() ).to.eql( [ A, B ] )
        expect( A.parent() ).to.be( root )
        expect( B.parent() ).to.be( root )

        // Unshift a child of A and verify the results
        A.unshiftChild( AB )
        expect( A.isAtomic() ).to.be( false )
        expect( A.numChildren() ).to.be( 1 )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AB.parent() ).to.be( A )

        // Unshift another child of A and verify the results
        A.unshiftChild( AA )
        expect( A.isAtomic() ).to.be( false )
        expect( A.numChildren() ).to.be( 2 )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )

        // Pop a child from A and verify the results
        A.popChild()
        expect( A.isAtomic() ).to.be( false )
        expect( A.numChildren() ).to.be( 1 )
        expect( A.children() ).to.eql( [ AA ] )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( null )

        // Shift a child from root and verify the results
        root.shiftChild()
        expect( root.isAtomic() ).to.be( false )
        expect( root.numChildren() ).to.be( 1 )
        expect( root.children() ).to.eql( [ B ] )
        expect( A.parent() ).to.be( null )
        expect( B.parent() ).to.be( root )
    } )
        
    test( 'Should be able to replace all children at once', () => {
        // Make a set of structures that we will build into a hierarchy.
        const root = new Structure
        const A = new Structure
        const AA = new Structure
        const AB  = new Structure
        const B = new Structure
   
        // Verify that at first no one has any parent/child.
        expect( root.isAtomic() ).to.be( true )
        expect( A.isAtomic() ).to.be( true )
        expect( AA.isAtomic() ).to.be( true )
        expect( AB.isAtomic() ).to.be( true )
        expect( B.isAtomic() ).to.be( true )
        expect( root.parent() ).to.be( null )
        expect( A.parent() ).to.be( null )
        expect( AA.parent() ).to.be( null )
        expect( AB.parent() ).to.be( null )
        expect( B.parent() ).to.be( null )

        // put some children into the root
        root.setChildren( [ A, B ] )
        expect( root.isAtomic() ).to.be( false )
        expect( root.numChildren() ).to.be( 2 )
        expect( root.children() ).to.eql( [ A, B ] )
        expect( A.parent() ).to.be( root )
        expect( B.parent() ).to.be( root )

        // put some children into A
        A.setChildren( [ AA, AB ] )
        expect( A.isAtomic() ).to.be( false )
        expect( A.numChildren() ).to.be( 2 )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )

        // reorder the children of the root
        root.setChildren( [ B, A ] )
        expect( root.isAtomic() ).to.be( false )
        expect( root.numChildren() ).to.be( 2 )
        expect( root.children() ).to.eql( [ B, A ] )
        expect( A.parent() ).to.be( root )
        expect( B.parent() ).to.be( root )
        expect( A.isAtomic() ).to.be( false )
        expect( A.numChildren() ).to.be( 2 )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.parent() ).to.be( A )
        expect( AB.parent() ).to.be( A )

        // move A's children into B instead
        B.setChildren( [ AA, AB ] )
        expect( A.isAtomic() ).to.be( true )
        expect( A.numChildren() ).to.be( 0 )
        expect( A.children() ).to.eql( [ ] )
        expect( B.isAtomic() ).to.be( false )
        expect( B.numChildren() ).to.be( 2 )
        expect( B.children() ).to.eql( [ AA, AB ] )
        expect( AA.parent() ).to.be( B )
        expect( AB.parent() ).to.be( B )

        // truly mess with things and make sure it still works
        root.setChildren( [ AA, B, A, AB ] )
        expect( root.isAtomic() ).to.be( false )
        expect( root.numChildren() ).to.be( 4 )
        expect( root.children() ).to.eql( [ AA, B, A, AB ] )
        expect( A.isAtomic() ).to.be( true )
        expect( A.numChildren() ).to.be( 0 )
        expect( A.children() ).to.eql( [ ] )
        expect( AA.isAtomic() ).to.be( true )
        expect( AA.numChildren() ).to.be( 0 )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.isAtomic() ).to.be( true )
        expect( AB.numChildren() ).to.be( 0 )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.isAtomic() ).to.be( true )
        expect( B.numChildren() ).to.be( 0 )
        expect( B.children() ).to.eql( [ ] )
    } )

} )

suite( 'Structure lookup', () => {

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

    test( 'Should correctly compute [all but] first/last child', () => {
        // Make a similar small structure hierarchy as in earlier tests.
        let A, AA, AAA, AB, B
        const root = new Structure(
            A = new Structure(
                AA = new Structure(
                    AAA = new Structure
                ),
                AB = new Structure
            ),
            B = new Structure
        )
        
        // Verify that firstChild(), lastChild(), allButFirstChild(), and
        // allButLastChild() give the correct results for all nodes in the
        // hierarchy
        expect( root.firstChild() ).to.be( A )
        expect( A.firstChild() ).to.be( AA )
        expect( AA.firstChild() ).to.be( AAA )
        expect( AAA.firstChild() ).to.be( undefined )
        expect( AB.firstChild() ).to.be( undefined )
        expect( B.firstChild() ).to.be( undefined )
        expect( root.lastChild() ).to.be( B )
        expect( A.lastChild() ).to.be( AB )
        expect( AA.lastChild() ).to.be( AAA )
        expect( AAA.lastChild() ).to.be( undefined )
        expect( AB.lastChild() ).to.be( undefined )
        expect( B.lastChild() ).to.be( undefined )
        expect( root.allButFirstChild() ).to.eql( [ B ] )
        expect( A.allButFirstChild() ).to.eql( [ AB ] )
        expect( AA.allButFirstChild() ).to.eql( [ ] )
        expect( AAA.allButFirstChild() ).to.eql( [ ] )
        expect( AB.allButFirstChild() ).to.eql( [ ] )
        expect( B.allButFirstChild() ).to.eql( [ ] )
        expect( root.allButLastChild() ).to.eql( [ A ] )
        expect( A.allButLastChild() ).to.eql( [ AA ] )
        expect( AA.allButLastChild() ).to.eql( [ ] )
        expect( AAA.allButLastChild() ).to.eql( [ ] )
        expect( AB.allButLastChild() ).to.eql( [ ] )
        expect( B.allButLastChild() ).to.eql( [ ] )
    } )

    test( 'Should correctly compute addresses and indices', () => {
        // Make a similar small structure hierarchy as in earlier tests.
        let A, AA, AAA, AB, B
        const root = new Structure(
            A = new Structure(
                AA = new Structure(
                    AAA = new Structure
                ),
                AB = new Structure
            ),
            B = new Structure
        )
        
        // Compute many addresses and verify that they're all correct
        expect( root.address( root ) ).to.eql( [ ] )
        expect( root.address() ).to.eql( [ ] )
        expect( root.address( A ) ).to.eql( [ ] )
        expect( A.address( root ) ).to.eql( [ 0 ] )
        expect( A.address() ).to.eql( [ 0 ] )
        expect( A.address( B ) ).to.eql( [ 0 ] )
        expect( A.address( A ) ).to.eql( [ ] )
        expect( AA.address( root ) ).to.eql( [ 0, 0 ] )
        expect( AA.address() ).to.eql( [ 0, 0 ] )
        expect( AA.address( B ) ).to.eql( [ 0, 0 ] )
        expect( AA.address( A ) ).to.eql( [ 0 ] )
        expect( AA.address( AA ) ).to.eql( [ ] )
        expect( AB.address( root ) ).to.eql( [ 0, 1 ] )
        expect( AB.address() ).to.eql( [ 0, 1 ] )
        expect( AB.address( B ) ).to.eql( [ 0, 1 ] )
        expect( AB.address( AA ) ).to.eql( [ 0, 1 ] )
        expect( AB.address( A ) ).to.eql( [ 1 ] )
        expect( AAA.address( root ) ).to.eql( [ 0, 0, 0 ] )
        expect( AAA.address() ).to.eql( [ 0, 0, 0 ] )
        expect( AAA.address( B ) ).to.eql( [ 0, 0, 0 ] )
        expect( AAA.address( A ) ).to.eql( [ 0, 0 ] )
        expect( AAA.address( AA ) ).to.eql( [ 0 ] )
        expect( B.address( root ) ).to.eql( [ 1 ] )
        expect( B.address() ).to.eql( [ 1 ] )
        expect( B.address( A ) ).to.eql( [ 1 ] )
        expect( B.address( B ) ).to.eql( [ ] )

        // Request many possible indices and verify that they're all correct
        expect( root.index( [ ] ) ).to.be( root )
        expect( root.index( [ 0 ] ) ).to.be( A )
        expect( root.index( [ 1 ] ) ).to.be( B )
        expect( root.index( [ 0, 0 ] ) ).to.be( AA )
        expect( root.index( [ 0, 1 ] ) ).to.be( AB )
        expect( root.index( [ 0, 0, 0 ] ) ).to.be( AAA )
        expect( root.index( [ 2 ] ) ).to.be( undefined )
        expect( root.index( [ -1 ] ) ).to.be( undefined )
        expect( root.index( [ 0, 2 ] ) ).to.be( undefined )
        expect( root.index( [ 0, 0, 'hi' ] ) ).to.be( undefined )
        expect( A.index( [ ] ) ).to.be( A )
        expect( A.index( [ 0 ] ) ).to.be( AA )
        expect( A.index( [ 1 ] ) ).to.be( AB )
        expect( A.index( [ 0, 0 ] ) ).to.be( AAA )
        expect( A.index( [ 2 ] ) ).to.be( undefined )
        expect( A.index( [ 0, 1 ] ) ).to.be( undefined )
        expect( A.index( [ 'x', 'y' ] ) ).to.be( undefined )
        expect( AA.index( [ ] ) ).to.be( AA )
        expect( AA.index( [ 0 ] ) ).to.be( AAA )
        expect( AA.index( [ 1 ] ) ).to.be( undefined )
        expect( AA.index( [ 0, 0 ] ) ).to.be( undefined )
        expect( AAA.index( [ ] ) ).to.be( AAA )
        expect( AAA.index( [ 0 ] ) ).to.be( undefined )
        expect( AAA.index( [ 1 ] ) ).to.be( undefined )
        expect( AAA.index( [ 0, 0 ] ) ).to.be( undefined )
        expect( AB.index( [ ] ) ).to.be( AB )
        expect( AB.index( [ 0 ] ) ).to.be( undefined )
        expect( AB.index( [ 1 ] ) ).to.be( undefined )
        expect( AB.index( [ 0, 0 ] ) ).to.be( undefined )
        expect( B.index( [ ] ) ).to.be( B )
        expect( B.index( [ 0 ] ) ).to.be( undefined )
        expect( B.index( [ 1 ] ) ).to.be( undefined )
        expect( B.index( [ 0, 0 ] ) ).to.be( undefined )
    } )

} )
