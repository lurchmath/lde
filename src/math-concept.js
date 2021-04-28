
import { Connection } from './connection.js'

/**
 * The MathConcept class, an n-ary tree of MathConcept instances, using functions
 * like {@link MathConcept#parent parent()} and {@link MathConcept#children children()}
 * to navigate the tree.
 * 
 * In many ways, this is an abstract base class.  Yes, you can construct instances of
 * it, and the test suite does so to verify that all the features herein work.  But in
 * actual applications, it will primarily (perhaps exclusively) be subclasses of this
 * class that are instantiated.  There are two such types of subclasses:
 * 
 *  1. LogicConcepts, which the LDE knows how to process for validating variable
 *     scoping and correctness of logical inference
 *  2. MathConcepts that are lot merely logical, and thus can be arbitrarily complex
 *     (such as a chain of equations, or a set of exercises), but which can be broken
 *     down into many LogicConcepts algorithmically, for processing by the LDE
 * 
 * This second category of subclasses is not intended to be fully specified, but can
 * grow and change over time, as new classes in that category are developed.
 */
export class MathConcept extends EventTarget {

    //////
    //
    //  Constructor
    //
    //////
    
    /**
     * Create a new MathConcept.  Any argument that is not a MathConcept is ignored.
     * @constructor
     * @param {...MathConcept} children - child MathConcepts to be added to this one
     *   (using {@link MathConcept#insertChild insertChild()})
     */
    constructor ( ...children ) {
        super()
        this._dirty = false
        this._parent = null
        this._children = [ ]
        this._attributes = new Map
        for ( const child of children ) {
            this.insertChild( child, this._children.length )
        }
    }

    //////
    //
    //  The dirty flag
    //
    //////

    /**
     * Getter for the "dirty" flag of this MathConcept.  A MathConcept may be marked
     * dirty by the client for any number of reasons.  For instance, if a
     * MathConcept changes and thus needs to be reprocessed (such as interpreted
     * or validated) to reflect those most recent changes, it may be marked
     * dirty until such processing takes place.
     * 
     * MathConcept instances are constructed with their dirty flag set to false.
     * 
     * @return {boolean} Whether this MathConcept is currently marked dirty
     * @see {@link MathConcept#markDirty markDirty()}
     */
    isDirty () { return this._dirty }

    /**
     * Setter for the "dirty" flag of this MathConcept.  For information on the
     * meaning of the flag, see {@link MathConcept#isDirty isDirty()}.
     * 
     * @param {boolean} [on=true] Whether to mark it dirty (true)
     *   or clean (false).  If this value is not boolean, it will be converted
     *   to one (with the `!!` idiom).
     * @see {@link MathConcept#isDirty isDirty()}
     */
    markDirty ( on = true ) { this._dirty = !!on }

    //////
    //
    //  Functions about attributes
    //
    //////

    /**
     * Every MathConcept stores a dictionary of attributes as key-value pairs.
     * All keys should be strings (or they will be converted into strings) and
     * their associated values must be amenable to a JSON encoding.
     * 
     * This function looks up and returns the value of an attribute in this
     * MathConcept, the one with the given `key`.
     * 
     * @param {*} key - name of the attribute to look up
     * @param {*} defaultValue - the value that should be returned if the `key`
     *   does not appear as the name of an attribute in this MathConcept
     *   (defaults to undefined)
     * @return {*} the value associated with the given `key`
     * @see {@link MathConcept#setAttribute setAttribute()}
     * @see {@link MathConcept#getAttributeKeys getAttributeKeys()}
     */
    getAttribute ( key, defaultValue = undefined ) {
        key = `${key}`
        return this._attributes.has( key ) ? this._attributes.get( key )
                                           : defaultValue
    }

    /**
     * Get the list of keys used in the attributes dictionary within this
     * MathConcept.  For more details on the MathConcept attribution system, see the
     * documentation for {@link MathConcept#getAttribute getAttribute()}.
     * 
     * Each key must be atomic and will be converted into a string if it is not
     * already one.
     * @return {Array} A list of values used as keys
     * @see {@link MathConcept#getAttribute getAttribute()}
     */
    getAttributeKeys () { return Array.from( this._attributes.keys() ) }

    /**
     * Whether this MathConcept has an attribute with the given key.  For more
     * details on the MathConcept attribution system, see the documentation for
     * {@link MathConcept#getAttribute getAttribute()}.
     * @param {*} key - name of the attribute to look up; this should be atomic
     *   and will be converted into a string if it is not already one
     * @see {@link MathConcept#getAttribute getAttribute()}
     * @see {@link MathConcept#getAttributeKeys getAttributeKeys()}
     */
    hasAttribute ( key ) {
        key = `${key}`
        return this._attributes.has( key )
    }

    /**
     * For details on how MathConcepts store attributes, see the documentation for
     * the {@link MathConcept#getAttribute getAttribute()} function.
     * 
     * This function stores a new key-value pair in the MathConcept's attribute
     * dictionary.  See the restrictions on keys and values in the documentation
     * linked to above.  Calling this function overwrites any old value that was
     * stored under the given `key`.
     * 
     * The change events are fired only if the new value is different from the
     * old value, according to `JSON.equals()`.
     * 
     * @fires MathConcept#willBeChanged
     * @fires MathConcept#wasChanged
     * @param {*} key - The key that indexes the key-value pair we are about to
     *   insert or overwrite; this must be a string or will be converted into one
     * @param {*} value - The value to associate with the given key; this must
     *   be a JavaScript value amenable to JSON encoding
     * @see {@link MathConcept#attr attr()}
     */
    setAttribute ( key, value ) {
        key = `${key}`
        const oldValue = this._attributes.get( key )
        if ( !JSON.equals( value, oldValue ) ) {
            /**
             * An event of this type is fired in a MathConcept immediately before
             * one of that MathConcept's attributes is changed.
             * 
             * @event MathConcept#willBeChanged
             * @type {Object}
             * @property {MathConcept} concept - The MathConcept emitting the
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
             * @see {@link MathConcept#wasChanged wasChanged}
             * @see {@link MathConcept#setAttribute setAttribute()}
             */
            this.emit( 'willBeChanged', {
                concept : this,
                key : key,
                oldValue : oldValue,
                newValue : value
            } )
            this._attributes.set( key, value )
            /**
             * An event of this type is fired in a MathConcept immediately after
             * one of that MathConcept's attributes is changed.
             * 
             * @event MathConcept#wasChanged
             * @type {Object}
             * @property {MathConcept} concept - The MathConcept emitting the
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
             * @see {@link MathConcept#willBeChanged willBeChanged}
             * @see {@link MathConcept#setAttribute setAttribute()}
             */
            this.emit( 'wasChanged', {
                concept : this,
                key : key,
                oldValue : oldValue,
                newValue : value
            } )
        }
    }

    /**
     * For details on how MathConcepts store attributes, see the documentation for
     * the {@link MathConcept#getAttribute getAttribute()} function.
     * 
     * This function removes zero or more key-value pairs from the MathConcept's
     * attribute dictionary.  See the restrictions on keys and values in the
     * documentation linked to above.
     * 
     * The change events are fired only if the given keys are actually currently
     * in use by some key-value pairs in the MathConcept.  If you pass multiple
     * keys to be removed, each will generate a separate pair of
     * {@link MathConcept#willBeChanged willBeChanged} and
     * {@link MathConcept#wasChanged wasChanged} events.
     * 
     * @fires MathConcept#willBeChanged
     * @fires MathConcept#wasChanged
     * @param {Array} keys - The list of keys indicating which key-value pairs
     *   should be removed from this MathConcept; each of these keys must be a
     *   string, or it will be converted into one; if this parameter is omitted,
     *   it defaults to all the keys for this MathConcept's attributes
     * @see {@link MathConcept#getAttributeKeys getAttributeKeys()}
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
                    concept : this,
                    key : key,
                    oldValue : oldValue,
                    newValue : undefined
                } )
                this._attributes.delete( key )
                this.emit( 'wasChanged', {
                    concept : this,
                    key : key,
                    oldValue : oldValue,
                    newValue : undefined
                } )
            }
        }
    }

    /**
     * Add attributes to a MathConcept and return the MathConcept.  This function is
     * a convenient form of repeated calls to
     * {@link MathConcept#setAttribute setAttribute()}, and returns the MathConcept
     * for ease of use in method chaining.
     * 
     * Example use: `const S = new MathConcept().attr( { k1 : 'v1', k2 : 'v2' } )`
     * 
     * Because this calls {@link MathConcept#setAttribute setAttribute()} zero or
     * more times, as dictated by the contents of `attributes`, it may result in
     * multiple firings of the events
     * {@link MathConcept#willBeChanged willBeChanged} and
     * {@link MathConcept#wasChanged wasChanged}.
     * 
     * @param {Object|Map|Array} attributes - A collection of key-value pairs to
     *   add to this MathConcept's attributes.  This can be a JavaScript Object,
     *   with keys and values in the usual `{'key':value,...}` form, a
     *   JavaScript `Map` object, or a JavaScript Array of key-value pairs, of
     *   the form `[['key',value],...]`.  If this argument is not of any of
     *   these three forms (or is omitted), this function does not add any
     *   attributes to the MathConcept.
     * @return {MathConcept} The MathConcept itself, for use in method chaining, as
     *   in the example shown above.
     * @see {@link MathConcept#setAttribute setAttribute()}
     */
    attr ( attributes = [ ] ) {
        if ( attributes instanceof Array ) {
            for ( const [ key, value ] of attributes ) {
                this.setAttribute( key, value )
            }
        } else if ( attributes instanceof Map ) {
            for ( const [ key, value ] of attributes ) {
                this.setAttribute( key, value )
            }
        } else if ( attributes instanceof Object ) {
            for ( const key of Object.keys( attributes ) ) {
                this.setAttribute( key, attributes[key] )
            }
        }
        return this
    }

