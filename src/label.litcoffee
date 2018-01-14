
# Label Structures

This file defines a particular subclass of the [Structure](structure.litcoffee)
class.  It is supposed to model the idea of a label in mathematics.  (For
example, in LaTeX one might use the `\label{}` command to label an expression,
section, list item, and so on.)

If we are running in node we need to load the `Structure` class.

    if require? then { Structure } = require './structure'

Now we can extend it to our new class.

    class Label extends Structure

We first need to register this subclass with the global list of subclasses of
the Structure` class (see the discussion regarding [Serialization and
Deserialization](structure.litcoffee#serialization-and-deserialization) in the
`Structure` class documentation.)

        className : Structure.addSubclass 'Label', Label

We will add a validation routine and perhaps other methods here later.

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.Label = Label
