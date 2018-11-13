
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

The serialization tool lets us write a simple structural equality comparison
function for two `Structure` hierarchies.  This is not an efficient
comparison function, but it can be used in unit testing.

        equals : ( other ) ->
            JSON.stringify( @toJSON() ) is JSON.stringify other.toJSON()

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

Because connections depend on IDs, we will also disconnect in `untrackIDs()`
any connections involving this structure.  Similarly, in `trackIDs()`, we
must notice any connections that exist in the structure and store them in
the appropriate global data structures; connection IDs are a close kin to
`Structure` IDs.

        id : -> @getAttribute 'id'
        trackIDs : ( recursive = yes ) ->
            @noticeAllConnections()
            if @id()? then Structure::IDs[@id()] = @
            if recursive then child.trackIDs() for child in @children()
        untrackIDs : ( recursive = yes ) ->
            @removeAllConnections()
            if @id()? then delete Structure::IDs[@id()]
            if recursive then child.untrackIDs() for child in @children()

We can also ask whether this `Structure` has its ID tracked.  We do not
merely mean that there is an ID tracked that matches this `Structure`'s ID,
but also that this `Structure` is the one recorded for that ID.  Thus in
case there are multiple structures with the same ID (which is not the
intent, but clients may make a mistake) we can detect which one has been
officially recorded for the given ID.

        idIsTracked : ->
            @id()? and ( @ is Structure.instanceWithID @id() )

The following function removes all ID attributes from a structure hierarchy.
This is useful, for example, after making a deep copy of a structure, so
that the copied version does not violate the global uniqueness of IDs.

Because connections depend on IDs, we will also disconnect here any
connections involving this structure.

        clearIDs : ( recursive = yes ) ->
            @removeAllConnections()
            @clearAttributes 'id'
            if recursive then child.clearIDs() for child in @children()

## Connections

