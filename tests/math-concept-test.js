
// We import this because it's the subject of this test suite.
import { MathConcept } from '../src/math-concept.js'

// We import these just to verify that the subclass tracking provided by
// the MathConcept module works for all of them.
import { LogicConcept } from '../src/logic-concept.js'
import { Declaration } from '../src/declaration.js'
import { Environment } from '../src/environment.js'
import { Expression } from '../src/expression.js'
import { Symbol } from '../src/symbol.js'
import { Binding } from '../src/binding.js'

// And these are needed for other tests below, such as parsing
import { Application } from '../src/application.js'

// We need the makeSpy function for convenience testing of callbacks.
import { makeSpy } from './test-utils.js'

// Test suites begin here.

describe( 'MathConcept module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( MathConcept ).to.be.ok
        expect( MathConcept.subclasses ).to.be.ok
        expect( MathConcept.addSubclass ).to.be.ok
        expect( MathConcept.className ).to.be.ok
        expect( MathConcept.fromJSON ).to.be.ok
        expect( MathConcept.IDs ).to.be.ok
        expect( MathConcept.instanceWithID ).to.be.ok
        expect( MathConcept.feedback ).to.be.ok
    } )

} )

describe( 'MathConcept construction', () => {

    it( 'MathConcept objects can be built with constructors', () => {
        // Make a small MathConcept and name each node.
        // This alsoo verifies that no error occurs.
        let A, AA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept
            ),
            B = new MathConcept
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

    it( 'MathConcept constructor ignores invalid child parameters', () => {
        // Make a similar small MathConcept hierarchy to the one in the previous test,
        // but add a few erroneous items.
        let A, AA, AB, B
        const root = new MathConcept(
            7,
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept,
                'This is not a MathConcept'
            ),
            /regular expression/,
            B = new MathConcept
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

    it( 'MathConcept constructor should prevent cyclic hierarchies', () => {
        // Create a single MathConcept and try to make it a child of itself.  This should
        // fail, leaving the MathConcept in its original state.
        let C, D
        let A = new MathConcept
        A.insertChild( A )
        expect( A.parent() ).to.equal( null )
        expect( A.children() ).to.eql( [ ] )

        // Create another MathConcept B and insert it as a child of A.  Then try to insert A
        // as a child of B.  This should succeed, but should have removed B from being
        // a child of A, so that the structure remains acyclic.
        let B = new MathConcept
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

        // The same test should succeed if we do it with a MathConcept with several nodes
        // rather than just two.
        A = new MathConcept(
            B = new MathConcept,
            C = new MathConcept(
                D = new MathConcept
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

describe( 'MathConcept manipulation', () => {

    it( 'Supports removing MathConcepts from parents', () => {
        // Make the same small MathConcept hierarchy as in the previous test.
        let A, AA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept
            ),
            B = new MathConcept
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

    it( 'Supports removing child MathConcepts', () => {
        // Make the same small MathConcept hierarchy as in the previous test.
        let A, AA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept
            ),
            B = new MathConcept
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

    it( 'Supports inserting MathConcepts', () => {
        // Make the same small MathConcept hierarchy as in the previous test.
        let A, AA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept
            ),
            B = new MathConcept
        )
        
        // Add a new child of the root and verify that the structure is as expected.
        const C = new MathConcept
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
        const D = new MathConcept
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

    it( 'Ssupports replacing MathConcepts', () => {

        // Make the same small MathConcept hierarchy as in the previous test.
        let A, AA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept
            ),
            B = new MathConcept
        )

        // Replace one child of the root with a new MathConcept and verify that all comes
        // out as expected.
        const C = new MathConcept
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
        // Make a set of MathConcepts that we will build into a hierarchy.
        const root = new MathConcept
        const A = new MathConcept
        const AA = new MathConcept
        const AB  = new MathConcept
        const B = new MathConcept
   
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
        // Make a set of MathConcepts that we will build into a hierarchy.
        const root = new MathConcept
        const A = new MathConcept
        const AA = new MathConcept
        const AB  = new MathConcept
        const B = new MathConcept
   
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

describe( 'Events for changes to MathConcept instances', () => {

    // I'm rollying my own spy functions, because chai's are annoying to use in
    // the browser.
    const makeSpy = () => {
        const result = ( ...args ) => result.callRecord.push( args )
        result.callRecord = [ ]
        return result
    }

    // Set up two MathConcepts with lots of event listeners before each test.
    let A = null
    let B = null
    let ALs = [ ]
    let BLs = [ ]
    beforeEach( () => {
        A = new MathConcept
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
        B = new MathConcept
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

describe( 'MathConcept lookup', () => {

    it( 'Correctly computes indices in parent MathConcept', () => {
        // Make the same small MathConcept hierarchy as in an earlier test.
        let A, AA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept
            ),
            B = new MathConcept
        )

        // Check the index in parent of each node.
        expect( root.indexInParent() ).to.equal( undefined )
        expect( A.indexInParent() ).to.equal( 0 )
        expect( AA.indexInParent() ).to.equal( 0 )
        expect( AB.indexInParent() ).to.equal( 1 )
        expect( B.indexInParent() ).to.equal( 1 )
    } )

    it( 'Correctly computes [all but] first/last child', () => {
        // Make a similar small MathConcept hierarchy as in earlier tests.
        let A, AA, AAA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept(
                    AAA = new MathConcept
                ),
                AB = new MathConcept
            ),
            B = new MathConcept
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
        // Make a similar small MathConcept hierarchy as in earlier tests.
        let A, AA, AAA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept(
                    AAA = new MathConcept
                ),
                AB = new MathConcept
            ),
            B = new MathConcept
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
        // Make a similar small MathConcept hierarchy as in earlier tests.
        let A, AA, AAA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept(
                    AAA = new MathConcept
                ),
                AB = new MathConcept
            ),
            B = new MathConcept
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

describe( 'MathConcept predicate functions', () => {

    it( 'Correctly finds children/descendants satisfying a predicate', () => {
        // Make a similar small MathConcept hierarchy as in earlier tests,
        // but then give each MathConcept a name, to help with testing.
        let A, AA, AAA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept(
                    AAA = new MathConcept
                ),
                AB = new MathConcept
            ),
            B = new MathConcept
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
        // Make a similar small MathConcept hierarchy as in earlier tests,
        // but then give each MathConcept a name, to help with testing.
        let A, AA, AAA, AB, B
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept(
                    AAA = new MathConcept
                ),
                AB = new MathConcept
            ),
            B = new MathConcept
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

describe( 'MathConcept order relations', () => {

    it( 'correctly judges when one MathConcept is earlier than another', () => {
        // Make some MathConcept hierarchies we can use for testing "earlier than"
        let A, AA, AB, ABA, B, dA
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept(
                    ABA = new MathConcept
                )
            ),
            B = new MathConcept
        )
        const disconnected = new MathConcept(
            dA = new MathConcept
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
        // isEarlierThan() returns undefined if passed a non-MathConcept
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
        // Re-use the MathConcept hierarchies from the previous test
        let A, AA, AB, ABA, B, dA
        const root = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept(
                    ABA = new MathConcept
                )
            ),
            B = new MathConcept
        )
        const disconnected = new MathConcept(
            dA = new MathConcept
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
        // Do a pre-order traversal of both MathConcepts and verify it's the same
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

    it( 'computes accessibility and scope correctly', () => {
        // Create a new hierarchy for testing
        let A, B, C, D, BA, BB, DA, DB, DAA
        const root = new MathConcept(
            A = new MathConcept,
            B = new MathConcept(
                BA = new MathConcept,
                BB = new MathConcept
            ),
            C = new MathConcept,
            D = new MathConcept(
                DA = new MathConcept(
                    DAA = new MathConcept
                ),
                DB = new MathConcept
            )
        )
        // Verify that reflexivity is false for accessibility by default
        expect( root.isAccessibleTo( root ) ).to.equal( false )
        expect( C.isAccessibleTo( C ) ).to.equal( false )
        expect( DA.isAccessibleTo( DA ) ).to.equal( false )
        // Verify that we can change that with the reflexivity flag
        expect( root.isAccessibleTo( root, true ) ).to.equal( true )
        expect( C.isAccessibleTo( C, true ) ).to.equal( true )
        expect( DA.isAccessibleTo( DA, true ) ).to.equal( true )
        // Check a smattering of the 100 possible isAccessibleTo() checks
        expect( root.isAccessibleTo( A ) ).to.equal( false )
        expect( root.isAccessibleTo( BA ) ).to.equal( false )
        expect( root.isAccessibleTo( DAA ) ).to.equal( false )
        expect( A.isAccessibleTo( root ) ).to.equal( false )
        expect( A.isAccessibleTo( B ) ).to.equal( true )
        expect( A.isAccessibleTo( BB ) ).to.equal( true )
        expect( A.isAccessibleTo( DAA ) ).to.equal( true )
        expect( BA.isAccessibleTo( B ) ).to.equal( false )
        expect( BA.isAccessibleTo( BB ) ).to.equal( true )
        expect( BA.isAccessibleTo( C ) ).to.equal( false )
        expect( BA.isAccessibleTo( DA ) ).to.equal( false )
        expect( BB.isAccessibleTo( C ) ).to.equal( false )
        expect( C.isAccessibleTo( B ) ).to.equal( false )
        expect( C.isAccessibleTo( BB ) ).to.equal( false )
        expect( C.isAccessibleTo( D ) ).to.equal( true )
        expect( C.isAccessibleTo( DB ) ).to.equal( true )
        expect( D.isAccessibleTo( DA ) ).to.equal( false )
        expect( D.isAccessibleTo( DAA ) ).to.equal( false )
        expect( DA.isAccessibleTo( DB ) ).to.equal( true )
        expect( DAA.isAccessibleTo( DB ) ).to.equal( false )
        // Verify that reflexivity is true for in-the-scope-of by default
        expect( root.isInTheScopeOf( root ) ).to.equal( true )
        expect( C.isInTheScopeOf( C ) ).to.equal( true )
        expect( DA.isInTheScopeOf( DA ) ).to.equal( true )
        // Verify that we can change that with the reflexivity flag
        expect( root.isInTheScopeOf( root, false ) ).to.equal( false )
        expect( C.isInTheScopeOf( C, false ) ).to.equal( false )
        expect( DA.isInTheScopeOf( DA, false ) ).to.equal( false )
        // Check the same sample of pairs as for accessibility, just swapping
        // the parameters and verifying the result is the same
        expect( A.isInTheScopeOf( root ) ).to.equal( false )
        expect( BA.isInTheScopeOf( root ) ).to.equal( false )
        expect( DAA.isInTheScopeOf( root ) ).to.equal( false )
        expect( root.isInTheScopeOf( A ) ).to.equal( false )
        expect( B.isInTheScopeOf( A ) ).to.equal( true )
        expect( BB.isInTheScopeOf( A ) ).to.equal( true )
        expect( DAA.isInTheScopeOf( A ) ).to.equal( true )
        expect( B.isInTheScopeOf( BA ) ).to.equal( false )
        expect( BB.isInTheScopeOf( BA ) ).to.equal( true )
        expect( C.isInTheScopeOf( BA ) ).to.equal( false )
        expect( DA.isInTheScopeOf( BA ) ).to.equal( false )
        expect( C.isInTheScopeOf( BB ) ).to.equal( false )
        expect( B.isInTheScopeOf( C ) ).to.equal( false )
        expect( BB.isInTheScopeOf( C ) ).to.equal( false )
        expect( D.isInTheScopeOf( C ) ).to.equal( true )
        expect( DB.isInTheScopeOf( C ) ).to.equal( true )
        expect( DA.isInTheScopeOf( D ) ).to.equal( false )
        expect( DAA.isInTheScopeOf( D ) ).to.equal( false )
        expect( DB.isInTheScopeOf( DA ) ).to.equal( true )
        expect( DB.isInTheScopeOf( DAA ) ).to.equal( false )
    } )

    it( 'iterates over accessibility and scope correctly', () => {
        // Create a the same hierarchy for testing as in the previous test
        let A, B, C, D, BA, BB, DA, DB, DAA
        const root = new MathConcept(
            A = new MathConcept,
            B = new MathConcept(
                BA = new MathConcept,
                BB = new MathConcept
            ),
            C = new MathConcept,
            D = new MathConcept(
                DA = new MathConcept(
                    DAA = new MathConcept
                ),
                DB = new MathConcept
            )
        )
        // Verify accessibles lists for all MathConcepts, without reflexivity
        expect( root.accessibles() ).to.eql( [ ] )
        expect( A.accessibles() ).to.eql( [ ] )
        expect( B.accessibles() ).to.eql( [ A ] )
        expect( C.accessibles() ).to.eql( [ B, A ] )
        expect( D.accessibles() ).to.eql( [ C, B, A ] )
        expect( BA.accessibles() ).to.eql( [ A ] )
        expect( BB.accessibles() ).to.eql( [ BA, A ] )
        expect( DA.accessibles() ).to.eql( [ C, B, A ] )
        expect( DB.accessibles() ).to.eql( [ DA, C, B, A ] )
        expect( DAA.accessibles() ).to.eql( [ C, B, A ] )
        // Repeat previous experiment, now with reflexivity
        expect( root.accessibles( true ) ).to.eql( [ root ] )
        expect( A.accessibles( true ) ).to.eql( [ A ] )
        expect( B.accessibles( true ) ).to.eql( [ B, A ] )
        expect( C.accessibles( true ) ).to.eql( [ C, B, A ] )
        expect( D.accessibles( true ) ).to.eql( [ D, C, B, A ] )
        expect( BA.accessibles( true ) ).to.eql( [ BA, A ] )
        expect( BB.accessibles( true ) ).to.eql( [ BB, BA, A ] )
        expect( DA.accessibles( true ) ).to.eql( [ DA, C, B, A ] )
        expect( DB.accessibles( true ) ).to.eql( [ DB, DA, C, B, A ] )
        expect( DAA.accessibles( true ) ).to.eql( [ DAA, C, B, A ] )
        // Verify scope lists for all MathConcepts, without reflexivity
        expect( root.scope() ).to.eql( [ root ] )
        expect( A.scope() ).to.eql( [ A, B, BA, BB, C, D, DA, DAA, DB ] )
        expect( B.scope() ).to.eql( [ B, C, D, DA, DAA, DB ] )
        expect( C.scope() ).to.eql( [ C, D, DA, DAA, DB ] )
        expect( D.scope() ).to.eql( [ D ] )
        expect( BA.scope() ).to.eql( [ BA, BB ] )
        expect( BB.scope() ).to.eql( [ BB ] )
        expect( DA.scope() ).to.eql( [ DA, DB ] )
        expect( DB.scope() ).to.eql( [ DB ] )
        expect( DAA.scope() ).to.eql( [ DAA ] )
        // Repeat previous experiment, now with reflexivity
        expect( root.scope( false ) ).to.eql( [ ] )
        expect( A.scope( false ) ).to.eql( [ B, BA, BB, C, D, DA, DAA, DB ] )
        expect( B.scope( false ) ).to.eql( [ C, D, DA, DAA, DB ] )
        expect( C.scope( false ) ).to.eql( [ D, DA, DAA, DB ] )
        expect( D.scope( false ) ).to.eql( [ ] )
        expect( BA.scope( false ) ).to.eql( [ BB ] )
        expect( BB.scope( false ) ).to.eql( [ ] )
        expect( DA.scope( false ) ).to.eql( [ DB ] )
        expect( DB.scope( false ) ).to.eql( [ ] )
        expect( DAA.scope( false ) ).to.eql( [ ] )
    } )

} )

describe( 'MathConcept attributes', () => {

    it( 'Are empty to begin with', () => {
        // create a few MathConcepts on which we can set attributes
        const S1 = new MathConcept
        const S2 = new MathConcept
        const S3 = new MathConcept( S2 )
        // ensure that all three have no attribute keys
        expect( S1.getAttributeKeys() ).to.eql( [ ] )
        expect( S2.getAttributeKeys() ).to.eql( [ ] )
        expect( S3.getAttributeKeys() ).to.eql( [ ] )
        expect( S1.hasAttribute( 'x' ) ).to.equal( false )
        expect( S1.hasAttribute( '100' ) ).to.equal( false )
        expect( S1.hasAttribute( -8 ) ).to.equal( false )
        expect( S2.hasAttribute( 'x' ) ).to.equal( false )
        expect( S2.hasAttribute( '100' ) ).to.equal( false )
        expect( S2.hasAttribute( -8 ) ).to.equal( false )
        expect( S3.hasAttribute( 'x' ) ).to.equal( false )
        expect( S3.hasAttribute( '100' ) ).to.equal( false )
        expect( S3.hasAttribute( -8 ) ).to.equal( false )
        // fetch attributes and ensure we get undefined each time
        expect( S1.getAttribute( 'x' ) ).to.equal( undefined )
        expect( S1.getAttribute( '100' ) ).to.equal( undefined )
        expect( S1.getAttribute( -8 ) ).to.equal( undefined )
        expect( S2.getAttribute( 'x' ) ).to.equal( undefined )
        expect( S2.getAttribute( '100' ) ).to.equal( undefined )
        expect( S2.getAttribute( -8 ) ).to.equal( undefined )
        expect( S3.getAttribute( 'x' ) ).to.equal( undefined )
        expect( S3.getAttribute( '100' ) ).to.equal( undefined )
        expect( S3.getAttribute( -8 ) ).to.equal( undefined )
        // repeat that experiment, but this time, providing a default, and
        // ensuring that the default is returned, because the attribute does
        // not exist
        expect( S1.getAttribute( 'x', 'DEF' ) ).to.equal( 'DEF' )
        expect( S1.getAttribute( '100', 'DEF' ) ).to.equal( 'DEF' )
        expect( S1.getAttribute( -8, 'DEF' ) ).to.equal( 'DEF' )
        expect( S2.getAttribute( 'x', 'DEF' ) ).to.equal( 'DEF' )
        expect( S2.getAttribute( '100', 'DEF' ) ).to.equal( 'DEF' )
        expect( S2.getAttribute( -8, 'DEF' ) ).to.equal( 'DEF' )
        expect( S3.getAttribute( 'x', 'DEF' ) ).to.equal( 'DEF' )
        expect( S3.getAttribute( '100', 'DEF' ) ).to.equal( 'DEF' )
        expect( S3.getAttribute( -8, 'DEF' ) ).to.equal( 'DEF' )
    } )

    it( 'Can be set and gotten in the expected ways', () => {
        // create a few MathConcepts on which we can set attributes
        const S1 = new MathConcept
        const S2 = new MathConcept
        const S3 = new MathConcept( S2 )
        // set some attributes
        S1.setAttribute( 'ess one key', 'ess one value' )
        S2.setAttribute( 5000000, { some: 'JSON', here: [1,2,3,4,5] } )
        S2.setAttribute( 'second', [ 'At', 'rib', 'yout\'' ] )
        // verify that the keys you've added exist
        expect( S1.getAttributeKeys() ).to.eql( [ 'ess one key' ] )
        expect( S2.getAttributeKeys().length ).to.equal( 2 )
        expect( S2.getAttributeKeys().includes( '5000000' ) ).to.equal( true )
        expect( S2.getAttributeKeys().includes( 'second' ) ).to.equal( true )
        expect( S3.getAttributeKeys() ).to.eql( [ ] )
        expect( S1.hasAttribute( 'ess one key' ) ).to.equal( true )
        expect( S2.hasAttribute( 5000000 ) ).to.equal( true )
        expect( S2.hasAttribute( 'second' ) ).to.equal( true )
        // query those attributes, verify the right values come out
        expect( S1.getAttribute( 'ess one key' ) ).to.equal( 'ess one value' )
        expect( S2.getAttribute( 5000000 ) ).to.eql(
            { some: 'JSON', here: [1,2,3,4,5] } )
        expect( S2.getAttribute( 'second' ) ).to.eql(
            [ 'At', 'rib', 'yout\'' ] )
        // repeat that, with default values supplied, and verify that this is
        // not relevant; default values are ignored because the attributes exist
        expect( S1.getAttribute( 'ess one key', 'DEF' ) ).to.equal(
            'ess one value' )
        expect( S2.getAttribute( 5000000, 'DEF' ) ).to.eql(
            { some: 'JSON', here: [1,2,3,4,5] } )
        expect( S2.getAttribute( 'second', 'DEF' ) ).to.eql(
            [ 'At', 'rib', 'yout\'' ] )
        // verify that querying the right keys on the wrong MathConcepts yields
        // undefined in each case
        expect( S1.getAttribute( 5000000 ) ).to.equal( undefined )
        expect( S3.getAttribute( 5000000 ) ).to.equal( undefined )
        expect( S1.getAttribute( 'second' ) ).to.equal( undefined )
        expect( S3.getAttribute( 'second' ) ).to.equal( undefined )
        expect( S2.getAttribute( 'ess one key' ) ).to.equal( undefined )
        expect( S3.getAttribute( 'ess one key' ) ).to.equal( undefined )
        // repeat the queries from the previous test, for attributes that don't
        // exist, and verify that the results are the same
        expect( S1.getAttribute( 'x' ) ).to.equal( undefined )
        expect( S1.getAttribute( '100' ) ).to.equal( undefined )
        expect( S1.getAttribute( -8 ) ).to.equal( undefined )
        expect( S2.getAttribute( 'x' ) ).to.equal( undefined )
        expect( S2.getAttribute( '100' ) ).to.equal( undefined )
        expect( S2.getAttribute( -8 ) ).to.equal( undefined )
        expect( S3.getAttribute( 'x' ) ).to.equal( undefined )
        expect( S3.getAttribute( '100' ) ).to.equal( undefined )
        expect( S3.getAttribute( -8 ) ).to.equal( undefined )
        expect( S1.getAttribute( 'x', 'DEF' ) ).to.equal( 'DEF' )
        expect( S1.getAttribute( '100', 'DEF' ) ).to.equal( 'DEF' )
        expect( S1.getAttribute( -8, 'DEF' ) ).to.equal( 'DEF' )
        expect( S2.getAttribute( 'x', 'DEF' ) ).to.equal( 'DEF' )
        expect( S2.getAttribute( '100', 'DEF' ) ).to.equal( 'DEF' )
        expect( S2.getAttribute( -8, 'DEF' ) ).to.equal( 'DEF' )
        expect( S3.getAttribute( 'x', 'DEF' ) ).to.equal( 'DEF' )
        expect( S3.getAttribute( '100', 'DEF' ) ).to.equal( 'DEF' )
        expect( S3.getAttribute( -8, 'DEF' ) ).to.equal( 'DEF' )
    } )

    it( 'Is a separate namespace from the MathConcept object itself', () => {
        // make a MathConcept
        const S = new MathConcept
        // verify that it, as a MathConcept object in JavaScript, has certain
        // attributes and methods present (just a sample here)
        expect( S.children ).to.be.ok
        expect( S.getAttribute ).to.be.ok
        expect( S.emit ).to.be.ok
        // verify that none of those are present in its attributes as a
        // MathConcept, i.e., with getAttribute()
        expect( S.getAttribute( 'children' ) ).not.to.be.ok
        expect( S.getAttribute( 'getAttribute' ) ).not.to.be.ok
        expect( S.getAttribute( 'emit' ) ).not.to.be.ok
    } )

    it( 'Emits events when adding/removing/changing attributes', () => {
        // make two MathConcepts
        const S1 = new MathConcept
        const S2 = new MathConcept
        // connect event handlers to each for recording events
        const heardEvents1 = [ ]
        const heardEvents2 = [ ]
        S1.addEventListener( 'willBeChanged', e => heardEvents1.push( e ) )
        S2.addEventListener( 'willBeChanged', e => heardEvents2.push( e ) )
        S1.addEventListener( 'wasChanged', e => heardEvents1.push( e ) )
        S2.addEventListener( 'wasChanged', e => heardEvents2.push( e ) )
        // verify that all requisite events are called in the right order when
        // adding an attribute
        S1.setAttribute( 'x', 'y' )
        expect( heardEvents1.length ).to.equal( 2 )
        expect( heardEvents1[0] ).to.be.instanceOf( Event )
        expect( heardEvents1[0].type ).to.equal( 'willBeChanged' )
        expect( heardEvents1[0].concept ).to.equal( S1 )
        expect( heardEvents1[0].key ).to.equal( 'x' )
        expect( heardEvents1[0].oldValue ).to.equal( undefined )
        expect( heardEvents1[0].newValue ).to.equal( 'y' )
        expect( heardEvents1[1] ).to.be.instanceOf( Event )
        expect( heardEvents1[1].type ).to.equal( 'wasChanged' )
        expect( heardEvents1[1].concept ).to.equal( S1 )
        expect( heardEvents1[1].key ).to.equal( 'x' )
        expect( heardEvents1[1].oldValue ).to.equal( undefined )
        expect( heardEvents1[1].newValue ).to.equal( 'y' )
        expect( heardEvents2.length ).to.equal( 0 )
        // verify that all requisite events are called in the right order when
        // changing an attribute
        S1.setAttribute( 'x', 'z' )
        expect( heardEvents1.length ).to.equal( 4 )
        expect( heardEvents1[2] ).to.be.instanceOf( Event )
        expect( heardEvents1[2].type ).to.equal( 'willBeChanged' )
        expect( heardEvents1[2].concept ).to.equal( S1 )
        expect( heardEvents1[2].key ).to.equal( 'x' )
        expect( heardEvents1[2].oldValue ).to.equal( 'y' )
        expect( heardEvents1[2].newValue ).to.equal( 'z' )
        expect( heardEvents1[3] ).to.be.instanceOf( Event )
        expect( heardEvents1[3].type ).to.equal( 'wasChanged' )
        expect( heardEvents1[3].concept ).to.equal( S1 )
        expect( heardEvents1[3].key ).to.equal( 'x' )
        expect( heardEvents1[3].oldValue ).to.equal( 'y' )
        expect( heardEvents1[3].newValue ).to.equal( 'z' )
        expect( heardEvents2.length ).to.equal( 0 )
        // verify that all requisite events are called in the right order when
        // removing an attribute
        S1.clearAttributes( 'x' )
        expect( heardEvents1.length ).to.equal( 6 )
        expect( heardEvents1[4] ).to.be.instanceOf( Event )
        expect( heardEvents1[4].type ).to.equal( 'willBeChanged' )
        expect( heardEvents1[4].concept ).to.equal( S1 )
        expect( heardEvents1[4].key ).to.equal( 'x' )
        expect( heardEvents1[4].oldValue ).to.equal( 'z' )
        expect( heardEvents1[4].newValue ).to.equal( undefined )
        expect( heardEvents1[5] ).to.be.instanceOf( Event )
        expect( heardEvents1[5].type ).to.equal( 'wasChanged' )
        expect( heardEvents1[5].concept ).to.equal( S1 )
        expect( heardEvents1[5].key ).to.equal( 'x' )
        expect( heardEvents1[5].oldValue ).to.equal( 'z' )
        expect( heardEvents1[5].newValue ).to.equal( undefined )
        expect( heardEvents2.length ).to.equal( 0 )
        // ensure that these events happen not only in the correct order, but
        // that the first happens before the value changes and the second
        // happens after the value changes
        let before = null
        let after = null
        S2.addEventListener( 'willBeChanged',
            e => { before = S2.getAttribute( 'a' ) } )
        S2.addEventListener( 'wasChanged',
            e => { after = S2.getAttribute( 'a' ) } )
        S2.setAttribute( 'a', 'bee' )
        // (these checks are analogous to ones we've done before)
        expect( heardEvents2.length ).to.equal( 2 )
        expect( heardEvents2[0] ).to.be.instanceOf( Event )
        expect( heardEvents2[0].type ).to.equal( 'willBeChanged' )
        expect( heardEvents2[0].concept ).to.equal( S2 )
        expect( heardEvents2[0].key ).to.equal( 'a' )
        expect( heardEvents2[0].oldValue ).to.equal( undefined )
        expect( heardEvents2[0].newValue ).to.equal( 'bee' )
        expect( heardEvents2[1] ).to.be.instanceOf( Event )
        expect( heardEvents2[1].type ).to.equal( 'wasChanged' )
        expect( heardEvents2[1].concept ).to.equal( S2 )
        expect( heardEvents2[1].key ).to.equal( 'a' )
        expect( heardEvents2[1].oldValue ).to.equal( undefined )
        expect( heardEvents2[1].newValue ).to.equal( 'bee' )
        expect( heardEvents1.length ).to.equal( 6 )
        // (these final checks are the new ones about before/after the change)
        expect( before ).to.equal( undefined )
        expect( after ).to.equal( 'bee' )
    } )

    it( 'Supports adding attributes with the convenience function', () => {
        // build the same MathConcept two ways
        // first, with the convenience function:
        const copy1 = new MathConcept().attr( {
            'name' : 'Rutherford', 'age' : 50, 'occupation' : 'clerk',
            'hoursWorked' : [ 8, 7, 9, 8, 8, 9, 0, 10, 10, 8 ]
        } )
        // second, without it:
        const copy2 = new MathConcept
        copy2.setAttribute( 'name', 'Rutherford' )
        copy2.setAttribute( 'age', 50 )
        copy2.setAttribute( 'occupation', 'clerk' )
        copy2.setAttribute( 'hoursWorked', [ 8, 7, 9, 8, 8, 9, 0, 10, 10, 8 ] )
        // verify that the attributes are identical in both
        const keysToCheck = [
            'name', 'age', 'occupation', 'missing1', 'missing2'
        ]
        for( let key of keysToCheck ) {
            const value1 = copy1.getAttribute( key )
            const value2 = copy2.getAttribute( key )
            expect( JSON.equals( value1, value2 ) ).to.equal( true )
        }
    } )

    it( 'Has working convenience functions for typing/categorization ', () => {
        // build a few MathConcepts for testing
        const S1 = new MathConcept
        const S2 = new MathConcept
        const S3 = new MathConcept
        // make sure they have no types
        expect( S1.isA( 'dog' ) ).to.equal( false )
        expect( S1.isA( 'cat' ) ).to.equal( false )
        expect( S1.isA( 'rectangle' ) ).to.equal( false )
        expect( S2.isA( 'dog' ) ).to.equal( false )
        expect( S2.isA( 'cat' ) ).to.equal( false )
        expect( S2.isA( 'rectangle' ) ).to.equal( false )
        expect( S3.isA( 'dog' ) ).to.equal( false )
        expect( S3.isA( 'cat' ) ).to.equal( false )
        expect( S3.isA( 'rectangle' ) ).to.equal( false )
        // add some types to them
        S1.makeIntoA( 'dog' )
        S2.makeIntoA( 'cat' ).makeIntoA( 'rectangle' )
        // verify that they have the types we added, and no others
        expect( S1.isA( 'dog' ) ).to.equal( true )
        expect( S1.isA( 'cat' ) ).to.equal( false )
        expect( S1.isA( 'rectangle' ) ).to.equal( false )
        expect( S2.isA( 'dog' ) ).to.equal( false )
        expect( S2.isA( 'cat' ) ).to.equal( true )
        expect( S2.isA( 'rectangle' ) ).to.equal( true )
        expect( S3.isA( 'dog' ) ).to.equal( false )
        expect( S3.isA( 'cat' ) ).to.equal( false )
        expect( S3.isA( 'rectangle' ) ).to.equal( false )
        // verify that if we copy them, they take their types along
        const copy1 = S1.copy()
        const copy2 = S2.copy()
        const copy3 = S3.copy()
        expect( copy1.isA( 'dog' ) ).to.equal( true )
        expect( copy1.isA( 'cat' ) ).to.equal( false )
        expect( copy1.isA( 'rectangle' ) ).to.equal( false )
        expect( copy2.isA( 'dog' ) ).to.equal( false )
        expect( copy2.isA( 'cat' ) ).to.equal( true )
        expect( copy2.isA( 'rectangle' ) ).to.equal( true )
        expect( copy3.isA( 'dog' ) ).to.equal( false )
        expect( copy3.isA( 'cat' ) ).to.equal( false )
        expect( copy3.isA( 'rectangle' ) ).to.equal( false )
        // verify that if we remove types, they go away, unless the type wasn't
        // there in the first place
        S1.unmakeIntoA( 'dog' )
        S2.unmakeIntoA( 'dog' )
        S3.unmakeIntoA( 'dog' )
        expect( S1.isA( 'dog' ) ).to.equal( false )
        expect( S1.isA( 'cat' ) ).to.equal( false )
        expect( S1.isA( 'rectangle' ) ).to.equal( false )
        expect( S2.isA( 'dog' ) ).to.equal( false )
        expect( S2.isA( 'cat' ) ).to.equal( true )
        expect( S2.isA( 'rectangle' ) ).to.equal( true )
        expect( S3.isA( 'dog' ) ).to.equal( false )
        expect( S3.isA( 'cat' ) ).to.equal( false )
        expect( S3.isA( 'rectangle' ) ).to.equal( false )
        // Verify that such changes did not impact the copies
        expect( copy1.isA( 'dog' ) ).to.equal( true )
        expect( copy1.isA( 'cat' ) ).to.equal( false )
        expect( copy1.isA( 'rectangle' ) ).to.equal( false )
        expect( copy2.isA( 'dog' ) ).to.equal( false )
        expect( copy2.isA( 'cat' ) ).to.equal( true )
        expect( copy2.isA( 'rectangle' ) ).to.equal( true )
        expect( copy3.isA( 'dog' ) ).to.equal( false )
        expect( copy3.isA( 'cat' ) ).to.equal( false )
        expect( copy3.isA( 'rectangle' ) ).to.equal( false )
        // verify that we can make other copies and add types as we do so
        const copy4 = S1.asA( 'ghost' )
        const copy5 = S2.asA( 'pokemon' )
        expect( copy4.isA( 'dog' ) ).to.equal( false )
        expect( copy4.isA( 'cat' ) ).to.equal( false )
        expect( copy4.isA( 'rectangle' ) ).to.equal( false )
        expect( copy4.isA( 'ghost' ) ).to.equal( true )
        expect( copy4.isA( 'pokemon' ) ).to.equal( false )
        expect( copy5.isA( 'dog' ) ).to.equal( false )
        expect( copy5.isA( 'cat' ) ).to.equal( true )
        expect( copy5.isA( 'rectangle' ) ).to.equal( true )
        expect( copy5.isA( 'ghost' ) ).to.equal( false )
        expect( copy5.isA( 'pokemon' ) ).to.equal( true )
        // and that did not mess up the originals
        expect( S1.isA( 'dog' ) ).to.equal( false )
        expect( S1.isA( 'cat' ) ).to.equal( false )
        expect( S1.isA( 'rectangle' ) ).to.equal( false )
        expect( S2.isA( 'dog' ) ).to.equal( false )
        expect( S2.isA( 'cat' ) ).to.equal( true )
        expect( S2.isA( 'rectangle' ) ).to.equal( true )
    } )

} )

describe( 'MathConcept copying and serialization', () => {

    it( 'Associates class names with class objects', () => {
        // Check not just the MathConcept class, but several others.
        // Can't put these tests in those subclasses' test suites,
        // because we're testing here the MathConcept class's support
        // for all of this.
        expect( MathConcept.className ).to.equal( 'MathConcept' )
        expect( MathConcept.subclasses.get( 'MathConcept' ) ).to.equal( MathConcept )
        expect( LogicConcept.className ).to.equal( 'LogicConcept' )
        expect( MathConcept.subclasses.get( 'LogicConcept' ) ).to.equal( LogicConcept )
        expect( Declaration.className ).to.equal( 'Declaration' )
        expect( MathConcept.subclasses.get( 'Declaration' ) ).to.equal( Declaration )
        expect( Environment.className ).to.equal( 'Environment' )
        expect( MathConcept.subclasses.get( 'Environment' ) ).to.equal( Environment )
        expect( Expression.className ).to.equal( 'Expression' )
        expect( MathConcept.subclasses.get( 'Expression' ) ).to.equal( Expression )
    } )

    it( 'Supports deep copying of MathConcepts', () => {
        // Make a tiny MathConcept for testing.
        const tiny = new MathConcept
        tiny.setAttribute( 5, 6 )
        // Make a copy and test that it copied correctly and did not mess up
        // the original.
        const C = tiny.copy()
        expect( C ).not.to.equal( tiny )
        expect( C.parent() ).to.equal( null )
        expect( C.children() ).to.eql( [ ] )
        expect( C.getAttribute( 5 ) ).to.equal( 6 )
        expect( C.getAttribute( 6 ) ).to.equal( undefined )
        expect( tiny.parent() ).to.equal( null )
        expect( tiny.children() ).to.eql( [ ] )
        expect( tiny.getAttribute( 5 ) ).to.equal( 6 )
        expect( tiny.getAttributeKeys() ).to.eql( [ '5' ] )
        expect( tiny.hasAttribute( 5 ) ).to.equal( true )
        // Ensure that changing data within the original doesn't change the copy.
        tiny.setAttribute( 5, 10 )
        expect( tiny.getAttribute( 5 ) ).to.equal( 10 )
        expect( C.getAttribute( 5 ) ).to.equal( 6 )
        // Make a more complex MathConcept for testing.
        let A, AA, AB, AC, B
        const tween = new MathConcept(
            A = new MathConcept(
                AA = new MathConcept,
                AB = new MathConcept,
                AC = new MathConcept
            ),
            B = new MathConcept
        )
        AB.setAttribute( 2, 7 )
        // Make a copy of tween and test that it copied correctly and did not
        // mess up the original.
        const D = tween.copy()
        expect( D ).not.to.equal( tween )
        expect( D.children().length ).to.equal( 2 )
        const DA = D.child( 0 )
        expect( D.parent() ).to.equal( null )
        expect( A.parent() ).not.to.equal( D )
        expect( B.parent() ).not.to.equal( D )
        expect( A.parent() ).to.equal( tween )
        expect( B.parent() ).to.equal( tween )
        expect( DA.parent() ).to.equal( D )
        expect( DA.children().length ).to.equal( 3 )
        const DAB = DA.child( 1 )
        expect( DAB ).not.to.equal( AB )
        expect( DAB.getAttribute( 2 ) ).to.equal( 7 )
        const DB = D.child( 1 )
        expect( DB.getAttributeKeys() ).to.eql( [ ] )
        // Ensure that changing data within the original doesn't change the copy.
        tween.setAttribute( 3, 8 )
        expect( tween.getAttribute( 3 ) ).to.equal( 8 )
        expect( DB.getAttributeKeys() ).to.eql( [ ] )
        AB.setAttribute( 2, 9 )
        expect( AB.getAttribute( 2 ) ).to.equal( 9 )
        expect( DAB.getAttribute( 2 ) ).to.equal( 7 )
    } )

    it( 'Serializes and deserializes hierarchies correctly', () => {
        // Begin with a trivial example, a single node hierarchy with no attributes.
        let child1, child2
        const loner = new MathConcept
        let json = loner.toJSON()
        expect( json ).not.to.be.instanceOf( MathConcept )
        expect( json ).not.to.equal( loner )
        expect( json.className ).to.equal( 'MathConcept' )
        expect( json.attributes ).to.eql( [ ] )
        expect( json.children ).to.eql( [ ] )
        // Deserialize a copy from it and verify that it is correctly structured.
        let copy = MathConcept.fromJSON( json )
        expect( copy ).to.be.instanceOf( MathConcept )
        expect( copy.getAttributeKeys() ).to.eql( [ ] )
        expect( copy.attributes ).not.to.equal( json.attributes)
        expect( copy.children() ).to.eql( [ ] )
        expect( copy.parent() ).to.equal( null )
        expect( copy ).not.to.equal( json )
        expect( copy ).not.to.equal( loner )
        // Now do another one-node example, but this one with some attributes of
        // each type.
        const atty = new MathConcept
        atty.setAttribute( 1, 2 )
        atty.setAttribute( 'three', [ 'four', { } ] )
        json = atty.toJSON()
        expect( json ).not.to.be.instanceOf( MathConcept )
        expect( json ).not.to.equal( atty )
        expect( json.className ).to.equal( 'MathConcept' )
        expect( json.attributes ).to.be.instanceOf( Array )
        expect( json.attributes.length ).to.equal( 2 )
        let indexOf1 = json.attributes[0][0] == 1 ? 0 : 1
        expect( json.attributes[indexOf1] ).to.eql( [ '1', 2 ] )
        expect( json.attributes[1-indexOf1] ).to.eql(
            [ 'three', [ 'four', { } ] ] )
        expect( json.children ).to.eql( [ ] )
        // Deserialize a copy from it and verify that it is correctly structured.
        copy = MathConcept.fromJSON( json )
        expect( copy ).to.be.instanceOf( MathConcept )
        expect( copy.getAttributeKeys().length ).to.equal( 2 )
        expect( copy.hasAttribute( 1 ) ).to.equal( true )
        expect( copy.hasAttribute( 'three' ) ).to.equal( true )
        expect( copy.getAttribute( 1 ) ).to.equal( 2 )
        expect( copy.getAttribute( 'three' ) ).to.eql( [ 'four', { } ] )
        expect( copy.getAttribute( 'three' ) ).not.to.equal(
            atty.getAttribute( 'three' ) )
        expect( copy.children() ).to.eql( [ ] )
        expect( copy.parent() ).to.equal( null )
        expect( copy ).not.to.equal( json )
        expect( copy ).not.to.equal( atty )
        // Now define two silly little subclasses of `MathConcept` for use in just
        // the next test.
        class Sub1 extends MathConcept {
            static className = MathConcept.addSubclass( 'Sub1', Sub1 )
            exampleMethod1 () { return 5 }
        }
        class Sub2 extends MathConcept {
            static className = MathConcept.addSubclass( 'Sub2', Sub2 )
            exampleMethod2() { return this.getAttribute( 'test' ) }
        }
        // Now create a hierarchy with three MathConcepts in it, one of each of the
        // three classes MathConcept, Sub1, and Sub2.
        const bigger = new MathConcept(
            child1 = new Sub1().attr( { 10 : 100 } ),
            child2 = new Sub2().attr( { 'test' : 'ing' } )
        )
        // Verify that the children are of the expected classes.
        expect( child1 ).to.be.instanceOf( Sub1 )
        expect( child1.exampleMethod1 ).to.be.ok
        expect( child2 ).to.be.instanceOf( Sub2 )
        expect( child2.exampleMethod2 ).to.be.ok
        // Serialize and verify that it came out correctly.
        json = bigger.toJSON()
        expect( json ).not.to.be.instanceOf( MathConcept )
        expect( json ).not.to.equal( bigger )
        expect( json.className ).to.equal( 'MathConcept' )
        expect( json.attributes ).to.eql( [ ] )
        expect( json.children.length ).to.equal( 2 )
        let child = json.children[0]
        expect( child ).not.to.be.instanceOf( MathConcept )
        expect( child ).not.to.be.instanceOf( Sub1 )
        expect( child.className ).to.equal( 'Sub1' )
        expect( child.attributes ).to.eql( [ [ '10', 100 ] ] )
        expect( child.children ).to.eql( [ ] )
        expect( child.exampleMethod1 ).to.equal( undefined )
        child = json.children[1]
        expect( child ).not.to.be.instanceOf( MathConcept )
        expect( child ).not.to.be.instanceOf( Sub2 )
        expect( child.className ).to.equal( 'Sub2' )
        expect( child.attributes ).to.eql( [ [ 'test', 'ing' ] ] )
        expect( child.children ).to.eql( [ ] )
        expect( child.exampleMethod2 ).to.equal( undefined )
        // Deserialize and verify that each node is the same class as in the
        // original hierarchy, as well as all the same tests we did for the
        // earlier cases.
        copy = MathConcept.fromJSON( json )
        expect( copy ).to.be.instanceOf( MathConcept )
        expect( copy.getAttributeKeys() ).to.eql( [ ] )
        expect( copy.parent() ).to.equal( null )
        expect( copy ).not.to.equal( json )
        expect( copy ).not.to.equal( bigger )
        expect( copy.children().length ).to.equal( 2 )
        child = copy.children()[0]
        expect( child ).to.be.instanceOf( Sub1 )
        expect( child.getAttributeKeys() ).to.eql( [ '10' ] )
        expect( child.getAttribute( '10' ) ).to.equal( 100 )
        expect( child.parent() ).to.equal( copy )
        expect( child ).not.to.equal( json.children[0] )
        expect( child ).not.to.equal( child1 )
        expect( child.children() ).to.eql( [ ] )
        child = copy.children()[1]
        expect( child ).to.be.instanceOf( Sub2 )
        expect( child.getAttributeKeys() ).to.eql( [ 'test' ] )
        expect( child.getAttribute( 'test' ) ).to.equal( 'ing' )
        expect( child.parent() ).to.equal( copy )
        expect( child ).not.to.equal( json.children[1] )
        expect( child ).not.to.equal( child2 )
        expect( child.children() ).to.eql( [ ] )
    } )

    it( 'Respects the includeIDs parameter when serializing', () => {
        // create a small hierarchy with some IDs
        const B1 = new MathConcept()
        const B2 = new MathConcept()
        const A = new MathConcept( B1, B2 )
        A.setID( 'aardvark' )
        B1.setID( 'beetle' )
        B2.setID( 'bear' )
        // ensure that serializing and deserializing includes IDs
        const json = A.toJSON()
        expect( json.attributes ).not.to.eql( [ ] )
        const copy = MathConcept.fromJSON( json )
        expect( copy.ID() ).to.equal( 'aardvark' )
        expect( copy.child( 0 ).ID() ).to.equal( 'beetle' )
        expect( copy.child( 1 ).ID() ).to.equal( 'bear' )
        // a request not to include IDs should be obeyed
        const json2 = A.toJSON( false )
        expect( json2.attributes ).to.eql( [ ] )
        const copy2 = MathConcept.fromJSON( json2 )
        expect( copy2.ID() ).to.equal( undefined )
        expect( copy2.child( 0 ).ID() ).to.equal( undefined )
        expect( copy2.child( 1 ).ID() ).to.equal( undefined )
    } )

    it( 'Supports deep equality comparisons correctly', () => {
        // Create four MathConcepts for testing
        const S1 = new MathConcept(
            new MathConcept,
            new MathConcept().attr( { 'x' : 'y' } )
        )
        const S2 = new MathConcept(
            new MathConcept,
            new MathConcept().attr( { 'x' : 'y' } )
        )
        const S3 = new MathConcept(
            new MathConcept().attr( { 1 : 2 } ),
            new MathConcept
        )
        const S4 = new MathConcept(
            new MathConcept
        )
        const S5 = new MathConcept(
            new LogicConcept
        )
        // Verify that only these structural equalities hold:  each MathConcept
        // with itself, plus S1 with S2 (nothing else)
        expect( S1.equals( S1 ) ).to.equal( true )
        expect( S1.equals( S2 ) ).to.equal( true )
        expect( S1.equals( S3 ) ).to.equal( false )
        expect( S1.equals( S4 ) ).to.equal( false )
        expect( S1.equals( S5 ) ).to.equal( false )
        expect( S2.equals( S1 ) ).to.equal( true )
        expect( S2.equals( S2 ) ).to.equal( true )
        expect( S2.equals( S3 ) ).to.equal( false )
        expect( S2.equals( S4 ) ).to.equal( false )
        expect( S2.equals( S5 ) ).to.equal( false )
        expect( S3.equals( S1 ) ).to.equal( false )
        expect( S3.equals( S2 ) ).to.equal( false )
        expect( S3.equals( S3 ) ).to.equal( true )
        expect( S3.equals( S4 ) ).to.equal( false )
        expect( S3.equals( S5 ) ).to.equal( false )
        expect( S4.equals( S1 ) ).to.equal( false )
        expect( S4.equals( S2 ) ).to.equal( false )
        expect( S4.equals( S3 ) ).to.equal( false )
        expect( S4.equals( S4 ) ).to.equal( true )
        expect( S4.equals( S5 ) ).to.equal( false )
        expect( S5.equals( S1 ) ).to.equal( false )
        expect( S5.equals( S2 ) ).to.equal( false )
        expect( S5.equals( S3 ) ).to.equal( false )
        expect( S5.equals( S4 ) ).to.equal( false )
        expect( S5.equals( S5 ) ).to.equal( true )
        // Edit MathConcept S2 so that it is no longer like S1, and
        // edit MathConcept S3 so that it becomes like S1.
        S2.setAttribute( 'new', 'attribute' )
        S3.child( 0 ).clearAttributes( 1 )
        S3.child( 1 ).setAttribute( 'x', 'y' )
        // Verify that only these structural equalities hold:  each MathConcept
        // with itself, plus S1 with S3 (nothing else)
        expect( S1.equals( S1 ) ).to.equal( true )
        expect( S1.equals( S2 ) ).to.equal( false )
        expect( S1.equals( S3 ) ).to.equal( true )
        expect( S1.equals( S4 ) ).to.equal( false )
        expect( S2.equals( S1 ) ).to.equal( false )
        expect( S2.equals( S2 ) ).to.equal( true )
        expect( S2.equals( S3 ) ).to.equal( false )
        expect( S2.equals( S4 ) ).to.equal( false )
        expect( S3.equals( S1 ) ).to.equal( true )
        expect( S3.equals( S2 ) ).to.equal( false )
        expect( S3.equals( S3 ) ).to.equal( true )
        expect( S3.equals( S4 ) ).to.equal( false )
        expect( S4.equals( S1 ) ).to.equal( false )
        expect( S4.equals( S2 ) ).to.equal( false )
        expect( S4.equals( S3 ) ).to.equal( false )
        expect( S4.equals( S4 ) ).to.equal( true )
    } )

    it( 'Does a simple toString() representation as S-expressions', () => {
        // make some stuff to ask for the string representation of
        const Sx = new MathConcept
        const Sy = new MathConcept
        const SP = new MathConcept
        const Splus = new MathConcept
        const Slog = new MathConcept
        const Ssum = new MathConcept( Splus, Sx, Sy )
        const Sexpr = new MathConcept( Slog, new MathConcept( SP, Sx.copy(), Sy.copy() ) )
        const Sempty = new MathConcept
        const Sweird = new MathConcept( Sempty.copy() )
        // test atomic string representations
        expect( Sx.toString() ).to.equal( '()' )
        expect( Sy.toString() ).to.equal( '()' )
        expect( SP.toString() ).to.equal( '()' )
        expect( Splus.toString() ).to.equal( '()' )
        expect( Slog.toString() ).to.equal( '()' )
        // test non-atomic string representations
        expect( Ssum.toString() ).to.equal( '(() () ())' )
        expect( Sexpr.toString() ).to.equal( '(() (() () ()))' )
        expect( Sempty.toString() ).to.equal( '()' )
        expect( Sweird.toString() ).to.equal( '(())' )
    } )

} )

describe( 'Bound and free variables', () => {

    const makeTree = ( arg ) => {
        if ( arg instanceof Array ) {
            if ( arg[0] == 'bind' ) {
                return new Binding( ...arg.slice( 1 ).map( makeTree ) )
            } else {
                return new Expression( ...arg.map( makeTree ) )
            }
        } else return new Symbol( arg )
    }

    it( 'Should correctly compute the free identifiers in a MathConcept', () => {
        // create some valid Bindings in which to detect free identifiers
        const forall = makeTree(
            [ 'bind', '∀', 'x', 'y', [ 'P', 'x', 'y' ] ] ) // ∀x,y, P(x,y)
        const exists = makeTree(
            [ 'bind', '∃', 'a', [ '>', 'a', 0 ] ] ) // ∃a, a>0
        const sum = makeTree(
            [ 'bind', [ '∑', 1, 'n' ], 'i', [ '^', 'i', 2 ] ] ) // ∑_{i=1}^n i^2
        const forgotToMarkBinding = makeTree(
            [ '∀', 'x', 'y', [ 'P', 'x', 'y' ] ] )
        const notEnoughChildren = makeTree( [ '∑', 'body' ] )
        const atomic = new Symbol( 'atomic' )
        // compute the list of free identifiers in each one, sort them (if
        // needed) so that the result is in a canonical order, and compare to
        // the correct answer in each case
        expect( forall.freeIdentifierNames().sort() ).to.eql( [ 'P', '∀' ] )
        expect( exists.freeIdentifierNames().sort() ).to.eql( [ '0', '>', '∃' ] )
        expect( sum.freeIdentifierNames().sort() ).to.eql(
            [ '1', '2', '^', 'n', '∑' ] )
        expect( forgotToMarkBinding.freeIdentifierNames().sort() ).to.eql(
            [ 'P', 'x', 'y', '∀' ] )
        expect( notEnoughChildren.freeIdentifierNames().sort() ).to.eql(
            [ 'body', '∑' ] )
        expect( atomic.freeIdentifierNames().sort() ).to.eql( [ 'atomic' ] )
    } )

    it( 'Should judge freeness of sub-MathConcepts correctly', () => {
        // test isFree() and occursFree() on all the subexpressions of a small
        // summation expression
        const sum = makeTree( [ 'bind', '∑', 's', [ 'f', 's' ] ] ) // ∑_s f(s)
        // test with assumed top-level ancestor
        expect( sum.child( 1 ).isFree() ).to.equal( false ) // first s
        expect( sum.child( 2 ).isFree() ).to.equal( false ) // f(s)
        expect( sum.index( [ 2, 1 ] ).isFree() ).to.equal( false ) // second s
        // test with explicit top-level ancestor
        expect( sum.child( 1 ).isFree( sum ) ).to.equal( false ) // first s
        expect( sum.child( 2 ).isFree( sum ) ).to.equal( false ) // f(s)
        expect( sum.index( [ 2, 1 ] ).isFree( sum ) ).to.equal( false ) // second s
        // test with an inner ancestor, to change the answer
        expect( sum.child( 1 ).isFree( sum.child( 1 ) ) ).to.equal( true )
        expect( sum.child( 2 ).isFree( sum.child( 2 ) ) ).to.equal( true )
        expect( sum.index( [ 2, 1 ] ).isFree( sum.child( 2 ) ) ).to.equal( true )
        // and all occursFree() checks should also be false w/no inThis specified
        const s = sum.child( 1 ).copy()
        const fofs = sum.child( 2 ).copy()
        expect( sum.occursFree( s ) ).to.equal( false )
        expect( sum.occursFree( fofs ) ).to.equal( false )
        // but can be true if the ancestor is specified as the f(s)
        expect( sum.occursFree( s, sum.child( 2 ) ) ).to.equal( true )
        expect( sum.occursFree( fofs, sum.child( 2 ) ) ).to.equal( true )

        // test isFree() and occursFree() on some subexpressions of a small
        // predicate logic expression
        const predicateLogic1 = makeTree( [ // P(x) ^ ∀x,Q(x)
            'and',
            [ 'P', 'x' ],
            [ 'bind', '∀', 'x', [ 'Q', 'x' ] ]
        ] )
        // one x is free, the others are not, but thus x does occur free
        const x1 = predicateLogic1.index( [ 1, 1 ] )
        const x2 = predicateLogic1.index( [ 2, 1 ] )
        const x3 = predicateLogic1.index( [ 2, 2, 1 ] )
        expect( x1.equals( x2 ) ).to.equal( true )
        expect( x1.equals( x3 ) ).to.equal( true )
        expect( x1.isFree() ).to.equal( true )
        expect( x2.isFree() ).to.equal( false )
        expect( x3.isFree() ).to.equal( false )
        expect( predicateLogic1.occursFree( x1.copy() ) ).to.equal( true )
        // all other symbols all occur free
        expect( predicateLogic1.occursFree( new Symbol( 'and' ) ) ).to.equal( true )
        expect( predicateLogic1.occursFree( new Symbol( 'P' ) ) ).to.equal( true )
        expect( predicateLogic1.occursFree( new Symbol( 'Q' ) ) ).to.equal( true )
        expect( predicateLogic1.occursFree( new Symbol( '∀' ) ) ).to.equal( true )
        // P(x) occurs free but Q(x) does not
        const Pofx = predicateLogic1.child( 1 )
        const Qofx = predicateLogic1.index( [ 2, 2 ] )
        expect( predicateLogic1.occursFree( Pofx.copy() ) ).to.equal( true )
        expect( predicateLogic1.occursFree( Qofx.copy() ) ).to.equal( false )
        // x2, x3, and Qofx become free if we consider a lower ancestor
        expect( x2.isFree( x2 ) ).to.equal( true )
        expect( x3.isFree( x3 ) ).to.equal( true )
        expect( x3.isFree( Qofx ) ).to.equal( true )
        expect( Qofx.isFree( Qofx ) ).to.equal( true )
        expect( predicateLogic1.occursFree( Qofx.copy(), Qofx ) ).to.equal( true )
        expect( Qofx.parent().occursFree( x1.copy(), Qofx ) ).to.equal( true )
        // make one small change (Q becomes P) and verify that P(x) still
        // occurs free, because there is one outside the quantifier
        const predicateLogic2 = makeTree( [ // P(x) ^ ∀x,P(x)
            'and',
            [ 'P', 'x' ],
            [ 'bind', '∀', 'x', [ 'P', 'x' ] ]
        ] )
        expect( predicateLogic2.occursFree( Pofx.copy() ) ).to.equal( true )

        // And test one corner case:  The head expression of a binding is not
        // part of the scope of the binding.  This is a case that almost never
        // arises in practice, but should be tested anyway.
        const notStrange = makeTree( // \sum_{n=1}^k n^2
            [ 'bind', [ '∑', '1', 'k' ], 'n', [ '^', 'n', '2' ] ] )
        expect( notStrange.child( 0 ).isFree() ).to.equal( true )
        expect( notStrange.child( 1 ).isFree() ).to.equal( false )
        expect( notStrange.child( 2 ).isFree() ).to.equal( false )
        const strange = makeTree(    // \sum_{n=1}^n n^2
            [ 'bind', [ '∑', '1', 'n' ], 'n', [ '^', 'n', '2' ] ] )
        expect( strange.child( 0 ).isFree() ).to.equal( true )
        expect( strange.child( 1 ).isFree() ).to.equal( false )
        expect( strange.child( 2 ).isFree() ).to.equal( false )
    } )

    it( 'Handles free replacement correctly', () => {
        // recreate some of the same expressions used in the previous test
        const sum = makeTree( [ 'bind', '∑', 's', [ 'f', 's' ] ] ) // ∑_s f(s)
        const predicateLogic = makeTree( [ // P(x) ^ ∀x,P(x)
            'and',
            [ 'P', 'x' ],
            [ 'bind', '∀', 'x', [ 'P', 'x' ] ]
        ] )
        // now create several expressions that have various free variables in
        // them, for replacement-testing purposes
        const gofx = makeTree( [ 'g', 'x' ] )
        const hofs = makeTree( [ 'h', 's' ] )
        const Pofy = makeTree( [ 'P', 'y' ] )
        const xto2 = makeTree( [ '^', 'x', '2' ] )
        const Exxeqy = makeTree( [ 'bind', '∃', 'x', [ '=', 'x', 'y' ] ] )
        // in the sum, any child can be replaced iff the new thing has no free s
        for ( let i = 0 ; i < 3 ; i++ ) {
            expect( gofx.isFreeToReplace( sum.child( i ) ) ).to.equal( true )
            expect( hofs.isFreeToReplace( sum.child( i ) ) ).to.equal( false )
            expect( Pofy.isFreeToReplace( sum.child( i ) ) ).to.equal( true )
            expect( xto2.isFreeToReplace( sum.child( i ) ) ).to.equal( true )
            expect( Exxeqy.isFreeToReplace( sum.child( i ) ) ).to.equal( true )
        }
        // so if we ask it to replace all free occurrences of s, we will get a
        // completely transformed expression, as long as the replacement has no
        // free s in it; in that case, we get no change
        let test
        test = sum.copy()
        test.replaceFree( new Symbol( 's' ), gofx )
        const temp = makeTree( [ 'bind', '∑', 'TEMP', [ 'f', [ 'g', 'x' ] ] ] )
        temp.child( 1 ).replaceWith( makeTree( [ 'g', 'x' ] ) )
        expect( test.equals( temp ) ).to.equal( true )
        test = sum.copy()
        test.replaceFree( new Symbol( 's' ), hofs )
        expect( test.equals( sum ) ).to.equal( true )
        test = sum.copy()
        test.replaceFree( new Symbol( 's' ), Exxeqy )
        let compare = makeTree(
            [ 'bind', '∑', 'TEMP',
                [ 'f', [ 'bind', '∃', 'x', [ '=', 'x', 'y' ] ] ] ] )
        compare.child( 1 ).replaceWith(
            makeTree( [ 'bind', '∃', 'x', [ '=', 'x', 'y' ] ] ) )
        expect( test.equals( compare ) ).to.equal( true )
        // in the predicate logic expression, the first x can be replaced by
        // anything, but the second x can be replaced only by things with no
        // free x in them
        const pl1x1 = predicateLogic.index( [ 1, 1 ] )
        expect( gofx.isFreeToReplace( pl1x1 ) ).to.equal( true )
        expect( hofs.isFreeToReplace( pl1x1 ) ).to.equal( true )
        expect( Pofy.isFreeToReplace( pl1x1 ) ).to.equal( true )
        expect( xto2.isFreeToReplace( pl1x1 ) ).to.equal( true )
        expect( Exxeqy.isFreeToReplace( pl1x1 ) ).to.equal( true )
        const pl1x2 = predicateLogic.index( [ 2, 2, 1 ] )
        expect( gofx.isFreeToReplace( pl1x2 ) ).to.equal( false )
        expect( hofs.isFreeToReplace( pl1x2 ) ).to.equal( true )
        expect( Pofy.isFreeToReplace( pl1x2 ) ).to.equal( true )
        expect( xto2.isFreeToReplace( pl1x2 ) ).to.equal( false )
        expect( Exxeqy.isFreeToReplace( pl1x2 ) ).to.equal( true )
        // the same answers hold if we try to replace each P(x) instead
        const pl1Pofx1 = predicateLogic.child( 1 )
        expect( gofx.isFreeToReplace( pl1Pofx1 ) ).to.equal( true )
        expect( hofs.isFreeToReplace( pl1Pofx1 ) ).to.equal( true )
        expect( Pofy.isFreeToReplace( pl1Pofx1 ) ).to.equal( true )
        expect( xto2.isFreeToReplace( pl1Pofx1 ) ).to.equal( true )
        expect( Exxeqy.isFreeToReplace( pl1Pofx1 ) ).to.equal( true )
        const pl1Pofx2 = predicateLogic.index( [ 2, 2 ] )
        expect( gofx.isFreeToReplace( pl1Pofx2 ) ).to.equal( false )
        expect( hofs.isFreeToReplace( pl1Pofx2 ) ).to.equal( true )
        expect( Pofy.isFreeToReplace( pl1Pofx2 ) ).to.equal( true )
        expect( xto2.isFreeToReplace( pl1Pofx2 ) ).to.equal( false )
        expect( Exxeqy.isFreeToReplace( pl1Pofx2 ) ).to.equal( true )
        // so if we ask it to replace x wherever it's free to do so, then only
        // the first x changes when the replacement contains a free x
        test = predicateLogic.copy()
        test.replaceFree( new Symbol( 'x' ), gofx )
        compare = makeTree(
            [ 'and', [ 'P', [ 'g', 'x' ] ], [ 'bind', '∀', 'x', [ 'P', 'x' ] ] ]
        )
        expect( test.equals( compare ) ).to.equal( true )
        test = predicateLogic.copy()
        test.replaceFree( new Symbol( 'x' ), hofs )
        compare = makeTree(
            [ 'and', [ 'P', [ 'h', 's' ] ],
                     [ 'bind', '∀', 'TEMP', [ 'P', [ 'h', 's' ] ] ] ]
        )
        compare.index( [ 2, 1 ] ).replaceWith( makeTree( [ 'h', 's' ] ) )
        expect( test.equals( compare ) ).to.equal( true )
        test = predicateLogic.copy()
        test.replaceFree( new Symbol( 'x' ), Exxeqy )
        compare = makeTree( [
            'and',
            [ 'P', [ 'bind', '∃', 'x', [ '=', 'x', 'y' ] ] ],
            [
                'bind',
                '∀',
                'TEMP',
                [ 'P', [ 'bind', '∃', 'x', [ '=', 'x', 'y' ] ] ]
            ]
        ] )
        compare.index( [ 2, 1 ] ).replaceWith( makeTree(
            [ 'bind', '∃', 'x', [ '=', 'x', 'y' ] ] ) )
        expect( test.equals( compare ) ).to.equal( true )
        // if we relativize where it should look for "freeness," then even
        // replacements containing x free can be used, depending on the value of
        // the inThis parameter
        // First, try with inThis == the quantifier, which should give no change:
        test = predicateLogic.copy()
        test.replaceFree( new Symbol( 'x' ), gofx, test.child( 2 ) )
        compare = makeTree(
            [ 'and', [ 'P', [ 'g', 'x' ] ], [ 'bind', '∀', 'x', [ 'P', 'x' ] ] ]
        )
        expect( test.equals( compare ) ).to.equal( true )
        // Next, try with inThis == the quantifier body, which should mean that
        // only the first child of the quantifier is considered bound, so two
        // replacements should happen instead of just one:
        test = predicateLogic.copy()
        test.replaceFree( new Symbol( 'x' ), gofx, test.index( [ 2, 2 ] ) )
        compare = makeTree(
            [ 'and', [ 'P', [ 'g', 'x' ] ],
                     [ 'bind', '∀', 'x', [ 'P', [ 'g', 'x' ] ] ] ]
        )
        expect( test.equals( compare ) ).to.equal( true )
    } )

} )

describe( 'Unique IDs for MathConcept instances', () => {

    it( 'Can be set and gotten correctly', () => {
        // make some MathConcepts
        const A = new MathConcept()
        const B1 = new MathConcept()
        const B2 = new MathConcept()
        const C = new MathConcept( B1, B2 )
        // ensure nothing has an ID at first
        expect( A.ID() ).to.equal( undefined )
        expect( B1.ID() ).to.equal( undefined )
        expect( B2.ID() ).to.equal( undefined )
        expect( C.ID() ).to.equal( undefined )
        // assign some IDs; ensure everything becomes a string
        A.setID( 'Four' )
        B1.setID( 'Score' )
        B2.setID( [ '&' ] )
        C.setID( 7 )
        // get the IDs and ensure they're the same (except as strings)
        expect( A.ID() ).to.equal( 'Four' )
        expect( B1.ID() ).to.equal( 'Score' )
        expect( B2.ID() ).to.equal( '&' )
        expect( C.ID() ).to.equal( '7' )
        // now clear out one ID and ensure that happened
        A.clearIDs()
        expect( A.ID() ).to.equal( undefined )
        expect( B1.ID() ).to.equal( 'Score' )
        expect( B2.ID() ).to.equal( '&' )
        expect( C.ID() ).to.equal( '7' )
        // and clear out C, but not recursive, so B1 and B2 keep their IDs
        C.clearIDs( false )
        expect( A.ID() ).to.equal( undefined )
        expect( B1.ID() ).to.equal( 'Score' )
        expect( B2.ID() ).to.equal( '&' )
        expect( C.ID() ).to.equal( undefined )
        // now clear C recursively, and verify that B1 and B2 lose their IDs
        C.clearIDs()
        expect( A.ID() ).to.equal( undefined )
        expect( B1.ID() ).to.equal( undefined )
        expect( B2.ID() ).to.equal( undefined )
        expect( C.ID() ).to.equal( undefined )
    } )

    it( 'Can be tracked globally', () => {
        // set up the same MathConcepts as in the previous test
        const A = new MathConcept()
        const B1 = new MathConcept()
        const B2 = new MathConcept()
        const C = new MathConcept( B1, B2 )
        A.setID( 'Four' )
        B1.setID( 'Score' )
        B2.setID( [ '&' ] )
        C.setID( 7 )
        // ensure that no IDs are currently tracked
        expect( MathConcept.instanceWithID( 'Four' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 'Score' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '&' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '7' ) ).to.equal( undefined )
        expect( A.idIsTracked() ).to.equal( false )
        expect( B1.idIsTracked() ).to.equal( false )
        expect( B2.idIsTracked() ).to.equal( false )
        expect( C.idIsTracked() ).to.equal( false )
        // track some of the IDs and ensure that only those are now tracked
        A.trackIDs()
        expect( MathConcept.instanceWithID( 'Four' ) ).to.equal( A )
        expect( MathConcept.instanceWithID( 'Score' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '&' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '7' ) ).to.equal( undefined )
        expect( A.idIsTracked() ).to.equal( true )
        expect( B1.idIsTracked() ).to.equal( false )
        expect( B2.idIsTracked() ).to.equal( false )
        expect( C.idIsTracked() ).to.equal( false )
        // track C, but not recursively, so just C, not B1 nor B2, is tracked
        C.trackIDs( false )
        expect( MathConcept.instanceWithID( 'Four' ) ).to.equal( A )
        expect( MathConcept.instanceWithID( 'Score' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '&' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '7' ) ).to.equal( C )
        expect( A.idIsTracked() ).to.equal( true )
        expect( B1.idIsTracked() ).to.equal( false )
        expect( B2.idIsTracked() ).to.equal( false )
        expect( C.idIsTracked() ).to.equal( true )
        // now track C recursively, so that everything is tracked
        C.trackIDs()
        expect( MathConcept.instanceWithID( 'Four' ) ).to.equal( A )
        expect( MathConcept.instanceWithID( 'Score' ) ).to.equal( B1 )
        expect( MathConcept.instanceWithID( '&' ) ).to.equal( B2 )
        expect( MathConcept.instanceWithID( '7' ) ).to.equal( C )
        expect( A.idIsTracked() ).to.equal( true )
        expect( B1.idIsTracked() ).to.equal( true )
        expect( B2.idIsTracked() ).to.equal( true )
        expect( C.idIsTracked() ).to.equal( true )
        // untrack A's ID and ensure that it is no longer in the global mapping
        A.untrackIDs()
        expect( MathConcept.instanceWithID( 'Four' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 'Score' ) ).to.equal( B1 )
        expect( MathConcept.instanceWithID( '&' ) ).to.equal( B2 )
        expect( MathConcept.instanceWithID( '7' ) ).to.equal( C )
        expect( A.idIsTracked() ).to.equal( false )
        expect( B1.idIsTracked() ).to.equal( true )
        expect( B2.idIsTracked() ).to.equal( true )
        expect( C.idIsTracked() ).to.equal( true )
        // untrack C's ID, but not recursively, so B1 and B2 stay tracked
        C.untrackIDs( false )
        expect( MathConcept.instanceWithID( 'Four' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 'Score' ) ).to.equal( B1 )
        expect( MathConcept.instanceWithID( '&' ) ).to.equal( B2 )
        expect( MathConcept.instanceWithID( '7' ) ).to.equal( undefined )
        expect( A.idIsTracked() ).to.equal( false )
        expect( B1.idIsTracked() ).to.equal( true )
        expect( B2.idIsTracked() ).to.equal( true )
        expect( C.idIsTracked() ).to.equal( false )
        // untrack C, recursively, so all are now untracked
        C.untrackIDs()
        expect( MathConcept.instanceWithID( 'Four' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 'Score' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '&' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '7' ) ).to.equal( undefined )
        expect( A.idIsTracked() ).to.equal( false )
        expect( B1.idIsTracked() ).to.equal( false )
        expect( B2.idIsTracked() ).to.equal( false )
        expect( C.idIsTracked() ).to.equal( false )
    } )

    it( 'Can be changed, except when that doesn\'t make sense', () => {
        // create a few small MathConcepts and give them simple IDs and track them
        const A = new MathConcept()
        const B = new MathConcept()
        const C = new MathConcept()
        A.setID( 1 )
        B.setID( 2 )
        C.setID( 3 )
        A.trackIDs()
        B.trackIDs()
        C.trackIDs()
        // ensure that they are tracked correctly
        expect( MathConcept.instanceWithID( 1 ) ).to.equal( A )
        expect( MathConcept.instanceWithID( 2 ) ).to.equal( B )
        expect( MathConcept.instanceWithID( 3 ) ).to.equal( C )
        // ask to change each ID i to i+3 and verify it works (in several ways)
        expect( A.changeID( 4 ) ).to.equal( true )
        expect( B.changeID( 5 ) ).to.equal( true )
        expect( C.changeID( 6 ) ).to.equal( true )
        expect( A.ID() ).to.equal( '4' )
        expect( B.ID() ).to.equal( '5' )
        expect( C.ID() ).to.equal( '6' )
        expect( A.idIsTracked() ).to.equal( true )
        expect( B.idIsTracked() ).to.equal( true )
        expect( C.idIsTracked() ).to.equal( true )
        expect( MathConcept.instanceWithID( 1 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 2 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 3 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 4 ) ).to.equal( A )
        expect( MathConcept.instanceWithID( 5 ) ).to.equal( B )
        expect( MathConcept.instanceWithID( 6 ) ).to.equal( C )
        // now to test: will changeID() fail if the new ID is already in use?
        expect( A.changeID( 6 ) ).to.equal( false )
        expect( A.ID() ).to.equal( '4' )
        expect( B.ID() ).to.equal( '5' )
        expect( C.ID() ).to.equal( '6' )
        expect( A.idIsTracked() ).to.equal( true )
        expect( B.idIsTracked() ).to.equal( true )
        expect( C.idIsTracked() ).to.equal( true )
        expect( MathConcept.instanceWithID( 1 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 2 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 3 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 4 ) ).to.equal( A )
        expect( MathConcept.instanceWithID( 5 ) ).to.equal( B )
        expect( MathConcept.instanceWithID( 6 ) ).to.equal( C )
        // now to test: will changeID() fail if the old ID isn't tracked?
        const D = new MathConcept()
        D.setID( 100 )
        expect( D.changeID( 200 ) ).to.equal( false )
        expect( D.idIsTracked() ).to.equal( false )
        expect( MathConcept.instanceWithID( '100' ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( '200' ) ).to.equal( undefined )
        // now to test: will changeID() fail if it's not really a change?
        expect( C.changeID( 6 ) ).to.equal( false )
        expect( A.ID() ).to.equal( '4' )
        expect( B.ID() ).to.equal( '5' )
        expect( C.ID() ).to.equal( '6' )
        expect( A.idIsTracked() ).to.equal( true )
        expect( B.idIsTracked() ).to.equal( true )
        expect( C.idIsTracked() ).to.equal( true )
        expect( MathConcept.instanceWithID( 1 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 2 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 3 ) ).to.equal( undefined )
        expect( MathConcept.instanceWithID( 4 ) ).to.equal( A )
        expect( MathConcept.instanceWithID( 5 ) ).to.equal( B )
        expect( MathConcept.instanceWithID( 6 ) ).to.equal( C )
    } )

} )

describe( 'MathConcept dirty flags', () => {

    it( 'Ensure that instances are clean by default', () => {
        // set up a small hierarchy of MathConcepts
        let A, B, C, D
        A = new MathConcept(
            B = new MathConcept,
            C = new MathConcept(
                D = new MathConcept
            )
        )
        // verify all are clean
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
    } )

    it( 'Ensure that getters and setters behave as expected', () => {
        // set up the same small hierarchy of MathConcepts as in the previous test
        let A, B, C, D
        A = new MathConcept(
            B = new MathConcept,
            C = new MathConcept(
                D = new MathConcept
            )
        )
        // get and set a few values and ensure that they operate completely
        // independently of one another when the propagate parameter is false
        A.markDirty( true, false )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
        C.markDirty( true, false )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( false )
        B.markDirty( false, false )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( false )
        A.markDirty( false, false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( false )
        D.markDirty( true, false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( true )
        C.markDirty( false, false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( true )
        D.markDirty( false, false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
        // get and set a few values and ensure that propagation upwards
        // happens when requested
        A.markDirty( true, true )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
        D.markDirty( true, true )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( true )
        C.markDirty( false, true )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( true )
    } )

} )

describe( 'Sending feedback about MathConcepts', () => {

    it( 'Should call the static method from the instance method', () => {
        // Remember the old implementation of the static method, so we can
        // clean up after ourselves when this test is done
        let oldMethod = MathConcept.feedback
        // Replace the old method with one that we can watch be called
        MathConcept.feedback = makeSpy()
        // Verify that it works
        expect( MathConcept.feedback.callRecord ).to.eql( [ ] )
        const feedback1 = { 'what is this' : 'a test' }
        MathConcept.feedback( feedback1 )
        expect( MathConcept.feedback.callRecord ).to.eql( [ [ feedback1 ] ] )
        // Create a MathConcept instance and send some feedback about it
        let M = new MathConcept
        M.trackIDs()
        M.feedback( { 'and this?' : 'a REAL test!' } )
        expect( MathConcept.feedback.callRecord ).to.eql( [
            [ feedback1 ],
            [
                {
                    'and this?' : 'a REAL test!',
                    'subject' : M.ID()
                }
            ]
        ] )
        // Clean up after ourselves
        MathConcept.feedback = oldMethod
    } )

} )

describe( 'Smackdown notation and interpretation', () => {

    it( 'Should support all of putdown notation', () => {
        const test1 = MathConcept.fromSmackdown( '(- (^ b 2) (* (* 4 a) c))' )
        const discriminant = new Application(
            new Symbol( '-' ),
            new Application(
                new Symbol( '^' ), new Symbol( 'b' ), new Symbol( '2' )
            ),
            new Application(
                new Symbol( '*' ),
                new Application(
                    new Symbol( '*' ), new Symbol( '4' ), new Symbol( 'a' )
                ),
                new Symbol( 'c' )
            )
        )
        expect( test1 ).to.be.instanceof( Array )
        expect( test1.length ).to.equal( 1 )
        expect( test1[0].interpret().equals( discriminant ) ).to.equal( true )
        // -------------
        const test2 = MathConcept.fromSmackdown( `
            [
                x +{"special variable":false}
                y
                const
                (
                    P
                    x
                    y +{"special variable":true}
                      +{"double special?":"you know it"}
                )
            ] +{"modifier at topmost level":"checking in"}
        ` )
        expect( test2 ).to.be.instanceof( Array )
        expect( test2.length ).to.equal( 1 )
        expect( test2[0].interpret().equals(
            new Declaration(
                Declaration.Constant,
                [
                    new Symbol( 'x' ).attr( { 'special variable' : false } ),
                    new Symbol( 'y' )
                ],
                new Application(
                    new Symbol( 'P' ),
                    new Symbol( 'x' ),
                    new Symbol( 'y' ).attr( {
                        'special variable' : true,
                        'double special?' : 'you know it'
                    } )
                )
            ).attr( { 'modifier at topmost level' : 'checking in' } )
        ) ).to.equal( true )
    } )

    xit( 'Should support $...$ notation blocks', () => {
        // test 1: some $...$ all alone
        // test 2: some $...$ inside a small bunch of putdown
        // test 3: several $...$ inside a larger bunch of putdown
        // test 4: if we have $...$ inside a //-comment, it's ignored
        // test 5: should handle escapes (\$, \\\$, \\, etc.) correctly
    } )

    xit( 'Should give errors when $...$ notation is wrongly formed', () => {
        // test 1: odd number of $'s
        // test 2: cannot split $...$ over multiple lines
        // test 3: incorrect number of escape slashes before a dollar sign,
        //         or other invalid escaping, like \a
    } )

    xit( 'Should support \\begin/end{proof} commands', () => {
        // test 1: some $...$ all alone
        // test 2: some $...$ inside a small bunch of putdown
        // test 3: several $...$ inside a larger bunch of putdown
    } )

    xit( 'Should give errors when \\begin/end{proof} is wrongly used', () => {
        // test 1: misbalanced begin/end
        // test 2: misspelled \begin{proof} or \end{proof}
        // test 3: but it's actually okay to balance { with \end{proof}
        //         or to balance \begin{proof} with }
    } )

    xit( 'Should support \\label/ref{...} commands', () => {
        // test 1: one \label{...} applied to one expression
        // test 2: one \label{...} applied to one environment
        // test 3: several \label{...}s sprinkled through a larger putdown doc,
        //         including some on the next line after the thing they modify
        // test 4: same as first 3, but with \ref instead
        // test 5: same as 3, but a combination of labels and refs, including
        //         some places where \label{...}\ref{...} are applied to the
        //         same thing, in either order, even with no space between
        // test 6: should handle escapes (\{, \\\}, \\, etc.) correctly
    } )

    xit( 'Should give errors when \\label/ref{...} is wrongly used', () => {
        // test 1: starting a doc with one
        // test 2: starting an environment with one
        // test 3: misspelled \label{...} or \ref{...}
        // test 4: although it's okay to do \label{x} \label{y}, only the y
        //         will take effect, because it will overwrite the x
        // test 5: incorrect number of escape slashes before a bracket,
        //         or other invalid escaping, like \a
    } )

    xit( 'Should support arbitrary \\command{arg1}...{argN}', () => {
        // test 1: one in a string all alone, with varying numbers of arguments
        // test 2: one in a string amidst a few other things
        // test 3: several commands sprinkled throughout a larger doc
        // test 4: should handle escapes (\{, \\\}, \\, etc.) correctly
    } )

    xit( 'Should give errors when \\commands are wrongly used', () => {
        // test 1: cannot split an argument over multiple lines
        // test 2: there cannot be any whitespace between \command and {arg1}
        // test 3: there cannot be any whitespace between arguments
        // test 4: but you can actually include \{ and \} inside args
        // test 5: incorrect number of escape slashes before a bracket,
        //         or other invalid escaping, like \a
    } )

    xit( 'Should let us combine multiple smackdown features', () => {
        // one large-ish input doc with \label{...}, \ref{...}, \begin{proof},
        // \end{proof}, some other \command, and more than one $...$
    } )

} )
