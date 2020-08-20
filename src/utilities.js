
/**
 * @file Provides several useful utility functions that extend basic
 *   JavaScript functionality
 */

/**
 * A JSON stringification that is predictable.  The standard `JSON.stringify()`
 * can produce different outputs unpredictably, because there is no required
 * ordering on the key-value pairs.  This one requires keys to be output in
 * increasing string order, so it is predictable.
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
    return new Map( JSON.parse( JSON.stringify( [ ...this ] ) ) )
}