    /**
     * MathConcepts can be categorized into types with simple string labels.
     * For instance, we might want to say that some MathConcepts are assumptions,
     * and flag that using an attribute.  Some of these attributes have meanings
     * that may be respected by methods in this class or its subclasses, but the
     * client is free to use any type names they wish.  A MathConcept may have
     * zero, one, or more types.
     * 
     * This convenience function, together with
     * {@link MathConcept#makeIntoA makeIntoA()} and {@link MathConcept#asA asA()},
     * makes it easy to use the MathConcept's attributes to store such
     * information.
     * 
     * Note that the word "type" is being used in the informal, English sense,
     * here.  There is no intended or implied reference to mathematical types,
     * variable types in programming languages, or type theory in general.
     * This suite of functions is for adding boolean flags to MathConcepts in an
     * easy way.
     * 
     * @param {string} type - The type we wish to query
     * @return {boolean} Whether this MathConcept has that type
     * @see {@link MathConcept#makeIntoA makeIntoA()}
     * @see {@link MathConcept#unmakeIntoA unmakeIntoA()}
     * @see {@link MathConcept#asA asA()}
     */
    isA ( type ) { return this.getAttribute( `_type_${type}` ) === true }

    /**
     * For a full explanation of the typing features afforded by this function,
     * see the documentation for {@link MathConcept#isA isA()}.
     * 
     * This function adds the requested type to the MathConcept's attributes and
     * returns the MathConcept itself, for use in method chaining, as in
     * `S.makeIntoA( 'fruit' ).setAttribute( 'color', 'green' )`.
     * 
     * @param {string} type - The type to add to this MathConcept
     * @return {MathConcept} This MathConcept, after the change has been made to it
     * @see {@link MathConcept#isA isA()}
     * @see {@link MathConcept#asA asA()}
     * @see {@link MathConcept#unmakeIntoA unmakeIntoA()}
     */
    makeIntoA ( type ) {
        this.setAttribute( `_type_${type}`, true )
        return this
    }

    /**
     * For a full explanation of the typing features afforded by this function,
     * see the documentation for {@link MathConcept#isA isA()}.
     * 
     * This function removes the requested type to the MathConcept's attributes
     * and returns the MathConcept itself, for use in method chaining, as in
     * `S.unmakeIntoA( 'fruit' ).setAttribute( 'sad', true )`.
     * 
     * Admittedly, this is a pretty bad name for a function, but it is the
     * reverse of {@link MathConcept#makeIntoA makeIntoA()}, so there you go.
     * 
     * @param {string} type - The type to remove from this MathConcept
     * @return {MathConcept} This MathConcept, after the change has been made to it
     * @see {@link MathConcept#isA isA()}
     * @see {@link MathConcept#asA asA()}
     * @see {@link MathConcept#makeIntoA makeIntoA()}
     */
    unmakeIntoA ( type ) {
        this.clearAttributes( `_type_${type}` )
        return this
    }

    /**
     * Create a copy of this MathConcept, but with the given type added, using
     * {@link MathConcept#makeIntoA makeIntoA()}.
     * 
     * @param {string} type - The type to add to the copy
     * @return {MathConcept} A copy of this MathConcept, with the given type added
     * @see {@link MathConcept#isA isA()}
     * @see {@link MathConcept#makeIntoA makeIntoA()}
     */
    asA ( type ) { return this.copy().makeIntoA( type ) }

    //////
    //
    //  Functions querying tree structure
    //
    //////
    
    /**
     * This MathConcept's parent MathConcept, that is, the one enclosing it, if any
     * @return {MathConcept} This MathConcept's parent node, or null if there isn't one
     * @see {@link MathConcept#children children()}
     * @see {@link MathConcept#child child()}
     */
    parent () { return this._parent }

    /**
     * An array containing this MathConcept's children, in the correct order.
     * 
     * To get a specific child, it is more efficient to use the
     * {@link MathConcept.child()} function instead.
     * 
     * @return {MathConcept[]} A shallow copy of the MathConcept's children array
     * @see {@link MathConcept#parent parent()}
     * @see {@link MathConcept#child child()}
     * @see {@link MathConcept#setChildren setChildren()}
     * @see {@link MathConcept#allButFirstChild allButFirstChild()}
     * @see {@link MathConcept#allButLastChild allButLastChild()}
     * @see {@link MathConcept#childrenSatisfying childrenSatisfying()}
     */
    children () { return this._children.slice() }

    /**
     * Get the child of this MathConcept at index i.
     * 
     * If the index is invalid (that is, it is anything other than one of
     * {0,1,...,n-1\} if there are n children) then undefined will be
     * returned instead.
     * 
     * @param {number} i - The index of the child being fetched
     * @return {MathConcept} The child at the given index, or undefined if none
     * @see {@link MathConcept#parent parent()}
     * @see {@link MathConcept#children children()}
     * @see {@link MathConcept#firstChild firstChild()}
     * @see {@link MathConcept#lastChild lastChild()}
     */
    child ( i ) { return this._children[i] }

    /**
     * The number of children of this MathConcept
     * @return {number} A nonnegative integer indicating the number of children
     * @see {@link MathConcept#children children()}
     * @see {@link MathConcept#child child()}
     */
    numChildren () { return this._children.length }

    /**
     * Returns the value `i` such that `this.parent().child(i)` is this object,
     * provided that this MathConcept has a parent.
     * 
     * @return {number} The index of this MathConcept in its parent's children list
     * @see {@link MathConcept#parent parent()}
     * @see {@link MathConcept#child child()}
     */
    indexInParent () {
        if ( this._parent != null && this._parent._children ) {
            return this._parent._children.indexOf( this )
        }
    }

    /**
     * Find the previous sibling of this MathConcept in its parent, if any
     * @return {MathConcept} The previous sibling, or undefined if there is none
     * @see {@link MathConcept#children children()}
     * @see {@link MathConcept#nextSibling nextSibling()}
     */
    previousSibling () {
        let index = this.indexInParent()
        if ( index != null) {
            return this._parent._children[index-1]
        }
    }

    /**
     * Find the next sibling of this MathConcept in its parent, if any
     * @return {MathConcept} The next sibling, or undefined if there is none
     * @see {@link MathConcept#children children()}
     * @see {@link MathConcept#previousSibling previousSibling()}
     */
    nextSibling () {
        let index = this.indexInParent()
        if ( index != null ) {
            return this._parent._children[index+1]
        }
    }

    /**
     * A MathConcept is atomic if and only if it has no children.  Thus this is a
     * shorthand for `S.numChildren() == 0`.
     * @return {boolean} Whether the number of children is zero
     * @see {@link MathConcept#numChildren numChildren()}
     */
    isAtomic () { return this.numChildren() == 0 }

    /**
     * Convenience function for fetching just the first child of this MathConcept
     * @return {MathConcept} The first child of this MathConcept, or undefined if none
     * @see {@link MathConcept#lastChild lastChild()}
     * @see {@link MathConcept#allButFirstChild allButFirstChild()}
     */
    firstChild () { return this._children[0] }

    /**
     * Convenience function for fetching just the last child of this MathConcept
     * @return {MathConcept} The last child of this MathConcept, or undefined if none
     * @see {@link MathConcept#firstChild firstChild()}
     * @see {@link MathConcept#allButLastChild allButLastChild()}
     */
    lastChild () { return this._children[this._children.length-1] }

    /**
     * Convenience function for fetching the array containing all children of
     * this MathConcept except for the first
     * @return {MathConcept[]} All but the first child of this MathConcept, or an
     *   empty array if there is one or fewer children
     * @see {@link MathConcept#firstChild firstChild()}
     * @see {@link MathConcept#allButLastChild allButLastChild()}
     */
    allButFirstChild () { return this._children.slice( 1 ) }

    /**
     * Convenience function for fetching the array containing all children of
     * this MathConcept except for the last
     * @return {MathConcept[]} All but the last child of this MathConcept, or an
     *   empty array if there is one or fewer children
     * @see {@link MathConcept#lastChild lastChild()}
     * @see {@link MathConcept#allButFirstChild allButFirstChild()}
     */
    allButLastChild () { return this._children.slice( 0, this._children.length-1 ) }

    /**
     * My address within the given ancestor, as a sequence of indices
     * `[i1,i2,...,in]` such that `ancestor.child(i1).child(i2)....child(in)` is
     * this MathConcept.
     * 
     * This is a kind of inverse to {@link MathConcept#index index()}.
     * 
     * @param {MathConcept} [ancestor] - The ancestor in which to compute my
     *   address, which defaults to my highest ancestor.  If this argument is
     *   not actually an ancestor of this MathConcept, then we treat it as if it
     *   had been omitted.
     * @return {number[]} An array of numbers as described above, which will be
     *   empty in the degenerate case where this MathConcept has no parent or this
     *   MathConcept is the given ancestor
     * @see {@link MathConcept#child child()}
     * @see {@link MathConcept#indexInParent indexInParent()}
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
     * If the given address is the empty array, the result is this MathConcept.
     * 
     * This is a kind of inverse to {@link MathConcept#address address()}.
     * 
     * @param {number[]} address - A sequence of nonnegative indices, as
     *   described in the documentation for address()
     * @return {MathConcept} A descendant MathConcept, following the definition
     *   above, or undefined if there is no such MathConcept
     * @see {@link MathConcept#child child()}
     * @see {@link MathConcept#address address()}
     */
    index ( address ) {
        if ( !( address instanceof Array ) ) return undefined
        if ( address.length == 0 ) return this
        const nextStep = this.child( address[0] )
        if ( !( nextStep instanceof MathConcept ) ) return undefined
        return nextStep.index( address.slice( 1 ) )
    }

    //////
    //
    //  Advanced queries, including predicates and iterators
    //
    //////

    /**
     * The list of children of this MathConcept that satisfy the given predicate,
     * in the same order that they appear as children.  Obviously, not all
     * children may be included in the result, depending on the predicate.
     * 
     * @param {function(MathConcept):boolean} predicate - The predicate to use for
     *   testing children
     * @return {MathConcept[]} The array of children satisfying the given predicate
     * @see {@link MathConcept#children children()}
     * @see {@link MathConcept#descendantsSatisfying descendantsSatisfying()}
     * @see {@link MathConcept#hasChildSatisfying hasChildSatisfying()}
     */
    childrenSatisfying ( predicate ) { return this._children.filter( predicate ) }

