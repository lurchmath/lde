
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

The Input Tree can be manipulated with seven functions in the public API of
this module:

 * `insertStructure(structureToInsert,parentID,insertionIndex)` inserts a
   new `InputStructure` within the Input Tree, as follows:
    * `structureToInsert` should be either the structure to insert or the
      serialized version thereof (optionally created with `.toJSON()` in an
      `InputStructure` instance).  After the structure is deserialized (if
      needed) and inserted into the document, `trackIDs()` will be called
      in it; for more information on that function, see [its entry in the
      API docs](api-lde.md#unique-ids).  Note that if the deserialized
      object is not an `InputStructure` instance, `insertStructure()` does
      nothing.
    * `parentID` is the ID of the parent under which this new child should
      be inserted.  This must be a string ID that belongs to a structure
      already in the Input Tree.  If it is not, `insertStructure()` does
      nothing.  Note that the root of the hierarchy is given the ID "root"
      at the time the module is loaded.
    * `insertionIndex` is the index of the child to insert, which must be
      greater than or equal to zero and less than or equal to the number of
      children of the parent.  If that constraint does not hold,
      `insertStructure()` does nothing.
 * `deleteStructure(ID)` deletes from the Input Tree the structure with the
   given ID, which is interpreted with the same conventions as the
   `parentID` is for the `insertStructure()` function.  After the structure
   is deleted, `untrackIDs()` will be called in it; for more information on
   that function, see [its entry in the API docs](api-lde.md#unique-ids).
 * `replaceStructure(ID,newStructure)` replaces the structure with the
   given ID with the given new structure.
    * `ID` is interpreted with the same conventions as the `parentID` is for
      the `insertStructure()` function
    * `newStructure` is a structure (optionally serialized), as
      `structureToInsert` is for the `insertStructure()` function (and
      again, if it is not an `InputStructure` instance or the serialization
      of one, this function does nothing)
    * After this operation, `untrackIDs()` will be called in the replaced
      structure and `trackIDs()` in the replacement; for more information
      on those functions, see
      [their entries in the API docs](api-lde.md#unique-ids).
 * `setStructureAttribute(ID,key,value)` modifies a single attribute of a
   structure within the Input Tree, as follows:
    * `ID` is interpreted with the same conventions as the `parentID` is for
      the `insertStructure()` function
    * `key` is the key of the attribute to create or overwrite.  If this
      key happens to be "id", then the class-level tracking of IDs will be
      updated to respect the change.  This is not permitted to begin with an
      underscore; such key names are reserved for internal use by the LDE.
      If the given key begins with an underscore, this function does
      nothing.
    * `value` is the new value, which must be JSON data.  (No checks are
      done to verify that it is JSON data, but errors will transpire
      eventually if non-JSON data is passed.)  Alternately, `value` can be
      `undefined`, which will serve to delete the old key-value pair from
      the attributes without replacing it with any new key-value pair.
 * `insertConnection(sourceID,targetID,connectionData)` inserts a new
   connection between two existing `InputStructure` instances, as follows:
    * `sourceID` must be the ID of an `InputStructure` already in the Input
      Tree.  If not, this function does nothing.
    * `targetID` must be the ID of an `InputStructure` already in the Input
      Tree.  If not, this function does nothing.  It is acceptable for the
      source and target to be the same node; connections from a thing to
      itself are permitted.
    * `connectionData` an object containing arbitrary JSON data about the
      new connection.  It must at least contain a field whose key is `"id"`
      and whose value is a new, unique ID (which no connection has yet).
      If this is not satisfied, this function does nothing.  If all the
      above conditions are satisfied, a new connection is formed from the
      source to the target with the given data.
 * `deleteConnection(ID)` deletes from the Input Tree the connection with
   the given ID, which must be the unique ID of a connection given to the
   `insertConnection()` function documented immediately above, otherwise,
   this function does nothing.  If it is a valid connection ID, then the
   connection is removed from the Input Tree and the ID is available to be
   used again.
 * `setConnectionAttribute(ID,key,value)` modifies a single attribute of a
   connection within the Input Tree, as follows:
    * `ID` is interpreted just as in `deleteConnection()`, above.
    * `key` is the key of the attribute to create or overwrite.  This may
      not be the string `"id"`, which is already used to store the
      connection's unique ID, which cannot be changed.  (If this is `"id"`,
      this function does nothing.)
    * `value` is the new value, which must be JSON data.  (No checks are
      done to verify that it is JSON data, but errors will transpire
      eventually if non-JSON data is passed.)  Alternately, `value` can be
      `undefined`, which will serve to delete the old key-value pair from
      the attributes without replacing it with any new key-value pair.

## Asynchronous API

If the LDE detects that it is being run in a background thread, it will set
up listeners for messages from the parent thread.  These listeners will
handle messages of four types (`insertStructure`, `deleteStructure`,
`replaceStructure`, `setStructureAttribute`, and `getInputTree`) mirroring
the four functions given above (plus `getInputTree()`) and calling them
internally.

They can be called by passing a message of the form `[ command, args... ]`,
where the command is a string (one of `"insertStructure"`,
`"deleteStructure"`, etc.) and the arguments list is the same list that
would be passed to the function itself, as documented above.

For example, you could start an LDE in a WebWorker and insert a new
`InputStructure` as the first child of its global document as follows.

```js
    // import the lde.js file (kept in the release/ folder)
    // (This requires having the structure.js file in the same folder.)
    var worker = new Worker( 'lde.js' );
    var A = new InputStructure();
    worker.postMessage( [ 'insertStructure', A.toJSON(), 'root', 0 ] );
```

Because message passing across thread boundaries can only transfer JSON
data, the versions of `insertStructure()` and `replaceStructure()` that take
`InputStructure` instances will need to be called with serialized
`InputStructure`s instead.

Only one of these five functions sends a message back to the parent context.
If you post a `getInputTree` message (which requires no parameters), you
will immediately get a message in response whose event has the following
properties.

 * `event.data.type` is the string `"getInputTree"`.
 * `event.data.payload` is the JSON representation of the entire Input Tree,
   as serialized by `Structure.toJSON()`.

## Receiving Feedback

The LDE will occasionally need to send feedback to the client about the
input provided to it.  This takes different forms, depending on how the LDE
has been loaded.

 * If the LDE has been loaded into a node.js application as a module, using
   `require()`, then the module will have a member called `Feedback`, an
   instance of `EventEmitter`.  Clients can listen for feedback events by
   calling `theModule.Feedback.addEventListener('feedback',f)`, with their
   own function `f`.  That function will be called with one argument when
   the LDE generates feedback, a JSON object with feedback data.  The most
   important field in the object is the `subject` field, which will contain
   the ID of the `InputStructure` instance to which the feedback pertains.
 * If the LDE has been loaded into the browser directly (not in a WebWorker
   instance, but in the UI thread) then it installs a `Feedback` object in
   the `window` namespace.  The client can listen to events by calling
   `window.Feedback.addEventListener('feedback',f)`, and `f` will be called
   with an event `E` such that `E.data` has the structure described in the
   previous bullet point (e.g., `E.data.subject` is an `InputStructure` ID).
 * If the LDE has been loaded into a node.js application in a background
   thread, using Workers, then it will occasionally post messages to the
   parent context when one of its computations requires sending feedback
   about the result.  If the LDE is loaded into a worker `W`, then you can
   listen for such messages with `W.onmessage = function (event) {...}`.
   Feedback events passed to such a handler will have `event.type` equal to
   the string `"feedback"` and `event.payload` equal to the feedback data
   itself as documented in the previous two bullet points (e.g.,
   `event.payload.subject` an `InputStructure` ID).

For an example of how this works, see
[the unit tests regarding feedback in the LDE](https://github.com/lurchmath/lde/blob/master/tests/lde-spec.litcoffee#feedback).
