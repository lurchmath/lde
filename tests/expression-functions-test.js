
import {
    newEF, isAnEF, arityOfEF, applyEF, constantEF, projectionEF,
    newEFA, isAnEFA, canBetaReduce, betaReduce, fullBetaReduce
} from '../src/matching/expression-functions.js'
import { Symbol } from '../src/symbol.js'
import { Application } from '../src/application.js'
import { Environment } from '../src/environment.js'
import { LogicConcept } from '../src/logic-concept.js'
import { metavariable } from '../src/matching/constraint.js'

describe( 'Expression Functions', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( newEF ).to.be.ok
        expect( isAnEF ).to.be.ok
        expect( arityOfEF ).to.be.ok
        expect( applyEF ).to.be.ok
        expect( newEFA ).to.be.ok
        expect( isAnEFA ).to.be.ok
    } )

    it( 'Should let us construct valid expression functions', () => {
        // lambda x . x // identity function
        expect( () => newEF(
            new Symbol( 'x' ), new Symbol( 'x' )
        ) ).not.to.throw()
        // lambda v1,v2,v3,v4 . v2 // projection function
        expect( () => newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        ) ).not.to.throw()
        // lambda u,v . u-1 + v-1 // function with application body
        expect( () => newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        ) ).not.to.throw()
        // lambda i,n . sum from 1 to n of x^i // function with binding body
        expect( () => newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        ) ).not.to.throw()
    } )

    it( 'Should forbid construction of invalid expression functions', () => {
        // lambda x+1 . x // parameter not a symbol
        expect( () => newEF(
            LogicConcept.fromPutdown( '(+ x 1)' )[0], new Symbol( 'x' )
        ) ).to.throw()
        // lambda x,{} . x // parameter not a symbol
        expect( () => newEF(
            new Symbol( 'x' ), new Environment(), new Symbol( 'x' )
        ) ).to.throw()
        // lambda // not enough arguments given to constructor
        expect( () => newEF() ).to.throw()
        // lambda v1 // not enough arguments given to constructor
        expect( () => newEF( new Symbol( 'v1' ) ) ).to.throw()
    } )

    it( 'Should be able to distinguish EFs using isAnEF', () => {
        // First, make sure that all the EFs we constructed in the test above,
        // where we constructed valid EFs, pass the isAnEF() test.
        expect( isAnEF( newEF(
            new Symbol( 'x' ), new Symbol( 'x' )
        ) ) ).to.equal( true )
        expect( isAnEF( newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        ) ) ).to.equal( true )
        expect( isAnEF( newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        ) ) ).to.equal( true )
        expect( isAnEF( newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        ) ) ).to.equal( true )
        // Now make sure that several other kinds of expressions all fail the
        // isAnEF() test.  Such as:
        // A Symbol
        expect( isAnEF( new Symbol( 'x' ) ) ).to.equal( false )
        // An Application
        expect( isAnEF( new Application( new Symbol( 'x' ) ) ) )
            .to.equal( false )
        // A Binding
        expect( isAnEF( LogicConcept.fromPutdown( '(sum i , (f i))' )[0] ) )
            .to.equal( false )
        // An Environment
        expect( isAnEF( new Environment() ) ).to.equal( false )
        // A Declaration
        expect( isAnEF( LogicConcept.fromPutdown( '[pi e const]' )[0] ) )
            .to.equal( false )
        // A compound expression
        expect( isAnEF( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0] ) )
            .to.equal( false )
        // An EFA
        expect( isAnEF( newEFA(
            newEF( new Symbol( 'x' ), new Symbol( 'x' ) ), new Symbol( '2' )
        ) ) ).to.equal( false )
    } )

    it( 'Should be able to detect the arity of expression functions', () => {
        // Reconstruct all the EFs we've used before, but this time compute the
        // arity of each.
        expect( arityOfEF( newEF(
            new Symbol( 'x' ), new Symbol( 'x' )
        ) ) ).to.equal( 1 )
        expect( arityOfEF( newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        ) ) ).to.equal( 4 )
        expect( arityOfEF( newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        ) ) ).to.equal( 2 )
        expect( arityOfEF( newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        ) ) ).to.equal( 2 )
        // Ask for the arity of all the non-EFs we tested before, and ensure
        // that each throws an error.
        expect( () => arityOfEF( new Symbol( 'x' ) ) )
            .to.throw( /requires an expression function/ )
        expect( () => arityOfEF( new Application( new Symbol( 'x' ) ) ) )
            .to.throw( /requires an expression function/ )
        expect( () => arityOfEF( LogicConcept.fromPutdown( '(sum i , (f i))' )[0] ) )
            .to.throw( /requires an expression function/ )
        expect( () => arityOfEF( new Environment() ) )
            .to.throw( /requires an expression function/ )
        expect( () => arityOfEF( LogicConcept.fromPutdown( '[pi e const]' )[0] ) )
            .to.throw( /requires an expression function/ )
        expect( () => arityOfEF( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0] ) )
            .to.throw( /requires an expression function/ )
        expect( () => arityOfEF( newEFA(
            newEF( new Symbol( 'x' ), new Symbol( 'x' ) ), new Symbol( '2' )
        ) ) ).to.throw( /requires an expression function/ )
    } )

    it( 'Should be able to correctly apply expression functions', () => {
        // Reconstruct all the EFs we've used before, but this time try applying
        // each to some arguments.  In cases where it's relevant, ensure that
        // the result is an entirely new object, not the exact same thing as any
        // of the arguments.
        let ef, args, result
        ef = newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        args = [ LogicConcept.fromPutdown( '(Animal Crossing)' )[0] ]
        result = LogicConcept.fromPutdown( '(Animal Crossing)' )[0]
        expect( applyEF( ef, ...args ).equals( result ) ).to.equal( true )
        expect( args.some( arg => arg == applyEF( ef, ...args ) ) )
            .to.equal( false )
        ef = newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        args = [
            new Symbol( 'first' ), new Symbol( 'second' ),
            new Symbol( 'third' ), new Symbol( 'fourth' )
        ]
        result = new Symbol( 'second' )
        expect( applyEF( ef, ...args ).equals( result ) ).to.equal( true )
        expect( args.some( arg => arg == applyEF( ef, ...args ) ) )
            .to.equal( false )
        ef = newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        )
        args = LogicConcept.fromPutdown( '"FOO" "BAR"' )
        result = LogicConcept.fromPutdown( '(+ (- "FOO" 1) (- "BAR" 1))' )[0]
        expect( applyEF( ef, ...args ).equals( result ) ).to.equal( true )
        ef = newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        )
        args = [ new Symbol( 2 ), new Symbol( 10 ) ]
        result = LogicConcept.fromPutdown( '((sum 1 10) x , (^ x 2))' )[0]
        expect( applyEF( ef, ...args ).equals( result ) ).to.equal( true )
        // Try to apply the same EFs to an incorrect number of arguments and
        // ensure we get errors in each case.
        ef = newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        args = LogicConcept.fromPutdown( 'Animal Crossing' ) // 2 instead of 1
        expect( () => applyEF( ef, ...args ) )
            .to.throw( /Incorrect number of arguments/ )
        ef = newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        args = [ new Symbol( 'first' ), new Symbol( 'second' ) ] // 2 instead of 4
        expect( () => applyEF( ef, ...args ) )
            .to.throw( /Incorrect number of arguments/ )
        ef = newEF(
            new Symbol( 'u' ), new Symbol( 'v' ),
            LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
        )
        args = LogicConcept.fromPutdown( '"FOO"' ) // 1 instead of 2
        expect( () => applyEF( ef, ...args ) )
            .to.throw( /Incorrect number of arguments/ )
        ef = newEF(
            new Symbol( 'i' ), new Symbol( 'n' ),
            LogicConcept.fromPutdown( '((sum 1 n) x , (^ x i))' )[0]
        )
        args = [ ] // 0 instead of 2
        expect( () => applyEF( ef, ...args ) )
            .to.throw( /Incorrect number of arguments/ )
        // Try to apply some non-EFs and ensure we get errors in each case.
        expect( () => applyEF( new Symbol( 'x' ), args ) )
            .to.throw( /requires an expression function/ )
        expect( () => applyEF( new Application( new Symbol( 'x' ) ), args ) )
            .to.throw( /requires an expression function/ )
        expect( () => applyEF( LogicConcept.fromPutdown( '(sum i , (f i))' )[0], args ) )
            .to.throw( /requires an expression function/ )
        expect( () => applyEF( new Environment(), args ) )
            .to.throw( /requires an expression function/ )
        expect( () => applyEF( LogicConcept.fromPutdown( '[pi e const]' )[0], args ) )
            .to.throw( /requires an expression function/ )
        expect( () => applyEF( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0], args ) )
            .to.throw( /requires an expression function/ )
        expect( () => applyEF( newEFA(
            newEF( new Symbol( 'x' ), new Symbol( 'x' ) ), new Symbol( '2' )
        ), args ) ).to.throw( /requires an expression function/ )
    } )

    it( 'Should be able to build and apply constant and projection EFs', () => {
        // Ensure that constantEF() always creates functions with the requested
        // arity.
        const B = LogicConcept.fromPutdown( '(example body)' )[0]
        const C = LogicConcept.fromPutdown( '"another one"' )[0]
        expect( arityOfEF( constantEF( 1, B ) ) ).to.equal( 1 )
        expect( arityOfEF( constantEF( 2, B ) ) ).to.equal( 2 )
        expect( arityOfEF( constantEF( 3, B ) ) ).to.equal( 3 )
        expect( arityOfEF( constantEF( 4, B ) ) ).to.equal( 4 )
        // Ensure that constantEF() always creates functions with the requested
        // body.
        expect( constantEF( 1, B ).body().equals( B ) ).to.equal( true )
        expect( constantEF( 2, B ).body().equals( B ) ).to.equal( true )
        expect( constantEF( 3, C ).body().equals( C ) ).to.equal( true )
        expect( constantEF( 4, C ).body().equals( C ) ).to.equal( true )
        // Ensure that applying a constantEF() always gives the same output.
        expect( applyEF( constantEF( 1, B ), new Symbol( 5 ) ).equals( B ) )
            .to.equal( true )
        expect( applyEF( constantEF( 1, B ), new Symbol( "YO!" ) ).equals( B ) )
            .to.equal( true )
        expect( applyEF( constantEF( 1, C ), new Symbol( 5 ) ).equals( C ) )
            .to.equal( true )
        expect(
            applyEF(
                constantEF( 3, C ),
                new Symbol( "YO!" ),
                new Symbol( "Adrian!" ),
                new Symbol( "It's Rocky!" )
            ).equals( C )
        ).to.equal( true )
        // Ensure that projectionEF() always creates functions with the
        // requested arity.
        expect( arityOfEF( projectionEF( 1, 0 ) ) ).to.equal( 1 )
        expect( arityOfEF( projectionEF( 2, 0 ) ) ).to.equal( 2 )
        expect( arityOfEF( projectionEF( 3, 1 ) ) ).to.equal( 3 )
        expect( arityOfEF( projectionEF( 4, 1 ) ) ).to.equal( 4 )
        // Ensure that projectionEF() always creates functions whose body is a
        // copy of one of the parameters--and the correct one.
        let ef
        ef = projectionEF( 1, 0 )
        expect( ef.body().equals( ef.boundVariables()[0] ) ).to.equal( true )
        ef = projectionEF( 2, 0 )
        expect( ef.body().equals( ef.boundVariables()[0] ) ).to.equal( true )
        ef = projectionEF( 3, 1 )
        expect( ef.body().equals( ef.boundVariables()[1] ) ).to.equal( true )
        ef = projectionEF( 4, 1 )
        expect( ef.body().equals( ef.boundVariables()[1] ) ).to.equal( true )
        // Ensure that applying a projectionEF() gives a copy of one of the
        // arguments as output--but just a copy, not the actual argument.
        let args, result
        ef = projectionEF( 1, 0 )
        args = [ new Symbol( 5 ) ]
        result = applyEF( ef, ...args )
        expect( result.equals( args[0] ) ).to.equal( true )
        expect( result === args[0] ).to.equal( false )
        ef = projectionEF( 2, 0 )
        args = [ new Symbol( "and" ), new Symbol( "or" ) ]
        result = applyEF( ef, ...args )
        expect( result.equals( args[0] ) ).to.equal( true )
        expect( result === args[0] ).to.equal( false )
        ef = projectionEF( 3, 1 )
        args = LogicConcept.fromPutdown( 'sym (a p p) (bind ing , body)' )
        result = applyEF( ef, ...args )
        expect( result.equals( args[1] ) ).to.equal( true )
        expect( result === args[1] ).to.equal( false )
        ef = projectionEF( 4, 1 )
        args = LogicConcept.fromPutdown( '9 88 777 6666' )
        result = applyEF( ef, ...args )
        expect( result.equals( args[1] ) ).to.equal( true )
        expect( result === args[1] ).to.equal( false )
    } )

    it( 'Should let us construct valid EFAs', () => {
        // (lambda x . x)(a) // identity function
        const idEF = newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        expect( () => newEFA( idEF, new Symbol( 'a' ) ) ).not.to.throw()
        // (lambda v1,v2,v3,v4 . v2)(1,2,3,4)
        const projEF = newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        expect( () => newEFA(
            projEF,
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 ), new Symbol( 4 )
        ) ).not.to.throw()
        // (M p) where M is a metavariable // not an EF (yet)
        let M = new Symbol( 'M' ).asA( metavariable )
        expect( () => newEFA( M, new Symbol( 'p' ) ) ).not.to.throw()
        // (M p q) where M is a metavariable // not an EF (yet)
        expect( () => newEFA(
            M, new Symbol( 'p' ), new Symbol( 'q' )
        ) ).not.to.throw()
        // (M p q r) where M is a metavariable // not an EF (yet)
        expect( () => newEFA(
            M, new Symbol( 'p' ), new Symbol( 'q' ), new Symbol( 'r' )
        ) ).not.to.throw()
    } )

    it( 'Should not let us construct invalid EFAs', () => {
        // (lambda x . x)() // not enough arguments
        const idEF = newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        expect( () => newEFA( idEF ) ).to.throw()
        // (lambda x . x)(1,2) // too many arguments
        expect( () => newEFA(
            idEF, new Symbol( 1 ), new Symbol( 2 )
        ) ).to.throw()
        // (lambda v1,v2,v3,v4 . v2)("hi") // too few arguments
        const projEF = newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        expect( () => newEFA( projEF, new Symbol( "hi" ) ) ).to.throw()
        // (M) where M is a metavariable // too few arguments
        let M = new Symbol( 'M' ).asA( metavariable )
        expect( () => newEFA( M ) ).to.throw()
    } )

    it( 'Should be able to distinguish EFAs using isAnEFA', () => {
        // First, make sure that all the EFAs we constructed in the test above,
        // where we constructed valid EFAs, pass the isAnEFA() test.
        const idEF = newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        expect( isAnEFA( newEFA( idEF, new Symbol( 'a' ) ) ) ).to.equal( true )
        const projEF = newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        expect( isAnEFA( newEFA(
            projEF,
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 ), new Symbol( 4 )
        ) ) ).to.equal( true )
        let M = new Symbol( 'M' ).asA( metavariable )
        expect( isAnEFA( newEFA( M, new Symbol( 'p' ) ) ) ).to.equal( true )
        expect( isAnEFA( newEFA(
            M, new Symbol( 'p' ), new Symbol( 'q' )
        ) ) ).to.equal( true )
        expect( isAnEFA( newEFA(
            M, new Symbol( 'p' ), new Symbol( 'q' ), new Symbol( 'r' )
        ) ) ).to.equal( true )
        // Now make sure that several other kinds of expressions all fail the
        // isAnEFA() test.  Such as:
        // A Symbol
        expect( isAnEFA( new Symbol( 'x' ) ) ).to.equal( false )
        // An Application
        expect( isAnEFA( new Application( new Symbol( 'x' ) ) ) )
            .to.equal( false )
        // A Binding
        expect( isAnEFA( LogicConcept.fromPutdown( '(sum i , (f i))' )[0] ) )
            .to.equal( false )
        // An Environment
        expect( isAnEFA( new Environment() ) ).to.equal( false )
        // A Declaration
        expect( isAnEFA( LogicConcept.fromPutdown( '[pi e const]' )[0] ) )
            .to.equal( false )
        // A compound expression
        expect( isAnEFA( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0] ) )
            .to.equal( false )
        // An EF
        expect( isAnEFA( idEF ) ).to.equal( false )
        expect( isAnEFA( projEF ) ).to.equal( false )
    } )

    it( 'Should be able to tell when beta reduction is possible', () => {
        let efa
        // Two of the EFAs we constructed in the previous test use actual EFs,
        // and thus can be part of an expression that can be beta-reduced
        const idEF = newEF( new Symbol( 'x' ), new Symbol( 'x' ) )
        efa = newEFA( idEF, new Symbol( 'a' ) )
        expect( isAnEFA( efa ) ).to.equal( true )
        expect( canBetaReduce( efa ) ).to.equal( true )
        const projEF = newEF(
            new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v3' ),
            new Symbol( 'v4' ), new Symbol( 'v2' )
        )
        efa = newEFA(
            projEF,
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 ), new Symbol( 4 )
        )
        expect( isAnEFA( efa ) ).to.equal( true )
        expect( canBetaReduce( efa ) ).to.equal( true )
        // Those same two EFAs, if we change the number of arguments, can no
        // longer be beta-reduced
        efa = newEFA( idEF, new Symbol( 'a' ) ) // correct # of args
        efa.pushChild( new Symbol( 'b' ) ) // now too many args
        expect( isAnEFA( efa ) ).to.equal( true )
        expect( canBetaReduce( efa ) ).to.equal( false )
        efa = newEFA( projEF, // correct # of args:
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 ), new Symbol( 4 ) )
        efa.popChild() // now too few args
        expect( isAnEFA( efa ) ).to.equal( true )
        expect( canBetaReduce( efa ) ).to.equal( false )
        // The EFAs created in the previous test using metavariables for the EF
        // cannot be beta-reduced, because we don't know the actual EF to use
        let M = new Symbol( 'M' ).asA( metavariable )
        efa = newEFA( M, new Symbol( 'p' ) )
        expect( isAnEFA( efa ) ).to.equal( true )
        expect( canBetaReduce( efa ) ).to.equal( false )
        efa = newEFA( M, new Symbol( 'p' ), new Symbol( 'q' ) )
        expect( isAnEFA( efa ) ).to.equal( true )
        expect( canBetaReduce( efa ) ).to.equal( false )
        efa = newEFA( M, new Symbol( 'p' ), new Symbol( 'q' ), new Symbol( 'r' ) )
        expect( isAnEFA( efa ) ).to.equal( true )
        expect( canBetaReduce( efa ) ).to.equal( false )
        // And of course, anything that's not a valid EFA in the first place
        // cannot be beta-reduced
        expect( canBetaReduce( new Symbol( 'x' ) ) ).to.equal( false )
        expect( canBetaReduce( new Application( new Symbol( 'x' ) ) ) )
            .to.equal( false )
        expect( canBetaReduce( LogicConcept.fromPutdown( '(sum i , (f i))' )[0] ) )
            .to.equal( false )
        expect( canBetaReduce( new Environment() ) ).to.equal( false )
        expect( canBetaReduce( LogicConcept.fromPutdown( '[pi e const]' )[0] ) )
            .to.equal( false )
        expect( canBetaReduce( LogicConcept.fromPutdown( '(/ 1 (+ 1 x))' )[0] ) )
            .to.equal( false )
        expect( canBetaReduce( idEF ) ).to.equal( false )
        expect( canBetaReduce( projEF ) ).to.equal( false )
    } )

    it( 'Should be able to do single steps of beta reduction', () => {
        let expr, result
        // If no beta reductions are needed, we get undefined
        expr = LogicConcept.fromPutdown( '(no (beta reductions) "here")' )[0]
        expect( betaReduce( expr ) ).to.be.undefined
        // If the expression is an EFA, it will be done; we use an example from
        // an earlier test of applyEF
        expr = newEFA(
            newEF(
                new Symbol( 'u' ), new Symbol( 'v' ),
                LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
            ),
            ...LogicConcept.fromPutdown( '"FOO" "BAR"' )
        )
        result = LogicConcept.fromPutdown( '(+ (- "FOO" 1) (- "BAR" 1))' )[0]
        expect( betaReduce( expr ).equals( result ) ).to.equal( true )
        // If the expression contains an EFA, but that EFA is not the whole
        // expression, then we get undefined.  This is part of what
        // distinguishes betaReduce() from fullBetaReduce().
        expr = new Application( // (+ 5 ((lambda v1 v2 , v2) 6 7))
            new Symbol( '+' ),
            new Symbol( 5 ),
            newEFA(
                newEF(
                    new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v2' )
                ),
                new Symbol( 6 ),
                new Symbol( 7 )
            )
        )
        result = LogicConcept.fromPutdown( '(+ 5 7)' )[0]
        expect( betaReduce( expr ) ).to.be.undefined
    } )

    it( 'Should be able to do all beta reductions in an expression', () => {
        let expr, result
        // If no beta reductions are needed, we just get back an exact copy.
        expr = LogicConcept.fromPutdown( '(no (beta reductions) "here")' )[0]
        result = expr.copy()
        expect( fullBetaReduce( expr ).equals( result ) ).to.equal( true )
        // If the expression is an EFA, it will be done; we use an example from
        // an earlier test of applyEF
        expr = newEFA(
            newEF(
                new Symbol( 'u' ), new Symbol( 'v' ),
                LogicConcept.fromPutdown( '(+ (- u 1) (- v 1))' )[0]
            ),
            ...LogicConcept.fromPutdown( '"FOO" "BAR"' )
        )
        result = LogicConcept.fromPutdown( '(+ (- "FOO" 1) (- "BAR" 1))' )[0]
        expect( fullBetaReduce( expr ).equals( result ) ).to.equal( true )
        // If the expression contains an EFA, it will be done; we use an example
        // from an earlier test of applyEF, but this time deeper inside a larger
        // expression
        expr = new Application( // (+ 5 ((lambda v1 v2 , v2) 6 7))
            new Symbol( '+' ),
            new Symbol( 5 ),
            newEFA(
                newEF(
                    new Symbol( 'v1' ), new Symbol( 'v2' ), new Symbol( 'v2' )
                ),
                new Symbol( 6 ),
                new Symbol( 7 )
            )
        )
        result = LogicConcept.fromPutdown( '(+ 5 7)' )[0]
        expect( fullBetaReduce( expr ).equals( result ) ).to.equal( true )
        // Multiple EFAs in the same expression work fine.
        expr = new Application(
            newEFA(
                newEF( new Symbol( 'x' ), new Symbol( 'x' ) ),
                LogicConcept.fromPutdown( '(∃ y , (P y))' )[0]
            ),
            newEFA(
                newEF( new Symbol( 'x' ), new Symbol( 'y' ), new Symbol( 'x' ) ),
                ...LogicConcept.fromPutdown( '(a b) (c d)' )
            )
        )
        result = LogicConcept.fromPutdown( '((∃ y , (P y)) (a b))' )[0]
        expect( fullBetaReduce( expr ).equals( result ) ).to.equal( true )
        // Even nested EFAs work okay, as long as it is one that terminates
        expr = new Application(
            new Symbol( "and the answer is:" ),
            newEFA(
                newEF(
                    new Symbol( 'x' ),
                    new Symbol( 'y' ),
                    LogicConcept.fromPutdown( '(together x y)' )[0]
                ),
                LogicConcept.fromPutdown( '(once (upon (a time)))' )[0],
                newEFA(
                    newEF(
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
        expect( fullBetaReduce( expr ).equals( result ) ).to.equal( true )
    } )

} )
