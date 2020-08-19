
/**
 * Extend the EventTarget prototype with a convenience method for emitting new
 * events.  Mimics the function of the same name from node.js, but here in the
 * browser.
 * 
 * @param {string} type - The type of event being emitted, as a string name
 * @param {object} details - Any additional fields to copy into the Event object
 */
EventTarget.prototype.emit = function ( type, details = { } ) {
    this.dispatchEvent( Object.assign( new Event( type ), details ) )
}

/**
 * The Structure class, an n-ary tree of Structure instances, using functions
 * like {@link Structure#parent parent()} and {@link Structure#children children()}
 * to navigate the tree.
 */
export class Structure extends EventTarget {

    //////
    //
    //  Constructor
    //
    //////
    
    /**
     * Create a new Structure.  Any argument that is not a Structure is ignored.
     * @constructor
     * @param {...Structure} children - child structures to be added to this one
     */
    constructor ( ...children ) {
        super()
        this._parent = null
        this._children = [ ]
        for ( const child of children ) {
            this.insertChild( child, this._children.length )
        }
    }

    //////
    //
    //  Functions querying tree structure
    //
    //////
    
    /**
     * This Structure's parent Structure, that is, the one enclosing it, if any
     * @return {Structure} This structure's parent node, or null if there isn't one
     * @see {@link Structure#children children()}
     * @see {@link Structure#child child()}
     */
    parent () { return this._parent }

    /**
     * An array containing this Structure's children, in the correct order.
     * 
     * To get a specific child, it is more efficient to use the
     * {@link Structure.child()} function instead.
     * 
     * @return {Structure[]} A shallow copy of the Structure's children array
     * @see {@link Structure#parent parent()}
     * @see {@link Structure#child child()}
     * @see {@link Structure#setChildren setChildren()}
     * @see {@link Structure#allButFirstChild allButFirstChild()}
     * @see {@link Structure#allButLastChild allButLastChild()}
     * @see {@link Structure#childrenSatisfying childrenSatisfying()}
     */
    children () { return this._children.slice() }

    /**
     * Get the child of this Structure at index i.
     * 
     * If the index is invalid (that is, it is anything other than one of
     * {0,1,...,n-1\} if there are n children) then undefined will be
     * returned instead.
     * 
     * @param {number} i - The index of the child being fetched
     * @return {Structure} The child at the given index, or undefined if none
     * @see {@link Structure#parent parent()}
     * @see {@link Structure#children children()}
     * @see {@link Structure#firstChild firstChild()}
     * @see {@link Structure#lastChild lastChild()}
     */
    child ( i ) { return this._children[i] }

    /**
     * The number of children of this Structure
     * @return {number} A nonnegative integer indicating the number of children
     * @see {@link Structure#children children()}
     * @see {@link Structure#child child()}
     */
    numChildren () { return this._children.length }

    /**
     * Returns the value `i` such that `this.parent().child(i)` is this object,
     * provided that this Structure has a parent.
     * 
     * @return {number} The index of this Structure in its parent's children list
     * @see {@link Structure#parent parent()}
     * @see {@link Structure#child child()}
     */
    indexInParent () {
        if ( this._parent != null && this._parent._children ) {
            return this._parent._children.indexOf( this )
        }
    }

    /**
     * Find the previous sibling of this Structure in its parent, if any
     * @return {Structure} The previous sibling, or undefined if there is none
     * @see {@link Structure#children children()}
     * @see {@link Structure#nextSibling nextSibling()}
     */
    previousSibling () {
        let index = this.indexInParent()
        if ( index != null) {
            return this._parent._children[index-1]
        }
    }

    /**
     * Find the next sibling of this Structure in its parent, if any
     * @return {Structure} The next sibling, or undefined if there is none
     * @see {@link Structure#children children()}
     * @see {@link Structure#previousSibling previousSibling()}
     */
    nextSibling () {
        let index = this.indexInParent()
        if ( index != null ) {
            return this._parent._children[index+1]
        }
    }

    /**
     * A Structure is atomic if and only if it has no children.  Thus this is a
     * shorthand for `S.numChildren() == 0`.
     * @return {boolean} Whether the number of children is zero
     * @see {@link Structure#numChildren numChildren()}
     */
    isAtomic () { return this.numChildren() == 0 }

    /**
     * Convenience function for fetching just the first child of this Structure
     * @return {Structure} The first child of this Structure, or undefined if none
     * @see {@link Structure#lastChild lastChild()}
     * @see {@link Structure#allButFirstChild allButFirstChild()}
     */
    firstChild () { return this._children[0] }

