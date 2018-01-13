
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
            @computedAttributes = { }
            @externalAttributes = { }
            @parentNode = null
            @childList = [ ]
            for child in children
                @insertChild child, @childList.length

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
                externals = @externalAttributes
            else
                externals = JSON.parse JSON.stringify @externalAttributes
                delete externals.id
            className : @className
            computedAttributes : @computedAttributes
            externalAttributes : externals
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
            result.computedAttributes =
                JSON.parse JSON.stringify json.computedAttributes
            result.externalAttributes =
                JSON.parse JSON.stringify json.externalAttributes
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

Next, the setters.  There is no setter for the parent, because the parent
pointer of a structure S must be kept consistent with the children list of
the parent of S, and so we update both in the setters for children.

We permit removing children from parents, either with a method in the child
or in the parent.

        removeFromParent : ->
            if ( originalParent = @parentNode )?
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

        insertChild : ( child, beforeIndex = 0 ) ->
            return unless child instanceof Structure and \
                child isnt this and \
                0 <= beforeIndex <= @childList.length
            walk = this
            while ( walk = walk.parent() )?
                if walk is child
                    @removeFromParent()
                    break
            child.removeFromParent()
            @childList.splice beforeIndex, 0, child
            child.parentNode = this
            child.wasInserted?()

A convenient combination of the above methods is to replace a child with a
new structure, deparenting the old child and putting the replacement at the
same index in the same parent.

        replaceWith : ( other ) ->
            if ( originalParent = @parentNode )?
                originalIndex = @indexInParent()
                @removeFromParent()
                originalParent.insertChild other, originalIndex

Another possibly convenient utility is to make a copy of the Structure S
(or equivalently the subtree with root S).

        copy : ->
            S = new Structure
            S.computedAttributes =
                JSON.parse JSON.stringify @computedAttributes
            S.externalAttributes =
                JSON.parse JSON.stringify @externalAttributes
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

No checks are put on what kind of data can be used for the values of this
dictionary, but they should be JSON data only, to support serialization.
(Checks are omitted for efficiency.)

        getComputedAttribute : ( key ) -> @computedAttributes[key]
        setComputedAttribute : ( key, value ) ->
            if @computedAttributes[key] isnt value
                @computedAttributes[key] = value
                @wasChanged?()
        clearComputedAttributes : ( keys... ) ->
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

        compute : ( args... ) ->
            for arg in args
                if arg not instanceof Array then arg = [ arg ]
                [ func, params... ] = arg
                @setComputedAttribute func, @[func] params...

## External attributes

The dictionary of external attributes has get/set/clear functions just as we
have for computed attributes.  The intent is for them to store data provided
by the client, and the LDE will not alter it.

As with computed attributes, values should be JSON data only, to support
serialization, but we do not check for this property, for efficiency.

        getExternalAttribute : ( key ) -> @externalAttributes[key]
        setExternalAttribute : ( key, value ) ->
            if @externalAttributes[key] isnt value
                @externalAttributes[key] = value
                @wasChanged?()
        clearExternalAttributes : ( keys... ) ->
            if keys.length is 0 then keys = Object.keys @externalAttributes
            for key in keys
                if key of @externalAttributes
                    delete @externalAttributes[key]
                    @wasChanged?()

External attributes can also be added with an `attr()` function that returns
the instance, thus supporting method chaining.  This is useful when
constructing objects of this class, especially for unit testing, using
code like `Structure( Structure().attr(...), ... )`.  It takes an object and
installs all of its key-value pairs as external attributes.

        attr : ( object ) ->
            @setExternalAttribute key, value for own key, value of object
            this

On the topic of conveniences for constructing instances, the following
method can be used at the top level of a nested set of constructor calls,
to traverse the final tree after constructing it, and performs the
convenience cleanup routines described within the function itself.

This is intended to be used when constructing large structures, as in
`result = Structure( ...lots of children... ).setup()`.

        setup : ->

Every structure with an external attribute key "label for", "reason for", or
"premise for" and value X will be converted into a connection to node X of
type "label", "reason", or "premise", respectively.  Node X will be found by
seeking a node with attribute key "id" and value X.

All attributes with key id are then deleted.

