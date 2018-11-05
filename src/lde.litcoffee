
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
        { Structure } = require './structure'
        { InputStructure } = require './input-structure'
    else if WorkerGlobalScope?
        importScripts 'structure.js'
        importScripts 'input-structure.js'
    else if self?.importScripts?
        importScripts 'release/structure.js'
        importScripts 'release/input-structure.js'

## The Input Tree

The Input Tree is a global instance of the `InputStructure` class,
representing the content of the user's document as expressed to this module
by the client.  It has the special ID "root."

    InputTree = ( new InputStructure ).attr 'id' : 'root'
    InputTree.trackIDs()

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

## Utilities

We create a function for use privately in this module, for verifying that a
particular structure is a descendant of the Input Tree.

    isInTheInputTree = ( structure ) ->
        while structure instanceof InputStructure
            if structure is InputTree then return yes
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

This module presents to clients a four-function API defined in this section.
Each of these functions manipulates the global Input Tree.

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

All newly inserted structures and their descendants have all their IDs
tracked.

    functions.insert = ( newChild, parentID, insertionIndex ) ->
        if ( parent = Structure.instanceWithID parentID )? and \
           ( 0 <= insertionIndex <= parent.children().length ) and \
           ( isInTheInputTree parent ) and \
           ( newInstance = deserializeIfNeeded( newChild ).setup() )? and \
           ( newInstance instanceof InputStructure )
            parent.insertChild newInstance, insertionIndex
            newInstance.trackIDs()

The following function finds the descendant of the global Input Tree that
has the given ID and, assuming such a structure exists, removes it from its
parent and stops tracking all IDs within it.

    functions.delete = ( subtreeID ) ->
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

This functionl, also, permits passing an actual `InputStructure` instance as
the second argument, rather than a serialized version.

    functions.replace = ( subtreeID, newTree ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           ( isInTheInputTree subtree ) and subtree isnt InputTree and \
           ( newInstance = deserializeIfNeeded( newTree ).setup() )? and \
           ( newInstance instanceof InputStructure )
            subtree.replaceWith newInstance
            subtree.untrackIDs()
            newInstance.trackIDs()

The following function finds the descendant of the global Input Tree that
has the given ID and, assuming such a structure exists, calls its member
function for setting an attribute with the given key and value.  As per the
requirements of the `Structure.setAttribute` function, be sure to provide
only values that are amenable to `JSON.stringify`.

    functions.setAttribute = ( subtreeID, key, value ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           isInTheInputTree subtree
            if key is 'id' then subtree.untrackIDs no
            if typeof value is 'undefined'
                subtree.clearAttributes key
            else
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
 * `getInputTree`, with zero arguments, which sends back a message
   containing the JSON serialized form of the document, as fetched using the
   `getInputTree` function defined above


    if WorkerGlobalScope? or self?.importScripts?

Here are the numbers of arguments we accept for each message we accept.

        expectedArgumentCount =
            insert : 3
            delete : 1
            replace : 2
            setAttribute : 3
            getInputTree : 0

Messages received expect data arrays of the form `[ command, args... ]`.

        self.addEventListener 'message', ( event ) ->
            [ command, args... ] = event.data

Anything with the right number of arguments is passed on to the
corresponding function.  That function may or may not do anything, depending
on whether the data is in the correct form.

            if expectedArgumentCount[command] is args.length
                if command is 'getInputTree'
                    self.postMessage functions.getInputTree().toJSON()
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
            for own key, value of feedbackData
                event[key] = value
            Feedback.dispatchEvent event
        else if Feedback?.emit?
            Feedback.emit 'feedback', feedbackData
        else if self?.postMessage?
            self.postMessage feedbackData

Install that function in the `Structure` class, overriding the stub class
method that module installs in itself.

    Structure.feedback = feedback

And export anything else that needs exporting.

    if exports?
        exports.Structure = Structure
        exports.InputStructure = InputStructure
        exports.insert = functions.insert
        exports.delete = functions.delete
        exports.replace = functions.replace
        exports.setAttribute = functions.setAttribute
        exports.getInputTree = functions.getInputTree
