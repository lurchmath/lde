
# Tests of the LDE Workers

Here we import the module we're about to test, plus the LDE because that
contains some Worker-related functionality that we will also be testing in
this file.

    { LDEWorker } = require '../src/worker.litcoffee'
    LDE = require '../src/lde.litcoffee'

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

## Running code in workers

We now run a test to verify that a worker can execute arbitrary code upon
command, and furthermore that it reports back to us success if and only if
the script was available for importing, and failure if it was not.

    describe 'Executing code in LDEWorkers', ->

Try a very simple computation first.

        it 'should work for basic arithmetic', ( done ) ->
            W = new LDEWorker ->
                W.run 'Math.pow(5,2)', ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    expect( response.result ).toBe 25
                    done()

Try something that involves defining and calling a function.

        it 'should work for code containing some functions', ( done ) ->
            W = new LDEWorker ->
                W.run '''
                    function henry ( j ) {
                        return j + ' --HENRY-- ' + j;
                    }
                    function prod () {
                        var result = 1;
                        for ( var i = 0 ; i < arguments.length ; i++ )
                            result *= arguments[i];
                        return result;
                    }
                    henry( prod( 2, 3, 5, 7 ) );
                ''', ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    expect( response.result ).toBe '210 --HENRY-- 210'
                    done()

Try something that causes an error and be sure it's reported.

        it 'should work for code with errors (reporting them)', ( done ) ->
            W = new LDEWorker ->
                W.run 'thisIsDefinitelyNotDefined', ( response ) ->
                    expect( response.success ).toBeUndefined()
                    expect( response.result ).toBeUndefined()
                    expect( response.error ).not.toBeUndefined()
                    expect( response.error ).toMatch \
                        /thisIsDefinitelyNotDefined/
                    done()

Try the variant of `run` that accepts a function instead of a code string.

        it 'should work when we hand it a function, too', ( done ) ->
            W = new LDEWorker ->
                W.run ->
                    recursiveSum = ( thing ) ->
                        if typeof thing is 'number'
                            thing
                        else if thing instanceof Array
                            total = 0
                            for subthing in thing
                                total += recursiveSum subthing
                            total
                        else
                            0
                    recursiveSum [ 1, [ 2 ], [ [ 3, ':)', 4 ], 5 ], 6 ]
                , ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    expect( response.result ).toBe 21
                    done()

## Installing scripts in workers

We now run a test to verify that a worker can install a script upon command,
and furthermore that it reports back to us success if and only if the script
was available for importing, and failure if it was not.

    describe 'Importing scripts into LDEWorkers', ->

The successful case:

        it 'should work when the script to import exists', ( done ) ->
            W = new LDEWorker ->
                W.installScript 'release/structure.js', ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    done()

The unsuccessful case:

        it 'should work when the script to import does not exist',
        ( done ) ->
            W = new LDEWorker ->
                W.installScript 'release/this-does-not-exist.js',
                ( response ) ->
                    expect( response.success ).toBeUndefined()
                    expect( response.error ).not.toBeUndefined()
                    expect( response.error ).toMatch \
                        new RegExp 'no such file', 'i'
                    done()

Extending the successful case to actually verifying that the script was
loaded, which we can tell by evaluating something depending on it:

        it 'should actually import the script contents', ( done ) ->
            W = new LDEWorker ->
                W.installScript 'release/structure.js', ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    W.run ( -> Object.keys Structure::subclasses ),
                    ( response ) ->
                        expect( response.success ).toBe yes
                        expect( response.error ).toBeUndefined()
                        expect( response.result ).toEqual [ 'Structure' ]
                        done()

## Installing functions in workers

We now run a test to verify that a worker can install a function upon
command, and furthermore that we can run such functions afterwards.

    describe 'Installing functions into LDEWorkers', ->

We install a single function that could be used to do a lengthy computation
on the worker's side.  We use it only to do a small computation, so that the
test suite is not bogged down finding prime numbers for no reason.  But in
principle this verifies what we need.

        it 'should let us push lengthy computations into the background',
        ( done ) ->
            findNthPrime = ( n ) ->
                counter = 1
                lastNumberChecked = 2
                while counter < n
                    lastNumberChecked++
                    isPrime = yes
                    for i in [2..Math.ceil Math.sqrt lastNumberChecked]
                        if lastNumberChecked % i is 0
                            isPrime = no
                            break
                    if isPrime then counter++
                lastNumberChecked
            W = new LDEWorker ->
                W.installFunction 'findNthPrime', findNthPrime,
                ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    W.run ( -> findNthPrime 25 ), ( response ) ->
                        expect( response.success ).toBe yes
                        expect( response.error ).toBeUndefined()
                        expect( response.result ).toBe 97
                        done()

## Installing data in workers

We now run a test to verify that a worker can install data and then run code
that uses that data.  We also verify that it is possible to uninstall data
as well.

    describe 'Installing data into LDEWorkers', ->

Verify that we can call the install data function without errors.

        it 'should let us install data', ( done ) ->
            W = new LDEWorker ->
                W.installData 'example', [ hello : 3 ], ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    done()

Verify that we can use such data once we've installed it.

        it 'should let us use installed data', ( done ) ->
            W = new LDEWorker ->
                W.installData 'example', [ hello : 3 ], ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    W.run 'globalData.example[0].hello', ( response ) ->
                        expect( response.success ).toBe yes
                        expect( response.error ).toBeUndefined()
                        expect( response.result ).toBe 3
                        done()

