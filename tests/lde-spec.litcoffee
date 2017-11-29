
# Tests of the main module

Here we import the module we're about to test.

    { LDE } = require '../src/lde.litcoffee'

## Placeholder

This section is only here temporarily, to verify that the unit testing setup
is working.

    describe 'LDE global variable', ->
        it 'should be defined', ->
            expect( LDE ).toBeTruthy()
