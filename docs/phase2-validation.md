
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 2: Basic Validation

## Content

This phase defines:

 * Atomic expressions (just expressions whose meaning is a string, and
   contain no other structures)
 * Definitions of the simplest rule type only: code rules written in
   JavaScript
 * Formal systems (or "mathematical topics", which are structures we can
   put rules inside of)

## Goal

This enables really simple formal systems, like TriX game.

While the intent is for any of the nontrivial processing tasks to be placed
in a queue and handled when the CPU has time, I leave that hassle out of the
current design plans.  A later phase will add support for this.

## Status

This phase has not yet been implemented.  Once it has been implemented, its
contents will be documented in the API Documentation available from the
navigation menu at the top of this site.

# Atomic expressions

 * `E.goals == [ "validated" ]`
 * `E.validate()` does this:
    * If `E.children().length > 0` then
      `E.feedback("X","only atomic expressions supported so far")`
    * Otherwise `E.feedback(none,none)`
    * `E.meaning()` returns `E.text()`, but we may decide not to use a
      loaded word like "meaning" and instead just leave .text() to be
      called directly, if `.meaning()` seems too confusing or
      philosophically overcommitted
    * `E.wasChanged()` calls `E.clearComputedAttributes()`
    * We have not yet specified the implementation for
      `E.wasInserted/wasRemoved/wasChanged()`.  Does it need to call
      `validate()` in anything?

# Definitions of the simplest rules: code-based rules

 * `R.validate()` does this:
    * If `R.attributes().code!=true` then
      `R.feedback("X","only code rules are supported so far")`
    * If `R.text()` isn't valid JavaScript code that defines a function,
      then `R.feedback("X","...")`
    * Otherwise `R.feedback("check","nice code rule, dude")`
    * In any case, whenever `R.validate()` terminates, it calls
      `E.clearComputedAttributes()` for every E in `R.whatCitesMe()`.
 * Extend `E.validate()`, the routine for atomic expressions, by replacing
   its "otherwise" step with these steps:
    * If `E.attributes().reason` doesn't exist, do `E.feedback(none,none)`
      and stop.
    * Let r=`E.attributes().reason`.
    * If `E.findCited(r)` is undefined, then
      `E.feedback("X","no such rule")`
    * Let r=`E.findCited(r)`.
    * If `r.getComputedAttribute("validated")` is undefined, then stop
      here.  When r gets validated, it will trigger a re-validation of E,
      as in the final bullet point under `R.validate()`, above.
    * Let f be the JavaScript function defined in `r.text()` and call
      `f(E)`.
    * If `f(E)` ends with an error, then
      `E.feedback("X","internal rule error")`.
    * If `f(E)` doesn't terminate soon, then
      `E.feedback("X","internal rule error")`.
    * If `f(E)` is not a correctly formed validation result object, then
      `E.feedback("X","internal rule error")`.
    * Otherwise `E.feedback(f(E).type,f(E).message)`.
    * We have not yet specified the implementation for
      `R.wasInserted/wasRemoved/wasChanged()`.  Does it need to call
      `validate()` in anything?

# Formal systems (or "mathematical topics")

 * `F.exports()` returns an array composed of these things, in the order
   they appear in the document:
    * any rule in `F.children()`
    * any element of `F'.exports()` for any formal system F' in
      `F.children()`
 * Extend `S.findCited(n)` to also check `F.exports()` whenever it
   encounters an accessible formal system
 * Extend `S.whatCitesMe()` to also looks at the scope of `S.parent()` iff
   it is a formal system (and its `parent()` iff that is a formal system,
   and so on)
 * We have not yet specified the implementation for
   `S.wasInserted/wasRemoved/wasChanged()`.  Does it need to call
   `validate()` in anything?

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

We might even extend this test with more steps.

 * Send a signal to the LDE to alter the third child of the document,
   making it a correct use of the rule.
 * Wait for computation to finish and check to be sure it re-validated that
   step as correct now.
