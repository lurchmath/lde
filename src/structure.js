
import { predictableStringify } from './utilities.js'

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
     * @param {...Structure} children - child Structures to be added to this one
     *   (using {@link Structure#insertChild insertChild()})
     */
    constructor ( ...children ) {
        super()
        this._parent = null
        this._children = [ ]
        this._attributes = new Map
        for ( const child of children ) {
            this.insertChild( child, this._children.length )
        }
    }

    //////
    //
    //  Functions about attributes
    //
    //////

    /**
     * Every Structure stores a dictionary of attributes as key-value pairs.
     * All keys should be strings (or they will be converted into strings) and
     * their associated values must be amenable to a JSON encoding.
     * 
     * This function looks up and returns the value of an attribute in this
     * Structure, the one with the given `key`.
     * 
     * @param {*} key - name of the attribute to look up
     * @param {*} defaultValue - the value that should be returned if the `key`
     *   does not appear as the name of an attribute in this Structure
     *   (defaults to undefined)
     * @return {*} the value associated with the given `key`
     * @see {@link Structure#setAttribute setAttribute()}
     * @see {@link Structure#getAttributeKeys getAttributeKeys()}
     */
    getAttribute ( key, defaultValue = undefined ) {
        key = `${key}`
        return this._attributes.has( key ) ? this._attributes.get( key )
                                           : defaultValue
    }

    /**
     * Get the list of keys used in the attributes dictionary within this
     * Structure.  For more details on the Structure attribution system, see the
     * documentation for {@link Structure#getAttribute getAttribute()}.
     * 
     * Each key must be atomic and will be converted into a string if it is not
     * already one.
     * @return {Array} A list of values used as keys
     * @see {@link Structure#getAttribute getAttribute()}
     */
    getAttributeKeys () { return Array.from( this._attributes.keys() ) }

    /**
     * Whether this Structure has an attribute with the given key.  For more
     * details on the Structure attribution system, see the documentation for
     * {@link Structure#getAttribute getAttribute()}.
     * @param {*} key - name of the attribute to look up; this should be atomic
     *   and will be converted into a string if it is not already one
     * @see {@link Structure#getAttribute getAttribute()}
     * @see {@link Structure#getAttributeKeys getAttributeKeys()}
     */
    hasAttribute ( key ) {
        key = `${key}`
        return this._attributes.has( key )
    }

    /**
     * For details on how Structures store attributes, see the documentation for
     * the {@link Structure#getAttribute getAttribute()} function.
     * 
     * This function stores a new key-value pair in the Structure's attribute
     * dictionary.  See the restrictions on keys and values in the documentation
     * linked to above.  Calling this function overwrites any old value that was
     * stored under the given `key`.
     * 
     * The change events are fired only if the new value is different from the
     * old value, according to `JSON.equals()`.
     * 
     * @fires Structure#willBeChanged
     * @fires Structure#wasChanged
     * @param {*} key - The key that indexes the key-value pair we are about to
     *   insert or overwrite; this must be a string or will be converted into one
     * @param {*} value - The value to associate with the given key; this must
     *   be a JavaScript value amenable to JSON encoding
     * @see {@link Structure#attr attr()}
     */
    setAttribute ( key, value ) {
        key = `${key}`
        const oldValue = this._attributes.get( key )
        if ( !JSON.equals( value, oldValue ) ) {
            /**
             * An event of this type is fired in a Structure immediately before
             * one of that Structure's attributes is changed.
             * 
             * @event Structure#willBeChanged
             * @type {Object}
             * @property {Structure} structure - The Structure emitting the
             *   event, which will soon have one of its attributes changed
             * @property {*} key - A string value, the key of the attribute
             *   that is about to change
             * @property {*} oldValue - A JavaScript value amenable to JSON
             *   encoding, the value currently associated with the key; this is
             *   undefined if the value is being associated with an unused key
             * @property {*} newValue - A JavaScript value amenable to JSON
             *   encoding, the value about to be associated with the key; this
             *   is undefined if the key-value pair is being removed rather than
             *   changed to have a new value
             * @see {@link Structure#wasChanged wasChanged}
             * @see {@link Structure#setAttribute setAttribute()}
             */
            this.emit( 'willBeChanged', {
                structure : this,
                key : key,
                oldValue : oldValue,
                newValue : value
            } )
            this._attributes.set( key, value )
            /**
             * An event of this type is fired in a Structure immediately after
             * one of that Structure's attributes is changed.
             * 
             * @event Structure#wasChanged
             * @type {Object}
             * @property {Structure} structure - The Structure emitting the
             *   event, which just had one of its attributes changed
             * @property {*} key - A string value, the key of the attribute
             *   that just changed
             * @property {*} oldValue - A JavaScript value amenable to JSON
             *   encoding, the value formerly associated with the key; this is
             *   undefined if the value is being associated with an unused key
             * @property {*} newValue - A JavaScript value amenable to JSON
             *   encoding, the value now associated with the key; this is
             *   undefined if the key-value pair is being removed rather than
             *   changed to have a new value
             * @see {@link Structure#willBeChanged willBeChanged}
             * @see {@link Structure#setAttribute setAttribute()}
             */
            this.emit( 'wasChanged', {
                structure : this,
                key : key,
                oldValue : oldValue,
                newValue : value
            } )
        }
    }

    /**
     * For details on how Structures store attributes, see the documentation for
     * the {@link Structure#getAttribute getAttribute()} function.
     * 
     * This function removes zero or more key-value pairs from the Structure's
     * attribute dictionary.  See the restrictions on keys and values in the
     * documentation linked to above.
     * 
     * The change events are fired only if the given keys are actually currently
     * in use by some key-value pairs in the Structure.  If you pass multiple
     * keys to be removed, each will generate a separate pair of
     * {@link Structure#willBeChanged willBeChanged} and
     * {@link Structure#wasChanged wasChanged} events.
     * 
     * @fires Structure#willBeChanged
     * @fires Structure#wasChanged
     * @param {Array} keys - The list of keys indicating which key-value pairs
     *   should be removed from this Structure; each of these keys must be a
     *   string, or it will be converted into one; if this parameter is omitted,
     *   it defaults to all the keys for this Structure's attributes
     * @see {@link Structure#getAttributeKeys getAttributeKeys()}
     */
    clearAttributes ( ...keys ) {
        if ( keys.length == 0 ) {
            keys = this._attributes.keys()
        }
        for ( let key of keys ) {
            key = `${key}`
            if ( this._attributes.has( key ) ) {
                const oldValue = this._attributes.get( key )
                this.emit( 'willBeChanged', {
                    structure : this,
                    key : key,
                    oldValue : oldValue,
                    newValue : undefined
                } )
                this._attributes.delete( key )
                this.emit( 'wasChanged', {
                    structure : this,
                    key : key,
                    oldValue : oldValue,
                    newValue : undefined
                } )
            }
        }
    }

    /**
     * Add attributes to a Structure and return the Structure.  This function is
     * a convenient form of repeated calls to
     * {@link Structure#setAttribute setAttribute()}, and returns the Structure
     * for ease of use in method chaining.
     * 
     * Example use: `const S = new Structure().attr( { k1 : 'v1', k2 : 'v2' } )`
     * 
     * Because this calls {@link Structure#setAttribute setAttribute()} zero or
     * more times, as dictated by the contents of `attributes`, it may result in
     * multiple firings of the events
     * {@link Structure#willBeChanged willBeChanged} and
     * {@link Structure#wasChanged wasChanged}.
     * 
     * @param {Object|Map|Array} attributes - A collection of key-value pairs to
     *   add to this Structure's attributes.  This can be a JavaScript Object,
     *   with keys and values in the usual `{'key':value,...}` form, a
     *   JavaScript `Map` object, or a JavaScript Array of key-value pairs, of
     *   the form `[['key',value],...]`.  If this argument is not of any of
     *   these three forms (or is omitted), this function does not add any
     *   attributes to the Structure.
     * @return {Structure} The Structure itself, for use in method chaining, as
     *   in the example shown above.
     * @see {@link Structure#setAttribute setAttribute()}
     */
    attr ( attributes = [ ] ) {
        if ( attributes instanceof Array ) {
            for ( let pair of attributes ) {
                this.setAttribute( pair[0], pair[1] )
            }
        } else if ( attributes instanceof Map ) {
            for ( let key of attributes.keys() ) {
                this.setAttribute( key, attributes.get( key ) )
            }
        } else if ( attributes instanceof Object ) {
            for ( let key of Object.keys( attributes ) ) {
                this.setAttribute( key, attributes[key] )
            }
        }
        return this
    }

    /**
     * Structures can be categorized into types with simple string labels.
     * For instance, we might want to say that some Structures are binders, or
     * are assumptions, or anything.  Some of these attributes have meanings
     * that may be respected by methods in this class or its subclasses, but the
     * client is free to use any type names they wish.  A Structure may have
     * zero, one, or more types.
     * 
     * This convenience function, together with
     * {@link Structure#makeIntoA makeIntoA()} and {@link Structure#asA asA()},
     * makes it easy to use the Structure's attributes to store such
     * information.
     * 
     * Note that the word "type" is being used in the informal, English sense,
     * here.  There is no intended or implied reference to mathematical types,
     * variable types in programming languages, or type theory in general.
     * This suite of functions is for adding boolean flags to Structures in an
     * easy way.
     * 
     * @param {string} type - The type we wish to query
     * @return {boolean} Whether this Structure has that type
     * @see {@link Structure#makeIntoA makeIntoA()}
     * @see {@link Structure#unmakeIntoA unmakeIntoA()}
     * @see {@link Structure#asA asA()}
     */
    isA ( type ) { return this.getAttribute( `_type_${type}` ) === true }

    /**
     * For a full explanation of the typing features afforded by this function,
     * see the documentation for {@link Structure#isA isA()}.
     * 
     * This function adds the requested type to the Structure's attributes and
     * returns the Structure itself, for use in method chaining, as in
     * `S.makeIntoA( 'fruit' ).setAttribute( 'color', 'green' )`.
     * 
     * @param {string} type - The type to add to this Structure
     * @return {Structure} This Structure, after the change has been made to it
     * @see {@link Structure#isA isA()}
     * @see {@link Structure#asA asA()}
     * @see {@link Structure#unmakeIntoA unmakeIntoA()}
     */
    makeIntoA ( type ) {
        this.setAttribute( `_type_${type}`, true )
        return this
    }

    /**
     * For a full explanation of the typing features afforded by this function,
     * see the documentation for {@link Structure#isA isA()}.
     * 
     * This function removes the requested type to the Structure's attributes
     * and returns the Structure itself, for use in method chaining, as in
     * `S.unmakeIntoA( 'fruit' ).setAttribute( 'sad', true )`.
     * 
     * Admittedly, this is a pretty bad name for a function, but it is the
     * reverse of {@link Structure#makeIntoA makeIntoA()}, so there you go.
     * 
     * @param {string} type - The type to remove from this Structure
     * @return {Structure} This Structure, after the change has been made to it
     * @see {@link Structure#isA isA()}
     * @see {@link Structure#asA asA()}
     * @see {@link Structure#makeIntoA makeIntoA()}
     */
    unmakeIntoA ( type ) {
        this.clearAttributes( `_type_${type}` )
        return this
    }

    /**
     * Create a copy of this Structure, but with the given type added, using
     * {@link Structure#makeIntoA makeIntoA()}.
     * 
     * @param {string} type - The type to add to the copy
     * @return {Structure} A copy of this Structure, with the given type added
     * @see {@link Structure#isA isA()}
     * @see {@link Structure#makeIntoA makeIntoA()}
     */
    asA ( type ) { return this.copy().makeIntoA( type ) }

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
     * until one passes or all fail; it may not be evaluated on all descendants,
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
         * @see {@link Structure#wasInserted wasInserted}
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
         * @see {@link Structure#willBeInserted willBeInserted}
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
     * In short, the accessibles of a node are its previous siblings, the
     * previous siblings of its parent, the previous siblings of its
     * grandparent, and so on, where each node yielded
     * {@link Structure#isLaterThan isLaterThan()} all nodes yielded thereafter.
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
     * all their descendants, where each node yielded by the iterator
     * {@link Structure#isEarlierThan isEarlierThan()} all nodes yielded
     * thereafter.
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

    //////
    //
    //  Functions for copying and serialization
    //
    //////

    /**
     * In order for a hierarchy of Structures to be able to be serialized and
     * deserialized, we need to track the class of each Structure in the
     * hierarchy.  We cannot reconstitute an object from its serialized state if
     * we do not know which class to construct.  So we track all subclasses of
     * this class in a single static map, here.
     * 
     * This class and each of its subclasses should add themselves to this map
     * and save the corresponding name in a static `className` variable in their
     * class.
     * 
     * @see {@link Structure#className className}
     * @see {@link Structure#addSubclass addSubclass}
     */
    static subclasses = new Map

    /**
     * Adds a subclass to the static {@link Structure#subclasses subclasses} map
     * tracked by this object, for use in reconsituting objects correctly from
     * their serialized forms.
     * 
     * This method should be called once per subclass of `Structure`.  To see
     * how, see the code that initializes {@link Structure#className className}.
     * 
     * @param {string} name - The name of the class, as it appears in code
     * @param {class} classObject - The class itself, such as `Structure`, or
     *   any of its subclasses, that is, the JavaScript object used when
     *   constructing new instances.
     * @return {string} The value of the `name` parameter, for convenience in
     *   initializing each class's static `className` field
     * @see {@link Structure#className className}
     * @see {@link Structure#subclasses subclasses}
     */
    static addSubclass ( name, classObject ) {
        Structure.subclasses.set( name, classObject )
        return name
    }

    /**
     * The name of this class, as a JavaScript string.  For the Structure class,
     * this is, of course, `"Structure"`, but for subclasses, it will vary.
     * 
     * See the code initializing this member to see how subclasses should
     * initialize their `className` members.  This is used in deserialization,
     * to correctly reconstitute objects of the appropriate class.
     * @see {@link Structure#subclasses subclasses}
     * @see {@link Structure#addSubclass addSubclass}
     */
    static className = Structure.addSubclass( 'Structure', Structure )

    /**
     * A deep copy of this Structure.  It will have no subtree in common with
     * this one, and yet it will satisfy an {@link Structure#equals equals()}
     * check with this Structure.
     * 
     * In order to ensure that the copy has the same class as the original (even
     * if that is a proper subclass of Structure), this function depends upon
     * that subclass's having registered itself with the
     * {@link Structure#subclasses subclasses} static member.
     * 
     * @return {Structure} A deep copy
     * @see {@link Structure#equals equals()}
     * @see {@link Structure#subclasses subclasses}
     */
    copy () {
        const className = this.constructor.className
        const classObject = Structure.subclasses.get( className )
        const copy = new classObject
        copy._attributes = this._attributes.deepCopy()
        copy._children = this._children.map( child => child.copy() )
        for ( let child of copy._children ) child._parent = copy
        return copy
    }

    equals ( other ) {
        // other must be a structure
        if ( !( other instanceof Structure ) ) return false
        // other must have the same number of attribute keys
        const keys1 = Array.from( this._attributes.keys() )
        const keys2 = Array.from( other._attributes.keys() )
        if ( keys1.length != keys2.length ) return false
        // other must have the same set of attribute keys
        keys1.sort()
        keys2.sort()
        if ( !JSON.equals( keys1, keys2 ) ) return false
        // other must have the same value for each attribute key
        for ( let key of keys1 )
            if ( !JSON.equals( this.getAttribute( key ),
                               other.getAttribute( key ) ) )
                return false
        // other must have the same number of children
        if ( this._children.length != other._children.length ) return false
        // other must have the same children, structurally, recursively compared
        for ( let i = 0 ; i < this._children.length ; i++ )
            if ( !this.child( i ).equals( other.child( i ) ) )
                return false
        // that is the complete set of requirements for equality
        return true
    }

    /**
     * Convert this object to JavaScript data ready for JSON serialization.
     * Note that the result of this function is *not* a string, but is ready to
     * be converted into one through `JSON.stringify()` or (preferably),
     * {@link predictableStringify predictableStringify()}.
     * 
     * The resulting object has some of its attributes directly re-used (not
     * copied) from within this Structure (notably the values of many
     * attributes), for the sake of efficiency.  Thus you should *not* modify
     * the contents of the returned structure.  If you want a completely
     * independent copy, call `JSON.parse(JSON.stringify())` on the return
     * value.
     * 
     * The particular classes of this Structure and any of its children are
     * stored in the result, so that a deep copy of this Structure can be
     * recreated from that object using {@link Strucure#fromJSON fromJSON()}.
     * 
     * @return {Object} A serialized version of this Structure
     * @see {@link Strucure#fromJSON fromJSON()}
     * @see {@link Strucure#subclasses subclasses}
     */
    toJSON () {
        return {
            className : this.constructor.className,
            attributes : [ ...this._attributes ],
            children : this._children.map( child => child.toJSON() )
        }
    }

    /**
     * Deserialize the data in the argument, producing a new Structure instance
     * (or, more specifically, sometimes an instance of one of its subclasses).
     * 
     * @param {Object} data - A JavaScript Object of the form produced by
     *   {@link Structure#toJSON toJSON()}
     * @return {Structure} A new Structure instance (which may actually be an
     *   instance of a proper subclass of Structure) as encoded in the given
     *   `data`
     * @see {@link Structure#toJSON toJSON()}
     */
    static fromJSON ( data ) {
        const classObject = Structure.subclasses.get( data.className )
        const result = new classObject(
            ...data.children.map( Structure.fromJSON ) )
        result._attributes = new Map(
            JSON.parse( JSON.stringify( data.attributes ) ) )
        return result
    }

    //////
    //
    //  Bound and free identifiers
    //
    //////

    /**
     * Although subclasses of the Structure class will be in charge of assigning
     * mathematical meaning to Structures, we must assign a small amount of
     * mathematical meaning even in this base class, so that we can implement
     * here the notions of free and bound identifiers and functions that work
     * with those concepts.  We do so in order that all Structures might have
     * access to such fundamental concepts.
     * 
     * Note that we speak of free and bound identifiers rather than free and
     * bound variables, because whether an identifier is a variable or constant
     * will be contingent upon which declarations are in force, something that
     * requires much more machinery than what we're building here in the base
     * Structure class.  Thus at this level of generality, we speak only of
     * identifiers.
     * 
     * To define free and bound identifiers, we need to establish conventions
     * for what constitutes an identifier and how we go about binding one.  We
     * thus define two conventions.
     * 
     * First, a Structure counts as an identifier if and only if it is atomic
     * and has an attribute flagging it as an identifier by specifying its
     * identifier *name.*  We use the `"_identifier"` key for such an attribute.
     * 
     * Second, we establish a convention for what it means to bind an
     * identifier, defined in the documentation for the
     * {@link Structure#isAValidBinding isAValidBinding()} function.
     * 
     * @return {boolean} Whether this Structure is an identifier, according to
     *   the definition given above
     * @see {@link Structure#setIdentifierName setIdentifierName()}
     * @see {@link Structure#getIdentifierName getIdentifierName()}
     * @see {@link Structure#clearIdentifierName clearIdentifierName()}
     * @see {@link Structure#isAValidBinding isAValidBinding()}
     */
    isAnIdentifier () { return this.isAtomic() && this.hasAttribute( '_identifier' ) }

    /**
     * Documentation on what it means for a Structure to be an identifier is
     * given in the documentation for the
     * {@link Structure#isAnIdentifier isAnIdentifier()} function.
     * 
     * To make a Structure into an identifier, call this method.
     * 
     * Although it is uncommon that you would want to make a Structure no
     * longer an identifier once you had made it into one, you could do so by
     * removing the `"_identifier"` attribute.
     * 
     * @param {string} name - The name of the identifier to assign to this
     *   Structure; any non-string will be converted to a string before use
     * @see {@link Structure#isAnIdentifier isAnIdentifier()}
     * @see {@link Structure#getIdentifierName getIdentifierName()}
     * @see {@link Structure#clearIdentifierName clearIdentifierName()}
     * @see {@link Structure#isAValidBinding isAValidBinding()}
     */
    setIdentifierName ( name ) { this.setAttribute( '_identifier', `${name}` ) }

    /**
     * Documentation on what it means for a Structure to be an identifier is
     * given in the documentation for the
     * {@link Structure#isAnIdentifier isAnIdentifier()} function.
     * 
     * To fetch the name of a Structure that is an identifier, call this method.
     * If it is not an identifier, `undefined` will be returned.
     * 
     * @return {string} The name of the Structure as an identifier, or
     *   undefined if it is not an identifier
     * @see {@link Structure#isAnIdentifier isAnIdentifier()}
     * @see {@link Structure#getIdentifierName getIdentifierName()}
     * @see {@link Structure#clearIdentifierName clearIdentifierName()}
     * @see {@link Structure#isAValidBinding isAValidBinding()}
     */
    getIdentifierName () { return this.getAttribute( '_identifier' ) }

    /**
     * Documentation on what it means for a Structure to be an identifier is
     * given in the documentation for the
     * {@link Structure#isAnIdentifier isAnIdentifier()} function.
     * 
     * To remove any identifier name that has been added to this Structure in
     * the past with {@link Structure#setIdentifierName setIdentifierName()},
     * call this function.  It guarantees that afterwards,
     * {@link Structure#isAnIdentifier isAnIdentifier()} will return false and
     * {@link Structure#getIdentifierName getIdentifierName()} will return
     * undefined.
     * @see {@link Structure#isAnIdentifier isAnIdentifier()}
     * @see {@link Structure#setIdentifierName setIdentifierName()}
     * @see {@link Structure#getIdentifierName getIdentifierName()}
     * @see {@link Structure#isAValidBinding isAValidBinding()}
     */
    clearIdentifierName () { this.clearAttributes( '_identifier' ) }

    /**
     * Documentation on what it means for a Structure to be an identifier is
     * given in the documentation for the
     * {@link Structure#isAnIdentifier isAnIdentifier()} function.
     * 
     * A Structure binds an identifier (or more than one) if it has the
     * following form.
     * 
     *  * It has been marked as a binding by calling
     *    {@link Structure#makeIntoA makeIntoA()} with the string argument
     *    `"binding"`.
     *  * It is non-atomic and has at least three children.
     *  * The first child can be any kind of Structure, and it counts as the
     *    quantifier or operator that is binding the identifiers.
     *  * The last child can be any kind of Structure, and is the body of the
     *    quantifier or operation, such as the inside of a summation or the
     *    statement over which the Structure is quantifying.
     *  * All other children (of which there must be at least one) must pass the
     *    {@link Structure#isAnIdentifier isAnIdentifier()} check, and are the
     *    identifiers being bound.
     * 
     * This function determines whether a structure has that form.  Although the
     * client may mark a Structure as a binding just by calling
     * `X.makeIntoA( "binding" )`, it might still be invalid by not satisfying
     * one of the other parts of the above definition.  Hence the need for this
     * function.
     * 
     * @return {boolean} Whether this Structure is a binding form, according to
     *   the four-point definition given above
     * @see {@link Structure#isAnIdentifier isAnIdentifier()}
     * @see {@link Structure#setIdentifierName setIdentifierName()}
     * @see {@link Structure#getIdentifierName getIdentifierName()}
     */
    isAValidBinding () {
        return this.isA( 'binding' )
            && this.numChildren() > 2
            && this.allButLastChild().slice( 1 ).every(
                child => child.isAnIdentifier() )
    }

}
