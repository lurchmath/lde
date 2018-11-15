
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

Constructing one creates an inner instance of a `Worker` to which we will
pass many of the tasks defined below, once it is correctly set up.

        constructor : ->
            @worker = new Worker InnerScriptPath

We also build here our own event listening stack, because the one built into
the `webworker-threads` module does not yet support removing event
listeners.

            @filters = [ ]
            @worker.addEventListener 'message', ( event ) =>
                for filter, index in @filters
                    return @filters.splice index, 1 if filter event.data

When we ask the worker to do something, we will want to be able to wait for
a message of a certain type to come back to tell us the job is complete, and
then take some action.  This requires installing an event listener to wait
for the message, then uninstalling it when the message has been received.
We therefore factor this functionality out into a single method here.

Call this message with the `message` you want to send to the worker.  As the
second argument, give a function that will be called on each event coming
out of the worker and should look for the one response you care about.
Return true if you've found it, false if you haven't.  Your filter will be
uninstalled as soon as it returns true once.

        postThenWait : ( message, filter ) ->
            @filters.push filter
            @worker.postMessage message

### Support installing scripts

`Worker` instances support installing scripts in the worker.  Simply call
the following method and the appropriate message is passed to the worker.
It knows how to respond by calling its built-in `importScripts` function.
The optional callback is called when the action completes, with an object
containing a few fields describing the action taken.

        installScript : ( filename, callback ) ->
            @postThenWait install : filename, ( data, done ) ->
                if data.type is 'installed' and data.filename is filename
                    callback? data
                    yes

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.LDEWorker = LDEWorker
