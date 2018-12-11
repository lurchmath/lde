
# API Documentation for the `OutputStructure` Class and its Subclasses

## Source Code

 * [The `OutputStructure` class](https://github.com/lurchmath/lde/blob/master/src/output-structure.litcoffee)
 * [Unit tests of the `OutputStructure` class](https://github.com/lurchmath/lde/blob/master/tests/output-structure-spec.litcoffee)

## Purpose

For information on the generic notion of Structures, see
[the API documentation for the base `Structure` class](api-structures.md).
That explains not only the concepts common to all Structures, but also how
`OutputStructure`s fit into the bigger picture.

In this file, we cover the details specific to the `OutputStructure`
subclass as well as its subclasses.  We break this document into sections,
one for each subclass of `OutputStructure`, including `OutputStructure`
itself.

## The `OutputStructure` class

This class overrides none of the methods of its superclass, so you can refer
to [the superclass API documentation](api-structures.md) for information
about many of the class's features.  It adds the following features.

### Dirty/Clean Status

In the Output Tree, the `dirty` flag of an `OutputStructure` signifies
whether that node in the tree needs to be revalidated (i.e., has changed
since its last validation, or something else that's relevant changed since
its last validation).  Because the validation of one node in the Output Tree
is independent of the validation of any other node, if a node is marked
dirty, it is marked dirty in isolation.  Unlike `InputStructure`s, we do not
propagate dirty status up the ancestor chain.

Thus the `OutputStructure` class provides a `markDirty(yesOrNo)` function
that is just a simple setter for the internal dirty status.  The same
`isDirty()` function from the `Structure` base class remains available,
unchanged.

### Feedback

To make it easy to give feedback about `OutputStructure` instances, we
provide an instance method called `feedback()`.  You can call
`X.feedback(Y)` in any `OutputStructure` `X`, passing any JSON object `Y`
containing the feedback you wish to send, and it will delegate the work to
the `InputStructure` stored in `X.origin`, or do nothing if there is no such
object.  See [the API documentation for Input Structures](api-input-structures.md#feedback)
for further details on what that means.

### Labels

`OutputStructure`s can have labels.  To make this as general as possible, we
implement it by giving each such structure a `hasLabel(string)` function
that returns true or false, whether the structure has `string` as a label.
This lets us write label-checking functions that take into account whatever
freedom (or lack thereof) we choose, such as whether whitespace,
punctuation, case, etc. are relevant.

From any given `OutputStructure` `S`, you can call `S.lookup(label)` and it
will find the closest accessible structure in the Output Tree with that
`label`.  To do the lookup in some other list, call
`OutputStructure.lookup(label,accessibles)`; in that situation, it is
presumed that the list should be searched in reverse, as if reading
backwards up through a document.

## The `OutputExpression` class

An important subclass of `OutputStructure` is `OutputExpression`, which is
used to represent mathematical expressions of all kinds.  We give them
attributes that make it clear how they can be converted to OpenMath objects,
and provide a `toOpenMath()` function in the `OutputExpression` class for
doing so.  This makes it so that they can be used with tools like
[the matching package](https://github.com/lurchmath/first-order-matching),
which operate on OpenMath objects.  The reverse function can be called on
OpenMath objects, `toOutputExpression()`.
