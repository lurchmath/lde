
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
                W.run 'Object.keys( Structure.prototype.subclasses )',
                ( response ) ->
                    expect( response.success ).toBe yes
                    expect( response.error ).toBeUndefined()
                    expect( response.result ).toEqual [ 'Structure' ]
                    done()