Verify that we can uninstall such data after installing it, and it's
verifiably gone.

        it 'should let us uninstall installed data', ( done ) ->
            W = new LDEWorker ->
                W.installData 'example', [ hello : 3 ], ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    W.uninstallData 'example', ( response ) ->
                        expect( response.success ).toBe yes
                        expect( response.error ).toBeUndefined()
                        W.run 'globalData.example', ( response ) ->
                            expect( response.success ).toBe yes
                            expect( response.error ).toBeUndefined()
                            expect( response.result ).toBeNull()
                            done()

You might expect the `response.result` value to be undefined, but the data
comes back from the worker as JSON, and thus `undefined` values are
converted into `null` as part of the JSONification process.

## Rebooting workers

We now run a test to verify that we can terminate and restart ("reboot") a
worker, which means that it will have forgotten everything that came
before.

    describe 'Rebooting LDEWorkers', ->

Install some scripts, data, and functions.

        it 'should let us reboot, which forgets scripts', ( done ) ->
            W = new LDEWorker ->
                W.installScript 'release/structure.js', ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    W.run '!!self["Structure"]', ( response ) ->
                        expect( response.success ).toBe yes
                        expect( response.error ).toBeUndefined()
                        expect( response.result ).toBeTruthy()
                        W.reboot ->
                            W.run 'self["Structure"]', ( response ) ->
                                expect( response.success ).toBe yes
                                expect( response.error ).toBeUndefined()
                                expect( response.result ).toBeFalsy()
                                done()

## Pool of Workers in the LDE

The LDE keeps a pool of workers and exposes them to us, letting us claim
them for tasks, then return them when we're done.  We test its various
functions and properties here.

    describe 'The LDE\'s global pool of workers', ->

Begin with simple sanity checks that it exists and exposes the right
functions to us (before we start testing them).

        it 'exposes the correct objects and functions', ->
            expect( LDE.WorkerPool instanceof Object ).toBeTruthy()
            expect( LDE.WorkerPool.setSize ).not.toBeUndefined()
            expect( LDE.WorkerPool.getAvailableWorker ).not.toBeUndefined()
            expect( LDE.WorkerPool.giveWorkerBack ).not.toBeUndefined()

*WARNING:* The following test assumes that it is being run on a machine with
at least 3 CPU cores.  This is the case for the development environment and
most modern computers, but others running this test suite should be aware
that it will fail on simpler hardware.  (The pool contains a number of
workers equal to the number of cores minus 1, and we test that such a number
is greater than 1.)

        it 'creates (almost) one worker per CPU core, which is >1', ->
            expect( LDE.WorkerPool.length ).toBeGreaterThan 1

We should be able to resize the pool to have more or fewer workers, and that
should work.

        it 'lets us resize the pool', ->
            originalSize = LDE.WorkerPool.length

Try length 4.

            LDE.WorkerPool.setSize 4
            expect( LDE.WorkerPool.length ).toBe 4
            expect( LDE.WorkerPool[0] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[1] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[2] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[3] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[4] ).toBeUndefined()

Try decreasing the length.

            LDE.WorkerPool.setSize 2
            expect( LDE.WorkerPool.length ).toBe 2
            expect( LDE.WorkerPool[0] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[1] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[2] ).toBeUndefined()

Try increasing the length.

            LDE.WorkerPool.setSize 5
            expect( LDE.WorkerPool.length ).toBe 5
            expect( LDE.WorkerPool[0] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[1] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[2] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[3] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[4] instanceof LDEWorker ).toBeTruthy()
            expect( LDE.WorkerPool[5] ).toBeUndefined()

We should be able to take available workers from the pool until the pool is
empty, at which point we should not be able to get any more workers.  But
we can also put workers back into the pool when we're done with them.

        it 'should correctly track available workers as we take/return', ->

If we have three workers...

            LDE.WorkerPool.setSize 3

Then we can fetch three, and they're all different, and they're all workers.

            worker1 = LDE.WorkerPool.getAvailableWorker()
            expect( worker1 instanceof LDEWorker ).toBeTruthy()
            worker2 = LDE.WorkerPool.getAvailableWorker()
            expect( worker2 instanceof LDEWorker ).toBeTruthy()
            expect( worker2 ).not.toBe worker1
            worker3 = LDE.WorkerPool.getAvailableWorker()
            expect( worker3 instanceof LDEWorker ).toBeTruthy()
            expect( worker3 ).not.toBe worker1
            expect( worker3 ).not.toBe worker2

But if we try to fetch a fourth, it doesn't work.

            shouldNotWork = LDE.WorkerPool.getAvailableWorker()
            expect( shouldNotWork ).toBeUndefined()

Now let's put some back and be sure they go back on the queue.  First just
one:

            LDE.WorkerPool.giveWorkerBack worker2
            shouldBeWorker2 = LDE.WorkerPool.getAvailableWorker()
            expect( shouldBeWorker2 ).toBe worker2
            shouldNotWork = LDE.WorkerPool.getAvailableWorker()
            expect( shouldNotWork ).toBeUndefined()

Then two:

            LDE.WorkerPool.giveWorkerBack worker1
            LDE.WorkerPool.giveWorkerBack worker3
            shouldBeWorker1 = LDE.WorkerPool.getAvailableWorker()
            expect( shouldBeWorker1 ).toBe worker1
            shouldBeWorker3 = LDE.WorkerPool.getAvailableWorker()
            expect( shouldBeWorker3 ).toBe worker3
            shouldNotWork = LDE.WorkerPool.getAvailableWorker()
            expect( shouldNotWork ).toBeUndefined()
