
// We import this because it's the subject of this test suite.
import { LogicConcept } from '../src/logic-concept.js'

// And these are needed for other tests below, such as parsing
import { MathConcept } from '../src/math-concept.js'
import { Environment } from '../src/environment.js'
import { Declaration } from '../src/declaration.js'
import { Application } from '../src/application.js'
import { Binding } from '../src/binding.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'

// We need the makeSpy function for convenience testing of callbacks.
import { makeSpy } from './test-utils.js'

// Test suites begin here.

describe( 'LogicConcept module', () => {

    it( 'Should have all expected global identifiers declared', () => {
        expect( LogicConcept ).to.be.ok
    } )

    it( 'Should correcty construct LogicConcepts', () => {
        // Can we create an empty one?
        let L = new LogicConcept()
        expect( L ).to.be.ok
        expect( L ).to.be.instanceOf( LogicConcept )
        expect( L.numChildren() ).to.equal( 0 )
        // Can we create a hierarchy of them?
        L = new LogicConcept(
            new LogicConcept(),
            new LogicConcept(
                new LogicConcept()
            )
        )
        expect( L ).to.be.ok
        expect( L ).to.be.instanceOf( LogicConcept )
        expect( L.numChildren() ).to.equal( 2 )
        expect( L.child( 0 ).numChildren() ).to.equal( 0 )
        expect( L.child( 1 ).numChildren() ).to.equal( 1 )
        // If we try to put non-LogicConcepts inside a LogicConcept,
        // does it filter them out?
        L = new LogicConcept(
            new LogicConcept(),
            new MathConcept(),
            new LogicConcept()
        )
        expect( L ).to.be.ok
        expect( L ).to.be.instanceOf( LogicConcept )
        expect( L.numChildren() ).to.equal( 2 )
        expect( L.child( 0 ) ).to.be.instanceOf( LogicConcept )
        expect( L.child( 1 ) ).to.be.instanceOf( LogicConcept )
    } )

} )

describe( 'Dirty flags for LogicConcepts', () => {

    it( 'Should be on by default', () => {
        // make a small hierarchy
        let L = new LogicConcept(
            new LogicConcept(),
            new LogicConcept()
        )
        // ensure all entries are dirty
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
    } )

    it( 'Should not propagate dirty changes upward', () => {
        // make a small hierarchy
        let L = new LogicConcept(
            new LogicConcept(),
            new LogicConcept()
        )
        // repeat previous test just as a sanity check
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        // change them one at a time to not dirty and ensure
        // that they change only one at a time
        L.child( 0 ).markDirty( false )
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        L.child( 1 ).markDirty( false )
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( false )
        L.markDirty( false )
        expect( L.isDirty() ).to.equal( false )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( false )
        // marking them dirty again also does not propagate
        L.child( 0 ).markDirty( true )
        expect( L.isDirty() ).to.equal( false )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( false )
        L.child( 1 ).markDirty( true )
        expect( L.isDirty() ).to.equal( false )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        L.markDirty( true )
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        // unless you ask it to propagate
        L.child( 0 ).markDirty( false, true )
        expect( L.isDirty() ).to.equal( false )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        L.child( 1 ).markDirty( true, true )
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
    } )

} )

describe( 'Non-expression "conclusions"', () => {

    it( 'Should correctly detect when an LC has all claim ancestors', () => {
        // Note that the hasOnlyClaimAncestors function is also used as the
        // internal implementation of isAConclusionIn, which is tested
        // extensively in environment-test.js.  So this is a more brief test.
        let A = new LurchSymbol( 'A' )
        let X = new Environment( A )
        expect( A.hasOnlyClaimAncestors( A ) ).to.equal( true )
        expect( A.hasOnlyClaimAncestors( X ) ).to.equal( true )
        expect( A.hasOnlyClaimAncestors() ).to.equal( true )
        X.makeIntoA( 'given' )
        expect( A.hasOnlyClaimAncestors( A ) ).to.equal( true )
        expect( A.hasOnlyClaimAncestors( X ) ).to.equal( true )
        expect( A.hasOnlyClaimAncestors() ).to.equal( false )
        let B = new LurchSymbol( 'B' )
        let Y = new Environment( B )
        X.pushChild( Y )
        expect( A.hasOnlyClaimAncestors( A ) ).to.equal( true )
        expect( A.hasOnlyClaimAncestors( X ) ).to.equal( true )
        expect( A.hasOnlyClaimAncestors() ).to.equal( false )
        expect( Y.hasOnlyClaimAncestors( Y ) ).to.equal( true )
        expect( Y.hasOnlyClaimAncestors( X ) ).to.equal( true )
        expect( Y.hasOnlyClaimAncestors() ).to.equal( false )
        expect( B.hasOnlyClaimAncestors( B ) ).to.equal( true )
        expect( B.hasOnlyClaimAncestors( Y ) ).to.equal( true )
        expect( B.hasOnlyClaimAncestors( X ) ).to.equal( true )
        expect( B.hasOnlyClaimAncestors() ).to.equal( false )
        Y.makeIntoA( 'given' )
        expect( B.hasOnlyClaimAncestors( B ) ).to.equal( true )
        expect( B.hasOnlyClaimAncestors( Y ) ).to.equal( true )
        expect( B.hasOnlyClaimAncestors( X ) ).to.equal( false )
        expect( B.hasOnlyClaimAncestors() ).to.equal( false )
    } )

} )