    /**
     * Whether this MathConcept has any children satisfying the given predicate.
     * The predicate will be evaluated on each child in order until one passes
     * or all fail; it may not be evaluated on all children, if not needed.
     * 
     * @param {function(MathConcept):boolean} predicate - The predicate to use for
     *   testing children
     * @return {boolean} True if and only if some child satisfies the given predicate
     * @see {@link MathConcept#hasDescendantSatisfying hasDescendantSatisfying()}
     * @see {@link MathConcept#childrenSatisfying childrenSatisfying()}
     */
    hasChildSatisfying ( predicate ) { return this._children.some( predicate ) }

    /**
     * An iterator over all descendants of this MathConcept, in a pre-order tree
     * traversal.
     * 
     * @yields {MathConcept} This MathConcept, then its first child, and so on down
     *   that branch of the tree, and onward in a pre-order traversal
     * @see {@link MathConcept#descendantsSatisfying descendantsSatisfying()}
     * @see {@link MathConcept#hasDescendantSatisfying hasDescendantSatisfying()}
     */
    *descendantsIterator () {
        yield this
        for ( let child of this._children ) yield* child.descendantsIterator()
    }

    /**
     * An array of those descendants of this MathConcept that satisfy the given
     * predicate.  These are not copies, but the actual descendants; if you
     * alter one, it changes the hierarchy beneath this MathConcept.
     * 
     * Note that this MathConcept counts as a descendant of itself.  To exclude
     * this MathConcept from consideration, simply change your predicate, as in
     * `X.descendantsSatisfying( d => X != d && predicate(d) )`.
     * 
     * @param {function(MathConcept):boolean} predicate - The predicate to use for
     *   testing descendants
     * @return {MathConcept[]} A list of descendants of this MathConcept, precisely
     *   those that satisfy the given predicate, listed in the order they would
     *   be visited in a depth-first traversal of the tree
     * @see {@link MathConcept#hasDescendantSatisfying hasDescendantSatisfying()}
     * @see {@link MathConcept#ancestorsSatisfying ancestorsSatisfying()}
     * @see {@link MathConcept#childrenSatisfying childrenSatisfying()}
     */
    descendantsSatisfying ( predicate ) {
        let result = [ ]
        for ( let descendant of this.descendantsIterator() )
            if ( predicate( descendant ) ) result.push( descendant )
        return result
    }

    /**
     * Whether this MathConcept has any descendant satisfying the given predicate.
     * The predicate will be evaluated on each descendant in depth-first order
     * until one passes or all fail; it may not be evaluated on all descendants,
     * if not needed.
     * 
     * Note that this MathConcept counts as a descendant of itself.  To ignore
     * this MathConcept, simply change the predicate to do so, as in
     * `X.descendantsSatisfying( d => X != d && predicate(d) )`.
     * 
     * @param {function(MathConcept):boolean} predicate - The predicate to use for
     *   testing descendants
     * @return {boolean} True if and only if some descendant satisfies the given predicate
     * @see {@link MathConcept#hasChildSatisfying hasChildSatisfying()}
     * @see {@link MathConcept#descendantsSatisfying descendantsSatisfying()}
     * @see {@link MathConcept#hasAncestorSatisfying hasAncestorSatisfying()}
     */
    hasDescendantSatisfying ( predicate ) {
        for ( let descendant of this.descendantsIterator() )
            if ( predicate( descendant ) ) return true
        return false
    }

    /**
     * An iterator through all the ancestors of this MathConcept, starting with
     * itself as the first (trivial) ancestor, and walking upwards from there.
     * 
     * @yields {MathConcept} This MathConcept, then its parent, grandparent, etc.
     * @see {@link MathConcept#ancestors ancestors()}
     * @see {@link MathConcept#parent parent()}
     */
    *ancestorsIterator () {
        yield this
        if ( this.parent() ) yield* this.parent().ancestorsIterator()
    }

    /**
     * An array of all ancestors of this MathConcept, starting with itself.  This
     * array is the exact contents of
     * {@link MathConcept#ancestorsIterator ancestorsIterator()}, but in array
     * form rather than as an iterator.
     * 
     * @return {MathConcept[]} An array beginning with this MathConcept, then its
     *   parent, grandparent, etc.
     * @see {@link MathConcept#ancestorsIterator ancestorsIterator()}
     * @see {@link MathConcept#parent parent()}
     */
    ancestors () { return Array.from( this.ancestorsIterator() ) }
    
    /**
     * Find all ancestors of this MathConcept satisfying the given predicate.
     * Note that this MathConcept counts as a trivial ancestor of itself, so if
     * you don't want that, modify your predicate to exclude it.
     * 
     * @param {function(MathConcept):boolean} predicate - Predicate to evaluate on
     *   each ancestor
     * @return {MathConcept[]} The ancestors satisfying the predicate, which may
     *   be an empty array
     * @see {@link MathConcept#ancestorsIterator ancestorsIterator()}
     * @see {@link MathConcept#hasAncestorSatisfying hasAncestorSatisfying()}
     * @see {@link MathConcept#descendantsSatisfying descendantsSatisfying()}
     */
    ancestorsSatisfying ( predicate ) {
        const result = [ ]
        for ( let ancestor of this.ancestorsIterator() )
            if ( predicate( ancestor ) ) result.push( ancestor )
        return result
    }

