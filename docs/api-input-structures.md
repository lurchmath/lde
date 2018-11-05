
# API Documentation for the `InputStructure` Class and its Subclasses

## Source Code

 * [The `InputStructure` class](https://github.com/lurchmath/lde/blob/master/src/input-structure.litcoffee)
 * [Unit tests of the `InputStructure` class](https://github.com/lurchmath/lde/blob/master/tests/input-structure-spec.litcoffee)

## Purpose

For information on the generic notion of Structures, see
[the API documentation for the base `Structure` class](api-structures.md).
That explains not only the concepts common to all Structures, but also how
`InputStructure`s fit into the bigger picture.

In this file, we cover the details specific to the `InputStructure` subclass
as well as its subclasses.  We break this document into sections, one for
each subclass of `InputStructure`, including `InputStructure` itself.

## The `InputStructure` class

This class overrides none of the methods of its superclass, so you can refer
to [the superclass API documentation](api-structures.md) for information
about many of the class's features.  It adds the following features.

### Dirty/Clean Status

In the Input Tree, the `dirty` flag of an `InputStructure` signifies whether
that node in the tree needs to be reinterpreted (i.e., has changed since its
last interpretation, or something else that's relevant changed since its
last interpretation).  Because the interpretation of parent nodes is
dependent on the interpretation of child nodes, if a node is marked dirty,
its parent should be as well (and so on, up the ancestor chain).

Thus the `InputStructure` class provides a `markDirty(yesOrNo)` function to
guarantee this property.  If you call it with a false argument (to mark the
Structure clean) then it operates on only the Structure in which you called
it.  But if you call it with a true argument, then it recursively continues
up the ancestor chain, marking the whole chain dirty.

The same `isDirty()` function from the `Structure` base class remains
available, unchanged.

### Feedback

To make it easy to give feedback about `InputStructure` instances, we
provide an instance method called `feedback()`.  You can call
`X.feedback(Y)` in any `InputStructure` `X`, passing any JSON object `Y`
containing the feedback you wish to send, and it will add `X.id()` as the
`subject` field of `Y`, then call the LDE's global feedback function to
transmit `Y` to the client.

This transmission takes different forms depending on the client.  See the
[relevant section in the LDE API documentation](api-lde.md#receiving-feedback).
