
/**
 * A set of generic utility functions used in this project.
 * 
 * @module Utilities
 */

/**
 * Create a script element to load a script from the given URL, append that
 * script element to the page's head, and notify us (via a returned `Promise`)
 * when the script completes loading successfully or fails with an error.
 * 
 * Example use:
 * ```
 * loadScript( 'https://some.cdn.org/script.js' ).then( () => {
 *     // Run code that depends on the script having loaded.
 * } )
 * ```
 * 
 * Note that if this function has already been called on this URL, so that there
 * already is a script tag with this source, then the promise resolves
 * immediately without doing anything first.
 * 
 * @param {String} url - URL of the script to load
 * @returns {Promise} a promise that is resolved if the script finishes loading
 *   or rejected if the script encounters an error
 * @function
 */
export const loadScript = url =>
    Array.from( document.head.querySelectorAll( 'script' ) ).some(
        script => script.getAttribute( 'src' ) == url ) ?
    Promise.resolve() :
    new Promise( ( resolve, reject ) => {
        const scriptTag = document.createElement( 'script' )
        document.head.append( scriptTag )
        scriptTag.setAttribute( 'defer', true )
        scriptTag.setAttribute( 'referrerpolicy', 'origin' )
        scriptTag.addEventListener( 'load', resolve )
        scriptTag.addEventListener( 'error', reject )
        scriptTag.setAttribute( 'src', url )
    } )

/**
 * From any JavaScript object, we can create another object by first
 * constructing a new instance of the Object prototype, then copying over all of
 * the "own" properties from the original object (by reference).  This is like
 * the original object, but without its prototype or any other inherited data or
 * methods.  This function does that.
 * 
 * @param {Object} object - any JavaScript object
 * @returns {Object} a shallow copy of the original object, but without copying
 *   its prototype information
 * @function
 */
export const copyWithoutPrototype = object => {
    const result = new Object()
    for ( let key in object )
        if ( object.hasOwnProperty( key ) )
            result[key] = object[key]
    return result
}

/**
 * Return the URL for this app.  It is taken directly from the browser's
 * navigation bar, but it excludes any query string that may be present.
 * It will be of the form `protocol://domain.name/path/to/file.html`.
 *
 * @function
 * @see {@link module:ImportFromURL.autoOpenLink autoOpenLink()}
 */
export const appURL = () => {
    const result = window.location.protocol + '//'
                 + window.location.host + window.location.pathname
    return result.endsWith( '/' ) ? result : result + '/'
}

/**
 * Escape a string so that it can be safely inserted into an HTML document and
 * still represent the plain text within the given string (not interpreting the
 * string as HTML itself).  For example, the string `"x < a and a > b"` should
 * appear exactly that way in the rendered HTML, meaning that the `<` and `>`
 * will need to be escaped so that `"<a and a>"` does not appear to be a tag.
 * 
 * @param {string} text - text to escape for insertion into HTML
 * @returns {string} the same text, but with the characters `"&"`, `"<"`, `">"`,
 *   `"'"`, and `'"'` replaced with character references instead
 * @function
 */
export const escapeHTML = ( text = '' ) =>
    text.replaceAll( '&', '&amp;' )
        .replaceAll( '<', '&lt;' )
        .replaceAll( '>', '&gt;' )
        .replaceAll( '"', '&quot;' )
        .replaceAll( "'", '&#039;' )

/**
 * The following function takes as input an string containing HTML code and
 * removes from it all script tags, so that the code can be used safely within
 * the app itself, knowing that no malicious code will be executed.
 * 
 * @param {string} html - the HTML code from which to remove script tags
 * @returns {string} the same HTML code, but with all script tags removed
 * @function
 */
export const removeScriptTags = html => {
    const regex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
    return html.replace( regex, '' )
}

/**
 * This function makes it easy to construct two-column tables of HTML content,
 * which is something that several types of {@link module:Atoms.Atom Atoms} will
 * want to do.  The arguments to the function are the rows of the table, and
 * they are treated as follows.
 * 
 *  * Any string is treated as the content for a row of the table spanning both
 *    columns (using `colspan`) and in bold font.
 *  * An array of strings containing just one entry is treated the same as a
 *    single string.
 *  * An array of two strings is treated as the contents of the two cells in
 *    the row.
 *  * An array of three strings is treated as two rows, first a two-cell row,
 *    and then an optional error row (only if the third entry is not falsy) that
 *    places the error message in red font in the second cell.
 * 
 * Example use:
 * 
 * ```js
 * simpleHTMLTable(
 *     'Here is the information you entered:',
 *     [ 'Your name:', 'Frederick the Great' ],
 *     [ 'Your age:', '42' ],
 *     [ 'Your favorite color:', color,
 *       !isColor(color) && 'That is not a valid color.' ]
 * )
 * ```
 * 
 * @param  {...any} rows - the data representing the rows of the table to construct
 * @returns {string} the HTML code for the table
 * @function
 */
