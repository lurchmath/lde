
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 6: Labels

## Content

In this phase, we make it possible for `OutputStructure` instances to be
labeled.

## Goal

The LDE will be able to look up `OutputStructure` instances by the labels
attached to them, and we will have a convention for citing labels
established and implemented.

## Status

All essential work on this phase is complete.  What remains is optional
efficiency improvements, documented in the following section.  These were
not implemented at first because it is not clear that they are necessary,
and it would be a waste of development time for no clear benefit.  But if
later performance bottlenecks arise that could be solved by any of the ideas
expressed below, the plans are written here for execution.

## Efficiency improvements

 * [ ] Extend the `Dependency` subclass of IS so that it marks all of its
   interpretation results with an attribute, flagging them as having come
   from a dependency.  Let us call such `OutputStructures` "fromdeps," and
   `OutputStructures` that are not so marked we will call "non-fromdeps."
 * [ ] We will be creating a cache to speed up lookups into dependencies.
   To support this, create an LDE-global variable
   `LDE.dependencyLookupCache`, and initialize it to the empty object.
 * [ ] Extend the `lookup(string)` routine so that any time it is called
   from a non-fromdep, and the result is either null or a fromdep, then we
   store in `LDE.dependencyLookupCache` the association of the given
   `string` as a key with the result (a fromdep or null) as the value.
   Future calls of `lookup()` from a non-fromdep can be sped up by, whenever
   their search first comes upon a fromdep, if there is a cached result
   (which can be null) for the `string` they're searching, just return that
   immediately.  This work is not yet correct without the next bullet point.
 * [ ] Extend the `Dependency` subclass of IS so that, if it ever needs to
   actually reload content from the dependency, and thus possibly change the
   set of fromdeps it placed in the Output Tree, then it should also revert
   the value of `LDE.dependencyLookupCache` to the empty object.
 * [ ] Extend the unit tests to ensure that this works.  This can be done by
   defining a custom `hasLabel()` routine that records when it was called,
   and ensuring it is called only once for many lookups.
 * [ ] Once the unit tests pass, build everything and commit.
