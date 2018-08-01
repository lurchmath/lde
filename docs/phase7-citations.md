
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 7: Citations

## Content

In this phase, we build on the foundation of generic interpretation and
validation, plus [the design of labels](phase5-labels.md), to design how to
refer to (or "cite") labeled structures.

## Goal

By the end of this phase, the Input Tree can contain references to previous
labeled structures, and we will also have a design for how to package up
such references into a structure called a "step of work," which will cite
the rules and premises on which it purports to depend.

## Status

This has not been implemented.  In fact, the design below has not yet been
converted into actionable tasks.  So the next steps are to do that
conversion, and then execute the resulting tasks.

## Design

### Overview

While we defined labels [in an earlier phase](phase5-labels.md), we have not
yet defined a way to refer to them.  For instance, in the design of Desktop
Lurch, we use the informal notation

> `[foo]:ME` because of `<modus ponens):reason` using line `<3):premise`,

and the `<3):premise` bubble is a way to refer to some earlier line with the
label 3.  We haven't added to our new design anything corresponding to the
`<3):premise` bubble.

Let us call such things *references,* creating a parallel with LaTeX, since
many students will learn both Lurch and LaTeX.  So we have labels and
references in Lurch just as we have labels and references in LaTeX, and they
function similarly in both cases.

### Input Tree

Define a new subclass of `InputStructure` called `InputReference`, which
must be atomic and its text content is its essential attribute.  That class
can provide a member function `.lookup(fromHere)` that will look up the
`InputStructure` to which the instance refers, searching from the point in
the document given by the parameter `fromHere`, which must be an
`InputStructure`.

So in the case of the example above with the bubbles for foo, modus ponens,
and 3, let's call those three bubbles A, B, and C respectively; we would
then call `C.lookup(A)` to find the bubble somewhere preceding A that has
the label 3.  It is, of course, essential to look up the reference from A
rather than C, because C's position in the document is not relevant; what we
care about is whether or not A is permitted to cite the bubble labeled with
a 3.

Note that we do not define a corresponding `OutputStructure` subclass for
references, because we won't need one.  That may not be obvious, but read
on.

### Assuming the existence of Rules

On the one hand, it doesn't make a lot of sense to design, in this document,
how steps of work will cite premises and rules if we haven't designed what a
rule is.  On the other hand, it doesn't make any sense to say how we will
define rules and validation algorithms if we can't talk about an important
piece of what those algorithms will assess (cited premises).

Consequently we assuming for now that there exists some notion of a "rule"
that will be designed later, resulting in two subclasses, `InputRule` as a
subclass of `InputStructure` and `OutputRule` as a subclass of
`OutputStructure`.  We then proceed with the design of citations in this
document, and come back in a later phase and design those subclasses in
detail.

### Assuming limited citations

I further assume that for now we care only about citing only two kinds of
things:  Either a step of work is citing another expression as a premise or
it is citing a rule (which is not an expression).  For the purposes of this
design, there are no other types of citations.  We can extend this list of
citable things later if needed, but for this document those are the only
citations in view.

For instance, when we design customizable parsing, we may say that a
reference to a grammar for parsing is a citation of the most recent grammar
rule for that language.  (Or we might choose a different implementation for
grammar citations; we will see.)  So the reader should assume for now that
we have only two types of citations, but that list may grow.

### Output Tree

In the Output Tree, we create a new class called `OutputStep` that is a
subclass of `OutputExpression`.  The defining characteristics of
`OutputStep`s are that each instance will have the following two fields.

 * `premises` - an ordered array of `OutputExpression`s, each of which must
   be accessible to the step.  (Order is important here because some
   libraries will care about the order of premises, so this is not just a
   set.)
 * `rules` - an ordered array of `OutputRule`s, each of which must be
   accessible to the step.

These are fields of `OutputStep` instances, not attributes of them.  That
is, an instance of the `OutputStep` class is a JavaScript object, and in any
such instance `S`, I'm saying that `S.premises` and `S.rules` contain data
as just described.  (This is not the same as `S.getAttribute('premises')`
and `S.getAttribute('rules')`; attributes are JSON data for storing static
information like feedback.)  So `S.premises` will be an array of the actual
`OutputExpression` instances that exist in the `OutputTree`, accessible to
`S`, so that validation algorithms (and other code) can inspect/use them
directly.  Similarly, `S.rules` will be the actual `OutputRule` instances in
the Output Tree accessible to `S` and cited by it.

