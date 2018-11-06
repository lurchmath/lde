
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
 * [x] Update the API in the LDE module to include the word "Structure" in
   each method call, because we will soon add methods for connections as
   well.  So for instance, make it `insertStructure` rather than just
   `insert`, and so on.
 * [x] Update all unit tests and API documentation, and when the unit test
   pass, then commit.
 * [x] Tweak the existing `setStructureAttribute()` API method so that it
   does not permit the client to use attribute names that begin with an
   underscore, so that we can "namespace" those for internal purposes.
 * [x] Update the LDE API documentation page to cover these new routines.
 * [x] Add a unit test for that change to `setStructureAttribute()` as well.

### Upgrading Connections

 * [x] Remove the `allConnectionsIn()`, `allConnectionsOut()`, and
   `allConnectionsTo()` functions and their unit tests.

 * [x] Create a unit test that verifies that when `untrackIDs()` or
   `clearIDs()` is called in a `Structure`, then all connections to/from
   that structure are first removed.  This unit test will not pass, at
   first.
 * [x] Update `untrackIDs()` to make that unit test pass for it.
 * [x] Update `clearIDs()` to make that unit test pass for it.

 * [x] Define `connectionIDs : { }` in the `Structure` class.
 * [x] Define `@sourceOfConnection : ( id ) -> Structure::connectionIDs[id]`
   in the `Structure` class.
 * [x] Ensure that this did not break any unit tests.

 * [x] Disable all unit tests for `connectTo` and `disconnectFrom`, then
   ensure that all remaining unit tests pass.

 * [ ] Rewrite `Structure::connect(source,target,data)` to do this:
    * Quit if `data.id` is already used in `Structure::connectionIDs`;
      return false in that case.
    * Write the target's ID to the `"_conn #{id} to"` attribute of the
      source.
    * Write the source's ID to the `"_conn #{id} from"` attribute of the
      target.
    * Write the data to the `"_conn #{id} data"` attribute of the source.
    * Add `data.id` to `Structure::connectionIDs`.
    * Call the `connectionInserted` handler, if it exists, in the source and
      target `Structure`s.
    * Return true.
 * [ ] Ensure that `someStruct.connect(t,d)` is an alias for
   `Structure::connect(someStruct,t,d)`.
 * [ ] Ensure that this did not break any unit tests.
 * [ ] Replace `disconnectFrom()` with `Structure::disconnect(connectionID)`
   that does this:
    * Quit unless `connectionID` is already used in
      `Structure::connectionIDs`; return false in that case.
    * Get the structure that is the source.  From it, get the target.
    * In the source, remove the `"_conn #{id} to"` attribute.
    * In the source, remove the `"_conn #{id} data"` attribute.
    * In the target, remove the `"_conn #{id} from"` attribute.
    * Remove `data.id` from `Structure::connectionIDs`.
    * Call the `connectionRemoved` handler, if it exists, in the source and
      target `Structure`s.
    * Return true.
 * [ ] Ensure that this did not break any unit tests.
 * [ ] Ensure that `someStruct.disconnect(id)` is an alias for
   `Structure::disconnect(id)`.
 * [ ] Add `Structure::setConnectionData(connID,key,value)` that does this:
    * Quit unless `connID` is already used in `Structure::connectionIDs`;
      if so, return false.
    * If `value` is undefined, remove any existing key-value pair with the
      given `key` from the connection data for the specified connection.
    * Otherwise, replace any existing key-value pair with the given one in
      the specified connection.
    * In any case, call the `connectionChanged` handler, if it exists, in
      the source and target `Structure`s.
    * Return true.
 * [ ] Ensure that `someStruct.setConnectionData(id,k,v)` is an alias for
   `Structure::setConnectionData(id,k,v)`.
 * [ ] Ensure that this did not break any unit tests.

 * [ ] Implement `Structure::getConnectionSource(id)` and ensure that
   `someStruct.getConnectionSource(id)` is an alias for it.
 * [ ] Implement `Structure::getConnectionTarget(id)` and ensure that
   `someStruct.getConnectionTarget(id)` is an alias for it.
 * [ ] Implement `Structure::getConnectionData(id)` and ensure that
   `someStruct.getConnectionData(id)` is an alias for it.
 * [ ] Implement `someStruct.getConnectionsIn()`, returning a list of IDs.
 * [ ] Implement `someStruct.getConnectionsOut()`, returning a list of IDs.
 * [ ] Implement `someStruct.getAllConnections()`, returning a list of IDs.
 * [ ] Ensure that this did not break any unit tests.
 * [ ] Replace all the old unit tests for `connectTo` and `disconnectFrom`
   with new ones that test all the features just added by all the recent
   changes.
 * [ ] There are commented-out tests for `setup()` that used to use
   `allConnectionsIn()`, etc., which can now be updated to use these.

 * [ ] Add to the API a new method, `insertConnection(source,target,data)`,
   which directly calls `Structure::connect()`, but only if both the source
   and the target are `InputStructure` instances.
 * [ ] Add to the API a new method, `removeConnection(id)`, which
   directly calls `Structure::disconnect()`, but only if both the source
   and the target are `InputStructure` instances.
 * [ ] Add to the API a new method,
   `setConnectionAttribute(connection,key,value)`, which directly calls
   `Structure::setConnectionData(connection,key,value)`, but only if both
   the source and the target are `InputStructure` instances.
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
