
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 4: Validation

## Content

In this phase, we extend the formerly rudimentary `OutputStructure` class
with its most important functionality: validating steps of work.

## Goal

Instance of the `OutputStructure` class will automatically validate
themselves as they are added to the Output Tree.

## Status

This has not been implemented.  See the tasks below.

## Automatic validation enqueueing

 * [ ] Define a class variable in the `OutputStructure` class, an array of
   all instances that need to be validated.  Initialize it to the empty
   array.
 * [ ] Extend the `OutputStructure` class with an instance method that adds
   that instance to the list in that class variable iff the instance has a
   `validate()` method.
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Extend the unit tests for the `OutputStructure` module to verify
   that this works as described.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Extend the `recursiveInterpret` routine so that, for any
   `OutputStructure` instances it had to create (not just re-use from its
   cache), it calls the method that adds them to the to-validate list.
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Extend the unit tests for the `InputStructure` module to verify
   that this works as described.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.
 * [ ] Add documentation to the `OutputStructure` class, explaining that any
   subclass that wishes to implement a `validate()` routine must follow the
   following rules when it does so.
    * The functions should be written asynchronously, taking callbacks that
      notify when complete.  Care should be taken to ensure that no such
      function throws an error.  Even if some code in them malfunctions, the
      error should be caught and included as feedback in the node to be
      validated, stating that an internal error occurred in the Lurch code.
    * The result of X.validate() must be contingent only upon any
      `OutputStructure` Y accessible to X.
    * Because of the restrictions on interpretation routines, if X exists in
      the output tree, then so does everything accessible to it upon which
      it might depend.
    * Note that `validate()` routines, because they are asynchronous and may
      need to do lengthy tasks, should feel free to reference modules that
      do lengthy tasks in background threads, and send their results via
      callbacks.  (This is not a restriction, but rather an opportunity.)
      The matching module is a prime example of how this may later be used.
    * While the `validate()` routine for one `OutputStructure` instance X
      may add some other instance Y to the queue of things to validate,
      it may do so only if X is accessible to Y.
 * [ ] Rebuild the docs and commit.

## Automatic validation processing

 * [ ] In the LDE module, run `setInterval()` at module creation so that it
   regularly (many times per second, but not so often as to consume copious
   CPU) checks to see if there is anything on the list of `OutputStructure`
   instances to be validated.  If there are any such things, call their
   `validate` routines (which are asynchronous).  The order in which these
   are processed is irrelevant.
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Extend the unit tests for the LDE module to verify that this works
   as described.  That is, create some `OutputStructure` subclasses that
   have `validate` routines, and some `InputStructure` subclasses whose
   `interpret` routines produce instances of those classes that know how to
   validate themselves.  Verify that validation actually does take place.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.

## Feedback messages

 * [ ] Add a function to the LDE module that can be called whenever the
   feedback on an `OutputStructure` in the Output Tree changes, and the
   function will send a message (to any listening client) containing this
   data: the ID of the origin of the node whose feedback changed, and the
   new feedback data.
 * [ ] Update the documentation in that file to describe the changes just
   made.
 * [ ] Extend the unit tests for the LDE module to verify that this
   works as described.  First, simply, just change the feedback of some
   nodes in the Output Tree and verify that messages are sent by the LDE to
   that effect.  Then extend the tests that go from API calls to validation
   results to ensure that the entire process works, from API calls that add
   to the Input Tree to feedback messages from validation being transmitted
   back.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.
