
import { Symbol } from '../src/symbol.js'

describe( 'Symbol', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( Symbol ).to.be.ok
    } )

    it( 'Should require a nonempty string at construction time', () => {
        // Constructing a symbol with a nonempty string is fine.
        expect( () => { new Symbol( 'hello' ) } ).not.to.throw()
        expect( () => { new Symbol( '1' ) } ).not.to.throw()
        expect( () => { new Symbol( 'Four score and seven years ago' ) } )
            .not.to.throw()
        expect( () => { new Symbol( 'αβγδε' ) } ).not.to.throw()
        expect( () => { new Symbol( 'x₁' ) } ).not.to.throw()
        // Constructing a symbol with a non-string is not fine.
        expect( () => { new Symbol( 1 ) } ).to.throw()
        expect( () => { new Symbol( null ) } ).to.throw()
        expect( () => { new Symbol() } ).to.throw()
        expect( () => { new Symbol( -17.6503 ) } ).to.throw()
        expect( () => { new Symbol( [ "text", "array" ] ) } ).to.throw()
        // Constructing a symbol with the empty string is not fine.
        expect( () => { new Symbol( "" ) } ).to.throw()
    } )

    it( 'Should let us query the text given at construction time', () => {
        let S = new Symbol( 'hello' )
        expect( S.text() ).to.equal( 'hello' )
        S = new Symbol( '1' )
        expect( S.text() ).to.equal( '1' )
        S = new Symbol( 'Four score and seven years ago' )
        expect( S.text() ).to.equal( 'Four score and seven years ago' )
        S = new Symbol( 'αβγδε' )
        expect( S.text() ).to.equal( 'αβγδε' )
        S = new Symbol( 'x₁' )
        expect( S.text() ).to.equal( 'x₁' )
    } )

} )
