
# Reason Structures

This file defines one particular subclass of the
[Structure](structure.litcoffee) class, one for reasons.

In the LDE, a structure representing a mathematical statement needs to be
graded/validated as a step of work if and only if it has a reason attached
to it.  Thus reasons are a very important feature in the LDE.

Each reason must be connected to the statement it justifies, or it will have
no effect.  Let us call the statement the reason modifies its *target*.

The reason contains in its text attribute the name of some labeled structure
accessible to the target that is to be used as a rule for validating/grading
the target.

Because this depends on the `Structure` class, we import that first, as long
as we are running in Node.  If not, we assume that the scripts defining the
`Structure` class have been imported already.

    if require? then { Structure } = require './structure'

Define the subclass.

    class Reason extends Structure

Register this subclass for use in serialization and deserialization.

        className : Structure.addSubclass 'Reason', Reason

Later we will define validation routines for this class.
