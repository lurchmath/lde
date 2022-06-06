
export class SourceMap {

    constructor ( sourceText ) {
        this._source = sourceText
        this._modified = sourceText
        this._nextIndex = 0
        while ( sourceText.indexOf(
                SourceMap.markerWithIndex( this._nextIndex ) ) > -1 )
            this._nextIndex
        this._mapping = [ [ 0, this._source.length,
                            0, this._modified.length ] ]
        this._data = { }
    }

    source () { return this._source }

    modified () { return this._modified }

    dataForMarker ( marker ) { return this._data[marker] }

    nextModificationPosition () {
        return this._mapping[this._mapping.length - 1][2]
    }

    static markerText = 'SourceMapMarker'

    static markerWithIndex ( index ) {
        return `${SourceMap.markerText}${index}`
    }

    static isMarker ( text ) {
        const marker = SourceMap.markerText
        return text.substring( 0, marker.length ) == marker
            && /^[0-9]+$/.test( text.substring( marker.length ) )
    }

    nextMarker () {
        return SourceMap.markerWithIndex( this._nextIndex++ )
    }

    modify ( start, length, replacement, data ) {
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

    sourcePosition ( modifiedPosition ) {
        const row = this._mapping.find( row =>
            row[2] <= modifiedPosition && modifiedPosition <= row[3] )
        return row === undefined ? undefined :
               row[3] - row[2] == row[1] - row[0] ?
                   row[0] + modifiedPosition - row[2] : row[0]
    }

    modifiedPosition ( sourcePosition ) {
        const row = this._mapping.find( row =>
            row[0] <= sourcePosition && sourcePosition <= row[1] )
        return row === undefined ? undefined :
               row[3] - row[2] == row[1] - row[0] ?
                   row[2] + sourcePosition - row[0] : row[2]
    }

    sourceLineAndColumn ( line, column ) {
        return SourceMap.positionToLineAndColumn(
            this.sourcePosition( SourceMap.lineAndColumnToPosition(
                line, column, this._modified ) ),
            this._source
        )
    }

    modifiedLineAndColumn ( line, column ) {
        return SourceMap.positionToLineAndColumn(
            this.modifiedPosition( SourceMap.lineAndColumnToPosition(
                line, column, this._source ) ),
            this._modified
        )
    }

    static positionToLineAndColumn = ( position, text ) => {
        position = parseInt( position )
        if ( position > text.length || position < 0 ) return undefined
        const start = text.substring( 0, position )
        const lines = start.split( '\n' )
        return [ lines.length, lines[lines.length-1].length + 1 ]
    }

    static lineAndColumnToPosition = ( line, column, text ) => {
        line = parseInt( line )
        column = parseInt( column )
        const lines = text.split( '\n' )
        for ( let i = 0, totalSoFar = 0 ; i < lines.length ; i++ ) {
            if ( i + 1 == line )
                return column >= 1 && column <= lines[i].length ?
                    totalSoFar + column - 1 : undefined
            totalSoFar += lines[i].length + 1
        }
    }

    static debugCode ( code ) {
        const lines = code.split( '\n' )
        for ( let i = 0, totalSoFar = 0 ; i < lines.length ; i++ ) {
            const line = lines[i]
            console.log( `line${i+1}@char${totalSoFar}: ${line}` )
            totalSoFar += line.length + 1
        }
    }

}
