
# Background Workers (Internal Functions)

This file defines the functions that support the functionality we need in
the background workers the [LDE](lde.litcoffee) will use.
 * This file contains the code that will be loaded into the worker's
   background thread.  Thus here we define all the things that the workers
   can actually do.
 * [A separate file](worker.litcoffee) is intended to be imported by anyone
   who wishes to create instance of the `Worker` class; it interfaces with
   this one across the thread boundary, through message passing.

We install a global event listener that watches for several different types
of events that might come in, and responds to each separately.

    self.addEventListener 'message', ( event ) ->
        request = event.data

We also install some convenience functions for sending responses back to our
client in a uniform way.  The `succeed` function sends a success message and
the `fail` function sends a failure message.  Optional additional parameters
can be passed as an object and all their members will be copied into the
message sent back to the client.

By default, the message sent to the client contains only the same `id` as
the event to which we're responding, so that the client can match up
requests and responses correctly.  Some additional data is typically
required, depending on the request made.

        finish = ( info = { } ) ->
            response = id : request.id
            response[key] = value for own key, value of info
            self.postMessage response
        succeed = ( info = { } ) ->
            info.success = yes
            finish info
        fail = ( error, info = { } ) ->
            info.error = error
            finish info

Even simpler, you can just say what function should compute the object to
pass to `succeed` (undefined being acceptable, as the signature for
`succeed` indcates) but `fail` will be called if an error is thrown, with
that error's message.

        justDoThis = ( func ) ->
            try
                succeed func()
            catch error
                fail error.message

## Support running arbitrary code

Hey, it's a sandbox, right?  Run whatever you want.  We don't care.

        if request.type is 'run'
            justDoThis -> result : eval request.code

## Support installing scripts

If we receive a message asking us to install a script, we obey it, then call
a callback saying that we did so.

        if request.type is 'install script'
            justDoThis -> importScripts request.filename ; { }

## Support installing functions

If we receive a message asking us to install a function, we obey it, then
call a callback saying that we did so.  We use here the `Function`
constructor, knowing that the client has passed us a string containing the
argument list and body, ready for handing directly to the `Function`
constructor.

        if request.type is 'install function'
            justDoThis ->
                self[request.name] =
                    new Function request.arguments, request.body
                { }

## Support installing data

If we receive a message asking us to install or uninstall data, we obey it,
then call a callback.  Data goes in the global variables `globalData`, which
we initialize at the end of this file.  You can also uninstall data.

        if request.type is 'install data'
            justDoThis -> self.globalData[request.name] = request.data ; { }
        if request.type is 'uninstall data'
            justDoThis -> delete self.globalData[request.name] ; { }

Initialize the global data store used by the "install data" handler:

    self.globalData = { }
