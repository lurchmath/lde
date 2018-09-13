
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 3: The Output Tree

## Content

In this phase, we add the Output Tree, a hierarchy comprised of a new kind
of `Structure` subclass, called `OutputStructure`.

## Goal

The `OutputStructure` class will exist, but will not yet be used by the LDE
module.

## Status

This has not been implemented.  See the tasks below.

## `OutputStructure` class

 * [ ] Create a subclass of `Structure`, in its own new module,
   `src/output-structure.litcoffee`.
 * [ ] Add documentation explaining what it is and will do (though that
   documentation can grow with time).
 * [ ] Ensure that the `OutputStructure` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'OutputStructure', OutputStructure` in
   the `OutputStructure` class code.)
 * [ ] Create a new unit test file for `OutputStructure`s that is extremely
   basic, just testing to be sure that the symbol `OutputStructure` is
   defined at the global scope and creates things that are instances of the
   generic `Structure` base class.
 * [ ] Add documentation for that unit test file, following the pattern
   established in the documentation of other unit test files in this
   repository.
 * [ ] Update the LDE module to import the `output-structure.litcoffee`
   module in addition to the generic `structure.litcoffeee` one and the one
   for `InputStructure`s.
 * [ ] Add a global `Structure` hierarchy in that file, called the
   `OutputTree`, parallel to the `InputTree`.
 * [ ] Add a function that the LDE module exports that serializes the entire
   `InputTree` and the entire `OutputTree` and returns them as a pair.
 * [ ] Add a function that is the reverse, taking a pair of serialized trees
   and deserializing them into the `InputTree` and the `OutputTree`.
 * [ ] Update all unit tests of the LDE module to reflect the introduction
   of `OutputStructure`s.
 * [ ] Once the unit tests pass, build everything and commit.

## Marking structures dirty

 * [ ] Create a `markDirty()` function in the `OutputStructure` class that
   marks the instance dirty (but with no propagation, unlike with
   `InputStructure` instances).
 * [ ] Extend the `OutputStructure` constructor to mark all instances dirty.
 * [ ] Update all documentation in that file to reflect the changes just
   made.
 * [ ] Add to the unit tests for `OutputStructure`s a few simple tests for
   these new routines.
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.

## Connecting modules

 * [ ] Give the `OutputStructure` class a method called `feedback`, whose
   default behavior is the same as that of `InputStructure`.
 * [ ] Add to the unit tests for `OutputStructure`s a few simple tests for
   these new routines.
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.

## API Documentation

 * [ ] Add a page to the API documentation for the `OutputStructure` class
   and all of its upcoming subclasses.
 * [ ] Update `mkdocs.yml` in the project root to include that new file in
   the generated documentation.
 * [ ] Rebuild docs and commit.
