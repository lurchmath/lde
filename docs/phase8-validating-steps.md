
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 8: Validating Steps

## Content

In this phase, we unite all the preceding phases into a design for how to
do the core operation of Lurch: validating a step of work.

## Goal

By the end of this phase, the LDE will be able to give feedback on input,
which is its core purpose.

## Status

This has not been implemented.  In fact, the design below has not yet been
converted into actionable tasks.  So the next steps are to do that
conversion, and then execute the resulting tasks.

## Design

Recall from the conclusions at the end of [phase 4](phase4-validation.md)
that the only things that get validated are steps of work.

### The `OutputStep` validation routine

As defined in [phase 7](phase7-citations.md), an `OutputStep` will have as
one of its attributes a list of rules that the user has attached to it.  Now
we stipulate that each `OutputRule` must have a routine `.validate(step)`,
and that the `.validate()` routine for the `OutputStep` class just does
this:  For the first rule `R` in the step's `rules` list, try `R.validate()`
on the step.  If it marks the step valid, then use that feedback and stop.
If not, try the next rule, and so on.  If none of them mark the step valid,
give feedback saying that none of the possible rules applies.

Therefore subclasses of `OutputStep` do not define their own type of
validation routines.  They all use the same validation routine, which defers
to the list of rules attached to the step.  Steps cite rules, and delegate
their validation to them.  That one routine can include careful error
handling (with `try`/`catch`, and paying attention to asynchronous error
parameters) so that error handling is installed once for all.

### Background on background processes

The `OutputRule` class will maintain a global list of Web Workers, each
flagged with the specific subclass of `OutputRule` that created that worker
and initialized it with validation tools (as described next, in this same
section).  Whenever any rule instance asks for a Web Worker to use for
validation, the `OutputRule` class will either find an inactive one that's
already been created and ready to validate instances of that subclass, or it
will create a new one if none exist.  When such a worker finishes doing its
job, it gets added to the pool of inactive workers ready for use later.

Each of these workers will be pre-loaded with bootstrap code that knows to
watch for and obey certain types of messages from the main thread,
specifically, messages that tell it to install new features in itself, such
as functions, data, and pre-existing code modules.  So a Lurch Web Worker
will know how to, say, load the matching package, or the parsing package, or
install an arbitrary function given to it by the main thread, and so on.  We
can implement this by making a subclass of `Worker`, called `LurchWorker`,
that has these features.  Then for a `LurchWorker` `L`, you can call
`L.loadScript()` or `L.installFunction()` or `L.installData()` or
`L.runFunction()` or whatever.

Every subclass of `OutputRule` will have a set of tools it needs to have
installed in a Web Worker.  Specifically, it should implement a function
`.setupWorker(L)` that takes a `LurchWorker` `L` as parameter and makes all
the appropriate calls to `L.loadScript()`, `L.installFunction()`, and so on.
We require that `.setupWorker(L)`, in particular, install a function called
`.validate()`, which runs the validation algorithm on whatever data has been
installed in `L`, and sends the results back (later) in the usual way that
JavaScript Web Workers notify their parent threads of events/results/etc.,
that is, through a call to `postMessage()`, passing any necessary data (such
as validation feedback).

### `OutputRule` validation routines

Consider an `OutputRule` `R` is cited by an `OutputStep` `S`.

Although informally, above, we spoke of a function `R.validate(S)`, the
actual signature is `R.validate(S,callback)`, because validation is
asynchronous.  Consequently, the loop through rules mentioned earlier will
be a series of connected callbacks (or uses of `await`), rather than a
synchronous loop.

As described above, `R.validate(S,callback)` begins by loading/creating a
`LurchWorker` `L` that knows how to do validation for the specific
`OutputRule` subclass of which `R` is an instance.  (Note: Use
`object.constructor` or `object.constructor.name` to get a "class" or its
name in JavaScript or CoffeeScript.)

The rule `R` will then need to tell the worker `L` about the specifics of
the step `S` (e.g., the step itself, its cited premises, any other options),
so that validation can be run on that specific data.  (Recall that `S` is an
object in the LDE thread, and it is not possible to send objects across
thread boundaries (into `L`, in this case) without first converting them to
JSON.  For this reason, the `OutputStructure` class must define a
`.toJSON()` routine, and every `LurchWorker` should have installed in it the
inverse routine, for reconstituting an `OutputStructure` from JSON data.)
We require each `OutputRule` subclass to define a function
`R.prepareToValidate(L,S)` that prepares `L` to validate `S` by exporting
all the relevant data about `S` (and any relevant `OutputStructure`s
accessible to it) from the LDE into `L`, using `S.toJSON()`,
`L.installData()`, and so on.

(In order to help enforce the constraint that validation is supposed to be
contingent upon only those structures accessible to the one being validated,
we may create a convenience function `L.installStructure()` that does the
conversion to and from JSON for us, but checks to be sure that only
accessible structures are transferred.)

`R` will then call `L.runFunction('validate')`.  It will also install an
event listener so that when `L` sends back a message (either that validation
is complete or that an error occurred), `R` hears about it and can react.
Specifically, `R`'s reaction will be to call the `callback` function
provided to `R.validate(S,callback)`, passing the validation feedback.

Because all validation is therefore shipped into background processes like
`L`, it is therefore perfectly acceptable for those processes to do lengthy
computations, such as trying all permutations of ordered premises when
matching.

Thus each `OutputRule` subclass will not implement its own `.validate()`
routine, but rather its own `.prepareToValidate()` and `.setupWorker()`
routines.  The latter installs the actual validation algorithms, and the
former installs the necessary parameters.  But `.validate()` can be defined
once for all in the `OutputRule` class itself.  Consequently, we can place
extensive error handling there, in several different ways:

 * `try`/`catch` blocks where needed
 * paying attention to asynchronous error parameters
 * listening for the `onerror` event of the worker
 * watching the worker to make sure it does not exceed a maximum time limit
   (e.g., 10 seconds, or whatever the user's settings dictate)
