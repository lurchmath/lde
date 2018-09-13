
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

 * [ ] Create in the `OutputStructure` base class a function called
   `hasLabel(str)` that returns false always.
 * [ ] Create a function `addLabel(targets)` in the `InputStructure` class.
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
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Extend the unit tests for the `InputStructure` module to include some
   calls to this routine, passing it various example parameters and
   verifying that it does its job as specified.
 * [ ] Extend `recursiveInterpret()` so that it calls this function in an
   `InputStructure` as soon as it has completed `interpret()` on that
   structure, passing in the set of interpretation results.
 * [ ] Extend the unit tests to ensure that this is now a part of the
   Interpretation Phase.
 * [ ] Once the unit tests pass, build everything and commit.

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

## API Documentation

 * [ ] Extend the `OutputStructure` page of the API Documentation to include
   all the work done in this phase.
 * [ ] Rebuild docs and commit.
