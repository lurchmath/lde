
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

This has not been implemented.  See the tasks below.

## `InputExpression` class

 * [x] Create a subclass of `InputStructure`, in the `InputStructure`
   module, called `InputExpression`.
 * [x] Add documentation explaining what it is and will do (though that
   documentation can grow with time).
 * [x] Ensure that the `InputExpression` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'InputExpression', InputExpression` in
   the `InputExpression` class code.)
 * [x] Create a new unit test file for `InputExpression`s that is extremely
   basic, just testing to be sure that the symbol `InputExpression` is
   defined at the global scope and creates things that are instances of the
   `InputStructure` class.
 * [x] Add documentation for that unit test file, following the pattern
   established in the documentation of other unit test files in this
   repository.
 * [x] Once the unit tests pass, build everything and commit.

## Convenience functions

All of the following functions should be added as members in the
`InputExpression` class.

 * [ ] A function for marking an attribute of the expression as having been
   changed by an `InputModifier` (a class that we will define later, as
   described below).  If the function is called on attribute key `k`, it
   could, for example, just call `X.setAttribute( "IM changed "+k, true )`.
 * [ ] Extend the new unit test file for `InputExpression`s to test this
   new routine and document such tests.
 * [ ] A function for creating a backup copy of all attributes set by
   modifiers, which loops through all attribute keys, and when it encounters
   any of the form "IM changed $k$", it lifts out the value associated with
   $k$ and stores a copy of it in the backup being generated.  That backup
   object is returned.
 * [ ] Extend the new unit test file for `InputExpression`s to test this
   new routine and document such tests.
 * [ ] A function for comparing the state of an `InputExpression` to such a
   backup, either reporting that its set of attributes changed by modifiers
   matches the backup (nothing has changed) or it does not (something was
   added, removed, or changed by an IM).
 * [ ] A function for deleting all attributes set by modifiers (which not
   only deletes a pair $(k,v)$, but also the corresponding attribute with
   key "IM changed $k$").
 * [ ] Extend the new unit test file for `InputExpression`s to test this
   new routine and document such tests.
 * [ ] A function `setSingleValue(k,v)` that first checks whether the
   expression has an attribute with key $k$.  If so, it returns false and
   takes no further action.  If it doesn't have such an attribute, this one
   adds it and marks it as having been changed by a modifier.  Thus this
   function is intended only to be called by IMs.  In such a case, it
   returns true.
 * [ ] Extend the new unit test file for `InputExpression`s to test this
   new routine and document such tests.
 * [ ] A function `addListItem(k,i)` that first checks whether the
   expression has an attribute with key $k$ and value an array.  If not,
   it sets the value to `[ i ]`, an array containing the item `i`.  If it
   already had an array value, we append `i` to it.  In either case, we mark
   this as having been changed by a modifier.  Thus this function is
   intended only to be called by IMs.
 * [ ] Extend the new unit test file for `InputExpression`s to test this
   new routine and document such tests.
 * [ ] A function `addSetElement(k,e)` that first checks whether the
   expression has an attribute with key $k$ and value an array.  If not,
   it sets the value to `[ e ]`, a set containing the element `e`.  If it
   already had an array value, we append `e` to it iff it was not already in
   the array.  In any of these cases (even the one where nothing changed),
   we mark this as having been changed by a modifier.  Thus this function is
   intended only to be called by IMs.
 * [ ] Extend the new unit test file for `InputExpression`s to test this
   new routine and document such tests.
 * [ ] Once the unit tests pass, build everything and commit.

## `InputModifier` class

 * [ ] Create a subclass of `InputStructure`, in the `InputStructure`
   module, called `InputModifier`.
 * [ ] Add documentation explaining what it is and will do (though that
   documentation can grow with time).
 * [ ] Ensure that the `InputModifier` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'InputModifier', InputModifier` in
   the `InputModifier` class code.)
 * [ ] The class should provide two functions that, in the base class, do
   nothing, but will be overridden by subclasses to do something smarter.
   These are `updateConnections()` and `updateDataIn(target)`.  Add these
   stubs now.
 * [ ] Document the two functions you just added regarding their purposes
   in subclasses.
 * [ ] Create a new unit test file for `InputModifier`s that is extremely
   basic, just testing to be sure that the symbol `InputModifier` is
   defined at the global scope and creates things that are instances of the
   `InputStructure` class.
 * [ ] Add documentation for that unit test file, following the pattern
   established in the documentation of other unit test files in this
   repository.
 * [ ] Once the unit tests pass, build everything and commit.

## `BasicInputModifier` class

 * [ ] Create a subclass of `InputModifier`, in the `InputStructure`
   module, called `BasicInputModifier`.  It takes a set of key-value-type
   triples at construction time and stores them for later embedding in a
   target.  The "type" of the triple will be which kind of function should
   be used to insert it (single value, list item, set element).
 * [ ] Override the `updateDataIn(target)` function to embed exactly those
   key-value pairs in the target.  Take care to ensure that copies of values
   are used rather than the original objects.  Be sure to use the
   appropriate functions that will mark the attribute as having been set by
   an `InputModifier`.
 * [ ] Add documentation explaining what it is and does.
 * [ ] Ensure that the `BasicInputModifier` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'BasicInputModifier', BasicInputModifier`
   in the `BasicInputModifier` class code.)
 * [ ] Create a new unit test file for `BasicInputModifier`s that not only
   ensures that the symbol `BasicInputModifier` is defined at the global
   scope and that its instances are also instances of the `InputStructure`
   class, but also that the `updateDataIn(target)` function behaves as
   intended.
 * [ ] Add documentation for that unit test file, following the pattern
   established in the documentation of other unit test files in this
   repository.
 * [ ] Once the unit tests pass, build everything and commit.

## Extending `InputExpression`

 * [ ] Implement `InputExpression`'s `updateData()` function to loop through
   all `InputModifiers` that connect to it as the target and call their
   `updateDataIn()` routines on itself.  Be sure to begin by using the
   function that clears out all attributes set by a modifier.
 * [ ] Create unit tests for this, probably located in the `InputExpression`
   unit test file.
 * [ ] Increase efficiency by calling the backup routine in the target
   first, and at the end marks itself dirty if and only if its new state is
   different from its original state in some attribute set by a modifier.
   (Note that this task, since it is just an increase in efficiency, can be
   deferred until later in the project, and can even be considered optional
   if we notice no performance problems without implementing it.)
 * [ ] Extend the unit tests to handle this new feature.
 * [ ] Once the unit tests pass, build everything and commit.

## The Modification Phase

 * [ ] Implement a `runModification()` method in the LDE module.  It should
   run the `updateConnections()` function in every IM in the Input Tree, in
   an unspecified order, and then call a callback.  (This function is
   asynchronous.)

The remainder of this section is efficiency improvements.  Consequently,
they can be deferred until later in the project, and can even be considered
optional if we notice no performance problems without implementing them.  If
you wish to skip them for now, simply jump to the last few tasks in this
section, about unit tests and documentation.

 * [ ] Extend the unit tests of the LDE to test this new function.  This
   will require creating some dummy subclasses of `InputModifier` that
   implement `updateConnections()` in various ways.
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

## API Documentation

 * [ ] Extend the `InputStructure` page of the API Documentation to include
   all the work done in this phase.
 * [ ] Add a page to the API Documentation for the phases of processing the
   Input and Output Trees.  Begin it by documenting the modification phase,
   and say that more content is to come later.
 * [ ] Update `mkdocs.yml` in the project root to include that new file in
   the generated documentation.
 * [ ] Rebuild docs and commit.
