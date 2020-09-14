
// We import this because it's the subject of this test suite.
import { Connection } from '../src/connection.js'

// We import this because we need Structures to make Connections among
import { Structure } from '../src/structure.js'

// I'm rollying my own spy functions, because chai's are annoying to use in
// the browser.
const makeSpy = () => {
    const result = ( ...args ) => result.callRecord.push( args )
    result.callRecord = [ ]
    return result
}

// Test suites begin here.

describe( 'Connection module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( Connection ).to.be.ok
    } )

} )

describe( 'Creating Connection instances', () => {

    let A, B, C, D, c1, c2, c3, listeners
    beforeEach( () => {
        // create some Structures to connect to one another
        A = new Structure
        B = new Structure
        C = new Structure( A, B )
        D = new Structure
        A.setID( 'A' )
        B.setID( 'B' )
        C.setID( 'C' )
        D.setID( 'D' )
        C.trackIDs()
        D.trackIDs()
        listeners = { }
        for ( const id of [ 'A', 'B', 'C', 'D' ] ) {
            Structure.instanceWithID( id ).addEventListener(
                'willBeChanged', listeners[`${id} will`] = makeSpy() )
            Structure.instanceWithID( id ).addEventListener(
                'wasChanged', listeners[`${id} was`] = makeSpy() )
        }
        c1 = c2 = c3 = null
    } )

    afterEach( () => {
        C.untrackIDs()
        D.untrackIDs()
        if ( c1 ) c1.remove()
        if ( c2 ) c2.remove()
        if ( c3 ) c3.remove()
    } )

    it( 'Can create connections with Connection.create()', () => {
        // make some connections
        c1 = Connection.create( 'c1', 'A', 'D' )
        c2 = Connection.create( 'c2', 'B', 'C' )
        c3 = Connection.create( 'c3', 'A', 'B' )
        // verify that they succeeded
        expect( c1 ).to.be.instanceof( Connection )
        expect( c2 ).to.be.instanceof( Connection )
        expect( c3 ).to.be.instanceof( Connection )
        // verify that the ID, source, and target of each connection are correct
        expect( c1.id ).to.equal( 'c1' )
        expect( c1.source() ).to.equal( A )
        expect( c1.target() ).to.equal( D )
        expect( c2.id ).to.equal( 'c2' )
        expect( c2.source() ).to.equal( B )
        expect( c2.target() ).to.equal( C )
        expect( c3.id ).to.equal( 'c3' )
        expect( c3.source() ).to.equal( A )
        expect( c3.target() ).to.equal( B )
        // verify that we can get access to those connections using withID()
        const alsoc1 = Connection.withID( 'c1' )
        const alsoc2 = Connection.withID( 'c2' )
        const alsoc3 = Connection.withID( 'c3' )
        expect( alsoc1.id ).to.equal( 'c1' )
        expect( alsoc1.source() ).to.equal( A )
        expect( alsoc1.target() ).to.equal( D )
        expect( alsoc2.id ).to.equal( 'c2' )
        expect( alsoc2.source() ).to.equal( B )
        expect( alsoc2.target() ).to.equal( C )
        expect( alsoc3.id ).to.equal( 'c3' )
        expect( alsoc3.source() ).to.equal( A )
        expect( alsoc3.target() ).to.equal( B )
    } )

    it( 'Can create connections with S.connectTo()', () => {
        // the only differences are how we choose to make the connections:
        c1 = A.connectTo( D, 'c1' )
        c2 = B.connectTo( C, 'c2' )
        c3 = A.connectTo( B, 'c3' )
        // all the actual tests are the same:
        expect( c1 ).to.be.instanceof( Connection )
        expect( c2 ).to.be.instanceof( Connection )
        expect( c3 ).to.be.instanceof( Connection )
        expect( c1.id ).to.equal( 'c1' )
        expect( c1.source() ).to.equal( A )
        expect( c1.target() ).to.equal( D )
        expect( c2.id ).to.equal( 'c2' )
        expect( c2.source() ).to.equal( B )
        expect( c2.target() ).to.equal( C )
        expect( c3.id ).to.equal( 'c3' )
        expect( c3.source() ).to.equal( A )
        expect( c3.target() ).to.equal( B )
        const alsoc1 = Connection.withID( 'c1' )
        const alsoc2 = Connection.withID( 'c2' )
        const alsoc3 = Connection.withID( 'c3' )
        expect( alsoc1.id ).to.equal( 'c1' )
        expect( alsoc1.source() ).to.equal( A )
        expect( alsoc1.target() ).to.equal( D )
        expect( alsoc2.id ).to.equal( 'c2' )
        expect( alsoc2.source() ).to.equal( B )
        expect( alsoc2.target() ).to.equal( C )
        expect( alsoc3.id ).to.equal( 'c3' )
        expect( alsoc3.source() ).to.equal( A )
        expect( alsoc3.target() ).to.equal( B )
    } )

    it( 'Source and target emit change events when connected', () => {
        // ensure no change events have been fired
        expect( listeners['A will'].callRecord ).to.eql( [ ] )
        expect( listeners['A was'].callRecord ).to.eql( [ ] )
        expect( listeners['B will'].callRecord ).to.eql( [ ] )
        expect( listeners['B was'].callRecord ).to.eql( [ ] )
        expect( listeners['C will'].callRecord ).to.eql( [ ] )
        expect( listeners['C was'].callRecord ).to.eql( [ ] )
        expect( listeners['D will'].callRecord ).to.eql( [ ] )
        expect( listeners['D was'].callRecord ).to.eql( [ ] )
        // make connections one at a time and verify that each generates change
        // events in the right order.  each event handler receives an array of
        // arguments we'll look up using this variable:
        let args
        // make connection 1 and ensure all events fired in the right order
        c1 = A.connectTo( D, 'c1' )
        expect( listeners['A will'].callRecord.length ).to.equal( 1 )
        args = listeners['A will'].callRecord[0]
        expect( args.length ).to.equal( 1 )
        const Aevent1 = args[0]
        expect( Aevent1.structure ).to.equal( A )
        expect( Aevent1.key ).to.equal( '_conn target c1' )
        expect( Aevent1.oldValue ).to.equal( undefined )
        expect( Aevent1.newValue ).to.equal( 'D' )
        expect( listeners['A was'].callRecord.length ).to.equal( 1 )
        args = listeners['A was'].callRecord[0]
        expect( args.length ).to.equal( 1 )
        const Aevent2 = args[0]
        expect( Aevent2.structure ).to.equal( A )
        expect( Aevent2.key ).to.equal( '_conn target c1' )
        expect( Aevent2.oldValue ).to.equal( undefined )
        expect( Aevent2.newValue ).to.equal( 'D' )
        expect( listeners['B will'].callRecord ).to.eql( [ ] )
        expect( listeners['B was'].callRecord ).to.eql( [ ] )
        expect( listeners['C will'].callRecord ).to.eql( [ ] )
        expect( listeners['C was'].callRecord ).to.eql( [ ] )
        expect( listeners['D will'].callRecord.length ).to.equal( 1 )
        args = listeners['D will'].callRecord[0]
        expect( args.length ).to.equal( 1 )
        const Devent1 = args[0]
        expect( Devent1.structure ).to.equal( D )
        expect( Devent1.key ).to.equal( '_conn source c1' )
        expect( Devent1.oldValue ).to.equal( undefined )
        expect( Devent1.newValue ).to.equal( 'A' )
        expect( listeners['D was'].callRecord.length ).to.equal( 1 )
        args = listeners['D was'].callRecord[0]
        expect( args.length ).to.equal( 1 )
        const Devent2 = args[0]
        expect( Devent2.structure ).to.equal( D )
        expect( Devent2.key ).to.equal( '_conn source c1' )
        expect( Devent2.oldValue ).to.equal( undefined )
        expect( Devent2.newValue ).to.equal( 'A' )
        // make connection 2 and ensure all events fired in the right order
        c2 = B.connectTo( C, 'c2' )
        expect( listeners['A will'].callRecord ).to.eql( [ [ Aevent1 ] ] )
        expect( listeners['A was'].callRecord ).to.eql( [ [ Aevent2 ] ] )
        expect( listeners['B will'].callRecord.length ).to.equal( 1 )
        args = listeners['B will'].callRecord[0]
        expect( args.length ).to.equal( 1 )
        const Bevent1 = args[0]
        expect( Bevent1.structure ).to.equal( B )
        expect( Bevent1.key ).to.equal( '_conn target c2' )
        expect( Bevent1.oldValue ).to.equal( undefined )
        expect( Bevent1.newValue ).to.equal( 'C' )
        expect( listeners['B was'].callRecord.length ).to.equal( 1 )
        args = listeners['B was'].callRecord[0]
        expect( args.length ).to.equal( 1 )
        const Bevent2 = args[0]
        expect( Bevent2.structure ).to.equal( B )
        expect( Bevent2.key ).to.equal( '_conn target c2' )
        expect( Bevent2.oldValue ).to.equal( undefined )
        expect( Bevent2.newValue ).to.equal( 'C' )
        expect( listeners['C will'].callRecord.length ).to.equal( 1 )
        args = listeners['C will'].callRecord[0]
        expect( args.length ).to.equal( 1 )
        const Cevent1 = args[0]
        expect( Cevent1.structure ).to.equal( C )
        expect( Cevent1.key ).to.equal( '_conn source c2' )
        expect( Cevent1.oldValue ).to.equal( undefined )
        expect( Cevent1.newValue ).to.equal( 'B' )
        expect( listeners['C was'].callRecord.length ).to.equal( 1 )
        args = listeners['C was'].callRecord[0]
        expect( args.length ).to.equal( 1 )
        const Cevent2 = args[0]
        expect( Cevent2.structure ).to.equal( C )
        expect( Cevent2.key ).to.equal( '_conn source c2' )
        expect( Cevent2.oldValue ).to.equal( undefined )
        expect( Cevent2.newValue ).to.equal( 'B' )
        expect( listeners['D will'].callRecord ).to.eql( [ [ Devent1 ] ] )
        expect( listeners['D was'].callRecord ).to.eql( [ [ Devent2 ] ] )
        // make connection 3 and ensure all events fired in the right order
        c3 = A.connectTo( B, 'c3' )
        expect( listeners['A will'].callRecord.length ).to.equal( 2 )
        expect( listeners['A will'].callRecord[0] ).to.eql( [ Aevent1 ] )
        args = listeners['A will'].callRecord[1]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( A )
        expect( args[0].key ).to.equal( '_conn target c3' )
        expect( args[0].oldValue ).to.equal( undefined )
        expect( args[0].newValue ).to.equal( 'B' )
        expect( listeners['A was'].callRecord.length ).to.equal( 2 )
        expect( listeners['A was'].callRecord[0] ).to.eql( [ Aevent2 ] )
        args = listeners['A was'].callRecord[1]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( A )
        expect( args[0].key ).to.equal( '_conn target c3' )
        expect( args[0].oldValue ).to.equal( undefined )
        expect( args[0].newValue ).to.equal( 'B' )
        expect( listeners['B will'].callRecord.length ).to.equal( 2 )
        expect( listeners['B will'].callRecord[0] ).to.eql( [ Bevent1 ] )
        args = listeners['B will'].callRecord[1]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( B )
        expect( args[0].key ).to.equal( '_conn source c3' )
        expect( args[0].oldValue ).to.equal( undefined )
        expect( args[0].newValue ).to.equal( 'A' )
        expect( listeners['B was'].callRecord.length ).to.equal( 2 )
        expect( listeners['B was'].callRecord[0] ).to.eql( [ Bevent2 ] )
        args = listeners['B was'].callRecord[1]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( B )
        expect( args[0].key ).to.equal( '_conn source c3' )
        expect( args[0].oldValue ).to.equal( undefined )
        expect( args[0].newValue ).to.equal( 'A' )
        expect( listeners['C will'].callRecord ).to.eql( [ [ Cevent1 ] ] )
        expect( listeners['C was'].callRecord ).to.eql( [ [ Cevent2 ] ] )
        expect( listeners['D will'].callRecord ).to.eql( [ [ Devent1 ] ] )
        expect( listeners['D was'].callRecord ).to.eql( [ [ Devent2 ] ] )
    } )

} )

