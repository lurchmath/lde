
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 2: The Input Tree

## Content

In this phase, we add the Input Tree, a hierarchy comprised of a new kind of
`Structure` subclass, called `InputStructure`.

## Goal

The `InputStructure` class will exist and be used by the LDE module.

## Status

This has not been implemented.  See the tasks below.

## `InputStructure` class

 * [ ] Create a subclass of `Structure`, in its own new module,
   `src/input-structure.litcoffee`.
 * [ ] Add documentation explaining what it is and will do (though that
   documentation can grow with time).
 * [ ] Ensure that the `InputStructure` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'InputStructure', InputStructure` in
   the `InputStructure` class code.)
 * [ ] Rewrite the LDE module so that it no longer takes as input generic
   `Structure` instances, but specifically `InputStructure` instances.  All
   of its methods should be updated to use `InputStructure`s where they
   currently use `Structure`s.  This will require importing the
   `input-structure.litcoffee` module instead of the generic
   `structure.litcoffee` one.
 * [ ] Update all documentation in that file to reflect the changes just
   made.
 * [ ] Create a new unit test file for `InputStructure`s that is extremely
   basic, just testing to be sure that the symbol `InputStructure` is
   defined at the global scope and creates things that are instances of the
   generic `Structure` base class.
 * [ ] Add documentation for that unit test file, following the pattern
   established in the documentation of other unit test files in this
   repository.
 * [ ] Update all unit tests of the LDE module to reflect this change to
   `InputStructure`s.  This will require importing the
   `input-structure.litcoffee` module instead of the generic
   `structure.litcoffeee` one.
 * [ ] Once the unit tests pass, build everything and commit.

## Accepting actual instances

 * [ ] The LDE module was written to accept only JSON-serialized forms of
   `Structure`s as parameters to its methods.  Update those functions so
   that they now accept either serialized forms or actual instances, and can
   tell the difference and respond appropriately.  (That is, deserialize any
   serialized instances, but don't do that if the argument was already an
   instance.)
 * [ ] Extend the unit test suite of the LDE module so that it tests this
   new feature of each API method of the LDE module.
 * [ ] Update all documentation in that file to reflect the changes just
   made.
 * [ ] Once the unit tests pass, build everything and commit.

## Marking structures dirty

 * [ ] Extend the `InputStructure` class with a field called `dirty`, which
   is initialized to false in the constructor.  This field does not need to
   be part of any serialization or deserialization of instances.
 * [ ] Create an `isDirty()` method that returns the value of that member
   variable.
 * [ ] Create a `markDirty()` method in the `InputStructure` class that sets
   the `dirty` flag to true, and does so for all ancestors as well.
 * [ ] Update all documentation in that file to reflect the changes just
   made.
 * [ ] Add to the unit tests for `InputStructure`s a few simple tests for
   these new routines.
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.
