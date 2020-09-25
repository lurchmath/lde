
import { OutputStructure } from '../src/output-structure.js'

describe( 'OutputStructure module', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( OutputStructure ).to.be.ok
    } )

} )

describe( 'OutputStructure dirty flags', () => {

    it( 'Ensure that instances are clean by default', () => {
        // set up a small hierarchy of structures
        let A, B, C, D
        A = new OutputStructure(
            B = new OutputStructure,
            C = new OutputStructure(
                D = new OutputStructure
            )
        )
        // verify all are clean
        expect( A.isDirty() ).to.equal( true )
        expect( B.isDirty() ).to.equal( true )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( true )
    } )

    it( 'Ensure that getters and setters behave as expected', () => {
        // set up the same small hierarchy of structures as in the previous test
        let A, B, C, D
        A = new OutputStructure(
            B = new OutputStructure,
            C = new OutputStructure(
                D = new OutputStructure
            )
        )
        // get and set a few values and ensure that they operate completely
        // independently of one another (unlike in some subclasses, f.ex.)
        A.markDirty( false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( true )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( true )
        C.markDirty( false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( true )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( true )
        B.markDirty()
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( true )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( true )
        D.markDirty( false )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( true )
        expect( C.isDirty() ).to.equal( false )
        expect( D.isDirty() ).to.equal( false )
        C.markDirty( true )
        expect( A.isDirty() ).to.equal( false )
        expect( B.isDirty() ).to.equal( true )
        expect( C.isDirty() ).to.equal( true )
        expect( D.isDirty() ).to.equal( false )
    } )

} )