describe( 'Connections with data', () => {

    let A, B, C, D, c1, c2, c3, listeners
    beforeEach( () => {
        // create some Structures to connect to one another
        A = new Structure
        B = new Structure
        C = new Structure( A, B )
        D = new Structure
        A.setID( 'A' )
        B.setID( 'B' )
        C.setID( 'C' )
        D.setID( 'D' )
        C.trackIDs()
        D.trackIDs()
        listeners = { }
        for ( const id of [ 'A', 'B', 'C', 'D' ] ) {
            Structure.instanceWithID( id ).addEventListener(
                'willBeChanged', listeners[`${id} will`] = makeSpy() )
            Structure.instanceWithID( id ).addEventListener(
                'wasChanged', listeners[`${id} was`] = makeSpy() )
        }
        c1 = c2 = c3 = null
    } )

    afterEach( () => {
        C.untrackIDs()
        D.untrackIDs()
        if ( c1 ) c1.remove()
        if ( c2 ) c2.remove()
        if ( c3 ) c3.remove()
    } )

    it( 'Can create connections with data and let us query that data', () => {
        // make some connections with data built in, in various ways
        c1 = Connection.create( 'c1', 'A', 'D',
            [ [ 'color', 'red' ], [ 'weight', '4kg' ] ] )
        c2 = Connection.create( 'c2', 'B', 'C',
            { color: 'blue', favoriteNumber: 3.14159 } )
        c3 = Connection.create( 'c3', 'A', 'B',
            new Map().set( 'height', 10 ) )
        // ensure we can query the data in those connections
        // test hasAttribute()
        expect( c1.hasAttribute( 'color' ) ).to.equal( true )
        expect( c1.hasAttribute( 'weight' ) ).to.equal( true )
        expect( c1.hasAttribute( 'favoriteNumber' ) ).to.equal( false )
        expect( c1.hasAttribute( 'height' ) ).to.equal( false )
        expect( c2.hasAttribute( 'color' ) ).to.equal( true )
        expect( c2.hasAttribute( 'weight' ) ).to.equal( false )
        expect( c2.hasAttribute( 'favoriteNumber' ) ).to.equal( true )
        expect( c2.hasAttribute( 'height' ) ).to.equal( false )
        expect( c3.hasAttribute( 'color' ) ).to.equal( false )
        expect( c3.hasAttribute( 'weight' ) ).to.equal( false )
        expect( c3.hasAttribute( 'favoriteNumber' ) ).to.equal( false )
        expect( c3.hasAttribute( 'height' ) ).to.equal( true )
        // test getAttribute()
        expect( c1.getAttribute( 'color' ) ).to.equal( 'red' )
        expect( c1.getAttribute( 'weight' ) ).to.equal( '4kg' )
        expect( c1.getAttribute( 'favoriteNumber' ) ).to.equal( undefined )
        expect( c1.getAttribute( 'height' ) ).to.equal( undefined )
        expect( c2.getAttribute( 'color' ) ).to.equal( 'blue' )
        expect( c2.getAttribute( 'weight' ) ).to.equal( undefined )
        expect( c2.getAttribute( 'favoriteNumber' ) ).to.equal( 3.14159 )
        expect( c2.getAttribute( 'height' ) ).to.equal( undefined )
        expect( c3.getAttribute( 'color' ) ).to.equal( undefined )
        expect( c3.getAttribute( 'weight' ) ).to.equal( undefined )
        expect( c3.getAttribute( 'favoriteNumber' ) ).to.equal( undefined )
        expect( c3.getAttribute( 'height' ) ).to.equal( 10 )
        // test getAttributeKeys()
        let temp = c1.getAttributeKeys()
        temp.sort()
        expect( temp ).to.eql( [ 'color', 'weight' ] )
        temp = c2.getAttributeKeys()
        temp.sort()
        expect( temp ).to.eql( [ 'color', 'favoriteNumber' ] )
        expect( c3.getAttributeKeys() ).to.eql( [ 'height' ] )
        // verify that this isn't just the original Connection objects, but the
        // same results exist for other objects about the same data
        const otherc1 = Connection.withID( 'c1' )
        const otherc2 = Connection.withID( 'c2' )
        const otherc3 = Connection.withID( 'c3' )
        for ( const key of [ 'color', 'weight', 'favoriteNumber', 'height' ] ) {
            expect( c1.hasAttribute( key ) ).to.equal(
                otherc1.hasAttribute( key ) )
            expect( c1.getAttribute( key ) ).to.equal(
                otherc1.getAttribute( key ) )
            expect( c1.getAttributeKeys() ).to.eql(
                otherc1.getAttributeKeys() )
        }
    } )

    it( 'Can let us edit the data of a connection', () => {
        // make a connection with data built in, plus two empty ones
        c1 = Connection.create( 'c1', 'A', 'D',
            [ [ 'color', 'red' ], [ 'weight', '4kg' ] ] )
        c2 = Connection.create( 'c2', 'B', 'C' )
        c3 = Connection.create( 'c3', 'A', 'B' )
        // do a tiny repeat of the previous test, just to be sure the data is
        // present in c1 but not in c2 nor c3
        expect( c1.getAttributeKeys() ).to.eql( [ 'color', 'weight' ] )
        expect( c2.getAttributeKeys() ).to.eql( [ ] )
        expect( c3.getAttributeKeys() ).to.eql( [ ] )
        // edit the data in the connections
        c1.clearAttributes( 'color' )
        c2.setAttribute( 'name', 'Henry' )
        c3.attr( [ [ 'favorite vacation', 'Bahamas' ],
                   [ 'favorite song', 'Don\'t Stop Believin\'' ] ] )
        // verify that it changed
        expect( c1.getAttributeKeys() ).to.eql( [ 'weight' ] )
        expect( c2.getAttributeKeys() ).to.eql( [ 'name' ] )
        expect( c3.getAttributeKeys() ).to.eql( [ 'favorite vacation',
                                                  'favorite song' ] )
        // and be thorough; check every key-value pair
        expect( c1.getAttribute( 'weight' ) ).to.equal( '4kg' )
        expect( c2.getAttribute( 'name' ) ).to.equal( 'Henry' )
        expect( c3.getAttribute( 'favorite vacation' ) ).to.equal( 'Bahamas' )
        expect( c3.getAttribute( 'favorite song' ) ).to.equal(
            'Don\'t Stop Believin\'' )
    } )

    it( 'Source emits change events when changing connection data', () => {
        // set up connections just as in previous test
        c1 = Connection.create( 'c1', 'A', 'D',
            [ [ 'color', 'red' ], [ 'weight', '4kg' ] ] )
        c2 = Connection.create( 'c2', 'B', 'C' )
        c3 = Connection.create( 'c3', 'A', 'B' )
        // ensure the right number of change events have been fired so far,
        // due to those connections (which partially repeates a previous test,
        // just to be safe) and the data in c1 (which is in A)
        expect( listeners['A will'].callRecord.length ).to.equal( 3 )
        expect( listeners['A was'].callRecord.length ).to.equal( 3 )
        expect( listeners['B will'].callRecord.length ).to.equal( 2 )
        expect( listeners['B was'].callRecord.length ).to.equal( 2 )
        expect( listeners['C will'].callRecord.length ).to.equal( 1 )
        expect( listeners['C was'].callRecord.length ).to.equal( 1 )
        expect( listeners['D will'].callRecord.length ).to.equal( 1 )
        expect( listeners['D was'].callRecord.length ).to.equal( 1 )
        // we will therefore test only event emissions that come AFTER the ones
        // already recorded (items 3 and up for A and B, and items 2 and up for
        // C and D).  here we make the same edits as in the previous test, but
        // now we check the events after each.

        // first, edit c1
        c1.clearAttributes( 'color' )
        // this should be reflected as a change event in A,
        // since the data is stored in the source Structure of the connection.
        expect( listeners['A will'].callRecord.length ).to.equal( 4 )
        let args = listeners['A was'].callRecord[3]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( A )
        expect( args[0].key ).to.equal( '_conn data c1' )
        expect( args[0].oldValue ).to.eql( {'color':'red','weight':'4kg'} )
        expect( args[0].newValue ).to.eql( {'weight':'4kg'} )
        expect( listeners['A was'].callRecord.length ).to.equal( 4 )
        args = listeners['A will'].callRecord[3]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( A )
        expect( args[0].key ).to.equal( '_conn data c1' )
        expect( args[0].oldValue ).to.eql( {'color':'red','weight':'4kg'} )
        expect( args[0].newValue ).to.eql( {'weight':'4kg'} )
        // verify that no other Structure changed:
        expect( listeners['B will'].callRecord.length ).to.equal( 2 )
        expect( listeners['B was'].callRecord.length ).to.equal( 2 )
        expect( listeners['C will'].callRecord.length ).to.equal( 1 )
        expect( listeners['C was'].callRecord.length ).to.equal( 1 )
        expect( listeners['D will'].callRecord.length ).to.equal( 1 )
        expect( listeners['D was'].callRecord.length ).to.equal( 1 )

        // next, edit c2
        c2.setAttribute( 'name', 'Henry' )
        // this should be reflected as a change event in B,
        // since the data is stored in the source Structure of the connection.
        expect( listeners['B will'].callRecord.length ).to.equal( 3 )
        args = listeners['B was'].callRecord[2]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( B )
        expect( args[0].key ).to.equal( '_conn data c2' )
        expect( args[0].oldValue ).to.equal( undefined )
        expect( args[0].newValue ).to.eql( {'name':'Henry'} )
        expect( listeners['B was'].callRecord.length ).to.equal( 3 )
        args = listeners['B was'].callRecord[2]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( B )
        expect( args[0].key ).to.equal( '_conn data c2' )
        expect( args[0].oldValue ).to.equal( undefined )
        expect( args[0].newValue ).to.eql( {'name':'Henry'} )
        // verify that no other Structure changed:
        expect( listeners['A will'].callRecord.length ).to.equal( 4 )
        expect( listeners['A was'].callRecord.length ).to.equal( 4 )
        expect( listeners['C will'].callRecord.length ).to.equal( 1 )
        expect( listeners['C was'].callRecord.length ).to.equal( 1 )
        expect( listeners['D will'].callRecord.length ).to.equal( 1 )
        expect( listeners['D was'].callRecord.length ).to.equal( 1 )

        // last, edit c3
        c3.attr( [ [ 'favorite vacation', 'Bahamas' ],
                   [ 'favorite song', 'Don\'t Stop Believin\'' ] ] )
        // this should be reflected as a change event in A,
        // since the data is stored in the source Structure of the connection.
        expect( listeners['A will'].callRecord.length ).to.equal( 5 )
        args = listeners['A will'].callRecord[4]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( A )
        expect( args[0].key ).to.equal( '_conn data c3' )
        expect( args[0].oldValue ).to.equal( undefined )
        expect( args[0].newValue ).to.eql( {
            'favorite vacation' : 'Bahamas',
            'favorite song' : 'Don\'t Stop Believin\''
        } )
        expect( listeners['A was'].callRecord.length ).to.equal( 5 )
        args = listeners['A was'].callRecord[4]
        expect( args.length ).to.equal( 1 )
        expect( args[0].structure ).to.equal( A )
        expect( args[0].key ).to.equal( '_conn data c3' )
        expect( args[0].oldValue ).to.equal( undefined )
        expect( args[0].newValue ).to.eql( {
            'favorite vacation' : 'Bahamas',
            'favorite song' : 'Don\'t Stop Believin\''
        } )
        // verify that no other Structure changed:
        expect( listeners['B will'].callRecord.length ).to.equal( 3 )
        expect( listeners['B was'].callRecord.length ).to.equal( 3 )
        expect( listeners['C will'].callRecord.length ).to.equal( 1 )
        expect( listeners['C was'].callRecord.length ).to.equal( 1 )
        expect( listeners['D will'].callRecord.length ).to.equal( 1 )
        expect( listeners['D was'].callRecord.length ).to.equal( 1 )
    } )

} )

