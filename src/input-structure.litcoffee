
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

### Expression-specific functionality

During interpretation of the Input Tree, each expression will need to import
from the modifiers connected to it any data that they wish to embed into the
expression, so that such data can be used to inform the expression's
interpretation.  We provide the following function for doing so.

It is required to process incoming connections in the order that the
modifiers appear in the Input Tree.  Thus we find all the modifiers first,
then sort them by their order in the tree, then embed the data.  The
`clearAttributesFromModifiers()` function is documented later.

        updateData : ->
            @clearAttributesFromModifiers()
            sources = [ ]
            for incomingConnection in @getConnectionsIn()
                source = @getConnectionSource incomingConnection
                sources.push source if source instanceof InputModifier
            sources.sort ( a, b ) ->
                if a is b then 0 else if a.isEarlierThan b then -1 else 1
            source.updateDataIn @ for source in sources

When an `InputModifier` writes to an attribute of this object, we may want
to mark the attribute as having come from a modifier.  This will help us
provide some convenience features to modifiers as they write to attributes.
We thus provide the following two functions that use internal attributes
(ones beginning with underscore) to store metadata about an attribute.

        setCameFromModifier : ( attrKey ) ->
            @setAttribute "_from modifier #{attrKey}", yes
        getCameFromModifier : ( attrKey ) ->
            @getAttribute "_from modifier #{attrKey}"

Before the modification phase, it can be useful to delete everything that
was set by a modifier, so that modifiers can accumulate list or set data in
their target without worrying about compounding what they added in the last
run of the modification phase.  Thus the following function guarantees that
the expression is in a pristine state, as far as modifier data is concerned.

        clearAttributesFromModifiers : ->
            for own key of @attributes
                if key[...15] is '_from modifier '
                    delete @attributes[key]
                    delete @attributes[key[15...]]

### Convenience functions for `InputModifier`s

An `InputModifier` may want to write a single value into its target
expression, but not overwrite any value already stored there.  To that end,
we have the following function.  It does exactly that, and also marks the
written value as having come from a modifier.  Thus this function is
intended to be called only by `InputModifier`s.  It returns true if it set
the value, and false if it did not because one was already there.  Because
attributes written by modifiers are cleared at the start of every run of
`updateData()`, the first modifier to attempt to write a single value will
succeed, and all others will fail.

        setSingleValue : ( key, value ) ->
            return no if @attributes.hasOwnProperty key
            @setAttribute key, value
            @setCameFromModifier key
            yes

An `InputModifier` may want to append a single value to an array stored in
its target expression, but not change any of the earlier values already
stored in the array.  To that end, we have the following function.  It does
exactly that, and also marks the array as having come from a modifier.  Thus
this function is intended to be called only by `InputModifier`s.  Because
attributes written by modifiers are cleared at the start of every run of
`updateData()`, the result at the end of a run of `updateData()` will be the
list of values appended by all connected modifiers that write to the array,
in the order the modifiers appear in the document.

        addListItem : ( key, item ) ->
            listSoFar = @getAttribute key
            if listSoFar not instanceof Array then listSoFar = [ ]
            @setAttribute key, listSoFar.concat [ item ]
            @setCameFromModifier key

This function is just like the previous, except it builds a set rather than
a list, and thus the order in which things are added is unimportant (and, of
course, duplicates are not added twice).

        addSetElement : ( key, element ) ->
            asString = JSON.stringify element
            setSoFar = @getAttribute key
            @setCameFromModifier key
            if setSoFar not instanceof Array then setSoFar = [ ]
            for otherElement in setSoFar # is it already there?
                return if asString is JSON.stringify otherElement
            @setAttribute key, setSoFar.concat [ element ]

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

## Define `BasicInputModifier`s as a type of `InputModifier`

This class implements the simplest (and probably most common) type of
`InputModifier`, one that makes a series of calls to `setSingleValue()`,
`addListItem()`, and/or `addSetElement()` in its target(s).  Thus its
constructor takes a set of key-value-type triples and stores them for later
embedding in any target.  The "type" of the triple will be which kind of
function should be used to insert it (single value, list item, set element),
as the string name of that function (`"setSingleValue"`, `"addListItem"`,
and `"addSetElement"`).

    class BasicInputModifier extends InputModifier

The constructor that stores the set of triples, discarding any that don't
match the format given above.

        constructor : ->
            super()
            @actions = ( triple for triple in arguments \
                when triple.length is 3 and triple[2] in \
                [ 'setSingleValue', 'addListItem', 'addSetElement' ] )

The `updateDataIn()` method that just runs the functions described by the
triples.

        updateDataIn : ( target ) ->
            target[type] key, value for [ key, value, type ] in @actions

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'BasicInputModifier',
            BasicInputModifier

Now if this is being used in a Node.js context, export the class we defined.

    if exports?
        exports.InputStructure = InputStructure
        exports.InputExpression = InputExpression
        exports.InputModifier = InputModifier
        exports.BasicInputModifier = BasicInputModifier