describe( 'Sending feedback about LogicConcepts', () => {

    let L
    let M

    beforeEach( () => {
        // Create a LogicConcept with a MathConcept origin and spy on
        // that origin's feedback method
        L = new LogicConcept
        M = new MathConcept
        L._origin = M
        M.feedback = makeSpy()
    } )

    it( 'Should send feedback through their origins by default', () => {
        // Have the LogicConcept send feedback about itself and ensure
        // that the MathConcept hears about it
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.feedback( { 'sky color' : 'blue', 'grass color' : 'green' } )
        expect( M.feedback.callRecord ).to.eql( [
            [ { 'sky color' : 'blue', 'grass color' : 'green' } ]
        ] )
        L.feedback( [ 'x', 'y', 'z' ] )
        expect( M.feedback.callRecord ).to.eql( [
            [ { 'sky color' : 'blue', 'grass color' : 'green' } ],
            [ [ 'x', 'y', 'z' ] ]
        ] )
    } )

    it( 'Should not send feedback if feedback is disabled', () => {
        // Disable feedback
        L.enableFeedback( false )
        // Have the LogicConcept send feedback about itself and ensure
        // that the MathConcept hears nothing
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.feedback( { 'sky color' : 'blue', 'grass color' : 'green' } )
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.feedback( [ 'x', 'y', 'z' ] )
        expect( M.feedback.callRecord ).to.eql( [ ] )
    } )

    it( 'Can flush the queue when feedback is enabled', () => {
        // Disable feedback
        L.enableFeedback( false )
        // Have the LogicConcept send feedback about itself
        L.feedback( { 'sky color' : 'blue', 'grass color' : 'green' } )
        L.feedback( [ 'x', 'y', 'z' ] )
        // Re-enable feedback and flush the queue, then check to be
        // sure that M heard everything at once at the end
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.enableFeedback( true, true )
        expect( M.feedback.callRecord ).to.eql( [
            [ { 'sky color' : 'blue', 'grass color' : 'green' } ],
            [ [ 'x', 'y', 'z' ] ]
        ] )
    } )

    it( 'Can discard the queue when feedback is enabled', () => {
        // Disable feedback
        L.enableFeedback( false )
        // Have the LogicConcept send feedback about itself
        L.feedback( { 'sky color' : 'blue', 'grass color' : 'green' } )
        L.feedback( [ 'x', 'y', 'z' ] )
        // Re-enable feedback but don't flush the queue, then check to be
        // sure that M heard nothing
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.enableFeedback( true, false )
        expect( M.feedback.callRecord ).to.eql( [ ] )
    } )

} )

