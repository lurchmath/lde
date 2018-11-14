
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

## The `InputExpression` class

An `InputExpression` is the type of `InputStructure` that the LDE will
interpret into meaningful content in its Output Tree.  This is the first of
two `InputStructure` subclasses.  They are intended to be the *only* two
`InputStructure` subclasses; most other things should be subclasses of one
of these two.

`InputExpression`s are what we typically think of as the meaningful things
in the Input Tree.  They will have interpretation routines that will
produce nodes in the Output Tree.

To do their job, they have the following features.  (Some of these make more
sense if you've skipped ahead and read the purpose of `InputModifier`s
first.)

 * An `updateData()` function, which imports from any `InputModifier`
   connected to the expression all the data that such a modifier wishes to
   import, by calling `updateDataIn()` in the modifier, passing the
   expression as parameter.
 * Several functions for tracking which attributes of the expression were
   written by modifiers.  (See the miscellaneous technical details
   documented in [the relevant section of the source code](https://github.com/lurchmath/lde/blob/master/src/input-structure.litcoffee#expression-specific-functionality).)
 * Three convenience functions to make it easier for `InputModifier`
   instances to implement their `updateDataIn()` functions without causing
   collisions or overwriting of data in expressions.  See the documentation
   in [the relevant section of the source code](https://github.com/lurchmath/lde/blob/master/src/input-structure.litcoffee#convenience-functions-for-inputmodifiers).

## The `Dependency` class

The client may permit the user to write a document that begins by importing
the meaning expressed in some other, saved document.  We call that other,
saved document a "dependency" of the first.  To support this, we permit the
embedding into the Input Tree of the first document the meaning already
stored in the Output Tree of the dependency.  Interpretation can then just
copy that information over to the Output Tree as if it had been there all
along (which is the intent of importing a dependency in the first place).

This class supports that by permitting the user to contsruct a `Dependency`
in the Input Tree, passing it the list of `OutputStructure` instances that
have been loaded from the Output Tree of the dependency document it
represents.  Whenever it is interpreted, it just passes those same values
along into the Output Tree.

## The `InputModifier` class

An `InputModifier` is the type of `InputStructure` that will modify
`InputExpression`s, and thus impact how they are interpreted.  It does not
directly have an interpretation in the Output Tree itself, but only impacts
the interpretation of zero or more `InputExpression`s.

To support that, they have this functionality:

 * An overridden constructor and `insertChild()` routine that prevent adding
   children to an `InputModifier` instance.
 * Default (noop) implementations of `updateConnections()` and
   `updateDataIn()` that subclasses can override.
 * An implementation of `interpret()` that always returns an empty array.

The most common way to use this class will probably be to instead use the
following simple subclass.

## The `BasicInputModifier` class

The most common purpose of modifiers is probably going to be embedding
attributes into their targets.  To that end, we provide a class that does
exactly that.

It contains support for calling any of the three convenience functions that
expressions expose to modifiers: `setSingleValue`, `addListItem`, and
`addSetElement`.  The data for these calls can be given at construction time
so that one need not subclass this further to get the desired functionality,
but can just instantiate it instead.

Here is an example:

```javascript
var example = new BasicInputModifier(
    [ 'color', 'red', 'setSingleValue' ],
    [ 'brother', 'Steve', 'addSetElement' ],
    [ 'brother', 'Eric', 'addSetElement' ]
);
example.updateDataIn( expression );
// does all of the following:
// expression.setSingleValue( 'color', 'red' );
// expression.addSetElement( 'brother', 'Steve' );
// expression.addSetElement( 'brother', 'Eric' );
```