    /**
     * Convenience function for fetching just the last child of this Structure
     * @return {Structure} The last child of this Structure, or undefined if none
     * @see {@link Structure#firstChild firstChild()}
     * @see {@link Structure#allButLastChild allButLastChild()}
     */
    lastChild () { return this._children[this._children.length-1] }

    /**
     * Convenience function for fetching the array containing all children of
     * this Structure except for the first
     * @return {Structure[]} All but the first child of this structure, or an
     *   empty array if there is one or fewer children
     * @see {@link Structure#firstChild firstChild()}
     * @see {@link Structure#allButLastChild allButLastChild()}
     */
    allButFirstChild () { return this._children.slice( 1 ) }

    /**
     * Convenience function for fetching the array containing all children of
     * this Structure except for the last
     * @return {Structure[]} All but the last child of this structure, or an
     *   empty array if there is one or fewer children
     * @see {@link Structure#lastChild lastChild()}
     * @see {@link Structure#allButFirstChild allButFirstChild()}
     */
    allButLastChild () { return this._children.slice( 0, this._children.length-1 ) }

    /**
     * My address within the given ancestor, as a sequence of indices
     * `[i1,i2,...,in]` such that `ancestor.child(i1).child(i2)....child(in)` is
     * this Structure.
     * 
     * This is a kind of inverse to {@link Structure#index index()}.
     * 
     * @param {Structure} [ancestor] - The ancestor in which to compute my
     *   address, which defaults to my highest ancestor.  If this argument is
     *   not actually an ancestor of this Structure, then we treat it as if it
     *   had been omitted.
     * @return {number[]} An array of numbers as described above, which will be
     *   empty in the degenerate case where this Structure has no parent or this
     *   structure is the given ancestor
     * @see {@link Structure#child child()}
     * @see {@link Structure#indexInParent indexInParent()}
     */
    address ( ancestor ) {
        if ( ancestor === this || !this.parent() ) return [ ]
        const lastStep = this.indexInParent()
        return this.parent().address( ancestor ).concat( [ lastStep ] )
    }

    /**
     * Performs repeated child indexing to find a specific descendant.  If the
     * address given as input is the array `[i1,i2,...,in]`, then this returns
     * `this.child(i1).child(i2)....child(in)`.
     * 
     * If the given address is the empty array, the result is this Structure.
     * 
     * This is a kind of inverse to {@link Structure#address address()}.
     * 
     * @param {number[]} address - A sequence of nonnegative indices, as
     *   described in the documentation for address()
     * @return {Structure} A descendant structure, following the definition
     *   above, or undefined if there is no such Structure
     * @see {@link Structure#child child()}
     * @see {@link Structure#address address()}
     */
    index ( address ) {
        if ( !( address instanceof Array ) ) return undefined
        if ( address.length == 0 ) return this
        const nextStep = this.child( address[0] )
        if ( !( nextStep instanceof Structure ) ) return undefined
        return nextStep.index( address.slice( 1 ) )
    }

    //////
    //
    //  Advanced queries, including predicates and iterators
    //
    //////

    /**
     * The list of children of this Structure that satisfy the given predicate,
     * in the same order that they appear as children.  Obviously, not all
     * children may be included in the result, depending on the predicate.
     * 
     * @param {function(Structure):boolean} predicate - The predicate to use for
     *   testing children
     * @return {Structure[]} The array of children satisfying the given predicate
     * @see {@link Structure#children children()}
     * @see {@link Structure#descendantsSatisfying descendantsSatisfying()}
     * @see {@link Structure#hasChildSatisfying hasChildSatisfying()}
     */
    childrenSatisfying ( predicate ) { return this._children.filter( predicate ) }

    /**
     * Whether this Structure has any children satisfying the given predicate.
     * The predicate will be evaluated on each child in order until one passes
     * or all fail; it may not be evaluated on all children, if not needed.
     * 
     * @param {function(Structure):boolean} predicate - The predicate to use for
     *   testing children
     * @return {boolean} True if and only if some child satisfies the given predicate
     * @see {@link Structure#hasDescendantSatisfying hasDescendantSatisfying()}
     * @see {@link Structure#childrenSatisfying childrenSatisfying()}
     */
    hasChildSatisfying ( predicate ) { return this._children.some( predicate ) }

    /**
     * An iterator over all descendants of this Structure, in a pre-order tree
     * traversal.
     * 
     * @yields {Structure} This structure, then its first child, and so on down
     *   that branch of the tree, and onward in a pre-order traversal
     * @see {@link Structure#descendantsSatisfying descendantsSatisfying()}
     * @see {@link Structure#hasDescendantSatisfying hasDescendantSatisfying()}
     */
    *descendantsIterator () {
        yield this
        for ( let child of this._children ) yield* child.descendantsIterator()
    }

