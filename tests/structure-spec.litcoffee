
# Tests of the Structure class

Here we import the module we're about to test.

    { Structure } = require '../src/structure'

## Global objects

Verify that the globals exposed by the Structure module are visible.

    describe 'Structure module globals', ->
        it 'should be defined', ->
            expect( Structure ).toBeTruthy()


## Structure trees

    describe 'Structure trees', ->

Structure objects can be formed into hierarchies.

The first set of tests is whether we can form structure hierarchies with
nested calls to constructors, and have them create the parent/child pointers
we expect.

        it 'should be assemblable with constructors', ->

Make a small structure hierarchy, naming each node, and verify that no error
occurs.

            root = new Structure(
                A = new Structure(
                    AA = new Structure()
                    AB = new Structure()
                )
                B = new Structure()
            )

Ensure that all parent pointers were correctly established in the forming of
the hierarchy.

            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBe root

Ensure that all child arrays are equivalent in structure to what's expected
based on the construction code above.

            expect( root.children() ).toEqual [ A, B ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]

Ensure that previous and next sibling functions work as expected.

            expect( root.previousSibling() ).toBeUndefined()
            expect( root.nextSibling() ).toBeUndefined()
            expect( A.previousSibling() ).toBeUndefined()
            expect( A.nextSibling() ).toBe B
            expect( AA.previousSibling() ).toBeUndefined()
            expect( AA.nextSibling() ).toBe AB
            expect( AB.previousSibling() ).toBe AA
            expect( AB.nextSibling() ).toBeUndefined()
            expect( B.previousSibling() ).toBe A
            expect( B.nextSibling() ).toBeUndefined()

The next test is whether children correctly compute their index in their
parent structure.

        it 'should correctly compute indices in parent nodes', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure()
                    AB = new Structure()
                )
                B = new Structure()
            )

Check the index in parent of each node.

            expect( root.indexInParent() ).toBeUndefined()
            expect( A.indexInParent() ).toBe 0
            expect( AA.indexInParent() ).toBe 0
            expect( AB.indexInParent() ).toBe 1
            expect( B.indexInParent() ).toBe 1

The next test is whether we can remove structures from an existing hierarchy
and retain the integrity and correct structure of the hierarchy.

        it 'should support removing structures', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure()
                    AB = new Structure()
                )
                B = new Structure()
            )

Remove a child of the root and verify that the structure is as expected.

            B.removeFromParent()
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

Remove a grandchild of the root and verify that the structure is as
expected.

            AA.removeFromParent()
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

Remove something that has already been removed, and verify that nothing
changes or causes an error.

            AA.removeFromParent()
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

The next test is whether we can remove children from an existing hierarchy
and retain the integrity and correct structure of the hierarchy.

        it 'should support removing children', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure()
                    AB = new Structure()
                )
                B = new Structure()
            )

Remove a child of the root and verify that the structure is as expected.

            root.removeChild 1
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

Remove a grandchild of the root and verify that the structure is as
expected.

            A.removeChild 0
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

Remove an invalid index, and verify that nothing changes or causes an error.

            A.removeChild 1
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

The next test is whether we can insert structures into an existing hierarchy
and retain the integrity and correct structure of the hierarchy.

        it 'should support inserting structures', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure()
                    AB = new Structure()
                )
                B = new Structure()
            )