Structures may have connections among them, specified using attributes.  The
documentation
[here](https://lurchmath.github.io/lde/site/phase0-structures/#connections)
covers the concept in detail.  We begin by providing a similar global store
for unique IDs of connections, like we do for instances.

The following class member will map unique connection IDs to the source
Structure for the connection.  Thus we provide the accompanying function for
querying that mapping.

        connectionIDs : { }
        @sourceOfConnection : ( id ) -> Structure::connectionIDs[id]

We then define, in some class methods, the protocol for creating and
breaking connections.  We will then provide some instance methods for
accessing these class methods more conveniently.

### Making consistent connections

Forming a connection takes as input a source structure, a target structure,
and a JSON data object describing the connection.  It may have any data it
likes in it, but the one requirement is that its `id` field is unique (that
is, not yet mentioned in the `connectionIDs` member defined above).  This
method also requires the source and target to both have IDs.

It writes data into the source, the target, and the `connectionIDs` object,
recording the connection.  It returns true if it was able to create the
connection, and false otherwise.  If it returns true, then just before
returning, it calls teh `connectionInserted` handlers in both the source and
the target (iff they are present), passing the new connection's ID in each
case.

We also call an additional handler, `addConnectionOrigin()`, in the target,
because during interpretation, connections formed in the Output Tree will
want to use that handler to mark which `InputStructure` gave rise to them.
Whether we call it in the source or the target is irrelevant, since it
should be tracked only if both are `OutputStructure`s created during
interpretation.

        @connect : ( source, target, data ) ->
            return no unless \
                ( data instanceof Object ) and \
                ( data.hasOwnProperty 'id' ) and \
                ( not Structure::connectionIDs.hasOwnProperty data.id ) and\
                ( source instanceof Structure ) and \
                ( target instanceof Structure ) and \
                source.idIsTracked() and target.idIsTracked()
            source.connectionWillBeInserted? source, target, data
            target.connectionWillBeInserted? source, target, data
            source.addConnectionOrigin? source, target, data
            source.setAttribute "_conn #{data.id} data", data
            source.setAttribute "_conn #{data.id} to", target.id()
            target.setAttribute "_conn #{data.id} from", source.id()
            Structure::connectionIDs[data.id] = source
            source.connectionWasInserted? source, target, data
            target.connectionWasInserted? source, target, data
            yes

The convenience function for accessing this from instances should be called
from the source of the connection.

        connectTo : ( target, data ) -> Structure.connect @, target, data

The following query functions simply make use of the data storage protocol
established by the above function.  For each one, we provide a class method
(to be consistent with connection creation, and so that connections can be
queried even without a particular instance being known) and an instance
method as well, which just redirects the call to the class method, as a
convenience.

First, functions that find the source, target, or data of a connection,
given its unique ID.  The first one is not strictly necessary, but we
provide it for the sake of symmetry.

        @getConnectionSource : ( connectionID ) ->
            Structure.sourceOfConnection connectionID
        @getConnectionTarget : ( connectionID ) ->
            return undefined unless \
                ( source = Structure.sourceOfConnection connectionID ) and \
                targetID = source.getAttribute "_conn #{connectionID} to"
            Structure.instanceWithID targetID
        @getConnectionData : ( connectionID ) ->
            return undefined unless \
                source = Structure.sourceOfConnection connectionID
            source.getAttribute "_conn #{connectionID} data"
        getConnectionSource : ( connectionID ) ->
            Structure.getConnectionSource connectionID
        getConnectionTarget : ( connectionID ) ->
            Structure.getConnectionTarget connectionID
        getConnectionData : ( connectionID ) ->
            Structure.getConnectionData connectionID

Second, functions that can find the list of IDs associated with a given
Structure instance, either as outgoing connections, incoming connections, or
both.

        getConnectionsIn : ->
            result = [ ]
            for own key of @attributes
                if key[...6] is '_conn ' and key[-5...] is ' from'
                    result.push key[6...-5]
            result.sort()
            result
        getConnectionsOut : ->
            result = [ ]
            for own key of @attributes
                if key[...6] is '_conn ' and key[-3...] is ' to'
                    result.push key[6...-3]
            result.sort()
            result
        getAllConnections : ->
            result = @getConnectionsIn()
            for out in @getConnectionsOut()
                if out not in result then result.push out
            result.sort()
            result

Breaking a connection takes as input the unique ID for the connection, and
it can then look up all the other relevant data in the `connectionIDs` class
variable.  If the ID is not in that object, this function does nothing.

It will alter both the source and the target, as well as the `connectionIDs`
structure.  It will call the `connectionRemoved` event handler in both the
source and the target if it succeeds.  It returns true on success and false
on failure.

        @disconnect : ( connectionID ) ->
            return no unless \
                ( source = Structure::connectionIDs[connectionID] ) and \
                ( targetID = source.getAttribute \
                    "_conn #{connectionID} to" ) and \
                ( target = Structure.instanceWithID targetID ) and \
                ( data = source.getAttribute "_conn #{connectionID} data" )
            source.connectionWillBeRemoved? connectionID
            target.connectionWillBeRemoved? connectionID
            source.clearAttributes "_conn #{connectionID} data",
                "_conn #{connectionID} to"
            target.clearAttributes "_conn #{connectionID} from"
            delete Structure::connectionIDs[connectionID]
            source.connectionWasRemoved? connectionID
            target.connectionWasRemoved? connectionID
            yes

The convenience function for accessing this from instances can be called
from any instance, because it needs the connection's ID.

        disconnect : ( connectionID ) -> Structure.disconnect connectionID

We also permit clients to update the data for a connection that has already
been made, using the following function.  They must provide the ID for the
connection and a key-valuep pair to update in the existing connection data.
If `value` is undefined, then any key-value pair associated with the given
key will be removed from the connection data.

        @setConnectionData : ( connectionID, key, value ) ->
            return no unless \
                ( key isnt 'id' ) and \
                ( source = Structure::connectionIDs[connectionID] ) and \
                ( targetID = source.getAttribute \
                    "_conn #{connectionID} to" ) and \
                ( target = Structure.instanceWithID targetID ) and \
                ( data = source.getAttribute "_conn #{connectionID} data" )
            source.connectionWillBeChanged? connectionID
            target.connectionWillBeChanged? connectionID
            if typeof value is 'undefined'
                delete data[key]
            else
                data[key] = value
            source.connectionWasChanged? connectionID
            target.connectionWasChanged? connectionID
            yes

The convenience function for accessing this from instances can be called
from any instance, because it needs the connection's ID.

        setConnectionData : ( connectionID, key, value ) ->
            Structure.setConnectionData connectionID, key, value

We also define the following function for removing all connections into or
out of this structure, which is used by `untrackIDs()` and `clearIDs()`,
defined earlier.

        removeAllConnections : ->
            Structure.disconnect id for id in @getAllConnections()
            child.removeAllConnections() for child in @children()

A sort of inverse of the previous function is to find all connections that
exist in the attributes of a `Structure` hierarchy and import them into the
class-level data structures that should store them.  This is useful if a
tree has been removed and then moved to a new location.  When it was
removed, its connections were removed from `connectionIDs`; when it is
re-inserted, they need to be re-added.

This presumes that the source node already has the `"_conn #{id} to"` and
`"_conn #{id} data"` attributes and the target already has the
`"_conn #{id} from"` attribute, and that both ends of each connection are
registered in `Structure::IDs`.

If this succeeds (because all the IDs that would need to be added to
`connectionIDs` were not there, and thus could be added fresh) it returns
true.  If any of the additions failed because the ID in question was already
in `connectionIDs`, it returns false (and does not overwrite).  Even if it
returns false, it still adds all those that it can.

        noticeAllConnections : ->
            success = yes
            for id in @getConnectionsOut()
                if Structure::connectionIDs.hasOwnProperty id
                    success = no
                else
                    Structure::connectionIDs[id] = @
            # connections in will be handled at the source node
            for child in @children
                if not child.noticeAllConnections()
                    success = no
            success

When replacing one node in a `Structure` hierarchy with another, sometimes
it is convenient to transfer all connections into or out of the original
over to the replacement.  We therefore provide the following function that
does this work for you, to make it easier.  If the given `Structure` does
not have an ID, this does nothing.  It returns false on failure, true on
success.

        transferConnectionsTo : ( recipient ) ->
            return no unless recipient.id()?
            for id in @getAllConnections()
                if ( targetID = @getAttribute( "_conn #{id} to" ) ) and \
                   target = Structure.instanceWithID targetID
                    @clearAttributes "_conn #{id} to"
                    recipient.setAttribute "_conn #{id} to", targetID
                    target.setAttribute "_conn #{id} from", recipient.id()
                    data = @getAttribute "_conn #{id} data"
                    @clearAttributes "_conn #{id} data"
                    recipient.setAttribute "_conn #{id} data", data
                if ( sourceID = @getAttribute( "_conn #{id} from" ) ) and \
                   source = Structure.instanceWithID sourceID
                    @clearAttributes "_conn #{id} from"
                    recipient.setAttribute "_conn #{id} from", sourceID
                    source.setAttribute "_conn #{id} to", recipient.id()
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
