
# Tests of the Label class

Here we import the module we're about to test.

    { Label } = require '../src/label'

## Global objects

Verify that the globals exposed by the FormalSystem module are visible.

    describe 'Label class globals', ->
        it 'should be defined', ->
            expect( Label ).toBeTruthy()
