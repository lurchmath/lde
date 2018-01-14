
# Formal System Structures

This file defines a particular subclass of the
[Structure](structure.litcoffee) class.  It is supposed to model the idea of
a formal system in mathematics.  For example, the Peano system for defining
the natural numbers, the Zermelo-Frankel definition of set theory, an
axiomatic definition of propositional logic, and any system that defines
Euclidean plane geometry are all mathematical concepts that this class might
attempt to model.

If we are running in node we need to load the `Structure` class.

    if require? then { Structure } = require './structure'

Now we can extend it to our new class.

    class FormalSystem extends Structure

We first need to register this subclass with the global list of subclasses
of the Structure` class (see the discussion regarding [Serialization and
Deserialization](structure.litcoffee#serialization-and-deserialization) in
the `Structure` class documentation.)

        className : Structure.addSubclass 'FormalSystem', FormalSystem

We will add a validation routine and perhaps other methods here later.

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.FormalSystem = FormalSystem
