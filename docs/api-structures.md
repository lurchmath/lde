
# API Documentation for the `Structure` Class

## Source Code

 * [The `Structure` class](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee)
 * [Unit tests of the `Structure` class](https://github.com/lurchmath/lde/blob/master/tests/structure-spec.litcoffee)

## Purpose

The Lurch Deductive Engine (LDE, [documented here](api-lde.md)) maintains
two data structures, one called the Input Tree and one called the Output
Tree.  In both cases, the trees' nodes are instances of this class
(`Structure`).  In particular, the Input Tree is composed of
`InputStructure` instances (a direct subclass of `Structure`) and the Output
Tree is composed of `OutputStructure` instances (another direct subclass)

We build into this base class all the functionality that must be present at
every point in those hierarchies, and leave to subclasses that functionality
that makes sense only for specific types of structures.  For instance, this
class contains no functionality to support rules of inference, because they
are one specific type of `OutputStructure`, so their functionality will be
implemented in a subclass for that purpose.

## Constructing and Serialization

There is one constructor for the class
([see source code](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#constructor)):

`Structure(child1,child2,...)` creates a new instance, with the given list
of children, each of which must be a `Structure` instance (or it will be
ignored).  All such children are removed from any old parent they had before
being inserted into this newly created one.

Instances can be converted to and from JSON, for saving to a file, storing
permanently anywhere, or transmitting across threads or network connections.
To ensure that deserialization correctly reconstructs instances of the right
subclass of `Structure`, each subclass must be registered.  To do so, we
provide the `addSubclass` function.  Use it like so.

JavaScript:
```js
    MySubclass = function ( /* ... */ ) { /* ... */ };
    // ...
    MySubclass.prototype.className = Structure.addSubclass( 'MySubclass', MySubclass );
```

CoffeeScript, somewhere inside the class definition:
```coffeescript
    class MySubclass extends Structure
        # ...
        className : Structure.addSubclass 'MySubclass', MySubclass
        # ...
```

Then one can serialize and deserialize any hierarchy containing `Structure`
instances, as well as instances of its subclasses, using the member function
`someInstance.toJSON()` (which obviously yields a JSON structure) or the
class function `Structure.fromJSON(data)`, which accepts JSON data created
from the first function.

Serializing a structure preserves its class, its attributes ([documented
below](#structure-attributes-and-connections)), and the hierarchy for which
it is the root.

## Structure hierarchies

To navigate or alter a hierarchy of `Structure` instances, use the
following member functions present in each instance.

 * `instance.parent()` yields the parent structure, or `null` if there is
   no parent (i.e., the instance is the root of a hierarchy)
 * `instance.children()` yields an array containing the children structures,
   in order, or an empty array if there are none
 * `instance.indexInParent()` yields the index of the child in its parent's
   ordered list of children, or unddefined if the instance has no parent
 * `instance.previousSibling()` and `instance.nextSibling()` yield the
   adjacent structure in the parent's child list, forward or backward, as
   expected, or undefined if there is no such sibling
 * `instance.removeFromParent()` drops the instance from it's parent's list
   of children (thereby decreasing the length of that child list by 1) and
   thus making `instance.parent()` null
 * `instance.removeChild(index)` is a convenience equivalent to
   `instance.children()[index].removeFromParent()`
 * `instance.insertChild(child,index)` expects a structure instance as the
   first argument and an index into the children list as the second.  It
   inserts the new child at that index, thus increasing the number of
   children by 1.  You may use an index equal to the length of the child
   list to append.  The child is removed from its previous parent, if any,
   before being inserted here.
 * `instance.replaceWith(other)` expects another structure instance as its
   argument.  It removes `instance` from its parent, if there is one, and
   then inserts `other` at the same index in the parent, thus replacing
   `instance`.  This has no effect if `instance` has no parent.  It is
   equivalent to successive calls to `removeFromParent()` and
   `insertChild()` at the instance and its parent, respectively.
 * `instance.copy()` makes a deep copy of the instance, including all nodes
   below it in the hierarchy.  This new copy will have all the same IDs as
   the previous copy, so to preserve uniqueness of IDs, you will usually
   want to call `copiedInstance.clearIDs()` afterwards.

The order of nodes in the hierarchy is often important.  We have one simple
order relation on the nodes in the hierarchy and one more complex.  The
simplest is just whether node A is "earlier than" node B, in the order
induced by an in-order tree traversal (that is, the order in which the open
parentheses would appear if the tree were written as a LISP expression).
This relation can be tested with `instance.isEarlierThan(other)`.

The more complex order relation is accessibility, which we do not define
here, because it is already defined [in the source code
documentation](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#accessibility).
That relation is implemented with the following member functions available
in all instances of the class.

 * `A.isAccessibleTo(B)` implements the relation as defined at the link
   given above.
 * `A.isInTheScopeOf(B)` is equivalent to `B.isAccessibleTo(A)`.
 * `A.iteratorOverAccessibles()` yields an "iterator" object, which is an
   object that can produce the list of nodes accessible to `A` by repeated
   calls to the `next()` member of the object.  Consider the following
   JavaScript code that would use such an iterator.

```js
    var iterator = A.iteratorOverAccessibles();
    var accessible;
    while ( accessible = iterator.next() ) {
        console.log( 'The next accessible structure is:',
            accessible.toJSON() );
    }
```

Nodes are produced by the iterator in reverse order (under the
`isEarlierThan` relation) starting from the first accessible node before
`A`.  When the `next()` function yields null for the first time, the end of
the list has been reached.  (The `next()` function will yield null forever
thereafter.)

Iterators are more efficient than producing the entire list and returning
it, because the client may be seeking just one particular node in the list,
and thus producing the entire list so that the client can search just a
small part of it could be wasteful.

There is an analogous function for scopes.

 * `A.iteratorOverScope()` functions like `A.iteratorOverAccessibles()`, but
   walks forwards through the structure, including precisely those nodes for
   which `B.isInTheScopeOf(A)` holds true.

There are then four functions that use these iterators under the hood.
Clients will most likely wish to use these rather than have direct access
to the iterators.

 * `A.firstAccessible(P)` expects `P` to be a one-place predicate (that is,
   a JavaScript function that can be evaluated on a single argument, and
   yields true or false in each case) and yields the first item on the
   "accessibles" list (as given by `A.iteratorOverAccessibles()`) for which
   `P` yields true.  It returns undefined if there is no such thing.
 * `A.firstInScope(P)` expects `P` to be a one-place predicate, as just
   defined, and behaves just like `firstAccessible()`, except it walks
   through `A.iteratorOverScope()` instead.
 * `A.allAccessibles(P)` expects `P` as in the previous two functions, and
   yields all nodes accessible to `A` that satisfy `P`, in the same order
   they would be reported by `iteratorOverAccessibles()`.
 * `A.allInScope(P)` expects `P` as in the previous two functions, and
   yields all nodes in the scope of `A` that satisfy `P`, in the same order
   they would be reported by `iteratorOverScope()`.

## Structure attributes and connections

The following functions available in each instance of the structure class
support attributes.

 * `instance.getAttribute(key)` looks up attributes by a given string `key`.
 * `instance.setAttribute(key,value)` stores attributes under a given
   string `key` with value `value`, which should be a JSON structure (or
   atomic data).  No check is made to verify that the value is of this
   type, but errors will transpire later if this condition is not satisfied
   (specifically, serialization errors).
 * `instance.clearAttributes(key1,key2,...)` removes the key-value pairs
   of attributes associated with any of the keys passed as parameters.  It
   is acceptable to pass any number of keys, including just one.  If zero
   are passed, *all* key-value pairs are removed.
 * `instance.attr(object)` adds all attributes of the given object as
   attributes to the instance, and returns the instance itself.  This is
   useful when constructing hierarchies, as follows.

```js
    var A = new Structure(
        ( new Structure() ).attr( { name : 'example structure' } ),
        ( new Structure() ).attr( { color : '#99ff00' } )
    );
```

### Connections as a type of attribute

Within a structure's attributes are two key-value pairs that should not be
used for any other purpose, those with keys `connectionsOut` and
`connectionsIn`.  These store data about connections between pairs of
structures in the same heirarchy.  The data is stored by structure IDs, so
making connections assumes that structures each have a unique ID, as
documented [below](#unique-ids).

You can query the connections among structures with these functions:

 * `source.allConnectionsOut(type)` returns a list of all destinations to
   which the source is connected by one or more connections of the given
   type.  Each destination appears on the list a number of times equal to
   the number of connections of the given type from the source to that
   destination.
 * `destination.allConnectionsIn(type)` functions analogously to the
   previous, but for connections into a destination, rather than out from a
   source.
 * `source.allConnectionsOut()` returns a list of destination-type pairs,
   all connections that go out from the given source structure.
 * `destination.allConnectionsIn()` functions analogously to the previous,
   but for connections into a destination, rather than out from a source.

To create or destroy connections, use these functions:

 * `source.connectTo(destination,type)`, where `source` and `destination`
   are `Structure` instances and `type` is a string containing the type of
   connection, creates a new connection.  There can be multiple connections
   between the same two structures, even of the same type.  Returns true if
   the connection was formed, false if some error prevented it (such as the
   destination not being a structure, or not having an ID, or the source
   not having an ID).
 * `source.disconnectFrom(destination,type)` undoes the previous operation.
   Because there may be multiple connections between the source and
   destination of the same type, this simply decreases that number by one.
   Returns true on success or false on failure (for example, if there were
   no connection to delete).

If the `connectionsOut` and `connectionsIn` data is directly manipulated by
the client (not recommended), then you can call `root.fillOutConnections()`
to ensure that the connection data stored in every source matches that
stored in the corresponding destinations, and vice versa.

## Unique IDs

The `Structure` class maintains a mapping from IDs (as strings) to instances
of the class.  An instance gets its ID from the attribute with key "id."
All IDs in a hierarchy can be tracked (that is, recorded into this
class-level mapping) with the `trackIDs()` function documented below.

Here are the relevant functions:

 * `instance.id()` returns the instance's ID, if it has one, or undefined if
   not
 * `instance.trackIDs()` asks the class to update the class variable that
   maps IDs to instances, recording the connection of all IDs for all nodes
   in the hierarchy whose root is `instance`.  This will overwrite earlier
   data in that mapping if and only if you have not kept IDs unique.
 * `instance.untrackIDs()` removes from the class-level mapping all IDs that
   appear in the hierarchy whose root is `instance`.  If you are done with
   a `Structure` instance, you must call this function in it, so that its
   memory is guaranteed to eventually be garbage collected.
 * `Structure.instanceWithID(id)` takes a string ID and yields the instance
   with that ID, if there is one, and that instance has recorded its ID in
   the class-level variable for this purpose by means of a call to
   `trackIDs()`, or null or undefined if there is none.

## Events and event handlers

Any `Structure` instance fires up to six different types of events during
its lifetime: `willBeInserted`, `wasInserted`, `willBeRemoved`,
`wasRemoved`, `willBeChanged`, and `wasChanged`.  To install an event
handler for one of these, simply overwrite that key in the `Structure`
object itself, as in `myStructure.willBeRemoved = myHandlerFunction`.

Insertion events are fired immediately before/after the `Structure` is added
as a child under a new parent.  Removal events are fired immediately
before/after the `Structure` is removed from an existing parent.  Change
events are fired immediately before/after an attribute of the `Structure`
instance changes.

Example:

```js
    var A = new Structure();
    var B = new Structure();
    A.willBeInserted = function () { console.log( 'Now!' ); };
    B.insertChild( A ); // prints 'Now!' to console just before inserting
```
