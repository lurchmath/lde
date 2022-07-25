
import { LogicConcept } from '../src/logic-concept.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'
import { Expression } from '../src/expression.js'
import { BindingExpression } from '../src/binding-expression.js'
import { Environment } from '../src/environment.js'
import { BindingEnvironment } from '../src/binding-environment.js'

describe( 'BindingExpression', () => {

    it( 'Should declare all relevant global identifiers', () => {
        expect( BindingExpression ).to.be.ok
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

    it( 'Should prevent construction with fewer than two arguments', () => {
        // Try to construct BindingExpressions with too few arguments,
        // and verify that an error is thrown in each case.
        expect( () => { new BindingExpression } ).to.throw()
        expect( () => { new BindingExpression( f ) } ).to.throw()
        expect( () => { new BindingExpression( x ) } ).to.throw()
        expect( () => { new BindingExpression( E1 ) } ).to.throw()
        expect( () => { new BindingExpression( LC1 ) } ).to.throw()
    } )

    it( 'Should prevent construction with wrong argument types', () => {
        // Try to construct BindingExpressions with non-Expressions as the
        // first bound symbol, but all other parameters following the
        // construction rules, and verify that an error is thrown in each case.
        expect( () => { new BindingExpression( LC1, x, E1 ) } ).to.throw()
        expect( () => { new BindingExpression( LC2, x, y, E2 ) } ).to.throw()
        // Try to construct BindingExpressions with non-Expressions as the body,
        // but all other parameters following the construction rules,
        // and verify that an error is thrown in each case.
        expect( () => { new BindingExpression( x, LC1 ) } ).to.throw()
        expect( () => { new BindingExpression( x, y, LC2 ) } ).to.throw()
        // Try to construct BindingExpressions with non-Symbols as the bound symbols,
        // but all other parameters following the construction rules,
        // and verify that an error is thrown in each case.
        expect( () => { new BindingExpression( LC1, E2 ) } ).to.throw()
        expect( () => { new BindingExpression( E2, x, y, E3 ) } ).to.throw()
        expect( () => { new BindingExpression( x, E2, y, E3 ) } ).to.throw()
        expect( () => { new BindingExpression( x, y, E2, E3 ) } ).to.throw()
    } )

    it( 'Should permit construction with correct argument types', () => {
        // Try to construct BindingExpression instances with an Expression as the
        // body, and Symbols as the bound symbols (of which there are >0),
        // and verify that no error is thrown in each case.
        expect( () => { new BindingExpression( x, E2 ) } ).not.to.throw()
        expect( () => { new BindingExpression( f, y, E3 ) } ).not.to.throw()
        expect( () => { new BindingExpression( f, x, y, E3 ) } ).not.to.throw()
    } )

    it( 'Should return boundSymbols and body correctly', () => {
        // Construct BindingExpressions as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new BindingExpression( x, E2 )
        let B2 = new BindingExpression( f, y, E3 )
        let B3 = new BindingExpression( f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute boundSymbols in each case
        let tmp = B1.boundSymbols()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 1 )
        expect( tmp[0] ).to.equal( x )
        tmp = B2.boundSymbols()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 2 )
        expect( tmp[0] ).to.equal( B2.child( 0 ) )
        expect( tmp[1] ).to.equal( y )
        tmp = B3.boundSymbols()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 3 )
        expect( tmp[0] ).to.equal( B3.child( 0 ) )
        expect( tmp[1] ).to.equal( B3.child( 1 ) )
        expect( tmp[2] ).to.equal( B3.child( 2 ) )
        // compute body in each case
        expect( B1.body() ).to.equal( E2 )
        expect( B2.body() ).to.equal( E3 )
        expect( B3.body() ).to.equal( B3.child( 3 ) )
    } )

    it( 'Should return bound symbol names correctly', () => {
        // Construct BindingExpressions as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new BindingExpression( x, E2 )
        let B2 = new BindingExpression( f, y, E3 )
        let B3 = new BindingExpression( f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute bound symbol names in each case
        expect( B1.boundSymbolNames() ).to.eql( [ 'x' ] )
        expect( B2.boundSymbolNames() ).to.eql( [ 'f', 'y' ] )
        expect( B3.boundSymbolNames() ).to.eql( [ 'f', 'x', 'y' ] )
    } )

    it( 'Should know whether a binding expression binds a given symbol', () => {
        // Construct BindingExpressions as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new BindingExpression( x, E2 )
        let B2 = new BindingExpression( f, y, E3 )
        let B3 = new BindingExpression( f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute bound symbol names in each case
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

describe( 'BindingEnvironment', () => {

    it( 'Should declare all relevant global identifiers', () => {
        expect( BindingEnvironment ).to.be.ok
    } )

    let f, x, y, E1, E2, E3, LC1, LC2
    beforeEach( () => {
        // Construct a few objects for use in the tests below.
        f = new LurchSymbol( 'f' )
        x = new LurchSymbol( 'x' )
        y = new LurchSymbol( 'y' )
        E1 = new Environment
        E2 = new Environment
        E3 = new Environment
        LC1 = new LogicConcept
        LC2 = new LogicConcept( new LogicConcept )
    } )

    it( 'Should prevent construction with fewer than two arguments', () => {
        // Try to construct BindingEnvironments with too few arguments,
        // and verify that an error is thrown in each case.
        expect( () => { new BindingEnvironment } ).to.throw()
        expect( () => { new BindingEnvironment( f ) } ).to.throw()
        expect( () => { new BindingEnvironment( x ) } ).to.throw()
        expect( () => { new BindingEnvironment( E1 ) } ).to.throw()
        expect( () => { new BindingEnvironment( LC1 ) } ).to.throw()
    } )

    it( 'Should prevent construction with wrong argument types', () => {
        // Try to construct BindingEnvironments with non-Environments as the
        // first bound symbol, but all other parameters following the
        // construction rules, and verify that an error is thrown in each case.
        expect( () => { new BindingEnvironment( LC1, x, E1 ) } ).to.throw()
        expect( () => { new BindingEnvironment( LC2, x, y, E2 ) } ).to.throw()
        // Try to construct BindingEnvironments with non-Environments as the body,
        // but all other parameters following the construction rules,
        // and verify that an error is thrown in each case.
        expect( () => { new BindingEnvironment( x, LC1 ) } ).to.throw()
        expect( () => { new BindingEnvironment( x, y, LC2 ) } ).to.throw()
        // Try to construct BindingEnvironments with non-Symbols as the bound symbols,
        // but all other parameters following the construction rules,
        // and verify that an error is thrown in each case.
        expect( () => { new BindingEnvironment( LC1, E2 ) } ).to.throw()
        expect( () => { new BindingEnvironment( E2, x, y, E3 ) } ).to.throw()
        expect( () => { new BindingEnvironment( x, E2, y, E3 ) } ).to.throw()
        expect( () => { new BindingEnvironment( x, y, E2, E3 ) } ).to.throw()
    } )

    it( 'Should permit construction with correct argument types', () => {
        // Try to construct BindingEnvironment instances with an Environment as
        // the body, and Symbols as the bound symbols (of which there are >0),
        // and verify that no error is thrown in each case.
        expect( () => { new BindingEnvironment( x, E2 ) } ).not.to.throw()
        expect( () => { new BindingEnvironment( f, y, E3 ) } ).not.to.throw()
        expect( () => { new BindingEnvironment( f, x, y, E3 ) } ).not.to.throw()
    } )

    it( 'Should return boundSymbols and body correctly', () => {
        // Construct BindingEnvironments as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new BindingEnvironment( x, E2 )
        let B2 = new BindingEnvironment( f, y, E3 )
        let B3 = new BindingEnvironment( f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute boundSymbols in each case
        let tmp = B1.boundSymbols()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 1 )
        expect( tmp[0] ).to.equal( x )
        tmp = B2.boundSymbols()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 2 )
        expect( tmp[0] ).to.equal( B2.child( 0 ) )
        expect( tmp[1] ).to.equal( y )
        tmp = B3.boundSymbols()
        expect( tmp ).to.be.instanceof( Array )
        expect( tmp.length ).to.equal( 3 )
        expect( tmp[0] ).to.equal( B3.child( 0 ) )
        expect( tmp[1] ).to.equal( B3.child( 1 ) )
        expect( tmp[2] ).to.equal( B3.child( 2 ) )
        // compute body in each case
        expect( B1.body() ).to.equal( E2 )
        expect( B2.body() ).to.equal( E3 )
        expect( B3.body() ).to.equal( B3.child( 3 ) )
    } )

    it( 'Should return bound symbol names correctly', () => {
        // Construct BindingEnvironments as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new BindingEnvironment( x, E2 )
        let B2 = new BindingEnvironment( f, y, E3 )
        let B3 = new BindingEnvironment( f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute bound symbol names in each case
        expect( B1.boundSymbolNames() ).to.eql( [ 'x' ] )
        expect( B2.boundSymbolNames() ).to.eql( [ 'f', 'y' ] )
        expect( B3.boundSymbolNames() ).to.eql( [ 'f', 'x', 'y' ] )
    } )

    it( 'Should know whether a binding environment binds a given symbol', () => {
        // Construct BindingEnvironments as in earlier tests.
        // Note the importance of making copies when creating children!
        // Otherwise you remove the same instance from earlier parents.
        let B1 = new BindingEnvironment( x, E2 )
        let B2 = new BindingEnvironment( f, y, E3 )
        let B3 = new BindingEnvironment( f.copy(), x.copy(), y.copy(), E3.copy() )
        // compute bound symbol names in each case
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
