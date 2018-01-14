
# Statement Structures

This file defines a particular subclass of the
[Structure](structure.litcoffee) class.  It is supposed to model the idea of
a statement in mathematics.  These can be thought of as the claims that the
mathematician is making in their document.  Some of these may be justified by reasons (and in turn, rules of inference).  Others may simply be asserted or assumed as a hypothetical.

If we are running in node we need to load the `Structure` class.

    if require? then { Structure } = require './structure'

Now we can extend it to our new class.

    class Statement extends Structure

We first need to register this subclass with the global list of subclasses
of the Structure` class (see the discussion regarding [Serialization and
Deserialization](structure.litcoffee#serialization-and-deserialization) in
the `Structure` class documentation.)

        className : Structure.addSubclass 'Statement', Statement

We will add a validation routine and perhaps other methods here later.

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.Statement = Statement
