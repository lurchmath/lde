
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 2: Basic Validation

## Content

This phase defines:

 * Statements (just atomic expressions whose contents are a string, and
   contain no child structures)
 * Definitions of the simplest rule type only: code rules written in
   JavaScript
 * Formal systems (or "mathematical topics", which are structures we can
   put rules inside of)

## Goal

This enables really simple formal systems, ones whose statements are strings
and that require no citing of premises.  Examples:

 * TriX game (in which the previous statement is always the only premise,
   and is never cited) would become possible after Phase 2.
 * A system that verifies each statement independently (e.g., arithmetic
   equations and inequalities) would also be possible.

While the intent is eventually for nontrivial validation tasks to be placed
in a queue and handled in background threads, that work is not part of
Phase 2.  A later phase will add support for it.

## Status

This phase has not yet been implemented.  Once it has been implemented, its
contents will be documented in the API Documentation available from the
navigation menu at the top of this site.

# Extending the `Structure` module

Giving feedback

 * Extend the generic `Structure` class with a convenience function called
   `feedback(a,b)` that sets the computed attribute with key "feedback" to a
   JSON object whose validation result is `a` and whose corresponding brief
   message is `b`.  If both arguments are omitted, then the "feedback"
   computed attribute is removed.  For instance, we might make calls like
   `S.feedback('valid','This rule is used correctly.')` or
   `S.feedback('invalid','You did not provide a valid reason.')`.

Event handlers

 * Extend the generic `Structure` class with new event handlers for
   `aboutToChange`, `aboutToBeInserted`, and `aboutToBeRemoved`.
 * Check to see whether the existing event handlers (`wasInserted`,
   `wasRemoved`, and `wasChanged`) are tested in the unit tests.  If not,
   add tests for them, together with tests for these new events.
 * Provide a default implementation for `aboutToBeRemoved()` that calls
   `whatCitesMe()` in the same object and stores the result in a temporary
   field in the object.  Then provide a default implementation of
   `wasRemoved()` that calls `validate()` on every structure on that list.
 * Provide default implementations of `wasInserted()` and `wasChanged()`
   that each call `validate()` in the same object, if that function exists.

Building and running functions

 * Add to the `Structure` class a class method `runFunction(f,args,cb)` that
   converts the string of JavaScript code `f` into a function (through the
   `Function` constructor), then runs it on the given set of arguments,
   sending the result to the given callback (or an error instead, using the
   standard two-argument callback signature).  This will be overridden by
   the LDE with an asynchronous method, but it needs to exist so that the
   `Structure` class is, in theory, independent of the LDE.

# Extending the `LDE` module

Building and running functions in the background

 * After loading the `Structure` module, replace its class method
   `runFunction` with one that operates asynchronously, sending the job to a
   background thread.  If the thread does not terminate in a short time,
   send back an error about termination time.  Keep track of all background
   threads that are currently running, so that the total can be queried at
   any given time.
 * Extend each of the LDE's functions (`insert`, `replace`, etc.) so that if
   it terminates without there being any currently running background
   threads then it posts a message that LDE computations are complete.
 * Extend the LDE's new implementation of `runFunction` so that whenever it
   finishes calling the callback, if there are no background threads
   running at that time, it posts the same message about computations being
   complete.

# Code-based rules

The `Rule` class will be a subclass of `Structure`, and will add support for
the following new member functions.  If `R` is an instance of `Rule` then
its `validate()` function should be as follows.

 * If `R.isA 'code'` fails, then call `R.feedback('invalid','...')` with
   a message that only code rules are supported so far.  Then jump to the
   final bullet point in this list.
 * If `R.text()` isn't valid JavaScript code that defines a function,
   then `R.feedback('invalid','...')` with a message to that effect.
   Then jump to the final bullet point in this list.
 * Otherwise `R.feedback('valid','This is a valid code rule.')`.  Then:
 * For every expression in `R.whatCitesMe()`, revalidate it.

# Statements

