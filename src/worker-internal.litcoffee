
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

## Support installing scripts

If we receive a message asking us to install a script, we obey it, then call
a callback saying that we did so.

        if event.data.hasOwnProperty 'install'
            result =
                type : 'installed'
                filename : event.data.install
            try
                importScripts event.data.install
                result.success = yes
            catch e
                result.error = e
            self.postMessage result
