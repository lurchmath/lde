
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

 * [ ] Create a worker script that enables us to create instances of
   `WebWorker`s who are able to respond to a variety of functions for
   installing various routines and data in the workers, including:
    * [x] `worker.installScript(filename)`
    * [x] `worker.installFunction(varname,func)`
    * [x] `worker.installData(key,value)`
    * [x] `worker.uninstallData(key)`
    * [x] `worker.run(code,callback)`
    * [ ] `worker.reboot(callback)` (which calls `terminate()` in the
      internal `WebWorker` instance, then discards it and replaces it with
      a new one)
 * [ ] Create a new unit testing file for these advanced `WebWorker`s,
   documenting it in the same style as the rest of the test suite.
 * [ ] Once it is robust and all tests pass, commit the changes.
 * [ ] Create a global variable in the LDE that holds a pool of these
   workers, with a function that lets you specify the size of the pool.
   It should initialize itself, by default, to the number of threads the
   CPU supports, minus 1 for the main thread.  (The minimum value is 1.)
 * [ ] Create a function in each worker for marking it available or
   unavailable.
 * [ ] Create a function in the worker pool for getting the next available
   worker, or null if there isn't one.
 * [ ] Add and document tests for these new features.

## The Validation Phase

 * [ ] Create a global validation pool in the LDE, which is a priority queue
   that comes with a routine for adding an `OutputStructure` instance to the
   queue, after first verifying that it has a `validate()` routine.
 * [ ] Create a routine that, if a worker is available, dequeues a structure
   from the validation pool and calls its validation routine, passing it the
   available worker.  If one is not available, this routine does nothing.
   In the callback that routine passes the validation routine, place the
   worker back on the list of available workers.  Also, the routine does
   nothing in the case where modification or interpretation is currently
   running.  We expect to define validation routines somewhat like this:
```
MyOutputStructure.validate = function ( callback, worker ) {
    worker.installScript( "some script file" );
    worker.installFunction( "foo", foo );
    worker.installData( "key", value );
    worker.run( "some code", function ( result, error ) {
        // here, generate feedback from result and/or error
        callback();
    } );
};
```
 * [ ] Call that dequeueing routine whenever a worker becomes available.
 * [ ] Make unit tests for this much functionality, in a new unit testing
   file for validation specifically.  Document such tests the usual way.
 * [ ] Extend the enqueue process so that if a structure is already
   enqueued, then enqueueing again does nothing.
 * [ ] Extend the enqueue process so that if the structure being enqueued,
   while not currently on the queue, has its validation routine still
   running in a worker, then we find and reboot that worker, mark the
   structure as no longer being validated, and *then* enqueue it as usual.
 * [ ] Create unit tests that ensure these behaviors work.
 * [ ] Create a default implementation of `justChanged()` in the
   `OutputStructure` class that does the following things.
    * If the OS has a validate routine, add it to the global pool.  If its
      origin IS has a validation priority, use that, otherwise use zero.  If
      its origin has a validation priority of null, skip this step (no
      enqueueing).  If you enqueue the OS, emit feedback saying its
      validation is being recomputed.  If it had null priority, emit
      feedback saying that its validation is being skipped.
    * If any OS in the scope of this one cites this one, then add that other
      OS to the validation pool.  Set priorities and emit feedback in the
      same way.
 * [ ] Call the dequeueing routine whenever interpretation ends.
 * [ ] Write unit tests to ensure that the already-tested validation
   features still function when they are automatically triggered at the end
   of the implementation phase.

## API Documentation

 * [ ] Extend the processing phases page of the API Documentation to include
   all the work done in this phase, including validation.
 * [ ] Rebuild docs and commit.