    /**
     * An array of those descendants of this Structure that satisfy the given
     * predicate.  These are not copies, but the actual descendants; if you
     * alter one, it changes the hierarchy beneath this Structure.
     * 
     * Note that this Structure counts as a descendant of itself.  To exclude
     * this Structure from consideration, simply change your predicate, as in
     * `X.descendantsSatisfying( d => X != d && predicate(d) )`.
     * 
     * @param {function(Structure):boolean} predicate - The predicate to use for
     *   testing descendants
     * @return {Structure[]} A list of descendants of this Structure, precisely
     *   those that satisfy the given predicate, listed in the order they would
     *   be visited in a depth-first traversal of the tree
     * @see {@link Structure#hasDescendantSatisfying hasDescendantSatisfying()}
     * @see {@link Structure#ancestorsSatisfying ancestorsSatisfying()}
     * @see {@link Structure#childrenSatisfying childrenSatisfying()}
     */
    descendantsSatisfying ( predicate ) {
        let result = [ ]
        for ( let descendant of this.descendantsIterator() )
            if ( predicate( descendant ) ) result.push( descendant )
        return result
    }

    /**
     * Whether this Structure has any descendant satisfying the given predicate.
     * The predicate will be evaluated on each descendant in depth-first order
     * until one passes or all fail; it may not be evaluated on all descendaants,
     * if not needed.
     * 
     * Note that this Structure counts as a descendant of itself.  To ignore
     * this structure, simply change the predicate to do so, as in
     * `X.descendantsSatisfying( d => X != d && predicate(d) )`.
     * 
     * @param {function(Structure):boolean} predicate - The predicate to use for
     *   testing descendants
     * @return {boolean} True if and only if some descendant satisfies the given predicate
     * @see {@link Structure#hasChildSatisfying hasChildSatisfying()}
     * @see {@link Structure#descendantsSatisfying descendantsSatisfying()}
     * @see {@link Structure#hasAncestorSatisfying hasAncestorSatisfying()}
     */
    hasDescendantSatisfying ( predicate ) {
        for ( let descendant of this.descendantsIterator() )
            if ( predicate( descendant ) ) return true
        return false
    }

    /**
     * An iterator through all the ancestors of this structure, starting with
     * itself as the first (trivial) ancestor, and walking upwards from there.
     * 
     * @yields {Structure} This structure, then its parent, grandparent, etc.
     * @see {@link Structure#ancestors ancestors()}
     * @see {@link Structure#parent parent()}
     */
    *ancestorsIterator () {
        yield this
        if ( this.parent() ) yield* this.parent().ancestorsIterator()
    }

    /**
     * An array of all ancestors of this structure, starting with itself.  This
     * array is the exact contents of
     * {@link Structure#ancestorsIterator ancestorsIterator()}, but in array
     * form rather than as an iterator.
     * 
     * @return {Structure[]} An array beginning with this structure, then its
     *   parent, grandparent, etc.
     * @see {@link Structure#ancestorsIterator ancestorsIterator()}
     * @see {@link Structure#parent parent()}
     */
    ancestors () { return Array.from( this.ancestorsIterator() ) }
    
    /**
     * Find all ancestors of this Structure satisfying the given predicate.
     * Note that this Structure counts as a trivial ancestor of itself, so if
     * you don't want that, modify your predicate to exclude it.
     * 
     * @param {function(Structure):boolean} predicate - Predicate to evaluate on
     *   each ancestor
     * @return {Structure[]} The ancestors satisfying the predicate, which may
     *   be an empty array
     * @see {@link Structure#ancestorsIterator ancestorsIterator()}
     * @see {@link Structure#hasAncestorSatisfying hasAncestorSatisfying()}
     * @see {@link Structure#descendantsSatisfying descendantsSatisfying()}
     */
    ancestorsSatisfying ( predicate ) {
        const result = [ ]
        for ( let ancestor of this.ancestorsIterator() )
            if ( predicate( ancestor ) ) result.push( ancestor )
        return result
    }

    /**
     * Whether this Structure has an ancestor (including itself) satisfying the
     * given predicate.
     * 
     * @param {function(Structure):boolean} predicate - Predicate to evaluate on
     *   each ancestor
     * @return {boolean} Whether an ancestor satisfying the given predicate
     *   exists
     * @see {@link Structure#ancestorsIterator ancestorsIterator()}
     * @see {@link Structure#ancestorsSatisfying ancestorsSatisfying()}
     * @see {@link Structure#hasDescendantSatisfying hasDescendantSatisfying()}
     */
    hasAncestorSatisfying ( predicate ) {
        for ( let ancestor of this.ancestorsIterator() )
            if ( predicate( ancestor ) ) return true
        return false
    }

