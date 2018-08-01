
# LDE Design Idea Archive

This document records incomplete ideas the Lurch team is keeping in mind
for integration into later design plans.

 * How to handle dependencies in the new design:
    * Every `OutputStructure` instance knows whether or not it should get
      exported to dependencies or not.  For instance, steps of work don't
      get exported, but declarations of grammar rules, ROIs, and constants
      would get exported.
    * A method in the generic `OutputStructure` class called `.export()`
      would be called on the `OutputTree` root and would just check to see
      if any of the children of the root have the property mentioned in
      the previous bullet point (because only the children of the root are
      accessible to subsequent documents; everything else is inside
      something else).  It would return the result as an array.
    * That array of `OutputTree` nodes would be serialized and packaged up
      as the data that dependency would export, as a big chunk of JSON.
    * Any future Lurch document that imported that dependency would
      represent the dependency using, as you suggest, a single
      `InputStructure` of type `InputDependency`, with a payload of data
      that is that big chunk of JSON.
    * The `.interpret()` routine for `InputDependency` instances is to
      simply deserialize the `OutpuTree` nodes back from JSON.  So we are
      quite literally copying nodes from a dependency document into the
      documents on which they depend.
 * We have considered a UI with buttons with mathematical names on them,
   such as Justify (which would let you choose a reason and it would insert
   it), Cite (which would let you click any premise and it would make the
   arrow), a toolbar of all math words.
 * We have tested a Suggestions feature, and could really use it widely:
    * When the cursor is near something the software could recognize as a
      statement or a reason, it gives a faint shadow over it of what it
      thinks you're saying.
    * A single keystroke confirms, and if you don't use that keystroke, the
      shadowy suggestion is never actually realized in the document.
    * Example usage:
        * Type, then hit `Ctrl+Enter` to approve an interpretation of what
          you said as a statement.
        * A visual indicator of some kind shows that the bubble was formed,
          but since your cursor is after it, the bubble-forming animation
          fades.
        * Keep typing, then hit `Ctrl+Enter` to approve an interpretation of
          what you said as a reason.
        * Same visual indicator process.
        * Immediately a suggested connection of the reason to the statement
          appears, and you hit `Ctrl+Enter` again to connect them.
        * Same visual indicator process.
        * Start typing your next statement, and repeat from step 1.
    * Whenever your cursor is in a statement accessible to the most recent
      justification you formed, a suggested premise citation arrow could
      appear; `Ctrl+Enter` to confirm.
 * MathQuill (and, one day, MathJax, if we choose to add it) are UX sugar
   that sits above the document, and can be converted to text as part of
   the UI's processing of HTML into Structures.
 * A UI idea from long ago recorded here for safe keeping:
    * Consider all situations in which it’s possible to write a small JS
      function that can easily take in a string of text and split it into
      an array of substrings, like `"Fred is a fish"` to
      `["Fred is", "a", "fish"]`, such that the array alternates between
      meaningful stuff and non-meaningful stuff. Then we have two things we
      can do with such a function.
    * First, the translator can obviously use that to trivially lift the
      meaningful stuff out.
    * Second, the UX can also use it to *highlight* __while the user is
      typing in a group__ which parts of the group’s content the app is
      paying attention to, and which parts it’s ignoring. Imagine typing
      `[Fred is a fish]` and the app is gently highlighting everything
      except the 'a' or typing
      `[Fred, who we all love, is a very nice fish]`
      and the app highlights like so:
      [*FRED*, who we all love, *IS* a very nice *FISH*].
      Such highlighting would be in the overlay where the bubble is drawn,
      and shown only when the cursor is in there.
    * One specific subclass of this idea is when we require rigid formal
      syntax, like line-numbered proofs with
      `statement[whitespace]reason[whitespace]premise,...`
 * We have long intended to support a feature in which a typical formal
   proof line (statement, reason, premise numbers) might be auto-parsed, but
   we now have an easy way to do so:
    * Have the UI wrap every single numbered list item in an InputStructure
      that parses its contents in that way.  That’s all you have to do!
    * While this assumes line-numbered proofs, this is often how a course
      begins.
    * This brings about a very nice user experience, where users simply type
      proofs and they are graded without any bubbling procedure!  Automated
      feedback just appears near your proof as you type it, and no bubbles
      have to exist anywhere.  This is the ideal.
    * Later, this feature could be extended so that, within a proof block,
      for example, every paragraph is treated this way even if it is not a
      numbered list item, and such items are automatically labeled if they
      end with standard math labeling markers like `(*)` or `(**)` or `(1)`
      and so on.
