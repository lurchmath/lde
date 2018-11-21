
# Background Workers (Class Definition)

This file defines a class that encapsulates the functionality we need in the
background workers the [LDE](lde.litcoffee) will use.
 * This file is intended to be imported by anyone who wishes to create
   instance of the `Worker` class.
 * [A separate file](worker-internal.litcoffee) contains the code that will
   be loaded into the worker's background thread to give it the
   functionality with which this class interfaces.

## Import modules

Import the `Worker` class if it isn't already defined.  In the browser, it
should already be defined.  But in Node.js, we need to import the
`webworker-threads` package to define it.

Also, if we're in Node.js, then we assume (for now) that we are being run
as part of the unit tests of the LDE, from the root of the project
repository.  We therefore set a different path to the inner script the
workers need to load than we would set in the browser.

Later, we will want to support Node.js-based uses of this module other than
in the unit testing suite, and this will need to be made more flexible.

    if require? and not Worker?
        { Worker } = require 'webworker-threads'
        InnerScriptPath = 'release/worker-internal.js'
    else
        InnerScriptPath = 'worker-internal.js'

## Define the `LDEWorker` Class

We define a class that clients of this module can create and treat as the
encapsulation of a background thread.  We call it `LDEWorker` because of
course `Worker` is already taken in the browser namespace.

    class LDEWorker

We need a simple method for associating callbacks with tasks we send to the
worker, so we have the following functions that assign unique IDs to
callbacks when asked, retrieve such callbacks by their ID, and delete them
when we're done with them.

        saveCallback : ( callback ) ->
            nextFreeId = 0
            while @callbacks.hasOwnProperty nextFreeId then nextFreeId++
            @callbacks[nextFreeId] = callback
            nextFreeId
        runAndClearCallback : ( data ) ->
            callback = @callbacks[data.id]
            delete @callbacks[data.id]
            delete data.id
            callback? data

We leverage the above two routines in the event handler for the internal
`Worker` object, installed by the following routine.

        setup : ( callback ) ->
            @worker = new Worker InnerScriptPath
            @whenReady callback

This event handler is for all messages coming out of the worker.  We
guarantee, in the worker's code, that every response message that comes back
will contain the same ID that was given in the request for which it is the
response.  This allows us to look up and call the correct callback, then
uninstall that callback because the task is complete.

            @worker.addEventListener 'message', ( event ) =>
                if event.data.type is 'loaded'
                    callback() for callback in @loadedCallbacks
                    @loadedCallbacks = [ ]
                else
                    @runAndClearCallback event.data

The parameter to the constructor is optional, and if provided, will be
called when the worker has finished loading its internal scripts and is
ready to receive commands.  We leverage the `setup` function defined above
to do setup of the internal `Worker` object.

        constructor : ( callback ) ->
            @callbacks = { }
            @loadedCallbacks = [ ]
            @setup callback

Clients can tell whether the worker is ready to receive messages with the
following function.

        isReady : -> @loadedCallbacks.length > 0
        whenReady : ( callback ) ->
            if @isReady()
                callback?()
            else
                if callback then @loadedCallbacks.push callback

The following function abstracts the idea of sending a message to the worker
and associating a callback with it.

        dispatch : ( message, callback ) ->
            message.id = @saveCallback callback
            @worker.postMessage message

### Running code in a worker

The chief purpose of background threads is to run code and then notify you
when it's done, and what the result was.  We provide the following API for
doing so.  It is essentially a simple `eval` call in the worker, with all
the appropriate caveats that come with that.

The first argument can be a string of code or a JavaScript function.  If it
is the latter, realize that it will be converted to a string and transferred
into the worker before being run, so global variables in it will be
evaluated in the worker's context.

        run : ( codeOrFunction, callback ) ->
            if typeof codeOrFunction is 'function'
                codeOrFunction = "(#{codeOrFunction})()"
            @dispatch type : 'run', code : codeOrFunction, callback

But if you wish to run an asynchronous function, use the following instead.
Provide either a function that takes as parameter a callback with the
standard result-and-error signature (which it calls upon completing its work
or encountering an error, making only one of the parameters non-null) or a
string of code that defines such a function.  As with the previous, your
callback will be called with a message of the same format when the work is
complete.

        runAsync : ( codeOrFunction, callback ) ->
            if typeof codeOrFunction is 'function'
                codeOrFunction = "(#{codeOrFunction})"
            @dispatch type : 'runAsync', function : codeOrFunction, callback

### Support installing scripts

`Worker` instances support installing scripts in the worker.  Simply call
the following method and the appropriate message is passed to the worker.
It knows how to respond by calling its built-in `importScripts` function.
The optional callback is called when the action completes, with an object
containing a few fields describing the action taken.

        installScript : ( filename, callback ) ->
            @dispatch
                type : 'install script'
                filename : filename
            , callback

### Support installing functions

If you have your own function in the main thread, and want it installed in a
worker, you can call this function to put it there.  But remember that it is
going to be copied over based on its syntax, not as a closure.  Any global
variables mentioned in the function will have meaning in the worker's
context, not the main thread's.

The first parameter is the global variable name to use for the function, in
the worker's context.  The second parameter should be a function, which will
be dissected into its argument list and body on this side, those transmitted
to the worker, and the function contructor used on that side to reassemble
it into a function.  This is faster and safer than `eval`.

        installFunction : ( name, func, callback ) ->
            func = "#{func}"
            args = func.substring func.indexOf( '(' ) + 1,
                                  func.indexOf( ')' )
            body = func.substring func.indexOf( '{' ) + 1,
                                  func.lastIndexOf( '}' )
            @dispatch
                type : 'install function'
                name : name,
                arguments : args
                body : body
            , callback

### Support installing data

Naturally, users of workers will want not only to install functions in the
workers, but also sometimes pass nontrivial amounts of data to those
functions.  Rather than pass it as literals inside code passed to the `run`
function, it is better if we have a utility for copying chunks of JSON data
into a global variable in the worker.  This is especially useful if the
worker is to operate on the same data repeatedly, or to modify the data in
phases.

We thus provide the following function.  The data you provide must be JSON,
hence the parameter name.  It will be stored in the global variable
`globalData` in the worker, under the key you provide.  Essentially, a
`globalData[yourKey] = yourJSONData` statement will be executed in the
worker.  You can thus make calls later that look up this stored data using
`globalData[yourKey]` in the code.

        installData : ( name, jsonData, callback ) ->
            @dispatch
                type : 'install data'
                name : name,
                data : jsonData
            , callback

You can also clear out such stored data using this:

        uninstallData : ( name, callback ) ->
            @dispatch type : 'uninstall data', name : name, callback

### Support rebooting workers

If you want to start with a fresh worker (perhaps because you don't want it
to have any longer some of the scripts you loaded or because it's gone on
too long computing something and you need to terminate it), use this
function.  It terminates the internal Worker object and replaces it with a
fresh one, calling the callback when this process is complete.

        reboot : ( callback ) ->
            @worker?.terminate()
            @setup callback

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.LDEWorker = LDEWorker
