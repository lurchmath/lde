
# Tests of the Statement class

Here we import the module we're about to test.

    { Statement } = require '../src/statement'

## Global objects

Verify that the globals exposed by the FormalSystem module are visible.

    describe 'Statement class globals', ->
        it 'should be defined', ->
            expect( Statement ).toBeTruthy()
