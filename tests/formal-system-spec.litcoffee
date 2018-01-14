
# Tests of the FormalSystem class

Here we import the module we're about to test.

    { FormalSystem } = require '../src/formal-system.litcoffee'

## Global objects

Verify that the globals exposed by the FormalSystem module are visible.

    describe 'FormalSystem class globals', ->
        it 'should be defined', ->
            expect( FormalSystem ).toBeTruthy()
