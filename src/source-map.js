
/**
 * A source map is an object that tracks a specific type of correspondence
 * between two strings, reminiscent of the source maps used when compiling
 * or minifying JavaScript code for use in web browsers.  The first string,
 * called the {@link SourceMap#source source text}, is the original text
 * (which can be computer code or any other text), and remains unchanged
 * throughout the life of the source map object.  The second string, called
 * the {@link SourceMap#modified modified text} begins life equal to the
 * source text, but can be changed thereafter with
 * {@link SourceMap#modify modifications/replacements}.
 * 
 * The purpose of the source map is to keep track of which sequences of
 * characters in the source text correspond to which sequences of characters
 * in the modified text, so that any position in one string can be converted
 * to the corresponding position in the other string.
 * 
 * In a simple example, let's say we have the source text "I wonder what 5+9
 * equals."  Then we run on that text an algorithm that finds all occurrences
 * of simple arithmetic expressions and computes them, replacing the original
 * expression with its result, in this case producing "I wonder what 14
 * equals."  The source map would represent the following facts:
 * 
 *  * Characters 0 through 13 in the source text correspond to characters 0
 *    through 13 in the modified text.  (They are "I wonder what " in both
 *    cases.)
 *  * Characters 14 through 16 in the source text ("5+9") correspond to
 *    characters 14 through 15 in the modified text ("14").
 *  * Characters 17 through 24 in the source text correspond to characters 16
 *    through 23 in the modified text.  (They are " equals." in both cases.)
 * 
 * In general, a source map will always be an array of such correspondences,
 * each of which is a quadruple of integer indices, two into the source text
 * and two into the modified text.  Such data would be stored internally as
 * that array of quadruples,
 * 
 * ```json
 * [
 *     [  0, 13,  0, 13 ],
 *     [ 14, 16, 14, 15 ],
 *     [ 17, 24, 16, 23 ]
 * ]
 * ```
 * 
 * Quadruples at even indices correspond to unmodified sequences of characters
 * while quadruples at odd indices correspond to modified sequences of
 * characters.  In the list above, entries 0 and 2 are for unmodified text and
 * entry 1 is the only modified text.
 * 
 * To use this class, the user creates an instance, passing the original
 * (unmodified) source text.  Then the user can do modifications (that is,
 * replcements) on the source text by calling {@link SourceMap#modify
 * modify()}, taking care to make such calls in increasing order of index into
 * the modified text.  (See documentation for {@link SourceMap#modify
 * modify()}, below.)  At any point, functions such as
 * {@link SourceMap#sourcePosition sourcePosition()},
 * {@link SourceMap#modifiedPosition modifiedPosition()},
 * {@link SourceMap#sourceLineAndColumn sourceLineAndColumn()}, and
 * {@link SourceMap#modifiedLineAndColumn modifiedLineAndColumn()} are
 * available to perform lookup in either direction (source to modified, or the
 * reverse).
 */
export class SourceMap {

    /**
     * Construct a new source map with the given source text.  The modified
     * text will be initialized to the same text, and the initial mapping will
     * map all characters in the source text to their corresponding position
     * in the modified text, and vice versa.
     * 
     * @param {*} sourceText the string to be used as the source text of this
     *   source map (although any object can be passed, and will be converted
     *   to a string)
     * 
     * @see {@link SourceMap#source source()}
     * @see {@link SourceMap#modified modified()}
     */
    constructor ( sourceText ) {
        this._source = `${sourceText}`
        this._modified = this._source
        this._nextIndex = 0
        while ( this._source.indexOf(
                SourceMap.markerWithIndex( this._nextIndex ) ) > -1 )
            this._nextIndex
        this._mapping = [ [ 0, this._source.length - 1,
                            0, this._modified.length - 1 ] ]
        this._data = { }
    }

    /**
     * Get the source text given at the time this source map was constructed.
     * This class provides no API for altering the source text, so it should
     * be the same any time this function is called.
     * 
     * @returns {string} the source text given at construction time
     */
    source () { return this._source }

    /**
     * Get the modified text for this source map.  At construction time, this
     * will be the same as the source text, but can change via calls to
     * {@link SourceMap.modify modify()}.
     * 
     * @returns {string} the modified text for this source map
     */
    modified () { return this._modified }

    /**
     * As discussed in the documentation for {@link SourceMap#modify
     * modify()}, modifications must be made in increasing order of position
     * in the modified text.  Thus at any point, we have a minimum index at
     * which the next modification could take place, so that it falls after
     * all modifications made so far.  This function returns that minimum
     * index.
     * 
     * For example, in the source map described at the top of this file (in
     * which "5+9" became "14" inside the source text), the next viable index
     * in the modified text where a modification could be made is immediately
     * after the text "14," that is, at index 16.
     * 
     * If no modifications have been made to the source text, this function
     * will return zero.
     * 
     * @returns {integer} the earliest index at which a modification could be
     *   added to this source map
     */
    nextModificationPosition () {
        return this._mapping[this._mapping.length - 1][2]
    }

