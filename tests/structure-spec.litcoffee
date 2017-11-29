
# Tests of the Structure class

Here we import the module we're about to test.

    { Structure } = require '../src/structure'

## Global objects

Verify that the globals exposed by the Structure module are visible.

    describe 'Structure module globals', ->
        it 'should be defined', ->
            expect( Structure ).toBeTruthy()

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

            S1.clearComputedAttribute 'alpha'
            S1.clearComputedAttribute 'b e t a'
            S2.clearComputedAttribute 'alpha'
            S2.clearComputedAttribute 'b e t a'

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
