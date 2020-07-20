
/**
 * The Structure class, an $n$-ary tree of Structure instances, using functions
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
     * $\{0,1,\ldots,n-1\}$ if there are $n$ children) then undefined will be
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

}
