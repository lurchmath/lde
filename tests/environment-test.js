
import { Environment } from '../src/environment.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'

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
