
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

## Running code in workers

We now run a test to verify that a worker can execute arbitrary code upon
command, and furthermore that it reports back to us success if and only if
the script was available for importing, and failure if it was not.

    describe 'Executing code in LDEWorkers', ->

Try a very simple computation first.

        it 'should work for basic arithmetic', ( done ) ->
            ( new LDEWorker() ).run 'Math.pow(5,2)', ( response ) ->
                expect( response.success ).toBe yes
                expect( response.error ).toBeUndefined()
                expect( response.result ).toBe 25
                done()

Try something that involves defining and calling a function.

        it 'should work for code containing some functions', ( done ) ->
            ( new LDEWorker() ).run '''
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
            ( new LDEWorker() ).run 'thisIsDefinitelyNotDefined',
            ( response ) ->
                expect( response.success ).toBeUndefined()
                expect( response.result ).toBeUndefined()
                expect( response.error ).not.toBeUndefined()
                expect( response.error ).toMatch \
                    /thisIsDefinitelyNotDefined/
                done()

Try the variant of `run` that accepts a function instead of a code string.

        it 'should work when we hand it a function, too', ( done ) ->
            ( new LDEWorker() ).run ->
                recursiveSum = ( thing ) ->
                    if typeof thing is 'number'
                        thing
                    else if thing instanceof Array
                        total = 0
                        total += recursiveSum subthing for subthing in thing
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
            W = new LDEWorker()
            W.installScript 'release/structure.js', ( response ) ->
                expect( response.success ).toBe yes
                expect( response.error ).toBeUndefined()
                done()

The unsuccessful case:

        it 'should work when the script to import does not exist',
        ( done ) ->
            W = new LDEWorker()
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
            W = new LDEWorker()
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
            W = new LDEWorker()
            W.installFunction 'findNthPrime', findNthPrime, ( response ) ->
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
            ( new LDEWorker() ).installData 'example', [ hello : 3 ],
            ( response ) ->
                expect( response.success ).toBe yes
                expect( response.error ).toBeUndefined()
                done()

Verify that we can use such data once we've installed it.

        it 'should let us use installed data', ( done ) ->
            W = new LDEWorker()
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
            W = new LDEWorker()
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
