
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 7: Validation

## Content

In this phase, we define the Validation Phase.

## Goal

The LDE will be able to follow the Interpretation Phase with the Validation
Phase, giving semantic feedback about the validity of steps of work.

## Status

This has not been implemented.  See the tasks below.

## Making background threads easy to use

 * [x] Create a worker script that enables us to create instances of
   `WebWorker`s who are able to respond to a variety of functions for
   installing various routines and data in the workers, including:
    * [x] `worker.installScript(filename)`
    * [x] `worker.installFunction(varname,func)`
    * [x] `worker.installData(key,value)`
    * [x] `worker.uninstallData(key)`
    * [x] `worker.run(code,callback)`
    * [x] `worker.reboot(callback)` (which calls `terminate()` in the
      internal `WebWorker` instance, then discards it and replaces it with
      a new one)
 * [x] Create a new unit testing file for these advanced `WebWorker`s,
   documenting it in the same style as the rest of the test suite.
 * [x] Once it is robust and all tests pass, commit the changes.
 * [x] Create a global variable in the LDE that holds a pool of these
   workers, with a function that lets you specify the size of the pool.
   It should initialize itself, by default, to the number of threads the
   CPU supports, minus 1 for the main thread.  (The minimum value is 1.)
 * [x] Create a function in each worker for marking it available or
   unavailable.
 * [x] Create a function in the worker pool for getting the next available
   worker, or null if there isn't one.
 * [x] Add and document tests for these new features.

## The Validation Phase

 * [ ] Create a global validation pool in the LDE, which is a priority queue
   that comes with a routine for adding an `OutputStructure` instance to the
   queue, together with a priority.  This routine does nothing if the
   structure in question does not have a `validate()` routine.
 * [ ] Create a dequeueing routine from that global validation pool that
   behaves as follows:
    * If modification or interpretation is currently running, quit (do
      nothing).
    * If no worker is available, quit (do nothing).
    * If the global validation pool is empty, quit (do nothing).
    * Dequeue a structure from the validation pool and call its validation
      routine, passing it the next available worker and a callback that
      places the worker back on the list of available workers.
   We expect to define validation routines somewhat like this:
```
MyOutputStructure.validate = function ( worker, callback ) {
    worker.installScript( "some script file" );
    worker.installFunction( "foo", foo );
    worker.installData( "key", value );
    worker.run( "some code", function ( response ) {
        // here, generate feedback from response.result or response.error
        callback();
    } );
};
```
 * [ ] Call that dequeueing routine whenever a worker becomes available and
   whenever a new structure is added to the validation priority queue.
 * [ ] Make unit tests for this much functionality, in a new unit testing
   file for validation specifically.  Document such tests the usual way.
 * [ ] Extend the enqueue process so that if a structure is already
   enqueued, then enqueueing again does nothing.
 * [ ] Extend the enqueue process so that if the structure being enqueued,
   while not currently on the queue, has its validation routine still
   running in a worker, then we find and reboot that worker, mark the
   structure as no longer being validated, and *then* enqueue it as usual.
 * [ ] Create unit tests that ensure these two new behaviors work.
 * [ ] Define a function in the `OutputStructure` class that uses citation
   lookup to find all the reasons and premises that the object cites, and
   return them as a dictionary.  Call this `lookUpAllCitations()`.
 * [ ] Create a default implementation of `justChanged()` in the
   `OutputStructure` class that does the following things.
    * If the OS has no validation routine, quit (do nothing).
    * If its origin IS has a validation priority of null, send feedback from
      it saying that its validation is being skipped, then quit (do no
      more).
    * Add the OS to the global pool, using the priority in its origin IS,
      or zero if there was none.
    * Send feedback about the OS saying its validation is being recomputed.
    * Call `lookUpAllCitations()` and store its result in a field of the
      `OutputStructure` instance.
 * [ ] When interpretation ends, loop through all nodes of the Output Tree
   and do this:
    * If it is marked dirty, call `justChanged()` and stop.  Otherwise:
    * Recompute its `lookUpAllCitations()` dictionary, and if any part of it
      changed (in key or value) or any structure referenced by it is marked
      dirty, call `justChanged()`.
 * [ ] Write unit tests to ensure that the already-tested validation
   features still function when they are automatically triggered at the end
   of the implementation phase.
 * [ ] Write a new file of integration tests that test the full LDE stack of
   modification-interpretation-validation, including all the subtle types of
   situations that may arise, including changes to a premise impacting a
   conclusion's validation, changes to a label impacting whether something
   is cited, and on and on through many possibilities.

## API Documentation

 * [ ] Extend the processing phases page of the API Documentation to include
   all the work done in this phase, including validation.
 * [ ] Rebuild docs and commit.
