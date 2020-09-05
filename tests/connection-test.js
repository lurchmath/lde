
// We import this because it's the subject of this test suite.
import { Connection } from '../src/connection.js'

// We import this because we need Structures to make Connections among
import { Structure } from '../src/structure.js'

// Test suites begin here.

describe( 'Connection module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( Connection ).to.be.ok
    } )

} )

describe( 'Creating Connection instances', () => {

    it( 'Can create connections with Connection.create()', () => {
        // create some Structures to connect to one another
        const A = new Structure
        const B = new Structure
        const C = new Structure( A, B )
        const D = new Structure
        A.setID( 'A' )
        B.setID( 'B' )
        C.setID( 'C' )
        D.setID( 'D' )
        C.trackIDs()
        D.trackIDs()
        // make some connections
        const c1 = Connection.create( 'c1', 'A', 'D' )
        const c2 = Connection.create( 'c2', 'B', 'C' )
        const c3 = Connection.create( 'c3', 'A', 'B' )
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
        // clean up after ourselves
        C.untrackIDs()
        D.untrackIDs()
        c1.remove()
        c2.remove()
        c3.remove()
    } )

    it( 'Can create connections with S.connectTo()', () => {
        // Same content as the previous test, but with a different way to make
        // the connections.  See comments below that highlight the difference.
        const A = new Structure
        const B = new Structure
        const C = new Structure( A, B )
        const D = new Structure
        A.setID( 'A' )
        B.setID( 'B' )
        C.setID( 'C' )
        D.setID( 'D' )
        C.trackIDs()
        D.trackIDs()
        // here are the differences
        const c1 = A.connectTo( D, 'c1' )
        const c2 = B.connectTo( C, 'c2' )
        const c3 = A.connectTo( B, 'c3' )
        // end of differences
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
        C.untrackIDs()
        D.untrackIDs()
        c1.remove()
        c2.remove()
        c3.remove()
    } )

    it( 'Source and target emit change events when connected' ) // to do

} )

describe( 'Connections with data', () => {

    it( 'Can create connections with data and let us query that data', () => {
        // create some Structures to connect to one another
        const A = new Structure
        const B = new Structure
        const C = new Structure( A, B )
        const D = new Structure
        A.setID( 'A' )
        B.setID( 'B' )
        C.setID( 'C' )
        D.setID( 'D' )
        C.trackIDs()
        D.trackIDs()
        // make some connections with data built in, in various ways
        const c1 = Connection.create( 'c1', 'A', 'D',
            [ [ 'color', 'red' ], [ 'weight', '4kg' ] ] )
        const c2 = Connection.create( 'c2', 'B', 'C',
            { color: 'blue', favoriteNumber: 3.14159 } )
        const c3 = Connection.create( 'c3', 'A', 'B',
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

    it( 'Can let us edit the data of a connection' ) // to do

    it( 'Source emits change events when changing connection data' ) // to do

} )

describe( 'Transferring connections', () => {

    it( 'Lets us transfer all connections from one Structure to another' ) // to do

    it( 'Works if we call Structure.transferConnectionsTo() intead' ) // to do

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
