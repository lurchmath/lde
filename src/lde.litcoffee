
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
the meaningful content of the user's document.

    LDEDocument = new Structure
    LDEDocument.getID()

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

We also create a function for recursively releasing IDs throughout an entire
structure hierarchy.

    releaseAllIDs = ( hierarchy ) ->
        hierarchy.releaseID()
        releaseAllIDs child for child in hierarchy.children()

And another two functions for adding or removing a hierarchy of structures
from having the IDs contained in their external attributes tracked by this
module.

    externalIDToStructure = { }
    trackExternalIDs = ( hierarchy, recursive = yes ) ->
        if ( id = hierarchy.getExternalAttribute 'ID' )?
            externalIDToStructure[id] = hierarchy
        if recursive
            trackExternalIDs child for child in hierarchy.children
    stopTrackingExternalIDs = ( hierarchy, recursive = yes ) ->
        if ( id = hierarchy.getExternalAttribute 'ID' )?
            delete externalIDToStructure[id]
        if recursive
            stopTrackingExternalIDs child for child in hierarchy.children

Finally a lookup function for IDs that will test whether the ID is a
nonnegative natural number (as used by the Structure module) or a string
(as may be used externally by any client).  The former is done through a
lookup provided by the `Structure` class itself, and the latter using the
object defined above.  Also, the special string `"root"` always yields the
document root.

    lookupID = ( id ) ->
        if id is 'root'
            functions.getDocument()
        else if typeof id is 'number'
            Structure.instanceWithID id
        else
            externalIDToStructure[id]

## The Main API

This module presents to clients a four-function API defined in this section.
Each of these functions manipulates the global LDE Document.

The following insertion function deserializes the given structure from JSON,
finds the descendant of the LDE Document that has the given ID, and inserts
the deserialized version as one of its children, at the given index. If
anything goes wrong in that process then it does nothing.  All newly
inserted structures are given new, unique IDs (with their descendants) if
they did not yet have them.

The ID may be the ID of a Structure, as defined in that class (a nonnegative
natural number) or it may be an externally used ID, which must be a string,
and will be considered to indicate the unique structure with external
attribute having key "ID" and the given string as its value.

    functions.insert = ( json, parentID, insertionIndex ) ->
        if ( parent = lookupID parentID )? and \
           ( 0 <= insertionIndex <= parent.children().length ) and \
           ( isInTheDocument parent ) and \
           ( newInstance = Structure.fromJSON( json ).setup() )?
            parent.insertChild newInstance, insertionIndex
            trackExternalIDs newInstance

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, removes it from its
parent and releases all IDs within it.

    functions.delete = ( subtreeID ) ->
        if ( subtree = lookupID subtreeID )? and \
           ( isInTheDocument subtree ) and subtree isnt LDEDocument
            subtree.removeFromParent()
            releaseAllIDs subtree
            stopTrackingExternalIDs subtree

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, deserializes the
second argument as a Structure object and uses it to replace the original
structure in the LDE Document. The deserialized version will be assigned
new, unique IDs at every node in its tree before insertion into the
Document.  The structure that was removed to do the replacement will have
all the IDs within it released.

    functions.replace = ( subtreeID, json ) ->
        if ( subtree = lookupID subtreeID )? and \
           ( isInTheDocument subtree ) and subtree isnt LDEDocument and \
           ( newInstance = Structure.fromJSON( json ).setup() )?
            subtree.replaceWith newInstance
            releaseAllIDs subtree
            trackExternalIDs newInstance
            stopTrackingExternalIDs subtree

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, calls its member
function for setting an external attribute with the given key and value.  As
per the requirements of the `Structure.setExternalAttribute` function, be
sure to provide only values that are amenable to `JSON.stringify`.

    functions.setAttribute = ( subtreeID, key, value ) ->
        if ( subtree = lookupID subtreeID )? and \
           isInTheDocument subtree
            if key is 'ID' then stopTrackingExternalIDs subtree, no
            subtree.setExternalAttribute key, value
            if key is 'ID' then trackExternalIDs subtree, no

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
