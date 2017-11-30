
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

The final test in this section is whether we can replace structures in an
existing hierarchy with new structures, and retain the integrity and correct
structure of the hierarchy.

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
