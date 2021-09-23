
import { Symbol } from '../src/symbol.js'
import { LogicConcept } from '../src/logic-concept.js'
import M from '../src/matching.js'

describe( 'NewSymbolStream', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( M.NewSymbolStream ).to.be.ok
    } )

    it( 'Should let us construct instances in a variety of ways', () => {
        let N
        // No arguments
        expect( () => N = new M.NewSymbolStream() ).not.to.throw()
        expect( N ).to.be.instanceOf( M.NewSymbolStream )
        // One string argument
        expect( () => N = new M.NewSymbolStream( 'x' ) ).not.to.throw()
        expect( N ).to.be.instanceOf( M.NewSymbolStream )
        // Many string arguments
        expect( () => N = new M.NewSymbolStream( 'A', 'bee', 'sea' ) ).not.to.throw()
        expect( N ).to.be.instanceOf( M.NewSymbolStream )
        // One LC argument
        expect( () => N = new M.NewSymbolStream(
            LogicConcept.fromPutdown( '(forall x y , (> x y))' )
        ) ).not.to.throw()
        expect( N ).to.be.instanceOf( M.NewSymbolStream )
        // Many LC arguments
        expect( () => N = new M.NewSymbolStream(
            LogicConcept.fromPutdown( '(forall x y , (> x y))' ),
            LogicConcept.fromPutdown( 'example_long_symbol' ),
            LogicConcept.fromPutdown( '[pi e const]' )
        ) ).not.to.throw()
        expect( N ).to.be.instanceOf( M.NewSymbolStream )
        // Many mixed arguments
        expect( () => N = new M.NewSymbolStream(
            'thing',
            LogicConcept.fromPutdown( '(forall x y , (> x y))' ),
            LogicConcept.fromPutdown( 'example_long_symbol' ),
            'other thing',
            LogicConcept.fromPutdown( '[pi e const]' )
        ) ).not.to.throw()
        expect( N ).to.be.instanceOf( M.NewSymbolStream )
    } )

    it( 'Should make an infinite stream of new symbols, unconstrained', () => {
        let N = new M.NewSymbolStream
        let sym, syms
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( sym.text() ).to.equal( 'v1' )
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( sym.text() ).to.equal( 'v2' )
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( sym.text() ).to.equal( 'v3' )
        expect( () => syms = N.nextN( 5 ) ).not.to.throw()
        expect( syms ).to.be.instanceOf( Array )
        expect( syms[0] ).to.be.instanceOf( Symbol )
        expect( syms[0].text() ).to.equal( 'v4' )
        expect( syms[1] ).to.be.instanceOf( Symbol )
        expect( syms[1].text() ).to.equal( 'v5' )
        expect( syms[2] ).to.be.instanceOf( Symbol )
        expect( syms[2].text() ).to.equal( 'v6' )
        expect( syms[3] ).to.be.instanceOf( Symbol )
        expect( syms[3].text() ).to.equal( 'v7' )
        expect( syms[4] ).to.be.instanceOf( Symbol )
        expect( syms[4].text() ).to.equal( 'v8' )
    } )

    it( 'Should make an infinite stream, skipping disallowed symbols', () => {
        let sym
        // avoid four strings
        let N = new M.NewSymbolStream
        N.avoid( 'v2', 'v3', 'x', 'y' )
        let cannotBeThese = [ 'v2', 'v3', 'x', 'y' ]
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( cannotBeThese ).not.to.have.members( [ sym.text() ] )
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( cannotBeThese ).not.to.have.members( [ sym.text() ] )
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( cannotBeThese ).not.to.have.members( [ sym.text() ] )
        // avoid three LogicConcepts, with many symbols inside them
        N = new M.NewSymbolStream( ...LogicConcept.fromPutdown( `
            [pi e const]
            (lambda v1 v2 , (+ v1 v2))
            {
                :(v noo v3 v4)
                (v5 this_is_not_v6)
            }
        ` ) )
        cannotBeThese = [
            'pi', 'e', 'lambda', 'v1', 'v2', '+', 'v',
            'noo', 'v3', 'v4', 'V5', 'this_is_not_v6'
        ]
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( cannotBeThese ).not.to.have.members( [ sym.text() ] )
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( cannotBeThese ).not.to.have.members( [ sym.text() ] )
        expect( () => sym = N.next() ).not.to.throw()
        expect( sym ).to.be.instanceOf( Symbol )
        expect( cannotBeThese ).not.to.have.members( [ sym.text() ] )
    } )

} )
