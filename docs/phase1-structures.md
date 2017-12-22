
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 1: Structures

## Content

In this phase, we just design the generic Structure class on which
everything else will depend, and the infrastructure of the LDE itself.

## Goal

At the end of this phase, we could write unit tests of the whole Structure
class and its LDE context, thus guaranteeing that all later phases rest on a
good foundation.

## Status

This phase has been implemented, and is documented in the API Documentation,
accessible from the navigation menu at the top of this site.

# The Structure module

That module defines a single `Structure` class, whose instances have these
methods.

## Computed attributes

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

 * `S.setComputedAttribute(key,value)` caches a computed value under a
   certain key
    * One important example of a computed attribute:
    * `S.setComputedAttribute("feedback",obj)` tells the UI the type of
      feedback it should show for structure S, with obj having these keys:
        * result: a string, either "valid" or "invalid" or "indeterminate"
        * message: a string, the message should be shown on hover of the
          feedback indicator
        * section: (optional) which character (or range of characters) are
          the specific ones on which the feedback focuses.
            * For instance, if something doesn't parse, you might want to
              point out where it failed.
            * Or if an expression parses into many steps of work, each of
              which gets validated separately, then the feedback needs to
              be localized.
 * `S.getComputedAttribute(key)` fetches the computed attribute value, or
   returns undefined if it's not stored
 * `S.clearComputedAttributes(key1,key2,...)` removes the computed values;
   calling it with no arguments removes all computed values
 * `S.compute(key1,key2,...)` runs whatever function is necessary to
   compute and store the attributes for the keys.
    * It should usually be obvious what this is from context, like if S has
      a function `S.meaning()` and we say `S.compute("meaning")` that means
      run `S.setComputedAttribute("meaning",S.meaning())`.
    * In fact, the base implementation in the structure class does exactly
      what is described in the previous bullet point; `S.compute(k)` runs
      `S[k]()` and stores the result.  To pass parameters, instead of a
      string key, pass an array `[key,arg1,arg2,...]`.
    * But more complex examples are possible, and each structure type is in
      charge of implementing `compute()` in the appropriate way.

## External attributes

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

Just as computed attributes are a key-value dictionary, so are external
attributes.  However, we keep them separate because computed attributes are
those created by the LDE itself, internally, as the result fo some
computation on the structure, but external attributes are provided by the
client of this module, and are not altered by the LDE.

Thus we have the same three functions for manipulating the key-value
dictionary (get/set/clear) but no corresponding `compute` function.

 * `S.setExternalAttribute(key,value)` stores a value under a given key.
 * `S.getExternalAttribute(key)` fetches the attribute value, or returns
   undefined if it's not stored.
 * `S.clearExternalAttributes(key1,key2,...)` removes the stored values;
   calling it with no arguments removes all stored values.

## Manipulating the structure hierarchy

Work done in this section:

 * [ ] Code implemented
 * [ ] Unit tests written and passing
 * [ ] API documentation written

Specification:

 * `new Structure(arg1,arg2,...)` creates a structure with the given list of
   child structures.
 * `S.children()` yields an ordered array of structures immediately
   inside S
 * `S.parent()` yields the parent structure of S, or undefined if S is
   the LDE Document root
 * `S.indexInParent()` gives the index of S in its parent's children array.
 * `S.insertChild(child,index)` inserts a new child at the given index,
   removing it from its old parent, if there was one.
 * `S.removeChild(index)` does the reverse.
 * `S.removeFromParent()` calls `P.removeChild(index)` in the parent of S,
   passing `S.indexInParent()`.
 * `S.replaceWith(other)` replaces S, where it sits in the hierarchy, with
   a different structure, thus leaving S with no parent.
 * `S.copy()` makes a deep copy of S, or equivalently, the subtree with root S.

## Event handling in the structure hierarchy

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

Each of the following functions will be called by the functions above, when
the event is complete.  There is no default implementation of each of these
functions, which means that no call will take place.  However, any instance
or subclass may choose to implement one or more of these functions as event
handlers, and thus hear about the events they signal.

 * `S.wasInserted()` will be called in any structure inserted into any
   parent structure, including just-constructed structures being inserted
   into a parent for the first time.  It is called after the insertion, so
   `S.parent()` will yield a valid `Structure` instance.
 * `S.wasRemoved(parent,index)` will be called immediately after S is
   removed from its previous parent (but obviously S has not yet been
   deleted from JavaScript memory).  The first parameter will be the former
   parent structure (which will still exist, because the removal juts
   happened) and the index that S formerly had within that parent.  Note
   that replacing one structure with another will yield a call to
   `S.wasRemoved()` in the one structure and `S.wasInserted()` in the other.
 * `S.wasChanged()` is a function that the UI will call in a structure if
   one of the structure's computd or external attributes changed.

## Unique IDs

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

 * The Structure class establishes a global mapping from unique Structure
   IDs to the instances that have those IDs.
 * Clients can assign or release IDs for structures using the instance
   methods `getID()` and `releaseID()`.
 * Clients can look up structures from IDs using
   `Structure.instanceWithId(id)`.

