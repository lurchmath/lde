
# Tests of the main module

Here we import the module we're about to test.

    LDE = require '../src/lde.litcoffee'

## LDE members

The LDE module is a wrapper that collects the functionality built
throughout this repository into a single API endpoint, and exposes it.
Here we just test to be sure that it exposes all the things it's supposed
to.

    describe 'LDE global object members', ->
        it 'should be defined', ->

So far there is only one...this list will, obviously, grow.

            expect( LDE.Structure ).toBeTruthy()