    /**
     * Whether this MathConcept has an ancestor (including itself) satisfying the
     * given predicate.
     * 
     * @param {function(MathConcept):boolean} predicate - Predicate to evaluate on
     *   each ancestor
     * @return {boolean} Whether an ancestor satisfying the given predicate
     *   exists
     * @see {@link MathConcept#ancestorsIterator ancestorsIterator()}
     * @see {@link MathConcept#ancestorsSatisfying ancestorsSatisfying()}
     * @see {@link MathConcept#hasDescendantSatisfying hasDescendantSatisfying()}
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
     * Insert a child into this MathConcept's list of children.
     * 
     * Any children at the given index or later will be moved one index later to
     * make room for the new insertion.  The index can be anything from 0 to the
     * number of children (inclusive); this last value means insert at the end
     * of the children array.  The default insertion index is the beginning of
     * the array.
     * 
     * If the child to be inserted is an ancestor of this MathConcept, then we
     * remove this MathConcept from its parent, to obey the insertion command given
     * while still maintaining acyclicity in the tree structure.  If the child to
     * be inserted is this node itself, this function does nothing.
     * 
     * @param {MathConcept} child - the child to insert
     * @param {number} atIndex - the index at which the new child will be
     * @fires MathConcept#willBeInserted
     * @fires MathConcept#wasInserted
     * @see {@link MathConcept#children children()}
     * @see {@link MathConcept#setChildren setChildren()}
     * @see {@link MathConcept#child child()}
     * @see {@link MathConcept#pushChild pushChild()}
     * @see {@link MathConcept#unshiftChild unshiftChild()}
     */
    insertChild ( child, atIndex = 0 ) {
        if ( !( child instanceof MathConcept ) ) return
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
         * An event of this type is fired in a MathConcept immediately before that
         * MathConcept is inserted as a child within a new parent.
         * 
         * @event MathConcept#willBeInserted
         * @type {Object}
         * @property {MathConcept} child - The MathConcept emitting the event, which
         *   will soon be a child of a new parent MathConcept
         * @property {MathConcept} parent - The new parent the child will have
         *   after insertion
         * @property {number} index - The new index the child will have after
         *   insertion
         * @see {@link MathConcept#wasInserted wasInserted}
         * @see {@link MathConcept#insertChild insertChild()}
         */
        child.emit( 'willBeInserted', {
            child : child,
            parent : this,
            index : atIndex
        } )
        this._children.splice( atIndex, 0, child )
        child._parent = this
        /**
         * An event of this type is fired in a MathConcept immediately after that
         * MathConcept is inserted as a child within a new parent.
         * 
         * @event MathConcept#wasInserted
         * @type {Object}
         * @property {MathConcept} child - The MathConcept emitting the event, which
         *   just became a child of a new parent MathConcept
         * @property {MathConcept} parent - The new parent the child now has
         * @property {number} index - The index the child now has in its new
         *   parent
         * @see {@link MathConcept#willBeInserted willBeInserted}
         * @see {@link MathConcept#insertChild insertChild()}
         */
        child.emit( 'wasInserted', {
            child : child,
            parent : this,
            index : atIndex
        } )
    }

    /**
     * If this MathConcept has a parent, remove this from its parent's child list
     * and set our parent pointer to null, thus severing the relationship.  If
     * this has no parent, do nothing.
     * 
     * @fires MathConcept#willBeRemoved
     * @see {@link MathConcept#parent parent()}
     * @see {@link MathConcept#removeChild removeChild()}
     */
    remove () {
        if ( this._parent != null ) {
            const parent = this._parent
            const index = this.indexInParent()
            /**
             * This event is fired in a MathConcept immediately before that
             * MathConcept is removed from its parent MathConcept.  This could be
             * from a simple removal, or it might be the first step in a
             * re-parenting process that ends up with the MathConcept as the child
             * of a new parent.
             * 
             * @event MathConcept#willBeRemoved
             * @type {Object}
             * @property {MathConcept} child - The MathConcept emitting the event,
             *   which is about to be removed from its parent MathConcept
             * @property {MathConcept} parent - The current parent MathConcept
             * @property {number} index - The index the child has in its parent,
             *   before the removal
             * @see {@link MathConcept#remove remove()}
             */
            this.emit( 'willBeRemoved', {
                child : this,
                parent : parent,
                index : index
            } )
            this._parent._children.splice( this.indexInParent(), 1 )
            this._parent = null
            /**
             * This event is fired in a MathConcept immediately after that
             * MathConcept is removed from its parent MathConcept.  This could be
             * from a simple removal, or it might be the first step in a
             * re-parenting process that ends up with the MathConcept as the child
             * of a new parent.
             * 
             * @event MathConcept#wasRemoved
             * @type {Object}
             * @property {MathConcept} child - The MathConcept emitting the event,
             *   which was just removed from its parent MathConcept
             * @property {MathConcept} parent - The old parent MathConcept from
             *   which the child was just removed
             * @property {number} index - The index the child had in its parent,
             *   before the removal
             * @see {@link MathConcept#remove remove()}
             */
            this.emit( 'wasRemoved', {
                child : this,
                parent : parent,
                index : index
            } )
        }
    }

    /**
     * Calls {@link MathConcept#remove remove()} on the child with index `i`.
     * Does nothing if the index is invalid.
     * 
     * @param {number} i - the index of the child to remove
     * @see {@link MathConcept#remove remove()}
     * @see {@link MathConcept#child child()}
     * @see {@link MathConcept#popChild popChild()}
     * @see {@link MathConcept#shiftChild shiftChild()}
     */
    removeChild ( i ) {
        if ( i < 0 || i >= this._children.length ) return
        this._children[i].remove()
    }

    /**
     * Replace this MathConcept, exactly where it sits in its parent MathConcept,
     * with the given one, thus deparenting this one.
     * 
     * For example, if `A` is a child of `B` and we call `B.replaceWith(C)`,
     * then `C` will now be a child of `A` at the same index that `B` formerly
     * occupied, and `B` will now have no parent.  If `C` had a parent before,
     * it will have been removed from it (thus decreasing that parent's number
     * of children by one).
     * 
     * @param {MathConcept} other - the MathConcept with which to replace this one
     * @see {@link MathConcept#remove remove()}
     * @see {@link MathConcept#child child()}
     * @see {@link MathConcept#parent parent()}
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
     * Remove the last child of this MathConcept and return it.  If there is no
     * such child, take no action and return undefined.
     * @return {MathConcept} The popped last child, or undefined if none
     * @see {@link MathConcept#pushChild pushChild()}
     * @see {@link MathConcept#shiftChild shiftChild()}
     */
    popChild () {
        const child = this.lastChild()
        if ( !child ) return
        child.remove()
        return child
    }

    /**
     * Remove the first child of this MathConcept and return it.  If there is no
     * such child, take no action and return undefined.
     * @return {MathConcept} The popped first child, or undefined if none
     * @see {@link MathConcept#popChild popChild()}
     * @see {@link MathConcept#unshiftChild unshiftChild()}
     */
    shiftChild () {
        const child = this.firstChild()
        if ( !child ) return
        child.remove()
        return child
    }

    /**
     * Append a new child to the end of this MathConcept's list of children.  This
     * is equivalent to a call to `insertChild()` with the length of the current
     * children array as the index at which to insert.
     * 
     * @param {MathConcept} child - The new MathConcept to append
     * @see {@link MathConcept#popChild popChild()}
     * @see {@link MathConcept#unshiftChild unshiftChild()}
     */
    pushChild ( child ) { this.insertChild( child, this._children.length ) }

    /**
     * Prepend a new child to the beginning of this MathConcept's list of children.
     * This is equivalent to a call to `insertChild()` with the default second
     * parameter (i.e., insert at index zero), and thus this function is here
     * only for convenience, to fit with shiftChild().
     * 
     * @param {MathConcept} child - The new MathConcept to prepend
     * @see {@link MathConcept#shiftChild shiftChild()}
     * @see {@link MathConcept#pushChild pushChild()}
     */
    unshiftChild ( child ) { this.insertChild( child ) }

    /**
     * Replace the entire children array of this MathConcept with a new one.
     * 
     * This is equivalent to removing all the current children of this MathConcept
     * in order from lowest index to highest, then inserting all the children in
     * the given array, again from lowest index to highest.
     * 
     * The intent is not for any of the elements of the given array to be
     * ancestors or descendants of one another, but even if they are, the action
     * taken here still follows the explanation given in the previous paragraph.
     * 
     * @param {MathConcept[]} children - New list of children
     * @see {@link MathConcept#children children()}
     * @see {@link MathConcept#removeChild removeChild()}
     * @see {@link MathConcept#insertChild insertChild()}
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
     * Under pre-order tree traversal, which of two MathConcept comes first?  We
     * call the first "earlier than" the other MathConcept, because we will use
     * MathConcept hierarchies to represent documents, and first in a pre-order
     * tree traversal would then mean earlier in the document.
     * 
     * Note that this is a strict ordering, so a MathConcept is not earlier than
     * itself.
     * 
     * @param {MathConcept} other - The MathConcept with which to compare this one.
     *   (The result is undefined if this is not a MathConcept.)
     * @return {boolean} Whether this MathConcept is earlier than the other, or
     *   undefined if they are incomparable (not in the same tree)
     * @see {@link MathConcept#isLaterThan isLaterThan()}
     * @see {@link MathConcept#preOrderTraversal preOrderTraversal()}
     * @see {@link MathConcept#nextInTree nextInTree()}
     * @see {@link MathConcept#previousInTree previousInTree()}
     */
    isEarlierThan ( other ) {
        // type check
        if ( !( other instanceof MathConcept ) ) return undefined
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
     * This is the opposite of {@link MathConcept#isEarlierThan isEarlierThan()}.
     * We have `A.isLaterThan(B)` if and only if `B.isEarlierThan(A)`.  This is
     * therefore just a convenience function.
     * 
     * @param {MathConcept} other - The MathConcept with which to compare this one.
     *   (The result is undefined if this is not a MathConcept.)
     * @return {boolean} Whether this MathConcept is later than the other, or
     *   undefined if they are incomparable (not in the same tree)
     * @see {@link MathConcept#isEarlierThan isEarlierThan()}
     * @see {@link MathConcept#preOrderTraversal preOrderTraversal()}
     * @see {@link MathConcept#nextInTree nextInTree()}
     * @see {@link MathConcept#previousInTree previousInTree()}
     */
    isLaterThan ( other ) {
        if ( !( other instanceof MathConcept ) ) return undefined
        return other.isEarlierThan( this )
    }

    /**
     * Finds the next node in the same tree as this one, where "next" is defined
     * in terms of a pre-order tree traversal.  If there is no such node, this
     * will return undefined.
     * 
     * Therefore this function also returns the earliest node later than this
     * one, in the sense of {@link MathConcept#isEarlierThan isEarlierThan()} and
     * {@link MathConcept#isLaterThan isLaterThan()}.
     * 
     * For example, in a parent node with several atomic children, the next node
     * of the parent is the first child, and the next node of each child is the
     * one after, but the last child has no next node.
     * 
     * @return {MathConcept} The next node in pre-order traversal after this one
     * @see {@link MathConcept#isEarlierThan isEarlierThan()}
     * @see {@link MathConcept#isLaterThan isLaterThan()}
     * @see {@link MathConcept#preOrderTraversal preOrderTraversal()}
     * @see {@link MathConcept#previousInTree previousInTree()}
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
     * one, in the sense of {@link MathConcept#isEarlierThan isEarlierThan()} and
     * {@link MathConcept#isLaterThan isLaterThan()}.
     * 
     * This is the reverse of {@link MathConcept#nextInTree nextInTree()}, in the
     * sense that `X.nextInTree().previousInTree()` and
     * `X.previousInTree().nextInTree()` will, in general, be `X`, unless one of
     * the computations involved is undefined.
     * 
     * @return {MathConcept} The previous node in pre-order traversal before this
     *   one
     * @see {@link MathConcept#nextInTree nextInTree()}
     * @see {@link MathConcept#isEarlierThan isEarlierThan()}
     * @see {@link MathConcept#isLaterThan isLaterThan()}
     * @see {@link MathConcept#preOrderTraversal preOrderTraversal()}
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
     *   to return only descendants of this MathConcept.  Set it to false to
     *   permit the iterator to proceed outside of this tree into its context,
     *   once all nodes within this tree have been exhausted.  If this MathConcept
     *   has no parent, then this parameter is irrelevant.
     * @yields {MathConcept} The next node after this one in pre-order tree
     *   traversal, just as {@link MathConcept#nextInTree nextInTree()} would
     *   yield, then the next after that, and so on.
     * @see {@link MathConcept#nextInTree nextInTree()}
     * @see {@link MathConcept#isEarlierThan isEarlierThan()}
     * @see {@link MathConcept#isLaterThan isLaterThan()}
     * @see {@link MathConcept#preOrderTraversal preOrderTraversal()}
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
     * The same as {@link MathConcept#preOrderIterator preOrderIterator()}, but
     * already computed into array form for convenience (usually at a cost of
     * efficiency).
     * 
     * @param {boolean} inThisTreeOnly - Has the same meaning as it does in
     *   {@link MathConcept#preOrderIterator preOrderIterator()}
     * @return {MathConcept[]} The array containing a pre-order tree traversal
     *   starting with this node, beginning with
     *   {@link MathConcept#nextInTree nextInTree()}, then the next after that,
     *   and so on.
     * @see {@link MathConcept#preOrderIterator preOrderIterator()}
     * @see {@link MathConcept#nextInTree nextInTree()}
     */
    preOrderTraversal ( inThisTreeOnly = true ) {
        return Array.from( this.preOrderIterator( inThisTreeOnly ) )
    }

    /**
     * In computer programming, the notion of variable scope is common.  A line
     * of code can "see" a variable (or is in the scope of that variable) if it
     * appears later than the variable's declaration and at a deeper level of
     * block nesting.  We have the same concept within MathConcepts, and we call
     * it both "scope" and "accessibility."  We say that any later MathConcept is
     * "in the scope of" an earlier one, or equivalently, the earlier one "is
     * accessible to" the later one, if the nesting of intermediate MathConcepts
     * permits it in the usual way.
     * 
     * More specifically, a MathConcept `X` is in the scope of precisely the
     * following other MathConcepts: all of `X`'s previous siblings, all of
     * `X.parent()`'s previous siblings (if `X.parent()` exists), all of
     * `X.parent().parent()`'s previous siblings (if `X.parent().parent()`
     * exists), and so on.  In particular, a MathConcept is not in its own scope,
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
     * @param {MathConcept} other - The MathConcept to which we're asking whether
     *   the current one is accessible.  If this parameter is not a MathConcept,
     *   the result is undefined.
     * @param {boolean} reflexive - Whether the relation should be reflexive,
     *   that is, whether it should judge `X.isAccessibleTo(X)` to be true.
     * @return {boolean} Whether this MathConcept is accessible to `other`.
     * @see {@link MathConcept#isInTheScopeOf isInTheScopeOf()}
     */
    isAccessibleTo ( other, reflexive = false ) {
        if ( this === other ) return reflexive
        if ( !( other instanceof MathConcept ) ) return undefined
        if ( other.parent() === null ) return false
        if ( this.parent() === other.parent() ) {
            return this.indexInParent() < other.indexInParent()
        }
        return this.isAccessibleTo( other.parent() )
    }

    /**
     * A full definition of both
     * {@link MathConcept#isAccessibleTo isAccessibleTo()} and
     * {@link MathConcept#isInTheScopeOf isInTheScopeOf()} appears in the
     * documentation for {@link MathConcept#isAccessibleTo isAccessibleTo()}.
     * Refer there for details.
     * 
     * @param {MathConcept} other - The MathConcept in whose scope we're asking
     *   whether this one lies.  If this parameter is not a MathConcept, the
     *   result is undefined.
     * @param {boolean} reflexive - Whether the relation should be reflexive,
     *   that is, whether it should judge `X.isInTheScopeOf(X)` to be true.
     * @return {boolean} Whether this MathConcept is in the scope of `other`.
     * @see {@link MathConcept#isAccessibleTo isAccessibleTo()}
     */
    isInTheScopeOf ( other, reflexive = true ) {
        if ( !( other instanceof MathConcept ) ) return undefined
        return other.isAccessibleTo( this, reflexive )
    }

    /**
     * For a definition of accessibility, refer to the documentation for the
     * {@link MathConcept#isAccessibleTo isAccessibleTo()} function.
     * 
     * In short, the accessibles of a node are its previous siblings, the
     * previous siblings of its parent, the previous siblings of its
     * grandparent, and so on, where each node yielded
     * {@link MathConcept#isLaterThan isLaterThan()} all nodes yielded thereafter.
     * 
     * @param {boolean} reflexive - Functions analogously to the `reflexive`
     *   parameter for {@link MathConcept#isAccessibleTo isAccessibleTo()}; that
     *   is, do we include this MathConcept on its list of accessibles?  The
     *   default value is false.
     * @yields {MathConcept} Each MathConcept accessible to this one, beginning with
     *   the one closest to this one (often its previous sibling) and proceeding
     *   back through the hierarchy, so that each new result is accessible to
     *   (and earlier than) the previous).
     * @see {@link MathConcept#isAccessibleTo isAccessibleTo()}
     * @see {@link MathConcept#accessibles accessibles()}
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
     * {@link MathConcept#accessiblesIterator accessiblesIterator()}, but put into
     * an array rather than an iterator, for convenience, possibly at the cost
     * of efficiency.
     * 
     * @param {boolean} reflexive - Passed directly to
     *   {@link MathConcept#accessiblesIterator accessiblesIterator()}; see that
     *   function for more information
     * @return {MathConcept[]} All MathConcepts accessible to this one, with the
     *   latest (closest to this MathConcept) first, proceeding on to the earliest
     *   at the end of the array
     * @see {@link MathConcept#accessiblesIterator accessiblesIterator()}
     * @see {@link MathConcept#isAccessibleTo isAccessibleTo()}
     */
    accessibles ( reflexive = false ) {
        return Array.from( this.accessiblesIterator( reflexive ) )
    }

    /**
     * For a definition of scope, refer to the documentation for the
     * {@link MathConcept#isAccessibleTo isAccessibleTo()} function.
     * 
     * In short, the scope of a node is itself, all of its later siblings, and
     * all their descendants, where each node yielded by the iterator
     * {@link MathConcept#isEarlierThan isEarlierThan()} all nodes yielded
     * thereafter.
     * 
     * @param {boolean} reflexive - Functions analogously to the `reflexive`
     *   parameter for {@link MathConcept#isInTheScopeOf isInTheScopeOf()}; that
     *   is, do we include this MathConcept on its list of things in its scope?
     *   The default value is true.
     * @yields {MathConcept} Each MathConcept in the scope of this one, beginning
     *   with the one closest to this one (often its previous sibling) and
     *   proceeding forward through the hierarchy, so that each new result
     *   {@link MathConcept#isLaterThan isLaterThan()} the previous.
     * @see {@link MathConcept#isInTheScopeOf isInTheScopeOf()}
     * @see {@link MathConcept#scope scope()}
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
     * The full contents of {@link MathConcept#scopeIterator scopeIterator()}, but
     * put into an array rather than an iterator, for convenience, possibly at
     * the cost of efficiency.
     * 
     * @param {boolean} reflexive - Passed directly to
     *   {@link MathConcept#scopeIterator scopeIterator()}; see that function for
     *   more information
     * @return {MathConcept[]} All MathConcepts in the scope of to this one, with
     *   the earliest (closest to this MathConcept) first, proceeding on to the
     *   latest at the end of the array
     * @see {@link MathConcept#scopeIterator scopeIterator()}
     * @see {@link MathConcept#isInTheScopeOf isInTheScopeOf()}
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
     * In order for a hierarchy of MathConcepts to be able to be serialized and
     * deserialized, we need to track the class of each MathConcept in the
     * hierarchy.  We cannot reconstitute an object from its serialized state if
     * we do not know which class to construct.  So we track all subclasses of
     * this class in a single static map, here.
     * 
     * This class and each of its subclasses should add themselves to this map
     * and save the corresponding name in a static `className` variable in their
     * class.
     * 
     * @see {@link MathConcept#className className}
     * @see {@link MathConcept#addSubclass addSubclass}
     */
    static subclasses = new Map

    /**
     * Adds a subclass to the static {@link MathConcept#subclasses subclasses} map
     * tracked by this object, for use in reconsituting objects correctly from
     * their serialized forms.
     * 
     * This method should be called once per subclass of `MathConcept`.  To see
     * how, see the code that initializes {@link MathConcept#className className}.
     * 
     * @param {string} name - The name of the class, as it appears in code
     * @param {class} classObject - The class itself, such as `MathConcept`, or
     *   any of its subclasses, that is, the JavaScript object used when
     *   constructing new instances.
     * @return {string} The value of the `name` parameter, for convenience in
     *   initializing each class's static `className` field
     * @see {@link MathConcept#className className}
     * @see {@link MathConcept#subclasses subclasses}
     */
    static addSubclass ( name, classObject ) {
        MathConcept.subclasses.set( name, classObject )
        return name
    }

    /**
     * The name of this class, as a JavaScript string.  For the MathConcept class,
     * this is, of course, `"MathConcept"`, but for subclasses, it will vary.
     * 
     * See the code initializing this member to see how subclasses should
     * initialize their `className` members.  This is used in deserialization,
     * to correctly reconstitute objects of the appropriate class.
     * @see {@link MathConcept#subclasses subclasses}
     * @see {@link MathConcept#addSubclass addSubclass}
     */
    static className = MathConcept.addSubclass( 'MathConcept', MathConcept )

    /**
     * A deep copy of this MathConcept.  It will have no subtree in common with
     * this one, and yet it will satisfy an {@link MathConcept#equals equals()}
     * check with this MathConcept.
     * 
     * In order to ensure that the copy has the same class as the original (even
     * if that is a proper subclass of MathConcept), this function depends upon
     * that subclass's having registered itself with the
     * {@link MathConcept#subclasses subclasses} static member.
     * 
     * @return {MathConcept} A deep copy
     * @see {@link MathConcept#equals equals()}
     * @see {@link MathConcept#subclasses subclasses}
     */
    copy () {
        const className = this.constructor.className
        const classObject = MathConcept.subclasses.get( className )
        const copy = new classObject
        copy._attributes = this._attributes.deepCopy()
        copy._children = this._children.map( child => child.copy() )
        for ( let child of copy._children ) child._parent = copy
        return copy
    }

    equals ( other ) {
        // other must be a MathConcept
        if ( !( other instanceof MathConcept ) ) return false
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
     * copied) from within this MathConcept (notably the values of many
     * attributes), for the sake of efficiency.  Thus you should *not* modify
     * the contents of the returned MathConcept.  If you want a completely
     * independent copy, call `JSON.parse(JSON.stringify())` on the return
     * value.
     * 
     * The particular classes of this MathConcept and any of its children are
     * stored in the result, so that a deep copy of this MathConcept can be
     * recreated from that object using {@link Strucure#fromJSON fromJSON()}.
     * 
     * If the serialized result will later be deserialized after the original
     * has been destroyed, then you may wish to preserve the unique IDs of each
     * MathConcept in the hierarchy in the serialization.  But if the original
     * will still exist, you may not.  Thus the parameter lets you choose which
     * of these behaviors you need.  By default, IDs are included.
     * 
     * @param {boolean} includeIDs - Whether to include the IDs of the
     *   MathConcept and its descendants in the serialized form (as part of the
     *   MathConcept's attributes)
     * @return {Object} A serialized version of this MathConcept
     * @see {@link Strucure#fromJSON fromJSON()}
     * @see {@link Strucure#subclasses subclasses}
     */
    toJSON ( includeIDs = true ) {
        let serializedAttributes = [ ...this._attributes ]
        if ( !includeIDs )
            serializedAttributes = serializedAttributes.filter(
                pair => pair[0] != '_id' )
        return {
            className : this.constructor.className,
            attributes : serializedAttributes,
            children : this._children.map( child => child.toJSON( includeIDs ) )
        }
    }

    /**
     * Deserialize the data in the argument, producing a new MathConcept instance
     * (or, more specifically, sometimes an instance of one of its subclasses).
     * 
     * Note that because this function is static, clients access it as
     * `MathConcept.fromJSON(...)`.
     * 
     * @param {Object} data - A JavaScript Object of the form produced by
     *   {@link MathConcept#toJSON toJSON()}
     * @return {MathConcept} A new MathConcept instance (which may actually be an
     *   instance of a proper subclass of MathConcept) as encoded in the given
     *   `data`
     * @see {@link MathConcept#toJSON toJSON()}
     */
    static fromJSON ( data ) {
        const classObject = MathConcept.subclasses.get( data.className )
        const result = new classObject(
            ...data.children.map( MathConcept.fromJSON ) )
        result._attributes = new Map(
            JSON.parse( JSON.stringify( data.attributes ) ) )
        return result
    }

    /**
     * A simple string representation that represents an atomic MathConcept using
     * `getIdentifierName()` and a non-leaf node as an S-expression (that is,
     * `(a b c ...)`) of the string representations of its children.  This
     * produces LISP-like results.
     * 
     * @return {string} A simple string representation
     * @see {@link MathConcept#toJSON toJSON()}
     * @see {@link MathConcept#isAtomic isAtomic()}
     * @see {@link MathConcept#getIdentifierName getIdentifierName()}
     */
    toString () {
        return this.isAtomic() ? `${this.getIdentifierName()}` :
            `(${this._children.map( child => child.toString() ).join( ' ' )})`
    }

    //////
    //
    //  Bound and free identifiers
    //
    //////

    /**
     * Although subclasses of the MathConcept class will be in charge of assigning
     * mathematical meaning to MathConcepts, we must assign a small amount of
     * mathematical meaning even in this base class, so that we can implement
     * here the notions of free and bound identifiers and functions that work
     * with those concepts.  We do so in order that all MathConcepts might have
     * access to such fundamental concepts.
     * 
     * Note that we speak of free and bound identifiers rather than free and
     * bound variables, because whether an identifier is a variable or constant
     * will be contingent upon which declarations are in force, something that
     * requires much more machinery than what we're building here in the base
     * MathConcept class.  Thus at this level of generality, we speak only of
     * identifiers.
     * 
     * To define free and bound identifiers, we need to establish conventions
     * for what constitutes an identifier and how we go about binding one.  We
     * thus define two conventions.
     * 
     * First, a MathConcept counts as an identifier if and only if it is atomic
     * and has an attribute flagging it as an identifier by specifying its
     * identifier *name.*  We use the `"_identifier"` key for such an attribute.
     * 
     * Second, we establish a convention for what it means to bind an
     * identifier, defined in the documentation for the
     * {@link MathConcept#isAValidBinding isAValidBinding()} function.
     * 
     * @return {boolean} Whether this MathConcept is an identifier, according to
     *   the definition given above
     * @see {@link MathConcept#setIdentifierName setIdentifierName()}
     * @see {@link MathConcept#getIdentifierName getIdentifierName()}
     * @see {@link MathConcept#clearIdentifierName clearIdentifierName()}
     * @see {@link MathConcept#isAValidBinding isAValidBinding()}
     */
    isAnIdentifier () { return this.isAtomic() && this.hasAttribute( '_identifier' ) }

    /**
     * Documentation on what it means for a MathConcept to be an identifier is
     * given in the documentation for the
     * {@link MathConcept#isAnIdentifier isAnIdentifier()} function.
     * 
     * To make a MathConcept into an identifier, call this method.
     * 
     * Although it is uncommon that you would want to make a MathConcept no
     * longer an identifier once you had made it into one, you could do so by
     * removing the `"_identifier"` attribute.
     * 
     * @param {string} name - The name of the identifier to assign to this
     *   MathConcept; any non-string will be converted to a string before use
     * @see {@link MathConcept#isAnIdentifier isAnIdentifier()}
     * @see {@link MathConcept#getIdentifierName getIdentifierName()}
     * @see {@link MathConcept#clearIdentifierName clearIdentifierName()}
     * @see {@link MathConcept#isAValidBinding isAValidBinding()}
     */
    setIdentifierName ( name ) { this.setAttribute( '_identifier', `${name}` ) }

    /**
     * Documentation on what it means for a MathConcept to be an identifier is
     * given in the documentation for the
     * {@link MathConcept#isAnIdentifier isAnIdentifier()} function.
     * 
     * To fetch the name of a MathConcept that is an identifier, call this method.
     * If it is not an identifier, `undefined` will be returned.
     * 
     * @return {string} The name of the MathConcept as an identifier, or
     *   undefined if it is not an identifier
     * @see {@link MathConcept#isAnIdentifier isAnIdentifier()}
     * @see {@link MathConcept#getIdentifierName getIdentifierName()}
     * @see {@link MathConcept#clearIdentifierName clearIdentifierName()}
     * @see {@link MathConcept#isAValidBinding isAValidBinding()}
     */
    getIdentifierName () { return this.getAttribute( '_identifier' ) }

    /**
     * Documentation on what it means for a MathConcept to be an identifier is
     * given in the documentation for the
     * {@link MathConcept#isAnIdentifier isAnIdentifier()} function.
     * 
     * To remove any identifier name that has been added to this MathConcept in
     * the past with {@link MathConcept#setIdentifierName setIdentifierName()},
     * call this function.  It guarantees that afterwards,
     * {@link MathConcept#isAnIdentifier isAnIdentifier()} will return false and
     * {@link MathConcept#getIdentifierName getIdentifierName()} will return
     * undefined.
     * @see {@link MathConcept#isAnIdentifier isAnIdentifier()}
     * @see {@link MathConcept#setIdentifierName setIdentifierName()}
     * @see {@link MathConcept#getIdentifierName getIdentifierName()}
     * @see {@link MathConcept#isAValidBinding isAValidBinding()}
     */
    clearIdentifierName () { this.clearAttributes( '_identifier' ) }

    /**
     * Documentation on what it means for a MathConcept to be an identifier is
     * given in the documentation for the
     * {@link MathConcept#isAnIdentifier isAnIdentifier()} function.
     * 
     * A MathConcept binds an identifier (or more than one) if it has the
     * following form.
     * 
     *  * It has been marked as a binding by calling
     *    {@link MathConcept#makeIntoA makeIntoA()} with the string argument
     *    `"binding"`.
     *  * It is non-atomic and has at least three children.
     *  * The first child can be any kind of MathConcept, and it counts as the
     *    quantifier or operator that is binding the identifiers.
     *  * The last child can be any kind of MathConcept, and is the body of the
     *    quantifier or operation, such as the inside of a summation or the
     *    statement over which the MathConcept is quantifying.
     *  * All other children (of which there must be at least one) must pass the
     *    {@link MathConcept#isAnIdentifier isAnIdentifier()} check, and are the
     *    identifiers being bound.
     * 
     * This function determines whether a MathConcept has that form.  Although the
     * client may mark a MathConcept as a binding just by calling
     * `X.makeIntoA( "binding" )`, it might still be invalid by not satisfying
     * one of the other parts of the above definition.  Hence the need for this
     * function.
     * 
     * @return {boolean} Whether this MathConcept is a binding form, according to
     *   the four-point definition given above
     * @see {@link MathConcept#isAnIdentifier isAnIdentifier()}
     * @see {@link MathConcept#setIdentifierName setIdentifierName()}
     * @see {@link MathConcept#getIdentifierName getIdentifierName()}
     */
    isAValidBinding () {
        return this.isA( 'binding' )
            && this.numChildren() > 2
            && this.allButLastChild().slice( 1 ).every(
                child => child.isAnIdentifier() )
    }

    /**
     * If a MathConcept {@link MathConcept#isAValidBinding isAValidBinding()} then
     * all of its children other than the first and the last are its bound
     * identifiers.  This function returns them in an array.  The exact children
     * objects themselves are returned, in the order they sit within their
     * parent; the result is *not* an array of the child identifiers *names.*
     * 
     * If this MathConcept is not a valid binding, this function returns an empty
     * array instead.
     * 
     * @return {Array} The list of identifiers bound by this MathConcept, if and
     *   only if it is one
     * @see {@link MathConcept#binds binds()}
     * @see {@link MathConcept#isAValidBinding isAValidBinding()}
     */
    boundIdentifiers () {
        return this.isAValidBinding() ? this.allButLastChild().slice( 1 ) : [ ]
    }

    /**
     * Given an identifier name, this function checks to see whether an
     * identifier of that name appears on this MathConcept's list of
     * {@link MathConcept#boundIdentifiers boundIdentifiers()}.
     * 
     * @param {string} identifierName - The name of the identifier to test
     * @return {boolean} Whether this MathConcept is a binding and one of its
     *   bound identifiers is has the given name
     * @see {@link MathConcept#boundIdentifiers boundIdentifiers()}
     * @see {@link MathConcept#isAValidBinding isAValidBinding()}
     */
    binds ( identifierName ) {
        return this.boundIdentifiers().some( identifier =>
            identifier.getIdentifierName() == identifierName )
    }

    /**
     * An identifier X is free in an ancestor Y if and only if no MathConcept
     * that is an ancestor A of X inside of (or equal to) Y satisfies
     * `A.binds( X.getIdentifierName() )`.  This function returns an array of
     * all identifier names that appear within this MathConcept and, at the point
     * where they appear, are free in this ancestor MathConcept.
     * 
     * If, instead of just the names of the identifiers, you wish to have the
     * identifier MathConcepts themselves, you can couple the
     * {@link MathConcept#isFree isFree()} function with the
     * {@link MathConcept#descendantsSatisfying descendantsSatisfying()}
     * function to achieve that.
     * 
     * @return {string[]} An array of names of free identifiers appearing as
     *   descendants of this MathConcept
     * @see {@link MathConcept#binds binds()}
     * @see {@link MathConcept#boundIdentifiers boundIdentifiers()}
     */
    freeIdentifiers () {
        // a single identifier is free in itself
        if ( this.isAnIdentifier() ) return [ this.getIdentifierName() ]
        // otherwise we collect all the free variables in all children...
        const result = new Set
        this.children().forEach( child =>
            child.freeIdentifiers().forEach( name =>
                result.add( name ) ) )
        // ...excepting any that this MathConcept binds
        this.boundIdentifiers().forEach( identifier =>
            result.delete( identifier.getIdentifierName() ) )
        return Array.from( result )
    }

    /**
     * Is this MathConcept free in one of its ancestors?  If the ancestor is not
     * specified, it defaults to the MathConcept's topmost ancestor.  Otherwise,
     * you can specify it with the parameter.
     * 
     * A MathConcept is free in an ancestor if none of the MathConcept's free
     * identifiers are bound within that ancestor.
     * 
     * @param {MathConcept} [inThis] - The ancestor in which the question takes
     *   place, as described above
     * @return {boolean} Whether this MathConcept is free in the specified
     *   ancestor (or its topmost ancestor if none is specified)
     */
    isFree ( inThis ) {
        // compute the free identifiers in me that an ancestor might bind
        const freeIdentifierNames = this.freeIdentifiers()
        // walk upwards to the appropriate ancestor and see if any bind any of
        // those identifiers; if so, I am not free in that ancestor
        for ( let ancestor = this ; ancestor ; ancestor = ancestor.parent() ) {
            if ( freeIdentifierNames.some( name => ancestor.binds( name ) ) )
                return false
            if ( ancestor == inThis ) break
        }
        // none bound me, so I am free
        return true
    }

    /**
     * Does a copy of the given MathConcept `concept` occur free anywhere in this
     * MathConcept?  More specifically, is there a descendant D of this MathConcept
     * such that `D.equals( concept )` and `D.isFree( inThis )`?
     * 
     * @param {MathConcept} concept - This function looks for copies of this
     *   MathConcept
     * @param {MathConcept} [inThis] - The notion of "free" is relative to this
     *   MathConcept, in the same sense of the `inThis` parameter to
     *   {@link MathConcept#isFree isFree()}
     * @return {boolean} True if and only if there is a copy of `concept` as a
     *   descendant of this MathConcept satisfying `.isFree( inThis )`
     * @see {@link MathConcept#isFree isFree()}
     */
    occursFree ( concept, inThis ) {
        return this.hasDescendantSatisfying( descendant =>
            descendant.equals( concept ) && descendant.isFree( inThis ) )
    }

    /**
     * A MathConcept A is free to replace a MathConcept B if no identifier free in A
     * becomes bound when B is replaced by A.
     * @param {MathConcept} original - The MathConcept to be replaced with this one
     * @param {MathConcept} [inThis] - The ancestor we use as a context in which to
     *   gauge bound/free identifiers, as in the `inThis` parameter to
     *   {@link MathConcept#isFree isFree()}.  If omitted, the context defaults to
     *   the top-level ancestor of `original`.
     * @return {boolean} True if this MathConcept is free to replace `original`,
     *   and false if it is not.
     */
    isFreeToReplace ( original, inThis ) {
        // this implementation is an exact copy of isFree(), with one exception:
        // while the free identifiers are computed from this MathConcept, freeness
        // is computed from original.
        const freeIdentifierNames = this.freeIdentifiers()
        for ( let ancestor = original ; ancestor ; ancestor = ancestor.parent() ) {
            if ( freeIdentifierNames.some( name => ancestor.binds( name ) ) )
                return false
            if ( ancestor == inThis ) break
        }
        return true
    }

    /**
     * Consider every free occurrence of `original` within this MathConcept, and
     * replace each with a copy of `replacement` if and only if `replacement` is
     * free to replace that instance.  Each instance is judged separately, so
     * there may be any number of replacements, from zero up to the number of
     * free occurrences of `original`.
     * 
     * @param {MathConcept} original - Replace copies of this MathConcept with
     *   copies of `replacement`
     * @param {MathConcept} replacement - Replace copies of `original` with
     *   copies of this MathConcept
     * @param {MathConcept} [inThis] - When judging free/bound identifiers, judge
     *   them relative to this ancestor context, in the same sense of the
     *   `inThis` parameter to {@link MathConcept#isFree isFree()}
     */
    replaceFree ( original, replacement, inThis ) {
        this.descendantsSatisfying(
            descendant => descendant.equals( original )
        ).forEach( instance => {
            if ( replacement.isFreeToReplace( instance, inThis ) )
                instance.replaceWith( replacement.copy() )
        } )
    }

    //////
    //
    //  Unique IDs
    //
    //////

    /**
     * We want the capability of assigning each MathConcept in a given hierarchy a
     * globally unique ID.  We therefore need a global place to store the
     * mapping of IDs to instances, and thus we create this Map in the MathConcept
     * class.
     * 
     * Each key in the map is an ID and the corresponding value is the instance
     * with that ID.  Each ID is a string.
     * 
     * This data structure should not be accessed by clients; it is private to
     * this class.  Use {@link MathConcept#instanceWithID instanceWithID()} and
     * {@link MathConcept#trackIDs trackIDs()} instead.
     * 
     * @see {@link MathConcept#instanceWithID instanceWithID()}
     * @see {@link MathConcept#trackIDs trackIDs()}
     */
    static IDs = new Map

    /**
     * Find a MathConcept instance from a given string ID.  This assumes that the
     * assignment of ID to MathConcept has been recorded in the global mapping in
     * {@link MathConcept#IDs IDs}, by the function
     * {@link MathConcept#trackIDs trackIDs()}.  If it has not been so recorded,
     * then this function will not find the instance and will return undefined.
     * 
     * Note that because this function is static, clients access it as
     * `MathConcept.instanceWithID("...")`.
     * 
     * @param {string} id - The MathConcept ID to look up
     * @return {MathConcept} The MathConcept that has the given ID, if any, or
     *   undefined if no MathConcept has the given ID
     * 
     * @see {@link MathConcept#IDs IDs()}
     * @see {@link MathConcept#trackIDs trackIDs()}
     */
    static instanceWithID ( id ) { return MathConcept.IDs.get( `${id}` ) }

    /**
     * The ID of this MathConcept, if it has one, or undefined otherwise.  An ID
     * is always a string; this is ensured by the
     * {@link MathConcept#setId setId()} function.
     * 
     * @return {string} The ID of this MathConcept, or undefined if there is none
     * 
     * @see {@link MathConcept#setId setID()}
     */
    ID () { return this.getAttribute( '_id' ) }

    /**
     * Set the ID of this MathConcept.  Note that this does not change the
     * global tracking of IDs, because one could easily call this function to
     * assign an already-in-use ID.  To ensure that the IDs in a hierarchy are
     * tracked, call {@link MathConcept#trackIDs trackIDs()}, and if that has
     * already been called, then to change a MathConcept's ID assignment, call
     * {@link MathConcept#changeID changeID()}.
     * 
     * @param {string} id - The new ID to assign.  If this is not a string, it
     *   will be converted into one.
     * 
     * @see {@link MathConcept#ID ID()}
     * @see {@link MathConcept#trackIDs trackIDs()}
     * @see {@link MathConcept#changeID changeID()}
     */
    setID ( id ) { this.setAttribute( '_id', `${id}` ) }

    /**
     * Store in the global {@link MathConcept#IDs IDs} mapping the association of
     * this MathConcept's ID with this MathConcept instance itself.  If the
     * parameter is set to true (the default), then do the same recursively to
     * all of its descendants.
     * 
     * Calling this function then enables you to call
     * {@link MathConcept#instanceWithID instanceWithID()} on any of the IDs of a
     * descendant and get that descendant in return.  Note that this does not
     * check to see if a MathConcept with the given ID has already been recorded;
     * it will overwrite any past data in the {@link MathConcept#IDs IDs} mapping.
     * 
     * This function also makes a call to
     * {@link MathConcept#trackConnections trackConnections()}, because IDs are
     * required in order for connections to exist, and enabling IDs almost
     * always coincides with enabling connections as well.
     * 
     * **Important:**
     * To prevent memory leaks, whenever a MathConcept hierarchy is no longer used
     * by the client, you should call {@link MathConcept#untrackIDs untrackIDs()}
     * on it.
     * 
     * @param {boolean} recursive - Whether to recursively track IDs of all
     *   child, grandchild, etc. MathConcepts.  (If false, only this MathConcept's
     *   ID is tracked, not those of its descendants.)
     * 
     * @see {@link MathConcept#IDs IDs}
     * @see {@link MathConcept#untrackIDs untrackIDs()}
     * @see {@link MathConcept#trackConnections trackConnections()}
     */
    trackIDs ( recursive = true ) {
        this.trackConnections()
        if ( this.hasAttribute( '_id' ) ) MathConcept.IDs.set( this.ID(), this )
        if ( recursive ) for ( let child of this._children ) child.trackIDs()
    }

    /**
     * This removes the ID of this MathConcept (and, if requested, all descendant
     * MathConcepts) from the global {@link MathConcept#IDs IDs} mapping.  It is the
     * reverse of {@link MathConcept#trackIDs trackIDs()}, and should always be
     * called once the client is finished using a MathConcept, to prevent memory
     * leaks.
     * 
     * Because connections use the ID system, any connections that this
     * MathConcept is a part of will also be severed, by a call to
     * {@link MathConcept#removeConnections removeConnections()}.
     * 
     * @param {boolean} recursive - Whether to recursively apply this function
     *   to all child, grandchild, etc. MathConcepts.  (If false, only this
     *   MathConcept's ID is untracked, not those of its descendants.)
     * 
     * @see {@link MathConcept#IDs IDs}
     * @see {@link MathConcept#trackIDs trackIDs()}
     * @see {@link MathConcept#clearIDs clearIDs()}
     */
    untrackIDs ( recursive = true ) {
        this.removeConnections()
        if ( this.hasAttribute( '_id' ) ) MathConcept.IDs.delete( this.ID() )
        if ( recursive ) for ( let child of this._children ) child.untrackIDs()
    }

    /**
     * Check whether this MathConcept's ID is currently tracked and associated
     * with this MathConcept itself.
     * 
     * @return {boolean} Whether the ID of this MathConcept is currently tracked
     *   by the global {@link MathConcept#IDs IDs} mapping *and* that it is
     *   associated, by that mapping, with this MathConcept
     * 
     * @see {@link MathConcept#IDs IDs}
     * @see {@link MathConcept#trackIDs trackIDs()}
     */
    idIsTracked () {
        return this.hasAttribute( '_id' )
            && this == MathConcept.instanceWithID( this.ID() )
    }

    /**
     * Remove the ID of this MathConcept and, if requested, all of its
     * descendants.  This does not change anything about the global
     * {@link MathConcept#IDs IDs} mapping, so if this MathConcept's IDs are
     * tracked, you should call {@link MathConcept#untrackIDs untrackIDs()} first.
     * 
     * Because connections use the ID system, any connections that this
     * MathConcept is a part of will also be severed, by a call to
     * {@link MathConcept#removeConnections removeConnections()}.
     * 
     * @param {boolean} recursive - Whether to clear IDs from all descendants of
     *   this MathConcept as well
     * 
     * @see {@link MathConcept#IDs IDs}
     * @see {@link MathConcept#untrackIDs untrackIDs()}
     */
    clearIDs ( recursive = true ) {
        this.removeConnections()
        this.clearAttributes( '_id' )
        if ( recursive ) for ( let child of this._children ) child.clearIDs()
    }

    /**
     * If a MathConcept wishes to change its ID, then we may need to update the
     * internal {@link MathConcept#IDs IDs} mapping.  The following function
     * changes the ID and updates that mapping if needed all in one action, to
     * make it easy for the client to change a MathConcept's ID, just by calling
     * this function.
     * 
     * If for some reason the change was not possible, then this function will
     * take no action and return false.  Possible reasons include:
     *  * the old ID isn't tracked in the {@link MathConcept#IDs IDs} mapping
     *  * the new ID is already associated with another MathConcept
     *  * the new ID is the same as the old ID
     * 
     * This function also updates *other* MathConcepts that connect to this one,
     * changing their connections to use this MathConcept's new ID, so that all
     * connections are preserved across the use of this function.
     * 
     * @param {string} newID - The ID to use as the replacement for this
     *   MathConcept's existing ID.  It will be treated as a string if it is not
     *   already one.
     * @return {boolean} True if the operation succeeded, false if it could not
     *   be performed (and thus no action was taken)
     */
    changeID ( newID ) {
        // verify that we can do the job:
        const oldID = this.ID()
        newID = `${newID}`
        if ( MathConcept.IDs.has( newID )
          || this != MathConcept.instanceWithID( oldID ) ) return false
        // change my ID in connections:
        for ( const connection of this.getConnections() )
            connection.handleIDChange( oldID, newID )
        // change my ID:
        MathConcept.IDs.delete( oldID )
        this.setID( newID )
        MathConcept.IDs.set( newID, this )
        return true
    }

    //////
    //
    //  Sending feedback
    //
    //////

    /**
     * This implementation of the feedback function is a stub.  It does nothing
     * except dump the data to the console.  However, it serves as the central
     * method that all MathConcepts should use to transmit feedback, so that when
     * this class is used in the LDE, which has a mechanism for transmitting
     * feedback messages to its clients, the LDE can override this
     * implementation with a real one, and all calls that use this central
     * channel will then be correctly routed.
     * 
     * Documentation will be forthcoming later about the required form and
     * content of the `feedbackData` parameter.
     * 
     * @param {Object} feedbackData - Any data that can be encoded using
     *   `JSON.stringify()` (or
     *   {@link predictableStringify predictableStringify()}), to be transmitted
     */
    static feedback ( feedbackData ) {
        console.log( 'MathConcept class feedback not implemented:', feedbackData )
    }

    //////
    //
    //  Connections
    //
    //////

    /**
     * Get the IDs of all connections into or out of this MathConcept.
     * 
     * @return {string[]} An array of all the IDs of all the connections into or
     *   out of this MathConcept.  These unique IDs can be used to get a
     *   {@link Connection Connection} object; see that class's
     *   {@link Connection#withID withID()} function.
     * @see {@link MathConcept#getConnections getConnections()}
     * @see {@link MathConcept#getConnectionIDsIn getConnectionIDsIn()}
     * @see {@link MathConcept#getConnectionIDsOut getConnectionIDsOut()}
     */
    getConnectionIDs () {
        return this.getAttributeKeys().filter( key =>
            key.substring( 0, 13 ) == '_conn target ' ||
            key.substring( 0, 13 ) == '_conn source ' )
        .map( key => key.substring( 13 ) )
    }
    
    /**
     * Get the IDs of all connections into this MathConcept.
     * 
     * @return {string[]} An array of all the IDs of all the connections into
     *   this MathConcept.  These unique IDs can be used to get a
     *   {@link Connection Connection} object; see that class's
     *   {@link Connection#withID withID()} function.
     * @see {@link MathConcept#getConnectionsIn getConnectionsIn()}
     * @see {@link MathConcept#getConnectionIDs getConnectionIDs()}
     * @see {@link MathConcept#getConnectionIDsOut getConnectionIDsOut()}
     */
    getConnectionIDsIn () {
        return this.getAttributeKeys().filter( key =>
            key.substring( 0, 13 ) == '_conn source ' )
        .map( key => key.substring( 13 ) )
    }
    
    /**
     * Get the IDs of all connections out of this MathConcept.
     * 
     * @return {string[]} An array of all the IDs of all the connections out of
     *   this MathConcept.  These unique IDs can be used to get a
     *   {@link Connection Connection} object; see that class's
     *   {@link Connection#withID withID()} function.
     * @see {@link MathConcept#getConnectionsOut getConnectionsOut()}
     * @see {@link MathConcept#getConnectionIDs getConnectionIDs()}
     * @see {@link MathConcept#getConnectionIDsIn getConnectionIDsIn()}
     */
    getConnectionIDsOut () {
        return this.getAttributeKeys().filter( key =>
            key.substring( 0, 13 ) == '_conn target ' )
        .map( key => key.substring( 13 ) )
    }

    /**
     * Get all connections into or out of this MathConcept, as
     * {@link Connection Connection} instances.  This function simply maps the
     * {@link Connection#withID withID()} function over the result of
     * {@link MathConcept#getConnectionIDs getConnectionIDs()}.
     * 
     * @return {Connection[]} An array of all the Connections into or out of
     *   this MathConcept.
     * @see {@link MathConcept#getConnectionIDs getConnectionIDs()}
     * @see {@link MathConcept#getConnectionsIn getConnectionsIn()}
     * @see {@link MathConcept#getConnectionsOut getConnectionsOut()}
     */
    getConnections () { return this.getConnectionIDs().map( Connection.withID ) }

    /**
     * Get all connections into this MathConcept, as
     * {@link Connection Connection} instances.  This function simply maps the
     * {@link Connection#withID withID()} function over the result of
     * {@link MathConcept#getConnectionIDsIn getConnectionIDsIn()}.
     * 
     * @return {Connection[]} An array of all the Connections into this
     *   MathConcept.
     * @see {@link MathConcept#getConnectionIDsIn getConnectionIDsIn()}
     * @see {@link MathConcept#getConnections getConnections()}
     * @see {@link MathConcept#getConnectionsOut getConnectionsOut()}
     */
    getConnectionsIn () { return this.getConnectionIDsIn().map( Connection.withID ) }

    /**
     * Get all connections out of this MathConcept, as
     * {@link Connection Connection} instances.  This function simply maps the
     * {@link Connection#withID withID()} function over the result of
     * {@link MathConcept#getConnectionIDsOut getConnectionIDsOut()}.
     * 
     * @return {Connection[]} An array of all the Connections out of this
     *   MathConcept.
     * @see {@link MathConcept#getConnectionIDsOut getConnectionIDsOut()}
     * @see {@link MathConcept#getConnections getConnections()}
     * @see {@link MathConcept#getConnectionsIn getConnectionsIn()}
     */
    getConnectionsOut () { return this.getConnectionIDsOut().map( Connection.withID ) }

    /**
     * Connect this MathConcept to another, called the *target,* optionally
     * attaching some data to the connection as well.  This function just calls
     * {@link Connection#create Connection.create()}, and is thus here just for
     * convenience.
     * 
     * @param {MathConcept} target - The target of the new connection
     * @param {string} connectionID - The unique ID to use for the new
     *   connection we are to create
     * @param {*} data - The optional data to attach to the new connection.  See
     *   the {@link Connection#create create()} function in the
     *   {@link Connection Connection} class for the acceptable formats of this
     *   data.
     * @return {Connection} A {@link Connection Connection} instance for the
     *   newly created connection between this MathConcept and the target.  This
     *   return value can be safely ignored, because the connection data is
     *   stored in the source and target MathConcepts, and is not dependent on the
     *   Connection object itself.  However, the return value will be false if
     *   the chosen connection ID is in use or if this MathConcept or the target
     *   does not pass {@link MathConcept#idIsTracked idIsTracked()}.
     */
    connectTo ( target, connectionID, data = null ) {
        return Connection.create( connectionID, this.ID(), target.ID(), data )
    }

    /**
     * Remove all connections into or out of this MathConcept.  This deletes the
     * relevant data from this MathConcept's attributes as well as those of the
     * MathConcepts on the other end of each connection.  For documentation on the
     * data format for this stored data, see the {@link Connection Connection}
     * class.
     * 
     * This function simply runs {@link Connection#remove remove()} on every
     * connection in {@link MathConcept#getConnections getConnections()}.
     * 
     * @see {@link Connection#remove remove()}
     * @see {@link MathConcept#getConnections getConnections()}
     */
    removeConnections () {
        this.getConnections().forEach( connection => connection.remove() )
    }

    /**
     * There are some situations in which a MathConcept hierarchy will have data
     * in it about connections, and yet those connections were not created with
     * the API in the {@link Connection Connection}s class.  For example, if a
     * MathConcept hierarchy has been saved in serialized form and then
     * deserialized at a later date.  Thus we need a way to place into the
     * {@link Connection#IDs IDs member of the Connection class} all the IDs of
     * the connections in any given MathConcept hierarchy.  This function does so.
     * In that way, it is very similar to {@link MathConcept#trackIDs trackIDs()}.
     * 
     * Connections are processed only at the source node, so that we do not
     * process each one twice.  Thus any connection into this MathConcept from
     * outside will not be processed by this function, but connections from this
     * one out or among this one's descendants in either direction will be
     * processed.
     * 
     * @return {boolean} True if and only if every connection ID that appers in
     *   this MathConcept and its descendants was able to be added to the global
     *   mapping in {@link Connection#IDs IDs}.  If any fail (because the ID was
     *   already in use), this returns false.  Even if it returns false, it
     *   still adds as many connections as it can to that global mapping.
     */
    trackConnections () {
        let success = true
        for ( const id of this.getConnectionIDsOut() ) {
            if ( Connection.IDs.has( id ) ) {
                success = false
            } else {
                Connection.IDs.set( id, this )
            }
        }
        for ( const child of this.children() ) {
            if ( !child.trackConnections() ) success = false
        }
        return success
    }

    /**
     * When replacing a MathConcept in a hierarchy with another, we often want to
     * transfer all connections that went into or out of the old MathConcept to
     * its replacement instead.  This function performs that task.
     * 
     * This function is merely a convenient interface that just calls
     * {@link Connection#transferConnections Connection.transferConnections()}
     * on your behalf.
     * 
     * @param {MathConcept} recipient - The MathConcept to which to transfer all of
     *   this one's connections
     * @see {@link Connection#transferConnections Connection.transferConnections()}
     */
    transferConnectionsTo ( recipient ) {
        return Connection.transferConnections( this, recipient )
    }

}
