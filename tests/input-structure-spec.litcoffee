
# Tests of the `InputStructure` class

Here we import the module we're about to test.

    { InputStructure } = require '../src/input-structure'

## Global objects

Verify that the globals exposed by the `InputStructure` module are visible.

    describe 'InputStructure module globals', ->
        it 'should be defined', ->
            expect( InputStructure ).toBeTruthy()

## Structure trees

    describe 'InputStructure class', ->

Just do a simple verification that the constructor behaves as expected; it
can make instances of this class.

        it 'should have a functioning constructor', ->
            myIS = null
            expect( -> myIS = new InputStructure() ).not.toThrow()
            expect( myIS instanceof InputStructure ).toBeTruthy()
            expect( myIS.className ).toBe 'InputStructure'
