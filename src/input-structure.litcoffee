
# Input Structures

The LDE module allows clients to construct input to that module as trees of
`Structures`, but more specifically, trees of the subclass of `Structure`
defined in this module, `InputStructure`.

These have entirely different functionality than their cousins
`OutputStructure` instances.  In short, these support interpretation while
`OutputStructure`s support validation.  You can also think of the difference
as this:  `InputStructure`s represent the syntax of what the user has
expressed to the client, and `OutputStructure`s represent the semantics into
which we interpret that syntax.

## Import modules

Import the `Structure` class.  The following lines detect whether this
is being used in Node.js or a WebWorker, or a WebWorker-like background
thread within Node.js, and do the right thing in any case.

In the Worker cases, it is important not to call `importScripts` on the same
module more than once from different files, or all manner of confusing logic
errors manifest at runtime, hence the checks below.

    if require?
        { Structure } = require './structure'
    else if WorkerGlobalScope?
        if not WorkerGlobalScope.Structure?
            importScripts 'structure.js'
    else if self?.importScripts?
        if not self.Structure?
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

## Feedback

To give feedback about a particular `InputStructure` instance, call the
`feedback` method in that instance, which will delegate the work to the
class-level `feedback` method in the `Structure` class, but only after
adding itself as the subject of the feedback data.  While that method's
default implementation is a stub, it is overwritten by the LDE when
[the Structure module](structure.litcoffee) is loaded into the LDE.

        feedback : ( feedbackData ) ->
            feedbackData.subject = @id()
            Structure.feedback feedbackData

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.InputStructure = InputStructure

## Other `InputStructure` Subclasses

None yet.  More to come.
