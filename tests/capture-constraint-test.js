
import { Application } from '../src/application.js'
import { Binding } from '../src/binding.js'
import { Constraint } from '../src/matching/constraint.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Symbol } from '../src/symbol.js'
import M from '../src/matching.js'

describe( 'Capture Constraints', () => {

    it( 'Should declare the correct global identifiers', () => {
        expect( M.CaptureConstraint ).to.be.ok
    } )

    it( 'Should let us construct instances and query their members', () => {
        let CC, b, f
        // one that we can construct
        b = new Symbol( 'bound' )
        f = new Symbol( 'free' )
        expect( () => CC = new M.CaptureConstraint( b, f ) ).not.to.throw()
        expect( CC.bound ).to.equal( b )
        expect( CC.free ).to.equal( f )
        // one that we cannot construct
        b = LogicConcept.fromPutdown( '(a b c)' )[0]
        f = new Symbol( 'free' )
        expect( () => CC = new M.CaptureConstraint( b, f ) ).to.throw(
            /can only be constructed from two Symbols/ )
        // another that we cannot construct
        b = new Symbol( 'bound' )
        f = new Symbol( '(∀ x , (= x x))' )[0]
        expect( () => CC = new M.CaptureConstraint( b, f ) ).to.throw(
            /can only be constructed from two Symbols/ )
        // a final one that we cannot construct
        b = LogicConcept.fromPutdown( '(a b c)' )[0]
        f = new Symbol( '(∀ x , (= x x))' )[0]
        expect( () => CC = new M.CaptureConstraint( b, f ) ).to.throw(
            /can only be constructed from two Symbols/ )
    } )

    it( 'Should let us make copies and compare for equality', () => {
        let CC, b, f
        // construct a baseline for comparison
        b = new Symbol( 'X' )
        f = new Symbol( 'Y' )
        expect( () => CC = new M.CaptureConstraint( b, f ) ).not.to.throw()
        expect( CC.bound ).to.equal( b )
        expect( CC.free ).to.equal( f )
        // make a shallow copy and verify it behaves as it ought to
        let copy = CC.copy()
        expect( copy.bound ).to.equal( b )
        expect( copy.free ).to.equal( f )
        expect( copy.equals( CC ) ).to.equal( true )
        // make a deep copy and verify it behaves as it ought to
        let copy2 = new M.CaptureConstraint( b.copy(), f.copy() )
        expect( copy2.bound ).not.to.equal( b )
        expect( copy2.free ).not.to.equal( f )
        expect( copy2.bound.equals( b ) ).to.equal( true )
        expect( copy2.free.equals( f ) ).to.equal( true )
        expect( copy2.equals( CC ) ).to.equal( true )
        // make some totally different ones and verify they're not equal to those
        let notCopy1 = new M.CaptureConstraint( new Symbol( 'x' ), f )
        let notCopy2 = new M.CaptureConstraint( b, new Symbol( 'y' ) )
        let notCopy3 = new M.CaptureConstraint( new Symbol( 'x' ), new Symbol( 'y' ) )
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
        CC = new M.CaptureConstraint(
            new Symbol( 'not a metavariable' ),
            new Symbol( 'also not a metavariable' )
        )
        expect( CC.complete() ).to.equal( true )
        CC = new M.CaptureConstraint(
            new Symbol( 'ooh, a metavariable' ).asA( M.metavariable ),
            new Symbol( 'also not a metavariable' )
        )
        expect( CC.complete() ).to.equal( false )
        CC = new M.CaptureConstraint(
            new Symbol( 'not a metavariable' ),
            new Symbol( 'this one is a metavariable' ).asA( M.metavariable )
        )
        expect( CC.complete() ).to.equal( false )
        CC = new M.CaptureConstraint(
            new Symbol( 'ooh, a metavariable' ).asA( M.metavariable ),
            new Symbol( 'this one is a metavariable' ).asA( M.metavariable )
        )
        expect( CC.complete() ).to.equal( false )
    } )

    it( 'Should know when an instance is satisfied/violated', () => {
        let CC, b, f
        // b occurs free in f, which implies not satisfied, and neither is a
        // metavariable, so the issue is decided
        b = new Symbol( 'thing' )
        f = new Symbol( 'temp' )
        CC = new M.CaptureConstraint( b, f )
        CC.free = LogicConcept.fromPutdown( '(some thing)' )[0]
        expect( CC.satisfied() ).to.equal( false )
        expect( CC.violated() ).to.equal( true )
        // b occurs bound in f, and does not occur free in f, which implies
        // satisfied, and neither is a metavariable, so the issue is decided
        b = new Symbol( 'thing' )
        f = new Symbol( 'temp' )
        CC = new M.CaptureConstraint( b, f )
        CC.free = LogicConcept.fromPutdown( '(some thing , (what a thing))' )[0]
        expect( CC.satisfied() ).to.equal( true )
        expect( CC.violated() ).to.equal( false )
        // b occurs free in f, which implies not satisfied, but b is a
        // metavariable, so the issue is not decided
        b = new Symbol( 'thing' ).asA( M.metavariable )
        f = new Symbol( 'temp' )
        CC = new M.CaptureConstraint( b, f )
        CC.free = new Application( new Symbol( 'some' ), b.copy() )
        expect( CC.satisfied() ).to.be.undefined
        expect( CC.violated() ).to.equal( false )
        // b occurs bound in f, and does not occur free in f, which implies
        // satisfied, but b is a metavariable, so the issue is not decided
        b = new Symbol( 'thing' ).asA( M.metavariable )
        f = new Symbol( 'temp' )
        CC = new M.CaptureConstraint( b, f )
        CC.free = new Binding( new Symbol( 'some' ), b.copy(), new Application(
            new Symbol( 'what' ), new Symbol( 'a' ), b.copy() ) )
        expect( CC.satisfied() ).to.be.undefined
        expect( CC.violated() ).to.equal( false )
    } )

    it( 'Should let us apply Constraints to it', () => {
        let C, CC, b, f, result

        // Case 1:
        b = new Symbol( 'thing' ).asA( M.metavariable )
        f = new Symbol( 'temp' ).asA( M.metavariable )
        CC = new M.CaptureConstraint( b, f )
        C = new Constraint( b, LogicConcept.fromPutdown( '"ho ho ho"' )[0] )
        // try appliedTo() in this case
        expect( () => result = C.appliedTo( CC ) ).not.to.throw()
        // ensure that CC has not changed
        expect( CC.bound ).to.equal( b )
        expect( CC.free ).to.equal( f )
        // ensure that the result had C applied to it
        expect( result.bound.equals( C.expression ) ).to.equal( true )
        expect( result.bound ).not.to.equal( C.expression )
        expect( result.free.equals( f ) ).to.equal( true )
        // try applyTo() in this case
        expect( () => C.applyTo( CC ) ).not.to.throw()
        // ensure that CC has changed
        expect( CC.bound.equals( C.expression ) ).to.equal( true )
        expect( CC.bound ).not.to.equal( C.expression )
        expect( CC.free.equals( f ) ).to.equal( true )

        // Case 2:
        b = new Symbol( 'thing' ).asA( M.metavariable )
        f = new Symbol( 'temp' ).asA( M.metavariable )
        CC = new M.CaptureConstraint( b, f )
        C = new Constraint( f, LogicConcept.fromPutdown( '((1 2) 3)' )[0] )
        // try appliedTo() in this case
        expect( () => result = C.appliedTo( CC ) ).not.to.throw()
        // ensure that CC has not changed
        expect( CC.bound ).to.equal( b )
        expect( CC.free ).to.equal( f )
        // ensure that the result had C applied to it
        expect( result.bound.equals( b ) ).to.equal( true )
        expect( result.free.equals( C.expression ) ).to.equal( true )
        expect( result.free ).not.to.equal( C.expression )
        // try applyTo() in this case
        expect( () => C.applyTo( CC ) ).not.to.throw()
        // ensure that CC has changed
        expect( CC.bound.equals( b ) ).to.equal( true )
        expect( CC.free.equals( C.expression ) ).to.equal( true )
        expect( CC.free ).not.to.equal( C.expression )
     } )

} )

