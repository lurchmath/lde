
# Lurch Deductive Engine (LDE) Main File

This file imports all the other modules in this repository and exposes them
through its `exports` member, so that clients can import just this one file
and have access to all the functionality from all the source files in this
repository.

Import the structure class and export it to clients as well.

    { Structure } = require './structure'
    exports.Structure = Structure

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

    exports.getDocument = -> LDEDocument

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

## The Main API

This module presents to clients a four-function API defined in this section.
Each of these functions manipulates the global LDE Document.

The following insertion function deserializes the given structure from JSON,
finds the descendant of the LDE Document that has the given ID, and inserts
the deserialized version as one of its children, at the given index. If
anything goes wrong in that process then it does nothing.  All newly
inserted structures are given new, unique IDs (with their descendants) if
they did not yet have them.

    exports.insert = ( json, parentID, insertionIndex ) ->
        if ( parent = Structure.instanceWithID parentID )? and \
           ( 0 <= insertionIndex <= parent.children().length ) and \
           ( isInTheDocument parent ) and \
           ( newInstance = Structure.fromJSON( json ).setup() )?
            parent.insertChild newInstance, insertionIndex

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, removes it from its
parent and releases all IDs within it.

    exports.delete = ( subtreeID ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           ( isInTheDocument subtree ) and subtree isnt LDEDocument
            subtree.removeFromParent()
            releaseAllIDs subtree

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, deserializes the
second argument as a Structure object and uses it to replace the original
structure in the LDE Document. The deserialized version will be assigned
new, unique IDs at every node in its tree before insertion into the
Document.  The structure that was removed to do the replacement will have
all the IDs within it released.

    exports.replace = ( subtreeID, json ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           ( isInTheDocument subtree ) and subtree isnt LDEDocument and \
           ( newInstance = Structure.fromJSON( json ).setup() )?
            subtree.replaceWith newInstance
            releaseAllIDs subtree

The following function finds the descendant of the global LDE Document that
has the given ID and, assuming such a structure exists, calls its member
function for setting an external attribute with the given key and value.  As
per the requirements of the `Structure.setExternalAttribute` function, be
sure to provide only values that are amenable to `JSON.stringify`.

    exports.setAttribute = ( subtreeID, key, value ) ->
        if ( subtree = Structure.instanceWithID subtreeID )? and \
           isInTheDocument subtree
            subtree.setExternalAttribute key, value