describe( 'Reading putdown notation', () => {

    const debugParsingResults = results => results.forEach( (result,index) =>
        console.log( `${index}. ` +
            ( ( result instanceof Object && result.toJSON ) ?
                JSON.stringify( result.toJSON(), null, 4 ) : result ) ) )

    it( 'Should correctly parse any symbol (very flexible category)', () => {
        const mustParseToASymbol = ( inText, outText ) => {
            if ( typeof( outText ) === 'undefined' )
                outText = inText
            const test = LogicConcept.fromPutdown( inText )
            expect( test ).to.be.instanceof( Array )
            expect( test.length ).to.equal( 1 )
            expect( test[0] ).to.be.instanceOf( LurchSymbol )
            expect( test[0].text() ).to.equal( outText )
        }
        mustParseToASymbol( 'x' )
        mustParseToASymbol( 'Xanadu' )
        mustParseToASymbol( '-15.965' )
        mustParseToASymbol( '∅' )
        mustParseToASymbol( '∃!' )
        mustParseToASymbol( 'why_is_this----really_long_bro!?!?' )
        mustParseToASymbol( '    y', 'y' )
        mustParseToASymbol( 'John_Kennedy   ', 'John_Kennedy' )
        mustParseToASymbol( '     -100000     ', '-100000' )
    } )

    it( 'Should correctly parse string literals into symbols', () => {
        const mustParseAsString = ( string, meaning ) => {
            const test = LogicConcept.fromPutdown( string )
            expect( test ).to.be.instanceof( Array )
            expect( test.length ).to.equal( 1 )
            expect( test[0] ).to.be.instanceOf( LurchSymbol )
            expect( test[0].text() ).to.equal( meaning )
        }
        mustParseAsString( '"this is some text"',
                           'this is some text' )
        mustParseAsString( '"Should be treated as one big symbol"',
                           'Should be treated as one big symbol' )
        mustParseAsString( '"She said, \\"If you think so...\\""',
                           'She said, "If you think so..."' )
        mustParseAsString( '\'abcdef"ghijkl"mnopqr\'',
                           'abcdef"ghijkl"mnopqr' )
        mustParseAsString( '"                 "',
                           '                 ' )
        mustParseAsString( '"Backslashes are \\\\, okay?"',
                           'Backslashes are \\, okay?' )
    } )

    it( 'Should not accept string literals with newlines inside', () => {
        expect( () => { LogicConcept.fromPutdown( '"line 1\nline 2"' ) } )
            .to.throw( /Incorrectly formed string literal/ )
        expect( () => { LogicConcept.fromPutdown( "'line 1\nline 2'" ) } )
            .to.throw( /Incorrectly formed string literal/ )
        expect( () => { LogicConcept.fromPutdown( '"\nline 2"' ) } )
            .to.throw( /Incorrectly formed string literal/ )
        expect( () => { LogicConcept.fromPutdown( "'\nline 2'" ) } )
            .to.throw( /Incorrectly formed string literal/ )
        expect( () => { LogicConcept.fromPutdown( '"line 1\n"' ) } )
            .to.throw( /Incorrectly formed string literal/ )
        expect( () => { LogicConcept.fromPutdown( "'line 1\n'" ) } )
            .to.throw( /Incorrectly formed string literal/ )
    } )

    it( 'Should handle multiple atomics at the top level', () => {
        let test
        test = LogicConcept.fromPutdown( 'x y z' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 3 )
        expect( test[0] ).to.be.instanceOf( LurchSymbol )
        expect( test[0].text() ).to.equal( 'x' )
        expect( test[1] ).to.be.instanceOf( LurchSymbol )
        expect( test[1].text() ).to.equal( 'y' )
        expect( test[2] ).to.be.instanceOf( LurchSymbol )
        expect( test[2].text() ).to.equal( 'z' )
        test = LogicConcept.fromPutdown( '\n"LITERALLY ANYTHING"\n\n∉ ∅' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 3 )
        expect( test[0] ).to.be.instanceOf( LurchSymbol )
        expect( test[0].text() ).to.equal( 'LITERALLY ANYTHING' )
        expect( test[1] ).to.be.instanceOf( LurchSymbol )
        expect( test[1].text() ).to.equal( '∉' )
        expect( test[2] ).to.be.instanceOf( LurchSymbol )
        expect( test[2].text() ).to.equal( '∅' )
    } )

    it( 'Should support applications (even nested ones)', () => {
        let test
        // ----------
        test = LogicConcept.fromPutdown( '(+ 1 2)' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Application(
                new LurchSymbol( '+' ),
                new LurchSymbol( '1' ),
                new LurchSymbol( '2' )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '(f x) hello! ((n))' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 3 )
        expect( test[0].equals(
            new Application( new LurchSymbol( 'f' ), new LurchSymbol( 'x' ) )
        ) ).to.equal( true )
        expect( test[1].equals( new LurchSymbol( 'hello!' ) ) ).to.equal( true )
        expect( test[2].equals(
            new Application( new Application( new LurchSymbol( 'n' ) ) )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '(- (^ b 2) (* (* 4 a) c))' )
        const discriminant = new Application(
            new LurchSymbol( '-' ),
            new Application( new LurchSymbol( '^' ), new LurchSymbol( 'b' ),
                             new LurchSymbol( '2' ) ),
            new Application(
                new LurchSymbol( '*' ),
                new Application( new LurchSymbol( '*' ),
                    new LurchSymbol( '4' ), new LurchSymbol( 'a' ) ),
                new LurchSymbol( 'c' )
            )
        )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals( discriminant ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '(-(^ b 2)(*(* 4 a)c))' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals( discriminant ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '   (-(^ b 2)\n\n\n(* (* 4 a)c)   )' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals( discriminant ) ).to.equal( true )
    } )

    it( 'Should support bindings (even nested ones)', () => {
        let test
        // ----------
        test = LogicConcept.fromPutdown( '(∀ x, P)' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Binding(
                new LurchSymbol( '∀' ),
                new LurchSymbol( 'x' ),
                new LurchSymbol( 'P' )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( `
            (∃ alpha beta gamma,
                (= (+ alpha beta)
                   (* 2 gamma) ) )
        ` )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Binding(
                new LurchSymbol( '∃' ),
                new LurchSymbol( 'alpha' ),
                new LurchSymbol( 'beta' ),
                new LurchSymbol( 'gamma' ),
                new Application(
                    new LurchSymbol( '=' ),
                    new Application(
                        new LurchSymbol( '+' ),
                        new LurchSymbol( 'alpha' ),
                        new LurchSymbol( 'beta' )
                    ),
                    new Application(
                        new LurchSymbol( '*' ),
                        new LurchSymbol( '2' ),
                        new LurchSymbol( 'gamma' )
                    )
                )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '(\n(∑ 1 n) i\n,\n(^ i 2)\n)' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Binding(
                new Application( new LurchSymbol( '∑' ),
                    new LurchSymbol( '1' ), new LurchSymbol( 'n' ) ),
                new LurchSymbol( 'i' ),
                new Application( new LurchSymbol( '^' ),
                    new LurchSymbol( 'i' ), new LurchSymbol( '2' ) ),
            )
        ) ).to.equal( true )
    } )

    it( 'Should support declarations without bodies', () => {
        let test
        // ----------
        test = LogicConcept.fromPutdown( '[x] [y]' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 2 )
        expect( test[0].equals(
            new Declaration( new LurchSymbol( 'x' ) )
        ) ).to.equal( true )
        expect( test[1].equals(
            new Declaration( new LurchSymbol( 'y' ) )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '[pi e 0 1 2 3]' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Declaration(
                [
                    new LurchSymbol( 'pi' ),
                    new LurchSymbol( 'e' ),
                    new LurchSymbol( '0' ),
                    new LurchSymbol( '1' ),
                    new LurchSymbol( '2' ),
                    new LurchSymbol( '3' )
                ]
            )
        ) ).to.equal( true )
    } )

    it( 'Should support declarations with bodies', () => {
        let test
        // ----------
        test = LogicConcept.fromPutdown( '[x , (∈ x Z)]' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Declaration(
                new LurchSymbol( 'x' ),
                new Application(
                    new LurchSymbol( '∈' ),
                    new LurchSymbol( 'x' ),
                    new LurchSymbol( 'Z' )
                )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( `[x , { (∈ x Z) (> x 5) }]` )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Declaration(
                new LurchSymbol( 'x' ),
                new Environment(
                    new Application(
                        new LurchSymbol( '∈' ),
                        new LurchSymbol( 'x' ),
                        new LurchSymbol( 'Z' )
                    ),
                    new Application(
                        new LurchSymbol( '>' ),
                        new LurchSymbol( 'x' ),
                        new LurchSymbol( '5' )
                    )
                )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( `[pi , [m n]]` )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Declaration(
                new LurchSymbol( 'pi' ),
                new Declaration(
                    new LurchSymbol( 'm' ),
                    new LurchSymbol( 'n' )
                )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown(
            '[pi , ("something about circles" pi)]'
          + '[e  , ("something about limits"  e)]' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 2 )
        expect( test[0].equals(
            new Declaration(
                new LurchSymbol( 'pi' ),
                new Application(
                    new LurchSymbol( 'something about circles' ),
                    new LurchSymbol( 'pi' )
                )
            )
        ) ).to.equal( true )
        expect( test[1].equals(
            new Declaration(
                new LurchSymbol( 'e' ),
                new Application(
                    new LurchSymbol( 'something about limits' ),
                    new LurchSymbol( 'e' )
                )
            )
        ) ).to.equal( true )
    } )

    it( 'Should support non-formula environments without givens', () => {
        let test
        // ----------
        test = LogicConcept.fromPutdown( '{ A B C }' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Environment(
                new LurchSymbol( 'A' ),
                new LurchSymbol( 'B' ),
                new LurchSymbol( 'C' )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '{{}{}}{}{}' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 3 )
        expect( test[0].equals(
            new Environment( new Environment, new Environment )
        ) ).to.equal( true )
        expect( test[1].equals( new Environment ) ).to.equal( true )
        expect( test[2].equals( new Environment ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '{ (x y) [z] { ((QQ)) }}' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Environment(
                new Application( new LurchSymbol( 'x' ),
                                 new LurchSymbol( 'y' ) ),
                new Declaration( new LurchSymbol( 'z' ) ),
                new Environment( new Application( new Application(
                    new LurchSymbol( 'QQ' ) ) ) )
            )
        ) ).to.equal( true )
        // console.log( JSON.stringify( test[0].toJSON(), null, 4 ) )
    } )

    it( 'Should support non-formula environments with givens', () => {
        let test
        // ----------
        test = LogicConcept.fromPutdown( '{ A :B C }' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Environment(
                new LurchSymbol( 'A' ),
                new LurchSymbol( 'B' ).asA( 'given' ),
                new LurchSymbol( 'C' )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( ':{:{}{}}{}:{}' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 3 )
        expect( test[0].equals(
            new Environment(
                new Environment().asA( 'given' ),
                new Environment
            ).asA( 'given' )
        ) ).to.equal( true )
        expect( test[1].equals( new Environment ) ).to.equal( true )
        expect( test[2].equals(
            new Environment().asA( 'given' )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( '{ :(x y) [z] { :((QQ)) }}' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Environment(
                new Application(
                    new LurchSymbol( 'x' ), new LurchSymbol( 'y' )
                ).asA( 'given' ),
                new Declaration( new LurchSymbol( 'z' ) ),
                new Environment(
                    new Application(
                        new Application( new LurchSymbol( 'QQ' ) )
                    ).asA( 'given' )
                )
            )
        ) ).to.equal( true )
    } )

    it( 'Should let us add comments to the end of any line', () => {
        let test
        // ----------
        test = LogicConcept.fromPutdown( `
            { A :B C } // just putting a comment here. { { x y } }
        ` )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Environment(
                new LurchSymbol( 'A' ),
                new LurchSymbol( 'B' ).asA( 'given' ),
                new LurchSymbol( 'C' )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( `
            [a b c] // Let a, b, c be arbitrary.
            ((a b) (b c)) // No one knows what this even means.
            // Here's a line with only comments!  Haha!
            // Another, because, why not?
        ` )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 2 )
        expect( test[0].equals(
            new Declaration(
                [
                    new LurchSymbol( 'a' ),
                    new LurchSymbol( 'b' ),
                    new LurchSymbol( 'c' )
                ]
            )
        ) ).to.equal( true )
        expect( test[1].equals(
            new Application(
                new Application( new LurchSymbol( 'a' ),
                                 new LurchSymbol( 'b' ) ),
                new Application( new LurchSymbol( 'b' ),
                                 new LurchSymbol( 'c' ) )
            )
        ) ).to.equal( true )
    } )

    it( 'Should let us add JSON attributes to anything', () => {
        let test
        // ----------
        test = LogicConcept.fromPutdown( '{ A B +{"foo":7,"bar":"!"}\n C }' )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Environment(
                new LurchSymbol( 'A' ),
                new LurchSymbol( 'B' ).attr( { "foo" : 7, "bar" : "!" } ),
                new LurchSymbol( 'C' )
            )
        ) ).to.equal( true )
        // ----------
        test = LogicConcept.fromPutdown( `
            [
                x +{"special variable":false}
                y
                ,
                (
                    P
                    x
                    y +{"special variable":true}
                      +{"double special?":"you know it"}
                )
            ] +{"modifier at topmost level":"checking in"}
        ` )
        expect( test ).to.be.instanceof( Array )
        expect( test.length ).to.equal( 1 )
        expect( test[0].equals(
            new Declaration(
                [
                    new LurchSymbol( 'x' ).attr(
                        { 'special variable' : false } ),
                    new LurchSymbol( 'y' )
                ],
                new Application(
                    new LurchSymbol( 'P' ),
                    new LurchSymbol( 'x' ),
                    new LurchSymbol( 'y' ).attr( {
                        'special variable' : true,
                        'double special?' : 'you know it'
                    } )
                )
            ).attr( { 'modifier at topmost level' : 'checking in' } )
        ) ).to.equal( true )
    } )

    it( 'Should detect and report a wide variety of parsing errors', () => {
        // you can't just write invalid JSON attributes
        expect( () => {
            LogicConcept.fromPutdown( 'A +{not JSON}' )
        } ).to.throw( /^Invalid JSON attribute: / )
        // you can't put +{...} without a previous sibling
        expect( () => {
            LogicConcept.fromPutdown( '+{"one":2}' )
        } ).to.throw( /^Attribute JSON has no target to modify/ )
        expect( () => {
            LogicConcept.fromPutdown( '{ +{"one":2}\n}' )
        } ).to.throw( /^Attribute JSON has no target to modify/ )
        expect( () => {
            LogicConcept.fromPutdown( '[ +{"one":2}\nx ]' )
        } ).to.throw( /^Attribute JSON has no target to modify/ )
        expect( () => {
            LogicConcept.fromPutdown( '( +{"one":2}\nx )' )
        } ).to.throw( /^Attribute JSON has no target to modify/ )
        // you must match your groupers
        expect( () => {
            LogicConcept.fromPutdown( '( ]' )
        } ).to.throw( /^Mismatched groupers: \( \]/ )
        expect( () => {
            LogicConcept.fromPutdown( '{ { (x y z) [t c const] } ) }' )
        } ).to.throw( /^Mismatched groupers: \{ \)/ )
        // cannot use a given marker before the end of an environment
        expect( () => {
            LogicConcept.fromPutdown( '{ a b : }' )
        } ).to.throw( /^Cannot end an environment with a colon/ )
        // cannot put more than one comma in a declaration
        expect( () => {
            LogicConcept.fromPutdown( '{ [x] [y , z , w] }' )
        } ).to.throw( /^A declaration can have at most one comma/ )
        expect( () => {
            LogicConcept.fromPutdown( '{ [x , a b c , ] }' )
        } ).to.throw( /^A declaration can have at most one comma/ )
        // cannot have a declaration begin/end with a comma
        expect( () => {
            LogicConcept.fromPutdown( '{ [x] [y z ,] }' )
        } ).to.throw( /^Misplaced comma/ )
        expect( () => {
            LogicConcept.fromPutdown( '{ [, a b c] }' )
        } ).to.throw( /^Misplaced comma/ )
        // must put at least one thing in a declaration
        expect( () => {
            LogicConcept.fromPutdown( '{ [] }' )
        } ).to.throw( /^Empty declarations are not permitted/ )
        expect( () => {
            LogicConcept.fromPutdown( '{ x y z } []' )
        } ).to.throw( /^Empty declarations are not permitted/ )
        // must put at most one thing after the comma in a declaration
        expect( () => {
            LogicConcept.fromPutdown( '{ [x , y z] }' )
        } ).to.throw( /^Misplaced comma inside declaration/ )
        expect( () => {
            LogicConcept.fromPutdown( '(P x y) [xanadu , yeti zed]' )
        } ).to.throw( /^Misplaced comma inside declaration/ )
        // may not write an empty application, ()
        expect( () => {
            LogicConcept.fromPutdown( '(P x y () z)' )
        } ).to.throw( /^Empty applications are not permitted/ )
        // can't put two or more commas in an expression
        expect( () => {
            LogicConcept.fromPutdown( '(∀ x, y, (≤ x y))' )
        } ).to.throw( /^An expression can have at most one comma/ )
        expect( () => {
            LogicConcept.fromPutdown( '(∀ x ,,, (≤ x infty))' )
        } ).to.throw( /^An expression can have at most one comma/ )
        // the comma in a binding must be the second-to-last thing
        expect( () => {
            LogicConcept.fromPutdown( '(∀ x, (≤ x infty) oops)' )
        } ).to.throw( /^Misplaced comma inside expression/ )
        expect( () => {
            LogicConcept.fromPutdown( '(∀ x (≤ x infty) oops ,)' )
        } ).to.throw( /^Misplaced comma inside expression/ )
        expect( () => {
            LogicConcept.fromPutdown( '(∀ , x (≤ x infty))' )
        } ).to.throw( /^Misplaced comma inside expression/ )
        // colons can go only in environments, not expressions/declarations
        expect( () => {
            LogicConcept.fromPutdown( '(a b :c)' )
        } ).to.throw( /^Cannot put a colon inside an expression/ )
        expect( () => {
            LogicConcept.fromPutdown( '[ x :y const]' )
        } ).to.throw( /^Cannot put a colon inside a declaration/ )
        // can't have one colon modify another (no double givens (?))
        expect( () => {
            LogicConcept.fromPutdown( '{ :A ::B (and A B) }' )
        } ).to.throw( /^Cannot put two colons in a row/ )
        // can't write a comma outside of an expression or declaration
        expect( () => {
            LogicConcept.fromPutdown( '{ ∀ x, (≤ x infty) }' )
        } ).to.throw( /^Comma belongs only in expression or declaration/ )
        // must end your string literal before a newline shows up
        expect( () => {
            LogicConcept.fromPutdown( '"one\ntwo"' )
        } ).to.throw( /^Incorrectly formed string literal/ )
        expect( () => {
            LogicConcept.fromPutdown( "'one\ntwo'" )
        } ).to.throw( /^Incorrectly formed string literal/ )
        // must end all groups before the end of the text to be parsed
        expect( () => {
            LogicConcept.fromPutdown( '{ { thing } } (((x)) uh-oh problem' )
        } ).to.throw( /^Reached end of input while still inside \(/ )
        // all incorrect types of nesting
        expect( () => {
            LogicConcept.fromPutdown( '(f x { y })' )
        } ).to.throw( /^Expressions can contain only/ )
        expect( () => {
            LogicConcept.fromPutdown( '(g { z } t)' )
        } ).to.throw( /^Expressions can contain only/ )
        expect( () => {
            LogicConcept.fromPutdown( '([a] (b c))' )
        } ).to.throw( /^Expressions can contain only/ )
        // all other invalid ways to form a larger structure
        expect( () => {
            LogicConcept.fromPutdown( '[(x y) const]' )
        } ).to.throw( /^Not every entry.*was a Symbol/ )
        expect( () => {
            LogicConcept.fromPutdown( '[{x y} const]' )
        } ).to.throw( /^Not every entry.*was a Symbol/ )
    } )

} )

describe( 'Writing putdown notation', () => {

    it( 'Should correctly represent any kind of Symbol', () => {
        expect( new LurchSymbol( 'x' ).toPutdown() ).to.equal( 'x' )
        expect( new LurchSymbol( 'one more thing' ).toPutdown() )
            .to.equal( '"one more thing"' )
        expect( new LurchSymbol( '"""""' ).toPutdown() )
            .to.equal( '"\\"\\"\\"\\"\\""' )
        expect( new LurchSymbol( '{}(){*@@@*}' ).toPutdown() )
            .to.equal( '"{}(){*@@@*}"' )
        expect( new LurchSymbol( 'even\nmultiple\nlines' ).toPutdown() )
            .to.equal( '"even\\nmultiple\\nlines"' )
    } )

    it( 'Should correctly represent nested Applications', () => {
        let test
        // simple one
        test = new Application( new LurchSymbol( 'f' ),
                                new LurchSymbol( 'x' ) )
        expect( test.toPutdown() ).to.equal( '(f x)' )
        // nested one
        const discriminant = new Application(
            new LurchSymbol( '-' ),
            new Application(
                new LurchSymbol( '^' ), new LurchSymbol( 'b' ),
                new LurchSymbol( '2' )
            ),
            new Application(
                new LurchSymbol( '*' ),
                new Application(
                    new LurchSymbol( '*' ), new LurchSymbol( '4' ),
                    new LurchSymbol( 'a' )
                ),
                new LurchSymbol( 'c' )
            )
        )
        expect( discriminant.toPutdown() )
            .to.equal( '(- (^ b 2) (* (* 4 a) c))' )
        // long one--no line breaks, because it's not an Environment
        test = new Application(
            new LurchSymbol( 'one really huge function name' ),
            new LurchSymbol( 'one really huge argument name' ),
            new LurchSymbol( 'another really huge argument name' )
        )
        expect( test.toPutdown() ).to.equal(
            '("one really huge function name"'
          + ' "one really huge argument name"'
          + ' "another really huge argument name")'
        )
    } )

    it( 'Should correctly represent (nested) Bindings', () => {
        let test
        // simple one
        test = new Binding(
            new LurchSymbol( '∀' ),
            new LurchSymbol( 'x' ),
            new LurchSymbol( 'P' )
        )
        expect( test.toPutdown() ).to.equal( '(∀ x , P)' )
        // nested one
        test = new Binding(
            new LurchSymbol( '∀' ),
            new LurchSymbol( 'x' ),
            new Binding(
                new LurchSymbol( '∃' ),
                new LurchSymbol( 'y' ),
                new LurchSymbol( 'Some relationship of x and y' )
            )
        )
        expect( test.toPutdown() ).to.equal(
            '(∀ x , (∃ y , "Some relationship of x and y"))' )
    } )

    it( 'Should correctly represent combined Applications & Bindings', () => {
        let test
        // summation
        test = new Binding(
            new Application( new LurchSymbol( '∑' ),
                             new LurchSymbol( '1' ), new LurchSymbol( 'n' ) ),
            new LurchSymbol( 'i' ),
            new Application( new LurchSymbol( '^' ),
                             new LurchSymbol( 'i' ), new LurchSymbol( '2' ) ),
        )
        expect( test.toPutdown() ).to.equal( '((∑ 1 n) i , (^ i 2))' )
        // predicate logic
        test = new Application(
            new LurchSymbol( 'or' ),
            new Binding(
                new LurchSymbol( '∀' ),
                new LurchSymbol( 'x' ),
                new Application( new LurchSymbol( 'P' ),
                                 new LurchSymbol( 'x' ) )
            ),
            new Binding(
                new LurchSymbol( '∀' ),
                new LurchSymbol( 't' ),
                new LurchSymbol( 'u' ),
                new LurchSymbol( 'v' ),
                new Application(
                    new LurchSymbol( 'K' ),
                    new LurchSymbol( 't' ),
                    new LurchSymbol( 'u' ),
                    new LurchSymbol( 'v' )
                )
            )
        )
        expect( test.toPutdown() ).to.equal(
            '(or (∀ x , (P x)) (∀ t u v , (K t u v)))' )
    } )

    it( 'Should correctly represent Declarations without bodies', () => {
        let test
        test = new Declaration( [
            new LurchSymbol( 'Sunil' ),
            new LurchSymbol( 'Henry' ),
            new LurchSymbol( 'Rodrigo' )
        ] )
        expect( test.toPutdown() ).to.equal( '[Sunil Henry Rodrigo]' )
        test = new Declaration(
            new LurchSymbol( 'The Greek letter π' )
        )
        expect( test.toPutdown() ).to.equal( '["The Greek letter π"]' )
    } )

    it( 'Should correctly represent Declarations any valid body', () => {
        let test
        // symbol body
        test = new Declaration( [
            new LurchSymbol( 'Sunil' ),
            new LurchSymbol( 'Henry' )
        ], new LurchSymbol( 'Helmut' ) )
        expect( test.toPutdown() ).to.equal( '[Sunil Henry , Helmut]' )
        // application body
        test = new Declaration(
            new LurchSymbol( 'π' ),
            new Application( new LurchSymbol( 'Let\'s Eat' ),
                             new LurchSymbol( 'π' ) )
        )
        expect( test.toPutdown() ).to.equal( '[π , ("Let\'s Eat" π)]' )
        // binding body
        test = new Declaration(
            new LurchSymbol( '0' ),
            new Binding(
                new LurchSymbol( '∀' ), new LurchSymbol( 'n' ),
                new LurchSymbol( "n>=0" )
            )
        )
        expect( test.toPutdown() ).to.equal( '[0 , (∀ n , n>=0)]' )
        // compound body
        test = new Declaration(
            new LurchSymbol( '0' ),
            new Binding(
                new LurchSymbol( '∀' ),
                new LurchSymbol( 'n' ),
                new Application(
                    new LurchSymbol( '>=' ),
                    new LurchSymbol( 'n' ),
                    new LurchSymbol( '0' )
                )
            )
        )
        expect( test.toPutdown() ).to.equal( '[0 , (∀ n , (>= n 0))]' )
    } )

    it( 'Should correctly represent small (but nested) Environments', () => {
        let test
        test = new Environment
        expect( test.toPutdown() ).to.equal( '{ }' )
        test = new Environment( new Environment, new Environment )
        expect( test.toPutdown() ).to.equal( '{ { } { } }' )
        test = new Environment( new Environment( new Environment ) )
        expect( test.toPutdown() ).to.equal( '{ { { } } }' )
        test = new Environment(
            new Environment().asA( 'given' ),
            new Environment
        )
        expect( test.toPutdown() ).to.equal( '{ :{ } { } }' )
        test = new Environment(
            new Environment,
            new Environment().asA( 'given' )
        )
        expect( test.toPutdown() ).to.equal( '{ { } :{ } }' )
        test = new Environment(
            new Environment().asA( 'given' ),
            new Environment().asA( 'given' )
        )
        expect( test.toPutdown() ).to.equal( '{ :{ } :{ } }' )
        test = new Environment(
            new Environment,
            new Environment
        ).asA( 'given' )
        expect( test.toPutdown() ).to.equal( ':{ { } { } }' )
    } )

    it( 'Should correctly represent Environments with content', () => {
        let test
        // tiny example
        test = new Environment(
            new LurchSymbol( 'If this' ).asA( 'given' ),
            new LurchSymbol( 'then that' )
        )
        expect( test.toPutdown() ).to.equal( '{ :"If this" "then that" }' )
        // universal introduction rule from predicate logic
        test = new Environment(
            new Declaration( new LurchSymbol( 'x' ) ).asA( 'given' ),
            new Application( new LurchSymbol( 'P' ), new LurchSymbol( 'x' ) )
                .asA( 'given' ),
            new Binding(
                new LurchSymbol( '∀' ),
                new LurchSymbol( 'x' ),
                new Application( new LurchSymbol( 'P' ),
                                 new LurchSymbol( 'x' ) )
            )
        )
        expect( test.toPutdown() ).to.equal(
            '{ :[x] :(P x) (∀ x , (P x)) }' )
        // example with large content that must be broken over multiple lines
        test = new Environment(
            new LurchSymbol( 'this is a long symbol name' ).asA( 'given' ),
            new LurchSymbol( 'this is also a long symbol name' ),
            new Application(
                new LurchSymbol( 'beaucoup de longness, dude' ),
                new LurchSymbol( 'longedy long long longmeister' ),
                new LurchSymbol( 'short' )
            ).asA( 'given' ),
            new Environment(
                new LurchSymbol( 'beaucoup de longness, dude' ),
                new LurchSymbol( 'longedy long long longmeister' ).asA( 'given' ),
                new LurchSymbol( 'short' )
            ).asA( 'given' ),
            new LurchSymbol( 'also short' )
        )
        expect( test.toPutdown() ).to.equal(
            '{\n'
          + '  :"this is a long symbol name"\n'
          + '  "this is also a long symbol name"\n'
          + '  :("beaucoup de longness, dude" "longedy long long longmeister" short)\n'
          + '  :{\n'
          + '    "beaucoup de longness, dude"\n'
          + '    :"longedy long long longmeister"\n'
          + '    short\n'
          + '  }\n'
          + '  "also short"\n'
          + '}'
        )
    } )

    it( 'Should correctly add attributes to any kind of output', () => {
        let test
        // symbol with attributes
        test = new LurchSymbol( 'x' ).attr( { 'color' : 'purple' } )
        expect( test.toPutdown() ).to.equal( 'x +{"color":"purple"}\n' )
        // application with attributes in various places
        test = new Application(
            new LurchSymbol( 'x' ).attr( { 'type' : 'cloud' } ),
            new LurchSymbol( 'y' )
        ).attr( { 'altitude' : '10000ft' } )
        expect( test.toPutdown() ).to.equal(
            '(x +{"type":"cloud"}\n y) +{"altitude":"10000ft"}\n' )
        // binding with attributes in various places
        test = new Binding(
            new LurchSymbol( 'Disjoint Union' ).attr( { 1 : 2, 3 : 4 } ),
            new LurchSymbol( 'i' ),
            new Application(
                new LurchSymbol( 'indexing' ),
                new LurchSymbol( 'S' ),
                new LurchSymbol( 'i' )
            )
        )
        expect( test.toPutdown() ).to.equal(
            '("Disjoint Union"\n'
          + '    +{"1":2}\n'
          + '    +{"3":4}\n'
          + ' i , (indexing S i))' )
        // environment with attributes in many places
        test = new Environment(
            new LurchSymbol( 'A' ).attr( { 'City' : 'Boston' } ).asA( 'given' ),
            new Environment(
                new LurchSymbol( 'B' ).asA( 'given' ),
                new LurchSymbol( 'C' ).attr(
                    { 'Time' : 'Early', 'Weather' : 'Nice' } )
            ).asA( 'given' )
        ).attr( { 'State' : 'MA' } )
        expect( test.toPutdown() ).to.equal(
            '{\n'
          + '  :A +{"City":"Boston"}\n'
          + '  :{\n'
          + '    :B\n'
          + '    C\n'
          + '        +{"Time":"Early"}\n'
          + '        +{"Weather":"Nice"}\n'
          + '  }\n'
          + '} +{"State":"MA"}\n' )
        // we could do other tests here but this is a pretty good start
    } )

} )