describe( 'Transferring connections', () => {

    let A, B, C, D, c1, c2, c3
    beforeEach( () => {
        // create some Structures to connect to one another
        A = new Structure
        B = new Structure
        C = new Structure( A, B )
        D = new Structure
        A.setID( 'A' )
        B.setID( 'B' )
        C.setID( 'C' )
        D.setID( 'D' )
        C.trackIDs()
        D.trackIDs()
        // set up connections just as in previous test
        c1 = Connection.create( 'c1', 'A', 'D',
            [ [ 'color', 'red' ], [ 'weight', '4kg' ] ] )
        c2 = Connection.create( 'c2', 'B', 'C' )
        c3 = Connection.create( 'c3', 'A', 'B' )
    } )

    afterEach( () => {
        C.untrackIDs()
        D.untrackIDs()
        c1.remove()
        c2.remove()
        c3.remove()
    } )

    it( 'Lets us transfer connections from one Structure to another', () => {
        // verify that the configuration is as expected from beforeEach()
        expect( A ).is.instanceof( Structure )
        expect( B ).is.instanceof( Structure )
        expect( C ).is.instanceof( Structure )
        expect( D ).is.instanceof( Structure )
        expect( c1 ).is.instanceof( Connection )
        expect( c2 ).is.instanceof( Connection )
        expect( c3 ).is.instanceof( Connection )
        expect( c1.source() ).to.equal( A )
        expect( c1.target() ).to.equal( D )
        expect( c2.source() ).to.equal( B )
        expect( c2.target() ).to.equal( C )
        expect( c3.source() ).to.equal( A )
        expect( c3.target() ).to.equal( B )
        expect( c1.getAttributeKeys() ).to.eql( [ 'color', 'weight' ] )
        expect( c2.getAttributeKeys() ).to.eql( [ ] )
        expect( c3.getAttributeKeys() ).to.eql( [ ] )
        expect( A.getConnectionIDsIn() ).to.eql( [ ] )
        expect( A.getConnectionIDsOut() ).to.eql( [ 'c1', 'c3' ] )
        expect( B.getConnectionIDsIn() ).to.eql( [ 'c3' ] )
        expect( B.getConnectionIDsOut() ).to.eql( [ 'c2' ] )
        expect( C.getConnectionIDsIn() ).to.eql( [ 'c2' ] )
        expect( C.getConnectionIDsOut() ).to.eql( [ ] )
        expect( D.getConnectionIDsIn() ).to.eql( [ 'c1' ] )
        expect( D.getConnectionIDsOut() ).to.eql( [ ] )
        // make a new Structure to move some connections to
        const E = new Structure
        E.setID( 'E' )
        E.trackIDs()
        // transfer all of A's connections to it, and check to be sure it worked
        expect( Connection.transferConnections( A, E ) ).to.equal( true )
        expect( c1 ).is.instanceof( Connection )
        expect( c2 ).is.instanceof( Connection )
        expect( c3 ).is.instanceof( Connection )
        expect( c1.source() ).to.equal( E )
        expect( c1.target() ).to.equal( D )
        expect( c2.source() ).to.equal( B )
        expect( c2.target() ).to.equal( C )
        expect( c3.source() ).to.equal( E )
        expect( c3.target() ).to.equal( B )
        expect( c1.getAttributeKeys() ).to.eql( [ 'color', 'weight' ] )
        expect( c2.getAttributeKeys() ).to.eql( [ ] )
        expect( c3.getAttributeKeys() ).to.eql( [ ] )
        expect( A.getConnectionsIn() ).to.eql( [ ] )
        expect( A.getConnectionIDsIn() ).to.eql( [ ] )
        expect( A.getConnectionsOut() ).to.eql( [ ] )
        expect( A.getConnectionIDsOut() ).to.eql( [ ] )
        expect( B.getConnectionIDsIn() ).to.eql( [ 'c3' ] )
        expect( B.getConnectionIDsOut() ).to.eql( [ 'c2' ] )
        expect( C.getConnectionIDsIn() ).to.eql( [ 'c2' ] )
        expect( C.getConnectionIDsOut() ).to.eql( [ ] )
        expect( D.getConnectionIDsIn() ).to.eql( [ 'c1' ] )
        expect( D.getConnectionIDsOut() ).to.eql( [ ] )
        expect( E.getConnectionIDsIn() ).to.eql( [ ] )
        expect( E.getConnectionIDsOut() ).to.eql( [ 'c1', 'c3' ] )
        // now transfer B's connections to C, which is odd, because it will
        // produce a self-loop, so let's test that edge-case
        expect( Connection.transferConnections( B, C ) ).to.equal( true )
        expect( c1 ).is.instanceof( Connection )
        expect( c2 ).is.instanceof( Connection )
        expect( c3 ).is.instanceof( Connection )
        expect( c1.source() ).to.equal( E )
        expect( c1.target() ).to.equal( D )
        expect( c2.source() ).to.equal( C )
        expect( c2.target() ).to.equal( C )
        expect( c3.source() ).to.equal( E )
        expect( c3.target() ).to.equal( C )
        expect( c1.getAttributeKeys() ).to.eql( [ 'color', 'weight' ] )
        expect( c2.getAttributeKeys() ).to.eql( [ ] )
        expect( c3.getAttributeKeys() ).to.eql( [ ] )
        expect( A.getConnectionsIn() ).to.eql( [ ] )
        expect( A.getConnectionIDsIn() ).to.eql( [ ] )
        expect( A.getConnectionsOut() ).to.eql( [ ] )
        expect( A.getConnectionIDsOut() ).to.eql( [ ] )
        expect( B.getConnectionIDsIn() ).to.eql( [ ] )
        expect( B.getConnectionIDsOut() ).to.eql( [ ] )
        expect( C.getConnectionIDsIn() ).to.eql( [ 'c2', 'c3' ] )
        expect( C.getConnectionIDsOut() ).to.eql( [ 'c2' ] )
        expect( D.getConnectionIDsIn() ).to.eql( [ 'c1' ] )
        expect( D.getConnectionIDsOut() ).to.eql( [ ] )
        expect( E.getConnectionIDsIn() ).to.eql( [ ] )
        expect( E.getConnectionIDsOut() ).to.eql( [ 'c1', 'c3' ] )
    } )

    it( 'Works if we call Structure.transferConnectionsTo() intead', () => {
        // same exact test as the previous, but with a differnet function in
        // place of Connection.transferConnections()
        expect( A ).is.instanceof( Structure )
        expect( B ).is.instanceof( Structure )
        expect( C ).is.instanceof( Structure )
        expect( D ).is.instanceof( Structure )
        expect( c1 ).is.instanceof( Connection )
        expect( c2 ).is.instanceof( Connection )
        expect( c3 ).is.instanceof( Connection )
        expect( c1.source() ).to.equal( A )
        expect( c1.target() ).to.equal( D )
        expect( c2.source() ).to.equal( B )
        expect( c2.target() ).to.equal( C )
        expect( c3.source() ).to.equal( A )
        expect( c3.target() ).to.equal( B )
        expect( c1.getAttributeKeys() ).to.eql( [ 'color', 'weight' ] )
        expect( c2.getAttributeKeys() ).to.eql( [ ] )
        expect( c3.getAttributeKeys() ).to.eql( [ ] )
        expect( A.getConnectionIDsIn() ).to.eql( [ ] )
        expect( A.getConnectionIDsOut() ).to.eql( [ 'c1', 'c3' ] )
        expect( B.getConnectionIDsIn() ).to.eql( [ 'c3' ] )
        expect( B.getConnectionIDsOut() ).to.eql( [ 'c2' ] )
        expect( C.getConnectionIDsIn() ).to.eql( [ 'c2' ] )
        expect( C.getConnectionIDsOut() ).to.eql( [ ] )
        expect( D.getConnectionIDsIn() ).to.eql( [ 'c1' ] )
        expect( D.getConnectionIDsOut() ).to.eql( [ ] )
        // make a new Structure to move some connections to
        const E = new Structure
        E.setID( 'E' )
        E.trackIDs()
        // transfer all of A's connections to it, and check to be sure it worked
        expect( A.transferConnectionsTo( E ) ).to.equal( true )
        expect( c1 ).is.instanceof( Connection )
        expect( c2 ).is.instanceof( Connection )
        expect( c3 ).is.instanceof( Connection )
        expect( c1.source() ).to.equal( E )
        expect( c1.target() ).to.equal( D )
        expect( c2.source() ).to.equal( B )
        expect( c2.target() ).to.equal( C )
        expect( c3.source() ).to.equal( E )
        expect( c3.target() ).to.equal( B )
        expect( c1.getAttributeKeys() ).to.eql( [ 'color', 'weight' ] )
        expect( c2.getAttributeKeys() ).to.eql( [ ] )
        expect( c3.getAttributeKeys() ).to.eql( [ ] )
        expect( A.getConnectionsIn() ).to.eql( [ ] )
        expect( A.getConnectionIDsIn() ).to.eql( [ ] )
        expect( A.getConnectionsOut() ).to.eql( [ ] )
        expect( A.getConnectionIDsOut() ).to.eql( [ ] )
        expect( B.getConnectionIDsIn() ).to.eql( [ 'c3' ] )
        expect( B.getConnectionIDsOut() ).to.eql( [ 'c2' ] )
        expect( C.getConnectionIDsIn() ).to.eql( [ 'c2' ] )
        expect( C.getConnectionIDsOut() ).to.eql( [ ] )
        expect( D.getConnectionIDsIn() ).to.eql( [ 'c1' ] )
        expect( D.getConnectionIDsOut() ).to.eql( [ ] )
        expect( E.getConnectionIDsIn() ).to.eql( [ ] )
        expect( E.getConnectionIDsOut() ).to.eql( [ 'c1', 'c3' ] )
        // now transfer B's connections to C, which is odd, because it will
        // produce a self-loop, so let's test that edge-case
        expect( B.transferConnectionsTo( C ) ).to.equal( true )
        expect( c1 ).is.instanceof( Connection )
        expect( c2 ).is.instanceof( Connection )
        expect( c3 ).is.instanceof( Connection )
        expect( c1.source() ).to.equal( E )
        expect( c1.target() ).to.equal( D )
        expect( c2.source() ).to.equal( C )
        expect( c2.target() ).to.equal( C )
        expect( c3.source() ).to.equal( E )
        expect( c3.target() ).to.equal( C )
        expect( c1.getAttributeKeys() ).to.eql( [ 'color', 'weight' ] )
        expect( c2.getAttributeKeys() ).to.eql( [ ] )
        expect( c3.getAttributeKeys() ).to.eql( [ ] )
        expect( A.getConnectionsIn() ).to.eql( [ ] )
        expect( A.getConnectionIDsIn() ).to.eql( [ ] )
        expect( A.getConnectionsOut() ).to.eql( [ ] )
        expect( A.getConnectionIDsOut() ).to.eql( [ ] )
        expect( B.getConnectionIDsIn() ).to.eql( [ ] )
        expect( B.getConnectionIDsOut() ).to.eql( [ ] )
        expect( C.getConnectionIDsIn() ).to.eql( [ 'c2', 'c3' ] )
        expect( C.getConnectionIDsOut() ).to.eql( [ 'c2' ] )
        expect( D.getConnectionIDsIn() ).to.eql( [ 'c1' ] )
        expect( D.getConnectionIDsOut() ).to.eql( [ ] )
        expect( E.getConnectionIDsIn() ).to.eql( [ ] )
        expect( E.getConnectionIDsOut() ).to.eql( [ 'c1', 'c3' ] )
    } )

} )

