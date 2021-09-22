
import { metavariable } from '../src/matching/constraint.js'
import { Application } from '../src/application.js'
import { Binding } from '../src/binding.js'
import { CaptureConstraint } from '../src/matching/capture-constraint.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Symbol } from '../src/symbol.js'

describe( 'Capture Constraints', () => {

    it( 'Should declare the correct global identifiers', () => {
        expect( CaptureConstraint ).to.be.ok
    } )

    it( 'Should let us construct instances and query their members', () => {
        let CC, b, f
        // one that we can construct
        b = new Symbol( 'bound' )
        f = new Symbol( 'free' )
        expect( () => CC = new CaptureConstraint( b, f ) ).not.to.throw()
        expect( CC.bound ).to.equal( b )
        expect( CC.free ).to.equal( f )
        // one that we cannot construct
        b = LogicConcept.fromPutdown( '(a b c)' )[0]
        f = new Symbol( 'free' )
        expect( () => CC = new CaptureConstraint( b, f ) ).to.throw(
            /can only be constructed from two Symbols/ )
        // another that we cannot construct
        b = new Symbol( 'bound' )
        f = new Symbol( '(∀ x , (= x x))' )[0]
        expect( () => CC = new CaptureConstraint( b, f ) ).to.throw(
            /can only be constructed from two Symbols/ )
        // a final one that we cannot construct
        b = LogicConcept.fromPutdown( '(a b c)' )[0]
        f = new Symbol( '(∀ x , (= x x))' )[0]
        expect( () => CC = new CaptureConstraint( b, f ) ).to.throw(
            /can only be constructed from two Symbols/ )
    } )

    it( 'Should let us make copies and compare for equality', () => {
        let CC, b, f
        // construct a baseline for comparison
        b = new Symbol( 'X' )
        f = new Symbol( 'Y' )
        expect( () => CC = new CaptureConstraint( b, f ) ).not.to.throw()
        expect( CC.bound ).to.equal( b )
        expect( CC.free ).to.equal( f )
        // make a shallow copy and verify it behaves as it ought to
        let copy = CC.copy()
        expect( copy.bound ).to.equal( b )
        expect( copy.free ).to.equal( f )
        expect( copy.equals( CC ) ).to.equal( true )
        // make a deep copy and verify it behaves as it ought to
        let copy2 = new CaptureConstraint( b.copy(), f.copy() )
        expect( copy2.bound ).not.to.equal( b )
        expect( copy2.free ).not.to.equal( f )
        expect( copy2.bound.equals( b ) ).to.equal( true )
        expect( copy2.free.equals( f ) ).to.equal( true )
        expect( copy2.equals( CC ) ).to.equal( true )
        // make some totally different ones and verify they're not equal to those
        let notCopy1 = new CaptureConstraint( new Symbol( 'x' ), f )
        let notCopy2 = new CaptureConstraint( b, new Symbol( 'y' ) )
        let notCopy3 = new CaptureConstraint( new Symbol( 'x' ), new Symbol( 'y' ) )
        expect( CC.equals( notCopy1 ) ).to.equal( false )
        expect( CC.equals( notCopy1 ) ).to.equal( false )
        expect( CC.equals( notCopy1 ) ).to.equal( false )
        expect( copy.equals( notCopy2 ) ).to.equal( false )
        expect( copy.equals( notCopy2 ) ).to.equal( false )
        expect( copy.equals( notCopy2 ) ).to.equal( false )
        expect( copy2.equals( notCopy3 ) ).to.equal( false )
        expect( copy2.equals( notCopy3 ) ).to.equal( false )
        expect( copy2.equals( notCopy3 ) ).to.equal( false )
    } )

    it( 'Should know when an instance is complete', () => {
        let CC
        // all 4 possibilities of bound and free each a metavariable or not
        CC = new CaptureConstraint(
            new Symbol( 'not a metavariable' ),
            new Symbol( 'also not a metavariable' )
        )
        expect( CC.complete() ).to.equal( true )
        CC = new CaptureConstraint(
            new Symbol( 'ooh, a metavariable' ).asA( metavariable ),
            new Symbol( 'also not a metavariable' )
        )
        expect( CC.complete() ).to.equal( false )
        CC = new CaptureConstraint(
            new Symbol( 'not a metavariable' ),
            new Symbol( 'this one is a metavariable' ).asA( metavariable )
        )
        expect( CC.complete() ).to.equal( false )
        CC = new CaptureConstraint(
            new Symbol( 'ooh, a metavariable' ).asA( metavariable ),
            new Symbol( 'this one is a metavariable' ).asA( metavariable )
        )
        expect( CC.complete() ).to.equal( false )
    } )

    it( 'Should know when an instance is satisfied/violated', () => {
        let CC, b, f
        // b occurs free in f, which implies not satisfied, and neither is a
        // metavariable, so the issue is decided
        b = new Symbol( 'thing' )
        f = new Symbol( 'temp' )
        CC = new CaptureConstraint( b, f )
        CC.free = LogicConcept.fromPutdown( '(some thing)' )[0]
        expect( CC.satisfied() ).to.equal( false )
        expect( CC.violated() ).to.equal( true )
        // b occurs bound in f, and does not occur free in f, which implies
        // satisfied, and neither is a metavariable, so the issue is decided
        b = new Symbol( 'thing' )
        f = new Symbol( 'temp' )
        CC = new CaptureConstraint( b, f )
        CC.free = LogicConcept.fromPutdown( '(some thing , (what a thing))' )[0]
        expect( CC.satisfied() ).to.equal( true )
        expect( CC.violated() ).to.equal( false )
        // b occurs free in f, which implies not satisfied, but b is a
        // metavariable, so the issue is not decided
        b = new Symbol( 'thing' ).asA( metavariable )
        f = new Symbol( 'temp' )
        CC = new CaptureConstraint( b, f )
        CC.free = new Application( new Symbol( 'some' ), b.copy() )
        expect( CC.satisfied() ).to.be.undefined
        expect( CC.violated() ).to.equal( false )
        // b occurs bound in f, and does not occur free in f, which implies
        // satisfied, but b is a metavariable, so the issue is not decided
        b = new Symbol( 'thing' ).asA( metavariable )
        f = new Symbol( 'temp' )
        CC = new CaptureConstraint( b, f )
        CC.free = new Binding( new Symbol( 'some' ), b.copy(), new Application(
            new Symbol( 'what' ), new Symbol( 'a' ), b.copy() ) )
        expect( CC.satisfied() ).to.be.undefined
        expect( CC.violated() ).to.equal( false )
    } )

} )
