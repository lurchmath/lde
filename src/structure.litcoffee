
# LDE Structures

The very generic word "structure" is used in the LDE to describe a subtree
of the LDE Document.  For more details on this, see
[the design overview docs](https://lurchmath.github.io/lde/site/overview/).

    exports.Structure = class Structure

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
method is called.

        insertChild : ( child, beforeIndex ) ->
            return unless child instanceof Structure and \
                0 <= beforeIndex <= @childList.length
            child.removeFromParent()
            @childList = [
                @childList[...beforeIndex]...
                child
                @childList[beforeIndex...]...
            ]
            child.parentNode = this
            @wasInserted?()

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