To be even more precise, all of the following CoffeeScript expressions would
evaluate to true:

 * `S.premises[i] instanceof OutputExpression` (assuming `i` is a valid
   index into `S.premises`)
 * `S.premises[i].accessibleTo S` (assuming `i` is a valid index into
   `S.premises`)
 * `S.rules[i] instanceof OutputExpression` (assuming `i` is a valid index
   into `S.rules`)
 * `S.rules[i].accessibleTo S` (assuming `i` is a valid index into
   `S.rules`)

Note that the rules list is indeed a list rather than a single rule, because
we want to support libraries that attach the same label to several different
rules, so that users can cite things ambiguously, using just one rule name.
In such libraries, validation will need to figure out whether any of the
ambiguously cited rules justifies the step.  This is not the same thing as
letting the user attach several different rule citations to the same step;
more details on this below.

### User Interface

The main Lurch UI will invent many ways for users to cite premises.  In
Desktop Lurch, we have the method represented by the notation `<3):premise`
in the example above.  In the web version, the `<...)` aspect of that bubble
will now be handled using the arrows feature in the main UI, rather than
little arrow symbols in the bubble tag.  We can also permit new types of
premise citations, using new features of the web UI, including a direct
arrow connection from a premise to a conclusion, and a hidden attribute in
the conclusion that cites the premise by its label.

Other things may be invented later as well, but this design document
considers these for now.  We design aspects of the Input Tree that support
these features.  Recall that data about arrows among bubbles (also called
connections) gets transferred directly into the Input Tree for use in
interpretation routines.

Furthermore, there is a clearly defined notion of "order" among the arrows
between bubbles.  This is shown visually in the order of arrowheads entering
a bubble, and arrow stems leaving a bubble.  This order is preserved when
arrow data is converted into connections in the data in `InputStructure`s.
Thus that order can be preserved further in the interpretation phase, into
the Output Tree, where a premise array is ordered.

The same holds true of hidden attributes in a bubble; we can stipulate any
order among those attributes, because any hidden attributes will be edited
through some user interface we create for doing so (context menu items,
popup dialogs, etc.) and thus we can make it as flexible as we like.  

However, there is no natural way to unite these two different orderings.
Each way seems as good as any other.  So we just define the convention that
citations in hidden attributes always follow citations made by arrows.

### Input Tree

We therefore create three types of rule/premise citations that the Input
Tree supports, to correspond to the three types of citation that the UI
supports.  Any `InputExpression` `E` may cite an `InputExpression` `F`
accessible to `E` through any of the following means.

 1. a connection (informally called an "arrow") from `F` to `E`; this is
    something entirely new in the web version of Lurch because we didn't
    have arrows in Desktop Lurch
 1. a hidden attribute in `E` containing a label that, when looked up from
    the point of `E`, yields `F` (where lookup is as defined in [an earlier
    phase](phase5-labels.md)); this, too, is new for web Lurch, because we
    didn't have hidden attributes in Desktop Lurch
 1. a connection from `G` to `E`, for some `InputStructure` `G` functioning
    as a reference to `F`; this is exactly like what we had in Desktop
    Lurch, and it's the first thing designed at the top of this document,
    called *references.*

This means that the UI must know the difference between citations of type 1.
vs. type 3.  But the UI will not be able to discern that distinction without
the user's aid.  This is because we will later add customizable parsing, and
thus the language for expressions could be anything at all, making it
impossible for the UI to use the contents of a bubble to distinguish
references from expressions.  So we will need to make the user specify which
kind of connection it is, either by choosing a particular type of source
bubble, or by choosing some attribute of the connection itself.  

We do not design a new class `InputStep`.  Rather, the implementation of
`.interpret()` in the `InputExpression` class is extended as follows:

 * If the expression does not cite any rules or premises, then it is
   interpreted the old way--into an `OutputExpression` that does not need
   validation.
 * If the expression has precisely one rule citation and any number
   (including zero) of premise citations, then it is interpreted in a new
   way--as an `OutputStep`, which is a subclass of `OutputExpression` and
   thus has all data that any `OutputExpression` has, plus `premises` and
   `rules` fields.  The `.interpret()` routine in the `InputExpression`
   class is in charge of looking up the cited premises and rule in the
   accessibles list provided to it as one of its parameters, and using them
   to populate the `premises` and `rules` fields in the `OutputStep`
   instance it creates.
 * If the expression has more than one rule citation, then we call it a
   syntactically invalid step, do not create any `OutputStep` as its
   interpretation, but let the interpretation phase give feedback to the
   user about the error.  This is because multiple rule citations on a
   single step of work violates the Lurch mission statement:  In actual
   math practice, no one cites a few theorems hoping that one will work!

(If, for toy proof style games, we later change our minds to want to permit
multiple rule citations for a single step of work, we could make this an
option users or libraries can enable/disable.  But that is low priority.)
