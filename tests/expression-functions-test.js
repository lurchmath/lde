
import M from '../src/matching.js'
import { Symbol } from '../src/symbol.js'
import { Application } from '../src/application.js'
import { Environment } from '../src/environment.js'
import { LogicConcept } from '../src/logic-concept.js'
import { metavariable } from '../src/matching/metavariables.js'

describe( 'Expression Functions', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( M.newEF ).to.be.ok
        expect( M.isAnEF ).to.be.ok
        expect( M.arityOfEF ).to.be.ok
        expect( M.applyEF ).to.be.ok
        expect( M.newEFA ).to.be.ok
        expect( M.isAnEFA ).to.be.ok
    } )

    it( 'Should let us construct valid expression functions', () => {
        // lambda x . x // identity function
        expect( () => M.newEF(
            new Symbol( 'x' ), new Symbol( 'x' )
        ) ).not.to.throw()
        // lambda v1,v2,v3,v4 . v2 // projection function
        expect( () => M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        ) ).not.to.throw()
        // lambda u,v . u-1 + v-1 // function with application body
        expect( () => M.newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        ) ).not.to.throw()
        // lambda i,n . sum from 1 to n of x^i // function with binding body
        expect( () => M.newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        ) ).not.to.throw()
    } )

    it( 'Should forbid construction of invalid expression functions', () => {
        // lambda x+1 . x // parameter not a symbol
        expect( () => M.newEF(
            LogicConcept.fromPutdown( '(+ x 1)' )[0], new Symbol( 'x' )
        ) ).to.throw()
        // lambda x,{} . x // parameter not a symbol
        expect( () => M.newEF(
            new Symbol( 'x' ), new Environment(), new Symbol( 'x' )
        ) ).to.throw()
        // lambda // not enough arguments given to constructor
        expect( () => M.newEF() ).to.throw()
        // lambda v1 // not enough arguments given to constructor
        expect( () => M.newEF( new Symbol( 'v1' ) ) ).to.throw()
    } )

    it( 'Should be able to distinguish EFs using isAnEF', () => {
        // First, make sure that all the EFs we constructed in the test above,
        // where we constructed valid EFs, pass the isAnEF() test.
        expect( M.isAnEF( M.newEF(
            new Symbol( 'x' ), new Symbol( 'x' )
        ) ) ).to.equal( true )
        expect( M.isAnEF( M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        ) ) ).to.equal( true )
        expect( M.isAnEF( M.newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        ) ) ).to.equal( true )
        expect( M.isAnEF( M.newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        ) ) ).to.equal( true )
        // Now make sure that several other kinds of expressions all fail the
        // isAnEF() test.  Such as:
        // A Symbol
        expect( M.isAnEF( new Symbol( 'x' ) ) ).to.equal( false )
        // An Application
        expect( M.isAnEF( new Application( new Symbol( 'x' ) ) ) )
            .to.equal( false )
        // A Binding
        expect( M.isAnEF( LogicConcept.fromPutdown( '(sum i , (f i))' )[0] ) )
            .to.equal( false )
        // An Environment
        expect( M.isAnEF( new Environment() ) ).to.equal( false )
        // A Declaration
        expect( M.isAnEF( LogicConcept.fromPutdown( '[pi e const]' )[0] ) )
            .to.equal( false )
        // A compound expression
        expect( M.isAnEF( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0] ) )
            .to.equal( false )
        // An EFA
        expect( M.isAnEF( M.newEFA(
            M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) ), new Symbol( '2' )
        ) ) ).to.equal( false )
    } )

    it( 'Should be able to detect the arity of expression functions', () => {
        // Reconstruct all the EFs we've used before, but this time compute the
        // arity of each.
        expect( M.arityOfEF( M.newEF(
            new Symbol( 'x' ), new Symbol( 'x' )
        ) ) ).to.equal( 1 )
        expect( M.arityOfEF( M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        ) ) ).to.equal( 4 )
        expect( M.arityOfEF( M.newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        ) ) ).to.equal( 2 )
        expect( M.arityOfEF( M.newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        ) ) ).to.equal( 2 )
        // Ask for the arity of all the non-EFs we tested before, and ensure
        // that each throws an error.
        expect( () => M.arityOfEF( new Symbol( 'x' ) ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.arityOfEF( new Application( new Symbol( 'x' ) ) ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.arityOfEF( LogicConcept.fromPutdown( '(sum i , (f i))' )[0] ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.arityOfEF( new Environment() ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.arityOfEF( LogicConcept.fromPutdown( '[pi e const]' )[0] ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.arityOfEF( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0] ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.arityOfEF( M.newEFA(
            M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) ), new Symbol( '2' )
        ) ) ).to.throw( /requires an expression function/ )
    } )

    it( 'Should be able to correctly apply expression functions', () => {
        // Reconstruct all the EFs we've used before, but this time try applying
        // each to some arguments.  In cases where it's relevant, ensure that
        // the result is an entirely new object, not the exact same thing as any
        // of the arguments.
        let ef, args, result
        ef = M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        args = [ LogicConcept.fromPutdown( '(Animal Crossing)' )[0] ]
        result = LogicConcept.fromPutdown( '(Animal Crossing)' )[0]
        expect( M.applyEF( ef, ...args ).equals( result ) ).to.equal( true )
        expect( args.some( arg => arg == M.applyEF( ef, ...args ) ) )
            .to.equal( false )
        ef = M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        args = [
            new Symbol( 'first' ), new Symbol( 'second' ),
            new Symbol( 'third' ), new Symbol( 'fourth' )
        ]
        result = new Symbol( 'second' )
        expect( M.applyEF( ef, ...args ).equals( result ) ).to.equal( true )
        expect( args.some( arg => arg == M.applyEF( ef, ...args ) ) )
            .to.equal( false )
        ef = M.newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        )
        args = LogicConcept.fromPutdown( '"FOO" "BAR"' )
        result = LogicConcept.fromPutdown( '(+ (- "FOO" 1) (- "BAR" 1))' )[0]
        expect( M.applyEF( ef, ...args ).equals( result ) ).to.equal( true )
        ef = M.newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        )
        args = [ new Symbol( 2 ), new Symbol( 10 ) ]
        result = LogicConcept.fromPutdown( '((sum 1 10) x , (^ x 2))' )[0]
        expect( M.applyEF( ef, ...args ).equals( result ) ).to.equal( true )
        // Try to apply the same EFs to an incorrect number of arguments and
        // ensure we get errors in each case.
        ef = M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        args = LogicConcept.fromPutdown( 'Animal Crossing' ) // 2 instead of 1
        expect( () => M.applyEF( ef, ...args ) )
            .to.throw( /Incorrect number of arguments/ )
        ef = M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        args = [ new Symbol( 'first' ), new Symbol( 'second' ) ] // 2 instead of 4
        expect( () => M.applyEF( ef, ...args ) )
            .to.throw( /Incorrect number of arguments/ )
        ef = M.newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        )
        args = LogicConcept.fromPutdown( '"FOO"' ) // 1 instead of 2
        expect( () => M.applyEF( ef, ...args ) )
            .to.throw( /Incorrect number of arguments/ )
        ef = M.newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        )
        args = [ ] // 0 instead of 2
        expect( () => M.applyEF( ef, ...args ) )
            .to.throw( /Incorrect number of arguments/ )
        // Try to apply some non-EFs and ensure we get errors in each case.
        expect( () => M.applyEF( new Symbol( 'x' ), args ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.applyEF( new Application( new Symbol( 'x' ) ), args ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.applyEF( LogicConcept.fromPutdown( '(sum i , (f i))' )[0], args ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.applyEF( new Environment(), args ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.applyEF( LogicConcept.fromPutdown( '[pi e const]' )[0], args ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.applyEF( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0], args ) )
            .to.throw( /requires an expression function/ )
        expect( () => M.applyEF( M.newEFA(
            M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) ), new Symbol( '2' )
        ), args ) ).to.throw( /requires an expression function/ )
    } )

    it( 'Should be able to build and apply constant and projection EFs', () => {
        // Ensure that constantEF() always creates functions with the requested
        // arity.
        const B = LogicConcept.fromPutdown( '(example body)' )[0]
        const C = LogicConcept.fromPutdown( '"another one"' )[0]
        expect( M.arityOfEF( M.constantEF( 1, B ) ) ).to.equal( 1 )
        expect( M.arityOfEF( M.constantEF( 2, B ) ) ).to.equal( 2 )
        expect( M.arityOfEF( M.constantEF( 3, B ) ) ).to.equal( 3 )
        expect( M.arityOfEF( M.constantEF( 4, B ) ) ).to.equal( 4 )
        // Ensure that constantEF() always creates functions with the requested
        // body.
        expect( M.constantEF( 1, B ).body().equals( B ) ).to.equal( true )
        expect( M.constantEF( 2, B ).body().equals( B ) ).to.equal( true )
        expect( M.constantEF( 3, C ).body().equals( C ) ).to.equal( true )
        expect( M.constantEF( 4, C ).body().equals( C ) ).to.equal( true )
        // Ensure that applying a constantEF() always gives the same output.
        expect( M.applyEF( M.constantEF( 1, B ), new Symbol( 5 ) ).equals( B ) )
            .to.equal( true )
        expect( M.applyEF( M.constantEF( 1, B ), new Symbol( "YO!" ) ).equals( B ) )
            .to.equal( true )
        expect( M.applyEF( M.constantEF( 1, C ), new Symbol( 5 ) ).equals( C ) )
            .to.equal( true )
        expect(
            M.applyEF(
                M.constantEF( 3, C ),
                new Symbol( "YO!" ),
                new Symbol( "Adrian!" ),
                new Symbol( "It's Rocky!" )
            ).equals( C )
        ).to.equal( true )
        // Ensure that constantEF() avoids using parameters that appear in the
        // body
        const defaultParam = M.constantEF( 1, new Symbol( 1 ) ).boundVariables()[0]
        const shouldAvoidIt = M.constantEF( 1, defaultParam )
        expect( M.isAnEF( shouldAvoidIt ) ).to.equal( true )
        expect( M.arityOfEF( shouldAvoidIt ) ).to.equal( 1 )
        expect( shouldAvoidIt.boundVariables()[0].equals( defaultParam ) )
            .to.equal( false )
        expect( shouldAvoidIt.body().equals( defaultParam ) ).to.equal( true )
        // Ensure that projectionEF() always creates functions with the
        // requested arity.
        expect( M.arityOfEF( M.projectionEF( 1, 0 ) ) ).to.equal( 1 )
        expect( M.arityOfEF( M.projectionEF( 2, 0 ) ) ).to.equal( 2 )
        expect( M.arityOfEF( M.projectionEF( 3, 1 ) ) ).to.equal( 3 )
        expect( M.arityOfEF( M.projectionEF( 4, 1 ) ) ).to.equal( 4 )
        // Ensure that projectionEF() always creates functions whose body is a
        // copy of one of the parameters--and the correct one.
        let ef
        ef = M.projectionEF( 1, 0 )
        expect( ef.body().equals( ef.boundVariables()[0] ) ).to.equal( true )
        ef = M.projectionEF( 2, 0 )
        expect( ef.body().equals( ef.boundVariables()[0] ) ).to.equal( true )
        ef = M.projectionEF( 3, 1 )
        expect( ef.body().equals( ef.boundVariables()[1] ) ).to.equal( true )
        ef = M.projectionEF( 4, 1 )
        expect( ef.body().equals( ef.boundVariables()[1] ) ).to.equal( true )
        // Ensure that applying a projectionEF() gives a copy of one of the
        // arguments as output--but just a copy, not the actual argument.
        let args, result
        ef = M.projectionEF( 1, 0 )
        args = [ new Symbol( 5 ) ]
        result = M.applyEF( ef, ...args )
        expect( result.equals( args[0] ) ).to.equal( true )
        expect( result === args[0] ).to.equal( false )
        ef = M.projectionEF( 2, 0 )
        args = [ new Symbol( "and" ), new Symbol( "or" ) ]
        result = M.applyEF( ef, ...args )
        expect( result.equals( args[0] ) ).to.equal( true )
        expect( result === args[0] ).to.equal( false )
        ef = M.projectionEF( 3, 1 )
        args = LogicConcept.fromPutdown( 'sym (a p p) (bind ing , body)' )
        result = M.applyEF( ef, ...args )
        expect( result.equals( args[1] ) ).to.equal( true )
        expect( result === args[1] ).to.equal( false )
        ef = M.projectionEF( 4, 1 )
        args = LogicConcept.fromPutdown( '9 88 777 6666' )
        result = M.applyEF( ef, ...args )
        expect( result.equals( args[1] ) ).to.equal( true )
        expect( result === args[1] ).to.equal( false )
    } )

    it( 'Should be able to build complex application EFs', () => {
        // We do just two tests of this as example cases
        let names, arity, ef, body, params, child
        // Example 1: applicationEF(2,['A','B']) should give
        // lambda v1,v2. ((EFA A v1 v2) (EFA B v1 v2))
        arity = 2
        names = [ 'A', 'B' ]
        ef = M.applicationEF( arity, names )
        expect( M.isAnEF( ef ) ).to.equal( true )
        params = ef.boundVariables()
        expect( M.arityOfEF( ef ) ).to.equal( arity )
        expect( params.length ).to.equal( arity )
        body = ef.body()
        expect( body instanceof Application ).to.equal( true )
        expect( body.numChildren() ).to.equal( names.length )
        child = body.child( 0 )
        expect( M.isAnEFA( child ) ).to.equal( true )
        expect( child.numChildren() ).to.equal( params.length + 2 )
        expect( child.child( 1 ) instanceof Symbol ).to.equal( true )
        expect( child.child( 1 ).text() ).to.equal( names[0] )
        expect( child.child( 2 ).equals( params[0] ) ).to.equal( true )
        expect( child.child( 3 ).equals( params[1] ) ).to.equal( true )
        child = body.child( 1 )
        expect( M.isAnEFA( child ) ).to.equal( true )
        expect( child.numChildren() ).to.equal( params.length + 2 )
        expect( child.child( 1 ) instanceof Symbol ).to.equal( true )
        expect( child.child( 1 ).text() ).to.equal( names[1] )
        expect( child.child( 2 ).equals( params[0] ) ).to.equal( true )
        expect( child.child( 3 ).equals( params[1] ) ).to.equal( true )
        // Example 2: applicationEF(2,['v2','v1']) should give
        // lambda v3,v4. ((EFA v2 v3 v4) (EFA v1 v3 v4))
        arity = 2
        names = [ 'v2', 'v1' ]
        ef = M.applicationEF( arity, names )
        expect( M.isAnEF( ef ) ).to.equal( true )
        params = ef.boundVariables()
        expect( M.arityOfEF( ef ) ).to.equal( arity )
        expect( params.length ).to.equal( arity )
        expect( params[0].text() ).not.to.be.oneOf( names ) // avoided capture
        expect( params[1].text() ).not.to.be.oneOf( names ) // avoided capture
        body = ef.body()
        expect( body instanceof Application ).to.equal( true )
        expect( body.numChildren() ).to.equal( names.length )
        child = body.child( 0 )
        expect( M.isAnEFA( child ) ).to.equal( true )
        expect( child.numChildren() ).to.equal( params.length + 2 )
        expect( child.child( 1 ) instanceof Symbol ).to.equal( true )
        expect( child.child( 1 ).text() ).to.equal( names[0] )
        expect( child.child( 2 ).equals( params[0] ) ).to.equal( true )
        expect( child.child( 3 ).equals( params[1] ) ).to.equal( true )
        child = body.child( 1 )
        expect( M.isAnEFA( child ) ).to.equal( true )
        expect( child.numChildren() ).to.equal( params.length + 2 )
        expect( child.child( 1 ) instanceof Symbol ).to.equal( true )
        expect( child.child( 1 ).text() ).to.equal( names[1] )
        expect( child.child( 2 ).equals( params[0] ) ).to.equal( true )
        expect( child.child( 3 ).equals( params[1] ) ).to.equal( true )
        // Example 3: applicationEF(1,[x,y,z]) should give
        // lambda v1. ((EFA x v1) (EFA y v1) (EFA z v1))
        arity = 1
        names = [ new Symbol( 'x' ), new Symbol( 'y' ), new Symbol( 'z' ) ]
        ef = M.applicationEF( arity, names )
        expect( M.isAnEF( ef ) ).to.equal( true )
        params = ef.boundVariables()
        expect( M.arityOfEF( ef ) ).to.equal( arity )
        expect( params.length ).to.equal( arity )
        body = ef.body()
        expect( body instanceof Application ).to.equal( true )
        expect( body.numChildren() ).to.equal( names.length )
        child = body.child( 0 )
        expect( M.isAnEFA( child ) ).to.equal( true )
        expect( child.numChildren() ).to.equal( params.length + 2 )
        expect( child.child( 1 ) instanceof Symbol ).to.equal( true )
        expect( child.child( 1 ).text() ).to.equal( names[0].text() )
        expect( child.child( 2 ).equals( ef.boundVariables()[0] ) ).to.equal( true )
        child = body.child( 1 )
        expect( M.isAnEFA( child ) ).to.equal( true )
        expect( child.numChildren() ).to.equal( params.length + 2 )
        expect( child.child( 1 ) instanceof Symbol ).to.equal( true )
        expect( child.child( 1 ).text() ).to.equal( names[1].text() )
        expect( child.child( 2 ).equals( ef.boundVariables()[0] ) ).to.equal( true )
        child = body.child( 2 )
        expect( M.isAnEFA( child ) ).to.equal( true )
        expect( child.numChildren() ).to.equal( params.length + 2 )
        expect( child.child( 1 ) instanceof Symbol ).to.equal( true )
        expect( child.child( 1 ).text() ).to.equal( names[2].text() )
        expect( child.child( 2 ).equals( ef.boundVariables()[0] ) ).to.equal( true )
    } )

    it( 'Should let us construct valid EFAs', () => {
        // (lambda x . x)(a) // identity function
        const idEF = M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        expect( () => M.newEFA( idEF, new Symbol( 'a' ) ) ).not.to.throw()
        // (lambda v1,v2,v3,v4 . v2)(1,2,3,4)
        const projEF = M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        expect( () => M.newEFA(
            projEF,
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 ), new Symbol( 4 )
        ) ).not.to.throw()
        // (MV p) where MV is a metavariable // not an EF (yet)
        let MV = new Symbol( 'M' ).asA( metavariable )
        expect( () => M.newEFA( MV, new Symbol( 'p' ) ) ).not.to.throw()
        // (MV p q) where MV is a metavariable // not an EF (yet)
        expect( () => M.newEFA(
            MV, new Symbol( 'p' ), new Symbol( 'q' )
        ) ).not.to.throw()
        // (MV p q r) where MV is a metavariable // not an EF (yet)
        expect( () => M.newEFA(
            MV, new Symbol( 'p' ), new Symbol( 'q' ), new Symbol( 'r' )
        ) ).not.to.throw()
    } )

    it( 'Should not let us construct invalid EFAs', () => {
        // (lambda x . x)() // not enough arguments
        const idEF = M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        expect( () => M.newEFA( idEF ) ).to.throw()
        // (lambda x . x)(1,2) // too many arguments
        expect( () => M.newEFA(
            idEF, new Symbol( 1 ), new Symbol( 2 )
        ) ).to.throw()
        // (lambda v1,v2,v3,v4 . v2)("hi") // too few arguments
        const projEF = M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        expect( () => M.newEFA( projEF, new Symbol( "hi" ) ) ).to.throw()
        // (MV) where MV is a metavariable // too few arguments
        let MV = new Symbol( 'MV' ).asA( metavariable )
        expect( () => M.newEFA( MV ) ).to.throw()
    } )

    it( 'Should be able to distinguish EFAs using isAnEFA', () => {
        // First, make sure that all the EFAs we constructed in the test above,
        // where we constructed valid EFAs, pass the isAnEFA() test.
        const idEF = M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        expect( M.isAnEFA( M.newEFA( idEF, new Symbol( 'a' ) ) ) ).to.equal( true )
        const projEF = M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        expect( M.isAnEFA( M.newEFA(
            projEF,
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 ), new Symbol( 4 )
        ) ) ).to.equal( true )
        let MV = new Symbol( 'MV' ).asA( metavariable )
        expect( M.isAnEFA( M.newEFA( MV, new Symbol( 'p' ) ) ) ).to.equal( true )
        expect( M.isAnEFA( M.newEFA(
            MV, new Symbol( 'p' ), new Symbol( 'q' )
        ) ) ).to.equal( true )
        expect( M.isAnEFA( M.newEFA(
            MV, new Symbol( 'p' ), new Symbol( 'q' ), new Symbol( 'r' )
        ) ) ).to.equal( true )
        // Now make sure that several other kinds of expressions all fail the
        // isAnEFA() test.  Such as:
        // A Symbol
        expect( M.isAnEFA( new Symbol( 'x' ) ) ).to.equal( false )
        // An Application
        expect( M.isAnEFA( new Application( new Symbol( 'x' ) ) ) )
            .to.equal( false )
        // A Binding
        expect( M.isAnEFA( LogicConcept.fromPutdown( '(sum i , (f i))' )[0] ) )
            .to.equal( false )
        // An Environment
        expect( M.isAnEFA( new Environment() ) ).to.equal( false )
        // A Declaration
        expect( M.isAnEFA( LogicConcept.fromPutdown( '[pi e const]' )[0] ) )
            .to.equal( false )
        // A compound expression
        expect( M.isAnEFA( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0] ) )
            .to.equal( false )
        // An EF
        expect( M.isAnEFA( idEF ) ).to.equal( false )
        expect( M.isAnEFA( projEF ) ).to.equal( false )
    } )

    it( 'Should be able to tell when beta reduction is possible', () => {
        let efa
        // Two of the EFAs we constructed in the previous test use actual EFs,
        // and thus can be part of an expression that can be beta-reduced
        const idEF = M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        efa = M.newEFA( idEF, new Symbol( 'a' ) )
        expect( M.isAnEFA( efa ) ).to.equal( true )
        expect( M.canBetaReduce( efa ) ).to.equal( true )
        const projEF = M.newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        efa = M.newEFA(
            projEF,
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 ), new Symbol( 4 )
        )
        expect( M.isAnEFA( efa ) ).to.equal( true )
        expect( M.canBetaReduce( efa ) ).to.equal( true )
        // Those same two EFAs, if we change the number of arguments, can no
        // longer be beta-reduced
        efa = M.newEFA( idEF, new Symbol( 'a' ) ) // correct # of args
        efa.pushChild( new Symbol( 'b' ) ) // now too many args
        expect( M.isAnEFA( efa ) ).to.equal( true )
        expect( M.canBetaReduce( efa ) ).to.equal( false )
        efa = M.newEFA( projEF, // correct # of args:
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 ), new Symbol( 4 ) )
        efa.popChild() // now too few args
        expect( M.isAnEFA( efa ) ).to.equal( true )
        expect( M.canBetaReduce( efa ) ).to.equal( false )
        // The EFAs created in the previous test using metavariables for the EF
        // cannot be beta-reduced, because we don't know the actual EF to use
        let MV = new Symbol( 'MV' ).asA( metavariable )
        efa = M.newEFA( MV, new Symbol( 'p' ) )
        expect( M.isAnEFA( efa ) ).to.equal( true )
        expect( M.canBetaReduce( efa ) ).to.equal( false )
        efa = M.newEFA( MV, new Symbol( 'p' ), new Symbol( 'q' ) )
        expect( M.isAnEFA( efa ) ).to.equal( true )
        expect( M.canBetaReduce( efa ) ).to.equal( false )
        efa = M.newEFA( MV, new Symbol( 'p' ), new Symbol( 'q' ), new Symbol( 'r' ) )
        expect( M.isAnEFA( efa ) ).to.equal( true )
        expect( M.canBetaReduce( efa ) ).to.equal( false )
        // And of course, anything that's not a valid EFA in the first place
        // cannot be beta-reduced
        expect( M.canBetaReduce( new Symbol( 'x' ) ) ).to.equal( false )
        expect( M.canBetaReduce( new Application( new Symbol( 'x' ) ) ) )
            .to.equal( false )
        expect( M.canBetaReduce( LogicConcept.fromPutdown( '(sum i , (f i))' )[0] ) )
            .to.equal( false )
        expect( M.canBetaReduce( new Environment() ) ).to.equal( false )
        expect( M.canBetaReduce( LogicConcept.fromPutdown( '[pi e const]' )[0] ) )
            .to.equal( false )
        expect( M.canBetaReduce( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0] ) )
            .to.equal( false )
        expect( M.canBetaReduce( idEF ) ).to.equal( false )
        expect( M.canBetaReduce( projEF ) ).to.equal( false )
    } )

    it( 'Should be able to do single steps of beta reduction', () => {
        let expr, result
        // If no beta reductions are needed, we get undefined
        expr = LogicConcept.fromPutdown( '(no (beta reductions) "here")' )[0]
        expect( M.betaReduce( expr ) ).to.be.undefined
        // If the expression is an EFA, it will be done; we use an example from
        // an earlier test of applyEF
        expr = M.newEFA(
            M.newEF(
                new Symbol( 'u' ), new Symbol( 'v' ),
                LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
            ),
            ...LogicConcept.fromPutdown( '"FOO" "BAR"' )
        )
        result = LogicConcept.fromPutdown( '(+ (- "FOO" 1) (- "BAR" 1))' )[0]
        expect( M.betaReduce( expr ).equals( result ) ).to.equal( true )
        // If the expression contains an EFA, but that EFA is not the whole
        // expression, then we get undefined.  This is part of what
        // distinguishes betaReduce() from fullBetaReduce().
        expr = new Application( // (+ 5 ((lambda v1 v2 , v2) 6 7))
            new Symbol( '+' ),
            new Symbol( 5 ),
            M.newEFA(
                M.newEF(
                    new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v2' )
                ),
                new Symbol( 6 ),
                new Symbol( 7 )
            )
        )
        result = LogicConcept.fromPutdown( '(+ 5 7)' )[0]
        expect( M.betaReduce( expr ) ).to.be.undefined
    } )

    it( 'Should be able to do all beta reductions in an expression', () => {
        let expr, result
        // If no beta reductions are needed, we just get back an exact copy.
        expr = LogicConcept.fromPutdown( '(no (beta reductions) "here")' )[0]
        result = expr.copy()
        expect( M.fullBetaReduce( expr ).equals( result ) ).to.equal( true )
        // If the expression is an EFA, it will be done; we use an example from
        // an earlier test of applyEF
        expr = M.newEFA(
            M.newEF(
                new Symbol( 'u' ), new Symbol( 'v' ),
                LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
            ),
            ...LogicConcept.fromPutdown( '"FOO" "BAR"' )
        )
        result = LogicConcept.fromPutdown( '(+ (- "FOO" 1) (- "BAR" 1))' )[0]
        expect( M.fullBetaReduce( expr ).equals( result ) ).to.equal( true )
        // If the expression contains an EFA, it will be done; we use an example
        // from an earlier test of applyEF, but this time deeper inside a larger
        // expression
        expr = new Application( // (+ 5 ((lambda v1 v2 , v2) 6 7))
            new Symbol( '+' ),
            new Symbol( 5 ),
            M.newEFA(
                M.newEF(
                    new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v2' )
                ),
                new Symbol( 6 ),
                new Symbol( 7 )
            )
        )
        result = LogicConcept.fromPutdown( '(+ 5 7)' )[0]
        expect( M.fullBetaReduce( expr ).equals( result ) ).to.equal( true )
        // Multiple EFAs in the same expression work fine.
        expr = new Application(
            M.newEFA(
                M.newEF( new Symbol( 'x' ), new Symbol( 'x' ) ),
                LogicConcept.fromPutdown( '(∃ y , (P y))' )[0]
            ),
            M.newEFA(
                M.newEF( new Symbol( 'x' ), new Symbol( 'y' ), new Symbol( 'x' ) ),
                ...LogicConcept.fromPutdown( '(a b) (c d)' )
            )
        )
        result = LogicConcept.fromPutdown( '((∃ y , (P y)) (a b))' )[0]
        expect( M.fullBetaReduce( expr ).equals( result ) ).to.equal( true )
        // Even nested EFAs work okay, as long as it is one that terminates
        expr = new Application(
            new Symbol( "and the answer is:" ),
            M.newEFA(
                M.newEF(
                    new Symbol( 'x' ),
                    new Symbol( 'y' ),
                    LogicConcept.fromPutdown( '(together x y)' )[0]
                ),
                LogicConcept.fromPutdown( '(once (upon (a time)))' )[0],
                M.newEFA(
                    M.newEF(
                        new Symbol( 'v' ),
                        LogicConcept.fromPutdown( '(v v v)' )[0]
                    ),
                    new Symbol( 'hi!' )
                )
            )
        )
        result = LogicConcept.fromPutdown( `
            ("and the answer is:"
                (together (once (upon (a time)))
                ("hi!" "hi!" "hi!"))
            )
        ` )[0]
        expect( M.fullBetaReduce( expr ).equals( result ) ).to.equal( true )
    } )

    it( 'Should correctly judge alpha-equivalence', () => {
        // atomics are equivalent iff they're equal
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( '1' )[0],
            LogicConcept.fromPutdown( '1' )[0]
        ) ).equals( true )
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( '1' )[0],
            LogicConcept.fromPutdown( '2' )[0]
        ) ).equals( false )
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( 'identifier' )[0],
            LogicConcept.fromPutdown( 'identifier' )[0]
        ) ).equals( true )
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( 'other_identifier' )[0],
            LogicConcept.fromPutdown( 'identifier' )[0]
        ) ).equals( false )
        // bindings can have different bound vars, as long as they correspond
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( '(∃ x , (> x 10))' )[0],
            LogicConcept.fromPutdown( '(∃ george , (> george 10))' )[0]
        ) ).equals( true )
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( '(∃ x , (> x 10))' )[0],
            LogicConcept.fromPutdown( '(∃ george , (> george 1000))' )[0]
        ) ).equals( false )
        // applications just compare their corresponding children
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( '(and (= 1 2) (∃ x , (> x 10)))' )[0],
            LogicConcept.fromPutdown(
                '(and (= 1 2) (∃ george , (> george 10)))' )[0]
        ) ).equals( true )
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( '(x y z)' )[0],
            LogicConcept.fromPutdown( '(x y zee)' )[0]
        ) ).equals( false )
        // now try some larger, more complicated cases, with nested bindings
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown( '((sum 1 10) i , (^ i 2))' )[0],
            LogicConcept.fromPutdown( '((sum 1 12) i , (^ i 2))' )[0]
        ) ).equals( false )
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown(
                '(forall t , (= t ((sum 1 10) i , (^ i 2))))' )[0],
            LogicConcept.fromPutdown(
                '(forall u , (= u ((sum 1 10) j , (^ j 2))))' )[0]
        ) ).equals( true )
        expect( M.alphaEquivalent(
            LogicConcept.fromPutdown(
                '(forall t , (= t ((sum 1 10) i , (^ i 2))))' )[0],
            LogicConcept.fromPutdown(
                '(forall j , (= j ((sum 1 10) j , (^ j 2))))' )[0]
        ) ).equals( false )
    } )

} )
