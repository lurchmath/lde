
# Tests of the LDE Workers

Here we import the module we're about to test.

    { LDEWorker } = require '../src/worker.litcoffee'

## Worker module members

We begin by verifying that the Worker module contains all of the expected
functions and objects, and that we can construct instances of the classes.

    describe 'LDEWorker module members', ->

Verfiy that all the API endpoints that should be exported by the module are
indeed exported.

        it 'should be defined', ->
            expect( LDEWorker ).toBeTruthy()

Verify that we can construct workers.

        it 'should let us construct workers', ->
            expect( -> new LDEWorker() ).not.toThrow()
            expect( new LDEWorker() instanceof LDEWorker ).toBeTruthy()

## Installing scripts in workers

We now run a test to verify that a worker can install a script upon command,
and furthermore that it reports back to us success if and only if the script
was available for importing, and failure if it was not.

    describe 'Importing scripts into LDEWorkers', ->

The successful case:

        it 'should work when the script to import exists', ( done ) ->
            W = new LDEWorker()
            W.installScript 'release/structure.js', ( result ) ->
                expect( result.success ).toBe yes
                done()
