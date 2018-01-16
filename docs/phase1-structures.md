
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

This phase has been implemented, and is documented in the API Documentation,
accessible from the navigation menu at the top of this site.

However, it needs a major overhaul in light of our most recent design
discussions.  Here are the shared to-dos for that overhaul.  Each has a
checkbox that any developer can use to indicate completion.

Each section goes together, and should be committed together, as described.
Although none of the steps say "push," there is an implied push after each
commit, in order to share your work with others.

### `Structure` event handlers

 * [ ] Add the `willBe*` function calls into the `Structure` class's
   methods.
 * [ ] Add tests for those functions (and the `was*` functions, if needed)
   in the `Structure` class test suite.
 * [ ] Add API documentation for these events, or update what documentation
   is there.
 * [ ] Once the unit tests pass, commit.

### Documenting `Label`s and `Reason`s

 * [ ] Add API documentation pages for the Label and Reason modules.
 * [ ] Add links to those pages from the `mkdocs.yml` page.
 * [ ] Commit.

### Removing the `properties` function

 * [x] Delete `Structure::properties` and all corresponding tests because we
   no longer use it for anything.
 * [x] Remove API documentation for that function.
 * [x] Once the unit tests pass, commit, explaining that our specifications
   no longer need that function.

### Small code reorganization

 * [x] Move `Structure::copy` and `Structure::earlierThan` into the previous
   section in that file, which is about "read" functions rather than "write"
   ones.
 * [x] Ensure the unit tests still pass and then commit, explaining it's
   just code reorganization.

### Creating the `update` function

 * [ ] Add a default implementation for `wasChanged()` and `wasInserted()`
   that calls the `update()` event handler, if it exists.
 * [ ] Add minimal documentation in the source code, plus fuller API
   documentation, explaining that `update()` will be called whenever the
   object or anything on which it depends experiences an insertion or change
   event, and the function should update any computed attributes based on
   its new state.  Currently, it is only called when the object itself
   changes, but we will later extend it to be called whenever something on
   which it depends changes as well.  Also, the `Structure` class provides
   no default implementation of `update()`, but other subclasses will.
 * [ ] Add unit tests for that function.
 * [ ] Once the unit tests pass, commit.

### Document upcoming changes to the `Label` module

 * [ ] Define name objects, which are key-value dictionaries containing at
   least a "name" key, which should be a string, and any optional other
   key-value pairs that may be useful as this module evolves.
 * [ ] Define the concept of matching two such objects, one a label and one
   a reference, and give some examples of why you might want data beyond
   just the name.  Explain the class method `nameMatches()` that will
   implement it, which for now just compares names and later can be
   extended.  Examples:
    * For text, feel free to match substrings (if that setting is
      enabled).
    * For numerical labels, do not match substrings, but be forgiving
      about punctuation (if that setting is enabled).
    * Namespaces, etc.
 * [ ] Explain that the `Label` class will define a `name()` method for
   computing a name object from it, and will extend the `Structure` class
   with a `reference()` method that can turn any structure functioning as a
   reference into the name object it represents.
 * [ ] Define the three ways that structures can get names:
    * `S.getExternalAttribute 'labels'` is an array of name objects.
    * `S.getComputedAttribute 'labels'` is an array of name objects.
    * If `L` is a `Label` instance and `L` connects to `A`, then the
      name computed from `L` applies to `A`.
 * [ ] Add comments that these changes are not yet implemented, but are
   coming in a future commit.
 * [ ] Commit.

### Implementing documented changes to the `Label` module

 * [ ] Implement `nameMatches()` as documented in the previous section.
 * [ ] Implement `name()` as documented in the previous section.
 * [ ] Implement `reference()` as documented in the previous section.
 * [ ] Move `labels()`, `hasLabel()`, and `lookup()` into
   [label.litcoffee](label.litcoffee).
 * [ ] Reimplement them to respect the new paradigm, renaming `labels()` to
   `names()`.
 * [ ] Rename `lookup()` to `lookupLast()`.
 * [ ] Create a new `lookup()` that looks up *all* structures with the name.
 * [ ] Move the tests of `labels()`, `hasLabel()`, and `lookup()` over from
   the Structure module to the `Label` unit tests.
 * [ ] Remove earlier source code comment that said that the changes are not
   yet implemented, but are coming soon.
 * [ ] Update all tests.
 * [ ] Once all tests pass, commit.

