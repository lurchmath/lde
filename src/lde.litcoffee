
# Lurch Deductive Engine (LDE) Main File

This file imports all the other modules in this repository and exposes them
through its `exports` member, so that clients can import just this one file
and have access to all the functionality from all the source files in this
repository.

Import the structure class and export it to clients as well.  The following
lines detect whether this is being used in Node.js or a WebWorker, or a
WebWorker-like background thread within Node.js, and do the right thing in
any case.

    if require?
        { Structure } = require './structure'
    else if WorkerGlobalScope?
        importScripts 'structure.js'
    else if self?.importScripts?
        importScripts 'release/structure.js'

## The LDE Document

The LDE Document is a global instance of the `Structure` class, representing
the meaningful content of the user's document.  It has the special ID
"root."

    LDEDocument = ( new Structure ).attr 'id' : 'root'
    LDEDocument.trackIDs()

Clients should treat the global LDE Document as read-only, *except* through
the API provided in [the following section](#the-main-api).  But we provide
the following function for two reasons.

 1. It is usable to *read* the LDE Document.  Although the client could also
    use it to manipulate that document, doing so violates the preconditions
    of this module, and thus discards any behavior guarantees it provides.
 2. As an important special case of the previous, it is usable in the unit
    testing suite to verify that the API below is manipulating the document
    according to its specifications.

The following function returns the root of the LDE Document structure.

    functions = { }
    functions.getDocument = -> LDEDocument

## Utilities

We create a function for use privately in this module, for verifying that a
particular structure is a descendant of the LDE Document.

    isInTheDocument = ( structure ) ->
        while structure instanceof Structure
            if structure is LDEDocument then return yes
            structure = structure.parent()
        no

## The Main API

This module presents to clients a four-function API defined in this section.
Each of these functions manipulates the global LDE Document.

The following insertion function deserializes the given structure from JSON,
finds the descendant of the LDE Document that has the given ID, and inserts
the deserialized version as one of its children, at the given index. If
anything goes wrong in that process then it does nothing.  The ID must be
the ID of a Structure, as defined in that class (a string ID stored in the
attribute "id").

All newly inserted structures and their descendants have all their IDs
tracked.

    functions.insert = ( json, parentID, insertionIndex ) ->
        if ( parent = Structure.instanceWithID parentID )? and \
           ( 0 <= insertionIndex <= parent.children().length ) and \
           ( isInTheDocument parent ) and \
           ( newInstance = Structure.fromJSON( json ).setup() )?
            parent.insertChild newInstance, insertionIndex
            newInstance.trackIDs()

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, removes it from its
parent and stops tracking all IDs within it.

    functions.delete = ( subtreeID ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           ( isInTheDocument subtree ) and subtree isnt LDEDocument
            subtree.removeFromParent()
            subtree.untrackIDs()

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, deserializes the
second argument as a Structure object and uses it to replace the original
structure in the LDE Document.  The deserialized version will have all of
the IDs in its hierarchy tracked.  This module will also stop tracking all
IDs in the structure that was removed.

    functions.replace = ( subtreeID, json ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           ( isInTheDocument subtree ) and subtree isnt LDEDocument and \
           ( newInstance = Structure.fromJSON( json ).setup() )?
            subtree.replaceWith newInstance
            subtree.untrackIDs()
            newInstance.trackIDs()

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, calls its member
function for setting an attribute with the given key and value.  As per the
requirements of the `Structure.setAttribute` function, be sure to provide
only values that are amenable to `JSON.stringify`.

    functions.setAttribute = ( subtreeID, key, value ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           isInTheDocument subtree
            if key is 'id' then subtree.untrackIDs no
            subtree.setAttribute key, value
            if key is 'id' then subtree.trackIDs no

## Event Listeners

If the LDE detects that it is being run in a background thread, it will set
up listeners for messages from the parent thread.  These listeners handle
messages of five types:

 * `insert`, with three arguments, which calls the `insert` function defined
   above and sends no messages back
 * `delete`, with one argument, which calls `delete` and sends no messages
 * `replace`, with two arguments, which calls `replace` and sends no
   messages
 * `setAttribute`, with three arguments, which calls `setAttribute` and
   sends no messages
 * `getDocument`, with zero arguments, which sends back a message containing
   the JSON serialized form of the document, as fetched using the
   `getDocument` function defined above


    if WorkerGlobalScope? or self?.importScripts?

Here are the numbers of arguments we accept for each message we accept.

        expectedArgumentCount =
            insert : 3
            delete : 1
            replace : 2
            setAttribute : 3
            getDocument : 0

Messages received expect data arrays of the form `[ command, args... ]`.

        self.addEventListener 'message', ( event ) ->
            [ command, args... ] = event.data

Anything with the right number of arguments is passed on to the
corresponding function.  That function may or may not do anything, depending
on whether the data is in the correct form.

            if expectedArgumentCount[command] is args.length
                if command is 'getDocument'
                    self.postMessage functions.getDocument().toJSON()
                else
                    functions[command] args...

Now export anything that needs exporting.

    if exports?
        exports.Structure = Structure
        exports.insert = functions.insert
        exports.delete = functions.delete
        exports.replace = functions.replace
        exports.setAttribute = functions.setAttribute
        exports.getDocument = functions.getDocument
