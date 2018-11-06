
# LDE Structures

The very generic word "structure" is used in the LDE to describe a subtree
of the LDE Document.  For more details on this, see
[the design overview docs](https://lurchmath.github.io/lde/site/overview/).

    class Structure

If you plan to develop a subclass of `Structure`, be sure to follow the
requirement listed in the
[Serialization and Deserialization](#serialization-and-deserialization)
section, below.

## Constructor

The constructor body just initializes internal fields, but it accepts an
array of initial children as its argument.  Any non-Structure passed as an
argument is ignored.  See the next section for more details of child
structures.

        constructor : ( children... ) ->
            @attributes = { }
            @parentNode = null
            @childList = [ ]
            for child in children
                @insertChild child, @childList.length
            @dirty = no

We also include here a simple getter for the `dirty` attribute.  Subclasses
will define appropriate setters.

        isDirty : -> @dirty

## Serialization and deserialization

We need to be able to convert structure hierarchies to/from JSON data.  We
do so with the routines in this section.

### Registering class names

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
After all, there will be sublcasses of this class defined, and during
deserialization, instances of those subclasses will need to be created, as
opposed to generic `Structure`s.

To facilitate this, we track all subclasses in a single global variable,
here.  Add one using the registration function provided.

        subclasses : { }
        @addSubclass : ( name, classObj ) ->
            Structure::subclasses[name] = classObj
            name

When should you call it?  In your subclass, create a class variable called
`className` and assign `Structure.addSubclass 'your class name', YourClass`
to that member.  Follow this example, which we do here for the `Structure`
base class:

        className : Structure.addSubclass 'Structure', Structure

### Serialization to JSON

The serialized version of a class contains some objects from within the
class, not copies but the same objects, so that serialization can be fast.
Thus you should not modify the serialized version's members.  If you want an
independent copy, run `JSON.parse` on `JSON.stringify` of the serialized
version.

        toJSON : ( includeID = yes ) ->
            if includeID or not @id()?
                attributes = @attributes
            else
                attributes = JSON.parse JSON.stringify @attributes
                delete attributes.id
            className : @className
            attributes : attributes
            children : ( child.toJSON includeID for child in @childList )

### Deserialization from JSON

Deserialization is a method in the class, because of course it is called
when you have no instance at hand, and wish to create one.

It does not re-use the members from the parameter, but explicitly copies
them using a combination of `JSON.parse` and `JSON.stringify`, so that a
deserialized version of an existing object will share no members with that
object.

        @fromJSON : ( json ) ->
            classObj = Structure::subclasses[json.className]
            children =
                ( Structure.fromJSON child for child in json.children )
            result = new classObj children...
            result.attributes = JSON.parse JSON.stringify json.attributes
            result

## Tree structure

Structures form a hierarchy, an n-ary tree.  We thus need functions for
inserting, removing, and querying parents and children.

First, the getters.  When querying the children, we make a copy of the list
so that clients can feel free to manipulate it without messing up the
integrity of the hierarchy.

        parent : -> @parentNode
        children : -> @childList[..]
        indexInParent : -> @parentNode?.childList?.indexOf this
        previousSibling : ->
            if ( index = @indexInParent() )?
                @parentNode.childList[index-1]
        nextSibling : ->
            if ( index = @indexInParent() )?
                @parentNode.childList[index+1]

Another possibly convenient utility is to make a copy of the Structure S
(or equivalently the subtree with root S).

        copy : ->
            S = new Structure
            S.attributes = JSON.parse JSON.stringify @attributes
            S.childList = ( C.copy() for C in @childList )
            child.parentNode = S for child in S.childList
            S

We can ask which of two structures comes earlier in their common ancestor,
under pre-order tree traversal, lowest-indexed children first.  The ordering
defined here is strict (`A.isEarlierThan A` is false).

        isEarlierThan : ( other ) ->
            if other not instanceof Structure then return undefined
            if other is this then return no

Get a list of all ancestors of the other structure.  If it is the root,
then I am strictly later than it, and we can return that now.

            ancestorsOfOther = [ other ]
            while ( nextAncestor = ancestorsOfOther[0].parent() )?
                ancestorsOfOther.unshift nextAncestor

Find my nearest ancestor that appears in that list.

            walk = this
            relevantAncestor = null
            while walk? and walk not in ancestorsOfOther
                relevantAncestor = walk
                walk = walk.parent()

If there was none, we are incomparable; return undefined.  If the nearest
ancestor was me, then other is one of my descendants, so I am earlier than
it.  If the nearest ancestor was the other structure, then the reverse is
true.

            if not walk? then return undefined
            if walk is this then return yes
            if walk is other then return no

Compare the child indices in the common ancestor to determine ordering.

            commonAncestorIndex = ancestorsOfOther.indexOf walk
            otherRelevantAncestor = ancestorsOfOther[commonAncestorIndex+1]
            myAncestorIndex = relevantAncestor.indexInParent()
            otherAncestorIndex = otherRelevantAncestor.indexInParent()
            myAncestorIndex < otherAncestorIndex

Next, the setters.  There is no setter for the parent, because the parent
pointer of a structure S must be kept consistent with the children list of
the parent of S, and so we update both in the setters for children.

We permit removing children from parents, either with a method in the child
or in the parent.

We notify the child of its removal through calling two event handlers (if
they exist) in the child object: `willBeRemoved()` immediately before the
removal and `wasRemoved(parent,index)` after the removal, passing the former
parent and child index within that parent.

        removeFromParent : ->
            if ( originalParent = @parentNode )?
                @willBeRemoved?()
                originalIndex = @indexInParent()
                @parentNode.childList.splice originalIndex, 1
                @parentNode = null
                @wasRemoved? originalParent, originalIndex
        removeChild : ( atIndex ) -> @childList[atIndex]?.removeFromParent()

We permit inserting a new child into the parent's child array at any valid
index (including the old length of the child array, which appends).  The
child to be inserted is first removed from any parent it has when this
method is called.  The default index is 0, so that a call of
`insertChild(x)` inserts it as the first child.

If the child to be inserted is an ancestor of this structure, then we
remove this structure from its parent, to obey the insertion command given
while still maintaining acyclicity in the tree structure.  If the child to
be inserted is this node itself, this function does nothing.

We notify the child of its insertion through calling two event handlers (if
they exist) in the child object: `willBeInserted(parent,index)` immediately
before the removal and `wasInserted()` after the removal.  The parameters to
the first of these routines are the soon-to-be parent and the index within
that parent at which the insertion will take place.

If the child or this object needs to first be removed from a parent as
described above, there will also be removal events, as documented in the
`removeFromParent()` function, above.

        insertChild : ( child, beforeIndex = 0 ) ->
            return unless child instanceof Structure and \
                child isnt this and \
                0 <= beforeIndex <= @childList.length
            walk = this
            while ( walk = walk.parent() )?
                if walk is child then @removeFromParent() ; break
            child.removeFromParent()
            child.willBeInserted? this, beforeIndex
            @childList.splice beforeIndex, 0, child
            child.parentNode = this
            child.wasInserted?()

A convenient combination of the above methods is to replace a child with a
new structure, deparenting the old child and putting the replacement at the
same index in the same parent.

Because this calls `removeFromParent()` and `insertChild()`, it also
generates calls to the four event handlers mentioned in those functions,
above.

        replaceWith : ( other ) ->
            if ( originalParent = @parentNode )?
                originalIndex = @indexInParent()
                @removeFromParent()
                originalParent.insertChild other, originalIndex

## Attributes

The dictionary of attributes has getters and setters that work on keys or
key-value pairs (respectively).  There is also a corresponding "clear"
function for deleting entries from the attributes dictionary.

No checks are put on what kind of data can be used for the values of this
dictionary, but they should be JSON data only, to support serialization.
(Checks are omitted for efficiency.)

We notify the structure of changes to its attributes through calling two
event handlers (if they exist) in the object: `willBeChanged(key)`
immediately before the change and `wasChanged(key)` after the removal, in
both cases passing the key from the changing key-value pair.  These events
are the same whether the key-value pair is inserted, modified, or removed.

        getAttribute : ( key ) -> @attributes[key]
        setAttribute : ( key, value ) ->
            if @attributes[key] isnt value
                @willBeChanged? key
                @attributes[key] = value
                @wasChanged? key
        clearAttributes : ( keys... ) ->
            if keys.length is 0 then keys = Object.keys @attributes
            for key in keys
                if key of @attributes
                    @willBeChanged? key
                    delete @attributes[key]
                    @wasChanged? key

Attributes can also be added with an `attr()` function that returns the
instance, thus supporting method chaining.  This is useful when constructing
objects of this class, especially for unit testing, using code like
`Structure( Structure().attr(...), ... )`.  It takes an object and installs
all of its key-value pairs as attributes.

        attr : ( object ) ->
            @setAttribute key, value for own key, value of object
            this

On the topic of conveniences for constructing instances, the following
method can be used at the top level of a nested set of constructor calls,
to traverse the final tree after constructing it, and performs the
convenience cleanup routines described within the function itself.

This is intended to be used when constructing large structures, as in
`result = Structure( ...lots of children... ).setup()`.

        setup : ->

Every structure with an attribute key "label for", "reason for", or "premise
for" and value X will be converted into a connection to node X of type
"label", "reason", or "premise", respectively.  Node X will be found by
seeking a node with attribute key "id" and value X.

All attributes with key id are then deleted.

Alternately the same keys could be associated with value "previous" or
"next" to indicate connection to a sibling, with no id required.

            targets = { }
            recurFindTargets = ( node ) ->
                if ( id = node.getAttribute 'id' )?
                    targets[id] = node
                recurFindTargets child for child in node.children()
            recurFindTargets this
            recurConnect = ( node ) ->
                for attr in [ 'label', 'premise', 'reason' ]
                    if ( value = node.getAttribute "#{attr} for" )?
                        if value is 'previous'
                            target = node.previousSibling()
                        else if value is 'next'
                            target = node.nextSibling()
                        else if targets.hasOwnProperty value
                            target = targets[value]
                        else
                            target = null
                        if target? then node.connectTo target, attr
                        node.clearAttributes "#{attr} for"
                recurConnect child for child in node.children()
            recurConnect this

We then check all connections within this structure for consistency, and
return the structure for use in chaining.

            @fillOutConnections()
            this

## Unique IDs for instances

Clients of this class may give instances of it unique IDs stored in
attributes.  (See the corresponding convenience function for querying such
IDs in the [Attribute Conventions section](#attribute-conventions).)  To
track those IDs, we use a class variable defined here, and provide class
methods for tracking and untracking IDs in a structure hierarchy.  IDs can
be any string, and thus we track them in an object, using the strings as
keys.

        IDs : { }
        @instanceWithID : ( id ) -> Structure::IDs[id]

The following two functions recur through a given structure hierarchy and
save all of its IDs into (or delete all of its IDs from) the above class
variable.  Whenever a structure hierarchy is no longer used by the client,
`untrackIDs` should be called on that hierarchy to prevent memory leaks.

        id : -> @getAttribute 'id'
        trackIDs : ( recursive = yes ) ->
            if @id()? then Structure::IDs[@id()] = @
            if recursive then child.trackIDs() for child in @children()
        untrackIDs : ( recursive = yes ) ->
            if @id()? then delete Structure::IDs[@id()]
            if recursive then child.untrackIDs() for child in @children()

The following function removes all ID attributes from a structure hierarchy.
This is useful, for example, after making a deep copy of a structure, so
that the copied version does not violate the global uniqueness of IDs.

        clearIDs : ( recursive = yes ) ->
            @clearAttributes 'id'
            if recursive then child.clearIDs() for child in @children()

## Connections

Structures may have connections among them, specified using attributes.  The
documentation
[here](https://lurchmath.github.io/lde/site/phase0-structures/#connections)
covers the concept in detail.  We provide the following functions to make it
easier for clients to create, remove, or query connections.

### Making connections consistent

The first function ensures that all connections in a hierarchy are properly
recorded twice, once as outgoing from the source, and once as incoming to
the target.  This consistency is assumed by the query functions.  Run this
on the root of your hierarchy if you have any reason to believe that the
connections may not be stored consistently.

Because connections depend on IDs, this routine does nothing if this
Structure does not already have an ID.

        fillOutConnections : ->

Recur on children, but if this object has no ID, we can't go beyond that.

            child.fillOutConnections() for child in @childList
            if not @id()? then return

We define an internal function for converting multisets of target-type pairs
from array representation to an easier-to-work-with object representation,
and then an inverse of that function.  These make the rest of this function
eaiser to write.

The "array" form is as in the docs linked to above,
`[ [targID, connType], ... ]`.  The "object" form maps target keys to
objects whose key-value pairs are type-count pairs, where the count is the
number of times the `[targID,connType]` pair appeared in the array.
That is, `{ targID: { type: count, ... }, ... }`.

            arrayToObject = ( array ) ->
                result = { }
                for connection in array
                    [ target, type ] = connection
                    result[target] ?= { }
                    result[target][type] ?= 0
                    result[target][type]++
                result
            objectToArray = ( object ) ->
                result = [ ]
                for own target, moreData of object
                    for own type, count of moreData
                        for i in [1..count]
                            result.push [ target, type ]
                result

Now find all my outgoing connections, and ensure they exist in at least the
same quantity on both sides.

            outs = arrayToObject ( @getAttribute 'connectionsOut' ) ? [ ]
            for own target, moreData of outs
                continue unless ( T = Structure.instanceWithID target )?
                targetIns = arrayToObject \
                    ( T.getAttribute 'connectionsIn' ) ? [ ]
                targetIns[@id()] ?= { }
                for own type, count of moreData
                    moreData[type] = targetIns[@id()][type] =
                        Math.max count, targetIns[@id()][type] ? 0
                T.setAttribute 'connectionsIn', objectToArray targetIns

Repeat the same exrecise for my incoming connections.

            ins = arrayToObject ( @getAttribute 'connectionsIn' ) ? [ ]
            for own source, moreData of ins
                continue unless ( S = Structure.instanceWithID source )?
                sourceOuts = arrayToObject \
                    ( S.getAttribute 'connectionsOut' ) ? [ ]
                sourceOuts[@id()] ?= { }
                for own type, count of moreData
                    moreData[type] = sourceOuts[@id()][type] =
                        Math.max count, sourceOuts[@id()][type] ? 0
                S.setAttribute 'connectionsOut', objectToArray sourceOuts

### Making consistent connections

Another way to ensure that connections among structures in a hierarchy are
consistent is to avoid directly editing the attribute containing the
connections data, and instead use the following two convenience functions
for creating or deleting connections.

Note that the LDE should not be directly editing attributes anyway, because
they are defined to be read-only from this side.  But these two functions
are useful when constructing structures to use in testing, and in particular
for implementing the `attr` and `setup` functions above, which are very
useful in the unit testing suite.

The first one creates a new connection of the given type from this structure
to another.  Because there may be multiple connections of a given type
between the same two structures, calling this repeatedly adds new
connections.

These functions do nothing if either of the two structures is lacking an ID.
They return true on success and false on failure.

        connectTo : ( otherStructure, connectionType = '' ) ->
            return no unless @id()? and \
                otherStructure instanceof Structure and otherStructure.id()?
            outs = ( @getAttribute 'connectionsOut' ) ? [ ]
            ins = ( otherStructure.getAttribute 'connectionsIn' ) ? [ ]
            outs.push [ otherStructure.id(), connectionType ]
            ins.push [ @id(), connectionType ]
            @setAttribute 'connectionsOut', outs
            otherStructure.setAttribute 'connectionsIn', ins
            yes

The delete function does nothing if there is no connection to delete.

        disconnectFrom : ( otherStructure, connectionType = '' ) ->
            return no unless @id()? and \
                otherStructure instanceof Structure and otherStructure.id()?
            outs = ( @getAttribute 'connectionsOut' ) ? [ ]
            ins = ( otherStructure.getAttribute 'connectionsIn' ) ? [ ]
            outIndex = inIndex = 0
            while outIndex < outs.length and \
                  ( outs[outIndex][0] isnt otherStructure.id() or \
                    outs[outIndex][1] isnt connectionType )
                outIndex++
            if outIndex is outs.length then return no
            while inIndex < ins.length and \
                  ( ins[inIndex][0] isnt @id() or \
                    ins[inIndex][1] isnt connectionType )
                inIndex++
            if inIndex is ins.length then return no
            outs.splice outIndex, 1
            ins.splice inIndex, 1
            @setAttribute 'connectionsOut', outs
            otherStructure.setAttribute 'connectionsIn', ins
            yes

## Accessibility

A structure A is accessible to a structure B if they have a common ancestor
and are positioned within that ancestor in such a way that B could cite A as
a premise.

The officially definition is that a structure is accessible to all of its
previous siblings, all the previous siblings of its parent, all the previous
siblings of its grandparent, and so on up the ancestor chain.  Note that a
structure is not accessible to itself, nor to any of its ancestors.
Conversely, if A is accessible to B, then we say that B is in the scope of
A.

### Foundational accessibility functions

We begin with two functions, implementing the accessibility/scope relations.

        isAccessibleTo : ( other ) ->
            if other not instanceof Structure then return no
            if not other.parent()? then return no
            if @parent() is other.parent()
                @indexInParent() < other.indexInParent()
            else
                @isAccessibleTo other.parent()
        isInTheScopeOf : ( other ) -> other.isAccessibleTo this

For all the other computations we will want to do with scopes and
accessibility, we will need iterators over all structures accessible to (or
in the scope of, respectively) this one.  An iterator for a set S is an
object `I` such that repeated calls to `I.next()` yield new elements of S
until S is exhausted, at which point all future calls to `I.next()` return
null.

The first iterator function lists all structures accessible to this one, in
reverse order in the hierarchy.  That is, all previous siblings are yielded
from right to left, then all previous siblings of the parent, and so on.

        iteratorOverAccessibles : ->
            ancestor : this
            sibling : this
            next : ->
                if not @ancestor? then return null
                if ( @sibling = @sibling.previousSibling() )?
                    return @sibling
                @sibling = @ancestor = @ancestor.parent()
                @next()

The second iterator function lists all structures in the scope of this one,
in forward order in the hierarchy.  That is, all descendants of the next
sibling are yielded, then all descendants of the subsequent sibling, and so
on, in the order of a postorder tree traversal.

        iteratorOverScope : ->
            chain : [ this ]
            next : ->
                if @chain.length is 0 then return null
                last = @chain.pop()
                if ( walk = last.nextSibling() )?
                    @chain.push walk
                    @chain.push walk while ( walk = walk.children()[0] )?
                    @chain[@chain.length-1]
                else if @chain.length > 0
                    @chain[@chain.length-1]
                else
                    null

### Accessibility convenience functions

We then create two functions that can use these iterators for searching or
enumeration.  Call `first(iterator,predicate)` to get the first element the
iterator yields satisfying the predicate.  Call `all(iterator,prediacte)`
with the obvious related meaning.  In each case, the predicate can be
omitted to get the first element or all elements (no restrictions).  If the
predicate is never satisfied, `first` returns undefiend, and `all` returns
an empty array.

        first = ( iterator, predicate = -> yes ) ->
            while ( next = iterator.next() )?
                if predicate next then return next
        all = ( iterator, predicate = -> yes ) ->
            result = [ ]
            while ( next = iterator.next() )?
                if predicate next then result.push next
            result

We can then write useful functions whose names give their obvious meanings,
by combining the tools above.

        firstAccessible : ( predicate = -> yes ) ->
            first @iteratorOverAccessibles(), predicate
        allAccessibles : ( predicate = -> yes ) ->
            all @iteratorOverAccessibles(), predicate
        firstInScope : ( predicate = -> yes ) ->
            first @iteratorOverScope(), predicate
        allInScope : ( predicate = -> yes ) ->
            all @iteratorOverScope(), predicate

## Feedback

We create a stub function here for passing feedback to the LDE client.  In
this module, it does nothing but report to the console that it is not yet
implemented.  When the LDE module imports this one, it will overwrite this
with a real implementation that connects into the LDE's feedback mechanisms.

The intent is to pass a single feedback JSON structure that would be passed
to the client.

        @feedback : ( feedbackData ) ->
            console.log 'Structure class feedback not implemented:',
                feedbackData

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.Structure = Structure
