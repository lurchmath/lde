
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

### Feedback

To give feedback about a particular `InputStructure` instance, call the
`feedback` method in that instance, which will delegate the work to the
class-level `feedback` method in the `Structure` class, but only after
adding itself as the subject of the feedback data.  While that method's
default implementation is a stub, it is overwritten by the LDE when
[the Structure module](structure.litcoffee) is loaded into the LDE.

        feedback : ( feedbackData ) ->
            feedbackData.subject = @id()
            Structure.feedback feedbackData

## Define `InputExpression`s as a type of `InputStructure`

`InputStructure`s come in two varieties, each represented by a subclass. The
first is defined in this section:  An `InputExpression` is the type of
`InputStructure` that the LDE will interpret into meaningful content in its
Output Tree.  In the next section, we define `InputModifier`s, which do not
produce nodes in the Output Tree, but just modify `InputExpression`
instances and thus impact how they produce nodes in the Output Tree.

    class InputExpression extends InputStructure

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'InputExpression', InputExpression

## Define `InputModifier`s as a type of `InputStructure`

As documented in the previous section, `InputModifier`s are the subclass of
`InputStructure` that do not produce interpretations in the LDE's Output
Tree, but instead modify the interpretations of `InputExpression`s, which
do.

    class InputModifier extends InputStructure

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'InputModifier', InputModifier

One unique characteristic of modifiers is that they cannot contain other
nodes as children.  Thus we alter the constructor so that when it calls the
parent class's constructor, it does not pass on any arguments, and we
redefine the `insertChild()` routine to do nothing.

        constructor : -> super()
        insertChild : ->

### Modifier-specific functionality

The LDE guarantees that, before it interprets the Input Tree into the Output
Tree, it will run `updateConnections()` in every `InputModifier`.  This
gives the modifier an opportunity to ensure that it is connected (using the
ordinary connections features built into all `Structure`s) to the correct
set of `InputExpressions`, precisely those that it modifies.  Those
`InputExpression`s will, during interpretation, then call the
`updateDataIn()` functions in the modifiers attached to them, giving each
such modifier a chance to impact the expression before it is interpreted.

Here, we provide default implementations of both `updateConnections()` and
`updateDataIn()`, which do nothing.  Subclasses of `InputModifier` can
reimplement them to take actions appropriate to that subclass.

        updateConnections : ->
        updateDataIn : ( targetExpression ) ->

Now if this is being used in a Node.js context, export the class we defined.

    if exports?
        exports.InputStructure = InputStructure
        exports.InputExpression = InputExpression
        exports.InputModifier = InputModifier
