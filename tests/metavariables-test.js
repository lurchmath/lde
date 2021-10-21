
import { Symbol } from '../src/symbol.js'
import { Application } from '../src/application.js'
import { Environment } from '../src/environment.js'
import { LogicConcept } from '../src/logic-concept.js'
import M from '../src/matching.js'

describe( 'Metavariables module', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( M.metavariable ).to.be.ok
        expect( typeof M.metavariable ).to.equal( 'string' )
    } )

    it( 'Should let us mark metavariables, and it can detect them', () => {
        // test with just symbols
        const A = new Symbol( 'A' )
        const B = new Symbol( 'β₁' )
        const C = new Symbol( 'C c see sea sí sim' )
        const D = new Symbol( 'd' )
        const E = new Symbol( '∃' )
        expect( A.isA( M.metavariable ) ).to.equal( false )
        expect( B.isA( M.metavariable ) ).to.equal( false )
        expect( C.isA( M.metavariable ) ).to.equal( false )
        expect( D.isA( M.metavariable ) ).to.equal( false )
        expect( E.isA( M.metavariable ) ).to.equal( false )
        B.makeIntoA( M.metavariable )
        D.makeIntoA( M.metavariable )
        expect( A.isA( M.metavariable ) ).to.equal( false )
        expect( B.isA( M.metavariable ) ).to.equal( true )
        expect( C.isA( M.metavariable ) ).to.equal( false )
        expect( D.isA( M.metavariable ) ).to.equal( true )
        expect( E.isA( M.metavariable ) ).to.equal( false )
        A.makeIntoA( M.metavariable )
        D.unmakeIntoA( M.metavariable )
        expect( A.isA( M.metavariable ) ).to.equal( true )
        expect( B.isA( M.metavariable ) ).to.equal( true )
        expect( C.isA( M.metavariable ) ).to.equal( false )
        expect( D.isA( M.metavariable ) ).to.equal( false )
        expect( E.isA( M.metavariable ) ).to.equal( false )
        // test compound expressions
        const big1 = new Application( A, B, C )
        const big2 = new Environment( C, D, E )
        const big3 = new LogicConcept( big1, big2 )
        expect( big1.isA( M.metavariable ) ).to.equal( false )
        expect( big2.isA( M.metavariable ) ).to.equal( false )
        expect( big3.isA( M.metavariable ) ).to.equal( false )
        expect( M.containsAMetavariable( big1 ) ).to.equal( true )
        expect( M.containsAMetavariable( big2 ) ).to.equal( false )
        expect( M.containsAMetavariable( big3 ) ).to.equal( true )
    } )

} )
