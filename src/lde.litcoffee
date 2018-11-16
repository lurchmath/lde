
# Lurch Deductive Engine (LDE) Main File

This file imports all the other modules in this repository and exposes them
through its `exports` member, so that clients can import just this one file
and have access to all the functionality from all the source files in this
repository.

Import the structure class; it will be exported to clients as well using
code at the end of this file.  The following lines detect whether this is
being used in Node.js or a WebWorker, or a WebWorker-like background thread
within Node.js, and do the right thing in any case.

    if require?
        os = require 'os'
        { Structure } = require './structure'
        { InputStructure, InputModifier } = require './input-structure'
        { OutputStructure } = require './output-structure'
        { LDEWorker } = require './worker'
    else if WorkerGlobalScope?
        importScripts 'structure.js'
        importScripts 'input-structure.js'
        importScripts 'output-structure.js'
        importScripts 'worker.js'
    else if self?.importScripts?
        importScripts 'release/structure.js'
        importScripts 'release/input-structure.js'
        importScripts 'release/output-structure.js'
        importScripts 'release/worker.js'

## The Input Tree

The Input Tree is a global instance of the `InputStructure` class,
representing the content of the user's document as expressed to this module
by the client.  We define the variable here and initialize it later.

    InputTree = null

Clients should treat the global Input Tree as read-only, *except* through
the API provided in [the following section](#the-main-api).  But we provide
the following function for two reasons.

 1. It is usable to *read* the Input Tree.  Although the client could also
    use it to manipulate that tree, doing so violates the preconditions of
    this module, and thus discards any behavior guarantees it provides.
 2. As an important special case of the previous, it is usable in the unit
    testing suite to verify that the API below is manipulating the tree
    according to its specifications.

The following function returns the root of the Input Tree structure.

    functions = { }
    functions.getInputTree = -> InputTree

Clients can also replace the entire Input Tree in certain circumstances; see
details in the following section.

## The Output Tree

The Output Tree is a global instance of the `OutputStructure` class,
representing the content of the user's document as interpreted by this
module from the Input Tree.  We define the variable here and initialize it
later.

    OutputTree = null

Clients do not *ever* write to the Output Tree.  They can read from it,
however, for the same two reasons as given for the Input Tree in the
previous section.  Thus the following function returns the root of the
Output Tree structure.

    functions.getOutputTree = -> OutputTree

Clients may occasionally wish to replace the entire Input and Output Tree
pair.  This most likely happens when the state of the LDE is saved by
fetching that pair and saving it to some filesystem, then later the state
is restored by fetching the archived versions and putting them back into the
LDE.

Both trees should be inserted at once, to keep things consistent, so we
provide a function for querying both trees at once, and another function for
setting both trees at once.  So that clients don't need to think about the
Output Tree at all, we just call the tree pair the LDE's "internal state."

    functions.getInternalState = ->
        inputTree : InputTree.toJSON()
        outputTree : OutputTree.toJSON()
    functions.setInternalState = ( state ) ->
        InputTree?.untrackIDs()
        InputTree = Structure.fromJSON state.inputTree
        InputTree.trackIDs()
        OutputTree?.untrackIDs()
        OutputTree = Structure.fromJSON state.outputTree
        OutputTree.trackIDs()

We then use those functions to define a setup routine for the LDE's internal
state.  It clears out and re-initializes both the Input and Output Trees to
be empty.

The Input Tree gets the ID "root" and the Output Tree gets the ID "OT root".
We do not use the symmetric name "IT root" for the Input Tree's root,
because the Input Tree is client-facing, and we do not wish to put on the
client the burden of using the "IT" prefix.  But we must distinguish the
two, because these IDs are used by the global `Structure` class to
distinguish `Structure` instances, including those in both the Input Tree
and the Output Tree.  Thus node IDs must be globally unique across both
trees.

    functions.reset = ->
        functions.setInternalState
            inputTree :
                className : 'InputStructure'
                children : [ ]
                attributes : id : 'root'
            outputTree :
                className : 'OutputStructure'
                children : [ ]
                attributes : id : 'OT root'

Use the `reset()` function to initialize our internal state.

    functions.reset()

## Utilities

We create functions for use privately in this module, for verifying that a
particular structure is a descendant of the Input Tree or the Output Tree,
respectively.

    isInTheInputTree = ( structure ) ->
        while structure instanceof InputStructure
            if structure is InputTree then return yes
            structure = structure.parent()
        no
    isInTheOutputTree = ( structure ) ->
        while structure instanceof OutputStructure
            if structure is OutputTree then return yes
            structure = structure.parent()
        no

We create another function for use privately in this module, which takes a
parameter that may be an `InputStructure` instance or a JSON serialization
thereof.  It returns an `InputStructure` instance; in the first case by
doing nothing, and in the second case by attempting to deserialize it.

    deserializeIfNeeded = ( jsonOrInputStructure ) ->
        if jsonOrInputStructure instanceof InputStructure
            jsonOrInputStructure
        else
            Structure.fromJSON jsonOrInputStructure

## The Main API

This module presents to clients a seven-function API defined in this
section.  Each of these functions manipulates the global Input Tree.

### Editing Structures in the Input Tree

The following insertion function deserializes the given structure from JSON,
finds the descendant of the Input Tree that has the given ID, and inserts
the deserialized version as one of its children, at the given index. If
anything goes wrong in that process then it does nothing.  The ID must be
the ID of a Structure, as defined in that class (a string ID stored in the
attribute "id").

It is also permitted for the first parameter to be an actual structure
instance rather than a JSON serialization of one.  This is primarily useful
in very simple clients, where the LDE module will be loaded directly into
the client.

In either case, attributes whose keys begin with an underscore are not
permitted; they are for internal use only.  Such attributes will be stripped
before the structure is inserted.

All newly inserted structures and their descendants have all their IDs
tracked.

    functions.insertStructure = ( newChild, parentID, insertionIndex ) ->
        if ( parent = Structure.instanceWithID parentID )? and \
           ( 0 <= insertionIndex <= parent.children().length ) and \
           ( isInTheInputTree parent ) and \
           ( newInstance = deserializeIfNeeded newChild )? and \
           ( newInstance instanceof InputStructure )
            disallowed = ( key \
                for own key of newInstance.attributes when key[0] is '_' )
            if disallowed.length > 0
                newInstance.clearAttributes disallowed...
            parent.insertChild newInstance, insertionIndex
            newInstance.trackIDs()

The following function finds the descendant of the global Input Tree that
has the given ID and, assuming such a structure exists, removes it from its
parent and stops tracking all IDs within it.

    functions.deleteStructure = ( subtreeID ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           ( isInTheInputTree subtree ) and subtree isnt InputTree
            subtree.removeFromParent()
            subtree.untrackIDs()

The following function finds the descendant of the global Input Tree that
has the given ID and, assuming such a structure exists, deserializes the
second argument as a Structure object and uses it to replace the original
structure in the Input Tree.  The deserialized version will have all of
the IDs in its hierarchy tracked.  This module will also stop tracking all
IDs in the structure that was removed.

In either case, attributes whose keys begin with an underscore are not
permitted; they are for internal use only.  Such attributes will be stripped
before the structure is inserted.

This functionl, also, permits passing an actual `InputStructure` instance as
the second argument, rather than a serialized version.

    functions.replaceStructure =
    ( subtreeID, newTree, transferConnections = no ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           ( isInTheInputTree subtree ) and subtree isnt InputTree and \
           ( newInstance = deserializeIfNeeded newTree )? and \
           ( newInstance instanceof InputStructure )
            disallowed = ( key \
                for own key of newInstance.attributes when key[0] is '_' )
            if disallowed.length > 0
                newInstance.clearAttributes disallowed...
            subtree.replaceWith newInstance
            if transferConnections
                subtree.transferConnectionsTo newInstance
            subtree.untrackIDs()
            newInstance.trackIDs()

The following function finds the descendant of the global Input Tree that
has the given ID and, assuming such a structure exists, calls its member
function for setting an attribute with the given key and value.  As per the
requirements of the `Structure.setAttribute` function, be sure to provide
only values that are amenable to `JSON.stringify`.

The key may not begin with an underscore; such key names are reserved for
internal use by the LDE.  If the given key begins with an underscore, this
function does nothing.

    functions.setStructureAttribute = ( subtreeID, key, value ) ->
        if key[0] is '_' then return
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           isInTheInputTree subtree
            if key is 'id' then subtree.untrackIDs no
            if typeof value is 'undefined'
                subtree.clearAttributes key
            else
                subtree.setAttribute key, value
            if key is 'id' then subtree.trackIDs no

### Editing Connections in the Input Tree

The following function adds a connection between two existing nodes in the
Input Tree.  It accepts three parameters, the ID of the source node, the ID
of the target node, and the JSON data for the connection.  That data must at
least contain an `id` field for the connection, which must be unique across
the entire Input Tree.  If any of these conditions are not satisfied, this
function does nothing.  Otherwise, it creates the connection.

    functions.insertConnection = ( sourceID, targetID, data ) ->
        return no unless \
            ( source = Structure.instanceWithID sourceID ) and \
            ( target = Structure.instanceWithID targetID ) and \
            ( isInTheInputTree source ) and ( isInTheInputTree target )
        Structure.connect source, target, data

The following function removes a connection between two nodes in the Input
Tree.  It takes just one parameter, the unique ID of the connection to
remove.  It returns no if there is no such connection in the Input Tree, and
yes if there is one; in the latter case, it removes it, otherwise it does
nothing.

    functions.removeConnection = ( id ) ->
        return no unless \
            ( isInTheInputTree Structure.getConnectionSource id ) and \
            ( isInTheInputTree Structure.getConnectionTarget id )
        Structure.disconnect id

The following function permits editing the attributes of a connection in the
Input Tree.  It takes three parameters, a connection ID, a key, and a value.
If there is a connection in the Input Tree with the given unique ID, then
this function edits its attributes by assigning the given key-value pair,
overwriting any with the same key that may have been there.  If the value is
undefined (or omitted) then this function removes any old key-value pair
with the same key.  If any of the requirements given above are not
satisfied, the function does nothing.

    functions.setConnectionAttribute = ( id, key, value ) ->
        return no unless \
            ( isInTheInputTree Structure.getConnectionSource id ) and \
            ( isInTheInputTree Structure.getConnectionTarget id )
        Structure.setConnectionData id, key, value

### The Modification Phase

In the Modification Phase, the LDE runs the `updateConnections()` function
in every `InputModifier` instance in the Input Tree, in no specified order.
The Modification Phase then hands off work to the Interpretation Phase,
which always follows immediately after it.

This function is asynchronous, calling a callback when complete.

Although it contains no asynchronous components in its current
implementation, we write its signature that way so that it can be made
asynchronous later if we need to make it more efficient, and clients will
not need to change their use of it.

    functions.runModification = ( callback ) ->
        updateAllConnections = ( node ) ->
            node.updateConnections() if node instanceof InputModifier
            updateAllConnections child for child in node.children()
        updateAllConnections InputTree
        functions.runInterpretation callback

### The Interpretation Phase

In the Interpretation Phase, the LDE runs the `recursiveInterpret()`
function in the root of the Input Tree, replacing the Output Tree with the
result.  Like the above function, this one is asynchronous even though its
current implementation is synchronous.

After interpretation, this function traverses the Output Tree and ensures
that every connection into or out of any node in it leads to another node in
the Output Tree.  (Any connection that leads outside that tree is removed.)

For the type of feedback this sends, see
[the API documentation page for the LDE](https://lurchmath.github.io/lde/site/api-lde/).

    functions.runInterpretation = ( callback ) ->

First, define the function that ensures the Output Tree does not have
connections that lead outside of itself.  We will use this later if needed.

        removeConnectionsOutside = ( node ) ->
            for connection in node.getConnectionsIn()
                if not isInTheOutputTree node.getConnectionSource connection
                    node.disconnect connection
                    node.feedback
                        type : 'connection removed'
                        id : connection
            for connection in node.getConnectionsOut()
                if not isInTheOutputTree node.getConnectionTarget connection
                    node.disconnect connection
                    node.feedback
                        type : 'connection removed'
                        id : connection
            removeConnectionsOutside child for child in node.children()

Next, produce the Output Tree, using the above routine and sending feedback
if and when needed.

        didReplaceOutputTree = no
        InputStructure.clearAlreadyStarted()
        try
            maybeCorrect = InputTree.recursiveInterpret()
            if maybeCorrect not instanceof Array
                feedback
                    subject : 'root'
                    type : 'interpretation error'
                    details : 'Interpretation did not produce an array.'
            else if maybeCorrect[0] not instanceof OutputStructure
                feedback
                    subject : 'root'
                    type : 'interpretation error'
                    details : 'Interpretation did not produce an
                        OutputStructure'
            else
                OutputTree = maybeCorrect[0]
                removeConnectionsOutside OutputTree
                feedback subject : 'root', type : 'updated LDE state'
        catch e
            feedback
                subject : 'root'
                type : 'interpretation error'
                details : e
        InputStructure.clearAlreadyStarted()
        callback()

### Event Listeners

If the LDE detects that it is being run in a background thread, it will set
up listeners for messages from the parent thread.  These listeners handle
messages of eight types:

 * `insertStructure`, with three arguments, which calls the
   `insertStructure` function defined above and sends no messages back
 * `deleteStructure`, with one argument, which calls `deleteStructure` and
   sends no messages
 * `replaceStructure`, with two arguments, which calls `replaceStructure`
   and sends no messages
 * `setStructureAttribute`, with three arguments, which calls
   `setStructureAttribute` and sends no messages
 * `insertConnection`, with three arguments, which calls the
   `insertConnection` function defined above and sends no messages back
 * `removeConnection`, with one argument, which calls the
   `removeConnection` function defined above and sends no messages back
 * `setConnectionAttribute`, with three arguments, which calls the
   `setConnectionAttribute` function defined above and sends no messages
   back
 * `getInputTree`, with zero arguments, which sends back a message
   containing the JSON serialized form of the document, as fetched using the
   `getInputTree` function defined above
 * `getOutputTree`, with zero arguments, which sends back a message
   containing the JSON serialized form of the document, as fetched using the
   `getOutputTree` function defined above
 * `getInternalState`, with zero arguments, which sends back a message
   containing both of the previous two results (Input and Output Trees)
 * `setInternalState` can be passed a single argument, a previous response
   to the `getInternalState` query, to restore the Input and Output Trees
   to the state they were in at the time of that query.
 * `reset` takes no parameters and calls `setInternalState` with blank Input
   and Output Trees.


    if WorkerGlobalScope? or self?.importScripts?

Here are the numbers of arguments we accept for each message we accept.
Each is an array, any number in the array is acceptable.

        expectedArgumentCount =
            insertStructure : [ 3 ]
            deleteStructure : [ 1 ]
            replaceStructure : [ 2, 3 ]
            setStructureAttribute : [ 2, 3 ]
            insertConnection : [ 3 ]
            removeConnection : [ 1 ]
            setConnectionAttribute : [ 2, 3 ]
            getInputTree : [ 0 ]
            getOutputTree : [ 0 ]
            getInternalState : [ 0 ]
            setInternalState : [ 1 ]
            reset : [ 0 ]
            runModification : [ 0 ]

Messages received expect data arrays of the form `[ command, args... ]`.

        self.addEventListener 'message', ( event ) ->
            [ command, args... ] = event.data

Anything with the right number of arguments is passed on to the
corresponding function.  That function may or may not do anything, depending
on whether the data is in the correct form.

            if args.length in ( expectedArgumentCount[command] ? [ ] )
                if command is 'getInputTree'
                    self.postMessage
                        type : 'getInputTree'
                        payload : functions.getInputTree().toJSON()
                else if command is 'getOutputTree'
                    self.postMessage
                        type : 'getOutputTree'
                        payload : functions.getOutputTree().toJSON()
                else
                    functions[command] args...

We also add the following function that is useless in production, but is
useful in testing.  It transmits feedback about any given node in the
Input Tree.

            if command is 'sendFeedback'
                [ id, feedbackData ] = args
                subject = Structure.instanceWithID id
                if subject?.feedback?
                    subject.feedback feedbackData
                else
                    self.postMessage "No such Structure: #{id}"

## Feedback

If we have been loaded in node.js or the browser, create a global feedback
mechanism called `Feedback`, an instance of `EventTarget` or `EventEmitter`,
depending on whether this is node.js or the browser.

    if window? and EventTarget?
        Feedback = window.Feedback = new EventTarget() # browser
    if require? and exports?
        EventEmitter = require 'events'
        Feedback = exports.Feedback = new EventEmitter() # node
        Feedback.addEventListener = Feedback.addListener # make API same

We also create a function global to this module that implements the sending
of feedback to our context.  In node.js or the browser, we emit an event
from the `Feedback` object just created.  If we are running in a `WebWorker`
(or node.js's equivalent of one) then we post a message to our parent
instead.

    feedback = ( feedbackData ) ->
        if Feedback?.dispatchEvent?
            event = new Event 'feedback'
            event.data = feedbackData
            Feedback.dispatchEvent event
        else if Feedback?.emit?
            Feedback.emit 'feedback', feedbackData
        else if self?.postMessage?
            self.postMessage
                type : 'feedback'
                payload : feedbackData

Install that function in the `Structure` class, overriding the stub class
method that module installs in itself.

    Structure.feedback = feedback

## Validation workers

The LDE keeps a global pool of `LDEWorker` instances that wait to be used
for validating the Output Tree.  These are classified as available or
unavailable, and one can ask the pool to give it an available worker, thus
marking it unavailable, and return it when done, thus marking it available
again.  One can also set the size of the pool.

Note that none of these functions verify that the worker is or is not
running.  We require that clients only return a worker to the pool if it is
done running.  If they wish to terminate its work and return it once it has
reset itself, they can call `myWorker.reboot` and pass a callback that
applies `returnAvailableWorker`, because the reboot guarantees that the
worker is ready for use when its callback is called.

    WorkerPool = [ ]
    WorkerPool.setSize = ( size ) ->
        size = Math.max size, 1
        while WorkerPool.length < size
            worker = new LDEWorker()
            worker.available = yes
            WorkerPool.push worker
        # WorkerPool = WorkerPool[...size] would discard inner funcs., so:
        while WorkerPool.length > size then WorkerPool.pop()
    WorkerPool.getAvailableWorker = ->
        for worker in WorkerPool
            if worker.available
                worker.available = no
                return worker
    WorkerPool.giveWorkerBack = ( worker ) -> worker.available = yes

We write a function to compute the number of cores available on the user's
machine, either in Node.js or the browser, then set the pool size to be one
less than the number of cores (so that we leave one core for the UI thread).

    numberOfCores = ->
        navigator?.hardwareConcurrency ? os?.cpus?()?.length ? 1
    WorkerPool.setSize numberOfCores() - 1 # setSize caps this below at 1

## Module exports

Expose those functions and classes that clients may access.

    if exports?
        for own className, classObj of Structure::subclasses
            exports[className] = classObj
        exports[key] = functions[key] for own key, value of functions
        exports.WorkerPool = WorkerPool