export const simpleHTMLTable = ( ...rows ) => {
    let result = '<table><colgroup><col><col></colgroup>'
    const row = inside => `<tr>${removeScriptTags( inside )}</tr>`
    const cell = inside => `<td>${removeScriptTags( inside )}</td>`
    const bigCell = inside =>
        `<td colspan='2'><b>${removeScriptTags( inside )}</b></td>`
    const error = inside =>
        `<td><font color=red>${removeScriptTags( inside )}</font></td>`
    rows.forEach( rowData => {
        if ( typeof( rowData ) == 'string' ) {
            result += row( bigCell( rowData ) )
        } else if ( rowData.length == 1 ) {
            result += row( bigCell( rowData[0] ) )
        } else if ( rowData.length == 2 ) {
            result += row( cell( rowData[0] ) + cell( rowData[1] ) )
        } else if ( rowData.length == 3 ) {
            result += row( cell( rowData[0] ) + cell( rowData[1] ) )
            if ( rowData[2] ) result += row( cell( '' ) + error( rowData[2] ) )
        }
    } )
    result += '</table>'
    return result
}

/**
 * Given an ordered set of HTML Nodes in an array, and a node in the same
 * document, return just the subset of `nodes` that appear before `point`.
 * Because the given set of nodes are in order, this subset will always be an
 * initial segment of the given array.  It can be empty (if none precede `point`)
 * and it can be the whole array (if all preceded `point`).
 * 
 * While this could be done with a simple array filter, that could be slow on
 * larger arrays; this uses a binary search.  Furthermore, node comparisons are
 * a tedious process that uses an enum, so this function is simpler.
 * 
 * @param {Node[]} nodes - ordered array of Nodes to filter
 * @param {Node} point - the node that will determine which subset of `nodes`
 *   gets rerturned
 * @returns {Node[]} some initial segment of `nodes`, including precisely those
 *   that appear before `point`
 * @function
 */
export const onlyBefore = ( nodes, point ) => {
    const lt = ( a, b ) => {
        const comparison = a.compareDocumentPosition( b )
        if ( ( comparison & Node.DOCUMENT_POSITION_FOLLOWING ) // b follows a
          || ( comparison & Node.DOCUMENT_POSITION_CONTAINED_BY ) ) // a contains b
            return true
        if ( ( comparison & Node.DOCUMENT_POSITION_PRECEDING ) // b precedes a
          || ( comparison & Node.DOCUMENT_POSITION_CONTAINS ) // b contains a
          || ( comparison == 0 ) ) // a is the same node as b
            return false
        throw new Error( 'Cannot compare document positions' )
    }
    try {
        if ( nodes.length == 0 || !lt( nodes[0], point ) ) return [ ]
        if ( lt( nodes[nodes.length-1], point ) ) return nodes
        let indexLT = 0
        let indexGE = nodes.length - 1
        while ( indexLT < indexGE - 1 ) {
            const midIndex = Math.floor( ( indexLT + indexGE ) / 2 )
            if ( lt( nodes[midIndex], point ) ) indexLT = midIndex
            else indexGE = midIndex
        }
        return Array.from( nodes ).slice( 0, indexGE )
    } catch ( e ) {
        console.log( 'DEBUG:', e )
        return nodes
    }
}

/**
 * Given a DOM Node, find the TinyMCE editor containing it.
 * 
 * @param {Node} node - HTML node for which to find the editor
 * @returns {tinymce.Editor} the editor whose document contains the given node
 * @function
 */
export const editorForNode = node => {
    const allEditors = tinymce.get()
    for ( let i = 0 ; i < allEditors.length ; i++ )
        if ( allEditors[i].getDoc() == node.ownerDocument )
            return allEditors[i]
    return null
}

/**
 * Call a function on each element in an array, just like `array.forEach()`
 * would do, except use a zero-second timeout between each call.
 * 
 * @param {Function} func - the function to call for each element
 * @param {any[]} array - the array to iterate over
 * @param {number} [timeout=0] - the number of milliseconds to wait between calls
 * @function
 */
Array.prototype.forEachWithTimeout = function( func, timeout = 0 ) {
    if ( this.length == 0 ) return
    func( this[0] )
    setTimeout( () =>
        this.slice(1).forEachWithTimeout( func, timeout ), timeout )
}

/**
 * TinyMCE sometimes stores elements off screen, but still part of the document,
 * so if we search for elements by selector, we will find them, even though they
 * are invisible and should not be taken into account as part of the user's
 * document content.  This function checks to see if a given DOM nodes is really
 * a visible, relevant part of the document or not.
 * 
 * @param {Node} node - the node to test
 * @returns {boolean} true if the node is on screen (and "real")
 */
export const isOnScreen = node => node.parentNode &&
    !node.parentNode.classList.contains( 'mce-offscreen-selection' )
