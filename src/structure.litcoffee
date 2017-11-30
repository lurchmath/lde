
# LDE Structures

The very generic word "structure" is used in the LDE to describe a subtree
of the LDE Document.  For more details on this, see
[the design overview docs](https://lurchmath.github.io/lde/site/overview/).

    exports.Structure = class Structure

## Unique IDs for instances

We want to be able to give instance of this class unique IDs.  To do so, we
will track those IDs in a class variable defined here, and provide class
methods for assigning and revoking IDs to instances.  IDs will be
nonnegative integers, and we will track them using an array.

        IDs : [ ]
        @instanceWithID : ( id ) -> Structure::IDs[id]
        @nextUnusedID : ->
            result = Structure::IDs.indexOf null
            if result >= 0 then result else Structure::IDs.length

The following two functions, which can be called in an instance to request a
new, unique ID, or to relinquish one back into the pool, are optional for
any given instance.  That is, it is not required that each instance have an
ID.  But this system ensures that if IDs are assigned in this way, then they
will be globally unique for all instances.

Ensure that any instance that calls `getID` at some point later calls
`releaseID`, or the `IDs` array will become enormous, a memory leak.

        getID : =>
            return if @ID?
            @ID = Structure.nextUnusedID()
            Structure::IDs[@ID] = this
        releaseID : =>
            if @ID?
                Structure::IDs[@ID] = null
                delete @ID
                while Structure::IDs[Structure::IDs.length-1] is null
                    Structure::IDs.pop()

## Constructor

The constructor body just initializes internal fields, but it accepts an
array of initial children as its argument.  Any non-Structure passed as an
argument is ignored.  See the next section for more details of child
structures.

        constructor : ( children... ) ->
            @computedAttributes = { }
            @externalAttributes = { }
            @parentNode = null
            @childList = ( c for c in children when c instanceof Structure )
            for child in @childList
                child.removeFromParent()
                child.parentNode = this
                child.wasInserted?()

## Tree structure

Structures form a hierarchy, an n-ary tree.  We thus need functions for
inserting, removing, and querying parents and children.

First, the getters.  When querying the children, we make a copy of the list
so that clients can feel free to manipulate it without messing up the
integrity of the hierarchy.

        parent : => @parentNode
        children : => @childList[..]
        indexInParent : => @parentNode?.childList?.indexOf this

Next, the setters.  There is no setter for the parent, because the parent
pointer of a structure S must be kept consistent with the children list of
the parent of S, and so we update both in the setters for children.

We permit removing children from parents, either with a method in the child
or in the parent.

        removeFromParent : =>
            if ( originalParent = @parentNode )?
                originalIndex = @indexInParent()
                @parentNode.childList.splice originalIndex, 1
                @parentNode = null
                @wasRemoved? originalParent, originalIndex
        removeChild : ( atIndex ) => @childList[atIndex]?.removeFromParent()

We permit inserting a new child into the parent's child array at any valid
index (including the old length of the child array, which appends).  The
child to be inserted is first removed from any parent it has when this
method is called.  The default index is 0, so that a call of
`insertChild(x)` inserts it as the first child.

        insertChild : ( child, beforeIndex = 0 ) ->
            return unless child instanceof Structure and \
                0 <= beforeIndex <= @childList.length
            child.removeFromParent()
            @childList = [
                @childList[...beforeIndex]...
                child
                @childList[beforeIndex...]...
            ]
            child.parentNode = this
            child.wasInserted?()

A convenient combination of the above methods is to replace a child with a
new structure, deparenting the old child and putting the replacement at the
same index in the same parent.

        replaceWith : ( other ) =>
            if ( originalParent = @parentNode )?
                originalIndex = @indexInParent()
                @removeFromParent()
                originalParent.insertChild other, originalIndex

## Computed attributes

The dictionary of computed attributes has getters and setters that work on
keys or key-value pairs (respectively).  The intent is for them to store the
results of computations done by the LDE.  There is also a corresponding
"clear" function for deleting entries from the computed attributes
dictionary.

The client is permitted to use any keys they like here, but the `feedback`
key is special; see [the documentation
here](https://lurchmath.github.io/lde/site/phase0-structures/#methods-in-the-structure-class)
for details.

        getComputedAttribute : ( key ) => @computedAttributes[key]
        setComputedAttribute : ( key, value ) =>
            if @computedAttributes[key] isnt value
                @computedAttributes[key] = value
                @wasChanged?()
        clearComputedAttributes : ( keys... ) =>
            if keys.length is 0 then keys = Object.keys @computedAttributes
            for key in keys
                if key of @computedAttributes
                    delete @computedAttributes[key]
                    @wasChanged?()

The default implementation of the `compute` member takes any number of keys
as string arguments, and runs them as member functions, storing the results
as computed attributes.  Arrays can be used to pass additional arguments.
Specifically:

 * `S.compute('foo')` means `S.setComputedAttribute('foo',S.foo())`.
 * `S.compute(['foo',1,2,3])` means
   `S.setComputedAttribute('foo',S.foo(1,2,3))`.
 * `S.compute(arg1,arg2,...)` means `S.compute(arg1)` and then
   `S.compute(arg2)` and so on.

More details re in [the documentation
here](https://lurchmath.github.io/lde/site/phase0-structures/#methods-in-the-structure-class).

        compute : ( args... ) =>
            for arg in args
                if arg not instanceof Array then arg = [ arg ]
                [ func, params... ] = arg
                @setComputedAttribute func, @[func] params...

## External attributes

The dictionary of external attributes has get/set/clear functions just as we
have for computed attributes.  The intent is for them to store data provided
by the client, and the LDE will not alter it.

        getExternalAttribute : ( key ) => @externalAttributes[key]
        setExternalAttribute : ( key, value ) =>
            if @externalAttributes[key] isnt value
                @externalAttributes[key] = value
                @wasChanged?()
        clearExternalAttributes : ( keys... ) =>
            if keys.length is 0 then keys = Object.keys @externalAttributes
            for key in keys
                if key of @externalAttributes
                    delete @externalAttributes[key]
                    @wasChanged?()

## Connections

Structures may have connections among them, specified using external
attributes.  The documentation
[here](https://lurchmath.github.io/lde/site/phase0-structures/#connections)
covers the concept in detail.  We provide the following functions to make it
easier for clients to create, remove, or query connections.

The first function ensures that all connections in a hierarchy are properly
recorded twice, once as outgoing from the source, and once as incoming to
the target.  This consistency is assumed by the query functions.  Run this
on the root of your hierarchy if you have any reason to believe that the
connections may not be stored consistently.

Because connections depend on IDs, this routine does nothing if this
Structure does not already have an ID.

        fillOutConnections : =>

Recur on children, but if this object has no ID, we can't go beyond that.

            child.fillOutConnections() for child in @childList
            if not @ID? then return

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
                            result.push [ Number( target ), type ]
                result

Now find all my outgoing connections, and ensure they exist in at least the
same quantity on both sides.

            outs = arrayToObject \
                ( @getExternalAttribute 'connectionsOut' ) ? [ ]
            for own target, moreData of outs
                continue unless ( T = Structure.instanceWithID target )?
                targetIns = arrayToObject \
                    ( T.getExternalAttribute 'connectionsIn' ) ? [ ]
                targetIns[@ID] ?= { }
                for own type, count of moreData
                    moreData[type] = targetIns[@ID][type] =
                        Math.max count, targetIns[@ID][type] ? 0
                T.setExternalAttribute 'connectionsIn',
                    objectToArray targetIns

Repeat the same exrecise for my incoming connections.

            ins = arrayToObject \
                ( @getExternalAttribute 'connectionsIn' ) ? [ ]
            for own source, moreData of ins
                continue unless ( S = Structure.instanceWithID source )?
                sourceOuts = arrayToObject \
                    ( S.getExternalAttribute 'connectionsOut' ) ? [ ]
                sourceOuts[@ID] ?= { }
                for own type, count of moreData
                    moreData[type] = sourceOuts[@ID][type] =
                        Math.max count, sourceOuts[@ID][type] ? 0
                S.setExternalAttribute 'connectionsOut',
                    objectToArray sourceOuts
