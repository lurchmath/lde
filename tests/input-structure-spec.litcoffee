
# Tests of the `InputStructure` class

Here we import the module we're about to test.

    { InputStructure } = require '../src/input-structure'

This file does not test every component of that module.  It tests the
`InputStructure` class, and other classes defined in the same module are
tested in other files (for example, see
[the tests for `InputExpression`s](input-expression-spec.md) and
[the tests for `InputModifier`s](input-modifier-spec.md)).

## Global objects

Verify that the relevant globals exposed by the `InputStructure` module are
visible.

    describe 'InputStructure module globals', ->
        it 'expose the InputStructure class', ->
            expect( InputStructure ).toBeTruthy()

## Constructing instances

    describe 'InputStructure class', ->

Just do a simple verification that the constructor behaves as expected; it
can make instances of this class.

        it 'should have a functioning constructor', ->
            myIS = null
            expect( -> myIS = new InputStructure() ).not.toThrow()
            expect( myIS instanceof InputStructure ).toBeTruthy()
            expect( myIS.className ).toBe 'InputStructure'

## Propagating dirty status

If an `InputStructure` instance is marked dirty, this status is supposed to
propagate upward to its parent, and so on recursively.  We test that here.

        it 'should propagate dirty status to ancestors', ->
            A = new InputStructure(
                B = new InputStructure().attr name : 'B'
                C = new InputStructure(
                    D = new InputStructure().attr name : 'D'
                ).attr name : 'C'
            ).attr name : 'A'

Ensure that all are clean to start.

            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

Mark just the root dirty, and verify that it is dirty, but nothing else is.

            A.markDirty()
            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

Clean the root and verify that it worked.

            A.markDirty no
            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

Mark the lowest node dirty, and verify that it and all its ancestors are
dirty, but its uncle (B) is not.

            D.markDirty()
            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeTruthy()
            expect( D.isDirty() ).toBeTruthy()

Clean the lowest node, and verify that cleanness did not propagate upward.

            D.markDirty no
            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeTruthy()
            expect( D.isDirty() ).toBeFalsy()

Repeat the previous test one step higher in the tree.

            C.markDirty no
            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

And clean the root once more.

            A.markDirty no
            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()