Alternately the same keys could be associated with value "previous" or
"next" to indicate connection to a sibling, with no id required.

            targets = { }
            recurFindTargets = ( node ) ->
                if ( id = node.getExternalAttribute 'id' )?
                    targets[id] = node
                recurFindTargets child for child in node.children()
            recurFindTargets this
            recurConnect = ( node ) ->
                for attr in [ 'label', 'premise', 'reason' ]
                    if ( value = node.getExternalAttribute "#{attr} for" )?
                        if value is 'previous'
                            target = node.previousSibling()
                        else if value is 'next'
                            target = node.nextSibling()
                        else if targets.hasOwnProperty value
                            target = targets[value]
                        else
                            target = null
                        if target? then node.connectTo target, attr
                        node.clearExternalAttributes "#{attr} for"
                recurConnect child for child in node.children()
            recurConnect this

We then check all connections within this structure for consistency, and
return the structure for use in chaining.

            @fillOutConnections()
            this

## Unique IDs for instances

Clients of this class may give instances of it unique IDs stored in external
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
            @clearExternalAttributes 'id'
            if recursive then child.clearIDs() for child in @children()

## Connections

Structures may have connections among them, specified using external
attributes.  The documentation
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

            outs = arrayToObject \
                ( @getExternalAttribute 'connectionsOut' ) ? [ ]
            for own target, moreData of outs
                continue unless ( T = Structure.instanceWithID target )?
                targetIns = arrayToObject \
                    ( T.getExternalAttribute 'connectionsIn' ) ? [ ]
                targetIns[@id()] ?= { }
                for own type, count of moreData
                    moreData[type] = targetIns[@id()][type] =
                        Math.max count, targetIns[@id()][type] ? 0
                T.setExternalAttribute 'connectionsIn',
                    objectToArray targetIns

Repeat the same exrecise for my incoming connections.

            ins = arrayToObject \
                ( @getExternalAttribute 'connectionsIn' ) ? [ ]
            for own source, moreData of ins
                continue unless ( S = Structure.instanceWithID source )?
                sourceOuts = arrayToObject \
                    ( S.getExternalAttribute 'connectionsOut' ) ? [ ]
                sourceOuts[@id()] ?= { }
                for own type, count of moreData
                    moreData[type] = sourceOuts[@id()][type] =
                        Math.max count, sourceOuts[@id()][type] ? 0
                S.setExternalAttribute 'connectionsOut',
                    objectToArray sourceOuts

### Making consistent connections

Another way to ensure that connections among structures in a hierarchy are
consistent is to avoid directly editing the external attribute containing
the connections data, and instead use the following two convenience
functions for creating or deleting connections.

Note that the LDE should not be directly editing external attributes anyway,
because they are defined to be read-only from this side.  But these two
functions are useful when constructing structures to use in testing, and in
particular for implementing the `attr` and `setup` functions above, which
are very useful in the unit testing suite.

The first one creates a new connection of the given type from this structure
to another.  Because there may be multiple connections of a given type
between the same two structures, calling this repeatedly adds new
connections.

These functions do nothing if either of the two structures is lacking an ID.
They return true on success and false on failure.

        connectTo : ( otherStructure, connectionType = '' ) ->
            return no unless @id()? and \
                otherStructure instanceof Structure and otherStructure.id()?
            outs = ( @getExternalAttribute 'connectionsOut' ) ? [ ]
            ins = ( otherStructure.getExternalAttribute 'connectionsIn' ) \
                ? [ ]
            outs.push [ otherStructure.id(), connectionType ]
            ins.push [ @id(), connectionType ]
            @setExternalAttribute 'connectionsOut', outs
            otherStructure.setExternalAttribute 'connectionsIn', ins
            yes

The delete function does nothing if there is no connection to delete.

        disconnectFrom : ( otherStructure, connectionType = '' ) ->
            return no unless @id()? and \
                otherStructure instanceof Structure and otherStructure.id()?
            outs = ( @getExternalAttribute 'connectionsOut' ) ? [ ]
            ins = ( otherStructure.getExternalAttribute 'connectionsIn' ) \
                ? [ ]
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
            @setExternalAttribute 'connectionsOut', outs
            otherStructure.setExternalAttribute 'connectionsIn', ins
            yes

### Querying connections

The following functions are some conveniences for querying what connections
exist from a given structure object to/from others.

First, we can fetch all connections of a given type that exit a given
structure object.  It returns a multiset of target structure IDs, in the
form of an array with possible repeated entries.  If the user omits the
type, then all outgoing connections are returned, not as targets only, but
as target-type pairs, `[[targetID,typeString],...]`.

        allConnectionsOut : ( ofThisType ) ->
            outs = ( @getExternalAttribute 'connectionsOut' ) ? [ ]
            if not ofThisType? then return outs
            ( conn[0] for conn in outs when conn[1] is ofThisType )

