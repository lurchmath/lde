
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
        expect( M.adjustIndices ).to.be.ok
        expect( M.decodeSymbol ).to.be.ok
        expect( M.encodeExpression ).to.be.ok
        expect( M.decodeExpression ).to.be.ok
        expect( M.isEncodedBinding ).to.be.ok
        expect( M.equal ).to.be.ok
        expect( M.free ).to.be.ok
        expect( M.numberOfOccurrences ).to.be.ok
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

    it( 'Should correctly detect when an LC is an encoded binding', () => {
        let expression
        let encoded
        // Re-using Expression 1 from the previous test
        // x , y , (f x y) ----> (db (db (f db_1_0 db_0_0)))
        expression = LogicConcept.fromPutdown( 'x , y , (f x y)' )[0]
        encoded = M.encodeExpression( expression )
        // We spot-check several descendants, but not every one.
        expect( M.isEncodedBinding( encoded ) ).to.equal( true )
        expect( M.isEncodedBinding( encoded.child( 1 ) ) ).to.equal( true )
        expect( M.isEncodedBinding( encoded.child( 1, 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 1, 1 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 1, 1, 0 ) ) ).to.equal( false )
        // Re-using Expression 2 from the previous test
        // (sum 1 n i , (sum 1 i j , (* i j)))
        //     ----> (sum 1 n (db (sum 1 db_0_0 (db (* db_1_0 db_0_0)))))
        expression = LogicConcept.fromPutdown(
            '(sum 1 n i , (sum 1 i j , (* i j)))' )[0]
            encoded = M.encodeExpression( expression )
        // We spot-check several descendants, but not every one.
        expect( M.isEncodedBinding( encoded ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 1 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 2 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 3 ) ) ).to.equal( true )
        expect( M.isEncodedBinding( encoded.child( 3, 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 3, 1 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 3, 1, 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 3, 1, 1 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 3, 1, 2 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 3, 1, 3 ) ) ).to.equal( true )
        // Re-using Expression 3 from the previous test
        // (and (forall x , (P x)) (exists x , (Q x)))
        //     ----> (and (forall (db (P db_0_0))) (exists (db (Q db_0_0))))
        expression = LogicConcept.fromPutdown(
            '(and (forall x , (P x)) (exists x , (Q x)))' )[0]
        encoded = M.encodeExpression( expression )
        // We spot-check several descendants, but not every one.
        expect( M.isEncodedBinding( encoded ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 1 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 1, 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 1, 1 ) ) ).to.equal( true )
        expect( M.isEncodedBinding( encoded.child( 1, 1, 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 1, 1, 1 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 2 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 2, 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 2, 1 ) ) ).to.equal( true )
        expect( M.isEncodedBinding( encoded.child( 2, 1, 0 ) ) ).to.equal( false )
        expect( M.isEncodedBinding( encoded.child( 2, 1, 1 ) ) ).to.equal( false )
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

    it( 'Should respect special Matching symbols and attributes', () => {
        let toEncode
        let encoded
        // If we encode an Expression Function Application, it stays an
        // Expression Function Application
        toEncode = M.newEFA( new LurchSymbol( 'P' ), new LurchSymbol( 'x' ) )
        expect( M.isAnEFA( toEncode ) ).to.equal( true )
        encoded = M.encodeExpression( toEncode )
        expect( M.isAnEFA( encoded ) ).to.equal( true )
        // If we encode something with metavariables in it, each of them stays
        // a metavariable
        toEncode = new Application(
            new LurchSymbol( 'a' ).asA( M.metavariable ),
            new Application(
                new LurchSymbol( 'b' ),
                new LurchSymbol( 'c' ).asA( M.metavariable )
            )
        )
        expect( toEncode.child( 0 ).isA( M.metavariable ) ).to.equal( true )
        expect( toEncode.child( 1, 0 ).isA( M.metavariable ) ).to.equal( false )
        expect( toEncode.child( 1, 1 ).isA( M.metavariable ) ).to.equal( true )
        encoded = M.encodeExpression( toEncode )
        expect( encoded.child( 0 ).isA( M.metavariable ) ).to.equal( true )
        expect( encoded.child( 1, 0 ).isA( M.metavariable ) ).to.equal( false )
        expect( encoded.child( 1, 1 ).isA( M.metavariable ) ).to.equal( true )
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

    it( 'Should adjust indices correctly in de Bruijn expressions', () => {
        let expr, copy
        // Create (+ x y) which converts to include no de Bruijn symbols, and
        // thus adjustIndices() has no effect on it.
        expr = LogicConcept.fromPutdown( '(+ x y)' )[0]
        expr = M.encodeExpression( expr )
        expect( Array.from( expr.descendantsIterator() ).every(
            d => M.encodedIndices( d ) === undefined
        ) ).to.equal( true )
        copy = expr.copy()
        M.adjustIndices( copy, 1, 1 )
        expect( copy.equals( expr ) ).to.equal( true )
        expect( M.equal( copy, expr ) ).to.equal( true )
        // Create (x y) , (+ x y) which converts to include 2 de Bruijn symbols,
        // both bound, and thus adjustIndices() has no effect on it.
        expr = LogicConcept.fromPutdown( '(x y) , (+ x y)' )[0]
        expr = M.encodeExpression( expr )
        expect( Array.from( expr.descendantsIterator() ).filter(
            d => M.encodedIndices( d ) !== undefined
        ).length ).to.equal( 2 )
        copy = expr.copy()
        M.adjustIndices( copy, 1, 1 )
        expect( copy.equals( expr ) ).to.equal( true )
        expect( M.equal( copy, expr ) ).to.equal( true )
        // Create (x y) , (+ x y) which converts to include 2 de Bruijn symbols,
        // both bound, then lift the body out from the binding, and thus
        // adjustIndices() should actually affect it.
        expr = LogicConcept.fromPutdown( '(x y) , (+ x y)' )[0]
        expr = M.encodeExpression( expr )
        expect( Array.from( expr.descendantsIterator() ).filter(
            d => M.encodedIndices( d ) !== undefined
        ).length ).to.equal( 2 )
        expr = expr.lastChild().copy() // the lifting mentioned above
        expect( M.encodedIndices( expr.child( 1 ) ) ).to.eql( [ 0, 0 ] )
        expect( M.encodedIndices( expr.child( 2 ) ) ).to.eql( [ 0, 1 ] )
        copy = expr.copy()
        M.adjustIndices( copy, 1, 1 )
        expect( copy.equals( expr ) ).to.equal( false )
        expect( M.equal( copy, expr ) ).to.equal( false )
        expect( M.encodedIndices( expr.child( 1 ) ) ).to.eql( [ 0, 0 ] )
        expect( M.encodedIndices( expr.child( 2 ) ) ).to.eql( [ 0, 1 ] )
        expect( M.encodedIndices( copy.child( 1 ) ) ).to.eql( [ 1, 1 ] )
        expect( M.encodedIndices( copy.child( 2 ) ) ).to.eql( [ 1, 2 ] )
        // Create x , y , (+ x y) which converts to include 2 de Bruijn symbols,
        // both bound, then lift the inner binding out from the outer binding,
        // and thus adjustIndices() should affect only the x, not the y.
        expr = LogicConcept.fromPutdown( 'x , y , (+ x y)' )[0]
        expr = M.encodeExpression( expr )
        expect( Array.from( expr.descendantsIterator() ).filter(
            d => M.encodedIndices( d ) !== undefined
        ).length ).to.equal( 2 )
        expr = expr.lastChild().copy() // the lifting mentioned above
        expect( M.encodedIndices( expr.child( 1, 1 ) ) ).to.eql( [ 1, 0 ] )
        expect( M.encodedIndices( expr.child( 1, 2 ) ) ).to.eql( [ 0, 0 ] )
        copy = expr.copy()
        M.adjustIndices( copy, 1, 1 )
        expect( copy.equals( expr ) ).to.equal( false )
        expect( M.equal( copy, expr ) ).to.equal( false )
        expect( M.encodedIndices( expr.child( 1, 1 ) ) ).to.eql( [ 1, 0 ] )
        expect( M.encodedIndices( expr.child( 1, 2 ) ) ).to.eql( [ 0, 0 ] )
        expect( M.encodedIndices( copy.child( 1, 1 ) ) ).to.eql( [ 2, 1 ] )
        expect( M.encodedIndices( copy.child( 1, 2 ) ) ).to.eql( [ 0, 0 ] )
    } )

    it( 'Should check free-ness of a de Bruijn encoded symbol', () => {
        let expression
        let encoded
        // Re-using Expression 1 from the previous test
        // x , y , (f x y) ----> (db (db (f db_1_0 db_0_0)))
        expression = LogicConcept.fromPutdown( 'x , y , (f x y)' )[0]
        encoded = M.encodeExpression( expression )
        // Of the 5 symbols in the encoding, only the last 2 are bound,
        // and all non-bound ones are undefined
        expect( M.free( encoded.child( 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 1, 1 ) ) ).to.equal( false )
        expect( M.free( encoded.child( 1, 1, 2 ) ) ).to.equal( false )
        // But if we were to pop off the outermost binding, that changes one
        // bound to free, but non-de Bruijn symbols are still undefined
        encoded = encoded.child( 1 ).copy()
        expect( M.free( encoded.child( 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 1 ) ) ).to.equal( true )
        expect( M.free( encoded.child( 1, 2 ) ) ).to.equal( false )
        // Re-using Expression 2 from the previous test
        // (sum 1 n i , (sum 1 i j , (* i j)))
        //     ----> (sum 1 n (db (sum 1 db_0_0 (db (* db_1_0 db_0_0)))))
        expression = LogicConcept.fromPutdown(
            '(sum 1 n i , (sum 1 i j , (* i j)))' )[0]
            encoded = M.encodeExpression( expression )
        // Of the 11 symbols in the encoding, only 3 are bound,
        // and all non-bound ones are undefined
        expect( M.free( encoded.child( 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 2 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 3, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 3, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 3, 1, 1 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 3, 1, 2 ) ) ).to.equal( false )
        expect( M.free( encoded.child( 3, 1, 3, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 3, 1, 3, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 3, 1, 3, 1, 1 ) ) ).to.equal( false )
        expect( M.free( encoded.child( 3, 1, 3, 1, 2 ) ) ).to.equal( false )
        // But if we were to pop off the outermost binding, that changes two
        // bound to free, but non-de Bruijn symbols are still undefined
        encoded = encoded.child( 3, 1 ).copy()
        expect( M.free( encoded.child( 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 2 ) ) ).to.equal( true )
        expect( M.free( encoded.child( 3, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 3, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 3, 1, 1 ) ) ).to.equal( true )
        expect( M.free( encoded.child( 3, 1, 2 ) ) ).to.equal( false )
        // Re-using Expression 3 from the previous test
        // (and (forall x , (P x)) (exists x , (Q x)))
        //     ----> (and (forall (db (P db_0_0))) (exists (db (Q db_0_0))))
        expression = LogicConcept.fromPutdown(
            '(and (forall x , (P x)) (exists x , (Q x)))' )[0]
        encoded = M.encodeExpression( expression )
        // Of the 9 symbols in the encoding, only 2 are bound,
        // and all non-bound ones are undefined
        expect( M.free( encoded.child( 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 1, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 1, 1, 1, 1 ) ) ).to.equal( false )
        expect( M.free( encoded.child( 2, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 2, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 2, 1, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( encoded.child( 2, 1, 1, 1 ) ) ).to.equal( false )
        // And if we were to pop off the outermost expression, nothing changes
        let subexpr = encoded.child( 1 ).copy()
        expect( M.free( subexpr.child( 0 ) ) ).to.equal( undefined )
        expect( M.free( subexpr.child( 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( subexpr.child( 1, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( subexpr.child( 1, 1, 1 ) ) ).to.equal( false )
        subexpr = encoded.child( 2 ).copy()
        expect( M.free( subexpr.child( 0 ) ) ).to.equal( undefined )
        expect( M.free( subexpr.child( 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( subexpr.child( 1, 1, 0 ) ) ).to.equal( undefined )
        expect( M.free( subexpr.child( 1, 1, 1 ) ) ).to.equal( false )
    } )

    it( 'Should count number of occurrences correctly', () => {
        let parent, A, B

        // The first test is the one given in the documentation itself:
        // Parent = (forall x , (and (Q x) (forall y , (or (Q x) (P x y)))))
        //      --> (forall (db (and
        //            (Q (0,0))
        //            (forall (db (or (Q (1,0)) (P (1,0) (0,0)))))
        //          )))
        // A = the first (Q x) descendant inside the parent
        // --> (Q (0,0))
        // B = the (forall y , (or (Q x) (P x y))) descendant inside the parent
        // --> (forall (db (or (Q (1,0)) (P (1,0) (0,0)))))
        parent = LogicConcept.fromPutdown(
            '(forall x , (and (Q x) (forall y , (or (Q x) (P x y)))))'
        )[0]
        parent = M.encodeExpression( parent )
        A = parent.child( 1, 1, 1 )
        B = parent.child( 1, 1, 2 )
        // Ensure we selected the correct A and B that we think we did:
        expect( M.decodeSymbol( A.child( 0 ) ).text() ).to.equal( 'Q' )
        expect( M.decodeSymbol( B.child( 0 ) ).text() ).to.equal( 'forall' )
        // Computing it the naive way gives the wrong answer:
        expect(
            B.descendantsSatisfying( d => M.equal( d, A ) ).length
        ).to.equal( 0 )
        // But computing it with the de Bruijn # occurrences function works:
        expect( M.numberOfOccurrences( A, B ) ).to.equal( 1 )

        // We get the same answers even if A is a copy of itself rather than
        // the original.
        A = A.copy()
        expect(
            B.descendantsSatisfying( d => M.equal( d, A ) ).length
        ).to.equal( 0 )
        expect( M.numberOfOccurrences( A, B ) ).to.equal( 1 )

        // But if we had used the (Q (1,0)) that sits inside B, we would have
        // gotten the wrong answer, because its indices are calibrated to the
        // ancestry of B, but the numberOfOccurrences() function requires A and
        // B to have all ancestor bindings in common.  It doesn't matter whether
        // we use the original (Q (1,0)) in B or a copy.
        A = B.child( 1, 1, 1 )
        expect( M.decodeSymbol( A.child( 0 ) ).text() ).to.equal( 'Q' )
        expect(
            B.descendantsSatisfying( d => M.equal( d, A ) ).length
        ).to.equal( 1 )
        expect( M.numberOfOccurrences( A, B ) ).to.equal( 0 )
        A = A.copy()
        expect(
            B.descendantsSatisfying( d => M.equal( d, A ) ).length
        ).to.equal( 1 )
        expect( M.numberOfOccurrences( A, B ) ).to.equal( 0 )

        // If we repeat the first test, but now let B be the immediate parent of
        // A, we still get correct answers, because the have all binding
        // ancestors in common.  But the answers are now different, because A
        // appears in B twice.
        A = parent.child( 1, 1, 1 )
        B = parent.child( 1, 1 )
        expect(
            B.descendantsSatisfying( d => M.equal( d, A ) ).length
        ).to.equal( 1 )
        expect( M.numberOfOccurrences( A, B ) ).to.equal( 2 )

        // We get the same answers even if A is a copy of itself rather than
        // the original.
        A = A.copy()
        expect(
            B.descendantsSatisfying( d => M.equal( d, A ) ).length
        ).to.equal( 1 )
        expect( M.numberOfOccurrences( A, B ) ).to.equal( 2 )
    } )

} )
