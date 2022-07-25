
// Import what we're testing
import { Environment } from '../src/environment.js'

// Import other classes we need to do the testing
import { LogicConcept } from '../src/logic-concept.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'
import Scoping from '../src/scoping.js'

// Import the spy function tool for testing callbacks/handlers
import { makeSpy } from './test-utils.js'


// Test suite begins here.

describe( 'Environment', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( Environment ).to.be.ok
    } )

} )

describe( 'Conclusions', () => {

    let A, B, C, D, E, _A, _B, _C, _D, _E

    beforeEach( () => {
        A = new LurchSymbol( 'A' )
        B = new LurchSymbol( 'B' )
        C = new LurchSymbol( 'C' )
        D = new LurchSymbol( 'D' )
        E = ( ...args ) => new Environment( ...args )
        _A = new LurchSymbol( 'A' ).asA( 'given' )
        _B = new LurchSymbol( 'B' ).asA( 'given' )
        _C = new LurchSymbol( 'C' ).asA( 'given' )
        _D = new LurchSymbol( 'D' ).asA( 'given' )
        _E = ( ...args ) => E( ...args ).makeIntoA( 'given' )
    } )
  
    it( 'should say the conclusions in { A } are only A', () => {
        let X = E( A )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( A )
        expect( A.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say the conclusions in { A B } are A and B', () => {
        let X = E( A, B )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( A )
        expect( Y ).to.contain( B )
        expect( A.isAConclusionIn( X ) ).to.equal( true )
        expect( B.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say the conclusions in { A { B } } are A and B', () => {
        let X = E( A, E( B ) )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( A )
        expect( Y ).to.contain( B )
        expect( A.isAConclusionIn( X ) ).to.equal( true )
        expect( B.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say the conclusions in :{ A B } are A and B', () => {
        let X = _E( A, B )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( A )
        expect( Y ).to.contain( B )
        expect( A.isAConclusionIn( X ) ).to.equal( true )
        expect( B.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say the conclusions in :{ :A B } are only B', () => {
        let X = _E( _A, B )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( B )
        expect( _A.isAConclusionIn( X ) ).to.equal( false )
        expect( B.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say the conclusions in :{ A :B } are only A', () => {
        let X = _E( A, _B )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( A )
        expect( A.isAConclusionIn( X ) ).to.equal( true )
        expect( _B.isAConclusionIn( X ) ).to.equal( false )
    } )
  
    it( 'should say there are no conclusions in :{ :A :B }', () => {
        let X = _E( _A, _B )
        let Y = X.conclusions()
        expect( Y ).to.eql( [ ] )
        expect( _A.isAConclusionIn( X ) ).to.equal( false )
        expect( _B.isAConclusionIn( X ) ).to.equal( false )
    } )
  
    it( 'should say the conclusions in { { A } } are only A', () => {
        let X = E( E( A ) )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( A )
        expect( A.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say there are no conclusions in { :{ A } }', () => {
        let X = E( _E( A ) )
        let Y = X.conclusions()
        expect( Y ).to.eql( [ ] )
        expect( A.isAConclusionIn( X ) ).to.equal( false )
    } )
  
    it( 'should say there are no conclusions in { { :A } }', () => {
        let X = E( E( _A ) )
        let Y = X.conclusions()
        expect( Y ).to.eql( [ ] )
        expect( _A.isAConclusionIn( X ) ).to.equal( false )
    } )
  
    it( 'should say the conclusions in { { :A B } } are only B', () => {
        let X = E( E( _A, B ) )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( B )
        expect( _A.isAConclusionIn( X ) ).to.equal( false )
        expect( B.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say the conclusions in { { :A B } C } are B and C', () => {
        let X = E( E( _A, B ), C )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( B )
        expect( Y ).to.contain( C )
        expect( _A.isAConclusionIn( X ) ).to.equal( false )
        expect( B.isAConclusionIn( X ) ).to.equal( true )
        expect( C.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say the conclusions in { :{ :A B } C } are only C', () => {
        let X = E( _E( _A, B ), C )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( C )
        expect( _A.isAConclusionIn( X ) ).to.equal( false )
        expect( B.isAConclusionIn( X ) ).to.equal( false )
        expect( C.isAConclusionIn( X ) ).to.equal( true )
    } )
  
    it( 'should say the conclusions in { { { :A B } :{ :C D } } :D } are only B', () => {
        let X = E( E( E( _A, B ), _E( _C, D ) ), _D )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( B )
        expect( _A.isAConclusionIn( X ) ).to.equal( false )
        expect( B.isAConclusionIn( X ) ).to.equal( true )
        expect( _C.isAConclusionIn( X ) ).to.equal( false )
        expect( D.isAConclusionIn( X ) ).to.equal( false )
        expect( _D.isAConclusionIn( X ) ).to.equal( false )
    } )
  
    it( 'should say the conclusions in { { :{ :A B } { C :D } } D } are C and D', () => {
        let X = E( E( _E( _A, B ), E( C, _D ) ), D )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( C )
        expect( Y ).to.contain( D )
        expect( _A.isAConclusionIn( X ) ).to.equal( false )
        expect( B.isAConclusionIn( X ) ).to.equal( false )
        expect( C.isAConclusionIn( X ) ).to.equal( true )
        expect( _D.isAConclusionIn( X ) ).to.equal( false )
        expect( D.isAConclusionIn( X ) ).to.equal( true )
    } )
  
} )

describe( 'Scope validation', () => {

    it( 'Should be able to get, set, and clear scope errors in any LC', () => {
        // try it on a Symbol LC
        let test = LogicConcept.fromPutdown( 'example' )[0]
        expect( test.constructor.className ).to.equal( 'Symbol' )
        expect( Scoping.scopeErrors( test ) ).to.be.undefined
        Scoping.addScopeError( test, {
            'invalid' : [ 'a', 'b' ]
        } )
        expect( Scoping.scopeErrors( test ) ).to.eql( {
            'invalid' : [ 'a', 'b' ]
        } )
        Scoping.addScopeError( test, {
            'undeclared' : [ 'c', 'd' ]
        } )
        expect( Scoping.scopeErrors( test ) ).to.eql( {
            'invalid' : [ 'a', 'b' ],
            'undeclared' : [ 'c', 'd' ]
        } )
        Scoping.clearScopeErrors( test )
        expect( Scoping.scopeErrors( test ) ).to.be.undefined
        // repeat a similar test on a Declaration LC
        test = LogicConcept.fromPutdown( '[x y z , (f (g x) (h y) (k z))]' )[0]
        expect( test.constructor.className ).to.equal( 'Declaration' )
        expect( Scoping.scopeErrors( test ) ).to.be.undefined
        Scoping.addScopeError( test, {
            'undeclared' : [ 'e' ]
        } )
        expect( Scoping.scopeErrors( test ) ).to.eql( {
            'undeclared' : [ 'e' ]
        } )
        Scoping.addScopeError( test, {
            'invalid' : [ 'one', 'two', 'three' ]
        } )
        expect( Scoping.scopeErrors( test ) ).to.eql( {
            'invalid' : [ 'one', 'two', 'three' ],
            'undeclared' : [ 'e' ]
        } )
        Scoping.clearScopeErrors( test )
        expect( Scoping.scopeErrors( test ) ).to.be.undefined
        // repeat a smaller test on an Environment LC
        test = LogicConcept.fromPutdown( '{ go go gadget arms }' )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        expect( Scoping.scopeErrors( test ) ).to.be.undefined
        Scoping.addScopeError( test, {
            'undeclared' : [ 'e' ],
            'invalid' : [ 'one', 'two', 'three' ]
        } )
        expect( Scoping.scopeErrors( test ) ).to.eql( {
            'invalid' : [ 'one', 'two', 'three' ],
            'undeclared' : [ 'e' ]
        } )
        Scoping.clearScopeErrors( test )
        expect( Scoping.scopeErrors( test ) ).to.be.undefined
        // repeat a smaller test on a Binding Environment LC
        test = LogicConcept.fromPutdown( 'x , { :(A x) (B x) }' )[0]
        expect( test.constructor.className ).to.equal( 'BindingEnvironment' )
        expect( Scoping.scopeErrors( test ) ).to.be.undefined
        Scoping.addScopeError( test, {
            'undeclared' : [],
            'invalid' : [ 'he', 'she', 'they', 'it' ]
        } )
        expect( Scoping.scopeErrors( test ) ).to.eql( {
            'invalid' : [ 'he', 'she', 'they', 'it' ],
            'undeclared' : []
        } )
        Scoping.clearScopeErrors( test )
        expect( Scoping.scopeErrors( test ) ).to.be.undefined
    } )

    // A little testing tool that will check all the descendants of an LC and
    // verify that the scope errors are only those marked with the given
    // addresses in the test data.
    const checkScopeErrorsDeeply = ( testLC, message, errorList = { } ) => {
        testLC.descendantsSatisfying( d => true ).map( d => {
            const address = d.address()
            if ( !errorList.hasOwnProperty( address ) )
                expect( Scoping.scopeErrors( d ),
                        `${message} (@${address})` ).to.be.undefined
            else
                expect( Scoping.scopeErrors( d ),
                        `${message} (@${address})` ).to.eql( errorList[address] )
            // console.log( 'Checked:', message, address, errorList[address],
            //     Scoping.scopeErrors( d ) )
        } )
    }

    it( 'Should find all symbols undeclared when no decls are present', () => {
        // An LC that contains various symbols at various places
        let test = LogicConcept.fromPutdown( `
        {
            {
                symbol1
                (operator operand1 operand2)
            }
            symbol2
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'no declarations 1' )
        // Now run the routine we wish to test
        Scoping.validate( test )
        // Now there should be "undeclared" scoping errors on every expression,
        // mentioning every one of its symbols, but no other errors.
        checkScopeErrorsDeeply( test, 'no declarations 2', {
            '0,0' : { undeclared : [ 'symbol1' ] },
            '0,1' : { undeclared : [ 'operator', 'operand1', 'operand2' ] },
            '1'   : { undeclared : [ 'symbol2' ] }
        } )
    } )

    it( 'Should mark undeclared only those symbols that actually are', () => {
        // Create same LC as in previous test, but now with three declarations.
        let test = LogicConcept.fromPutdown( `
        {
            [symbol1]       // this will make symbol1, below, declared
            {
                [operator operand2]  // succeeds in declaring two symbols
                symbol1
                (operator operand1 operand2)
                [symbol2]   // has no effect on symbol2, below, due to scoping
            }
            symbol2
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'basic declarations 1' )
        // Now run the routine we wish to test
        Scoping.validate( test )
        // Now there should be "undeclared" scoping errors at exactly those
        // expressions that have undeclared variables, but nowhere else.
        checkScopeErrorsDeeply( test, 'basic declarations 2', {
            '1,2' : { undeclared : [ 'operand1' ] },
            '2'   : { undeclared : [ 'symbol2' ] }
        } )
        // Run a similar test to the one above, but now using a binding
        // environment to make some symbols declared.
        test = LogicConcept.fromPutdown( `
        {
            (operand1 operand2),{
                symbol1
                (operator operand1 operand2)
            }
            symbol2
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'binding environment declarations 1' )
        // Now run the routine we wish to test
        Scoping.validate( test )
        // Now there should be "undeclared" scoping errors at exactly those
        // expressions that have undeclared variables, but nowhere else.
        checkScopeErrorsDeeply( test, 'binding environment declarations 2', {
            '0,2,0' : { undeclared : [ 'symbol1' ] },
            '0,2,1' : { undeclared : [ 'operator' ] },
            '1' :     { undeclared : [ 'symbol2' ] }
        } )
    } )

    it( 'Should ignore bound symbols when marking symbols undeclared', () => {
        // Create same LC as in previous test, but now with some bindings.
        let test = LogicConcept.fromPutdown( `
        {
            [symbol1]       // this will make symbol1, below, declared
            {
                [operator operand2]  // succeeds in declaring two symbols
                x , symbol1          // will not mark x undeclared
                operand1 , (operator operand1 operand2) // nor operand1
                [symbol2]   // has no effect on symbol2, below, due to scoping
            }
            symbol2
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'ignore bound symbols 1' )
        // Now run the routine we wish to test
        Scoping.validate( test )
        // Now there should be "undeclared" scoping errors at exactly those
        // expressions that have undeclared variables, but nowhere else.
        checkScopeErrorsDeeply( test, 'ignore bound symbols 2', {
            '2' : { undeclared : [ 'symbol2' ] }
        } )
    } )

    it( 'Should mark nothing undeclared if all are declared', () => {
        // Create same LC as in an earlier test, but now with three declarations.
        let test = LogicConcept.fromPutdown( `
        {
            [symbol1 symbol2 operator operand1 operand2] // declare everything
            {
                symbol1
                (operator operand1 operand2)
            }
            symbol2
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'everything declared 1' )
        // Now run the routine we wish to test
        Scoping.validate( test )
        // And in this test there should still be no scoping errors, because we
        // declared all free variables up front.
        checkScopeErrorsDeeply( test, 'everything declared 2' )
    } )

    it( 'Should run the implicit handler on all undeclared variables', () => {
        // We re-use a test case from earlier that contained many undeclared
        // variables.  We will ensure that our implicit variable declaration
        // handler gets called on all of them, but not any declared ones.
        let test = LogicConcept.fromPutdown( `
        {
            {
                symbol1       // all symbols are implicitly declared...
                [operator]    // ...except operator!
                (operator operand1 operand2)
            }
            symbol2
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'calls to implicit handler 1' )
        // Now run the routine we wish to test, but with a spy function as the
        // implicit variable declaration handler, so we know when it got called.
        // (We will test further below that it got called exactly when it should
        // have been.)
        const implicitHandler = makeSpy()
        Scoping.validate( test, implicitHandler )
        // Now there should be "undeclared" scoping errors on every expression,
        // mentioning every one of its symbols, but no other errors.
        checkScopeErrorsDeeply( test, 'calls to implicit handler 2', {
            '0,0' : { undeclared : [ 'symbol1' ] },
            '0,2' : { undeclared : [ 'operand1', 'operand2' ] },
            '1'   : { undeclared : [ 'symbol2' ] }
        } )
        // But furthermore, did the implicit variable declaration handler get
        // called when it should have been?
        expect( implicitHandler.callRecord ).to.be.instanceof( Array )
        expect( implicitHandler.callRecord.length ).to.equal( 4 )
        expect( implicitHandler.callRecord[0] ).to.be.instanceof( Array )
        expect( implicitHandler.callRecord[0].length ).to.equal( 2 )
        expect( implicitHandler.callRecord[0][0] ).to.equal( 'symbol1' )
        expect( implicitHandler.callRecord[0][1] )
            .to.equal( test.child( 0, 0 ) )
        expect( implicitHandler.callRecord[1] ).to.be.instanceof( Array )
        expect( implicitHandler.callRecord[1].length ).to.equal( 2 )
        expect( implicitHandler.callRecord[1][0] ).to.equal( 'operand1' )
        expect( implicitHandler.callRecord[1][1] )
            .to.equal( test.child( 0, 2 ) )
        expect( implicitHandler.callRecord[2] ).to.be.instanceof( Array )
        expect( implicitHandler.callRecord[2].length ).to.equal( 2 )
        expect( implicitHandler.callRecord[2][0] ).to.equal( 'operand2' )
        expect( implicitHandler.callRecord[2][1] )
            .to.equal( test.child( 0, 2 ) )
        expect( implicitHandler.callRecord[3] ).to.be.instanceof( Array )
        expect( implicitHandler.callRecord[3].length ).to.equal( 2 )
        expect( implicitHandler.callRecord[3][0] ).to.equal( 'symbol2' )
        expect( implicitHandler.callRecord[3][1] )
            .to.equal( test.child( 1 ) )
    } )

    it( 'Should respect declarations added by the implicit handler', () => {
        // We re-use a test case from earlier that contained many undeclared
        // variables.  We will explicitly declare all of them at exactly the
        // point at which they were implicitly declared, and verify that they
        // are then NOT marked "undeclared" thereafter.
        let test = LogicConcept.fromPutdown( `
        {
            {
                symbol1
                (operator operand1 operand2)
            }
            symbol2
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'make declarations explicit 1' )
        // Now define a simple implicit declaration handler and run validation
        // using it.
        const implicitHandler = ( symbolName, location ) =>
            Scoping.addImplicitDeclaration( location, symbolName )
        Scoping.validate( test, implicitHandler )
        // Now there should be nothing undeclared, because we just took all
        // undeclared variables and declared them.
        checkScopeErrorsDeeply( test, 'make declarations explicit 2' )
    } )

    it( 'Should mark redeclared variables as such', () => {
        // Create same LC as in an earlier test, but now with three declarations.
        let test = LogicConcept.fromPutdown( `
        {
            [symbol1 operand1]    // declare two things
            {
                [symbol1]         // redeclare symbol1 (which is erroneous)
                symbol1
                (operator operand1 operand2)
                [symbol2]         // declare symbol2 (uselessly at this point)
            }
            [symbol2]             // thus this is not a redeclaration
            symbol2
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'testing redeclarations 1' )
        // Now run the routine we wish to test
        Scoping.validate( test )
        // And in this test there should still be no scoping errors, because we
        // declared all free variables up front.
        checkScopeErrorsDeeply( test, 'testing redeclarations 2', {
            '1,0' : { redeclared : [ 'symbol1' ] }, // <-- the main point
            '1,2' : { undeclared : [ 'operator', 'operand2' ] }
            // and we are NOT asking if symbol2 is redeclared, because it isn't
        } )
    } )

    it( 'Should mark variables redeclared by the implicit handler', () => {
        // This should almost never happen, because the implicit handler is
        // called only for things that have not been declared, so one would need
        // to write a handler that somehow ends up declaring a variable more
        // than once, which is very difficult to do.  We use here a rather silly
        // implicit declaration handler, just to test this corner case.
        let test = LogicConcept.fromPutdown( `
        {
            {
                symbol1
                (operator operand1 operand2)
            }
            symbol2
            just_another_thing
        }
        ` )[0]
        expect( test.constructor.className ).to.equal( 'Environment' )
        // Initially/by default, there are absolutely no scoping errors
        checkScopeErrorsDeeply( test, 'corner case 1' )
        // Now define the silly implicit declaration handler and run validation
        // using it.
        const implicitHandler = ( symbolName, location ) => {
            // declare what you'd expect us to:
            Scoping.addImplicitDeclaration( location, symbolName )
            // also, for no good reason at all, declare x:
            Scoping.addImplicitDeclaration( location, 'x' )
        }
        Scoping.validate( test, implicitHandler )
        // Now there should be nothing undeclared, because we just took all
        // undeclared variables and declared them, but there should also be some
        // redeclaration errors, because we declared x several times.
        checkScopeErrorsDeeply( test, 'corner case 2', {
            '0,1' : { redeclared : [ 'x' ] },
            '2' :   { redeclared : [ 'x' ] }
        } )
    } )

} )