## Connections

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

 * Structures support two special external attribute keys, "connectionsOut"
   and "connectionsIn," each a multiset of targetID-connectionType pairs.
   Example such multiset (this particular one with no repeated entries):
   `[ [3,'reason'], [12,'premise'] ]`
 * We will want to keep these consistent across a given structure hierarchy.
   Consequently, we do two things.
    * We provide the function `S.fillOutConnections()` that can be called
      with `S` equal to the hierarchy's root, and it will ensure that a
      connection stored in the "connectionsOut" array of any node in the
      hierarchy is also stored in the "connectionsIn" array of its target,
      and vice versa.
    * We provide a convenience function for creating connections,
      `S.connectTo(T,type)`, that creates the connection by adding it to
      both the "out" list for `S` and the "in" list for `T`.
    * We provide a convenience function for deleting connections,
      `S.disconnectFrom(T,type)` that deletes the connection from both
      lists.
 * We also provide the following convenience functions that assume that the
   hierarchy's in and out connection lists are the same.  That assumption
   will be satisfied if no method of editing connection lists was ever used
   other than the convenience functions given above, or if such a method
   were used, then `fillOutConnections()` has been called on the hierarchy
   root since that time.
    * Get all connections of some type to/from `S` with
      `S.getConnectionsOut(type)` (or `In`).
    * Get all connections to/from `S` by omitting the type from the call in
      the previous bullet point.
    * Get all connections from `S` to `T` with `S.getConnectionsTo(T)`.
 * `S.properties()` looks at the set of other structures that connect to S
   via arrows, and forms a dictionary of name=value pairs, the "properties"
   of `S`.  The key will be the type of the connection and the value will be
   the array of structures that connected to this one with that connection
   type.

## Convenience constructions for unit testing

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

 * Create `S.attr(obj)` that will add as external attributes all key-value
   pairs in `obj`, returning `S` for use in hierarchy-building.
 * Append to the constructor code that traverses the tree and attempts to
   make connectionsOut attributes consistent with connectionsIn attributes,
   in a full tree traversal.
 * Enhance that tree traversal so that it finds attributes with common
   connection-type keys ("reason for", "premise for", etc.) and converts
   them into connectionsOut members before doing the consistency checking.
   E.g., `S.attr({"reason for":3})`.
 * Enhance that further so that the value associated with such a key can be
   a string from among a small set of relative references, such as
   "previous" and "next."  E.g., `S.attr({"reason for":"previous"})`.

## Accessibility

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

 * `S.isAccessibleTo(T)` returns true or false, implementing the
   accessibility relation defined earlier.
 * `S.text()` and `S.isAReference()`
 * `S.isALabelFor(T)` (plus `isAPremiseFor` and `isAReasonFor`)
 * `S.lookup(n)` finds the first structure `T` accessible to `S` with
   label `n`.
 * `S.labels()`, `S.reasons()`, and `S.premises()`
 * `S.cites(T)` and `S.whatCitesMe()`

## Miscellany

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

 * `S.text()` returns the contents of `S` as plain text.  This just looks up
   the external attribute "test," which can be filled in by the client for
   structures that have text content.

# LDE Module

## Global functions and data

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

 * Defines global functions for serializing and dezerializing Structure
   instances (or subclass instances) to/from JSON data.  The important half
   of this pair is deserialization, but to help with testing, it makes sense
   to also create a corresponding serializer.
 * Create a global Structure that is the LDE Document.  It will be a
   generic Structure, not a subclass.  It will have no children; they
   can be added later.  That is, it starts as a one-node tree, root only.

## Foreground/background

Work done in this section:

 * [x] Code implemented
 * [x] Unit tests written and passing
 * [ ] API documentation written

Specification:

Implement the following four functions that modify the global LDE Document
object and expose them as part of the LDE module's API.

 * `insert(serializedStructure,parentID,insertionIndex)` should deserialize
   the given structure from JSON, find the descendant of the LDE Document
   that has the given ID, and insert the deserialized version as one of its
   children, at the given index.  If anything goes wrong in that process
   (e.g., can't deserialize, can't find descendant with that ID, invalid
   insertion index) then do nothing.  When you deserialize the structure,
   be sure to call `setup()` in it, to give IDs recursively.
 * `delete(subtreeID)` finds the descendant of the global LDE Document that
   has the given ID and, assuming such a structure exists, removes it from
   its parent and releases all IDs within it.
 * `replace(subtreeID,serializedStructure)` finds the descendant of the
   global LDE Document that has the given ID and, assuming such a structure
   exists, deserializes the second argument and uses it to replace that
   structure.  The deserialized version will have `setup()` run in it before
   insertion into the Document, so that it has IDs.  The structure that was
   removed to do the replacement will have all the IDs within it released.
 * `setAttribute(subtreeID,key,value)` finds the descendant of the global
   LDE Document that has the given ID and, assuming such a structure exists,
   calls its member function for setting an external attribute with the
   given key and value.

If the LDE detects that it is being run in a background thread, it will set
up listeners for messages from the parent thread.  These listeners will
handle messages of four types, insert/delete/replace/attribute, mirroring
the four functions given above, and calling them internally.

We will call any kind of insertion, removal, or replacement of subtrees of
the LDE Document a change event, whether it happened via a message from a
parent thread or as a function call to the LDE as a module in a larger app.

# Later enhancements

The following enhancements to work from Phase 1 are proposed, but are not
essential enough to have been included in the Phase 1 work.  We list them
here so as not to lose track of important ideas, and we leave empty check
boxes next to them so that we can later mark them complete as they are
implemented.

 * [ ] Make the `labels()` function more efficient as follows.
    * Whenever it is computed, cache the value in an internal field.
    * The next time `labels()` is called, use the cached value if it exists.
    * Whenever you call `wasChanged()`, be sure to clear the cached value.
 * [ ] Make the `whatCitesMe()` function more efficient by making it loop
   manually through all the things in scope, tracking when anything it is
   scope eclipses it by being labeled with one or more of its labels.  If at
   any point it has no more labels left in force, stop iterating.  This is a
   minor performance gain, because it will be rare that a structure is fully
   eclipsed by other structures with the same name.
