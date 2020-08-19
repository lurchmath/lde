
import { Structure } from '../src/structure.js'

describe( 'Structure module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( Structure ).to.be.ok
    } )

} )

describe( 'Structure construction', () => {

    it( 'Structure objects can be built with constructors', () => {
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
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )
        expect( B.parent() ).to.equal( root )

        // Ensure that all child arrays are equivalent in structure to what's expected
        // based on the construction code above.
        expect( root.children() ).to.eql( [ A, B ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )

        // Ensure that numChildren() and isAtomic() give the right answer in each case
        expect( root.numChildren() ).to.equal( 2 )
        expect( A.numChildren() ).to.equal( 2 )
        expect( AA.numChildren() ).to.equal( 0 )
        expect( AB.numChildren() ).to.equal( 0 )
        expect( B.numChildren() ).to.equal( 0 )
        expect( root.isAtomic() ).to.equal( false )
        expect( A.isAtomic() ).to.equal( false )
        expect( AA.isAtomic() ).to.equal( true )
        expect( AB.isAtomic() ).to.equal( true )
        expect( B.isAtomic() ).to.equal( true )

        // Ensure that previous and next sibling functions work as expected.
        expect( root.previousSibling() ).to.equal( undefined )
        expect( root.nextSibling() ).to.equal( undefined )
        expect( A.previousSibling() ).to.equal( undefined )
        expect( A.nextSibling() ).to.equal( B )
        expect( AA.previousSibling() ).to.equal( undefined )
        expect( AA.nextSibling() ).to.equal( AB )
        expect( AB.previousSibling() ).to.equal( AA )
        expect( AB.nextSibling() ).to.equal( undefined )
        expect( B.previousSibling() ).to.equal( A )
        expect( B.nextSibling() ).to.equal( undefined )
    } )

    it( 'Structure constructor ignores invalid child parameters', () => {
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
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )
        expect( B.parent() ).to.equal( root )
        expect( root.children() ).to.eql( [ A, B ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )

        // Ensure that numChildren() and isAtomic() give the right answer in each case
        expect( root.numChildren() ).to.equal( 2 )
        expect( A.numChildren() ).to.equal( 2 )
        expect( AA.numChildren() ).to.equal( 0 )
        expect( AB.numChildren() ).to.equal( 0 )
        expect( B.numChildren() ).to.equal( 0 )
        expect( root.isAtomic() ).to.equal( false )
        expect( A.isAtomic() ).to.equal( false )
        expect( AA.isAtomic() ).to.equal( true )
        expect( AB.isAtomic() ).to.equal( true )
        expect( B.isAtomic() ).to.equal( true )
    } )

    it( 'Structure constructor should prevent cyclic hierarchies', () => {
        // Create a single Structure and try to make it a child of itself.  This should
        // fail, leaving the Structure in its original state.
        let C, D
        let A = new Structure
        A.insertChild( A )
        expect( A.parent() ).to.equal( null )
        expect( A.children() ).to.eql( [ ] )

        // Create another Structure B and insert it as a child of A.  Then try to insert A
        // as a child of B.  This should succeed, but should have removed B from being
        // a child of A, so that the structure remains acyclic.
        let B = new Structure
        A.insertChild( B )
        expect( A.parent() ).to.equal( null )
        expect( A.children() ).to.eql( [ B ] )
        expect( B.parent() ).to.equal( A )
        expect( B.children() ).to.eql( [ ] )
        B.insertChild( A )
        expect( A.parent() ).to.equal( B )
        expect( A.children() ).to.eql( [ ] )
        expect( B.parent() ).to.equal( null )
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
        expect( A.parent() ).to.equal( D )
        expect( B.parent() ).to.equal( A )
        expect( C.parent() ).to.equal( A )
        expect( D.parent() ).to.equal( null )
        expect( A.children() ).to.eql( [ B, C ] )
        expect( B.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( D.children() ).to.eql( [ A ] )
    } )

} )

describe( 'Structure manipulation', () => {

    it( 'Supports removing structures from parents', () => {
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
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )
        expect( B.parent() ).to.equal( null )

        // Remove a grandchild of the root and verify that the structure is as
        // expected.
        AA.remove()
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( null )
        expect( AB.parent() ).to.equal( A )
        expect( B.parent() ).to.equal( null )

        // Remove something that has already been removed, and verify that nothing
        // changes or causes an error.
        AA.remove()
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( null )
        expect( AB.parent() ).to.equal( A )
        expect( B.parent() ).to.equal( null )

        // Ensure that numChildren() and isAtomic() still give the right answer in each case
        expect( root.numChildren() ).to.equal( 1 )
        expect( A.numChildren() ).to.equal( 1 )
        expect( AA.numChildren() ).to.equal( 0 )
        expect( AB.numChildren() ).to.equal( 0 )
        expect( B.numChildren() ).to.equal( 0 )
        expect( root.isAtomic() ).to.equal( false )
        expect( A.isAtomic() ).to.equal( false )
        expect( AA.isAtomic() ).to.equal( true )
        expect( AB.isAtomic() ).to.equal( true )
        expect( B.isAtomic() ).to.equal( true )
    } )

    it( 'Supports removing child structures', () => {
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
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )
        expect( B.parent() ).to.equal( null )

        // Remove a grandchild of the root and verify that the structure is as
        // expected.
        A.removeChild( 0 )
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( null )
        expect( AB.parent() ).to.equal( A )
        expect( B.parent() ).to.equal( null )

        // Remove an invalid index, and verify that nothing changes or causes an error.
        A.removeChild( 1 )
        expect( root.children() ).to.eql( [ A ] )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( null )
        expect( AB.parent() ).to.equal( A )
        expect( B.parent() ).to.equal( null )
    } )

    it( 'Supports inserting structures', () => {
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
        expect( C.parent() ).to.equal( null )
        expect( C.children() ).to.eql( [ ] )
        root.insertChild( C, 1 )
        expect( root.children() ).to.eql( [ A, C, B ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )
        expect( C.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( root )
        
        // Append a child to the end of the list of children of a child of the root and
        // verify that the structure is as expected.
        const D = new Structure
        expect( D.parent() ).to.equal( null )
        expect( D.children() ).to.eql( [ ] )
        A.insertChild( D, 2 )
        expect( root.children() ).to.eql( [ A, C, B ] )
        expect( A.children() ).to.eql( [ AA, AB, D ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( D.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )
        expect( D.parent() ).to.equal( A )
        expect( C.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( root )
        
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
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( root )
        expect( AB.parent() ).to.equal( A )
        expect( D.parent() ).to.equal( A )
        expect( C.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( root )
        
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
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( root )
        expect( AB.parent() ).to.equal( A )
        expect( D.parent() ).to.equal( A )
        expect( C.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( root )

        // Ensure that numChildren() and isAtomic() still give the right answer in each case
        expect( root.numChildren() ).to.equal( 4 )
        expect( A.numChildren() ).to.equal( 2 )
        expect( AA.numChildren() ).to.equal( 0 )
        expect( AB.numChildren() ).to.equal( 0 )
        expect( B.numChildren() ).to.equal( 0 )
        expect( root.isAtomic() ).to.equal( false )
        expect( A.isAtomic() ).to.equal( false )
        expect( AA.isAtomic() ).to.equal( true )
        expect( AB.isAtomic() ).to.equal( true )
        expect( B.isAtomic() ).to.equal( true )
    } )

    it( 'Ssupports replacing structures', () => {

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
        expect( C.parent() ).to.equal( null )
        expect( C.children() ).to.eql( [ ] )
        B.replaceWith( C )
        expect( root.children() ).to.eql( [ A, C ] )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )
        expect( C.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( null )

        // Replace one grandchild of the root with the former child of the root, and
        // verify that all comes out as expected.
        AA.replaceWith( B )
        expect( root.children() ).to.eql( [ A, C ] )
        expect( A.children() ).to.eql( [ B, AB ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( root )
        expect( AA.parent() ).to.equal( null )
        expect( AB.parent() ).to.equal( A )
        expect( C.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( A )

        // Replace A with one of its own children, as a corner case test.
        A.replaceWith( AB )
        expect( root.children() ).to.eql( [ AB, C ] )
        expect( A.children() ).to.eql( [ B ] )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.children() ).to.eql( [ ] )
        expect( C.children() ).to.eql( [ ] )
        expect( B.children() ).to.eql( [ ] )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( null )
        expect( AA.parent() ).to.equal( null )
        expect( AB.parent() ).to.equal( root )
        expect( C.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( A )
    } )
        
    it( 'Handles push/pop/shift/unshift of children correctly', () => {
        // Make a set of structures that we will build into a hierarchy.
        const root = new Structure
        const A = new Structure
        const AA = new Structure
        const AB  = new Structure
        const B = new Structure
   
        // Verify that at first no one has any parent/child.
        expect( root.isAtomic() ).to.equal( true )
        expect( A.isAtomic() ).to.equal( true )
        expect( AA.isAtomic() ).to.equal( true )
        expect( AB.isAtomic() ).to.equal( true )
        expect( B.isAtomic() ).to.equal( true )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( null )
        expect( AA.parent() ).to.equal( null )
        expect( AB.parent() ).to.equal( null )
        expect( B.parent() ).to.equal( null )

        // Push a child of root and verify the results
        root.pushChild( A )
        expect( root.isAtomic() ).to.equal( false )
        expect( root.numChildren() ).to.equal( 1 )
        expect( root.children() ).to.eql( [ A ] )
        expect( A.parent() ).to.equal( root )

        // Push another child of root and verify the results
        root.pushChild( B )
        expect( root.isAtomic() ).to.equal( false )
        expect( root.numChildren() ).to.equal( 2 )
        expect( root.children() ).to.eql( [ A, B ] )
        expect( A.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( root )

        // Unshift a child of A and verify the results
        A.unshiftChild( AB )
        expect( A.isAtomic() ).to.equal( false )
        expect( A.numChildren() ).to.equal( 1 )
        expect( A.children() ).to.eql( [ AB ] )
        expect( AB.parent() ).to.equal( A )

        // Unshift another child of A and verify the results
        A.unshiftChild( AA )
        expect( A.isAtomic() ).to.equal( false )
        expect( A.numChildren() ).to.equal( 2 )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )

        // Pop a child from A and verify the results
        A.popChild()
        expect( A.isAtomic() ).to.equal( false )
        expect( A.numChildren() ).to.equal( 1 )
        expect( A.children() ).to.eql( [ AA ] )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( null )

        // Shift a child from root and verify the results
        root.shiftChild()
        expect( root.isAtomic() ).to.equal( false )
        expect( root.numChildren() ).to.equal( 1 )
        expect( root.children() ).to.eql( [ B ] )
        expect( A.parent() ).to.equal( null )
        expect( B.parent() ).to.equal( root )
    } )
        
    it( 'Can replace all children at once', () => {
        // Make a set of structures that we will build into a hierarchy.
        const root = new Structure
        const A = new Structure
        const AA = new Structure
        const AB  = new Structure
        const B = new Structure
   
        // Verify that at first no one has any parent/child.
        expect( root.isAtomic() ).to.equal( true )
        expect( A.isAtomic() ).to.equal( true )
        expect( AA.isAtomic() ).to.equal( true )
        expect( AB.isAtomic() ).to.equal( true )
        expect( B.isAtomic() ).to.equal( true )
        expect( root.parent() ).to.equal( null )
        expect( A.parent() ).to.equal( null )
        expect( AA.parent() ).to.equal( null )
        expect( AB.parent() ).to.equal( null )
        expect( B.parent() ).to.equal( null )

        // put some children into the root
        root.setChildren( [ A, B ] )
        expect( root.isAtomic() ).to.equal( false )
        expect( root.numChildren() ).to.equal( 2 )
        expect( root.children() ).to.eql( [ A, B ] )
        expect( A.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( root )

        // put some children into A
        A.setChildren( [ AA, AB ] )
        expect( A.isAtomic() ).to.equal( false )
        expect( A.numChildren() ).to.equal( 2 )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )

        // reorder the children of the root
        root.setChildren( [ B, A ] )
        expect( root.isAtomic() ).to.equal( false )
        expect( root.numChildren() ).to.equal( 2 )
        expect( root.children() ).to.eql( [ B, A ] )
        expect( A.parent() ).to.equal( root )
        expect( B.parent() ).to.equal( root )
        expect( A.isAtomic() ).to.equal( false )
        expect( A.numChildren() ).to.equal( 2 )
        expect( A.children() ).to.eql( [ AA, AB ] )
        expect( AA.parent() ).to.equal( A )
        expect( AB.parent() ).to.equal( A )

        // move A's children into B instead
        B.setChildren( [ AA, AB ] )
        expect( A.isAtomic() ).to.equal( true )
        expect( A.numChildren() ).to.equal( 0 )
        expect( A.children() ).to.eql( [ ] )
        expect( B.isAtomic() ).to.equal( false )
        expect( B.numChildren() ).to.equal( 2 )
        expect( B.children() ).to.eql( [ AA, AB ] )
        expect( AA.parent() ).to.equal( B )
        expect( AB.parent() ).to.equal( B )

        // truly mess with things and make sure it still works
        root.setChildren( [ AA, B, A, AB ] )
        expect( root.isAtomic() ).to.equal( false )
        expect( root.numChildren() ).to.equal( 4 )
        expect( root.children() ).to.eql( [ AA, B, A, AB ] )
        expect( A.isAtomic() ).to.equal( true )
        expect( A.numChildren() ).to.equal( 0 )
        expect( A.children() ).to.eql( [ ] )
        expect( AA.isAtomic() ).to.equal( true )
        expect( AA.numChildren() ).to.equal( 0 )
        expect( AA.children() ).to.eql( [ ] )
        expect( AB.isAtomic() ).to.equal( true )
        expect( AB.numChildren() ).to.equal( 0 )
        expect( AB.children() ).to.eql( [ ] )
        expect( B.isAtomic() ).to.equal( true )
        expect( B.numChildren() ).to.equal( 0 )
        expect( B.children() ).to.eql( [ ] )
    } )

} )

describe( 'Events for changes to Structure instances', () => {

    // I'm rollying my own spy functions, because chai's are annoying to use in
    // the browser.
    const makeSpy = () => {
        const result = ( ...args ) => result.callRecord.push( args )
        result.callRecord = [ ]
        return result
    }

    // Set up two Structures with lots of event listeners before each test.
    let A = null
    let B = null
    let ALs = [ ]
    let BLs = [ ]
    beforeEach( () => {
        A = new Structure
        ALs = {
            wasInserted : makeSpy(),
            wasRemoved : makeSpy(),
            willBeInserted : makeSpy(),
            willBeRemoved : makeSpy()
        }
        A.addEventListener( 'wasInserted', ALs.wasInserted )
        A.addEventListener( 'wasRemoved', ALs.wasRemoved )
        A.addEventListener( 'willBeInserted', ALs.willBeInserted )
        A.addEventListener( 'willBeRemoved', ALs.willBeRemoved )
        B = new Structure
        BLs = {
            wasInserted : makeSpy(),
            wasRemoved : makeSpy(),
            willBeInserted : makeSpy(),
            willBeRemoved : makeSpy()
        }
        B.addEventListener( 'wasInserted', BLs.wasInserted )
        B.addEventListener( 'wasRemoved', BLs.wasRemoved )
        B.addEventListener( 'willBeInserted', BLs.willBeInserted )
        B.addEventListener( 'willBeRemoved', BLs.willBeRemoved )
    } )

    it( 'Should begin with no event listeners called', () => {
        expect( ALs.wasInserted.callRecord ).to.eql( [ ] )
        expect( ALs.wasRemoved.callRecord ).to.eql( [ ] )
        expect( ALs.willBeInserted.callRecord ).to.eql( [ ] )
        expect( ALs.willBeRemoved.callRecord ).to.eql( [ ] )
        expect( BLs.wasInserted.callRecord ).to.eql( [ ] )
        expect( BLs.wasRemoved.callRecord ).to.eql( [ ] )
        expect( BLs.willBeInserted.callRecord ).to.eql( [ ] )
        expect( BLs.willBeRemoved.callRecord ).to.eql( [ ] )
    } )

    it( 'Should send insertion and removal events', () => {
        let args

        // Insert one as a child of the other
        B.insertChild( A )
        // A.willBeInserted got called once, with correct parent, child, and index
        expect( ALs.willBeInserted.callRecord.length ).to.equal( 1 )
        args = ALs.willBeInserted.callRecord[0]
        expect( args.length ).to.equal( 1 )
        expect( args[0].parent ).to.equal( B )
        expect( args[0].child ).to.equal( A )
        expect( args[0].index ).to.equal( 0 )
        // A.wasInserted got called once, with same data
        expect( ALs.wasInserted.callRecord.length ).to.equal( 1 )
        args = ALs.wasInserted.callRecord[0]
        expect( args.length ).to.equal( 1 )
        expect( args[0].parent ).to.equal( B )
        expect( args[0].child ).to.equal( A )
        expect( args[0].index ).to.equal( 0 )
        // No other handlers got called
        expect( ALs.willBeRemoved.callRecord.length ).to.equal( 0 )
        expect( ALs.wasRemoved.callRecord.length ).to.equal( 0 )
        expect( BLs.willBeInserted.callRecord.length ).to.equal( 0 )
        expect( BLs.wasInserted.callRecord.length ).to.equal( 0 )
        expect( BLs.willBeRemoved.callRecord.length ).to.equal( 0 )
        expect( BLs.wasRemoved.callRecord.length ).to.equal( 0 )

        // Remove the child
        A.remove()
        // A.willBeRemoved got called once, with correct parent, child, and index
        expect( ALs.willBeRemoved.callRecord.length ).to.equal( 1 )
        args = ALs.willBeRemoved.callRecord[0]
        expect( args.length ).to.equal( 1 )
        expect( args[0].parent ).to.equal( B )
        expect( args[0].child ).to.equal( A )
        expect( args[0].index ).to.equal( 0 )
        // A.wasRemoved got called once, with same data
        expect( ALs.wasRemoved.callRecord.length ).to.equal( 1 )
        args = ALs.wasRemoved.callRecord[0]
        expect( args.length ).to.equal( 1 )
        expect( args[0].parent ).to.equal( B )
        expect( args[0].child ).to.equal( A )
        expect( args[0].index ).to.equal( 0 )
        // The two insertion handlers still have been called only once, earlier
        expect( ALs.willBeInserted.callRecord.length ).to.equal( 1 )
        expect( ALs.wasInserted.callRecord.length ).to.equal( 1 )
        // And all of B's events still haven't been called at all
        expect( BLs.willBeInserted.callRecord.length ).to.equal( 0 )
        expect( BLs.wasInserted.callRecord.length ).to.equal( 0 )
        expect( BLs.willBeRemoved.callRecord.length ).to.equal( 0 )
        expect( BLs.wasRemoved.callRecord.length ).to.equal( 0 )
    } )

} )

describe( 'Structure lookup', () => {

    it( 'Correctly computes indices in parent Structure', () => {
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
        expect( root.indexInParent() ).to.equal( undefined )
        expect( A.indexInParent() ).to.equal( 0 )
        expect( AA.indexInParent() ).to.equal( 0 )
        expect( AB.indexInParent() ).to.equal( 1 )
        expect( B.indexInParent() ).to.equal( 1 )
    } )

    it( 'Correctly computes [all but] first/last child', () => {
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
        expect( root.firstChild() ).to.equal( A )
        expect( A.firstChild() ).to.equal( AA )
        expect( AA.firstChild() ).to.equal( AAA )
        expect( AAA.firstChild() ).to.equal( undefined )
        expect( AB.firstChild() ).to.equal( undefined )
        expect( B.firstChild() ).to.equal( undefined )
        expect( root.lastChild() ).to.equal( B )
        expect( A.lastChild() ).to.equal( AB )
        expect( AA.lastChild() ).to.equal( AAA )
        expect( AAA.lastChild() ).to.equal( undefined )
        expect( AB.lastChild() ).to.equal( undefined )
        expect( B.lastChild() ).to.equal( undefined )
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

    it( 'Correctly computes addresses and indices', () => {
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
        expect( root.index( [ ] ) ).to.equal( root )
        expect( root.index( [ 0 ] ) ).to.equal( A )
        expect( root.index( [ 1 ] ) ).to.equal( B )
        expect( root.index( [ 0, 0 ] ) ).to.equal( AA )
        expect( root.index( [ 0, 1 ] ) ).to.equal( AB )
        expect( root.index( [ 0, 0, 0 ] ) ).to.equal( AAA )
        expect( root.index( [ 2 ] ) ).to.equal( undefined )
        expect( root.index( [ -1 ] ) ).to.equal( undefined )
        expect( root.index( [ 0, 2 ] ) ).to.equal( undefined )
        expect( root.index( [ 0, 0, 'hi' ] ) ).to.equal( undefined )
        expect( A.index( [ ] ) ).to.equal( A )
        expect( A.index( [ 0 ] ) ).to.equal( AA )
        expect( A.index( [ 1 ] ) ).to.equal( AB )
        expect( A.index( [ 0, 0 ] ) ).to.equal( AAA )
        expect( A.index( [ 2 ] ) ).to.equal( undefined )
        expect( A.index( [ 0, 1 ] ) ).to.equal( undefined )
        expect( A.index( [ 'x', 'y' ] ) ).to.equal( undefined )
        expect( AA.index( [ ] ) ).to.equal( AA )
        expect( AA.index( [ 0 ] ) ).to.equal( AAA )
        expect( AA.index( [ 1 ] ) ).to.equal( undefined )
        expect( AA.index( [ 0, 0 ] ) ).to.equal( undefined )
        expect( AAA.index( [ ] ) ).to.equal( AAA )
        expect( AAA.index( [ 0 ] ) ).to.equal( undefined )
        expect( AAA.index( [ 1 ] ) ).to.equal( undefined )
        expect( AAA.index( [ 0, 0 ] ) ).to.equal( undefined )
        expect( AB.index( [ ] ) ).to.equal( AB )
        expect( AB.index( [ 0 ] ) ).to.equal( undefined )
        expect( AB.index( [ 1 ] ) ).to.equal( undefined )
        expect( AB.index( [ 0, 0 ] ) ).to.equal( undefined )
        expect( B.index( [ ] ) ).to.equal( B )
        expect( B.index( [ 0 ] ) ).to.equal( undefined )
        expect( B.index( [ 1 ] ) ).to.equal( undefined )
        expect( B.index( [ 0, 0 ] ) ).to.equal( undefined )
    } )

    it( 'Correctly computes ancestor chains', () => {
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

        // Compute ancestor chains of everything and verify they're correct.
        expect( root.ancestors() ).to.eql( [ root ] )
        expect( A.ancestors() ).to.eql( [ A, root ] )
        expect( AA.ancestors() ).to.eql( [ AA, A, root ] )
        expect( AAA.ancestors() ).to.eql( [ AAA, AA, A, root ] )
        expect( AB.ancestors() ).to.eql( [ AB, A, root ] )
        expect( B.ancestors() ).to.eql( [ B, root ] )
    } )

} )

describe( 'Structure predicate functions', () => {

    it( 'Correctly finds children/descendants satisfying a predicate', () => {
        // Make a similar small structure hierarchy as in earlier tests,
        // but then give each structure a name, to help with testing.
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
        root.name = 'root'
        A.name = 'A'
        AA.name = 'AA'
        AAA.name = 'AAA'
        AB.name = 'AB'
        B.name = 'B'

        // Call childrenSatisfying() on several nodes with three different
        // predicates, and verify the correct return value in each case.
        const nameHasA = x => /A/.test( x.name )
        const nameIsLong = x => x.name.length > 2
        const nonAtomic = x => !x.isAtomic()
        expect( root.childrenSatisfying( nameHasA ) ).to.eql( [ A ] )
        expect( A.childrenSatisfying( nameHasA ) ).to.eql( [ AA, AB ] )
        expect( AA.childrenSatisfying( nameHasA ) ).to.eql( [ AAA ] )
        expect( B.childrenSatisfying( nameHasA ) ).to.eql( [ ] )
        expect( root.childrenSatisfying( nameIsLong ) ).to.eql( [ ] )
        expect( A.childrenSatisfying( nameIsLong ) ).to.eql( [ ] )
        expect( AA.childrenSatisfying( nameIsLong ) ).to.eql( [ AAA ] )
        expect( B.childrenSatisfying( nameIsLong ) ).to.eql( [ ] )
        expect( root.childrenSatisfying( nonAtomic ) ).to.eql( [ A ] )
        expect( A.childrenSatisfying( nonAtomic ) ).to.eql( [ AA ] )
        expect( AA.childrenSatisfying( nonAtomic ) ).to.eql( [ ] )
        expect( B.childrenSatisfying( nonAtomic ) ).to.eql( [ ] )

        // In each case, hasChildSatisfying() should match the results of
        // childrenSatisfying().
        expect( root.hasChildSatisfying( nameHasA ) ).to.equal( true )
        expect( A.hasChildSatisfying( nameHasA ) ).to.equal( true )
        expect( AA.hasChildSatisfying( nameHasA ) ).to.equal( true )
        expect( B.hasChildSatisfying( nameHasA ) ).to.equal( false )
        expect( root.hasChildSatisfying( nameIsLong ) ).to.equal( false )
        expect( A.hasChildSatisfying( nameIsLong ) ).to.equal( false )
        expect( AA.hasChildSatisfying( nameIsLong ) ).to.equal( true )
        expect( B.hasChildSatisfying( nameIsLong ) ).to.equal( false )
        expect( root.hasChildSatisfying( nonAtomic ) ).to.equal( true )
        expect( A.hasChildSatisfying( nonAtomic ) ).to.equal( true )
        expect( AA.hasChildSatisfying( nonAtomic ) ).to.equal( false )
        expect( B.hasChildSatisfying( nonAtomic ) ).to.equal( false )

        // Call descendantsSatisfying() on several nodes with the same predicates,
        // again verifying correct results in each case.
        expect( root.descendantsSatisfying( nameHasA ) ).to.eql( [ A, AA, AAA, AB ] )
        expect( A.descendantsSatisfying( nameHasA ) ).to.eql( [ A, AA, AAA, AB ] )
        expect( AA.descendantsSatisfying( nameHasA ) ).to.eql( [ AA, AAA ] )
        expect( AAA.descendantsSatisfying( nameHasA ) ).to.eql( [ AAA ] )
        expect( AB.descendantsSatisfying( nameHasA ) ).to.eql( [ AB ] )
        expect( B.descendantsSatisfying( nameHasA ) ).to.eql( [ ] )
        expect( root.descendantsSatisfying( nameIsLong ) ).to.eql( [ root, AAA ] )
        expect( A.descendantsSatisfying( nameIsLong ) ).to.eql( [ AAA ] )
        expect( AA.descendantsSatisfying( nameIsLong ) ).to.eql( [ AAA ] )
        expect( AAA.descendantsSatisfying( nameIsLong ) ).to.eql( [ AAA ] )
        expect( AB.descendantsSatisfying( nameIsLong ) ).to.eql( [ ] )
        expect( B.descendantsSatisfying( nameIsLong ) ).to.eql( [ ] )
        expect( root.descendantsSatisfying( nonAtomic ) ).to.eql( [ root, A, AA ] )
        expect( A.descendantsSatisfying( nonAtomic ) ).to.eql( [ A, AA ] )
        expect( AA.descendantsSatisfying( nonAtomic ) ).to.eql( [ AA ] )
        expect( AAA.descendantsSatisfying( nonAtomic ) ).to.eql( [ ] )
        expect( AB.descendantsSatisfying( nonAtomic ) ).to.eql( [ ] )
        expect( B.descendantsSatisfying( nonAtomic ) ).to.eql( [ ] )

        // In each case, hasDescendantSatsifying() should match the results of
        // descendantsSatisfying().
        expect( root.hasDescendantSatisfying( nameHasA ) ).to.equal( true )
        expect( A.hasDescendantSatisfying( nameHasA ) ).to.equal( true )
        expect( AA.hasDescendantSatisfying( nameHasA ) ).to.equal( true )
        expect( AAA.hasDescendantSatisfying( nameHasA ) ).to.equal( true )
        expect( AB.hasDescendantSatisfying( nameHasA ) ).to.equal( true )
        expect( B.hasDescendantSatisfying( nameHasA ) ).to.equal( false )
        expect( root.hasDescendantSatisfying( nameIsLong ) ).to.equal( true )
        expect( A.hasDescendantSatisfying( nameIsLong ) ).to.equal( true )
        expect( AA.hasDescendantSatisfying( nameIsLong ) ).to.equal( true )
        expect( AAA.hasDescendantSatisfying( nameIsLong ) ).to.equal( true )
        expect( AB.hasDescendantSatisfying( nameIsLong ) ).to.equal( false )
        expect( B.hasDescendantSatisfying( nameIsLong ) ).to.equal( false )
        expect( root.hasDescendantSatisfying( nonAtomic ) ).to.equal( true )
        expect( A.hasDescendantSatisfying( nonAtomic ) ).to.equal( true )
        expect( AA.hasDescendantSatisfying( nonAtomic ) ).to.equal( true )
        expect( AAA.hasDescendantSatisfying( nonAtomic ) ).to.equal( false )
        expect( AB.hasDescendantSatisfying( nonAtomic ) ).to.equal( false )
        expect( B.hasDescendantSatisfying( nonAtomic ) ).to.equal( false )
    } )

    it( 'Correctly finds ancestors satisfying a predicate', () => {
        // Make a similar small structure hierarchy as in earlier tests,
        // but then give each structure a name, to help with testing.
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
        root.name = 'root'
        A.name = 'A'
        AA.name = 'AA'
        AAA.name = 'AAA'
        AB.name = 'AB'
        B.name = 'B'

        // Call firstAncestorSatisfying() on several nodes with three different
        // predicates, and verify the correct return value in each case.
        const nameHasA = x => /A/.test( x.name )
        const nameIsLong = x => x.name.length > 2
        const nonAtomic = x => !x.isAtomic()
        expect( root.ancestorsSatisfying( nameHasA ) ).to.eql( [ ] )
        expect( A.ancestorsSatisfying( nameHasA ) ).to.eql( [ A ] )
        expect( AA.ancestorsSatisfying( nameHasA ) ).to.eql( [ AA, A ] )
        expect( B.ancestorsSatisfying( nameHasA ) ).to.eql( [ ] )
        expect( root.ancestorsSatisfying( nameIsLong ) ).to.eql( [ root ] )
        expect( A.ancestorsSatisfying( nameIsLong ) ).to.eql( [ root ] )
        expect( AA.ancestorsSatisfying( nameIsLong ) ).to.eql( [ root ] )
        expect( B.ancestorsSatisfying( nameIsLong ) ).to.eql( [ root ] )
        expect( root.ancestorsSatisfying( nonAtomic ) ).to.eql( [ root ] )
        expect( A.ancestorsSatisfying( nonAtomic ) ).to.eql( [ A, root ] )
        expect( AA.ancestorsSatisfying( nonAtomic ) ).to.eql( [ AA, A, root ] )
        expect( B.ancestorsSatisfying( nonAtomic ) ).to.eql( [ root ] )

        // In each case, hasAncestorSatisfying() should match the results of
        // ancestorsSatisfying().
        expect( root.hasAncestorSatisfying( nameHasA ) ).to.equal( false )
        expect( A.hasAncestorSatisfying( nameHasA ) ).to.equal( true )
        expect( AA.hasAncestorSatisfying( nameHasA ) ).to.equal( true )
        expect( B.hasAncestorSatisfying( nameHasA ) ).to.equal( false )
        expect( root.hasAncestorSatisfying( nameIsLong ) ).to.equal( true )
        expect( A.hasAncestorSatisfying( nameIsLong ) ).to.equal( true )
        expect( AA.hasAncestorSatisfying( nameIsLong ) ).to.equal( true )
        expect( B.hasAncestorSatisfying( nameIsLong ) ).to.equal( true )
        expect( root.hasAncestorSatisfying( nonAtomic ) ).to.equal( true )
        expect( A.hasAncestorSatisfying( nonAtomic ) ).to.equal( true )
        expect( AA.hasAncestorSatisfying( nonAtomic ) ).to.equal( true )
        expect( B.hasAncestorSatisfying( nonAtomic ) ).to.equal( true )
    } )

} )

describe( 'Structure order relations', () => {

    it( 'correctly judges when one Structure is earlier than another', () => {
        // Make some Structure hierarchies we can use for testing "earlier than"
        let A, AA, AB, ABA, B, dA
        const root = new Structure(
            A = new Structure(
                AA = new Structure,
                AB = new Structure(
                    ABA = new Structure
                )
            ),
            B = new Structure
        )
        const disconnected = new Structure(
            dA = new Structure
        )
        // Apply earlier-than to all possible pairs of nodes in these trees,
        // and verify the correct answer in each case.
        expect( root.isEarlierThan( root ) ).to.equal( false )
        expect( root.isEarlierThan( A ) ).to.equal( true )
        expect( root.isEarlierThan( AA ) ).to.equal( true )
        expect( root.isEarlierThan( AB ) ).to.equal( true )
        expect( root.isEarlierThan( ABA ) ).to.equal( true )
        expect( root.isEarlierThan( B ) ).to.equal( true )
        expect( root.isEarlierThan( disconnected ) ).to.equal( undefined )
        expect( root.isEarlierThan( dA ) ).to.equal( undefined )
        expect( A.isEarlierThan( root ) ).to.equal( false )
        expect( A.isEarlierThan( A ) ).to.equal( false )
        expect( A.isEarlierThan( AA ) ).to.equal( true )
        expect( A.isEarlierThan( AB ) ).to.equal( true )
        expect( A.isEarlierThan( ABA ) ).to.equal( true )
        expect( A.isEarlierThan( B ) ).to.equal( true )
        expect( A.isEarlierThan( disconnected ) ).to.equal( undefined )
        expect( A.isEarlierThan( dA ) ).to.equal( undefined )
        expect( AA.isEarlierThan( root ) ).to.equal( false )
        expect( AA.isEarlierThan( A ) ).to.equal( false )
        expect( AA.isEarlierThan( AA ) ).to.equal( false )
        expect( AA.isEarlierThan( AB ) ).to.equal( true )
        expect( AA.isEarlierThan( ABA ) ).to.equal( true )
        expect( AA.isEarlierThan( B ) ).to.equal( true )
        expect( AA.isEarlierThan( disconnected ) ).to.equal( undefined )
        expect( AA.isEarlierThan( dA ) ).to.equal( undefined )
        expect( AB.isEarlierThan( root ) ).to.equal( false )
        expect( AB.isEarlierThan( A ) ).to.equal( false )
        expect( AB.isEarlierThan( AA ) ).to.equal( false )
        expect( AB.isEarlierThan( AB ) ).to.equal( false )
        expect( AB.isEarlierThan( ABA ) ).to.equal( true )
        expect( AB.isEarlierThan( B ) ).to.equal( true )
        expect( AB.isEarlierThan( disconnected ) ).to.equal( undefined )
        expect( AB.isEarlierThan( dA ) ).to.equal( undefined )
        expect( ABA.isEarlierThan( root ) ).to.equal( false )
        expect( ABA.isEarlierThan( A ) ).to.equal( false )
        expect( ABA.isEarlierThan( AA ) ).to.equal( false )
        expect( ABA.isEarlierThan( AB ) ).to.equal( false )
        expect( ABA.isEarlierThan( ABA ) ).to.equal( false )
        expect( ABA.isEarlierThan( B ) ).to.equal( true )
        expect( ABA.isEarlierThan( disconnected ) ).to.equal( undefined )
        expect( ABA.isEarlierThan( dA ) ).to.equal( undefined )
        expect( B.isEarlierThan( root ) ).to.equal( false )
        expect( B.isEarlierThan( A ) ).to.equal( false )
        expect( B.isEarlierThan( AA ) ).to.equal( false )
        expect( B.isEarlierThan( AB ) ).to.equal( false )
        expect( B.isEarlierThan( ABA ) ).to.equal( false )
        expect( B.isEarlierThan( B ) ).to.equal( false )
        expect( B.isEarlierThan( disconnected ) ).to.equal( undefined )
        expect( B.isEarlierThan( dA ) ).to.equal( undefined )
        expect( disconnected.isEarlierThan( root ) ).to.equal( undefined )
        expect( disconnected.isEarlierThan( A ) ).to.equal( undefined )
        expect( disconnected.isEarlierThan( AA ) ).to.equal( undefined )
        expect( disconnected.isEarlierThan( AB ) ).to.equal( undefined )
        expect( disconnected.isEarlierThan( ABA ) ).to.equal( undefined )
        expect( disconnected.isEarlierThan( B ) ).to.equal( undefined )
        expect( disconnected.isEarlierThan( disconnected ) ).to.equal( false )
        expect( disconnected.isEarlierThan( dA ) ).to.equal( true )
        expect( dA.isEarlierThan( root ) ).to.equal( undefined )
        expect( dA.isEarlierThan( A ) ).to.equal( undefined )
        expect( dA.isEarlierThan( AA ) ).to.equal( undefined )
        expect( dA.isEarlierThan( AB ) ).to.equal( undefined )
        expect( dA.isEarlierThan( ABA ) ).to.equal( undefined )
        expect( dA.isEarlierThan( B ) ).to.equal( undefined )
        expect( dA.isEarlierThan( disconnected ) ).to.equal( false )
        expect( dA.isEarlierThan( dA ) ).to.equal( false )
        // isEarlierThan() returns undefined if passed a non-Structure
        expect( A.isEarlierThan() ).to.equal( undefined )
        expect( ABA.isEarlierThan( root.parent() ) ).to.equal( undefined )
        expect( dA.isEarlierThan( { } ) ).to.equal( undefined )
        // isLaterThan() just does the same as isEarlierThan(), with the
        // "arguments" in reverse order
        for ( let left of [ root, A, AA, AB, ABA, B, disconnected, dA ] )
            for ( let right of [ root, A, AA, AB, ABA, B, disconnected, dA ] )
                expect( left.isEarlierThan( right ) ).to.equal(
                    right.isLaterThan( left ) )
    } )

    it( 'creates correct pre-order tree traversal iterators', () => {
        // Re-use the structure hierarchies from the previous test
        let A, AA, AB, ABA, B, dA
        const root = new Structure(
            A = new Structure(
                AA = new Structure,
                AB = new Structure(
                    ABA = new Structure
                )
            ),
            B = new Structure
        )
        const disconnected = new Structure(
            dA = new Structure
        )
        // Compute nextInTree() and previousInTree() for each node, verifying
        // correctness.
        expect( root.nextInTree() ).to.equal( A )
        expect( A.nextInTree() ).to.equal( AA )
        expect( AA.nextInTree() ).to.equal( AB )
        expect( AB.nextInTree() ).to.equal( ABA )
        expect( ABA.nextInTree() ).to.equal( B )
        expect( B.nextInTree() ).to.equal( undefined )
        expect( disconnected.nextInTree() ).to.equal( dA )
        expect( dA.nextInTree() ).to.equal( undefined )
        expect( root.previousInTree() ).to.equal( undefined )
        expect( A.previousInTree() ).to.equal( root )
        expect( AA.previousInTree() ).to.equal( A )
        expect( AB.previousInTree() ).to.equal( AA )
        expect( ABA.previousInTree() ).to.equal( AB )
        expect( B.previousInTree() ).to.equal( ABA )
        expect( disconnected.previousInTree() ).to.equal( undefined )
        expect( dA.previousInTree() ).to.equal( disconnected )
        // Do a pre-order traversal of both structures and verify it's the same
        // order as shown above.  Then try this on some subtrees, varying the
        // value of the parameter to stay within that subtree, or not.
        expect( root.preOrderTraversal() ).to.eql( [ root, A, AA, AB, ABA, B ] )
        expect( disconnected.preOrderTraversal() ).to.eql( [ disconnected, dA ] )
        expect( AB.preOrderTraversal() ).to.eql( [ AB, ABA ] )
        expect( AB.preOrderTraversal( true ) ).to.eql( [ AB, ABA ] )
        expect( AB.preOrderTraversal( false ) ).to.eql( [ AB, ABA, B ] )
        expect( A.preOrderTraversal() ).to.eql( [ A, AA, AB, ABA ] )
        expect( A.preOrderTraversal( true ) ).to.eql( [ A, AA, AB, ABA ] )
        expect( A.preOrderTraversal( false ) ).to.eql( [ A, AA, AB, ABA, B ] )
    } )

} )