Then we can do the same thing for incoming connections.

        allConnectionsIn : ( ofThisType ) ->
            ins = ( @getExternalAttribute 'connectionsIn' ) ? [ ]
            if not ofThisType? then return ins
            ( conn[0] for conn in ins when conn[1] is ofThisType )

We can also request all connections between two given structures, which will
return a multiset of connection types, in the form of an array with possible
repeated entries.  Returns null if the argument is not a structure, or is
one without an ID.

        allConnectionsTo : ( otherStructure ) ->
            return null unless otherStructure instanceof Structure and \
                otherStructure.id()?
            outs = ( @getExternalAttribute 'connectionsOut' ) ? [ ]
            ( conn[1] for conn in outs when conn[0] is otherStructure.id() )

The final query treats all incoming connections to a structure as if they
give it "properties."  If A connects to B with type T, then when we look up
the key T in B's properties, we get an array that will contain A.  For
more information, see the documentation
[here](https://lurchmath.github.io/lde/site/phase0-structures/#connections).

        properties : ->
            result = { }
            for conn in ( @getExternalAttribute 'connectionsIn' ) ? [ ]
                if ( source = Structure.instanceWithID conn[0] )?
                    ( result[conn[1]] ?= [ ] ).push source
            result

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

## Attribute Conventions

We have already established one significant convention in [the Connections
section, above](#connections), that is, that the "connections" external
attribute stores a very specific type of data with a very specific meaning.
We established that convention partially through documentation and partially
through implementing convenience functions that assume and use the
convention.

In this section, we establish several other conventions, many of which build
upon the connections convention, and that deal with both external and
computed attributes.  These conventions may be leveraged by any client of
this module that constructs structures and expects the LDE to do
computations (primarily validation) on them.

In some sense, you can see this as the most fluid of the work in this file.
All the previous sections in this class are foundational to how structures
behave, whereas this one is more arbitrary.  But at the same time, it adds
mathematical concepts to the `Structure` class for the first time.

### Special external attributes

There are just a few types of special external attributes (so far).

The external attribute with key "id" can be used to give a structure a
unique ID.  Because this is used in several ways throughout the LDE, we
provide the following convenience function for accessing it.

        id : -> @getExternalAttribute 'id'

Atomic structures are often defined by a single piece of text that is the
structure's content.  The first convention is that such text will be stored
as an external attribute with key "text," and consequently we create a
convenience function for accessing this very common piece of data.

        text : -> @getExternalAttribute 'text'

The "text" in some structures is to be interpreted as a citation of another
structure by name.  For instance, a structure containing the text "Theorem
3.5" probably refers to an earlier structure with that name.  Thus we need a
way for structures whose content is to be interpreted as a reference to an
earlier name to indicate as much by having their "reference" attribute set
to true (or any value that becomes true when treated as a boolean).

This is a particular example of a more general phenomenon.  We may also wish
to ask whether a structure is a label or reason or any other category of
structure.  Thus we create a generic routine for testing whether a structure
has an attribute that classifies it as belonging to any category.

        isA : ( category ) -> not not @getExternalAttribute category

Note that the above functions do not have corresponding setter functions
because they are external attributes, which are read-only from the point of
view of the LDE.

The final type of external attribute that requires special functions for
dealing with it is the attribute storing connections to other structures.
We handle that attribute with all the functions in [the Connections section,
above](#connections).

### Convenience functions used below

We define the following convenience functions that will be used to build the
more significant tools defined in the following section.  Note that these
are defined with the equal sign (`=`) rather than the colon (`:`) so they
are not instance members, but just temporary functions usable only within
this class.

The first looks up external and internal attributes under a given key,
verifies that both are arrays of strings, and combines them into a single
resulting array, filtering out all non-strings.

        stringArrayAttributes = ( structure, key ) ->
            external = structure.getExternalAttribute key
            computed = structure.getComputedAttribute key
            if external not instanceof Array then external = [ ]
            if computed not instanceof Array then computed = [ ]
            ( item for item in [ external..., computed... ] \
                when typeof item is 'string' )

The second takes a structure and category as arguments and returns all other
structures that are of that category (when tested via `isA`) and that have
connections to the given structure.

        allConnectedTo = ( structure, category = null ) ->
            result = [ ]
            for [ id, type ] in structure.allConnectionsIn()
                if ( other = Structure.instanceWithID id )? and \
                   ( not category or other.isA category )
                    result.push other
            result

The final function takes an array and returns the an array with all the same
entries as the first, but each entry listed exactly once (no duplicates).

        uniqueArray = ( array ) ->
            result = [ ]
            for item in array
                if item not in result then result.push item
            result

### Collecting labels, reasons, and premises

We permit a structure to be labeled in any of three ways.

 * The external attribute with key "labels" may be an array of strings, each
   of which will then be treated as a label for the structure.
 * The computed attribute with key "labels" is treated the same way.
 * Any structure may label another structure by passing the `isA 'label'`
   test and having a connection from the label to the labeled structure.

The `labels()` function gathers all labels assigned by any of these three
means into a single set, returned as an array with no repeated entries, and
no predefined order.  Any label that is not a string or is the empty string
is omitted from the results.

        labels : ->
            result = [
                ( stringArrayAttributes this, 'labels' )...
                ( label.text() for label in allConnectedTo this, 'label' \
                    when label.text() )...
            ]
            ( label for label in uniqueArray result when label isnt '' )

We then build a trivial extension of the `labels()` function, the
`hasLabel()` function, which checks to see if this structure has a
particular label.

        hasLabel : ( label ) -> label in @labels()

We permit structures to have reasons attached to them in any of four ways.

 * A structure A may be a reason for another structure B if there is a
   connection from A to B and A passes the `isA 'reason'` test.
 * A variant of the previous case is when A also passes the `isA
   'reference'` test, in which case A is not a rule justifying B, but
   rather the text of A is the name of a rule justifying B.
 * The external attribute with key "reasons" may be an array of strings,
   each of which will then be treated as the name of another structure that
   is treated as a reason for this one.
 * The computed attribute with key "reasons" is treated the same way.

The following function gathers all reasons assigned by any of these four
means into a single set, returned as an array with no predefined order.  It
may contain some strings (which are the names of reasons, and were attached
using one of the final two means) and/or some structures (which may be
reasons or the names of them, and were attached using one of the first two
means).  The caller is responsible for converting the names into structures
(when possible) using `lookup()`, defined above.  The array may contain
repeated entries, if they were attached more than once using one or more of
the four means given above.

        reasons : ->
            [
                ( stringArrayAttributes this, 'reasons' )...
                ( allConnectedTo this, 'reason' )...
            ]

We permit structures to have premises attached to them in exactly the same
four ways as they have reasons attached, except that premises do not need to
be marked with a "premise" attribute.  Also, any premise connected to the
reason for a structure is treated as if it had connected directly to the
structure itself.

        premises : ->

Direct connections first:

            result = [
                ( stringArrayAttributes this, 'premises' )...
                ( source for source in allConnectedTo this when \
                    not ( source.isA 'reason' ) and \
                    not ( source.isA 'label' ) )...
            ]

Now add indirect connections:

            for reason in @reasons()
                if reason instanceof Structure
                    for source in allConnectedTo reason
                        if not ( source.isA 'reason' ) and \
                           not ( source.isA 'label' )
                            result.push source
            result

### Citations and lookups

The lookup function starts from this structure and walks back through all
structures accessible to it, to find the first one having a given label.
This can be used when the current structure cites something by name, and we
wish to find which structure was cited by name.  We call the lookup function
to find the nearest accessible structure with that name, if there is such a
structure.  Undefined is returned if there is no such structure.

        lookup : ( label ) ->
            @firstAccessible ( other ) -> other.hasLabel label

We can then use that function to check whether one structure cites another.
We say that A cites B iff B is a reason or premise for A.  Thus we get the
results of `reasons()` and `premises()` and perform any needed lookups to
answer the question, does A cite B?  For efficiency, we do equality
comparison of structures first, then lookups second.

        cites : ( other ) ->
            citations = [ @reasons()..., @premises()... ]
            toLookUp = [ ]
            for item in citations
                if item is other then return yes
                if typeof item is 'string' then toLookUp.push item
                if item.isA? 'reference' then toLookUp.push item.text()
            for label in toLookUp
                if other is @lookup label then return yes
            no

Finally, we can write a function that computes all structures that cite this
one.  It uses the above function to make the work easy.

        whatCitesMe : -> @allInScope ( other ) => other.cites this

Now if this is being used in a Node.js context, export the class we defined.

    if exports? then exports.Structure = Structure
