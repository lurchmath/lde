
# LDE Design Phase 0: Structures

All the later phases will actually implement stuff that we could use to
make real documents and libraries.  This one doesn't, so it's called Phase
0.

In this phase, we just design the generic Structure class on which everything else will depend, and the infrastructure of the LDE itself.

At the end of this phase, we could write unit tests of the whole Structure class and its LDE context, thus guaranteeing that all later phases rest on a good foundation.

## Methods in the Structure class

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
 * `S.properties()` looks at the set of other structures that connect to S
   via arrows, and forms a dictionary of name=value pairs, the "properties"
   of S.
 * `S.isAccessibleTo(S')` returns true or false, implementing the
   accessibility relation defined earlier.
 * `S.findCited(n)` finds the first structure S' accessible to S with
   name=n in `S'.attributes()`, or undefined if there is no such structure
   S'.
 * `S.whatCitesMe()` finds all structures S' in the scope of S with
   a=`S.attributes().name` in `S'.attributes()`, with a being one of the
   keys we use for citation, such as "reason" or "premise" and so on.
 * There may be a need later to create other accessibility-related
   routines, such as `S.allAccessibleToMe()` or `S.myScope()` or
   `S.allAccessibleSatisfying(P)` etc.
 * `S.wasInserted()` is a function that the UI will call in a brand new
   structure as soon as it is inserted into the document.  Each structure
   type may implement this function to do whatever it feels is necessary to
   initialize its internal data and notify any nearby nodes in the LDE
   Document about its arrival.  Some structure types may choose to leave
   this as an empty function.
 * `S.wasRemoved(parent,index)` is a function that the UI will call in a
   structure the moment it is deleted from the document (but not yet
   deleted from JavaScript memory).  The first parameter will be the former
   parent structure (which will always exist, since the root of the LDE
   Document can't be deleted) and the index that S formerly had within that
   parent.  Similarly, each structure type can implement this as it sees
   fit, including doing nothing.  Note that replacing one structure with
   another will yield a call to `S.wasRemoved()` in the one structure and
   `S.wasInserted()` in the other.
 * `S.wasChanged()` is a function that the UI will call in a structure if
   something about the structure changed (such as one of its attributes or
   the contents of an atomic structure)
    * `S.text()` returns the contents of S as plain text
    * `S.children()` yields an ordered array of structures immediately
      inside S
    * `S.parent()` yields the parent structure of S, or undefined if S is
      the LDE Document root

## LDE in general

When the LDE is loaded into memory it will:

 * Create a global Structure that is the LDE Document.  It will be a
   generic Structure, not a subclass.  It will have no children; they
   can be added later.  That is, it starts as a one-node tree, root only.
 * Establish a global mapping from unique Structure IDs to the instances
   that have those IDs
 * Defines a global function for deserializing Structure instances (or
   subclass instances) from JSON data
 * If it detects that it is being run in a background thread, it will
   set up listeners for messages from the parent thread.  These
   listeners will handle messages of three types:
    * Insert a new subtree.
        * The message must include the unique ID of the parent, the
          index at which the subtree will be inserted, and all the data
          defining the subtree (serialized in JSON form, as required
          for transmission to JavaScript background threads).
        * If the Structure (once it's deserialized) doesn't have an ID,
          give it a new, unique one as determined by the global
          mapping, and insert the new (id,instance) pair into that
          mapping
    * Delete an existing subtree.  The message must include the unique
      ID of the tree to delete.  Remove it from the global ID mapping
      as well and erase its ID attribute.
    * Replace a subtree with a new one.  The message must include the
      unique ID of the tree to replace and the data defining the
      replacement (serialized as just described).  Remove the replaced
      one from the global ID mapping as well and erase its ID attribute.
 * Even if it is not being run in a background thread (but perhaps was
   loaded as a module in some command-line app, for instance) it will
   still expose insert, delete, and replace functions as part of the
   module's API.
 * We will call any kind of insertion, removal, or replacement of
   subtrees of the LDE Document a change event, whether it happened via
   a message from a parent thread or as a function call to the LDE as a
   module in a larger app.

## Notation in code

Ensure that the Structure (and, later, other subclass) constructors are
sophisticated enough to help us build LDE Documents easily in the unit
testing suite, like so:

```javascript
Structure(
    FormalSystem(
        Rule(
            "function ( step ) { return { valid: step.text().length < 5, message: 'Boy is this silly.' }; }",
        ).attr( { name : "silly rule" } )
    ),
    AtomicExpression( "yay" ).attr( { id : 1 } ),
    AtomicExpression( "silly rule" ).attr( { "outgoing edges" : [ { targetId : 1, type : "reason" } ] ),
    AtomicExpression( "oh rats" ).attr( { id : 2 } ),
    AtomicExpression( "silly rule" ).attr( { "outgoing edges" : [ { targetId : 2, type : "reason" } ] )
)
```

or even

```javascript
Structure(
    FormalSystem(
        Rule(
            "function ( step ) { return { valid: step.text().length < 5, message: 'Boy is this silly.' }; }",
        ).attr( { name : "silly rule" } )
    ),
    AtomicExpression( "yay" ).attr( { id : 1 } ),
    AtomicExpression( "silly rule" ).attr( { "reason for" : 1 } ),
    AtomicExpression( "oh rats" ).attr( { id : 2 } ),
    AtomicExpression( "silly rule" ).attr( { "reason for" : 2 } )
)
```

or even

```javascript
Structure(
    FormalSystem(
        Rule(
            "function ( step ) { return { valid: step.text().length < 5, message: 'Boy is this silly.' }; }",
        ).attr( { name : "silly rule" } )
    ),
    AtomicExpression( "yay" ),
    AtomicExpression( "silly rule" ).attr( { "reason for" : "previous" } ),
    AtomicExpression( "oh rats" ),
    AtomicExpression( "silly rule" ).attr( { "reason for" : "previous" } )
)
```