describe( 'Capture Constraint sets', () => {

    it( 'Should declare the correct global identifiers', () => {
        expect( M.CaptureConstraints ).to.be.ok
    } )

    it( 'Should let us construct empty instances', () => {
        let C
        expect( () => C = new M.CaptureConstraints() ).not.to.throw()
        expect( C.empty() ).to.equal( true )
    } )

    it( 'Should correctly construct instances from capture constraints', () => {
        // Note: This function also indirectly tests CaptureConstraints.add()

        // use 3 constraints, but one is redundant, so the set will have only 2
        let ccon1, ccon2, ccon3, C
        ccon1 = new M.CaptureConstraint( new Symbol( 'x' ), new Symbol( 'y' ) )
        ccon2 = new M.CaptureConstraint( new Symbol( 'a' ), new Symbol( 'y' ) )
        ccon3 = new M.CaptureConstraint( new Symbol( 'x' ), new Symbol( 'y' ) )
        expect( () => C = new M.CaptureConstraints( ccon1, ccon2, ccon3 ) )
            .not.to.throw()
        expect( C.empty() ).to.equal( false )
        expect( C.constraints.length ).to.equal( 2 )
        expect( C.constraints[0].equals( ccon1 ) ).to.equal( true )
        expect( C.constraints[1].equals( ccon2 ) ).to.equal( true )
    } )

    it( 'Should correctly construct instances from patterns', () => {
        // Note: This function also indirectly tests CaptureConstraints.add()
        // and CaptureConstraints.scan()

        let pat1, pat2, C
        pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        pat1.child( 1 ).makeIntoA( M.metavariable ) // outer x
        pat1.index( [ 2, 2, 1, 1 ] ).makeIntoA( M.metavariable ) // inner x
        pat2 = new Symbol( 'foo' ).makeIntoA( M.metavariable )
        expect( () => C = new M.CaptureConstraints( pat1, pat2 ) )
            .not.to.throw()
        expect( C.empty() ).to.equal( false )
        expect( C.constraints.length ).to.equal( 4 )
        expect( C.constraints[0].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '∃' )
        ) ) ).to.equal( true )
        expect( C.constraints[1].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '=' )
        ) ) ).to.equal( true )
        expect( C.constraints[2].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '+' )
        ) ) ).to.equal( true )
        expect( C.constraints[3].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '1' )
        ) ) ).to.equal( true )
    } )

    it( 'Should correctly construct instances from Constraints', () => {
        // Note: This function also indirectly tests CaptureConstraints.add()
        // and CaptureConstraints.scan()
        
        let con1, con2, C
        con1 = new Constraint(
            LogicConcept.fromPutdown( '(∀ x , (= (+ x 1) y))' )[0],
            LogicConcept.fromPutdown( '(Happy Halloween)' )[0]
        )
        con1.pattern.child( 1 ).makeIntoA( M.metavariable ) // outer x
        con1.pattern.index( [ 2, 1, 1 ] ).makeIntoA( M.metavariable ) // inner x
        con2 = new Constraint(
            new Symbol( 'foo' ).makeIntoA( M.metavariable ),
            new Symbol( 'bar' )
        )
        expect( () => C = new M.CaptureConstraints( con1, con2 ) ).not.to.throw()
        expect( C.empty() ).to.equal( false )
        expect( C.constraints.length ).to.equal( 4 )
        expect( C.constraints[0].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '=' )
        ) ) ).to.equal( true )
        expect( C.constraints[1].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '+' )
        ) ) ).to.equal( true )
        expect( C.constraints[2].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '1' )
        ) ) ).to.equal( true )
        expect( C.constraints[3].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( 'y' )
        ) ) ).to.equal( true )
    } )

    it( 'Should be able to make shallow copies', () => {
        // recreate the constraint set from an earlier test
        let ccon1, ccon2, ccon3, C
        ccon1 = new M.CaptureConstraint( new Symbol( 'x' ), new Symbol( 'y' ) )
        ccon2 = new M.CaptureConstraint( new Symbol( 'a' ), new Symbol( 'y' ) )
        ccon3 = new M.CaptureConstraint( new Symbol( 'x' ), new Symbol( 'y' ) )
        expect( () => C = new M.CaptureConstraints( ccon1, ccon2, ccon3 ) )
            .not.to.throw()
        expect( C.empty() ).to.equal( false )
        expect( C.constraints.length ).to.equal( 2 )
        expect( C.constraints[0].equals( ccon1 ) ).to.equal( true )
        expect( C.constraints[1].equals( ccon2 ) ).to.equal( true )
        // make a copy and test various properties
        let Ccopy
        expect( () => Ccopy = C.copy() ).not.to.throw()
        expect( Ccopy.constraints.length ).to.equal( C.constraints.length )
        expect( Ccopy.constraints.length ).to.equal( 2 )
        expect( Ccopy.constraints[0].equals( C.constraints[0] ) ).to.equal( true )
        expect( Ccopy.constraints[1].equals( C.constraints[1] ) ).to.equal( true )
        expect( C ).not.to.equal( Ccopy )
        expect( C.constraints ).not.to.equal( Ccopy.constraints )
    } )

    it( 'Should correctly judge sets as satisfied and/or violated', () => {
        let C
        // make a set that is satisfied, not violated
        C = new M.CaptureConstraints(
            new M.CaptureConstraint( new Symbol( 1 ), new Symbol( 2 ) ),
            new M.CaptureConstraint( new Symbol( 3 ), new Symbol( 4 ) )
        )
        expect( C.satisfied() ).to.equal( true )
        expect( C.violated() ).to.equal( false )
        // make a set that is violated, not satisfied
        C = new M.CaptureConstraints(
            new M.CaptureConstraint( new Symbol( 1 ), new Symbol( 2 ) ),
            new M.CaptureConstraint( new Symbol( 3 ), new Symbol( 4 ) )
        )
        C.constraints[0].free = LogicConcept.fromPutdown( '(f 1)' )[0]
        expect( C.satisfied() ).to.equal( false )
        expect( C.violated() ).to.equal( true )
    } )

    it( 'Should correctly simplify instances', () => {
        let C
        // make a set that is all removable constraints
        C = new M.CaptureConstraints(
            new M.CaptureConstraint( new Symbol( 1 ), new Symbol( 2 ) ),
            new M.CaptureConstraint( new Symbol( 3 ), new Symbol( 4 ) )
        )
        expect( C.constraints.length ).to.equal( 2 )
        expect( () => C.simplify() ).not.to.throw()
        expect( C.constraints.length ).to.equal( 0 )
        // make a set with one removable constraint, and one not because it is
        // violated
        C = new M.CaptureConstraints(
            new M.CaptureConstraint( new Symbol( 1 ), new Symbol( 2 ) ),
            new M.CaptureConstraint( new Symbol( 3 ), new Symbol( 4 ) )
        )
        C.constraints[0].free = LogicConcept.fromPutdown( '(f 1)' )[0]
        expect( C.constraints.length ).to.equal( 2 )
        expect( () => C.simplify() ).not.to.throw()
        expect( C.constraints.length ).to.equal( 1 )
        expect( C.violated() ).to.equal( true )
        expect( C.satisfied() ).to.equal( false )
        // make a set with one removable constraint, and one not because it is
        // incomplete
        C = new M.CaptureConstraints(
            new M.CaptureConstraint( new Symbol( 1 ), new Symbol( 2 ) ),
            new M.CaptureConstraint( new Symbol( 3 ).asA( M.metavariable ),
                                     new Symbol( 4 ) )
        )
        expect( C.constraints.length ).to.equal( 2 )
        expect( () => C.simplify() ).not.to.throw()
        expect( C.constraints.length ).to.equal( 1 )
        expect( C.violated() ).to.equal( false )
        expect( C.satisfied() ).to.equal( false )
        // now instantiate that constraint with something that doesn't violate
        // it, and ensure that simplifying again removes it
        C.constraints[0].bound = new Symbol( 'and we are good' )
        expect( C.constraints.length ).to.equal( 1 )
        expect( () => C.simplify() ).not.to.throw()
        expect( C.constraints.length ).to.equal( 0 )
        expect( C.violated() ).to.equal( false )
        expect( C.satisfied() ).to.equal( true )
    } )

} )
