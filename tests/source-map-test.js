
// We import this because it's the subject of this test suite.
import { SourceMap } from '../src/source-map.js'

// Test suites begin here.

describe( 'SourceMap module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( SourceMap ).to.be.ok
    } )

} )

describe( 'SourceMap construction', () => {

    it( 'Can be done from any data, which becomes the source', () => {
        // This test also verifies that the following members behave
        // correctly at construction time: source(), modified(),
        // nextModificationPosition(), nextMarker()
        let map
        // string (the intended use case )
        map = new SourceMap( 'pretend this is source code' )
        expect( map ).to.be.instanceOf( SourceMap )
        expect( map.source() ).to.equal( 'pretend this is source code' )
        expect( map.source() ).to.equal( map.modified() )
        expect( map.nextModificationPosition() ).to.equal( 0 )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker0' )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker1' )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker2' )
        // integer (although we wouldn't do this, it's just a silly test)
        map = new SourceMap( 500 )
        expect( map ).to.be.instanceOf( SourceMap )
        expect( map.source() ).to.equal( '500' )
        expect( map.source() ).to.equal( map.modified() )
        expect( map.nextModificationPosition() ).to.equal( 0 )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker0' )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker1' )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker2' )
        // object (although we wouldn't do this, it's just a silly test)
        map = new SourceMap( { } )
        expect( map ).to.be.instanceOf( SourceMap )
        expect( map.source() ).to.equal( '[object Object]' )
        expect( map.source() ).to.equal( map.modified() )
        expect( map.nextModificationPosition() ).to.equal( 0 )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker0' )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker1' )
        expect( map.nextMarker() ).to.equal( 'SourceMapMarker2' )
    } )

} )

describe( 'SourceMap static members', () => {

    it( 'isMarker correctly identifies markers', () => {
        expect( SourceMap.isMarker( 'foo' ) ).to.equal( false )
        expect( SourceMap.isMarker( 'SourceMapMarker' ) ).to.equal( false )
        expect( SourceMap.isMarker( 'SourceMapMarker30' ) ).to.equal( true )
        expect( SourceMap.isMarker( 'SourceMapMarker0' ) ).to.equal( true )
        expect( SourceMap.isMarker( 'SourceMapMarker999' ) ).to.equal( true )
    } )

    it( 'positionToLineAndColumn does correct conversions', () => {
        const exampleText = `
Four score and seven years ago,
our fathers brought forth
on this continent a new nation,
...`
        expect( SourceMap.positionToLineAndColumn( 0, exampleText ) )
            .to.eql( [ 1, 1 ] )
        expect( SourceMap.positionToLineAndColumn( 1, exampleText ) )
            .to.eql( [ 2, 1 ] )
        expect( SourceMap.positionToLineAndColumn( 10, exampleText ) )
            .to.eql( [ 2, 10 ] )
        expect( SourceMap.positionToLineAndColumn( 33, exampleText ) )
            .to.eql( [ 3, 1 ] )
        expect( SourceMap.positionToLineAndColumn( 43, exampleText ) )
            .to.eql( [ 3, 11 ] )
        expect( SourceMap.lineAndColumnToPosition( 1, 1, exampleText ) )
            .to.equal( 0 )
        expect( SourceMap.lineAndColumnToPosition( 2, 1, exampleText ) )
            .to.equal( 1 )
        expect( SourceMap.lineAndColumnToPosition( 2, 10, exampleText ) )
            .to.equal( 10 )
        expect( SourceMap.lineAndColumnToPosition( 3, 1, exampleText ) )
            .to.equal( 33 )
        expect( SourceMap.lineAndColumnToPosition( 3, 11, exampleText ) )
            .to.equal( 43 )
    } )

    it( 'debugCode prints code as its documentation states', () => {
        // save old console.log so we can put it back later
        const orig = console.log

        // modify console.log to record everything it sees
        let logOfTheLog
        const reset = () => logOfTheLog = [ ]
        const add = text => logOfTheLog.push( text )
        const check = () => logOfTheLog
        console.log = add

        // check to be sure a one-liner is printed correctly
        reset()
        SourceMap.debugCode( 'one liner' )
        expect( check() ).to.eql( [ 'L1C0: one liner' ] )

        // check to be sure a many-liner is printed correctly
        const exampleText = `
Four score and seven years ago,
our fathers brought forth
on this continent a new nation,
...`
        reset()
        SourceMap.debugCode( exampleText )
        expect( check() ).to.eql( [
            'L1C0: ',
            'L2C1: Four score and seven years ago,',
            'L3C33: our fathers brought forth',
            'L4C59: on this continent a new nation,',
            'L5C91: ...'
        ] )

        // put console.log back to what it was
        console.log = orig
    } )

} )

describe( 'SourceMap converting positions, lines, and columns', () => {

    // TO DO:
    // modify
    // sourcePosition
    // modifiedPosition
    // sourceLineAndColumn
    // modifiedLineAndColumn
    
} )

describe( 'SourceMap storing data in markers', () => {
    
    // TO DO:
    // modify
    // dataForMarker

} )
