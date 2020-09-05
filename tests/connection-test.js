
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

} )
