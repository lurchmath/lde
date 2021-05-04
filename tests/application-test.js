
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
        // and verify that an error is thrown in each case.
        expect( () => { new Application( E1 ) } ).not.to.throw()
        expect( () => { new Application( E1, E2 ) } ).not.to.throw()
        expect( () => { new Application( f ) } ).not.to.throw()
        expect( () => { new Application( f, x ) } ).not.to.throw()
        expect( () => { new Application( y, f, x ) } ).not.to.throw()
    } )

} )
