
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 1: Structures

## Content

In this phase, we just design the generic Structure class on which
everything else will depend, and the infrastructure of the LDE itself.

The `Structure` module defines a single `Structure` class, and has been
implemented. [Its API Documentation appears here](api-structures.md).

The `LDE` module defines several global functions, and has been implemented.
[Its API Documentation appears here](api-lde.md).

## Goal

At the end of this phase, we could write unit tests of the whole Structure
class and its LDE context, thus guaranteeing that all later phases rest on a
good foundation.

## Status

This phase was implemented and documented in the API Documentation, but has
since seen a major (and beneficial!) re-design, and that re-design has not
yet been implemented.  It should be done as follows:

## Tie up loose ends on the old version

 * [x] Just as the `Structure` class has tests for all `was*` events (such
   as `wasRemoved`, etc.), add tests for the corresponding `willBe*` events.
 * [x] Add API documentation for these events, or update what documentation
   is there.
 * [x] Once the unit tests pass, commit.

## Remove files we no longer need (and what depends on them)

 * [x] Delete the file `src/statement.litcoffee`, as well as the
   corresponding files for reason, label, and rule.
 * [x] Delete the analogous four files in the `tests/` folder.
 * [x] Search for any code that imports any of those files and delete the
   lines that import those files, since the files no longer exist.
 * [x] Search through all the documentation for any documentation that
   mentions those files, and delete any mention of those files.
 * [x] Run the unit test suite and verify that all tests pass.  If not,
   track down what's using the now-deleted code and fix it.
 * [x] Once all tests pass, rebuild everything, commit, and push to the
   repository.

## Remove code portions we no longer need

### Attribute conventions

 * [x] Remove from `src/structure.litcoffee` the entire section entitled
   "Attribute conventions," because many of those conventions will change
   as we build upon our new design.
 * [x] Remove any unit tests that dealt with any of the code deleted in the
   previous step.  Ensure that all unit tests then still pass.
 * [x] Search for any documentation that mentioned code deleted in that same
   step and remove it, because that code no longer exists.
 * [x] Once all tests pass, rebuild everything, commit, and push to the
   repository.

### Computed attributes

 * [ ] Remove from `src/structure.litcoffee` the entire section entitled
   "Computed attributes," because we no longer need to distinguish computed
   from external attributes.
 * [ ] Remove any unit tests that dealt with any of the code deleted in the
   previous step.  Ensure that all unit tests then still pass.
 * [ ] Search for any documentation that mentioned code deleted in that same
   step and remove it, because that code no longer exists.

### External attributes

 * [ ] In the `src/structure.litcoffee` file, in the section entitled
   "External attributes," rename everything so that it no longer contains
   the word "external."  For example, `getExternalAttribute` would become
   just `getAttribute`, because we no longer need to distinguish computed
   from external attributes.
 * [ ] Throughout the unit tests, find any mention of external attributes
   and rename it to match the new names of those functions.  Ensure that all
   unit tests then still pass.
 * [ ] Search for any documentation that mentioned external attributes and
   update it to match the new names of those functions.