Add a new child of the root and verify that the structure is as expected.

            C = new Structure()
            expect( C.parent() ).toBeNull()
            expect( C.children() ).toEqual [ ]
            root.insertChild C, 1
            expect( root.children() ).toEqual [ A, C, B ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe root

Append a child to the end of the list of children of a child of the root and
verify that the structure is as expected.

            D = new Structure()
            expect( D.parent() ).toBeNull()
            expect( D.children() ).toEqual [ ]
            A.insertChild D, 2
            expect( root.children() ).toEqual [ A, C, B ]
            expect( A.children() ).toEqual [ AA, AB, D ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( D.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( D.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe root

Insert as the first child of the root a child from elsewhere in the
hierarchy, and verify that it is removed from one place and inserted in the
other.

            root.insertChild AA, 0
            expect( root.children() ).toEqual [ AA, A, C, B ]
            expect( A.children() ).toEqual [ AB, D ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( D.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe root
            expect( AB.parent() ).toBe A
            expect( D.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe root

Do the same test again, but this time just moving something to be a later
sibling within the same parent.

            root.insertChild A, 2
            expect( root.children() ).toEqual [ AA, C, A, B ]
            expect( A.children() ).toEqual [ AB, D ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( D.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe root
            expect( AB.parent() ).toBe A
            expect( D.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe root

Now we test whether we can replace structures in an existing hierarchy with
new structures, and retain the integrity and correct structure of the
hierarchy.

        it 'should support replacing structures', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure()
                    AB = new Structure()
                )
                B = new Structure()
            )

Replace one child of the root with a new structure and verify that all comes
out as expected.

            C = new Structure()
            expect( C.parent() ).toBeNull()
            expect( C.children() ).toEqual [ ]
            B.replaceWith C
            expect( root.children() ).toEqual [ A, C ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBeNull()

Replace one grandchild of the root with the former child of the root, and
verify that all comes out as expected.

            AA.replaceWith B
            expect( root.children() ).toEqual [ A, C ]
            expect( A.children() ).toEqual [ B, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe A

Replace A with one of its own children, as a corner case test.

            A.replaceWith AB
            expect( root.children() ).toEqual [ AB, C ]
            expect( A.children() ).toEqual [ B ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBeNull()
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe root
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe A

The next section tests the tree ordering relation defined in the Structure
class, `isEarlierThan()`.

        it 'correctly judges which subtrees are earlier', ->

Define a structre on which we will test the ordering relation.  Then define
a separate structure that's not connected to it, for comparing across the
two structures.

            root = new Structure(
                A = new Structure(
                    AA = new Structure()
                    AB = new Structure(
                        ABA = new Structure()
                    )
                )
                B = new Structure()
            )
            disconnected = new Structure(
                dA = new Structure()
            )

Check all possible pairs of subtrees of the root and verify that the order
relation is correct for them.

            expect( root.isEarlierThan root ).toBeFalsy()
            expect( root.isEarlierThan A ).toBeTruthy()
            expect( root.isEarlierThan AA ).toBeTruthy()
            expect( root.isEarlierThan AB ).toBeTruthy()
            expect( root.isEarlierThan ABA ).toBeTruthy()
            expect( root.isEarlierThan B ).toBeTruthy()
            expect( A.isEarlierThan root ).toBeFalsy()
            expect( A.isEarlierThan A ).toBeFalsy()
            expect( A.isEarlierThan AA ).toBeTruthy()
            expect( A.isEarlierThan AB ).toBeTruthy()
            expect( A.isEarlierThan ABA ).toBeTruthy()
            expect( A.isEarlierThan B ).toBeTruthy()
            expect( AA.isEarlierThan root ).toBeFalsy()
            expect( AA.isEarlierThan A ).toBeFalsy()
            expect( AA.isEarlierThan AA ).toBeFalsy()
            expect( AA.isEarlierThan AB ).toBeTruthy()
            expect( AA.isEarlierThan ABA ).toBeTruthy()
            expect( AA.isEarlierThan B ).toBeTruthy()
            expect( AB.isEarlierThan root ).toBeFalsy()
            expect( AB.isEarlierThan A ).toBeFalsy()
            expect( AB.isEarlierThan AA ).toBeFalsy()
            expect( AB.isEarlierThan AB ).toBeFalsy()
            expect( AB.isEarlierThan ABA ).toBeTruthy()
            expect( AB.isEarlierThan B ).toBeTruthy()
            expect( ABA.isEarlierThan root ).toBeFalsy()
            expect( ABA.isEarlierThan A ).toBeFalsy()
            expect( ABA.isEarlierThan AA ).toBeFalsy()
            expect( ABA.isEarlierThan AB ).toBeFalsy()
            expect( ABA.isEarlierThan ABA ).toBeFalsy()
            expect( ABA.isEarlierThan B ).toBeTruthy()
            expect( B.isEarlierThan root ).toBeFalsy()
            expect( B.isEarlierThan A ).toBeFalsy()
            expect( B.isEarlierThan AA ).toBeFalsy()
            expect( B.isEarlierThan AB ).toBeFalsy()
            expect( B.isEarlierThan ABA ).toBeFalsy()
            expect( B.isEarlierThan B ).toBeFalsy()

Repeat the exercise for the disconnected tree.

            expect( disconnected.isEarlierThan disconnected ).toBeFalsy()
            expect( disconnected.isEarlierThan dA ).toBeTruthy()
            expect( dA.isEarlierThan disconnected ).toBeFalsy()
            expect( dA.isEarlierThan dA ).toBeFalsy()

Verify that across trees, the answer is always undefined.

            expect( root.isEarlierThan disconnected ).toBeUndefined()
            expect( A.isEarlierThan disconnected ).toBeUndefined()
            expect( AA.isEarlierThan disconnected ).toBeUndefined()
            expect( AB.isEarlierThan disconnected ).toBeUndefined()
            expect( ABA.isEarlierThan disconnected ).toBeUndefined()
            expect( B.isEarlierThan disconnected ).toBeUndefined()
            expect( root.isEarlierThan dA ).toBeUndefined()
            expect( A.isEarlierThan dA ).toBeUndefined()
            expect( AA.isEarlierThan dA ).toBeUndefined()
            expect( AB.isEarlierThan dA ).toBeUndefined()
            expect( ABA.isEarlierThan dA ).toBeUndefined()
            expect( B.isEarlierThan dA ).toBeUndefined()
            expect( disconnected.isEarlierThan root ).toBeFalsy()
            expect( disconnected.isEarlierThan A ).toBeFalsy()
            expect( disconnected.isEarlierThan AA ).toBeFalsy()
            expect( disconnected.isEarlierThan AB ).toBeFalsy()
            expect( disconnected.isEarlierThan ABA ).toBeFalsy()
            expect( disconnected.isEarlierThan B ).toBeFalsy()
            expect( dA.isEarlierThan root ).toBeFalsy()
            expect( dA.isEarlierThan A ).toBeFalsy()
            expect( dA.isEarlierThan AA ).toBeFalsy()
            expect( dA.isEarlierThan AB ).toBeFalsy()
            expect( dA.isEarlierThan ABA ).toBeFalsy()
            expect( dA.isEarlierThan B ).toBeFalsy()

## Computed attributes

    describe 'Computed attributes', ->

Structure objects provide a computed attributes dictionary, which should
function as any other Javascript object, storing key-value pairs.  Because
the implementation of this is very straightforward, we do only a few short
tests.

        it 'should function as a key-value dictionary', ->

Make a few new structures.

            S1 = new Structure()
            S2 = new Structure()

There shouldn't be any values stored at first in either of them.

            expect( S1.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S2.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S1.getComputedAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getComputedAttribute 'b e t a' ).toBeUndefined()

We can set any type of data in them without error.

            value1 = 55555
            value2 = { example : 'JSON' }
            S1.setComputedAttribute 'alpha', value1
            S2.setComputedAttribute 'b e t a', value2

We can then retrieve that exact data again.

            expect( S1.getComputedAttribute 'alpha' ).toBe value1
            expect( S2.getComputedAttribute 'b e t a' ).toBe value2

Things added to S1 did not impact S2, and vice versa.

            expect( S2.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S1.getComputedAttribute 'b e t a' ).toBeUndefined()

We can remove things from the dictionaries without error, even asking to
remove things that weren't there in the first place.

            S1.clearComputedAttributes 'alpha', 'b e t a'
            S2.clearComputedAttributes 'alpha', 'b e t a'

Now there's nothing in the dictionaries again.

            expect( S1.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S2.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S1.getComputedAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getComputedAttribute 'b e t a' ).toBeUndefined()

The `compute` function runs member functions within the Structure instance
and stores the values.  See
[the documentation](../src/structure.litcoffee#computed-attributes)
for details.

        it 'should compute and store attributes as requested', ->

Create a structure instance.

            S = new Structure()

Give it two member functions that do simple example computations.

            counter = 0
            S.count = -> counter++
            S.add = ( a, b ) -> a + b

Call `compute()` an then inspect the stored computed attributes to verify
that compute calls `count` or `add` and stores the results appropriately.

First, the zero-argument case.

            S.compute 'count'
            expect( S.getComputedAttribute 'count' ).toBe 0
            S.compute 'count'
            expect( S.getComputedAttribute 'count' ).toBe 1
            S.compute 'count'
            expect( S.getComputedAttribute 'count' ).toBe 2

Next, the two-argument case.

            S.compute [ 'add', 5, 6 ]
            expect( S.getComputedAttribute 'add' ).toBe 11
            S.compute [ 'add', 100, -200 ]
            expect( S.getComputedAttribute 'add' ).toBe -100

Finally, the many-calls case.

            S.compute 'count', [ 'add', 1, 2 ], 'count'
            expect( S.getComputedAttribute 'count' ).toBe 4
            expect( S.getComputedAttribute 'add' ).toBe 3

## External attributes

    describe 'External attributes', ->

Same first set of tests as for computed attributes, because that's the set
of tests in which they behave the same.

        it 'should function as a key-value dictionary', ->

Make a few new structures.

            S1 = new Structure()
            S2 = new Structure()

There shouldn't be any values stored at first in either of them.

            expect( S1.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S2.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S1.getExternalAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getExternalAttribute 'b e t a' ).toBeUndefined()

We can set any type of data in them without error.

            value1 = 55555
            value2 = { example : 'JSON' }
            S1.setExternalAttribute 'alpha', value1
            S2.setExternalAttribute 'b e t a', value2

We can then retrieve that exact data again.

            expect( S1.getExternalAttribute 'alpha' ).toBe value1
            expect( S2.getExternalAttribute 'b e t a' ).toBe value2

Things added to S1 did not impact S2, and vice versa.

            expect( S2.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S1.getExternalAttribute 'b e t a' ).toBeUndefined()

We can remove things from the dictionaries without error, even asking to
remove things that weren't there in the first place.

            S1.clearExternalAttributes 'alpha', 'b e t a'
            S2.clearExternalAttributes 'alpha', 'b e t a'

Now there's nothing in the dictionaries again.

            expect( S1.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S2.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S1.getExternalAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getExternalAttribute 'b e t a' ).toBeUndefined()

## Event handling

    describe 'Event handling', ->

Changes to a structure hierarchy should result in event handlers being
called in the various structures in the hierarchy.  See [this
documentation](https://lurchmath.github.io/lde/site/phase0-structures/#event-handling-in-the-structure-hierarchy)
for details about the events.

        A = B = null
        beforeEach ->

Create two structres and install utilities to spy on when their event
handlers have been called.

            A = new Structure()
            A.wasInserted = jasmine.createSpy 'wasInserted'
            A.wasRemoved = jasmine.createSpy 'wasRemoved'
            A.wasChanged = jasmine.createSpy 'wasChanged'
            B = new Structure()
            B.wasInserted = jasmine.createSpy 'wasInserted'
            B.wasRemoved = jasmine.createSpy 'wasRemoved'
            B.wasChanged = jasmine.createSpy 'wasChanged'

Run a simple test to verify that the Jasmine event handler spies are working
as expected; they have not yet been called.

        it 'should begin with no event handlers called', ->
            expect( A.wasInserted ).not.toHaveBeenCalled()
            expect( A.wasRemoved ).not.toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Now test whether insertion and removal handlers work.

        it 'should send insertion and removal events', ->

Insert A into B and verify that only the insertion event from A was called.

            B.insertChild A
            expect( A.wasInserted ).toHaveBeenCalled()
            expect( A.wasRemoved ).not.toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Reset the insertion event for A as if it had not been called, cleaning up
for future tests.

            A.wasInserted = jasmine.createSpy 'wasInserted'
            expect( A.wasInserted ).not.toHaveBeenCalled()

Remove A from B and verify that only the removal event from A was called.

            A.removeFromParent()
            expect( A.wasInserted ).not.toHaveBeenCalled()
            expect( A.wasRemoved ).toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Now test whether change handlers work.

        it 'should send change events', ->

Add external and/or computed attributes to each of A and B and ensure that
the correct event handlers were called in each case.

            A.setExternalAttribute 'a', 'b'
            expect( A.wasChanged ).toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            B.setComputedAttribute 5, { }
            expect( B.wasChanged ).toHaveBeenCalled()

Reset the change events for A and B as if they had not been called, cleaning
up for future tests.

            A.wasChanged = jasmine.createSpy 'wasChanged'
            B.wasChanged = jasmine.createSpy 'wasChanged'
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Modify the attributes already added to A and B and verify that the change
event handlers are called again.

            B.setExternalAttribute 5, { } # different object!
            expect( B.wasChanged ).toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            A.setComputedAttribute 'a', 'c'
            expect( A.wasChanged ).toHaveBeenCalled()

Reset the change events for A and B as if they had not been called, cleaning
up for future tests.

            A.wasChanged = jasmine.createSpy 'wasChanged'
            B.wasChanged = jasmine.createSpy 'wasChanged'
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Remove attributes from A and B and verify that this, too, calls change
event handlers.

            A.clearExternalAttributes 'a'
            expect( A.wasChanged ).toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            B.clearComputedAttributes 5
            expect( B.wasChanged ).toHaveBeenCalled()

## Unique IDs

    describe 'Unique IDs for Structure instances', ->

Build some structures for use in all the tests below.

        A = new Structure()
        B = new Structure(
            C = new Structure()
        )

By default, structure instances don't have any IDs.

        it 'should not be assigned by default', ->
            expect( A.ID ).toBeUndefined()
            expect( B.ID ).toBeUndefined()
            expect( C.ID ).toBeUndefined()

When you request an ID for a structure, it gets a nonnegative integer ID.

        it 'should assign nonnegative integers when asked', ->
            A.getID()
            expect( typeof A.ID ).toBe 'number'
            expect( A.ID ).not.toBeLessThan 0
            B.getID()
            expect( typeof B.ID ).toBe 'number'
            expect( B.ID ).not.toBeLessThan 0
            C.getID()
            expect( typeof C.ID ).toBe 'number'
            expect( C.ID ).not.toBeLessThan 0

Requesting an ID again for a structure that already has one does nothing to
the structure's ID.

        it 'should not reassign IDs when they are already present', ->
            old = A.ID
            A.getID()
            expect( A.ID ).toBe old
            old = B.ID
            B.getID()
            expect( B.ID ).toBe old
            old = C.ID
            C.getID()
            expect( C.ID ).toBe old

Releasing an ID should mean that the structure doesn't have one any longer.
But requesting an ID immediately thereafter should get the old one back,
because in this simple test case, only one ID is released at a time, making
it the next one waiting to be assigned.

        it 'should release and reassign IDs correctly', ->
            expect( A.ID ).not.toBeUndefined()
            old = A.ID
            A.releaseID()
            expect( A.ID ).toBeUndefined()
            A.getID()
            expect( A.ID ).not.toBeUndefined()
            expect( A.ID ).toBe old
            expect( A.ID ).not.toBeUndefined()
            old = B.ID
            B.releaseID()
            expect( B.ID ).toBeUndefined()
            B.getID()
            expect( B.ID ).not.toBeUndefined()
            expect( B.ID ).toBe old
            expect( B.ID ).not.toBeUndefined()
            old = C.ID
            C.releaseID()
            expect( C.ID ).toBeUndefined()
            C.getID()
            expect( C.ID ).not.toBeUndefined()
            expect( C.ID ).toBe old

Through all of the above changes, the list of IDs should never get above 3,
because releasing and reassigning IDs should reuse old ones.

        it 'should assign IDs economically', ->
            expect( Structure::IDs.length ).toBe 3

Looking up a structure from its ID yields the structure itself.  That is,
the lookup function works correctly.

        it 'should look structures up by ID correctly', ->
            expect( Structure.instanceWithID A.ID ).toBe A
            expect( Structure.instanceWithID B.ID ).toBe B
            expect( Structure.instanceWithID C.ID ).toBe C

## Connections

    describe 'Connections among structures', ->

Connections are documented
[here](https://lurchmath.github.io/lde/site/phase0-structures/#connections).
The following unit tests are for all functions related to them.

We will be comparing things as multisets, and some utility functions help.

        samePair = ( a, b ) -> a[0] is b[0] and a[1] is b[1]
        pairCount = ( array, pair ) ->
            ( a for a in array when samePair a, pair ).length

        it 'should be made consistent by fillOutConnections()', ->

We begin with the `fillOutConnections()` function, which is supposed to make
connections consistent, in the sense that outgoing connections lists to
various targets match the incoming connections lists at those targets.  We
thus create two structure hierarchies with inconsistent connection lists,
call `fillOutConnections()`, and ensure that the inconsistencies are fixed.

Structure 1:

            A = new Structure(
                B = new Structure(),
                C = new Structure()
            )

In order to make connections, each structure will need an ID.

            A.getID()
            B.getID()
            C.getID()

We now connect A to B, but only note it within A.
And we connect B to C, but only note it within C.
These are the two inconsistencies we will test here.

            A.setExternalAttribute 'connectionsOut', [ [ B.ID, 'foo' ] ]
            C.setExternalAttribute 'connectionsIn', [ [ B.ID, 'bar' ] ]

Make the connections consistent.

            A.fillOutConnections()

Verify that no old connections were removed.

            expect( A.getExternalAttribute 'connectionsOut' )
                .toEqual [ [ B.ID, 'foo' ] ]
            expect( C.getExternalAttribute 'connectionsIn' )
                .toEqual [ [ B.ID, 'bar' ] ]

Verify that all the appropriate new connections were added.

            expect( B.getExternalAttribute 'connectionsIn' )
                .toEqual [ [ A.ID, 'foo' ] ]
            expect( B.getExternalAttribute 'connectionsOut' )
                .toEqual [ [ C.ID, 'bar' ] ]

Verify that no other connections were created.

            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()

Structure 2:

This is much more complex than structure 1, including multiple connections
between the same two structures, connections both ways between the same two
structures, some already-filled-out connections, connections from a node to
itself, and so on.

            root = new Structure(
                A = new Structure(
                    B = new Structure()
                    C = new Structure()
                )
                D = new Structure(
                    E = new Structure()
                )
            )
            A.getID()
            B.getID()
            C.getID()
            D.getID()
            E.getID()
            A.setExternalAttribute 'connectionsOut',
                [ [ B.ID, '1' ], [ E.ID, '2' ] ]
            B.setExternalAttribute 'connectionsIn',
                [ [ A.ID, '1' ], [ A.ID, '1' ], [ A.ID, '1' ],
                  [ A.ID, '2' ] ]
            B.setExternalAttribute 'connectionsOut', [ [ C.ID, '1' ] ]
            C.setExternalAttribute 'connectionsIn', [ [ D.ID, '3' ] ]
            C.setExternalAttribute 'connectionsOut', [ [ D.ID, '3' ] ]
            D.setExternalAttribute 'connectionsIn', [ [ C.ID, '3' ] ]
            E.setExternalAttribute 'connectionsIn',
                [ [ A.ID, '2' ], [ A.ID, '2' ],
                  [ E.ID, '4' ], [ E.ID, '4' ] ]
            E.setExternalAttribute 'connectionsOut',
                [ [ C.ID, '3' ], [ E.ID, '4' ], [ E.ID, '5' ] ]

Make the connections consistent.

            root.fillOutConnections()

Check the connections of each of the six nodes.

Root:

            expect( root.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( root.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

A:

            expect( A.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, '1' ] ).toBe 3
            expect( pairCount toTest, [ B.ID, '2' ] ).toBe 1
            expect( pairCount toTest, [ E.ID, '2' ] ).toBe 2
            expect( toTest.length ).toBe 6

B:

            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, '1' ] ).toBe 3
            expect( pairCount toTest, [ A.ID, '2' ] ).toBe 1
            expect( toTest.length ).toBe 4
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, '1' ] ).toBe 1
            expect( toTest.length ).toBe 1

C:

            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, '1' ] ).toBe 1
            expect( pairCount toTest, [ D.ID, '3' ] ).toBe 1
            expect( pairCount toTest, [ E.ID, '3' ] ).toBe 1
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ D.ID, '3' ] ).toBe 1
            expect( toTest.length ).toBe 1

D:

            toTest = D.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, '3' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = D.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, '3' ] ).toBe 1
            expect( toTest.length ).toBe 1

E:

            toTest = E.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, '2' ] ).toBe 2
            expect( pairCount toTest, [ E.ID, '4' ] ).toBe 2
            expect( pairCount toTest, [ E.ID, '5' ] ).toBe 1
            expect( toTest.length ).toBe 5
            toTest = E.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, '3' ] ).toBe 1
            expect( pairCount toTest, [ E.ID, '4' ] ).toBe 2
            expect( pairCount toTest, [ E.ID, '5' ] ).toBe 1
            expect( toTest.length ).toBe 4

That completes the tests of `fillOutConnections()`.

The following section tests the function `connectTo()`.

        it 'should make consistent connections when asked', ->

Make a simple structure to use for testing.  Give all structures in it IDs,
and verify that they have no connections to start with.

            A = new Structure(
                B = new Structure(),
                C = new Structure()
            )
            A.getID()
            B.getID()
            C.getID()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( A.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( B.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( B.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

Make four connections of various types, and ensure that the connection sets
are created correctly in each case.  Furthermore, in each case, ensure that
the attempt to make a connection succeeds.

First, a simple connection.

            expect( A.connectTo B, 'reason' ).toBeTruthy()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

Second, a conncetion going the other way, and of the same type.

            expect( B.connectTo A, 'reason' ).toBeTruthy()
            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( C.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

Third, repeat the previous connection and ensure that there are now two.

            expect( B.connectTo A, 'reason' ).toBeTruthy()
            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            expect( C.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

Fourth, connect C to itself three times and ensure they all appear.

            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3

The following section tests the function `disconnectFrom()`; it is the
companion to the previous section.

        it 'should break connections consistently when asked', ->

Build the same structure as in the previous section, and make the same
connections within it.

            A = new Structure(
                B = new Structure(),
                C = new Structure()
            )
            A.getID()
            B.getID()
            C.getID()
            expect( A.connectTo B, 'reason' ).toBeTruthy()
            expect( B.connectTo A, 'reason' ).toBeTruthy()
            expect( B.connectTo A, 'reason' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()

Verify that the currenct connection setup is, as expected, what it was at
the end of the last section.

            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3

Remove a few connections one at a time and ensure that at each point all
connections are as they should be.

            expect( B.disconnectFrom A, 'reason' ).toBeTruthy()
            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3

            expect( B.disconnectFrom A, 'reason' ).toBeTruthy()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toEqual [ ]
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getExternalAttribute 'connectionsOut' )
                .toEqual [ ]
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3

            expect( C.disconnectFrom C, 'premise' ).toBeTruthy()
            expect( C.disconnectFrom C, 'premise' ).toBeTruthy()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toEqual [ ]
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getExternalAttribute 'connectionsOut' )
                .toEqual [ ]
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 1
            expect( toTest.length ).toBe 1

The following section tests the three querying utilities for connections.

        it 'should give correct results from connection queries', ->

Build the same structure as in the previous section, and make the same
connections within it.

            A = new Structure(
                B = new Structure(),
                C = new Structure()
            )
            A.getID()
            B.getID()
            C.getID()
            expect( A.connectTo B, 'reason' ).toBeTruthy()
            expect( B.connectTo A, 'reason' ).toBeTruthy()
            expect( B.connectTo A, 'reason' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()

Verify that all connection queries yield correct results.

First, connections in and out of A:

            expect( A.allConnectionsIn 'reason' ).toEqual [ B.ID, B.ID ]
            expect( A.allConnectionsIn 'premise' ).toEqual [ ]
            expect( A.allConnectionsIn() )
                .toEqual [ [ B.ID, 'reason' ], [ B.ID, 'reason' ] ]
            expect( A.allConnectionsOut 'reason' ).toEqual [ B.ID ]
            expect( A.allConnectionsOut 'premise' ).toEqual [ ]
            expect( A.allConnectionsOut() ).toEqual [ [ B.ID, 'reason' ] ]

Next, connections in and out of B:

            expect( B.allConnectionsIn 'reason' ).toEqual [ A.ID ]
            expect( B.allConnectionsIn 'premise' ).toEqual [ ]
            expect( B.allConnectionsIn() ).toEqual [ [ A.ID, 'reason' ] ]
            expect( B.allConnectionsOut 'reason' ).toEqual [ A.ID, A.ID ]
            expect( B.allConnectionsOut 'premise' ).toEqual [ ]
            expect( B.allConnectionsOut() )
                .toEqual [ [ A.ID, 'reason' ], [ A.ID, 'reason' ] ]

Next, connections in and out of C:

            expect( C.allConnectionsIn 'reason' ).toEqual [ ]
            expect( C.allConnectionsIn 'premise' )
                .toEqual [ C.ID, C.ID, C.ID ]
            expect( C.allConnectionsIn() ).toEqual [
                [ C.ID, 'premise' ], [ C.ID, 'premise' ],
                [ C.ID, 'premise' ]
            ]
            expect( C.allConnectionsOut 'reason' ).toEqual [ ]
            expect( C.allConnectionsOut 'premise' )
                .toEqual [ C.ID, C.ID, C.ID ]
            expect( C.allConnectionsOut() ).toEqual [
                [ C.ID, 'premise' ], [ C.ID, 'premise' ],
                [ C.ID, 'premise' ]
            ]

Next, connections between specific pairs:

            expect( A.allConnectionsTo A ).toEqual [ ]
            expect( A.allConnectionsTo B ).toEqual [ 'reason' ]
            expect( A.allConnectionsTo C ).toEqual [ ]
            expect( B.allConnectionsTo A ).toEqual [ 'reason', 'reason' ]
            expect( B.allConnectionsTo B ).toEqual [ ]
            expect( B.allConnectionsTo C ).toEqual [ ]
            expect( C.allConnectionsTo A ).toEqual [ ]
            expect( C.allConnectionsTo B ).toEqual [ ]
            expect( C.allConnectionsTo C )
                .toEqual [ 'premise', 'premise', 'premise' ]

Finally, incoming connections reported as property lists:

            props = A.properties()
            expect( Object.keys props ).toEqual [ 'reason' ]
            expect( props['reason'] instanceof Array ).toBeTruthy()
            expect( props['reason'].length ).toBe 2
            expect( props['reason'][0] ).toBe B
            expect( props['reason'][1] ).toBe B
            props = B.properties()
            expect( Object.keys props ).toEqual [ 'reason' ]
            expect( props['reason'] instanceof Array ).toBeTruthy()
            expect( props['reason'].length ).toBe 1
            expect( props['reason'][0] ).toBe A
            props = C.properties()
            expect( Object.keys props ).toEqual [ 'premise' ]
            expect( props['premise'] instanceof Array ).toBeTruthy()
            expect( props['premise'].length ).toBe 3
            expect( props['premise'][0] ).toBe C
            expect( props['premise'][1] ).toBe C
            expect( props['premise'][2] ).toBe C

## Convenience constructions

There are two member functions, `attr` and `setup`, that are mostly just
used within this unit testing framework, for easily constructing Structure
hierarchies.  We use them here, then verify that they have created the
hierarchies we expect, so that we can use them hereafter in testing.

    describe 'Convenience constructions', ->

First, check to be sure `attr` works.  This is a short test because that
function is straightforward.

        it 'build things correctly with attr', ->
            A = new Structure(
                B = new Structure().attr { example : 'text' }
            ).attr { one : 1, two : 2 }
            expect( A.getExternalAttribute 'one' ).toBe 1
            expect( A.getExternalAttribute 'two' ).toBe 2
            expect( B.getExternalAttribute 'example' ).toBe 'text'

Next, verify that `setup` gives unique IDs to all children in the hierarchy.

        it 'give unique IDs to everybody with setup', ->
            A = new Structure(
                B = new Structure()
                C = new Structure()
            ).setup()
            expect( typeof A.ID ).toBe 'number'
            expect( typeof B.ID ).toBe 'number'
            expect( typeof C.ID ).toBe 'number'
            expect( A.ID ).not.toBe B.ID
            expect( A.ID ).not.toBe C.ID
            expect( B.ID ).not.toBe C.ID

Finally, verify that `setup` makes connections as requested by entries in
the `attr` objects, and deletes those attributes afterwards.

        it 'makes connections with setup and attr together', ->
            A = new Structure(
                B = new Structure().attr { id : 1 }
                C = new Structure().attr { 'reason for': 'previous' }
            ).attr { 'label for' : 1 }
            .setup()
            expect( A.allConnectionsIn() ).toEqual [ ]
            expect( A.allConnectionsOut() ).toEqual [ [ B.ID, 'label' ] ]
            expect( B.allConnectionsIn() )
                .toEqual [ [ A.ID, 'label' ], [ C.ID, 'reason' ] ]
            expect( B.allConnectionsOut() ).toEqual [ ]
            expect( C.allConnectionsIn() ).toEqual [ ]
            expect( C.allConnectionsOut() ).toEqual [ [ B.ID, 'reason' ] ]
            expect( A.getExternalAttribute 'label for' ).toBeUndefined()
            expect( B.getExternalAttribute 'id' ).toBeUndefined()
            expect( C.getExternalAttribute 'reason for' ).toBeUndefined()
