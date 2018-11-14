
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
        { OutputStructure } = require './output-structure'
    else if WorkerGlobalScope?
        if not WorkerGlobalScope.Structure?
            importScripts 'structure.js'
            importScripts 'output-structure.js'
    else if self?.importScripts?
        if not self.Structure?
            importScripts 'release/structure.js'
            importScripts 'release/output-structure.js'

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

If interpretation for this instance has already begun, then it is illegal to
mark it dirty (or we might cause an infinite loop of reinterpretations).
Subclasses should not do this, but in case they do, we police it here by not
respecting the request, and sending a feedback error.  For information on
types of feedback, see [the API documentation page for the LDE](https://lurchmath.github.io/lde/site/api-lde/).

        markDirty : ( yesOrNo = yes ) ->
            if yesOrNo and @alreadyStarted
                return @feedback type : 'dirty loop'
            @dirty = yesOrNo
            if yesOrNo then @parentNode?.markDirty()

### Labels

We provide the following convenience function that embodies a few
conventions for assigning labels to `OutputStructure`s.  We place it here so
that it is available to all subclasses of `InputStructure` as follows:

The default implementation of `recursiveInterpret()` calls this function
whenever an `InputStructure` has just computed its interpretation from its
`interpret()` routine.  It should add labels to all the `OutputStructure`
instances in its own `lastInterpretation` array.

Thus subclasses of `InputStructure` do not even need to consider this
function; it is called automatically on their behalf. Subclasses that do not
wish to use it simply ensure that they do not use the attributes that it
reads from (or redefine this routine or `recursiveInterpret()`).

        addLabels : ->
            targets = @lastInterpretation

First convention:  If this `InputStructure` has an attribute with key
`"label targets"` then it is treated as an array of integers, and we only
label those targets whose indices in the array passed as parameter are on
that list.

            if ( indices = @getAttribute 'label targets' )? and \
               ( indices instanceof Array )
                targets = ( t for t,index in targets when index in indices )

Second convention:  If this `InputStructure` has an attribute with key
`"label regex"` then its value is converted into a regular expression object
and the target `OutputStructure`s will test labels against that regular
expression.  Any flags in the `"label regex flags"` attribute apply.

            if ( regex = @getAttribute 'label regex' )?
                flags = ( @getAttribute 'label regex flags' ) ? ''
                regex = new RegExp regex, flags
                for target in targets
                    target.hasLabel = ( label ) -> regex.test label

Other conventions may be added here in the future.

### Citations

We provide the following convenience function that embodies a few
conventions for copying citations to `OutputStructure`s.  We place it here
so that it is available to all subclasses of `InputStructure` in the same
manner that `addLabelsTo()` is, in the previous section.

        copyCitations : ->
            targets = @lastInterpretation

First convention:  The value of the "premise citations" attribute should be
a list of labels of the premises being cited.  If it is an array, it will be
treated as an array of strings.  If it is not an array, it will be converted
to a string and treated as a one-element array containing that string.  Such
citations are copied directly into attributes of the target
`OutputStructure`s.

            if ( citations = @getAttribute 'premise citations' )?
                citations = [ citations ] if citations not instanceof Array
                for target in targets
                    target.setAttribute 'premise citations',
                        ( "#{citation}" for citation in citations )

Second convention:  The "reason citations" behaves the same way

            if ( citations = @getAttribute 'reason citations' )?
                citations = [ citations ] if citations not instanceof Array
                for target in targets
                    target.setAttribute 'reason citations',
                        ( "#{citation}" for citation in citations )

Third convention:  Connections in or out whose type is "premise citation"
should be copied over to the analogous nodes in the Output Tree.  Here we
use the `citationSources()` and `citationTargets()` functions to ask which
elements of our `lastInterpretation` should be the sources/targets of any
citation connections.  These functions default to saying "everything," but
can be overridden by subclasses as needed.

            for connection in @getAllConnections()
                data = @getConnectionData connection
                if data.type in [ 'premise citation', 'reason citation' ]
                    source = @getConnectionSource connection
                    target = @getConnectionTarget connection

We only form connections if both ends of the connection have run their
interpretation routines, because it doesn't make sense to connect to
elements to `lastInterpretation`s that are about to be replaced:

                    if not source.alreadyStarted or \
                       not target.alreadyStarted then continue
                    counter = 0
                    for s in source.citationSources connection
                        for t in target.citationTargets connection
                            copy = JSON.parse JSON.stringify data
                            copy.id = "#{data.id}.#{counter++}"
                            s.connectTo t, copy

And here are the default implementations for `citationSources()` and
`citationTargets()`.

        citationSources : ( connection ) -> @lastInterpretation
        citationTargets : ( connection ) -> @lastInterpretation

Other conventions may be added here in the future.

### Automatic ID assignment

It is convenient for unique IDs of `OutputStructure`s in the Output Tree to
correlate with the unique IDs of their originating nodes in the Input Tree.
To that end, we provide the following function, which `recursiveInterpret()`
always calls.  It can be used (and, by default, is) to assign unique IDs to
the nodes in the Output Tree based on the unique ID of the structure whose
interpretation created them.

By the convention established here, an `InputStructure` with ID x that
produced five `OutputStructures` would assign them IDs x.0, x.1, ..., x.4.

Subclasses who do not wish this to happen can replace this method.

        assignCorrespondingIDs : ->
            for target, index in @lastInterpretation
                target.attr id : "#{@id()}.#{index}" if not target.id()?

### Interpretation

The main purpose of `InputStructure`s is to be interpretable, converting the
LDE's Input Tree (analogous to syntax) into its Output Tree (semantics).
The functions in this section support that purpose.

We will track which instance we are interpreting with a class variable.  It
will be a stack, in case one `interpret()` routine ever calls another
(although this is not expected).  It will track the current set of running
`interpret()` calls.  This will help us know, from anywhere in the LDE,
which structures are currently being interpreted.  This variable is
maintained by the `recursiveInterpret()` routine defined further below.

        instancesBeingInterpreted : [ ]

We will track which instances have started being interpreted with another
class variable.  This is important for preventing infinite loops in the
recursive interpretation process, should some instance try to mark as dirty
another instance whose interpretation has already begun (or even finished).
This, too, is managed by `recursiveInterpret()`, as well as the function
defined here.

        instancesAlreadyStarted : [ ]
        @clearAlreadyStarted : ->
            for instance in InputStructure::instancesAlreadyStarted
                delete instance.alreadyStarted
            InputStructure::instancesAlreadyStarted = [ ]

The `interpret()` function defines how each subclass of `InputStructure`
produces one or more nodes in the Output Tree.  It returns zero or more
`OutputStructure` instances, in an array.  We provide the following default
implementation that makes `InputStructure` instances behave like generic
wrappers around their children.

The parameters have the following meanings:
 * `accessibles` - the list of `OutputStructure` instances in the Output
   Tree accessible to the structures produced by this function
 * `childResults` - the list of results produced by interpreting the
   children of this node (already computed), which will be a list of lists,
   because each child's results are an array of `OutputStructure`s.
 * `scope` - the list of highest-level nodes in the Input Tree whose
   interpretations will be placed in the scope of the interpretation of this
   node, in the Output Tree

Subclasses which override this must be sure to satisfy the following
properties.
 * Compute the result based *only* on the data in the first two parameters,
   `accessibles` and `childResults`.  Do not read from other parts of the
   Input or Output Trees, including the data in `scope`.
 * Mark another `InputStructure` dirty *only* if it is a descendant of one
   of the structures in the `scope` array (the third parameter).


        interpret : ( accessibles, childResults, scope ) ->
            result = new OutputStructure() # plain vanilla wrapper node
            count = 0
            for childArray in childResults
                result.insertChild node, count++ for node in childArray
            [ result ] # must be an array even if it contains only one node

The `recursiveInterpret()` function defines how the Input Tree will be
traversed, making calls to the `interpret()` functions of its nodes as
needed to assemble the final interpretation of the entire Input Tree.  The
`accessibles` and `scope` parameters default to empty (as they should when
this is run at the root of the Input Tree) but then in recursive calls have
the same meanings as documented above for the `interpret()` routine.  No
`childResults` are passed in this case because the job of this routine is to
do the recursion that produces the recursive results from children.

        recursiveInterpret : ( accessibles = [ ], scope = [ ] ) ->
            originalAccessiblesLength = accessibles.length
            allChildResults = [ ]

This loop does the actual recursion, to compute `allChildResults`.

            for child, index in children = @children()

For the first child, the same list of accessibles for the parent applies to
that child, so we don't need to modify `accessibles`.  As the `scope`, we
pass the list of all subsequent siblings, in order.

                childResult = child.recursiveInterpret accessibles,
                    children[index+1...]
                allChildResults.push childResult

But for later children, more things are accessible.  Specifically, anything
just created by interpreting `child` should be accessible to its next
sibling, so we update `accessibles` as follows, in preparation for the next
iteration of this loop through the children.

                accessibles = accessibles.concat childResult

Now that the recursion into children is complete, we will ask this structure
to interpret itself in light of what's accessible to it.  To prepare for
that, we must first restore the `accessibles` array to its original content.

            accessibles = accessibles[...originalAccessiblesLength]

Call `interpret()` on this node, with all the correct parameters, mark this
structure as clean for interpretation, and return the result.  Push this
onto the stack of instances being interpreted right before, and pop it right
after.

            InputStructure::instancesBeingInterpreted.push @
            InputStructure::instancesAlreadyStarted.push @
            @alreadyStarted = yes
            @lastInterpretation =
                @interpret accessibles, allChildResults, scope

As we build the tree, we need to track the IDs used in it, so that nodes
that wish to form connections among descendants can do so.  Thus we must
begin tracking IDs as soon as new nodes are formed.  We do so here, first
assigning default IDs to any `OutputStructure` that doesn't have them.

            @assignCorrespondingIDs()
            structure.trackIDs() for structure in @lastInterpretation

We had to do that before labels and citations, in case any of those
involves making connections.

            @addLabels()
            @copyCitations()
            InputStructure::instancesBeingInterpreted.pop()
            @markDirty no
            @lastInterpretation

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

## Define `Dependency` as a type of `InputExpression`

This class implements a foundational type of `InputExpression`, one that is
given a list of `OutputExpression` instances loaded from a dependency file
and whose `interpret()` routine places those instances directly into the
output tree.  It is used at the start of a document to represent all the
data imported from other documents on which that one depends (its
"dependencies").

Its constructor takes a list of `OutputExpression` instances and its
`getContents()` member returns that same list.  That getter is used in the
`interpret()` routine.

    class Dependency extends InputExpression

The constructor stores the meaning loaded from dependency documents, which
must be a list of `OutputStructure` instances.  Any other arguments are
ignored.

        constructor : ->
            super()
            @dependencyContents = \
                ( a for a in arguments when a instanceof OutputStructure )

The following method is just a getter for the data given to the constructor.

        getContents : -> @dependencyContents

Interpretation simply yields that list of contents.

        interpret : ( accessibles, childResults, scope ) -> @getContents()

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'Dependency', Dependency

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

Another unique characteristic of modifiers is that they have no
interpretation in the Output Tree.  Thus we define the interpretation here
for all modifiers to be the empty array of results.

        interpret : ( accessibles, childResults, scope ) -> [ ]

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
        exports.Dependency = Dependency
