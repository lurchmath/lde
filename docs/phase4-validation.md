
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 4: Validation

## Content

In this phase, we extend the formerly rudimentary `OutputStructure` class
with its most important functionality: validating steps of work.

## Goal

Instance of the `OutputStructure` class will automatically validate
themselves as they are added to the Output Tree.

## Status

This has not been implemented.  See the tasks below.

## Automatic validation enqueueing

 * [ ] Define a class variable in the `OutputStructure` class, an array of
   all instances that need to be validated.  Initialize it to the empty
   array.
 * [ ] Extend the `recursiveInterpret` routine so that, for any
   `OutputStructure` instances it had to create (not just re-use from its
   cache), if any of them are also `OutputStep` instances, then add them to
   the to-validate list.  (The `OutputStep` class does not yet exist.  Make
   it a stub for now, and come back to fully implementing it in
   [phase 7](phase7-citations.md).)
 * [ ] Add documentation in those files describing the changes just made.
 * [ ] Extend the unit tests for the `InputStructure` module to verify
   that this works as described.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.

## Automatic validation processing

 * [ ] In the LDE module, run `setInterval()` at module creation so that it
   regularly (many times per second, but not so often as to consume copious
   CPU) checks to see if there is anything on the list of `OutputStructure`
   instances to be validated.  If there are any such things, call their
   `validate` routines (which are asynchronous).  The order in which these
   are processed is irrelevant.
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Extend the unit tests for the LDE module to verify that this works
   as described.  That is, create some `OutputStep` subclasses and some
   `InputStructure` subclasses whose `interpret` routines produce instances
   of those classes.  Verify that validation actually does take place.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.

## Feedback messages

 * [ ] Add a function to the LDE module that can be called whenever an
   attribute of an `OutputStructure` in the Output Tree changes, and the
   function will send a message (to any listening client) containing the ID
   of the origin of the node whose attribute changed, and the key-value pair
   of the changed attribute.
 * [ ] Update the documentation in that file to describe the changes just
   made.
 * [ ] Extend the unit tests for the LDE module to verify that this
   works as described.  First, simply, just change an attribute of some
   nodes in the Output Tree and verify that messages are sent by the LDE to
   that effect.  Then extend the tests that go from API calls to validation
   results to ensure that the entire process works, from API calls that add
   to the Input Tree to feedback messages from validation being transmitted
   back.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.

## Conclusions

We now stipulate and prove a few facts about the preceding design.

**Axiom 1:** Lurch creates an `InputStructure` from a portion of the user's
document iff that portion is meaningful.

**Remark:** This is the job of the UI, with the assistance of the user's
settings.  So in some sense this axiom is aspirational, or conditioned upon
the assumption that we can provide a robust enough set of UI settings to
capture user meaning correctly.

**Axiom 2:** Lurch performs interpretation on every `InputStructure`
created by the UI, and on nothing else.

**Remark:** The design so far has included this as an obvious goal.  Here
we just explicitly state it.

**Theorem 1:** Lurch does syntactic validation on X iff X corresponds to a piece of meaningful content in the user's document.

**Proof:** Syntactic validation is a part of interpretation, which by Axiom
2 gets applied to every `InputStructure`, and to nothing else.  By Axiom 1,
those `InputStructure`s correspond directly to the meaningful content in
the user's document.  QED

**Axiom 3:** Both the creation and interpretation of `InputStructure`s faithfully preserve meaning.

**Remark:** That is, neither the UI nor the interpretation phase will
convert a premise into a rule, or a grammar rule into a subproof, or any
other crazy change of meaning.  This is simply a commitment for us to design
Lurch to do what seems mathematically normal and natural to mathematicians
and math students, as human users of the software.  It's a bit strange to
even state this rather obvious axiom, but it is needed in the proof of
Theorem 2.

**Theorem 2:** Lurch does semantic validation on X iff X corresponds to a
syntactically valid step of work in the user's document.

**Proof:** Assume X is a syntactically valid step of work in the document.
Then by Axiom 1, it will become an `InputStructure`, and by Axiom 3, it
will more precisely have the type of data that lets the LDE know that it is
a step of work.  By Axiom 2, that step will be interpreted, and by Axiom 3,
the result will be an `OutputStep`.  That `OutputStep` will have syntactic
validation performed on it, because of the definition of validation
enqueueing given above.

In the other direction, assume Lurch does semantic validation on X.  Then by
the definition of validation enqueueing above, X must be an `OutputStep`.
Our design permits creation of `OutputStructure`s only through
interpretation, and by Axiom 3, the interpretation step that created X must
have taken as input some `InputStructure` that has all the data indicating
it is a step of work.  By Axiom 1, that must have come from some meaningful
portion of the user's document, and by Axiom 3, that in-document content
must have represented a step of work.  QED
