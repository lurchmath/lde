
import { Declaration } from '../src/declaration.js'
import { Expression } from '../src/expression.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Environment } from '../src/environment.js'

describe( 'Declaration', () => {

    it( 'Should declare the expected global identifiers', () => {
        expect( Declaration ).to.be.ok
    } )

    let x, y, z, L1, L2, L3, L4
    beforeEach( () => {
        // Make some (Lurch) symbols to declare
        // Note: Most places in the codebase, we call these Symbols, but in
        // those rare circumstances where we are using JavaScript Symbols
        // also, we import these as "LurchSymbols" instead.  (See the import
        // statements at the top of this file).
        x = new LurchSymbol( 'x' )
        y = new LurchSymbol( 'y' )
        z = new LurchSymbol( 'z' )
        // Make some LogicConcepts to use as bodies
        L1 = new Expression( new Expression, new Expression )
        L2 = new Expression( new Expression )
        L3 = new Environment( new Expression )
        L4 = new LogicConcept()
    } )

    it( 'Should notice if we call it with the wrong signature', () => {
        // This test is just of a convenience feature.  You could imagine
        // designing the Declaration constructor in either of two ways:
        // Declaration(type,[sym1,...,symN],body) or
        // Declaration(type,sym1,...,symN,body).
        // We chose the former because the latter is ambiguous.  (Is
        // Declaration(x,y) a declaration of x and y with no body or a
        // declaration of x with body y?)
        // But because it's very common to accidentally use the other syntax
        // (to which JavaScript will respond by silently dropping all
        // arguments after the second one--oy) we introduced an error message
        // if the caller sends >2 arguments.  We test here that it works.
        expect( () => {
            new Declaration( x, y, z )
        } ).to.throw( /^Too many arguments to Declaration constructor: / )
    } )

    it( 'Should permit constructing Declarations', () => {
        expect( () => {
            const D = new Declaration( x )
        } ).not.to.throw()
        expect( () => {
            const D = new Declaration( [ x, y ] )
        } ).not.to.throw()
        expect( () => {
            const D = new Declaration( x, L1 )
        } ).not.to.throw()
        expect( () => {
            const D = new Declaration( [ x, y ], L2 )
        } ).not.to.throw()
    } )

    it( 'Should permit Declarations of one, two, or more Symbols', () => {
        expect( () => {
            const D = new Declaration( x )
        } ).not.to.throw()
        expect( () => {
            const D = new Declaration( [ x, y ], L3 )
        } ).not.to.throw()
        expect( () => {
            const D = new Declaration( [ x, y, z ] )
        } ).not.to.throw()
        expect( () => {
            const D = new Declaration( [ x, y, z ], L4 )
        } ).not.to.throw()
    } )

    it( 'Should not permit Declarations with zero symbols', () => {
        expect( () => {
            const D = new Declaration()
        } ).to.throw( /^Second argument to Declaration constructor / )
        expect( () => {
            const D = new Declaration( L1 )
        } ).to.throw( /^Second argument to Declaration constructor / )
    } )

    it( 'Should not permit Declarations of non-symbols', () => {
        expect( () => {
            const D = new Declaration( L1, L2 )
        } ).to.throw( /^Second argument to Declaration constructor must be / )
        expect( () => {
            const D = new Declaration( [ x, y, L2 ], L3 )
        } ).to.throw( /^Not every entry in the array.*was a Symbol$/ )
    } )

    it( 'Should let us query the symbol list from a declaration', () => {
        const D1 = new Declaration( x )
        let list = D1.symbols()
        expect( list.length ).to.equal( 1 )
        expect( list[0] ).to.equal( x )
        const D2 = new Declaration( [ x, y ], L1 )
        list = D2.symbols()
        expect( list.length ).to.equal( 2 )
        expect( list[0] ).to.equal( x )
        expect( list[1] ).to.equal( y )
        const D3 = new Declaration( [ x, y, z ] )
        list = D3.symbols()
        expect( list.length ).to.equal( 3 )
        expect( list[0] ).to.equal( x )
        expect( list[1] ).to.equal( y )
        const D4 = new Declaration( [ z, y, x ], L4 )
        list = D4.symbols()
        expect( list.length ).to.equal( 3 )
        expect( list[0] ).to.equal( z )
        expect( list[1] ).to.equal( y )
        expect( list[2] ).to.equal( x )
    } )

    it( 'Should let us construct Declarations with or without bodies', () => {
        // with bodies
        expect( () => {
            const D = new Declaration( x, L1 )
        } ).not.to.throw()
        expect( () => {
            const D = new Declaration( [ x, y ], L2 )
        } ).not.to.throw()
        // without bodies
        expect( () => {
            const D = new Declaration( x )
        } ).not.to.throw()
        expect( () => {
            const D = new Declaration( [ x, y ] )
        } ).not.to.throw()
    } )

    it( 'Should restrict Declaration bodies appropriately', () => {
        // can't be anything but a LogicConcept
        expect( () => {
            const D = new Declaration( x, [ 5 ] )
        } ).to.throw(
            /^Optional third parameter.*LogicConcept$/ )
    } )

    it( 'Should let us query the body of any Declaration', () => {
        // body == L1
        const D1 = new Declaration( x, L1 )
        expect( D1.body() ).to.equal( L1 )
        // body == L2
        const D2 = new Declaration( [ x, y ], L2 )
        expect( D2.body() ).to.equal( L2 )
        // body == L3
        const D3 = new Declaration( x, L3 )
        expect( D3.body() ).to.equal( L3 )
        // body == L4
        const D4 = new Declaration( [ x, y ], L4 )
        expect( D4.body() ).to.equal( L4 )
        // no body provided at construction time
        const D5 = new Declaration( x )
        expect( D5.body() ).to.equal( undefined )
        const D6 = new Declaration( [ x, y ] )
        expect( D6.body() ).to.equal( undefined )
    } )

} )
