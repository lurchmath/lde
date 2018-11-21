
# Output Structures

The LDE module constructs, for its internal use, a hierarchy of
`OutputStructure` instances called the Output Tree.  The word "output" is
used because it is the output of an interpretation process defined
throughout the subclasses of `InputStructure`.

These have entirely different functionality than their cousins
`InputStructure` instances.  In short, these support validation while
`InputStructure`s support interpretation.  You can also think of the
difference as this:  `InputStructure`s represent the syntax of what the user
has expressed to the client, and `OutputStructure`s represent the semantics
into which we interpret that syntax.

## Import modules

Import the `Structure` class.  The following lines detect whether this
is being used in Node.js or a WebWorker, or a WebWorker-like background
thread within Node.js, and do the right thing in any case.

In the Worker cases, it is important not to call `importScripts` on the same
module more than once from different files, or all manner of confusing logic
errors manifest at runtime, hence the checks below.

    if require?
        { Structure } = require './structure'
        { InputStructure } = require './input-structure'
    else if WorkerGlobalScope?
        if not WorkerGlobalScope.Structure?
            importScripts 'structure.js'
            importScripts 'input-structure.js'
    else if self?.importScripts?
        if not self.Structure?
            importScripts 'release/structure.js'
            importScripts 'release/input-structure.js'

## Define the `OutputStructure` class

    class OutputStructure extends Structure

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'OutputStructure', OutputStructure

Marking an `OutputStructure` dirty, unlike with `InputStructure`s, does not
propagate up the ancestor chain.  Thus we define the following function
analogous to the one in the `InputStructure` class, but without the
recursive propagation.

        markDirty : ( yesOrNo = yes ) -> @dirty = yesOrNo

A newly constructed instance should be considered dirty (because it probably
just changed and thus may need to be validated).  It should also record the
`InputStructure` instance that gave rise to it, if indeed this construction
happend as part of interpretation.

        constructor : ->
            super arguments...
            @markDirty()
            IS = Structure::subclasses.InputStructure
            if len = IS::instancesBeingInterpreted?.length
                @origin = IS::instancesBeingInterpreted[len-1]

Similar to tracking origins for `OutputStructure` nodes, if a connection is
formed between `OutputStructure` instances, we will want to track its origin
in the sense of which `InputStructure` was being interpreted when the
connection was formed.

        addConnectionOrigin : ( source, target, data ) ->
            IS = Structure::subclasses.InputStructure
            if ( target instanceof OutputStructure ) and \
               ( len = IS::instancesBeingInterpreted?.length )
                data._origin = IS::instancesBeingInterpreted[len-1].id()

## Feedback

To give feedback about a particular `OutputStructure` instance, find the
`InputStructure` instance that created this `OutputStructure` and if there
is such a thing, call the `feedback` method in it.  (That will delegate the
work further, but that is not our concern here.)

        feedback : ( feedbackData ) -> @origin?.feedback feedbackData

## Labels

`OutputStructure`s can be labeled.  This is implemented by a function that
takes a string as input and returns true or false, whether the structure has
that label.  This permits a lot of freedom in how we match labels to
structures, including case sensitivity, punctuation sensitivity, multiple
labels, and so on.  By default, however, everything is unlabeled, so the
base implementation is as follows.

        hasLabel : ( label ) -> no

We can look back through a list of all the `OutputStructure`s accessible to
a given one, seeking the first one that admits to having a given label, by
use of the `hasLabel()` function on each accessible structure.  We implement
that generically with the following class method, then make a shortcut for
use by instances below.  Here we assume that the accessibles array is given
in the order in which the nodes appear in the tree
(`Structure.isEarlierThan()`).

        @lookUpIn : ( label, accessibles ) ->
            for candidate in accessibles[...].reverse()
                return candidate if candidate.hasLabel label
            undefined

When an instance asks to look up the nearest accessible thing with a given
label, what it means is among those things accessible to that instance.

        lookUp : ( label ) ->
            @firstAccessible ( candidate ) -> candidate.hasLabel label

When an instance asks to look up all accessible things with a given label,
they are still returned in the order in which they are encountered when
traversing the list of accessibles.

        lookUpAll : ( label ) ->
            @allAccessibles ( candidate ) -> candidate.hasLabel label

## Citations

Obeying the conventions set down by interpretation, as defined in
[the InputStructure class](input-structure.litcoffee#citations), we provide
the following function to look up all structures cited by this one.  The
notion of "looking them up" here means finding the targets that are cited by
the data stored in this object and creating a dictionary mapping the means
of citation to the structures cited.

We respect the following citation conventions set down by the
`InputStructure` class linked to in the previous paragraph:
 * The "premise citations" and "reason citations" attributes will each map
   to a list of strings, each of which attempts to cite something by label.
 * Connections out of this node whose JSON data contains the key-value pair
   ("type","premise citation") or ("type","reason citation") are each
   interpreted as a citation.

This routine does not actually call `lookUp()`, defined above, because to do
so repeatedly would be inefficient, traversing the accessibles list
potentially many times.  Rather, we traverse it just once, asking about
multiple label matches at each stop.

The form of the result will be a JSON structure with this format:
```javascript
{
    premises : { // citations of premises go in here
        connections : [ // citations by connection go in here
            {
                cited : "id of target structure",
                id : "id of connection, so you can get its data later"
            }
            // zero or more such objects in this array
        ],
        labels : [ // citations by label go in here
            {
                cited : "id of cited structure",
                label : "text of label by which it was cited"
            }
            // zero or more such objects in this array
        ]
    },
    reasons : {
        // same structure as premises object above
    }
}
```

        lookUpAllCitations : ->

Initialize the data structure we will return, empty at first.

            result =
                premises :
                    connections : [ ]
                    labels : [ ]
                reasons :
                    connections : [ ]
                    labels : [ ]

Fill both connections arrays by examining all connections out of this
structure for their types.

            for connection in @getConnectionsOut()
                data = @getConnectionData connection
                for type in [ 'premise', 'reason' ]
                    if data.type is "#{type} citation" and
                       ( target = @getConnectionTarget connection )?
                        result["#{type}s"].connections.push
                            cited : target.id()
                            id : connection

Fill both labels arrays by examining the relevant attributes of this
structure.

            for type in [ 'premise', 'reason' ]
                if ( labels = @getAttribute "#{type} citations" ) and \
                   labels instanceof Array
                    for label in labels
                        if ( cited = @lookUp label )?
                            result["#{type}s"].labels.push
                                cited : cited.id()
                                label : label

Return the result.

            result

## Exports

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.OutputStructure = OutputStructure
