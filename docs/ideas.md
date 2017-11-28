
# LDE Design Idea Archive

This document records incomplete ideas the Lurch team is keeping in mind
for integration into later design plans.

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
