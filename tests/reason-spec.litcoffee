
# Tests of the Reason class

Here we import the module we're about to test.

    { Reason } = require '../src/reason'

## Global objects

Verify that the globals exposed by the FormalSystem module are visible.

    describe 'Reason class globals', ->
        it 'should be defined', ->
            expect( Reason ).toBeTruthy()
