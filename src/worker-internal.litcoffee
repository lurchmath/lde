
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

## Support installing scripts

If we receive a message asking us to install a script, we obey it, then call
a callback saying that we did so.

        if request.type is 'install'
            try
                importScripts request.filename
                succeed()
            catch error
                fail error.message
