
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 2: The Input Tree

## Content

In this phase, we add the Input Tree, a hierarchy comprised of a new kind of
`Structure` subclass, called `InputStructure`.

## Goal

The `InputStructure` class will exist and be used by the LDE module.

## Status

This has been partially implemented.  See the tasks below, some marked
complete and some not yet marked complete.

## `InputStructure` class

 * [x] Create a subclass of `Structure`, in its own new module,
   `src/input-structure.litcoffee`.
 * [x] Add documentation explaining what it is and will do (though that
   documentation can grow with time).
 * [x] Ensure that the `InputStructure` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'InputStructure', InputStructure` in
   the `InputStructure` class code.)
 * [x] Rewrite the LDE module so that it no longer takes as input generic
   `Structure` instances, but specifically `InputStructure` instances.  All
   of its methods should be updated to use `InputStructure`s where they
   currently use `Structure`s.  This will require importing the
   `input-structure.litcoffee` module instead of the generic
   `structure.litcoffee` one.
 * [x] Rename the global `Structure` hierarchy in that file to be
   `InputTree` rather than `LDEDocument`.
 * [x] Update all documentation in that file to reflect the changes just
   made.
 * [x] Update all unit tests of the LDE module to reflect this change to
   `InputStructure`s.  This will require importing the
   `input-structure.litcoffee` module instead of the generic
   `structure.litcoffeee` one.
 * [x] Create a new unit test file for `InputStructure`s that is extremely
   basic, just testing to be sure that the symbol `InputStructure` is
   defined at the global scope and creates things that are instances of the
   generic `Structure` base class.
 * [x] Add documentation for that unit test file, following the pattern
   established in the documentation of other unit test files in this
   repository.
 * [x] Once the unit tests pass, build everything and commit.

## Accepting actual instances

 * [x] The LDE module was written to accept only JSON-serialized forms of
   `Structure`s as parameters to its methods.  Update those functions so
   that they now accept either serialized forms or actual instances, and can
   tell the difference and respond appropriately.  (That is, deserialize any
   serialized instances, but don't do that if the argument was already an
   instance.)
 * [x] Extend the unit test suite of the LDE module so that it tests this
   new feature of each API method of the LDE module.
 * [x] Update all documentation in that file to reflect the changes just
   made.
 * [x] Once the unit tests pass, build everything and commit.

## Marking structures dirty

 * [x] Extend the base `Structure` class with a field called `dirty`, which
   is initialized to false in the constructor.  This field does not need to
   be part of any serialization or deserialization of instances.
 * [x] Create an `isDirty()` method that returns the value of that member
   variable.
 * [x] Create a `markDirty()` method in the `InputStructure` class that sets
   the `dirty` flag to true, and does so for all ancestors as well.
 * [x] Update all documentation in that file to reflect the changes just
   made.
 * [x] Add to the unit tests for `InputStructure`s a few simple tests for
   these new routines.
 * [x] Add documentation in that file describing the changes just made.
 * [x] Once the unit tests pass, build everything and commit.

## Connecting modules

 * [x] Give the `Structure` class a class method called `feedback`, whose
   default implementation just writes to the console saying that the
   feedback implementation doesn't exist yet.
 * [x] Give the `InputStructure` class a method called `feedback`, accepting
   a data object as parameter, and extending it with a `subject` field whose
   value is the unique ID of the `InputStructure` in question, then passing
   that new object on to the `feedback` class method in the `Structure`
   class.
 * [x] In the LDE module, if it detects that it has been loaded in Node.js
   or the main browser thread, then create a global variable called
   `Feedback` that is an instance of `EventTarget`.  In the module case,
   export that variable; in the browser case, just let it be global.
 * [x] In the LDE, create a module-global `feedback` function that does one
   of two things:
    * If it detects that the LDE is running in a Node.js module or in the
      main browser thread, it calls, in the global `Feedback` object,
      `dispatchEvent(e)`, where the `Event e` holds the parameter passed to
      `feedback`.
    * If it detects that the LDE is running in a WebWorker (or the
      equivalent construct in Node.js), it sends its parameter along by
      posting a message to be heard by the parent thread.
 * [x] In the LDE, when it imports the `Structure` module, have it overwrite
   the default implementation of `feedback` in the `Structure` class with
   a call directly to the `feedback` function in the LDE.
 * [x] Update all documentation in that file to reflect the changes just
   made.
 * [x] Add to the unit tests for the LDE module a few simple tests for
   these new routines.
 * [x] Add documentation in that file describing the changes just made.
 * [x] Once the unit tests pass, build everything and commit.

## LDE API

### Small, Miscellaneous Updates

 * [x] Now that we have changed from a generic `Structure` class paradigm to
   specific Input and Output Structures, reread the API Documentation of
   both [the LDE](api-lde.md) and [the Structure class](api-structures.md),
   updating anything that's out-of-date.
 * [x] Add a page to the API documentation for the `InputStructure` class
   and all of its upcoming subclasses.
 * [x] Update `mkdocs.yml` in the project root to include that new file in
   the generated documentation.
 * [ ] Update the API in the LDE module to include the word "Structure" in
   each method call, because we will soon add methods for connections as
   well.  So for instance, make it `insertStructure` rather than just
   `insert`, and so on.
 * [ ] Update all unit tests and API documentation, and when the unit test
   pass, then commit.
 * [ ] Tweak the existing `setStructureAttribute()` API method so that it
   does not permit the client to use attribute names that begin with an
   underscore, so that we can "namespace" those for internal purposes.
 * [ ] Update the LDE API documentation page to cover these new routines.
 * [ ] Add a unit test for that change to `setStructureAttribute()` as well.

### Upgrading Connections

 * [ ] Update the implementation in the `Structure` method for connections,
   to satisfy the following requirements.
    * Do not put all connections data in one big attribute.  Rather, when
      creating a connection between two nodes, place it in an attribute with
      a key of the form `_connection_N` for some natural number `N` not yet
      used by either endpoint of the connection.  This number `N` should be
      returned by the routine; always use `N`>1 so that we do not mistake
      `N`=0 for a return of a false value, as if the routine failed.
    * Do not restrict the third element of the connection tuple to being a
      string, but permit it to be arbitrary JSON data.  Store this only in
      the source of the connection, so as not to waste space.  This will
      necessitate changing the signature for disconnecting to not take a
      connection triple (source, target, type) but rather just the number
      `N` used when the connection was created.
 * [ ] All the unit tests should still pass; ensure this, then write a few
   more tests to ensure that you can use non-string JSON data as the third
   parameter when setting up the connection.  Then commit.
 * [ ] Add to the API a new method, `insertConnection(source,target,data)`,
   which connects two `InputStructure`s that are already in the Input Tree.
   We require each newly inserted connection to have, in its `data` object,
   an attribute whose key is "id" and whose values are strings that are
   unique across the Input Tree.  The `source` and `target` parameters are
   unique ids, just as `parent` is for `insertStructure`.  The `data`
   parameter is any JSON data that will be stored with the connection.
   If any of the above requirements on the parameters are not satisfied,
   the routine does nothing.
 * [ ] Add to the API a new method, `removeConnection(id)`, which
   disconnects two `InputStructure`s that are connected by the connection
   whose unique id was given.  If the parameter isn't the unique id for a
   connection in the Input Tree, the routine does nothing.
 * [ ] Add to the API a new method,
   `setConnectionAttribute(connection,key,value)`, which alters the data of
   an existing connection between two `InputStructure`s in the Input Tree.
   The first parameter must be the unique id of a connection, just as with
   `removeConnection`.  The `key` should be a string that is the key of the
   attribute to be modified, but if it is not a string it will be converted into one using the `String` constructor.  It cannot be the string "id"
   because that attribute must remain constant throughout the life of any
   connection.  The `value` can be any JSON data to use as the new attribute
   value, or `undefined` to indicate that the key-value pair should be
   deleted.  If any of the above requirements on the parameters are not
   satisfied, the routine does nothing.
 * [ ] Create unit tests for all of these new routines and ensure that they
   pass.
 * [ ] Rebuild docs and commit.

### Policing Connections

 * [ ] Add a function to the `Structure` class,
   `connectionsOutsideSubtree()`, which finds all connections that lead from
   any node in the subtree to nodes outside the subtree, and returns them in
   a list.  Each element in the list should be an object of the form
   `{ structure : structureInstance, number : connectionNumber }`, where the
   number is the `N` used in the attribute storing the connection.  This
   will be useful in the following routine, and also for clients who wish to
   know which connections may be severed by the following routine
   beforehand, so that they might move them or record them for later
   reconnecting somewhere.  (Document this function with this purpose.)
 * [ ] Update the `removeStructure()` function in the LDE API so that, if
   there are any connections from the structure being removed to other
   `InputStructure` instances *not* being removed, then those connections
   are severed as part of the removal process.  (Connections among the
   descendants of a subtree removed as a whole should stay connected.)
 * [ ] Add unit tests to ensure that these routines work.
 * [ ] Update the `replaceStructure()` function in the LDE API so that, if
   there are any connections from the structure being replaced to other
   `InputStructure` instances *not* being altered, then those connections
   are severd as part of the replacement process.  (Connections among the
   descendants of a subtree replaced as a whole should stay connected.)
 * [ ] Create a function in the `Structure` class that will transfer all
   connections in/out of node `X` to node `Y` instead, written as
   `X.transferConnectionsTo( Y )`.
 * [ ] Document the above routine as something that `interpret()` routines
   are welcome to use, if it is useful to them.
 * [ ] Add an optional third parameter to `replaceStructure()`, which
   defaults to false, but can be set to true to have `replaceStructure()`
   transfer all such connections to the replacement structure, rather than
   just sever them.
 * [ ] Add unit tests to ensure that these features work.
 * [ ] Rebuild and commit.