    //////
    //
    //  Functions altering tree structure
    //
    //////

    /**
     * Insert a child into this Structure's list of children.
     * 
     * Any children at the given index or later will be moved one index later to
     * make room for the new insertion.  The index can be anything from 0 to the
     * number of children (inclusive); this last value means insert at the end
     * of the children array.  The default insertion index is the beginning of
     * the array.
     * 
     * If the child to be inserted is an ancestor of this structure, then we
     * remove this structure from its parent, to obey the insertion command given
     * while still maintaining acyclicity in the tree structure.  If the child to
     * be inserted is this node itself, this function does nothing.
     * 
     * @param {Structure} child - the child to insert
     * @param {number} atIndex - the index at which the new child will be
     * @fires Structure#willBeInserted
     * @fires Structure#wasInserted
     * @see {@link Structure#children children()}
     * @see {@link Structure#setChildren setChildren()}
     * @see {@link Structure#child child()}
     * @see {@link Structure#pushChild pushChild()}
     * @see {@link Structure#unshiftChild unshiftChild()}
     */
    insertChild ( child, atIndex = 0 ) {
        if ( !( child instanceof Structure ) ) return
        if ( child === this ) return
        if ( atIndex < 0 || atIndex > this._children.length ) return
        let walk = this
        while ( ( walk = walk.parent() ) != null ) {
            if ( walk === child ) {
                this.remove();
                break;
            }
        }
        child.remove()
        /**
         * An event of this type is fired in a Structure immediately before that
         * Structure is inserted as a child within a new parent.
         * 
         * @event Structure#willBeInserted
         * @type {Object}
         * @property {Structure} child - The Structure emitting the event, which
         *   will soon be a child of a new parent Structure
         * @property {Structure} parent - The new parent the child will have
         *   after insertion
         * @property {number} index - The new index the child will have after
         *   insertion
         * @see {@link Structure#insertChild insertChild()}
         */
        child.emit( 'willBeInserted', {
            child : child,
            parent : this,
            index : atIndex
        } )
        this._children.splice( atIndex, 0, child )
        child._parent = this
        /**
         * An event of this type is fired in a Structure immediately after that
         * Structure is inserted as a child within a new parent.
         * 
         * @event Structure#wasInserted
         * @type {Object}
         * @property {Structure} child - The Structure emitting the event, which
         *   just became a child of a new parent Structure
         * @property {Structure} parent - The new parent the child now has
         * @property {number} index - The index the child now has in its new
         *   parent
         * @see {@link Structure#insertChild insertChild()}
         */
        child.emit( 'wasInserted', {
            child : child,
            parent : this,
            index : atIndex
        } )
    }

    /**
     * If this Structure has a parent, remove this from its parent's child list
     * and set our parent pointer to null, thus severing the relationship.  If
     * this has no parent, do nothing.
     * 
     * @fires Structure#willBeRemoved
     * @see {@link Structure#parent parent()}
     * @see {@link Structure#removeChild removeChild()}
     */
    remove () {
        if ( this._parent != null ) {
            const parent = this._parent
            const index = this.indexInParent()
            /**
             * This event is fired in a Structure immediately before that
             * Structure is removed from its parent Structure.  This could be
             * from a simple removal, or it might be the first step in a
             * re-parenting process that ends up with the Structure as the child
             * of a new parent.
             * 
             * @event Structure#willBeRemoved
             * @type {Object}
             * @property {Structure} child - The Structure emitting the event,
             *   which is about to be removed from its parent Structure
             * @property {Structure} parent - The current parent Structure
             * @property {number} index - The index the child has in its parent,
             *   before the removal
             * @see {@link Structure#remove remove()}
             */
            this.emit( 'willBeRemoved', {
                child : this,
                parent : parent,
                index : index
            } )
            this._parent._children.splice( this.indexInParent(), 1 )
            this._parent = null
            /**
             * This event is fired in a Structure immediately after that
             * Structure is removed from its parent Structure.  This could be
             * from a simple removal, or it might be the first step in a
             * re-parenting process that ends up with the Structure as the child
             * of a new parent.
             * 
             * @event Structure#wasRemoved
             * @type {Object}
             * @property {Structure} child - The Structure emitting the event,
             *   which was just removed from its parent Structure
             * @property {Structure} parent - The old parent Structure from
             *   which the child was just removed
             * @property {number} index - The index the child had in its parent,
             *   before the removal
             * @see {@link Structure#remove remove()}
             */
            this.emit( 'wasRemoved', {
                child : this,
                parent : parent,
                index : index
            } )
        }
    }

