
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

This has not been implemented.  See the tasks below.

## Labeling `OutputStructure` instances

 * [x] Create in the `OutputStructure` base class a function called
   `hasLabel(str)` that returns false always.
 * [x] Create a function `addLabel(targets)` in the `InputStructure` class.
   It should accept an array of `OutputStructure` instances, and should loop
   through all of them, obeying the following conventions.
    * If the `InputStructure` has an attribute with key "label regex", then
      place into the `OutputStructure`s a `hasLabel(str)` function that
      tests the given string against the given regular expression.
    * If the `InputStructure` has an attribute with key "label regex flags",
      then apply those to the regular expression object you create in the
      previous item.
    * If the `InputStructure` has an attribute with key "label targets",
      then call its value $V$ and apply the above techniques to only those
      targets whose indices are on the $V$, when $V$ is treated as an array.
 * [x] Add documentation in that file describing the changes just made.
 * [x] Extend the unit tests for the `InputStructure` module to include some
   calls to this routine, passing it various example parameters and
   verifying that it does its job as specified.
 * [x] Extend `recursiveInterpret()` so that it calls this function in an
   `InputStructure` as soon as it has completed `interpret()` on that
   structure, passing in the set of interpretation results.
 * [x] Extend the unit tests to ensure that this is now a part of the
   Interpretation Phase.
 * [x] Once the unit tests pass, build everything and commit.

## Citations

 * [ ] Create a stub function `copyCitations(targets)` in the
   `InputStructure` base class, but at first it should do nothing.
 * [ ] Establish a convention for use in the Input Tree for citing reasons
   and premises and document that convention above the stub function just
   created.  Possibilities include the following.
    * An attribute with key "premise citations" indicates that its value is
      a list of premise citations by label (that should be looked up with
      the labels feature described above).  If its value is an array, it
      will be treated as an array of strings.  If its value is not an array,
      it will be converted to a string and treated as a one-element array
      containing that string.
    * An attribute with key "reason citations" behaves the same way, but
      with obviously different semantics.
    * A connection of type "premise citation" indicates that the source
      wants to cite the target as a premise.
    * A connection of type "reason citation" behaves the same way, but with
      obviously different semantics.
 * [ ] Implement the `copyCitations(targets)` function to copy all of the
   data indicated by those document conventions from the `InputStructure` in
   which it's called into all of the given targets, which will be an array
   of `OutputStructure` instances just created from the given
   `InputStructure`.
    * Note that `X.copyCitations(targets)` should copy all citations that go
      to *or come from* nodes `Y` that are before (or equal to) `X` in the
      Input Tree.
    * It can make the connections in the Output Tree by looking up the last
      interpretation of such nodes `Y`.
    * If `X` has connections to or from nodes that appear after `X` in the
      tree, then those nodes will create the connections later, when
      recursive interpretation visits them.
 * [ ] Extend `recursiveInterpret()` so that it calls this function in an
   `InputStructure` as soon as it has completed `interpret()` on that
   structure, passing in the set of interpretation results.
 * [ ] Extend the unit tests to ensure that this is now a part of the
   Interpretation Phase.  Be sure to test connections that go both
   directions (forward and backward) in the Input Tree and ensure that they
   are both correctly copied to the Output Tree.  Ensure that no connection
   is copied redundantly.
 * [ ] Once the unit tests pass, build everything and commit.

## Lookup

 * [ ] Create a class method `lookup(string,accessibles)` in the
   `OutputStructure` class, which loops backwards through the list of
   `accessibles`, trying to find one that `hasLabel()` the given `string`.
   It returns the latest one found, or null if there is none.
 * [ ] Create an instance method `lookup(string)` in the `OutputStructure`
   class, which loops backwards through the list of structures accessible to
   the one on which it was called, trying to find one that `hasLabel()` the
   given `string`.  It returns the first one encountered, or null if there
   is none.

## API Documentation

 * [ ] Extend the `OutputStructure` page of the API Documentation to include
   all the work done in this phase.
 * [ ] Rebuild docs and commit.

## Efficiency improvements

This section lists a potential efficiency improvement related to all the
code written during this phase of development.  Because it is only an
efficiency improvement (and thus not required to make the code work
correctly), it can be deferred until later in the project.  It is not
sensible to invest development time on an efficiency improvement if we do
not even yet know whether its lack will be perceived.  If we notice any
performance bottlenecks that this improvement could fix, we can return to it
later and follow the steps below to implement it.

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
