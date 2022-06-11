
import { Symbol as LurchSymbol } from '../src/symbol.js'
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
        const A = new LurchSymbol( 'A' )
        const B = new LurchSymbol( 'β₁' )
        const C = new LurchSymbol( 'C c see sea sí sim' )
        const D = new LurchSymbol( 'd' )
        const E = new LurchSymbol( '∃' )
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
        const big2 = new Environment( C.copy(), D, E )
        const big3 = new LogicConcept( big1, big2 )
        expect( big1.isA( M.metavariable ) ).to.equal( false )
        expect( big2.isA( M.metavariable ) ).to.equal( false )
        expect( big3.isA( M.metavariable ) ).to.equal( false )
        expect( M.containsAMetavariable( big1 ) ).to.equal( true )
        expect( M.containsAMetavariable( big2 ) ).to.equal( false )
        expect( M.containsAMetavariable( big3 ) ).to.equal( true )
    } )

    it( 'Should find metavariables in larger expressions', () => {
        // build expressions like those in the previous test
        const A = new LurchSymbol( 'A' ).asA( M.metavariable )
        const B = new LurchSymbol( 'β₁' ).asA( M.metavariable )
        const C = new LurchSymbol( 'C c see sea sí sim' )
        const D = new LurchSymbol( 'd' ).asA( M.metavariable )
        const E = new LurchSymbol( '∃' )
        const big1 = new Application( A, B, C )
        const big2 = new Environment( C, D, E )
        const big3 = new LogicConcept( big1, big1.copy() )
        // All metavariables in A? Just one.
        let ary
        ary = M.metavariablesIn( A )
        expect( ary.length ).equals( 1 )
        expect( ary[0] ).equals( A )
        let set
        set = M.metavariableNamesIn( A )
        expect( set.size ).equals( 1 )
        expect( set.has( 'A' ) ).equals( true )
        // All metavariables in C? None.
        ary = M.metavariablesIn( C )
        expect( ary.length ).equals( 0 )
        set = M.metavariableNamesIn( C )
        expect( set.size ).equals( 0 )
        // All metavariables in big1? A, B.
        ary = M.metavariablesIn( big1 )
        expect( ary.length ).equals( 2 )
        expect( ary[0] ).equals( A )
        expect( ary[1] ).equals( B )
        set = M.metavariableNamesIn( big1 )
        expect( set.size ).equals( 2 )
        expect( set.has( 'A' ) ).equals( true )
        expect( set.has( 'β₁' ) ).equals( true )
        // All metavariables in big2? Just D.
        ary = M.metavariablesIn( big2 )
        expect( ary.length ).equals( 1 )
        expect( ary[0] ).equals( D )
        set = M.metavariableNamesIn( big2 )
        expect( set.size ).equals( 1 )
        expect( set.has( 'd' ) ).equals( true )
        // All metavariables in big3? A, B, A, B, but only 1x in the names set
        ary = M.metavariablesIn( big3 )
        expect( ary.length ).equals( 4 )
        expect( ary[0] ).equals( A ) // first instance of A
        expect( ary[1] ).equals( B ) // first instance of B
        expect( ary[2] ).equals( big3.child( 1 ).child( 0 ) ) // copy of A
        expect( ary[3] ).equals( big3.child( 1 ).child( 1 ) ) // copy of B
        set = M.metavariableNamesIn( big3 )
        expect( set.size ).equals( 2 )
        expect( set.has( 'A' ) ).equals( true )
        expect( set.has( 'β₁' ) ).equals( true )
    } )

} )