    /**
     * Calls {@link Structure#remove remove()} on the child with index `i`.
     * Does nothing if the index is invalid.
     * 
     * @param {number} i - the index of the child to remove
     * @see {@link Structure#remove remove()}
     * @see {@link Structure#child child()}
     * @see {@link Structure#popChild popChild()}
     * @see {@link Structure#shiftChild shiftChild()}
     */
    removeChild ( i ) {
        if ( i < 0 || i >= this._children.length ) return
        this._children[i].remove()
    }

    /**
     * Replace this structure, exactly where it sits in its parent Structure,
     * with the given one, thus deparenting this one.
     * 
     * For example, if `A` is a child of `B` and we call `B.replaceWith(C)`,
     * then `C` will now be a child of `A` at the same index that `B` formerly
     * occupied, and `B` will now have no parent.  If `C` had a parent before,
     * it will have been removed from it (thus decreasing that parent's number
     * of children by one).
     * 
     * @param {Structure} other - the Structure with which to replace this one
     * @see {@link Structure#remove remove()}
     * @see {@link Structure#child child()}
     * @see {@link Structure#parent parent()}
     */
    replaceWith ( other ) {
        let originalParent = this._parent;
        if ( originalParent != null ) {
            const originalIndex = this.indexInParent()
            this.remove()
            originalParent.insertChild( other, originalIndex )
        }
    }

    /**
     * Remove the last child of this Structure and return it.  If there is no
     * such child, take no action and return undefined.
     * @return {Structure} The popped last child, or undefined if none
     * @see {@link Structure#pushChild pushChild()}
     * @see {@link Structure#shiftChild shiftChild()}
     */
    popChild () {
        const child = this.lastChild()
        if ( !child ) return
        child.remove()
        return child
    }

    /**
     * Remove the first child of this Structure and return it.  If there is no
     * such child, take no action and return undefined.
     * @return {Structure} The popped first child, or undefined if none
     * @see {@link Structure#popChild popChild()}
     * @see {@link Structure#unshiftChild unshiftChild()}
     */
    shiftChild () {
        const child = this.firstChild()
        if ( !child ) return
        child.remove()
        return child
    }

    /**
     * Append a new child to the end of this Structure's list of children.  This
     * is equivalent to a call to `insertChild()` with the length of the current
     * children array as the index at which to insert.
     * 
     * @param {Structure} child - The new Structure to append
     * @see {@link Structure#popChild popChild()}
     * @see {@link Structure#unshiftChild unshiftChild()}
     */
    pushChild ( child ) { this.insertChild( child, this._children.length ) }

    /**
     * Prepend a new child to the beginning of this Structure's list of children.
     * This is equivalent to a call to `insertChild()` with the default second
     * parameter (i.e., insert at index zero), and thus this function is here
     * only for convenience, to fit with shiftChild().
     * 
     * @param {Structure} child - The new Structure to prepend
     * @see {@link Structure#shiftChild shiftChild()}
     * @see {@link Structure#pushChild pushChild()}
     */
    unshiftChild ( child ) { this.insertChild( child ) }

    /**
     * Replace the entire children array of this Structure with a new one.
     * 
     * This is equivalent to removing all the current children of this Structure
     * in order from lowest index to highest, then inserting all the children in
     * the given array, again from lowest index to highest.
     * 
     * The intent is not for any of the elements of the given array to be
     * ancestors or descendants of one another, but even if they are, the action
     * taken here still follows the explanation given in the previous paragraph.
     * 
     * @param {Structure[]} children - New list of children
     * @see {@link Structure#children children()}
     * @see {@link Structure#removeChild removeChild()}
     * @see {@link Structure#insertChild insertChild()}
     */
    setChildren ( children ) {
        while ( this._children.length > 0 ) {
            this.firstChild().remove()
        }
        for ( const child of children ) {
            this.pushChild( child )
        }
    }

    //////
    //
    //  Order relations and traversals
    //
    //////

    /**
     * Under pre-order tree traversal, which of two structures comes first?  We
     * call the first "earlier than" the other Structure, because we will use
     * Structure hierarchies to represent documents, and first in a pre-order
     * tree traversal would then mean earlier in the document.
     * 
     * Note that this is a strict ordering, so a Structure is not earlier than
     * itself.
     * 
     * @param {Structure} other - The Structure with which to compare this one.
     *   (The result is undefined if this is not a Structure.)
     * @return {boolean} Whether this structure is earlier than the other, or
     *   undefined if they are incomparable (not in the same tree)
     * @see {@link Structure#isLaterThan isLaterThan()}
     * @see {@link Structure#preOrderTraversal preOrderTraversal()}
     * @see {@link Structure#nextInTree nextInTree()}
     * @see {@link Structure#previousInTree previousInTree()}
     */
    isEarlierThan ( other ) {
        // type check
        if ( !( other instanceof Structure ) ) return undefined
        // base case
        if( other === this ) return false
        // we will need to compare ancestors
        const myAncestors = this.ancestors().reverse()
        const otherAncestors = other.ancestors().reverse()
        // if we have no common ancestor, we are incomparable
        if ( otherAncestors[0] != myAncestors[0] ) return undefined
        // we have a common top-level ancestor; find our least common ancestor
        let lowest = null
        while ( myAncestors[0] == otherAncestors[0] ) {
            myAncestors.shift()
            lowest = otherAncestors.shift()
        }
        // if either of us is an ancestor of the other, then that one is earlier
        if ( lowest === this ) return true
        if ( lowest === other ) return false
        // otherwise, compare child indices within the common ancestor
        return myAncestors[0].indexInParent()
             < otherAncestors[0].indexInParent()
    }

