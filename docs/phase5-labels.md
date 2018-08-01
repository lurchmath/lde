
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 5: Labels

## Content

In this phase, we build on the foundation of generic interpretation and
validation to build the first feature necessary for validating steps of
work:  Labels.

## Goal

By the end of this phase, the Input Tree can contain labels that will be
preserved and transferred to the Output Tree by interpretation, and are
available for use in validation.

## Status

This has not been implemented.  In fact, the design below has not yet been
converted into actionable tasks.  So the next steps are to do that
conversion, and then execute the resulting tasks.

## Design

We have high hopes for the flexibility of labels.  We don't want "1" to be
a label and then the user says "1." and it's not recognized because of the
minor difference in punctuation.  Furthermore, if "Theorem 6" were a label
and the user said "thm 6" we might like that to be recognized.  So a label
is not a string, but a string together with a set of policies defining an
equivalence class surrounding that string in the space of all strings.  Of
course, a subset of the set of all strings is also defined by a predicate,
which would show up in JavaScript as a one-parameter function on strings
returning true/false values.

We therefore use this as our definition of "label."  That is, a label for
an `OutputStructure` A is really a function f such that f(L) is true iff A
answers to the label L.  Because an `OutputStructure` is a
JavaScript object, it can have a field that stores, in an array, all its
labels (as functions).  Like so:
 * `myOutputStructure.labelFunctions`, an array initialized to empty in the
   constructor
 * `myOutputStructure.hasLabel( L )` returns true iff some f in
   `myOutputStructure.labelFunctions` returns true on L, and false otherwise
 * We already have built into the generic `Structure` class (and therefore
   into its subclasses, including `OutputStructure` and `InputStructure`) a
   routine that can search backwards through all accessible nodes to find
   the first one satisfying a given predicate.  So we can simply look up
   labels from any point X in the `OutputTree` with CoffeeScript code like
   so: `lookupResult = X.firstAccessible ( y ) -> y.hasLabel L`

Explicit label bubbles in the document, connected by arrows to their
targets, can be passed directly from the UI to the IT without processing.
The interpretation phase will then have to take these steps:
 * Convert any labeling data into labeling predicates (as designed above)
   that get embedded into Output Tree nodes.
 * Delete any label bubbles, since they aren't part of validation, and
   their data has been embedded in their targets.
 * Hidden attributes will be passed directly from the UI to the Input Tree
   without processing, and converted similarly during the interpretation
   phase, but without the need to delete any label bubbles.
 * HTML structures like ordered lists will be converted, by the UI, as it
   creates the Input Tree, into hidden attributes, which would then be
   handled by the interpretation phase as in the previous bullet point.

Thus when the UI embeds into an `InputStructure` some information about a
label automatically assigned based on a numbered list, it can also embed
with it some data saying whether punctuation is optional, or any other
option that should be applied when checking to see if a label applies.  That
information will be used by the interpretation step when it creates label
predicates that it embeds in Output Tree nodes.
