
# Tests of the `OutputStructure` class

Here we import the module we're about to test.

    { OutputStructure } = require '../src/output-structure'

## Global objects

Verify that the globals exposed by the `OutputStructure` module are visible.

    describe 'OutputStructure module globals', ->
        it 'should be defined', ->
            expect( OutputStructure ).toBeTruthy()

## Structure trees

    describe 'OutputStructure class', ->

Just do a simple verification that the constructor behaves as expected; it
can make instances of this class.

        it 'should have a functioning constructor', ->
            myOS = null
            expect( -> myOS = new OutputStructure() ).not.toThrow()
            expect( myOS instanceof OutputStructure ).toBeTruthy()
            expect( myOS.className ).toBe 'OutputStructure'

## Setting dirty status (not propagating)

If an `OutputStructure` instance is marked dirty, this status is for itself
alone.  Unlike with `InputStructure` instances, it does not propagate that
status upward to its parent.  We test that here.

        it 'should not propagate dirty status to ancestors', ->
            A = new OutputStructure(
                B = new OutputStructure().attr name : 'B'
                C = new OutputStructure(
                    D = new OutputStructure().attr name : 'D'
                ).attr name : 'C'
            ).attr name : 'A'

Ensure that all are dirty to start.

            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeTruthy()
            expect( C.isDirty() ).toBeTruthy()
            expect( D.isDirty() ).toBeTruthy()

Then clean them all to prepare for further testing, and verify that it
worked.

            A.markDirty no
            B.markDirty no
            C.markDirty no
            D.markDirty no
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

Mark the lowest node dirty, and verify that only it is dirty, none of its
ancestors are, nor is its uncle, B.

            D.markDirty()
            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeTruthy()

Clean the lowest node, and verify that all are clean.

            D.markDirty no
            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()
