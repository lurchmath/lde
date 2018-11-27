
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 7: Validation

## Content

In this phase, we define the Validation Phase.

## Goal

The LDE will be able to follow the Interpretation Phase with the Validation
Phase, giving semantic feedback about the validity of steps of work.

## Status

All essential work on this phase is complete.  What remains are a more
robust set of tests for interpretation and some optional efficiency
improvements, both of which are documented below.

## More robust unit tests for interpretation

 * [ ] Add to the `validation-spec` file more tests, including all the
   subtle types of situations that may arise, including changes to a
   premise impacting a conclusion's validation, changes to a label
   impacting whether something is cited, and on and on through many
   possibilities.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.
