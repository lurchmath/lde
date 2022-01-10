
import { Symbol } from '../src/symbol.js'
import { LogicConcept } from '../src/logic-concept.js'
import M from '../src/matching.js'

describe( 'Solution', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( M.Solution ).to.be.ok
    } )

    it( 'Should refuse to construct Solutions from non-Problems', () => {
        expect( () => new M.Solution() ).to.throw( /requires a Problem/ )
        expect( () => new M.Solution( 3 ) ).to.throw( /requires a Problem/ )
        expect( () => new M.Solution(
            LogicConcept.fromPutdown( '(f x)' )[0] )
        ).to.throw( /requires a Problem/ )
    } )

    it( 'Should do minimal construction if we set skip = true', () => {
        const P1 = new M.Problem()
        let S
        expect( () => S = new M.Solution( P1, true ) ).not.to.throw()
        expect( S._problem ).to.equal( P1 )
        expect( JSON.equals( S._substitutions, {} ) ).to.equal( true )
        expect( S.hasOwnProperty( '_captureConstraints' ) ).to.equal( false )
        expect( S.hasOwnProperty( '_metavariables' ) ).to.equal( false )
        expect( S.hasOwnProperty( '_bound' ) ).to.equal( false )
        const P2 = new M.Problem( new M.Constraint(
            LogicConcept.fromPutdown( '(= (+ 1 1) 2)' )[0],
            LogicConcept.fromPutdown( '(= (+ 1 1) 2)' )[0]
        ) )
        expect( () => S = new M.Solution( P2, true ) ).not.to.throw()
        expect( S._problem ).to.equal( P2 )
        expect( JSON.equals( S._substitutions, {} ) ).to.equal( true )
        expect( S.hasOwnProperty( '_captureConstraints' ) ).to.equal( false )
        expect( S.hasOwnProperty( '_metavariables' ) ).to.equal( false )
        expect( S.hasOwnProperty( '_bound' ) ).to.equal( false )
    } )

    it( 'Should correctly construct Solutions from Problems', () => {
        // Construct a problem containing two Constraints
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        pat1.child( 1 ).makeIntoA( M.metavariable ) // outer x
        pat1.index( [ 2, 2, 1, 1 ] ).makeIntoA( M.metavariable ) // inner x
        const pat2 = new Symbol( 'foo' ).asA( M.metavariable )
        const C1 = new M.Constraint(
            pat1,
            LogicConcept.fromPutdown( '(∀ t , (∃ y , (= (+ t 1) y)))' )[0]
        )
        const C2 = new M.Constraint(
            pat2,
            LogicConcept.fromPutdown( '(larger thing but not too large)' )[0]
        )
        const P = new M.Problem( C1, C2 )
        // Create a solution for this problem and ensure that it worked
        let S
        expect( () => S = new M.Solution( P ) ).not.to.throw()
        expect( S._problem ).to.equal( P )
        expect( JSON.equals( S._substitutions, {} ) ).to.equal( true )
        // Now ensure that it computed the correct set of capture constraints
        expect( S._captureConstraints )
            .to.be.instanceof( M.CaptureConstraints )
        expect( S._captureConstraints.empty() ).to.equal( false )
        expect( S._captureConstraints.constraints.length ).to.equal( 5 )
        expect( S._captureConstraints.constraints[0].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '∃' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[1].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '=' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[2].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '+' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[3].equals(
            new M.CaptureConstraint(
                new Symbol( 'y' ), new Symbol( 'x' ).asA( M.metavariable )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[4].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '1' )
            )
        ) ).to.equal( true )
        // Now ensure that it computed the correct set of metavariables
        expect( S._metavariables ).to.be.instanceof( Set )
        expect( S._metavariables.size ).to.equal( 2 )
        expect( S._metavariables.has( 'x' ) ).to.equal( true )
        expect( S._metavariables.has( 'foo' ) ).to.equal( true )
        // Now ensure that it computed the correct set of bound metavariables
        expect( S._bound ).to.be.instanceof( Set )
        expect( S._bound.size ).to.equal( 1 )
        expect( S._bound.has( 'x' ) ).to.equal( true )

        // Now do the degenerate case--an empty problem has no capture
        // constraints, but still caches that value
        const emptyP = new M.Problem()
        // Create a solution for this problem and ensure that it worked
        expect( () => S = new M.Solution( emptyP ) ).not.to.throw()
        expect( S._problem ).to.equal( emptyP )
        expect( JSON.equals( S._substitutions, {} ) ).to.equal( true )
        // Now ensure that it computed the correct set of capture constraints
        expect( S._captureConstraints )
            .to.be.instanceof( M.CaptureConstraints )
        expect( S._captureConstraints.empty() ).to.equal( true )
        // Now ensure that it computed the correct set of metavariables
        expect( S._metavariables ).to.be.instanceof( Set )
        expect( S._metavariables.size ).to.equal( 0 )
        // Now ensure that it computed the correct set of metavariables
        expect( S._bound ).to.be.instanceof( Set )
        expect( S._bound.size ).to.equal( 0 )
    } )

    it( 'Should make partially-deep copies', () => {
        // Construct a problem containing the same two Constraints as in the
        // previous test, and then a solution from it, as before.
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        pat1.child( 1 ).makeIntoA( M.metavariable ) // outer x
        pat1.index( [ 2, 2, 1, 1 ] ).makeIntoA( M.metavariable ) // inner x
        const pat2 = new Symbol( 'foo' ).asA( M.metavariable )
        const C1 = new M.Constraint(
            pat1,
            LogicConcept.fromPutdown( '(∀ t , (∃ y , (= (+ t 1) y)))' )[0]
        )
        const C2 = new M.Constraint(
            pat2,
            LogicConcept.fromPutdown( '(larger thing but not too large)' )[0]
        )
        const P = new M.Problem( C1, C2 )
        let S1, S2
        S1 = new M.Solution( P )
        // Now make a copy of S1 and ensure that doesn't throw an error.
        expect( () => S2 = S1.copy() ).not.to.throw()
        // Do they have the same problem instance?  They should.
        expect( S1._problem ).equals( S2._problem )
        // Do they have the same metavariable set?  They should.
        expect( S1._metavariables ).equals( S2._metavariables )
        // Do they have the same bound metavariable set?  They should.
        expect( S1._bound ).equals( S2._bound )
        // Do they have the same capture constraint set?  It should be the
        // same set contents, but a different set instance.
        expect( S1._captureConstraints )
            .to.be.instanceof( M.CaptureConstraints )
        expect( S2._captureConstraints )
            .to.be.instanceof( M.CaptureConstraints )
        expect( S1._captureConstraints ).not.equals( S2._captureConstraints )
        expect( S1._captureConstraints.constraints.length ).equals( 5 )
        expect( S2._captureConstraints.constraints.length ).equals( 5 )
        expect( S1._captureConstraints.constraints[0].equals(
            S2._captureConstraints.constraints[0] ) ).to.equal( true )
        expect( S1._captureConstraints.constraints[1].equals(
            S2._captureConstraints.constraints[1] ) ).to.equal( true )
        expect( S1._captureConstraints.constraints[2].equals(
            S2._captureConstraints.constraints[2] ) ).to.equal( true )
        expect( S1._captureConstraints.constraints[3].equals(
            S2._captureConstraints.constraints[3] ) ).to.equal( true )
        expect( S1._captureConstraints.constraints[4].equals(
            S2._captureConstraints.constraints[4] ) ).to.equal( true )
        // Do they have the same substitutions?  We cannot test that at this
        // point, because we haven't yet implemented adding substitutions to a
        // Solution, but we will test that in the future (TO DO!).

        // Repeat the above test with an empty problem also.
        const emptyP = new M.Problem()
        S1 = new M.Solution( emptyP )
        expect( () => S2 = S1.copy() ).not.to.throw()
        expect( S1._problem ).equals( S2._problem )
        expect( S1._metavariables ).equals( S2._metavariables )
        expect( S1._bound ).equals( S2._bound )
        expect( S1._captureConstraints )
            .to.be.instanceof( M.CaptureConstraints )
        expect( S2._captureConstraints )
            .to.be.instanceof( M.CaptureConstraints )
        expect( S1._captureConstraints ).not.equals( S2._captureConstraints )
        expect( S1._captureConstraints.empty() ).to.equal( true )
        expect( S2._captureConstraints.empty() ).to.equal( true )
        // Do they have the same substitutions?  We cannot test that at this
        // point, because we haven't yet implemented adding substitutions to a
        // Solution, but we will test that in the future (TO DO!).
    } )

    it( 'Should correctly tell us when we can add Substitutions', () => {
        // Construct a problem containing the same two Constraints as in the
        // previous test, and then a solution from it, as before.
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        pat1.child( 1 ).makeIntoA( M.metavariable ) // outer x
        pat1.index( [ 2, 2, 1, 1 ] ).makeIntoA( M.metavariable ) // inner x
        const pat2 = new Symbol( 'foo' ).asA( M.metavariable )
        const C1 = new M.Constraint(
            pat1,
            LogicConcept.fromPutdown( '(∀ t , (∃ y , (= (+ t 1) y)))' )[0]
        )
        const C2 = new M.Constraint(
            pat2,
            LogicConcept.fromPutdown( '(larger thing but not too large)' )[0]
        )
        const P = new M.Problem( C1, C2 )
        const S = new M.Solution( P )
        // Try to add a Substitution that violates rule #1: the metavariable is
        // already mapped to something else.
        S._substitutions['foo'] = new M.Substitution(
            new Symbol( 'foo' ).asA( M.metavariable ),
            new Symbol( 'bar' )
        )
        let sub = new M.Substitution(
            new Symbol( 'foo' ).asA( M.metavariable ),
            new Symbol( 'baz' )
        )
        expect( S.canAdd( sub ) ).equals( false )
        expect( () => S.add( sub ) ).to.throw( /Adding an invalid Subst/ )
        delete S._substitutions['foo'] // cleanup
        // Try to add a Substitution that violates rule #2: replacing a bound
        // metavariable with a non-variable.
        sub = new M.Substitution(
            new Symbol( 'x' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(not atomic)' )[0]
        )
        expect( S.canAdd( sub ) ).equals( false )
        expect( () => S.add( sub ) ).to.throw( /Adding an invalid Subst/ )
        // Try to add a Substitution that violates rule #3: violating variable
        // capture constraints
        sub = new M.Substitution(
            new Symbol( 'x' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( 'y' )[0]
        )
        expect( S.canAdd( sub ) ).equals( false )
        expect( () => S.add( sub ) ).to.throw( /Adding an invalid Subst/ )
        // Try to add Substitutions that violate none of the 3 rules.
        expect( S.canAdd( new M.Substitution(
            new Symbol( 'x' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( 'this_should_work' )[0]
        ) ) ).equals( true )
        sub = new M.Substitution(
            new Symbol( 'foo' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( 'baz' )[0] // since we did cleanup above
        )
        expect( S.canAdd( sub ) ).equals( true )
        expect( () => S.add( sub ) ).not.to.throw()
    } )

    it( 'Should support adding new Substitutions to its collection', () => {
        // Construct a problem containing the same two Constraints as in the
        // previous test, and then a solution from it, as before.
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        pat1.child( 1 ).makeIntoA( M.metavariable ) // outer x
        pat1.index( [ 2, 2, 1, 1 ] ).makeIntoA( M.metavariable ) // inner x
        const pat2 = new Symbol( 'foo' ).asA( M.metavariable )
        const C1 = new M.Constraint(
            pat1,
            LogicConcept.fromPutdown( '(∀ t , (∃ y , (= (+ t 1) y)))' )[0]
        )
        const C2 = new M.Constraint(
            pat2,
            LogicConcept.fromPutdown( '(larger thing but not too large)' )[0]
        )
        const P = new M.Problem( C1, C2 )
        const S = new M.Solution( P )
        // Verify initial state:
        //  - The domain is the empty set
        //  - Looking up any metavariable yields undefined
        //  - Capture constraints are the 5 we tested earlier
        expect( S.domain() ).to.be.instanceOf( Set )
        expect( S.domain().size ).to.equal( 0 )
        expect( S.get( 'foo' ) ).to.be.undefined
        expect( S.get( 'x' ) ).to.be.undefined
        expect( S.get( 'y' ) ).to.be.undefined
        expect( S._captureConstraints.constraints.length ).to.equal( 5 )
        expect( S._captureConstraints.constraints[0].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '∃' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[1].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '=' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[2].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '+' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[3].equals(
            new M.CaptureConstraint(
                new Symbol( 'y' ), new Symbol( 'x' ).asA( M.metavariable )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[4].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '1' )
            )
        ) ).to.equal( true )
        // Now add a Substitution to the Solution; verify that it's allowed.
        // This substitution is the one required by constraint C2:
        // foo -> (larger thing but not too large)
        expect( () =>
            S.add( new M.Substitution( pat2, C2.expression.copy() ) )
        ).not.to.throw()
        // Verify the new state:
        //  - The domain is { foo }
        //  - Looking up any metavariable other than foo gives undefined
        //  - Looking up foo yields C2.expression.copy()
        //  - Capture constraints are unchanged, because none mentions foo
        expect( S.domain() ).to.be.instanceOf( Set )
        expect( S.domain().size ).to.equal( 1 )
        expect( S.domain().has( 'foo' ) ).to.equal( true )
        expect( S.get( 'foo' ) ).to.be.instanceOf( LogicConcept )
        expect( S.get( 'foo' ).equals( C2.expression ) ).to.equal( true )
        expect( S.get( 'x' ) ).to.be.undefined
        expect( S.get( 'y' ) ).to.be.undefined
        expect( S._captureConstraints.constraints.length ).to.equal( 5 )
        expect( S._captureConstraints.constraints[0].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '∃' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[1].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '=' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[2].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '+' )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[3].equals(
            new M.CaptureConstraint(
                new Symbol( 'y' ), new Symbol( 'x' ).asA( M.metavariable )
            )
        ) ).to.equal( true )
        expect( S._captureConstraints.constraints[4].equals(
            new M.CaptureConstraint(
                new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '1' )
            )
        ) ).to.equal( true )
        // Now add a Substitution to the Solution; verify that it's allowed.
        // This substitution is the one required by constraint C1: x -> t
        expect( () =>
            S.add( new M.Substitution(
                new Symbol( 'x' ).asA( M.metavariable ),
                new Symbol( 't' )
            ) )
        ).not.to.throw()
        // Verify the new state:
        //  - The domain is { foo, x }
        //  - Looking up any metavariable other than foo, x gives undefined
        //  - Looking up foo yields C2.expression.copy()
        //  - Looking up x yields t
        //  - Capture constraints all deleted, because all satisfied
        expect( S.domain() ).to.be.instanceOf( Set )
        expect( S.domain().size ).to.equal( 2 )
        expect( S.domain().has( 'foo' ) ).to.equal( true )
        expect( S.domain().has( 'x' ) ).to.equal( true )
        expect( S.get( 'foo' ) ).to.be.instanceOf( LogicConcept )
        expect( S.get( 'foo' ).equals( C2.expression ) ).to.equal( true )
        expect( S.get( 'x' ) ).to.be.instanceOf( LogicConcept )
        expect( S.get( 'x' ).equals( new Symbol( 't' ) ) ).to.equal( true )
        expect( S.get( 'y' ) ).to.be.undefined
        expect( S._captureConstraints.constraints.length ).to.equal( 0 )
        // But if we redo all the same stuff as above, except we replace
        // x with y, we should find that an error is throw, because we
        // violate capture constraints.
        const badS = new M.Solution( P )
        expect( () =>
            badS.add( new M.Substitution( pat2, C2.expression.copy() ) )
        ).not.to.throw()
        expect( () =>
            badS.add( new M.Substitution(
                new Symbol( 'x' ).asA( M.metavariable ),
                new Symbol( 'y' )
            ) )
        ).to.throw( /Adding an invalid Substitution/ )
    } )

    it( 'Should support applying Substitutions to it', () => {
        // In this test, we use capital letters for metavariables.
        // Test 1:
        // Create an example Solution: X -> 3, Y -> f(t,Z)
        const emptyP = new M.Problem()
        const S1 = new M.Solution( emptyP )
        S1.add( new M.Substitution(
            new Symbol( 'X' ).asA( M.metavariable ),
            new Symbol( '3' )
        ) )
        let temp = LogicConcept.fromPutdown( '(f t Z)' )[0]
        temp.child( 2 ).makeIntoA( M.metavariable )
        S1.add( new M.Substitution(
            new Symbol( 'Y' ).asA( M.metavariable ),
            temp
        ) )
        // Apply to it the Substitution: Z -> +(W,W)
        temp = LogicConcept.fromPutdown( '(+ W W)' )[0]
        temp.child( 1 ).makeIntoA( M.metavariable )
        temp.child( 2 ).makeIntoA( M.metavariable )
        let sub = new M.Substitution(
            new Symbol( 'Z' ).asA( M.metavariable ),
            temp
        )
        sub.applyTo( S1 )
        expect( S1.get( 'X' ).equals( new Symbol( '3' ) ) ).equals( true )
        temp = LogicConcept.fromPutdown( '(f t (+ W W))' )[0]
        temp.child( 2 ).child( 1 ).makeIntoA( M.metavariable )
        temp.child( 2 ).child( 2 ).makeIntoA( M.metavariable )
        expect( S1.get( 'Y' ).equals( temp ) ).equals( true )
        // Apply to it the Substitution: W -> k
        sub = new M.Substitution(
            new Symbol( 'W' ).asA( M.metavariable ),
            new Symbol( 'k' )
        )
        sub.applyTo( S1 )
        expect( S1.get( 'X' ).equals( new Symbol( '3' ) ) ).equals( true )
        expect( S1.get( 'Y' ).equals(
            LogicConcept.fromPutdown( '(f t (+ k k))' )[0]
        ) ).equals( true )
    } )

} )