    /**
     * This is the opposite of {@link Structure#isEarlierThan isEarlierThan()}.
     * We have `A.isLaterThan(B)` if and only if `B.isEarlierThan(A)`.  This is
     * therefore just a convenience function.
     * 
     * @param {Structure} other - The Structure with which to compare this one.
     *   (The result is undefined if this is not a Structure.)
     * @return {boolean} Whether this structure is later than the other, or
     *   undefined if they are incomparable (not in the same tree)
     * @see {@link Structure#isEarlierThan isEarlierThan()}
     * @see {@link Structure#preOrderTraversal preOrderTraversal()}
     * @see {@link Structure#nextInTree nextInTree()}
     * @see {@link Structure#previousInTree previousInTree()}
     */
    isLaterThan ( other ) {
        if ( !( other instanceof Structure ) ) return undefined
        return other.isEarlierThan( this )
    }

    /**
     * Finds the next node in the same tree as this one, where "next" is defined
     * in terms of a pre-order tree traversal.  If there is no such node, this
     * will return undefined.
     * 
     * Therefore this function also returns the earliest node later than this
     * one, in the sense of {@link Structure#isEarlierThan isEarlierThan()} and
     * {@link Structure#isLaterThan isLaterThan()}.
     * 
     * For example, in a parent node with several atomic children, the next node
     * of the parent is the first child, and the next node of each child is the
     * one after, but the last child has no next node.
     * 
     * @return {Structure} The next node in pre-order traversal after this one
     * @see {@link Structure#isEarlierThan isEarlierThan()}
     * @see {@link Structure#isLaterThan isLaterThan()}
     * @see {@link Structure#preOrderTraversal preOrderTraversal()}
     * @see {@link Structure#previousInTree previousInTree()}
     */
    nextInTree () {
        // if I have a first child, that's my next node.
        if ( this._children.length > 0 )
            return this._children[0]
        // if I have a next sibling, that's my next node.
        // otherwise, use my parent's next sibling, or my grandparent's, ...
        for ( let ancestor of this.ancestorsIterator() ) {
            if ( ancestor.nextSibling() ) {
                return ancestor.nextSibling()
            }
        }
        // no nodes after me, so return undefined
    }

    /**
     * Finds the previous node in the same tree as this one, where "previous" is
     * defined in terms of a pre-order tree traversal.  If there is no such
     * node, this will return undefined.
     * 
     * Therefore this function also returns the latest node earlierr than this
     * one, in the sense of {@link Structure#isEarlierThan isEarlierThan()} and
     * {@link Structure#isLaterThan isLaterThan()}.
     * 
     * This is the reverse of {@link Structure#nextInTree nextInTree()}, in the
     * sense that `X.nextInTree().previousInTree()` and
     * `X.previousInTree().nextInTree()` will, in general, be `X`, unless one of
     * the computations involved is undefined.
     * 
     * @return {Structure} The previous node in pre-order traversal before this
     *   one
     * @see {@link Structure#nextInTree nextInTree()}
     * @see {@link Structure#isEarlierThan isEarlierThan()}
     * @see {@link Structure#isLaterThan isLaterThan()}
     * @see {@link Structure#preOrderTraversal preOrderTraversal()}
     */
    previousInTree () {
        // if I have a previous sibling, then its latest descendant is my
        // previous node
        let beforeMe = this.previousSibling()
        while ( beforeMe && beforeMe._children.length > 0 ) {
            beforeMe = beforeMe.lastChild()
        }
        if ( beforeMe ) return beforeMe
        // otherwise, my previous node is my parent (which may be null if
        // I'm the earliest node in my tree, which we convert to undefined)
        return this._parent || undefined
    }