    // For internal use by nextMarker and isMarker
    static markerText = 'SourceMapMarker'

    // For internal use by nextMarker
    static markerWithIndex ( index ) {
        return `${SourceMap.markerText}${index}`
    }

    /**
     * See the documentation for {@link SourceMap#modify modify()} and
     * {@link SourceMap#nextMarker nextMarker()} for an explanation of how
     * markers can be useful.  This function is a predicate for testing
     * whether an arbitrary string contains a marker.
     * 
     * @param {string} text the text to test whether it is a marker
     * @returns {boolean} whether the given text is a marker
     * 
     * @see {@link SourceMap#nextMarker nextMarker()}
     * @see {@link SourceMap#dataForMarker dataForMarker()}
     */
    static isMarker ( text ) {
        const marker = SourceMap.markerText
        return text.substring( 0, marker.length ) == marker
            && /^[0-9]+$/.test( text.substring( marker.length ) )
    }

    /**
     * See the documentation for {@link SourceMap#modify modify()} for an
     * explanation of how markers work.  That explanation mentions that it is
     * useful to have a sequence of markers, each of which is a unique snippet
     * of text that does not appear anywhere in the original source text.
     * This function can be used as a generator, returning a different string
     * each time it is called, none of which appeared in the original source
     * text.  In that way it can be used to generate markers that can be
     * passed as the `replacement` parameter to {@link SourceMap#modify
     * modfiy()}.
     * 
     * @returns {string} a new marker
     * 
     * @see {@link SourceMap#modify modify()}
     * @see {@link SourceMap.isMarker isMarker()}
     * @see {@link SourceMap#dataForMarker dataForMarker()}
     */
    nextMarker () {
        return SourceMap.markerWithIndex( this._nextIndex++ )
    }

    /**
     * Source map objects contain both a source text and a modified text,
     * which are equal at construction time.  But through one or more calls to
     * this function, the modified text can change, diverging from the source
     * text.  This function not only makes such modifications, but it records
     * where they were made, and any data associated with them, so that
     * queries can be made later about correspondences between the source and
     * modified text, as documented at the top of this file.
     * 
     * The first three parameters are straightforward, as documented below.
     * However, the fourth parameter (which is optional) requires additional
     * explanation.  When replacing a portion of the source text, it is
     * sometimes convenient to replace it not with text, but with arbitrary
     * data.  We support this more advanced usage as follows.
     * 
     *  * First, the newly inserted text cannot be arbitrary text, but should
     *    instead be a special marker that indicates the location where
     *    non-text data resides.  To create such markers, use the
     *    {@link SourceMap#nextMarker nextMarker()} function.
     *  * Second, the fourth parameter (`data`) should be provided, and it can
     *    be any JavaScript object amenable to JSON encoding, which will be
     *    stored in this object for later querying.
     *  * Later, when the client processes the modified text, upon
     *    encountering a marker (see {@link SourceMap.isMarker isMarker()})
     *    and desiring to know what data it represents, the client can find
     *    out with a call to {@link SourceMap#dataForMarker dataForMarker()}.
     * 
     * For example, let's say our source text was "Get me employee #16" and
     * we wanted to replace "employee #16" with the full data for that
     * employee, which is not text data, but rather something more complex,
     * such as `{ name:'Henrietta', age:35, ... }`.  Assuming we have that
     * data in an object `obj`, we could make a call like the following.
     * 
     * ```js
     * sourcemap.modify( 7, 12, sourcemap.nextMarker(), obj )
     * ```
     * 
     * Notes:
     * 
     *  1. When passing data as the optional fourth parameter, you must pass
     *     `sourcemap.nextMarker()` as the third parameter, because data is
     *     stored internally only associated with markers, and cannot be
     *     retrieved later otherwise.
     *  2. The starting index documented below is in the modified text, not
     *     the source text, but if this is inconvenient for you, simply make
     *     use of the {@link SourceMap#modifiedPosition modifiedPosition()}
     *     function to convert what you have to what you need.
     *  3. Modifications must be made in increasing order of index in the
     *     modified text.  For example, if you have a replacement to do on
     *     characters 5 through 10 and another to do on characters 50 through
     *     70, you must do them in that order, not the reverse.  This class
     *     does not support modifications in arbitrary order.
     * 
     * @param {integer} start the starting index, in the modified text, where
     *   this next modification should be recorded
     * @param {integer} length the length of the text to be replaced, starting
     *   at the index `start`
     * @param {string} replacement the text with which to replace the chosen
     *   portion of the source text
     * @param [Object] data arbitrary JSON data to store in the modified
     *   text, as documented above
     */
    modify ( start, length, replacement, data = { } ) {
        const end = start + length - 1
        const last = this._mapping[this._mapping.length-1]
        const origStart = this.sourcePosition( start )
        if ( origStart < last[0] || origStart > last[1] )
            throw new Error( 'Modifications must be done in increasing order' )
        const origEnd = this.sourcePosition( end )
        if ( origEnd < last[0] || origEnd > last[1] )
            throw new Error( 'Modifications must be done in increasing order' )
        this._mapping.pop()
        this._mapping.push( [ last[0], origStart - 1, last[2], start - 1 ] )
        this._mapping.push( [ origStart, origEnd,
                              start, start + replacement.length - 1 ] )
        this._mapping.push( [
            origEnd + 1, last[1], start + replacement.length,
            last[3] - ( end - start - replacement.length + 1 ) ] )
        const original = this._modified.substring( start, start + length )
        this._modified = this._modified.substring( 0, start )
                       + replacement
                       + this._modified.substring( start + length )
        if ( SourceMap.isMarker( replacement ) )
            this._data[replacement] = { original, ...data }
    }

