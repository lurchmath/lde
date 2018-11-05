
# Input Structures

The LDE module allows clients to construct input to that module as trees of
`Structures`, but more specifically, trees of the subclass of `Structure`
defined in this module, `InputStructure`.

These have entirely different functionality than their cousins
`OutputStructure` instances.  In short, these support interpretation while
`OutputStructure`s support validation.

## Import modules

Import the `InputStructure` class.  The following lines detect whether this
is being used in Node.js or a WebWorker, or a WebWorker-like background
thread within Node.js, and do the right thing in any case.

    if require?
        { Structure } = require './structure'
    else if WorkerGlobalScope?
        importScripts 'structure.js'
    else if self?.importScripts?
        importScripts 'release/structure.js'

## Define the `InputStructure` class

    class InputStructure extends Structure

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'InputStructure', InputStructure

Marking an `InputStructure` dirty means marking its entire ancestor chain
dirty, because if a child's meaning has changed, that may impact the meaning
of its parent, and so on up the chain.  If it is marked clean, this does not
necessarily propagate upwards.

        markDirty : ( yesOrNo = yes ) ->
            @dirty = yesOrNo
            if yesOrNo then @parentNode?.markDirty()

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.InputStructure = InputStructure
