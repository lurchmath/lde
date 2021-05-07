
import { Application } from '../src/application.js'
import { Expression } from '../src/expression.js'
import { Symbol } from '../src/symbol.js'

describe( 'Application', () => {

    it( 'Should declare all relevant global identifiers', () => {
        expect( Application ).to.be.ok
    } )

    it( 'Should prevent construction with non-Expression arguments', () => {
        // Construct a few objects for use in the test below.
        let E1 = new Expression
        let E2 = new Expression
        let f = new Symbol( 'f' )
        let x = new Symbol( 'x' )
        let y = new Symbol( 'y' )
        // Try to construct Application instance with non-Expression arguments,
        // and verify that an error is thrown in each case.
        expect( () => { new Application( 5 ) } ).to.throw()
        expect( () => { new Application } ).to.throw()
        expect( () => { new Application( f, 5 ) } ).to.throw()
        expect( () => { new Application( f, x, y, 'five' ) } ).to.throw()
        expect( () => { new Application( 5, E1, E2 ) } ).to.throw()
    } )

    it( 'Should permit construction with all arguments Expressions', () => {
        // Construct a few objects for use in the test below.
        let E1 = new Expression
        let E2 = new Expression
        let f = new Symbol( 'f' )
        let x = new Symbol( 'x' )
        let y = new Symbol( 'y' )
        // Try to construct Application instance with non-Expression arguments,
        // and verify that no error is thrown in each case.
        expect( () => { new Application( E1 ) } ).not.to.throw()
        expect( () => { new Application( E1, E2 ) } ).not.to.throw()
        expect( () => { new Application( f ) } ).not.to.throw()
        expect( () => { new Application( f, x ) } ).not.to.throw()
        expect( () => { new Application( y, f, x ) } ).not.to.throw()
    } )

    it( 'Should return operator/operands correctly', () => {
        // Construct objects and Applications as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let E1 = new Expression
        let E2 = new Expression
        let f = new Symbol( 'f' )
        let x = new Symbol( 'x' )
        let y = new Symbol( 'y' )
        let A1 = new Application( E1 )
        let A2 = new Application( E1.copy(), E2 )
        let A3 = new Application( f )
        let A4 = new Application( f.copy(), x )
        let A5 = new Application( y, f.copy(), x.copy() )
        // compute operator in each case
        expect( A1.operator() ).to.equal( E1 )
        expect( A2.operator() ).to.equal( A2.child(0) )
        expect( A3.operator() ).to.equal( f )
        expect( A4.operator() ).to.equal( A4.child(0) )
        expect( A5.operator() ).to.equal( y )
        // compute operands in each case
        expect( A1.operands() ).to.eql( [ ] )
        let tmp = A2.operands()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 1 )
        expect( tmp[0] ).to.equal( E2 )
        expect( A3.operands() ).to.eql( [ ] )
        tmp = A4.operands()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 1 )
        expect( tmp[0] ).to.equal( A4.child(1) )
        tmp = A5.operands()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 2 )
        expect( tmp[0] ).to.equal( A5.child(1) )
        expect( tmp[1] ).to.equal( A5.child(2) )
    } )

} )
