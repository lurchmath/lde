
# Rule Structures

This file defines a particular subclass of the
[Structure](structure.litcoffee) class.  It is supposed to model the idea of
a rule of inference in mathematics. Note that in mathematics a definition,
axiom, or theorem are frequently used as rules of inference to justify
statements in a proof, and as such, can be thought of in some cases as
special kinds of rules.  Thus eventually we may have synonyms for this
subclass in either the code or user interface or both where we refer to it
as a definition, theorem, axiom, lemma, etc.  But the thing that all of
these rules have in common is that they may take, as inputs, certain
Structure and other inputs and use them to justify a statement or statements
as outputs.  That is the kind of rule this subclass is modeling.

If we are running in node we need to load the `Structure` class.

    if require? then { Structure } = require './structure'

Now we can extend it to our new class.

    class Rule extends Structure

We first need to register this subclass with the global list of subclasses
of the Structure` class (see the discussion regarding [Serialization and
Deserialization](structure.litcoffee#serialization-and-deserialization) in
the `Structure` class documentation.)

        className : Structure.addSubclass 'Rule', Rule

We will add a validation routine and lots of other methods here later.

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.Rule = Rule