    /**
     * See the documentation for {@link SourceMap#modify modify()} for an
     * explanation of how markers work.  That explanation mentions that
     * arbitrary data can be associated with a marker as part of a call to the
     * {@link SourceMap#modify modify()} function.  To later query the data
     * associated with a given marker, use this function.
     * 
     * @param {string} marker the text for the marker whose data should be
     *   looked up
     * @returns {Object} the data associated with the marker, as a JavaScript
     *   object amenable to JSON encoding
     * 
     * @see {@link SourceMap#modify modify()}
     * @see {@link SourceMap.isMarker isMarker()}
     * @see {@link SourceMap#nextMarker nextMarker()}
     */
    dataForMarker ( marker ) { return this._data[marker] }

    /**
     * The major purpose of the SourceMap class is to track the correspondence
     * of character positions between its source text and its modified text.
     * This function can be used to do a lookup from the latter to the former;
     * you provide a character position in the modified text and it returns the
     * corresponding position in the source text.
     * 
     * If the character position sits inside a section of modified text, there
     * may not be an exact correspondence of which character in the source
     * text relates to it; for example, in the source map mentioned at the top
     * of this documentation page, which characters in "5+9" correspond to
     * each character in the text "14?"  In such cases, the first character in
     * the corresponding *section* is returned.  So both characters in "14"
     * would be said to correspond to the first character in "5+9."
     * 
     * If the character position sits inside a section of unmodified text,
     * then there is an exact copy of that unmodified text in the source text,
     * and thus the corresponding position with it will be returned.
     * 
     * If an invalid index is provided, undefined is returned.  Indices into
     * both the source and modified texts are zero-based, so the first valid
     * index is 0 and the last is the length of the text minus 1.
     * 
     * @param {integer} modifiedPosition the position in the modified text for
     *   which a lookup should be done in the source text
     * @returns {integer} the position in the source text corresponding to the
     *   given position in the modified text
     * 
     * @see {@link SourceMap#sourceLineAndColumn sourceLineAndColumn}
     * @see {@link SourceMap#modifiedPosition modifiedPosition}
     * @see {@link SourceMap#modifiedLineAndColumn modifiedLineAndColumn}
     */
    sourcePosition ( modifiedPosition ) {
        const row = this._mapping.find( row =>
            row[2] <= modifiedPosition && modifiedPosition <= row[3] )
        return row === undefined ? undefined :
               row[3] - row[2] == row[1] - row[0] ?
                   row[0] + modifiedPosition - row[2] : row[0]
    }

    /**
     * See the documentation for {@link SourceMap#sourcePosition
     * sourcePosition()}; this function is (approximately) the inverse to that
     * function.  The only difference is, as documented in that function, we
     * cannot map precisely each character within a section of modified text,
     * and thus we map to the first charcter in the corresponding range.  For
     * example, in the source map mentioned at the top of this page, each
     * character in the source text "5+9" would map to the first character in
     * the modified text "14."
     * 
     * @param {integer} sourcePosition the position in the source text for
     *   which a lookup should be done in the modified text
     * @returns {integer} the position in the modified text corresponding to
     *   the given position in the source text
     * 
     * @see {@link SourceMap#modifiedLineAndColumn modifiedLineAndColumn}
     * @see {@link SourceMap#sourcePosition sourcePosition}
     * @see {@link SourceMap#sourceLineAndColumn sourceLineAndColumn}
     */
    modifiedPosition ( sourcePosition ) {
        const row = this._mapping.find( row =>
            row[0] <= sourcePosition && sourcePosition <= row[1] )
        return row === undefined ? undefined :
               row[3] - row[2] == row[1] - row[0] ?
                   row[2] + sourcePosition - row[0] : row[2]
    }

