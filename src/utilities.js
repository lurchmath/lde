
/**
 * @file Provides several useful utility functions that extend basic
 *   JavaScript functionality
 */

/**
 * A JSON stringification that is predictable.  The standard `JSON.stringify()`
 * can produce different outputs unpredictably, because there is no required
 * ordering on the key-value pairs.  This one requires keys to be output in
 * increasing string order, so it is predictable.
 * 
 * @param {*} obj - Any JavaScript value that is amenable to JSON encoding
 * @return {string} A JSON encoding that has the keys in the same order (that
 *   is, sorted in increasing alphabetical order) every time
 */
export const predictableStringify = ( obj ) => {
    // arrays
    if ( obj instanceof Array ) {
        return `[${obj.map( predictableStringify ).join( ',' )}]`
    }
    // atomics
    if ( !( obj instanceof Object ) ) {
        return JSON.stringify( obj )
    }
    // objects
    const keys = Object.keys( obj )
    keys.sort()
    const pair = ( key ) =>
        `${JSON.stringify( key )}:${predictableStringify( obj[key] )}`
    return `{${keys.map( pair ).join( ',' )}}`
}

/**
 * Whether two objects that are amenable to JSON encoding are structurally
 * equal.
 * 
 * @param {*} x - The first of the two objects; this must be amenable to JSON
 *   encoding
 * @param {*} y - The second of the two objects; this must be amenable to JSON
 *   encoding
 * @return {boolean} Whether the two objects are structurally equal
 */
JSON.equals = ( x, y ) => {
    // easy case
    if ( x === y ) return true
    // array case
    if ( ( x instanceof Array ) != ( y instanceof Array ) ) return false
    if ( x instanceof Array ) {
        if ( x.length != y.length ) return false
        for ( let i = 0 ; i < x.length ; i++ ) {
            if ( !JSON.equals( x[i], y[i] ) ) return false
        }
        return true
    }
    // atomic case
    if ( ( x instanceof Object ) != ( y instanceof Object ) ) return false
    if ( !( x instanceof Object ) ) return x === y
    // object case
    const xKeys = Object.keys( x )
    const yKeys = Object.keys( y )
    xKeys.sort()
    yKeys.sort()
    if ( !JSON.equals( xKeys, yKeys ) ) return false
    for ( let i = 0 ; i < xKeys.length ; i++ ) {
        if ( !JSON.equals( x[xKeys[i]], y[xKeys[i]] ) ) return false
    }
    return true
}

/**
 * A deep copy of a JSON structure, as another JSON structure.
 * 
 * Right now this is implemented in the easiest way; we simply serialize
 * and then deserialize using the built-in methods of `JSON.stringify()`
 * and `JSON.parse()`.  This is, however, not a very efficient
 * implementation, and could be improved later if needed.
 * 
 * @param {*} json - the structure to copy, which must be amenable to JSON
 *   encoding using `JSON.stringify()`
 * @return {*} if the input is an object, this is a deep copy; if the input
 *   was atomic, this is the same atomic
 */
JSON.copy = json => JSON.parse( JSON.stringify( json ) )

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
 * Extend the built-in JavaScript `Map` class with a deep copy method.  This
 * works only for Maps whose keys and values are all JSON-encodable.
 * 
 * @return {Map} A new map that is a deep copy of the original.
 */
Map.prototype.deepCopy = function () {
    return new Map( JSON.copy( [ ...this ] ) )
}

/**
 * Return a shallow copy of the array, but without one (specified) element.
 * 
 * If the given index is not a valid index into the array, then a shallow copy
 * of the array is returned with *no* change to its elements (all included).
 * 
 * @param {number} index - Which entry to remove, as a zero-based index
 * @return {Array} A shallow copy of the array, but without the element whose
 *   index was given
 */
Array.prototype.without = function ( index ) {
    if ( typeof( index ) != 'number' || (index|0) != index ) return this.slice()
    if ( index < 0 || index >= this.length ) return this.slice()
    return this.slice( 0, index ).concat( this.slice( index + 1 ) )
}

/**
 * The last element of the array, equivalent to `A[A.length-1]` (if the array is
 * named `A`)
 * 
 * @return {*} The last element of the array, or undefined if the array is
 *   empty
 */
Array.prototype.last = function () { return this[this.length-1] }