    /**
     * An iterator that walks through the entire tree from this node onward, in
     * a pre-order tree traversal, yielding each node in turn.
     * 
     * @param {boolean} inThisTreeOnly - Set this to true to limit the iterator
     *   to return only descendants of this Structure.  Set it to false to
     *   permit the iterator to proceed outside of this tree into its context,
     *   once all nodes within this tree have been exhausted.  If this Structure
     *   has no parent, then this parameter is irrelevant.
     * @yields {Structure} The next node after this one in pre-order tree
     *   traversal, just as {@link Structure#nextInTree nextInTree()} would
     *   yield, then the next after that, and so on.
     * @see {@link Structure#nextInTree nextInTree()}
     * @see {@link Structure#isEarlierThan isEarlierThan()}
     * @see {@link Structure#isLaterThan isLaterThan()}
     * @see {@link Structure#preOrderTraversal preOrderTraversal()}
     */
    *preOrderIterator ( inThisTreeOnly = true ) {
        // compute the last descendant of this tree (or undefined if they did
        // not limit us to traversing only this subtree)
        let stopHere = inThisTreeOnly ? this : undefined
        while ( stopHere && stopHere._children.length > 0 ) {
            stopHere = stopHere.lastChild()
        }
        // now iterate over all the nexts (stopping only if we encounter the
        // final descendant computed above, if any)
        let nextResult = this
        while ( nextResult ) {
            yield nextResult
            if ( nextResult === stopHere ) break
            nextResult = nextResult.nextInTree()
        }
    }

    /**
     * The same as {@link Structure#preOrderIterator preOrderIterator()}, but
     * already computed into array form for convenience (usually at a cost of
     * efficiency).
     * 
     * @param {boolean} inThisTreeOnly - Has the same meaning as it does in
     *   {@link Structure#preOrderIterator preOrderIterator()}
     * @return {Structure[]} The array containing a pre-order tree traversal
     *   starting with this node, beginning with
     *   {@link Structure#nextInTree nextInTree()}, then the next after that,
     *   and so on.
     * @see {@link Structure#preOrderIterator preOrderIterator()}
     * @see {@link Structure#nextInTree nextInTree()}
     */
    preOrderTraversal ( inThisTreeOnly = true ) {
        return Array.from( this.preOrderIterator( inThisTreeOnly ) )
    }

    /**
     * In computer programming, the notion of variable scope is common.  A line
     * of code can "see" a variable (or is in the scope of that variable) if it
     * appears later than the variable's declaration and at a deeper level of
     * block nesting.  We have the same concept within Structures, and we call
     * it both "scope" and "accessibility."  We say that any later Structure is
     * "in the scope of" an earlier one, or equivalently, the earlier one "is
     * accessible to" the later one, if the nesting of intermediate structures
     * permits it in the usual way.
     * 
     * More specifically, a Structure `X` is in the scope of precisely the
     * following other Structures: all of `X`'s previous siblings, all of
     * `X.parent()`'s previous siblings (if `X.parent()` exists), all of
     * `X.parent().parent()`'s previous siblings (if `X.parent().parent()`
     * exists), and so on.  In particular, a Structure is not in its own scope,
     * nor in the scope of any of its other ancestors.
     * 
     * The one exception to what's stated above is the reflexive case, whether
     * `X.isAccessibleTo(X)`.  By default, this is false, because we typically
     * think of `X.isAccessibleTo(Y)` as answering the question, "Can `Y`
     * justify itself by citing `X`?" and we do not wish that relation to be
     * reflexive.  However, `X.isInTheScopeOf(X)` would typically be considered
     * true, because a variable declaration is the beginning of the scope of
     * that variable.  So we provide the second parameter, `reflexive`, for
     * customizing this behavior, and we have that, for any boolean value `b`,
     * `X.isAccessibleTo(Y,b)` if and only if `Y.isInTheScopeOf(X,b)`.
     * 
     * @param {Structure} other - The Structure to which we're asking whether
     *   the current one is accessible.  If this parameter is not a Structure,
     *   the result is undefined.
     * @param {boolean} reflexive - Whether the relation should be reflexive,
     *   that is, whether it should judge `X.isAccessibleTo(X)` to be true.
     * @return {boolean} Whether this Structure is accessible to `other`.
     * @see {@link Structure#isInTheScopeOf isInTheScopeOf()}
     */
    isAccessibleTo ( other, reflexive = false ) {
        if ( this === other ) return reflexive
        if ( !( other instanceof Structure ) ) return undefined
        if ( other.parent() === null ) return false
        if ( this.parent() === other.parent() ) {
            return this.indexInParent() < other.indexInParent()
        }
        return this.isAccessibleTo( other.parent() )
    }