    /**
     * See the documentation for {@link SourceMap#sourcePosition
     * sourcePosition()}; this function behaves similarly, except that it
     * takes as input a line number and column number in the modified text,
     * and returns a line number and column number in the source text.
     * 
     * Unlike character indices, line and column numbers start counting at 1,
     * so the first character in the text (at index 0) would be in line 1 and
     * at column 1.
     * 
     * @param {integer} line the line number in the modified text whose
     *   position in the source text should be looked up
     * @param {integer} column the column number in the modified text whose
     *   position in the source text should be looked up
     * @returns {Array} a pair of integers, the line and column number in the
     *   source text that correspond to the given line and column number in
     *   the modified text
     * 
     * @see {@link SourceMap#sourcePosition sourcePosition}
     * @see {@link SourceMap#modifiedLineAndColumn modifiedLineAndColumn}
     * @see {@link SourceMap#modifiedPosition modifiedPosition}
     */
    sourceLineAndColumn ( line, column ) {
        return SourceMap.positionToLineAndColumn(
            this.sourcePosition( SourceMap.lineAndColumnToPosition(
                line, column, this._modified ) ),
            this._source
        )
    }

    /**
     * See the documentation for {@link SourceMap#modifiedPosition
     * modifiedPosition()}; this function behaves similarly, except that it
     * takes as input a line number and column number in the source text,
     * and returns a line number and column number in the modified text.
     * 
     * Unlike character indices, line and column numbers start counting at 1,
     * so the first character in the text (at index 0) would be in line 1 and
     * at column 1.
     * 
     * @param {integer} line the line number in the source text whose position
     *   in the modified text should be looked up
     * @param {integer} column the column number in the modified text whose
     *   position in the source should be looked up
     * @returns {Array} a pair of integers, the line and column number in the
     *   modified text that correspond to the given line and column number in
     *   the source text
     * 
     * @see {@link SourceMap#sourceLineAndColumn sourceLineAndColumn}
     * @see {@link SourceMap#modifiedPosition modifiedPosition}
     * @see {@link SourceMap#modifiedPosition modifiedPosition}
     */
    modifiedLineAndColumn ( line, column ) {
        return SourceMap.positionToLineAndColumn(
            this.modifiedPosition( SourceMap.lineAndColumnToPosition(
                line, column, this._source ) ),
            this._modified
        )
    }

    // For internal use by sourceLineAndColumn and modifiedLineAndColumn
    static positionToLineAndColumn = ( position, text ) => {
        if ( position > text.length || position < 0
          || typeof( position ) != 'number' ) return undefined
        const start = text.substring( 0, position )
        const lines = start.split( '\n' )
        return [ lines.length, lines[lines.length-1].length + 1 ]
    }

    // For internal use by sourceLineAndColumn and modifiedLineAndColumn
    static lineAndColumnToPosition = ( line, column, text ) => {
        const lines = text.split( '\n' )
        for ( let i = 0, totalSoFar = 0 ; i < lines.length ; i++ ) {
            const countNewline = i < lines.length - 1 ? 1 : 0
            if ( i + 1 == line )
                return column >= 1
                    && column <= lines[i].length + countNewline ?
                       totalSoFar + column - 1 : undefined
            totalSoFar += lines[i].length + countNewline
        }
    }

    /**
     * A debugging routine useful when working with code in which you care
     * about the specific character indices and/or line and column numbers.
     * Call this routine to print the code to the console, with a line and
     * character number added at the start of each line, using the format
     * `L_C_:` with the blanks replaced by line and character numbers,
     * respectively.
     * 
     * For example, `"function ( x ) {\n\treturn 3;\n}"` would be printed
     * as follows.  Note that these are *not* line and *column* numbers,
     * but rather line numbers and *character indices.*
     * 
     * ```
     * L1C0: function ( x ) {
     * L2C17:        return 3;
     * L3C27: }
     * ```
     * 
     * @param {string} code arbitrary text to be displayed on the console
     *   (typically some kind of code, such as putdown notation or JSON)
     */
    static debugCode ( code ) {
        const lines = code.split( '\n' )
        for ( let i = 0, totalSoFar = 0 ; i < lines.length ; i++ ) {
            const line = lines[i]
            console.log( `L${i+1}C${totalSoFar}: ${line}` )
            totalSoFar += line.length + 1
        }
    }

}