describe( 'Removing connections', () => {

    it( 'Connection.remove() removes the correct data from Structures' ) // to do

    it( 'Makes old queries about the connection no longer return values' ) // to do

    it( 'Can be done across a Structure with removeConnections()' ) // to do

    it( 'Is called automatically by untrackIDs() and clearIDs()' ) // to do
    // Requires updating untrackIDs() and clearIDs()

} )

describe( 'Tracking connections', () => {

    it( 'Re-adds a deserialized Structure\'s data to the global mappings' ) // to do
    //  - Create a hierarchy with connections then serialize it
    //  - Remove its connections and untrack its IDs
    //  - Verify that you can't get them with Connection.withID() or
    //    Structure.instanceWithID() any longer
    //  - Deserialize it, track its IDs, track its connections, and then verify that
    //    you can now do Connection.withID() successfully and get the right data

    it( 'trackIDs() automatically calls trackConnections() as needed' ) // to do
    // Requires updating trackIDs() to call trackConnections()

} )

describe( 'Supporting Structure ID changes', () => {

    it( 'changeID() automatically updates connection data' ) // to do
    // Requires creating Connection.handleIDChange() that can be called after a
    // Structure's ID changed; reference old code as needed.
    // (Update the other end of all connections to have the new IDs.)
    // Then update our new Structure.changeID() to call that function.

} )