### Finishing documentation of the new `Label` module content

 * [ ] Extend the API Documentation for the `Label` module so that it
   introduces all the concepts recently documented in the `Label` module
   itself, linking to that source code for full details.
 * [ ] Commit.

### Document upcoming changes to the `Reason` module

 * [ ] Explain that every reason is a reference, and will therefore make use
   of `Structure::reference()`.
 * [ ] Define the three ways that structures can get names:
    * `S.getExternalAttribute 'reasons'` is an array of name objects.
    * `S.getComputedAttribute 'reasons'` is an array of name objects.
    * If `R` is a `Reason` instance and `R` connects to `A`, then
      `A.lookupLast R.reference()` is a reason for `A`, assuming that
      such a computation yields a `Structure` instance.

### Implementing documented changes to the `Reason` module

 * [ ] Move `reasons()` into [reason.litcoffee](reason.litcoffee),
   reimplementing and redocumenting it as you do so.
 * [ ] Remove earlier source code comment that said that the changes are
   not yet implemented, but are coming soon.
 * [ ] Move the tests of `reasons()` over from the Structure module to the
   Reason unit tests.
 * [ ] Once all tests pass, commit.

### Finishing documentation of the new `Reason` module content

 * [ ] Extend the API Documentation for the Reason module so that it
   introduces all the concepts recently documented in the Reason module
   itself, linking to that source code for full details.
 * [ ] Commit.

### Remove code and documentation about premises and citation

 * [ ] Delete the `premises()` function from the `Structure` module.
 * [ ] Delete all the convenience functions defined above it, which we no
   longer need for anything.
 * [ ] Delete all unit tests of that function.
 * [ ] Remove `cites()` and `whatCitesMe()` from the structure module.
 * [ ] Remove the tests of `cites()` and `whatCitesMe()` as well.
 * [ ] Update the API Documentation to reflect these changes.
 * [ ] Once all tests pass, commit, explaining that we're removing this
   feature and the next commit will introduce something more general.

### Remove structure categorization function and its docs

 * [ ] Remove `isA()` from the structure module.
 * [ ] Remove the tests of `isA()` and any tests that depend upon it.
 * [ ] Update the API Documentation to reflect these changes.
 * [ ] Once all tests pass, commit, explaining that nothing uses the `isA`
   function any longer, and thus it can be removed.

### Catch `setup` function up with recent changes

 * [ ] Update `setup()` to no longer make reason, premise, or label
   connections in the old way.
 * [ ] Update the tests of `setup()`.
 * [ ] Update the API Documentation to reflect these changes.
 * [ ] Once all tests pass, commit.

### Documenting and coding dependents

 * [ ] Add a section to the `Structure` module for inter-structure
   dependence.
 * [ ] Define a function `dependents()` that computes the set of structures
   that depend on the given one.  Its default implementation is to return
   the empty array.
 * [ ] Document that function, explaining that any `Structure` subclass can
   override it.
 * [ ] In the `Label` module, overwrite that function (yes, actually modify
   the `Structure` class and replace the original implementation) with one
   that finds any structure in the scope of `this` that has `this` as a
   reason.
 * [ ] Add documentation to that new implementation of `dependents()`,
   saying that we will extend it later when we support premises, so that
   anything citing a premise also depends on the premise.
 * [ ] Create unit tests for this new functionality.
 * [ ] Once all tests pass, commit.

### Connect event handlers to `update()`

 * [ ] Update the default implementations in the `Structure` class of the
   `willBe*` and `was*` functions necessary for calling `update()` whenever
   something on which a structure depends was changed.
    * `wasInserted()` should call `update()` in everything on which the
      newly inserted object depends.
    * `willBeRemoved()` should store the list of things that depend on
      the to-be-removed structure, and then `wasRemoved()` should call
      `update()` in each structure on that list, then delete the list.
    * `willBeChanged()` should store the list of things that depend on
      the to-be-changed structure, and then `wasChanged()` should union that
      list with the new list of things that depend on it, and then call
      `update()` in each structure on that united list.
 * [ ] Extend the unit tests for the `Reason` module to test these very
   issues, the propagation of updates through reason citations.
 * [ ] Once all tests pass, commit.
