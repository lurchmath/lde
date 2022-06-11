
import { LogicConcept } from '../src/logic-concept.js'
import { Binding } from '../src/binding.js'
import { Expression } from '../src/expression.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'

describe( 'Binding', () => {

    it( 'Should declare all relevant global identifiers', () => {
        expect( Binding ).to.be.ok
    } )

    let f, x, y, E1, E2, E3, LC1, LC2
    beforeEach( () => {
        // Construct a few objects for use in the tests below.
        f = new LurchSymbol( 'f' )
        x = new LurchSymbol( 'x' )
        y = new LurchSymbol( 'y' )
        E1 = new Expression
        E2 = new Expression
        E3 = new Expression
        LC1 = new LogicConcept
        LC2 = new LogicConcept( new LogicConcept )
    } )

    it( 'Should prevent construction with fewer than three arguments', () => {
        // Try to construct Bindings with too few arguments,
        // and verify that an error is thrown in each case.
        expect( () => { new Binding } ).to.throw()
        expect( () => { new Binding( f ) } ).to.throw()
        expect( () => { new Binding( x, y ) } ).to.throw()
        expect( () => { new Binding( E1, E2 ) } ).to.throw()
        expect( () => { new Binding( LC1, LC2 ) } ).to.throw()
    } )

    it( 'Should prevent construction with wrong argument types', () => {
        // Try to construct Bindings with non-Expressions as the head,
        // but all other parameters following the construction rules,
        // and verify that an error is thrown in each case.
        expect( () => { new Binding( LC1, x, E1 ) } ).to.throw()
        expect( () => { new Binding( LC2, x, y, E2 ) } ).to.throw()
        // Try to construct Bindings with non-Expressions as the body,
        // but all other parameters following the construction rules,
        // and verify that an error is thrown in each case.
        expect( () => { new Binding( E1, x, LC1 ) } ).to.throw()
        expect( () => { new Binding( E2, x, y, LC2 ) } ).to.throw()
        // Try to construct Bindings with non-Symbols as the bound variables,
        // but all other parameters following the construction rules,
        // and verify that an error is thrown in each case.
        expect( () => { new Binding( E1, LC1, E2 ) } ).to.throw()
        expect( () => { new Binding( E2, E2, x, y, E3 ) } ).to.throw()
        expect( () => { new Binding( E2, x, E2, y, E3 ) } ).to.throw()
        expect( () => { new Binding( E2, x, y, E2, E3 ) } ).to.throw()
        // Try to construct Bindings no bound variables,
        // but all other parameters following the construction rules,
        // and verify that an error is thrown in each case.
        expect( () => { new Binding( E1, E2 ) } ).to.throw()
        expect( () => { new Binding( E2, E3 ) } ).to.throw()
        expect( () => { new Binding( E1, E3 ) } ).to.throw()
    } )

    it( 'Should permit construction with correct argument types', () => {
        // Try to construct Binding instances with Expressions as the head and
        // body, and Symbols as the bound variables (of which there are >0),
        // and verify that no error is thrown in each case.
        expect( () => { new Binding( E1, x, E2 ) } ).not.to.throw()
        expect( () => { new Binding( E2, f, y, E3 ) } ).not.to.throw()
        expect( () => { new Binding( E1, f, x, y, E3 ) } ).not.to.throw()
    } )

    it( 'Should return head, boundVars, and body correctly', () => {
        // Construct Bindings as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new Binding( E1, x, E2 )
        let B2 = new Binding( E2.copy(), f, y, E3 )
        let B3 = new Binding(
            E1.copy(), f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute head in each case
        expect( B1.head() ).to.equal( E1 )
        expect( B2.head() ).to.equal( B2.child(0) )
        expect( B3.head() ).to.equal( B3.child(0) )
        // compute boundVars in each case
        let tmp = B1.boundVariables()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 1 )
        expect( tmp[0] ).to.equal( x )
        tmp = B2.boundVariables()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 2 )
        expect( tmp[0] ).to.equal( B2.child(1) )
        expect( tmp[1] ).to.equal( y )
        tmp = B3.boundVariables()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 3 )
        expect( tmp[0] ).to.equal( B3.child(1) )
        expect( tmp[1] ).to.equal( B3.child(2) )
        expect( tmp[2] ).to.equal( B3.child(3) )
        // compute head in each case
        expect( B1.body() ).to.equal( E2 )
        expect( B2.body() ).to.equal( E3 )
        expect( B3.body() ).to.equal( B3.child(4) )
    } )

    it( 'Should return bound variable names correctly', () => {
        // Construct Bindings as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new Binding( E1, x, E2 )
        let B2 = new Binding( E2.copy(), f, y, E3 )
        let B3 = new Binding(
            E1.copy(), f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute bound variable names in each case
        expect( B1.boundVariableNames() ).to.eql( [ 'x' ] )
        expect( B2.boundVariableNames() ).to.eql( [ 'f', 'y' ] )
        expect( B3.boundVariableNames() ).to.eql( [ 'f', 'x', 'y' ] )
    } )

    it( 'Should know whether a binding binds a given symbol', () => {
        // Construct Bindings as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new Binding( E1, x, E2 )
        let B2 = new Binding( E2.copy(), f, y, E3 )
        let B3 = new Binding(
            E1.copy(), f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute bound variable names in each case
        expect( B1.binds( 'f' ) ).to.equal( false )
        expect( B1.binds( 'x' ) ).to.equal( true )
        expect( B1.binds( 'y' ) ).to.equal( false )
        expect( B1.binds( 'z' ) ).to.equal( false )
        expect( B1.binds( f ) ).to.equal( false )
        expect( B1.binds( x ) ).to.equal( true )
        expect( B1.binds( y ) ).to.equal( false )
        expect( B2.binds( 'f' ) ).to.equal( true )
        expect( B2.binds( 'x' ) ).to.equal( false )
        expect( B2.binds( 'y' ) ).to.equal( true )
        expect( B2.binds( 'z' ) ).to.equal( false )
        expect( B2.binds( f ) ).to.equal( true )
        expect( B2.binds( x ) ).to.equal( false )
        expect( B2.binds( y ) ).to.equal( true )
        expect( B3.binds( 'f' ) ).to.equal( true )
        expect( B3.binds( 'x' ) ).to.equal( true )
        expect( B3.binds( 'y' ) ).to.equal( true )
        expect( B3.binds( 'z' ) ).to.equal( false )
        expect( B3.binds( f ) ).to.equal( true )
        expect( B3.binds( x ) ).to.equal( true )
        expect( B3.binds( y ) ).to.equal( true )
    } )

} )
