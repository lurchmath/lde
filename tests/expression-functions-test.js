
import {
    newEF, isAnEF, newEFA, isAnEFA
} from '../src/matching/expression-functions.js'
import { Symbol } from '../src/symbol.js'
import { Application } from '../src/application.js'
import { Environment } from '../src/environment.js'
import { LogicConcept } from '../src/logic-concept.js'
import { metavariable } from '../src/matching/constraint.js'

describe( 'Expression Functions', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( newEF ).to.be.ok
        expect( newEFA ).to.be.ok
        expect( isAnEF ).to.be.ok
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

} )
