
import { Symbol } from '../src/symbol.js'
import { Application } from '../src/application.js'
import { Environment } from '../src/environment.js'
import { LogicConcept } from '../src/logic-concept.js'
import { metavariable, Constraint } from '../src/matching/constraint.js'

describe( 'Constraint', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( metavariable ).to.be.ok
        expect( typeof metavariable ).to.equal( 'string' )
        expect( metavariable ).to.equal( Constraint.metavariable )
        expect( Constraint ).to.be.ok
    } )

    it( 'Should let us mark metavariables, and it can detect them', () => {
        // test with just symbols
        const A = new Symbol( 'A' )
        const B = new Symbol( 'β₁' )
        const C = new Symbol( 'C c see sea sí sim' )
        const D = new Symbol( 'd' )
        const E = new Symbol( '∃' )
        expect( A.isA( metavariable ) ).to.equal( false )
        expect( B.isA( metavariable ) ).to.equal( false )
        expect( C.isA( metavariable ) ).to.equal( false )
        expect( D.isA( metavariable ) ).to.equal( false )
        expect( E.isA( metavariable ) ).to.equal( false )
        B.makeIntoA( metavariable )
        D.makeIntoA( metavariable )
        expect( A.isA( metavariable ) ).to.equal( false )
        expect( B.isA( metavariable ) ).to.equal( true )
        expect( C.isA( metavariable ) ).to.equal( false )
        expect( D.isA( metavariable ) ).to.equal( true )
        expect( E.isA( metavariable ) ).to.equal( false )
        A.makeIntoA( metavariable )
        D.unmakeIntoA( metavariable )
        expect( A.isA( metavariable ) ).to.equal( true )
        expect( B.isA( metavariable ) ).to.equal( true )
        expect( C.isA( metavariable ) ).to.equal( false )
        expect( D.isA( metavariable ) ).to.equal( false )
        expect( E.isA( metavariable ) ).to.equal( false )
        // test compound expressions
        const big1 = new Application( A, B, C )
        const big2 = new Environment( C, D, E )
        const big3 = new LogicConcept( big1, big2 )
        expect( big1.isA( metavariable ) ).to.equal( false )
        expect( big2.isA( metavariable ) ).to.equal( false )
        expect( big3.isA( metavariable ) ).to.equal( false )
        expect( Constraint.containsAMetavariable( big1 ) ).to.equal( true )
        expect( Constraint.containsAMetavariable( big2 ) ).to.equal( false )
        expect( Constraint.containsAMetavariable( big3 ) ).to.equal( true )
    } )

    it( 'Should let us construct only well-formed Constraints', () => {
        // if there are no metavariables, everything is fine
        let P, E, C
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 2)
            (* n m)
        ` )
        expect( () => C = new Constraint( P, E ) ).not.to.throw()
        expect( C ).to.be.instanceOf( Constraint )
        // in here, we also test the getters for pattern and expression, briefly
        expect( C.pattern ).to.equal( P )
        expect( C.expression ).to.equal ( E )
        // if there are metavariables in the pattern only, everything is fine
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 (- K Q))
            (* n m)
        ` )
        expect( P.child( 2 ).child( 1 ).text() ).to.equal( 'K' )
        P.child( 2 ).child( 1 ).makeIntoA( metavariable )
        expect( P.child( 2 ).child( 2 ).text() ).to.equal( 'Q' )
        P.child( 2 ).child( 2 ).makeIntoA( metavariable )
        expect( () => C = new Constraint( P, E ) ).not.to.throw()
        expect( C ).to.be.instanceOf( Constraint )
        expect( C.pattern ).to.equal( P )
        expect( C.expression ).to.equal ( E )
        // if there are metavariables in both, errors should be thrown
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 (- K Q))
            (* n m)
        ` )
        expect( P.child( 2 ).child( 1 ).text() ).to.equal( 'K' )
        P.child( 2 ).child( 1 ).makeIntoA( metavariable )
        expect( P.child( 2 ).child( 2 ).text() ).to.equal( 'Q' )
        P.child( 2 ).child( 2 ).makeIntoA( metavariable )
        expect( E.child( 1 ).text() ).to.equal( 'n' )
        E.child( 1 ).makeIntoA( metavariable )
        expect( E.child( 2 ).text() ).to.equal( 'm' )
        E.child( 2 ).makeIntoA( metavariable )
        expect( () => C = new Constraint( P, E ) ).to.throw(
            'may not contain metavariables' )
        // if there are metavariables in the expression, errors should be thrown
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 (- K Q))
            (* n m)
        ` )
        expect( E.child( 1 ).text() ).to.equal( 'n' )
        E.child( 1 ).makeIntoA( metavariable )
        expect( E.child( 2 ).text() ).to.equal( 'm' )
        E.child( 2 ).makeIntoA( metavariable )
        expect( () => C = new Constraint( P, E ) ).to.throw(
            'may not contain metavariables' )
        // even just one metavariable is problematic in the expression
        E = new Symbol( 'oh well' ).makeIntoA( metavariable )
        expect( () => C = new Constraint( P, E ) ).to.throw(
            'may not contain metavariables' )
    } )

} )
