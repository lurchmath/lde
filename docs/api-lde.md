
# API Documentation for the LDE Module

The main LDE module is not yet complete.  So far it supports only the
functionality documented below, which will grow with time.

## One Global Document

The module initializes a single `Structure` instance in a global variable,
which can be queried with the public API function `getDocument()`.  It
begins life as a freshly created `Structure` with no attributes, but an ID.

This document is called the *LDE Document,* and is the structure on which
all computations done by the LDE will operate.  In the main Lurch
application, it will represent the meaningful content that has been
extracted from the user's document.

## Manipulating the Document

The document can be manipulated with four functions in the public API of
this module:

 * `insert(structureToInsert,parentID,insertionIndex)` inserts a new
   structure within the global document hierarchy, as follows:
    * `structureToInsert` should be the serialized form of the structure to
      insert (optionally created with `.toJSON()` in a `Structure`
      instance).  After the structure is deserialized and inserted into the
      document, `trackIDs()` will be called in it; for more information on
      that function, see [its entry in the API docs](api-lde.md#unique-ids).
    * `parentID` is the ID of the parent under which this new child should
      be inserted.  This must be a string ID that belongs to a structure
      already in the global document hierarchy.  Note that the root of the
      hierarchy is given the ID "root" at the time the module is loaded.
    * `insertionIndex` is the index of the child to insert, which must be
      greater than or equal to zero and less than or equal to the number of
      children of the parent
 * `delete(ID)` deletes from the global document hierarchy the structure
   with the given ID, which is interpreted with the same conventions as the
   `parentID` is for the `insert` function.  After the structure is deleted,
   `untrackIDs()` will be called in it; for more information on that
   function, see [its entry in the API docs](api-lde.md#unique-ids).
 * `replace(ID,newStructure)` replaces the structure with the given ID with
   the given new structure.
    * `ID` is interpreted with the same conventions as the `parentID` is for
      the `insert` function
    * `newStructure` is a serialized structure, as `structureToInsert` is
      for the `insert` function
    * After this operation, `untrackIDs()` will be called in the replaced
      structure and `trackIDs()` in the replacement; for more information
      on those functions, see
      [their entries in the API docs](api-lde.md#unique-ids).
 * `setAttribute(ID,key,value)` modifies a single external attribute of a
   structure within the global document hierarchy, as follows:
    * `ID` is interpreted with the same conventions as the `parentID` is for
      the `insert` function
    * `key` is the key of the external attribute to create or overwrite.  If
      this key happens to be "id", then the class-level tracking of IDs
      will be updated to repsect the change.
    * `value` is the new value, which must be JSON data.  (No checks are
      done to verify that it is JSON data, but errors will transpire
      eventually if non-JSON data is passed.)

## Asynchronous API

If the LDE detects that it is being run in a background thread, it will set
up listeners for messages from the parent thread.  These listeners will
handle messages of four types, `insert`/`delete`/`replace`/`setAttribute`,
mirroring the four functions given above, and calling them internally.

They can be called by passing a message of the form `[ command, args... ]`,
where the command is a string (one of `"insert"`, `"delete"`, etc.) and the
arguments list is the same list that would be passed to the function itself,
as documented in the previous section on this page.

For example, you could start an LDE in a WebWorker and insert a new
structure as the first child of its global document as follows.

```js
    // import the lde.js file (kept in the release/ folder)
    // (This requires having the structure.js file in the same folder.)
    var worker = new Worker( 'lde.js' );
    var A = new Structure();
    worker.postMessage( [ 'insert', A.toJSON(), 'root', 0 ] );
```
