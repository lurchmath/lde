
/**
 * The Structure class, an n-ary tree of Structure instances, using functions
 * like parent() and children() to navigate the tree.
 */
export class Structure {
    
    /**
     * Create a new Structure.  Any argument that is not a Structure is ignored.
     * @constructor
     * @param {...Structure} children - child structures to be added to this one
     */
    constructor ( ...children ) {
        this._parent = null
        this._children = [ ]
        for ( const child of children ) {
            this.insertChild( child, this._children.length )
        }
    }

    /**
     * This Structure's parent Structure, that is, the one enclosing it, if any
     * @return {Structure} This structure's parent node, or null if there isn't one
     */
    parent () { return this._parent }

    /**
     * An array containing this Structure's children, in the correct order.
     * 
     * To get a specific child, it is more efficient to use the child()
     * function instead.
     * 
     * @return {Structure[]} A shallow copy of the Structure's children array
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
     */
    child ( i ) { return this._children[i] }

    /**
     * The number of children of this Structure
     * @return {number} A nonnegative integer indicating the number of children
     */
    numChildren () { return this._children.length }

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
        this._children.splice( atIndex, 0, child )
        child._parent = this
    }

    /**
     * If this Structure has a parent, remove this from its parent's child list
     * and set our parent pointer to null, thus severing the relationship.  If
     * this has no parent, do nothing.
     */
    remove () {
        if ( this._parent != null ) {
            this._parent._children.splice( this.indexInParent(), 1 )
            this._parent = null
        }
    }

    /**
     * Calls removeFromParent() on the child with index i.  Does nothing if the
     * index is invalid.
     * 
     * @param {number} i - the index of the child to remove
     */
    removeChild ( i ) {
        if ( i < 0 || i >= this._children.length ) return
        this._children[i].remove()
    }

    /**
     * Returns the value `i` such that `this.parent().child(i)` is this object,
     * provided that this Structure has a parent.
     * 
     * @return {number} The index of this Structure in its parent's children list
     */
    indexInParent () {
        if ( this._parent != null && this._parent._children ) {
            return this._parent._children.indexOf( this )
        }
    }

    /**
     * Find the previous sibling of this Structure in its parent, if any
     * @return {Structure} The previous sibling, or undefined if there is none
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
     */
    nextSibling () {
        let index = this.indexInParent()
        if ( index != null ) {
            return this._parent._children[index+1]
        }
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
     * A Structure is atomic if and only if it has no children.  Thus this is a
     * shorthand for `S.numChildren() == 0`.
     * @return {boolean} Whether the number of children is zero
     */
    isAtomic () { return this.numChildren() == 0 }

    /**
     * Convenience function for fetching just the first child of this Structure
     * @return {Structure} The first child of this Structure, or undefined if none
     */
    firstChild () { return this._children[0] }

    /**
     * Convenience function for fetching just the last child of this Structure
     * @return {Structure} The last child of this Structure, or undefined if none
     */
    lastChild () { return this._children[this._children.length-1] }

    /**
     * Convenience function for fetching the array containing all children of
     * this Structure except for the first
     * @return {Structure[]} All but the first child of this structure, or an
     *   empty array if there is one or fewer children
     */
    allButFirstChild () { return this._children.slice( 1 ) }

    /**
     * Convenience function for fetching the array containing all children of
     * this Structure except for the last
     * @return {Structure[]} All but the last child of this structure, or an
     *   empty array if there is one or fewer children
     */
    allButLastChild () { return this._children.slice( 0, this._children.length-1 ) }

    /**
     * Remove the last child of this Structure and return it.  If there is no
     * such child, take no action and return undefined.
     * @return {Structure} The popped last child, or undefined if none
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
     */
    pushChild ( child ) { this.insertChild( child, this._children.length ) }

    /**
     * Prepend a new child to the beginning of this Structure's list of children.
     * This is equivalent to a call to `insertChild()` with the default second
     * parameter (i.e., insert at index zero), and thus this function is here
     * only for convenience, to fit with shiftChild().
     * 
     * @param {Structure} child - The new Structure to prepend
     */
    unshiftChild ( child ) { this.insertChild( child ) }

}
