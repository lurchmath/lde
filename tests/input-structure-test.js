
import { InputStructure } from '../src/input-structure.js'

describe( 'InputStructure module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( InputStructure ).to.be.ok
    } )

} )

describe( 'InputStructure dirty flags', () => {

    it( 'Ensure that instances are clean by default', () => {
        // set up a small hierarchy of structures
        let A, B, C, D
        A = new InputStructure(
            B = new InputStructure,
            C = new InputStructure(
                D = new InputStructure
            )
        )
        // verify all are clean
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
    } )

    it( 'Ensure that marking instances dirty propagates upward', () => {
        // set up the same small hierarchy of structures as in the previous test
        let A, B, C, D
        A = new InputStructure(
            B = new InputStructure,
            C = new InputStructure(
                D = new InputStructure
            )
        )
        // mark some children dirty and ensure that it propagates up the
        // appropriate ancestor chains
        B.markDirty()
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( true )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
        // but when we clear dirty flags, this does NOT propagate upwards
        B.markDirty( false )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
        A.markDirty( false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
        // repeat earlier test with a grandchild this time
        D.markDirty( true )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( true )
        // again, clearing dirty does not propagate up
        D.markDirty( false )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( false )
        C.markDirty( false )
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
        A.markDirty( false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( false )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
    } )

} )