    /**
     * A full definition of both
     * {@link Structure#isAccessibleTo isAccessibleTo()} and
     * {@link Structure#isInTheScopeOf isInTheScopeOf()} appears in the
     * documentation for {@link Structure#isAccessibleTo isAccessibleTo()}.
     * Refer there for details.
     * 
     * @param {Structure} other - The Structure in whose scope we're asking
     *   whether this one lies.  If this parameter is not a Structure, the
     *   result is undefined.
     * @param {boolean} reflexive - Whether the relation should be reflexive,
     *   that is, whether it should judge `X.isInTheScopeOf(X)` to be true.
     * @return {boolean} Whether this Structure is in the scope of `other`.
     * @see {@link Structure#isAccessibleTo isAccessibleTo()}
     */
    isInTheScopeOf ( other, reflexive = true ) {
        if ( !( other instanceof Structure ) ) return undefined
        return other.isAccessibleTo( this, reflexive )
    }

    /**
     * For a definition of accessibility, refer to the documentation for the
     * {@link Structure#isAccessibleTo isAccessibleTo()} function.
     * 
     * @param {boolean} reflexive - Functions analogously to the `reflexive`
     *   parameter for {@link Structure#isAccessibleTo isAccessibleTo()}; that
     *   is, do we include this Structure on its list of accessibles?  The
     *   default value is false.
     * @yields {Structure} Each Structure accessible to this one, beginning with
     *   the one closest to this one (often its previous sibling) and proceeding
     *   back through the hierarchy, so that each new result is accessible to
     *   (and earlier than) the previous).
     * @see {@link Structure#isAccessibleTo isAccessibleTo()}
     * @see {@link Structure#accessibles accessibles()}
     */
    *accessiblesIterator ( reflexive = false ) {
        if ( reflexive ) yield this
        const previous = this.previousSibling()
        if ( previous ) { // yield previous sibling and all its accessibles
            yield previous
            yield* previous.accessiblesIterator()
        } else { // defer computation to parent, if any
            if ( this._parent ) yield* this._parent.accessiblesIterator()
        }
    }

    /**
     * The full contents of
     * {@link Structure#accessiblesIterator accessiblesIterator()}, but put into
     * an array rather than an iterator, for convenience, possibly at the cost
     * of efficiency.
     * 
     * @param {boolean} reflexive - Passed directly to
     *   {@link Structure#accessiblesIterator accessiblesIterator()}; see that
     *   function for more information
     * @return {Structure[]} All Structures accessible to this one, with the
     *   latest (closest to this structure) first, proceeding on to the earliest
     *   at the end of the array
     * @see {@link Structure#accessiblesIterator accessiblesIterator()}
     * @see {@link Structure#isAccessibleTo isAccessibleTo()}
     */
    accessibles ( reflexive = false ) {
        return Array.from( this.accessiblesIterator( reflexive ) )
    }

    /**
     * For a definition of scope, refer to the documentation for the
     * {@link Structure#isAccessibleTo isAccessibleTo()} function.
     * 
     * In short, the scope of a node is itself, all of its later siblings, and
     * all their descendants, where each entry on the list
     * {@link Structure#isEarlierThan isEarlierThan()} all later entries.
     * 
     * @param {boolean} reflexive - Functions analogously to the `reflexive`
     *   parameter for {@link Structure#isInTheScopeOf isInTheScopeOf()}; that
     *   is, do we include this Structure on its list of things in its scope?
     *   The default value is true.
     * @yields {Structure} Each Structure in the scope of this one, beginning
     *   with the one closest to this one (often its previous sibling) and
     *   proceeding forward through the hierarchy, so that each new result
     *   {@link Structure#isLaterThan isLaterThan()} the previous.
     * @see {@link Structure#isInTheScopeOf isInTheScopeOf()}
     * @see {@link Structure#scope scope()}
     */
    *scopeIterator ( reflexive = true ) {
        for ( let sibling = this ; sibling ; sibling = sibling.nextSibling() ) {
            if ( sibling === this ) {
                if ( reflexive ) yield this
            } else {
                yield* sibling.descendantsIterator()
            }
        }
    }

    /**
     * The full contents of {@link Structure#scopeIterator scopeIterator()}, but
     * put into an array rather than an iterator, for convenience, possibly at
     * the cost of efficiency.
     * 
     * @param {boolean} reflexive - Passed directly to
     *   {@link Structure#scopeIterator scopeIterator()}; see that function for
     *   more information
     * @return {Structure[]} All Structures in the scope of to this one, with
     *   the earliest (closest to this structure) first, proceeding on to the
     *   latest at the end of the array
     * @see {@link Structure#scopeIterator scopeIterator()}
     * @see {@link Structure#isInTheScopeOf isInTheScopeOf()}
     */
    scope ( reflexive = true ) {
        return Array.from( this.scopeIterator( reflexive ) )
    }

}
