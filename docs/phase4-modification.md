
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 4: Expressions and Modifiers

## Content

In this phase, we specialize the `InputStructure` class into two subclasses,
`InputExpression` and `InputModifier`.

## Goal

The `InputExpression` and `InputModifier` classes will exist with all their
methods and the Modification phase will be implemented.

## Status

All essential work on this phase is complete.  What remains is optional
efficiency improvements, documented in the following section.  These were
not implemented at first because it is not clear that they are necessary,
and it would be a waste of development time for no clear benefit.  But if
later performance bottlenecks arise that could be solved by any of the ideas
expressed below, the plans are written here for execution.

## Optional efficiency improvements for later

First, efficiency improvements to the `updateData()` and `updateDataIn()`
routines:

 * [ ] Write a function that creates a backup copy of all attributes in an
   `InputExpression` that were set by modifiers, by looping through all
   attribute keys, and when it encounters any of the form `"_modified $k$"`,
   it lifts out the value associated with $k$ and stores a copy of it in
   the backup being generated.  That backup object is returned.
 * [ ] Extend the unit tests for `InputExpression`s to test this new
   routine and document such tests.
 * [ ] Write a function for comparing the state of an `InputExpression` to
   such a backup, either reporting that its set of attributes changed by
   modifiers matches the backup (nothing has changed) or it does not
   (something was added, removed, or changed by an IM).
 * [ ] Extend the unit tests for `InputExpression`s to test this new
   routine and document such tests.
 * [ ] Call the backup routine in the target at the start of the
   `updateData()` function in `InputExpression`.  At the end, mark the
   expression dirty if and only if its new state is different from its
   original state in some attribute set by a modifier.
 * [ ] Extend the unit tests for `InputExpression`s to test this new
   routine and document such tests.
 * [ ] Once the unit tests pass, build everything and commit.

Second, efficiency improvements to the modification phase overall:

 * [ ] Enhance `runModification()` to initialize a list of `InputModifier`
   instances that are to be processed, then start a chain of `setTimeout()`
   calls that pop things off the list and process them, calling the callback
   when the list is empty.  (Use extremely brief timeout delays.)
 * [ ] Ensure that the unit tests still handle this asynchronous version.
 * [ ] Enhance `runModification()` so that, if any LDE API call is made
   while the modification phase is ongoing, it resets the list of instances
   to process to be the entire set of `InputModifier`s in the Input Tree,
   thus restarting the whole modification process.
 * [ ] Extend the unit tests to test this feature.  That is, make some
   `updateConnections()` routines that take a long time to compute (say, 0.5
   seconds) and that also log their calls to a global array.  Make a set of
   API calls in succession about 0.3 seconds apart, and ensure that the
   global call log is as expected.
 * [ ] Extend each of the four LDE API functions so that it calls
   `markDirty()` on the appropriate `InputStructure` instance, then
   `runModification()`.
 * [ ] Update the documentation to describe the changes just made.
 * [ ] Extend the unit tests for the LDE module to verify that this works.
 * [ ] Once the unit tests pass, build everything and commit.
