
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

    it( 'Should work on a small example', () => {
        // create the source map
        const sm = new SourceMap( 'just two\nlines' )

        // test five positions, two invalid and three valid:
        expect( sm.sourcePosition( -1 ) ).to.be.undefined
        expect( sm.sourcePosition( 0 ) ).to.equal( 0 )
        expect( sm.sourcePosition( 10 ) ).to.equal( 10 )
        expect( sm.sourcePosition( 13 ) ).to.equal( 13 )
        expect( sm.sourcePosition( 14 ) ).to.be.undefined
        // test five positions, two invalid and three valid:
        expect( sm.modifiedPosition( -1 ) ).to.be.undefined
        expect( sm.modifiedPosition( 0 ) ).to.equal( 0 )
        expect( sm.modifiedPosition( 10 ) ).to.equal( 10 )
        expect( sm.modifiedPosition( 13 ) ).to.equal( 13 )
        expect( sm.modifiedPosition( 14 ) ).to.be.undefined
        // test line-col pairs, again, some valid, some invalid:
        expect( sm.sourceLineAndColumn( 0, 1 ) ).to.be.undefined
        expect( sm.sourceLineAndColumn( 1, 1 ) ).to.eql( [ 1, 1 ] )
        expect( sm.sourceLineAndColumn( 1, 9 ) ).to.eql( [ 1, 9 ] )
        expect( sm.sourceLineAndColumn( 1, 10 ) ).to.be.undefined
        expect( sm.sourceLineAndColumn( 2, 1 ) ).to.eql( [ 2, 1 ] )
        expect( sm.sourceLineAndColumn( 2, 5 ) ).to.eql( [ 2, 5 ] )
        expect( sm.sourceLineAndColumn( 2, 6 ) ).to.be.undefined
        expect( sm.sourceLineAndColumn( 3, 1 ) ).to.be.undefined
        // same tests in reverse direction of lookup:
        expect( sm.modifiedLineAndColumn( 0, 1 ) ).to.be.undefined
        expect( sm.modifiedLineAndColumn( 1, 1 ) ).to.eql( [ 1, 1 ] )
        expect( sm.modifiedLineAndColumn( 1, 9 ) ).to.eql( [ 1, 9 ] )
        expect( sm.modifiedLineAndColumn( 1, 10 ) ).to.be.undefined
        expect( sm.modifiedLineAndColumn( 2, 1 ) ).to.eql( [ 2, 1 ] )
        expect( sm.modifiedLineAndColumn( 2, 5 ) ).to.eql( [ 2, 5 ] )
        expect( sm.modifiedLineAndColumn( 2, 6 ) ).to.be.undefined
        expect( sm.modifiedLineAndColumn( 3, 1 ) ).to.be.undefined

        // now make a modification!
        sm.modify( 4, 4, '\nTHREE!' )
        expect( sm.modified() ).to.equal( 'just\nTHREE!\nlines' )
        // and re-test all the same stuff, appropriately modified...

        // For reference:
        //
        // just two\nlines
        // 0 2 4 6 8 9 1 1
        //     \--/    1 3
        //       |
        //       V
        //     /------\
        // just\nTHREE!\nlines
        // 0 2 4 5 7 9 1 1 1 1
        //             1 2 4 6

        expect( sm.sourcePosition( -1 ) ).to.be.undefined
        expect( sm.sourcePosition( 0 ) ).to.equal( 0 )
        expect( sm.sourcePosition( 3 ) ).to.equal( 3 )
        expect( sm.sourcePosition( 4 ) ).to.equal( 4 )
        expect( sm.sourcePosition( 7 ) ).to.equal( 4 )
        expect( sm.sourcePosition( 10 ) ).to.equal( 4 )
        expect( sm.sourcePosition( 13 ) ).to.equal( 10 )
        expect( sm.sourcePosition( 16 ) ).to.equal( 13 )
        expect( sm.sourcePosition( 17 ) ).to.be.undefined
        expect( sm.modifiedPosition( -1 ) ).to.be.undefined
        expect( sm.modifiedPosition( 0 ) ).to.equal( 0 )
        expect( sm.modifiedPosition( 3 ) ).to.equal( 3 )
        expect( sm.modifiedPosition( 4 ) ).to.equal( 4 )
        expect( sm.modifiedPosition( 7 ) ).to.equal( 4 )
        expect( sm.modifiedPosition( 8 ) ).to.equal( 11 )
        expect( sm.modifiedPosition( 11 ) ).to.equal( 14 )
        expect( sm.modifiedPosition( 13 ) ).to.equal( 16 )
        expect( sm.modifiedPosition( 14 ) ).to.be.undefined
        expect( sm.sourceLineAndColumn( 0, 1 ) ).to.be.undefined
        expect( sm.sourceLineAndColumn( 1, 1 ) ).to.eql( [ 1, 1 ] )
        expect( sm.sourceLineAndColumn( 1, 4 ) ).to.eql( [ 1, 4 ] )
        expect( sm.sourceLineAndColumn( 1, 5 ) ).to.eql( [ 1, 5 ] )
        expect( sm.sourceLineAndColumn( 1, 6 ) ).to.be.undefined
        expect( sm.sourceLineAndColumn( 2, 1 ) ).to.eql( [ 1, 5 ] )
        expect( sm.sourceLineAndColumn( 2, 6 ) ).to.eql( [ 1, 5 ] )
        expect( sm.sourceLineAndColumn( 2, 7 ) ).to.eql( [ 1, 9 ] )
        expect( sm.sourceLineAndColumn( 2, 8 ) ).to.be.undefined
        expect( sm.sourceLineAndColumn( 3, 1 ) ).to.eql( [ 2, 1 ] )
        expect( sm.sourceLineAndColumn( 3, 5 ) ).to.eql( [ 2, 5 ] )
        expect( sm.sourceLineAndColumn( 3, 6 ) ).to.be.undefined
        expect( sm.modifiedLineAndColumn( 1, 1 ) ).to.eql( [ 1, 1 ] )
        expect( sm.modifiedLineAndColumn( 1, 4 ) ).to.eql( [ 1, 4 ] )
        expect( sm.modifiedLineAndColumn( 1, 5 ) ).to.eql( [ 1, 5 ] )
        expect( sm.modifiedLineAndColumn( 1, 8 ) ).to.eql( [ 1, 5 ] )
        expect( sm.modifiedLineAndColumn( 1, 9 ) ).to.eql( [ 2, 7 ] )
        expect( sm.modifiedLineAndColumn( 1, 10 ) ).to.undefined
        expect( sm.modifiedLineAndColumn( 2, 1 ) ).to.eql( [ 3, 1 ] )
        expect( sm.modifiedLineAndColumn( 2, 5 ) ).to.eql( [ 3, 5 ] )
        expect( sm.modifiedLineAndColumn( 2, 6 ) ).to.be.undefined
    } )
    
    it( 'Should let us store arbitrary data in markers', () => {
        // create the source map:
        const sm = new SourceMap( `
Line 2: __
Line 3: __
Line 4: __
` )

        // double-check what the previous test already did:
        for ( let i = 0 ; i < sm.source().length ; i++ ) {
            expect( sm.sourcePosition( i ) ).to.equal( i )
            expect( sm.modifiedPosition( i ) ).to.equal( i )
            const pair = SourceMap.positionToLineAndColumn( i, sm.source() )
            expect( sm.sourceLineAndColumn( ...pair ) ).to.eql( pair )
            expect( sm.modifiedLineAndColumn( ...pair ) ).to.eql( pair )
        }

        // replace the 2 blanks on line , then 3, then 4:
        sm.modify( 9, 2, sm.nextMarker(), { some: 'data', num: 3 } )
        sm.modify( 34, 2, sm.nextMarker(), { name: 'Alice', dog: 'Hercules' } )
        sm.modify( 59, 2, sm.nextMarker(), { before: 'x', after: 'y' } )
        // ensure we got the correct result:
        expect( sm.modified() ).to.equal( `
Line 2: SourceMapMarker0
Line 3: SourceMapMarker1
Line 4: SourceMapMarker2
` )
        // verify that we cannot actually replace things in reverse order:
        expect( () => sm.modify( 56, 1, 'foo' ) ).to.throw( /order/ )

        // ensure that the markers contain the data they're supposed to:
        expect( sm.dataForMarker( 'SourceMapMarker0' ) ).to.eql(
            { some: 'data', num: 3, original: '__' } )
        expect( sm.dataForMarker( 'SourceMapMarker1' ) ).to.eql(
            { name: 'Alice', dog: 'Hercules', original: '__' } )
        expect( sm.dataForMarker( 'SourceMapMarker2' ) ).to.eql(
            { before: 'x', after: 'y', original: '__' } )
    } )

} )
