
import { Symbol } from '../src/symbol.js'
import { Application } from '../src/application.js'
import { Binding } from '../src/binding.js'
import { Environment } from '../src/environment.js'
import { LogicConcept } from '../src/logic-concept.js'
import M from '../src/matching.js'

describe( 'Substitution', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( M.Substitution ).to.be.ok
    } )

    it( 'Should let us construct only well-formed Substitutions', () => {
        // if the first argument is a metavariable, everything is fine
        let e1, e2, S
        ;[ e1, e2 ] = LogicConcept.fromPutdown( `
            (+ 1 2)
            (forall n , (= (* n m) (* m n)))
        ` )
        let m1 = new Symbol( 'meta1' ).makeIntoA( M.metavariable )
        let m2 = new Symbol( 'another mv' ).makeIntoA( M.metavariable )
        expect( () => S = new M.Substitution( m1, e1 ) ).not.to.throw()
        expect( S ).to.be.instanceOf( M.Substitution )
        // in here, we also test the getters for metavar and expression, briefly
        expect( S.metavariable ).to.equal( m1 )
        expect( S.expression ).to.equal ( e1 )
        // repeat similar version of same test
        expect( () => S = new M.Substitution( m2, e2 ) ).not.to.throw()
        expect( S ).to.be.instanceOf( M.Substitution )
        expect( S.metavariable ).to.equal( m2 )
        expect( S.expression ).to.equal ( e2 )
        // if the first argument is anything besides a metavariable, then errors
        expect( () => S = new M.Substitution( e1, m1 ) ).to.throw(
            /must be a metavariable/ )
        expect( () => S = new M.Substitution( e2, m2 ) ).to.throw(
            /must be a metavariable/ )
        expect( () => S = new M.Substitution( e1, e2 ) ).to.throw(
            /must be a metavariable/ )
    } )

    it( 'Should support making deep copies', () => {
        // Construct one of the Substitutions we made in the previous test
        let e1, e2, S
        ;[ e1, e2 ] = LogicConcept.fromPutdown( `
            (+ 1 2)
            (forall n , (= (* n m) (* m n)))
        ` )
        let m1 = new Symbol( 'meta1' ).asA( M.metavariable )
        let m2 = new Symbol( 'another mv' ).asA( M.metavariable )
        expect( () => S = new M.Substitution( m1, e1 ) ).not.to.throw()
        expect( S ).to.be.instanceOf( M.Substitution )
        // make a copy and ensure it throws no errors
        let copy
        expect( () => copy = S.copy() ).not.to.throw()
        // ensure that it has the same metavariable and expression as the
        // original, but that they are not the exact same objects
        expect( S.metavariable.equals( copy.metavariable ) ).to.equal( true )
        expect( S.expression.equals( copy.expression ) ).to.equal( true )
        expect( S.metavariable ).not.to.equal( copy.metavariable )
        expect( S.expression ).not.to.equal( copy.expression )
        // and of course the new S should not be the same object as the copy
        expect( S ).not.to.equal( copy )
    } )

    it( 'Should correctly compute equality for two instances', () => {
        // a Substitution is equal to one that looks exactly the same
        expect( new M.Substitution(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ).equals( new M.Substitution(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ) ) ).to.equal( true )
        // two Substitutions are not equal if their metavariables differ
        expect( new M.Substitution(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ).equals( new M.Substitution(
            new Symbol( 'Y' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ) ) ).to.equal( false )
        // two Substitutions are not equal if their expressions differ
        expect( new M.Substitution(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ).equals( new M.Substitution(
            new Symbol( 'X' ).asA( M.metavariable ),
            new Symbol( 'y' )
        ) ) ).to.equal( false )
        // two Substitutions are not equal if both parts differ
        expect( new M.Substitution(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ).equals( new M.Substitution(
            new Symbol( 'Y' ).asA( M.metavariable ),
            new Symbol( 'y' )
        ) ) ).to.equal( false )
        // a Substitution is equal to a copy of itself
        let S = new M.Substitution(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        )
        expect( S.equals( S.copy() ) ).to.equal( true )
    } )

    it( 'Should apply itself correctly in-place or functionally', () => {
        // create a Substitution
        let X = new Symbol( 'X' ).asA( M.metavariable )
        let S = new M.Substitution(
            X.copy(),
            LogicConcept.fromPutdown( '(exp (- x))' )[0]
        )
        // create three patterns to which to apply it, and copies of each
        let P1 = new Application( new Symbol( 'f' ), X.copy() )
        let P2 = new Binding( new Symbol( '𝝺' ), new Symbol( 'v' ),
            new Application( X.copy(), new Symbol( 'v' ) ) )
        let P3 = new Environment( X.copy(), X.copy(), X.copy() )
        const P1copy = P1.copy()
        const P2copy = P2.copy()
        const P3copy = P3.copy()
        expect( P1.equals( P1copy ) ).to.equal( true )
        expect( P2.equals( P2copy ) ).to.equal( true )
        expect( P3.equals( P3copy ) ).to.equal( true )
        // create expected results after applying the Substitution
        const newP1 = LogicConcept.fromPutdown( '(f (exp (- x)))' )[0]
        const newP2 = LogicConcept.fromPutdown( '(𝝺 v , ((exp (- x)) v))' )[0]
        const newP3 = LogicConcept.fromPutdown(
            '{ (exp (- x)) (exp (- x)) (exp (- x)) }' )[0]
        // apply S to P1 in place and ensure the result is as expected
        // and P1 is no longer equal to P1copy
        expect( () => S.applyTo( P1 ) ).not.to.throw()
        expect( P1.equals( P1copy ) ).to.equal( false )
        expect( P1.equals( newP1 ) ).to.equal( true )
        // repeat same experiment for P2 and P2copy
        expect( () => S.applyTo( P2 ) ).not.to.throw()
        expect( P2.equals( P2copy ) ).to.equal( false )
        expect( P2.equals( newP2 ) ).to.equal( true )
        // repeat same experiment for P3 and P3copy
        expect( () => S.applyTo( P3 ) ).not.to.throw()
        expect( P3.equals( P3copy ) ).to.equal( false )
        expect( P3.equals( newP3 ) ).to.equal( true )
        // make new targets from the backup copies we saved of P1,P2,P3
        let P1_2 = P1copy.copy()
        let P2_2 = P2copy.copy()
        let P3_2 = P3copy.copy()
        // apply S functionally (not in place) to those three, saving the
        // results as new expressions, then ensure that no change took place
        // in any of those originals
        const applied1 = S.appliedTo( P1_2 )
        const applied2 = S.appliedTo( P2_2 )
        const applied3 = S.appliedTo( P3_2 )
        expect( P1copy.equals( P1_2 ) ).to.equal( true )
        expect( P2copy.equals( P2_2 ) ).to.equal( true )
        expect( P3copy.equals( P3_2 ) ).to.equal( true )
        // then ensure that the results computed this way are the same as the
        // results computed with the in-place applyTo(), which were verified
        // above to be correct
        expect( applied1.equals( P1 ) ).to.equal( true )
        expect( applied2.equals( P2 ) ).to.equal( true )
        expect( applied3.equals( P3 ) ).to.equal( true )
    } )

} )
