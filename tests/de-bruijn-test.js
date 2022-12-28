
import { Symbol as LurchSymbol } from '../src/symbol.js'
import { Application } from '../src/application.js'
import { Expression } from '../src/expression.js'
import { BindingExpression } from '../src/binding-expression.js'
import { LogicConcept } from '../src/logic-concept.js'
import M from '../src/matching.js'

describe( 'de Bruijn indices', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( M.deBruijn ).to.be.ok
        expect( typeof M.deBruijn ).to.equal( 'string' )
        expect( M.encodeSymbol ).to.be.ok
        expect( M.encodedIndices ).to.be.ok
        expect( M.decodeSymbol ).to.be.ok
        expect( M.encodeExpression ).to.be.ok
        expect( M.decodeExpression ).to.be.ok
        expect( M.equal ).to.be.ok
    } )

    it( 'Should encode/decode symbols correctly at any level of binding', () => {
        let context
        let toEncode
        let encoded
        let indices

        // Case 1: Isolated symbol, no bindings
        context = toEncode = LogicConcept.fromPutdown( 'some_symbol' )[0]
        encoded = M.encodeSymbol( toEncode )
        expect( encoded ).to.be.instanceOf( LurchSymbol )
        expect( encoded.hasAttribute( M.deBruijn ) ).to.equal( true )
        indices = M.encodedIndices( encoded )
        expect( indices ).to.be.undefined
        expect( M.decodeSymbol( encoded ).equals( toEncode ) ).to.equal( true )

        // Case 2: Symbol inside one binding, first position
        context = LogicConcept.fromPutdown( '(x y z) , (f x)' )[0]
        toEncode = context.child( 3, 1 ) // the x in (f x)
        encoded = M.encodeSymbol( toEncode )
        expect( encoded ).to.be.instanceOf( LurchSymbol )
        expect( encoded.hasAttribute( M.deBruijn ) ).to.equal( true )
        indices = M.encodedIndices( encoded )
        expect( indices ).to.eql( [ 0, 0 ] )
        expect( M.decodeSymbol( encoded ).equals( toEncode ) ).to.equal( true )

        // Case 3: Symbol inside one binding, later position
        context = LogicConcept.fromPutdown( '(x y z) , (f z)' )[0]
        toEncode = context.child( 3, 1 ) // the z in (f z)
        encoded = M.encodeSymbol( toEncode )
        expect( encoded ).to.be.instanceOf( LurchSymbol )
        expect( encoded.hasAttribute( M.deBruijn ) ).to.equal( true )
        indices = M.encodedIndices( encoded )
        expect( indices ).to.eql( [ 0, 2 ] )
        expect( M.decodeSymbol( encoded ).equals( toEncode ) ).to.equal( true )
        
        // Case 4: Symbol inside more than one binding
        context = LogicConcept.fromPutdown( 'A , (f B , (g C , (h A B C)))' )[0]
        toEncode = context.child( 1, 1, 1, 1, 1, 2 ) // the B in (h A B C)
        encoded = M.encodeSymbol( toEncode )
        expect( encoded ).to.be.instanceOf( LurchSymbol )
        expect( encoded.hasAttribute( M.deBruijn ) ).to.equal( true )
        indices = M.encodedIndices( encoded )
        expect( indices ).to.eql( [ 1, 0 ] )
        expect( M.decodeSymbol( encoded ).equals( toEncode ) ).to.equal( true )
    } )

    it( 'Should encode/decode expressions correctly', () => {
        let expression
        let encoded
        let decoded
        // Expression 1:
        // x , y , (f x y) ----> (db (db (f db_1_0 db_0_0)))
        expression = LogicConcept.fromPutdown( 'x , y , (f x y)' )[0]
        encoded = M.encodeExpression( expression )
        expect( encoded ).to.be.instanceOf( Expression )
        expect( encoded.hasDescendantSatisfying(
            d => d instanceof BindingExpression )
        ).to.equal( false )
        expect( encoded.child( 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( encoded.child( 0 ).text() ).to.equal( M.deBruijn )
        expect( encoded.child( 1, 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( encoded.child( 1, 0 ).text() ).to.equal( M.deBruijn )
        expect( encoded.child( 1, 1, 1 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.encodedIndices( encoded.child( 1, 1, 1 ) ) ).to.eql( [ 1, 0 ] )
        expect( encoded.child( 1, 1, 2 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.encodedIndices( encoded.child( 1, 1, 2 ) ) ).to.eql( [ 0, 0 ] )
        decoded = M.decodeExpression( encoded )
        expect( decoded.equals( expression ) )
        // Expression 2:
        // (sum 1 n i , (sum 1 i j , (* i j)))
        //     ----> (sum 1 n (db (sum 1 db_0_0 (db (* db_1_0 db_0_0)))))
        expression = LogicConcept.fromPutdown(
            '(sum 1 n i , (sum 1 i j , (* i j)))' )[0]
        encoded = M.encodeExpression( expression )
        expect( encoded ).to.be.instanceOf( Expression )
        expect( encoded.hasDescendantSatisfying(
            d => d instanceof BindingExpression )
        ).to.equal( false )
        expect( encoded.child( 3, 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( encoded.child( 3, 0 ).text() ).to.equal( M.deBruijn )
        expect( encoded.child( 3, 1, 3, 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( encoded.child( 3, 1, 3, 0 ).text() ).to.equal( M.deBruijn )
        expect( encoded.child( 3, 1, 2 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.encodedIndices( encoded.child( 3, 1, 2 ) ) ).to.eql( [ 0, 0 ] )
        expect( encoded.child( 3, 1, 3, 1, 1 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.encodedIndices( encoded.child( 3, 1, 3, 1, 1 ) ) ).to.eql( [ 1, 0 ] )
        expect( encoded.child( 3, 1, 3, 1, 2 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.encodedIndices( encoded.child( 3, 1, 3, 1, 2 ) ) ).to.eql( [ 0, 0 ] )
        decoded = M.decodeExpression( encoded )
        expect( decoded.equals( expression ) )
        // Expression 3:
        // (and (forall x , (P x)) (exists x , (Q x)))
        //     ----> (and (forall (db (P db_0_0))) (exists (db (Q db_0_0))))
        expression = LogicConcept.fromPutdown(
            '(and (forall x , (P x)) (exists x , (Q x)))' )[0]
        encoded = M.encodeExpression( expression )
        expect( encoded ).to.be.instanceOf( Expression )
        expect( encoded.hasDescendantSatisfying(
            d => d instanceof BindingExpression )
        ).to.equal( false )
        expect( encoded.child( 1, 1, 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( encoded.child( 1, 1, 0 ).text() ).to.equal( M.deBruijn )
        expect( encoded.child( 2, 1, 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( encoded.child( 2, 1, 0 ).text() ).to.equal( M.deBruijn )
        expect( encoded.child( 1, 1, 1, 1 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.encodedIndices( encoded.child( 1, 1, 1, 1 ) ) ).to.eql( [ 0, 0 ] )
        expect( encoded.child( 2, 1, 1, 1 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.encodedIndices( encoded.child( 2, 1, 1, 1 ) ) ).to.eql( [ 0, 0 ] )
        decoded = M.decodeExpression( encoded )
        expect( decoded.equals( expression ) )
    } )

    it( 'Should correctly check equality without de Bruijn attributes', () => {
        let expr1
        let expr2
        // (f x) compared to itself
        // true using regular equality or equality mod de Bruijn attributes
        expr1 = LogicConcept.fromPutdown( '(f x)' )[0]
        expr2 = LogicConcept.fromPutdown( '(f x)' )[0]
        expect( expr1.equals( expr2 ) ).to.equal( true )
        expect( M.equal( expr1, expr2 ) ).to.equal( true )
        // (f x) compared to (f x) with a de Bruijn attribute on either or both
        // false using regular equality
        // true using equality mod de Bruijn attributes
        expr1.setAttribute( M.deBruijn, "example attribute value" )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( true )
        expr2.setAttribute( M.deBruijn, "not the same attribute value" )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( true )
        expr1.clearAttributes( M.deBruijn )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( true )
        // (f x) compared to (f x) with several de Bruijn attributes throughout
        // false using regular equality
        // true using equality mod de Bruijn attributes
        expr1.setAttribute( M.deBruijn, "example attribute value" )
        expr2.setAttribute( M.deBruijn, "not the same attribute value" )
        expr1.child( 0 ).setAttribute( M.deBruijn, [ 1, 2, 3 ] )
        expr2.child( 0 ).setAttribute( M.deBruijn, [ 4, 5, 6 ] )
        expr1.child( 1 ).setAttribute( M.deBruijn, { a : 'b' } )
        expr2.child( 1 ).setAttribute( M.deBruijn, 'Let\'s go dancing.' )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( true )
        // (f x) compared to (f x) with any non-de Bruijn attribute
        expr1 = LogicConcept.fromPutdown( '(f x)' )[0]
        expr2 = LogicConcept.fromPutdown( '(f x)' )[0]
        expr1.setAttribute( 'x', 'y' )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( false )
        expr2.setAttribute( 'x', 'z' )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( false )
        expr1.clearAttributes( 'x' )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( false )
        // (f x) compared to (f x) if x has a non-de Bruijn attribute
        expr1 = LogicConcept.fromPutdown( '(f x)' )[0]
        expr2 = LogicConcept.fromPutdown( '(f x)' )[0]
        expr1.child( 1 ).setAttribute( 'x', 'y' )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( false )
        expr2.child( 1 ).setAttribute( 'x', 'z' )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( false )
        expr1.child( 1 ).clearAttributes( 'x' )
        expect( expr1.equals( expr2 ) ).to.equal( false )
        expect( M.equal( expr1, expr2 ) ).to.equal( false )
    } )

    it( 'Supports encoding and decoding Constraints as well', () => {
        // We just do one test here, because the Constraint class's de Bruijn
        // functions just distribute, over the components in the Constraint, the
        // functions we've already tested above.

        // Make a constraint (∀ x , (@ P x)) ~ (∀ t , (>= (^ t 2) 0))
        const original = new M.Constraint(
            new Application(
                new LurchSymbol( '∀' ),
                new BindingExpression(
                    new LurchSymbol( 'x' ),
                    M.newEFA(
                        new LurchSymbol( 'P' ).asA( M.metavariable ),
                        new LurchSymbol( 'x' )
                    )
                )
            ),
            LogicConcept.fromPutdown( '(∀ t , (>= (^ t 2) 0))' )[0]
        )

        // Make a copy of it and de Bruijn-encode the copy
        const copy = original.copy()
        copy.deBruijnEncode()

        // Verify that the copy contains no bindings
        expect( copy.pattern.hasDescendantSatisfying(
            d => d instanceof BindingExpression )
        ).to.equal( false )
        expect( copy.expression.hasDescendantSatisfying(
            d => d instanceof BindingExpression )
        ).to.equal( false )

        // Spot check the encoding of the pattern and expression
        // Pattern should be:
        //     (∀ ("LDE DB" (@ P "['LDE DB',0,0]"))) plus some attributes,
        //     plus the ∀ and P are also encoded (without indices),
        //     but the @ ("LDE EFA") symbol is *NOT* encoded
        // Expression should be:
        //     (∀ ("LDE DB" (>= (^ "['LDE DB',0,0]" 2) 0))) plus the same
        //     caveats/tweaks as described above (now for ∀, >=, ^, 2, and 0)
        let test
        test = copy.pattern
        expect( test.child( 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.decodeSymbol( test.child( 0 ) ).equals(
            new LurchSymbol( '∀' )
        ) ).to.equal( true )
        expect( test.child( 1, 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( test.child( 1, 0 ).text() ).to.equal( M.deBruijn )
        expect( M.isAnEFA( test.child( 1, 1 ) ) ).to.equal( true )
        expect( test.child( 1, 1, 1 ) ).to.be.instanceof( LurchSymbol )
        expect( M.decodeSymbol( test.child( 1, 1, 1 ) ).equals(
            new LurchSymbol( 'P' ).asA( M.metavariable )
        ) ).to.equal( true )
        expect( test.child( 1, 1, 2 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.encodedIndices( test.child( 1, 1, 2 ) ) ).to.eql( [ 0, 0 ] )
        test = copy.expression
        expect( test.child( 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( M.decodeSymbol( test.child( 0 ) ).equals(
            new LurchSymbol( '∀' )
        ) ).to.equal( true )
        expect( test.child( 1, 0 ) ).to.be.instanceOf( LurchSymbol )
        expect( test.child( 1, 0 ).text() ).to.equal( M.deBruijn )
        expect( test.child( 1, 1, 0 ) ).to.be.instanceof( LurchSymbol )
        expect( M.decodeSymbol( test.child( 1, 1, 0 ) ).equals(
            new LurchSymbol( '>=' )
        ) ).to.equal( true )
        expect( test.child( 1, 1, 1, 0 ) ).to.be.instanceof( LurchSymbol )
        expect( M.decodeSymbol( test.child( 1, 1, 1, 0 ) ).equals(
            new LurchSymbol( '^' )
        ) ).to.equal( true )
        expect( test.child( 1, 1, 1, 1 ) ).to.be.instanceof( LurchSymbol )
        expect( M.encodedIndices( test.child( 1, 1, 1, 1 ) ) ).to.eql( [ 0, 0 ] )
        expect( test.child( 1, 1, 1, 2 ) ).to.be.instanceof( LurchSymbol )
        expect( M.decodeSymbol( test.child( 1, 1, 1, 2 ) ).equals(
            new LurchSymbol( '2' )
        ) ).to.equal( true )
        expect( test.child( 1, 1, 2 ) ).to.be.instanceof( LurchSymbol )
        expect( M.decodeSymbol( test.child( 1, 1, 2 ) ).equals(
            new LurchSymbol( '0' )
        ) ).to.equal( true )

        // Decode the copy and ensure it's back to its original state
        expect( copy.equals( original ) ).to.equal( false )
        copy.deBruijnDecode()
        expect( copy.equals( original ) ).to.equal( true )
    } )

} )
