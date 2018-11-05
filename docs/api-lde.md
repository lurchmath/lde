
# API Documentation for the LDE Module

The main LDE module is not yet complete.  So far it supports only the
functionality documented below, which will grow with time.

## The Input Tree

The module initializes a single `InputStructure` instance in a global
variable, which can be queried with the public API function
`getInputTree()`.  It begins life as a freshly created `InputStructure` with
no attributes, but an ID.

This structure is called the *Input Tree,* and is the structure in which the
LDE stores all input passed from the client.  In particular, the LDE never
modifies this structure except at the request of the client.

## Manipulating the Input Tree

The Input Tree can be manipulated with four functions in the public API of
this module:

 * `insert(structureToInsert,parentID,insertionIndex)` inserts a new
   `InputStructure` within the Input Tree, as follows:
    * `structureToInsert` should be either the structure to insert or the
      serialized version thereof (optionally created with `.toJSON()` in an
      `InputStructure` instance).  After the structure is deserialized (if
      needed) and inserted into the document, `trackIDs()` will be called
      in it; for more information on that function, see [its entry in the
      API docs](api-lde.md#unique-ids).  Note that if the deserialized
      object is not an `InputStructure` instance, `insert()` does nothing.
    * `parentID` is the ID of the parent under which this new child should
      be inserted.  This must be a string ID that belongs to a structure
      already in the Input Tree.  If it is not, `insert()` does nothing.
      Note that the root of the hierarchy is given the ID "root" at the
      time the module is loaded.
    * `insertionIndex` is the index of the child to insert, which must be
      greater than or equal to zero and less than or equal to the number of
      children of the parent.  If that constraint does not hold, `insert()`
      does nothing.
 * `delete(ID)` deletes from the Input Tree the structure with the given
   ID, which is interpreted with the same conventions as the `parentID` is
   for the `insert()` function.  After the structure is deleted,
   `untrackIDs()` will be called in it; for more information on that
   function, see [its entry in the API docs](api-lde.md#unique-ids).
 * `replace(ID,newStructure)` replaces the structure with the given ID with
   the given new structure.
    * `ID` is interpreted with the same conventions as the `parentID` is for
      the `insert` function
    * `newStructure` is a structure (optionally serialized), as
      `structureToInsert` is for the `insert` function (and again, if it is
      not an `InputStructure` instance or the serialization of one, this
      function does nothing)
    * After this operation, `untrackIDs()` will be called in the replaced
      structure and `trackIDs()` in the replacement; for more information
      on those functions, see
      [their entries in the API docs](api-lde.md#unique-ids).
 * `setAttribute(ID,key,value)` modifies a single attribute of a structure
   within the Input Tree, as follows:
    * `ID` is interpreted with the same conventions as the `parentID` is for
      the `insert` function
    * `key` is the key of the attribute to create or overwrite.  If this
      key happens to be "id", then the class-level tracking of IDs will be
      updated to repsect the change.
    * `value` is the new value, which must be JSON data.  (No checks are
      done to verify that it is JSON data, but errors will transpire
      eventually if non-JSON data is passed.)  Alternately, `value` can be
      `undefined`, which will serve to delete the old key-value pair from
      the attributes without replacing it with any new key-value pair.

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
`InputStructure` as the first child of its global document as follows.

```js
    // import the lde.js file (kept in the release/ folder)
    // (This requires having the structure.js file in the same folder.)
    var worker = new Worker( 'lde.js' );
    var A = new InputStructure();
    worker.postMessage( [ 'insert', A.toJSON(), 'root', 0 ] );
```

Because message passing across thread boundaries can only transfer JSON
data, the versions of `insert()` and `replace()` that take `InputStructure`
instances will need to be called with serialized `InputStructure`s instead.