The `Statement` class will be a subclass of `Structure`, and will add
support for the following new member functions.  If `S` is an instance of
`Statement` then its `validate()` function should be as follows.

 * If `S.children().length > 0` then call `S.feedback('invalid','...')`
   with a message that only atomic statements supported so far.
   Then stop.
 * If `S` does not have a reason attached to it, then call
   `S.feedback()` to clear feedback, and stop.
 * If `S` has more than one reason attached to it, then call
   `S.feedback('invalid','...')` with a message that multiple reasons is
   not permitted.  Then stop.
 * Treat the one reason attached to `S` as a reference and look it up.
   If it produces no structure, call `S.feedback('invalid','...')` with a
   message that there is no such reason.  Then stop.
 * Take the object found in the previous bullet point.  If it is not an
   instance of the `Rule` subclass defined below, call
   `S.feedback('invalid','...')` with a message that the cited reason is
   not a rule.  Then stop.
 * If the cited rule has not been validated, then stop here.  (When it
   gets validated, it will trigger a re-validation of `S`.)
 * Let f be the JavaScript function defined in the text of the rule and
   call `f(S)` in a background thread.
 * If `f(S)` ends with an error, then call `S.feedback("invalid","...")`
   with a message about an internal rule error.
 * If `f(S)` does not terminate quickly, then call
   `S.feedback("invalid","...")` with a message about an internal rule
   error.
 * If `f(S)` is not a correctly formed validation result object, then
   call `S.feedback("invalid","...")` with a message about an internal
   rule error.  Note that a correctly formed validation result object
   will have a `type` ("valid", "invalid") and a `message`.
 * Otherwise call `S.feedback(f(S).type,f(S).message)`.

# Formal systems (or "mathematical topics")

The `FormalSystem` class will be a subclass of `Structure`, and will add
support for the following new member functions.  Assume `F` is an instance
of `FormalSystem` in each case.  Further assume that `S` is an instance of
`Structure` in each case.

 * `F.exports()` returns an array composed of these things, in the order
   they appear in the document:
    * any `Rule` instance in `F.children()`
    * any element of `F2.exports()` for any formal system `F2` in
      `F.children()`
 * Extend `S.lookup(label)` to also check `F.exports()` whenever it
   encounters an accessible `FormalSystem` instance.
 * Extend `S.whatCitesMe()` to also looks at the scope of `S.parent()` iff
   it is a `FormalSystem` instance (and its `parent()` iff that is a
   `FormalSystem` instance, and so on).
 * Override the default implementation of `F.wasInserted()` so that it now
   calls `R.whatCitesMe()` for every `R` in `F.exports()` and revalidates
   every structure on any of those lists.
 * Extend the implementation of `F.aboutToBeRemoved()` and `F.wasRemoved()`
   so that each propagates the call to the function of the same name in all
   structures in `F.exports()`.

# Unit testing

How we could do unit testing on this simple LDE:

 * Fire up the LDE so that its document is new and thus blank.
 * Set up a listener for the "computation finished" signals from the LDE,
   storing the results for use in testing.
 * Tell the LDE to add three children to the LDE Document: a rule, a step
   using it correctly, and a step using it incorrectly.
 * Wait until we receive the signal that says the LDE has finished
   computing.
 * Examine the computation results stored in step 2 and verify correct
   processing of the rule and two steps.

Consider each of the unusual corner cases handled above and create tests for
it, including such situations as these:

 * Send a signal to the LDE to alter the incorrect use of the rule, making
   it correct.  Wait for computation to finish and check to be sure it
   re-validated that step as correct now.
 * Insert a rule with label X, followed by a statement with label X,
   followed by a statement citing reason X.  Ensure the statement does not
   validate because it cites a non-rule.  Remove the statement labeled X.
   Ensure the remaining statement validates because it now cites rule X.
 * In a blank document, insert a statement that cites rule Y.  Then insert a
   formal system containing rule Y before the statement.  Ensure that the
   system notices, and that the statement automatically had its validation
   updated.
