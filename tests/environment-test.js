
import { Environment } from '../src/environment.js'
import { Symbol } from '../src/symbol.js'

describe( 'Environment', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( Environment ).to.be.ok
    } )

} )

///////////////
//
//  NOTE:
//
//  Some tests in this module have been copied over from old code,
//  then commented out until they're needed in the future.
//
///////////////

describe( 'Conclusions', () => {

    let A, B, C, D, E, _A, _B, _C, _D, _E

    beforeEach( () => {
        A = new Symbol( 'A' )
        B = new Symbol( 'B' )
        C = new Symbol( 'C' )
        D = new Symbol( 'D' )
        E = ( ...args ) => new Environment( ...args )
        _A = new Symbol( 'A' ).asA( 'given' )
        _B = new Symbol( 'B' ).asA( 'given' )
        _C = new Symbol( 'C' ).asA( 'given' )
        _D = new Symbol( 'D' ).asA( 'given' )
        _E = ( ...args ) => E( ...args ).makeIntoA( 'given' )
    } )
  
    it( 'should say the conclusions in { A } are only A', () => {
        let X = E( A )
        // expect( X.toString() ).to.be( '{ A }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( A )
        // expect( A.isAConclusionIn( X ) ).to.be( true )
    } )
  
    it( 'should say the conclusions in { A B } are A and B', () => {
        let X = E( A, B )
        // expect( X.toString() ).to.be( '{ A B }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( A )
        expect( Y ).to.contain( B )
        // expect( A.isAConclusionIn( X ) ).to.be( true )
        // expect( B.isAConclusionIn( X ) ).to.be( true )
    } )
  
    it( 'should say the conclusions in { A { B } } are A and B', () => {
        let X = E( A, E( B ) )
        // expect( X.toString() ).to.be( '{ A { B } }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( A )
        expect( Y ).to.contain( B )
        // expect( A.isAConclusionIn( X ) ).to.be( true )
        // expect( B.isAConclusionIn( X ) ).to.be( true )
    } )
  
    it( 'should say the conclusions in :{ A B } are A and B', () => {
        let X = _E( A, B )
        // expect( X.toString() ).to.be( ':{ A B }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( A )
        expect( Y ).to.contain( B )
        // expect( A.isAConclusionIn( X ) ).to.be( true )
        // expect( B.isAConclusionIn( X ) ).to.be( true )
    } )
  
    it( 'should say the conclusions in :{ :A B } are only B', () => {
        let X = _E( _A, B )
        // expect( X.toString() ).to.be( ':{ :A B }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( B )
        // expect( _A.isAConclusionIn( X ) ).to.be( false )
        // expect( B.isAConclusionIn( X ) ).to.be( true )
    } )
  
    it( 'should say the conclusions in :{ A :B } are only A', () => {
        let X = _E( A, _B )
        // expect( X.toString() ).to.be( ':{ A :B }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( A )
        // expect( A.isAConclusionIn( X ) ).to.be( true )
        // expect( _B.isAConclusionIn( X ) ).to.be( false )
    } )
  
    it( 'should say there are no conclusions in :{ :A :B }', () => {
        let X = _E( _A, _B )
        // expect( X.toString() ).to.be( ':{ :A :B }' )
        let Y = X.conclusions()
        expect( Y ).to.eql( [ ] )
        // expect( _A.isAConclusionIn( X ) ).to.be( false )
        // expect( _B.isAConclusionIn( X ) ).to.be( false )
    } )
  
    it( 'should say the conclusions in { { A } } are only A', () => {
        let X = E( E( A ) )
        // expect( X.toString() ).to.be( '{ { A } }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( A )
        // expect( A.isAConclusionIn( X ) ).to.be( true )
        // expect( A.parent().isAConclusionIn( X ) ).to.be( false )
    } )
  
    it( 'should say there are no conclusions in { :{ A } }', () => {
        let X = E( _E( A ) )
        // expect( X.toString() ).to.be( '{ :{ A } }' )
        let Y = X.conclusions()
        expect( Y ).to.eql( [ ] )
        // expect( A.isAConclusionIn( X ) ).to.be( false )
        // expect( A.parent().isAConclusionIn( X ) ).to.be( false )
    } )
  
    it( 'should say there are no conclusions in { { :A } }', () => {
        let X = E( E( _A ) )
        // expect( X.toString() ).to.be( '{ { :A } }' )
        let Y = X.conclusions()
        expect( Y ).to.be.eql( [ ] )
        // expect( _A.isAConclusionIn( X ) ).to.be( false )
        // expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
    } )
  
    it( 'should say the conclusions in { { :A B } } are only B', () => {
        let X = E( E( _A, B ) )
        // expect( X.toString() ).to.be( '{ { :A B } }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( B )
        // expect( _A.isAConclusionIn( X ) ).to.be( false )
        // expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
        // expect( B.isAConclusionIn( X ) ).to.be( true )
    } )
  
    it( 'should say the conclusions in { { :A B } C } are B and C', () => {
        let X = E( E( _A, B ), C )
        // expect( X.toString() ).to.be( '{ { :A B } C }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( B )
        expect( Y ).to.contain( C )
        // expect( _A.isAConclusionIn( X ) ).to.be( false )
        // expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
        // expect( B.isAConclusionIn( X ) ).to.be( true )
        // expect( C.isAConclusionIn( X ) ).to.be( true )
    } )
  
    it( 'should say the conclusions in { :{ :A B } C } are only C', () => {
        let X = E( _E( _A, B ), C )
        // expect( X.toString() ).to.be( '{ :{ :A B } C }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( C )
        // expect( _A.isAConclusionIn( X ) ).to.be( false )
        // expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
        // expect( B.isAConclusionIn( X ) ).to.be( false )
        // expect( C.isAConclusionIn( X ) ).to.be( true )
    } )
  
    it( 'should say the conclusions in { { { :A B } :{ :C D } } :D } are only B', () => {
        let X = E( E( E( _A, B ), _E( _C, D ) ), _D )
        // expect( X.toString() ).to.be( '{ { { :A B } :{ :C D } } :D }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 1 )
        expect( Y ).to.contain( B )
        // expect( _A.isAConclusionIn( X ) ).to.be( false )
        // expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
        // expect( B.isAConclusionIn( X ) ).to.be( true )
        // expect( _C.isAConclusionIn( X ) ).to.be( false )
        // expect( _C.parent().isAConclusionIn( X ) ).to.be( false )
        // expect( D.isAConclusionIn( X ) ).to.be( false )
        // expect( _D.isAConclusionIn( X ) ).to.be( false )
    } )
  
    it( 'should say the conclusions in { { :{ :A B } { C :D } } D } are C and D', () => {
        let X = E( E( _E( _A, B ), E( C, _D ) ), D )
        // expect( X.toString() ).to.be( '{ { :{ :A B } { C :D } } D }' )
        let Y = X.conclusions()
        expect( Y ).to.have.length( 2 )
        expect( Y ).to.contain( C )
        expect( Y ).to.contain( D )
        // expect( _A.isAConclusionIn( X ) ).to.be( false )
        // expect( _A.parent().isAConclusionIn( X ) ).to.be( false )
        // expect( B.isAConclusionIn( X ) ).to.be( false )
        // expect( C.isAConclusionIn( X ) ).to.be( true )
        // expect( C.parent().isAConclusionIn( X ) ).to.be( false )
        // expect( _D.isAConclusionIn( X ) ).to.be( false )
        // expect( D.isAConclusionIn( X ) ).to.be( true )
    } )
  
} )
