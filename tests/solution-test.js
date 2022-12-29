
import { Symbol as LurchSymbol } from '../src/symbol.js'
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
        expect( S.hasOwnProperty( '_metavariables' ) ).to.equal( false )
        const P2 = new M.Problem( new M.Constraint(
            LogicConcept.fromPutdown( '(= (+ 1 1) 2)' )[0],
            LogicConcept.fromPutdown( '(= (+ 1 1) 2)' )[0]
        ) )
        expect( () => S = new M.Solution( P2, true ) ).not.to.throw()
        expect( S._problem ).to.equal( P2 )
        expect( JSON.equals( S._substitutions, {} ) ).to.equal( true )
        expect( S.hasOwnProperty( '_metavariables' ) ).to.equal( false )
    } )

    it( 'Should correctly construct Solutions from Problems', () => {
        // Construct a problem containing two Constraints
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        const pat2 = new LurchSymbol( 'foo' ).asA( M.metavariable )
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
        try { S = new M.Solution( P ) } catch ( e ) { console.log( e ) }
        expect( () => S = new M.Solution( P ) ).not.to.throw()
        expect( S._problem ).to.equal( P )
        expect( JSON.equals( S._substitutions, {} ) ).to.equal( true )
        // Now ensure that it computed the correct set of metavariables
        expect( S._metavariables ).to.be.instanceof( Set )
        expect( S._metavariables.size ).to.equal( 1 )
        expect( S._metavariables.has( 'foo' ) ).to.equal( true )

        // Now do the degenerate case--an empty problem
        const emptyP = new M.Problem()
        // Create a solution for this problem and ensure that it worked
        expect( () => S = new M.Solution( emptyP ) ).not.to.throw()
        expect( S._problem ).to.equal( emptyP )
        expect( JSON.equals( S._substitutions, {} ) ).to.equal( true )
        // Now ensure that it computed the correct set of metavariables
        expect( S._metavariables ).to.be.instanceof( Set )
        expect( S._metavariables.size ).to.equal( 0 )
    } )

    it( 'Should make partially-deep copies', () => {
        // Construct a problem containing the same two Constraints as in the
        // previous test, and then a solution from it, as before.
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        const pat2 = new LurchSymbol( 'foo' ).asA( M.metavariable )
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
        // Do they have the same substitutions?  In this case, they should
        // both be empty, but we will consider a case below that's nonempty.
        expect( S1.domain().size ).equals( 0 )
        expect( S2.domain().size ).equals( 0 )

        // Repeat the above test with an empty problem but with some
        // substitutions.
        const emptyP = new M.Problem()
        S1 = new M.Solution( emptyP )
        S1.add( new M.Substitution(
            new LurchSymbol( 'one' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '"this is just a string symbol"' )[0]
        ) )
        S1.add( new M.Substitution(
            new LurchSymbol( 'two' ).asA( M.metavariable ),
            LogicConcept.fromPutdown(
                '(sqrt + (^ (- x1 x2) 2) (^ (- y1 y2) 2))' )[0]
        ) )
        expect( () => S2 = S1.copy() ).not.to.throw()
        expect( S1._problem ).equals( S2._problem )
        expect( S1._metavariables ).equals( S2._metavariables )
        expect( S1.domain().size ).equals( 2 )
        expect( S2.domain().size ).equals( 2 )
        expect( S2.domain().has( 'one' ) ).equals( true )
        expect( S2.domain().has( 'two' ) ).equals( true )
        expect( S2.get( 'one' ).equals(
            LogicConcept.fromPutdown( '"this is just a string symbol"' )[0]
        ) ).equals( true )
        expect( S2.get( 'two' ).equals(
            LogicConcept.fromPutdown( '(sqrt + (^ (- x1 x2) 2) (^ (- y1 y2) 2))' )[0]
        ) ).equals( true )
    } )

    it( 'Should correctly compare instances for equality', () => {
        // Create some instances to compare:
        // S1 = an empty solution
        const emptyP = new M.Problem()
        const S1 = new M.Solution( emptyP )
        // S2 = a solution mapping X -> f(y)
        const S2 = new M.Solution( emptyP )
        S2.add( new M.Substitution(
            new LurchSymbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(f y)' )[0]
        ) )
        // S3 = a solution mapping X -> f(z)
        const S3 = new M.Solution( emptyP )
        S3.add( new M.Substitution(
            new LurchSymbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(f z)' )[0]
        ) )
        // S4 = a solution mapping X -> f(y) and Y -> f(y)
        const S4 = new M.Solution( emptyP )
        S4.add( new M.Substitution(
            new LurchSymbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(f y)' )[0]
        ) )
        S4.add( new M.Substitution(
            new LurchSymbol( 'Y' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(f y)' )[0]
        ) )
        // then make several copies
        const S1copy = S1.copy()
        const S2copy = S2.copy()
        const S3copy = S3.copy()
        const S4copy = S4.copy()
        // Now compare for equality in all possible ways among S1,...,S4
        // No two are equal except when comparing a thing to itself.
        expect( S1.equals( S1 ) ).equals( true )
        expect( S2.equals( S1 ) ).equals( false )
        expect( S3.equals( S1 ) ).equals( false )
        expect( S4.equals( S1 ) ).equals( false )
        expect( S1.equals( S2 ) ).equals( false )
        expect( S2.equals( S2 ) ).equals( true )
        expect( S3.equals( S2 ) ).equals( false )
        expect( S4.equals( S2 ) ).equals( false )
        expect( S1.equals( S3 ) ).equals( false )
        expect( S2.equals( S3 ) ).equals( false )
        expect( S3.equals( S3 ) ).equals( true )
        expect( S4.equals( S3 ) ).equals( false )
        expect( S1.equals( S4 ) ).equals( false )
        expect( S2.equals( S4 ) ).equals( false )
        expect( S3.equals( S4 ) ).equals( false )
        expect( S4.equals( S4 ) ).equals( true )
        // Now ensure that each thing is equal to its own copy.
        expect( S1.equals( S1copy ) ).equals( true )
        expect( S2.equals( S2copy ) ).equals( true )
        expect( S3.equals( S3copy ) ).equals( true )
        expect( S4.equals( S4copy ) ).equals( true )
        // And ensure that if we edit some of them, we can make them euqla to
        // others that they weren't originally equal to.
        expect( S4.equals( S2.plus( new M.Substitution(
            new LurchSymbol( 'Y' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(f y)' )[0]
        ) ) ) ).equals( true )
        expect( S2.equals( S1.plus( new M.Substitution(
            new LurchSymbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(f y)' )[0]
        ) ) ) ).equals( true )
    } )

    it( 'Should correctly tell us when we can add Substitutions', () => {
        // Construct a problem containing the same two Constraints as in the
        // previous test, and then a solution from it, as before.
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        const pat2 = new LurchSymbol( 'foo' ).asA( M.metavariable )
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
        // Try to add a Substitution in which the metavariable is already mapped
        // to something else.
        S._substitutions['foo'] = new M.Substitution(
            new LurchSymbol( 'foo' ).asA( M.metavariable ),
            new LurchSymbol( 'bar' )
        )
        let sub = new M.Substitution(
            new LurchSymbol( 'foo' ).asA( M.metavariable ),
            new LurchSymbol( 'baz' )
        )
        expect( () => S.add( sub ) ).to.throw( /Function condition failed/ )
        delete S._substitutions['foo'] // cleanup
        // Try to add Substitutions that do not violate the above rule.
        expect( () => S.plus( new M.Substitution(
            new LurchSymbol( 'x' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( 'this_should_work' )[0]
        ) ) ).not.to.throw()
        sub = new M.Substitution(
            new LurchSymbol( 'foo' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( 'baz' )[0] // since we did cleanup above
        )
        expect( () => S.add( sub ) ).not.to.throw()
    } )

    it( 'Should support adding new Substitutions to its collection', () => {
        // Construct a problem containing the same two Constraints as in the
        // previous test, and then a solution from it, as before.
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        const pat2 = new LurchSymbol( 'foo' ).asA( M.metavariable )
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
        //  - Solution is neither satisfied nor complete
        expect( S.domain() ).to.be.instanceOf( Set )
        expect( S.domain().size ).to.equal( 0 )
        expect( S.get( 'foo' ) ).to.be.undefined
        expect( S.get( 'x' ) ).to.be.undefined
        expect( S.get( 'y' ) ).to.be.undefined
        expect( S.complete() ).to.equal( false )
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
        //  - Solution is satisfied satisfied and complete
        expect( S.domain() ).to.be.instanceOf( Set )
        expect( S.domain().size ).to.equal( 1 )
        expect( S.domain().has( 'foo' ) ).to.equal( true )
        expect( S.get( 'foo' ) ).to.be.instanceOf( LogicConcept )
        expect( S.get( 'foo' ).equals( C2.expression ) ).to.equal( true )
        expect( S.get( 'x' ) ).to.be.undefined
        expect( S.get( 'y' ) ).to.be.undefined
        expect( S.complete() ).to.equal( true )
    } )

    it( 'Should support applying Substitutions to it', () => {
        // In this test, we use capital letters for metavariables.
        // Test 1:
        // Create an example Solution: X -> 3, Y -> f(t,Z)
        const emptyP = new M.Problem()
        const S1 = new M.Solution( emptyP )
        S1.add( new M.Substitution(
            new LurchSymbol( 'X' ).asA( M.metavariable ),
            new LurchSymbol( '3' )
        ) )
        let temp = LogicConcept.fromPutdown( '(f t Z)' )[0]
        temp.child( 2 ).makeIntoA( M.metavariable )
        S1.add( new M.Substitution(
            new LurchSymbol( 'Y' ).asA( M.metavariable ),
            temp
        ) )
        expect( S1.complete() ).to.equal( false )
        // Apply to it the Substitution: Z -> +(W,W)
        temp = LogicConcept.fromPutdown( '(+ W W)' )[0]
        temp.child( 1 ).makeIntoA( M.metavariable )
        temp.child( 2 ).makeIntoA( M.metavariable )
        let sub = new M.Substitution(
            new LurchSymbol( 'Z' ).asA( M.metavariable ),
            temp
        )
        sub.applyTo( S1 )
        expect( S1.get( 'X' ).equals( new LurchSymbol( '3' ) ) )
            .to.equal( true )
        temp = LogicConcept.fromPutdown( '(f t (+ W W))' )[0]
        temp.child( 2 ).child( 1 ).makeIntoA( M.metavariable )
        temp.child( 2 ).child( 2 ).makeIntoA( M.metavariable )
        expect( S1.get( 'Y' ).equals( temp ) ).equals( true )
        expect( S1.complete() ).to.equal( false )
        // Apply to it the Substitution: W -> k
        sub = new M.Substitution(
            new LurchSymbol( 'W' ).asA( M.metavariable ),
            new LurchSymbol( 'k' )
        )
        sub.applyTo( S1 )
        expect( S1.get( 'X' ).equals( new LurchSymbol( '3' ) ) )
            .to.equal( true )
        expect( S1.get( 'Y' ).equals(
            LogicConcept.fromPutdown( '(f t (+ k k))' )[0]
        ) ).equals( true )
        expect( S1.complete() ).to.equal( true )
    } )

    it( 'Should correctly restrict its domain when asked', () => {
        // Construct a problem containing the same two Constraints as in
        // earlier tests, and then a solution from it, as before.
        const pat1 = LogicConcept.fromPutdown( '(∀ x , (∃ y , (= (+ x 1) y)))' )[0]
        const pat2 = new LurchSymbol( 'foo' ).asA( M.metavariable )
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
        // Ensure that restricting it now does nothing.
        expect( S.domain().size ).equals( 0 )
        let resS = S.restricted()
        expect( resS.domain().size ).equals( 0 )
        // Add one Substitution, within the domain of the problem
        S.add( new M.Substitution(
            new LurchSymbol( 'foo' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(larger thing but not too large)' )[0]
        ) )
        // Ensure that restricting it still does nothing
        expect( S.domain().size ).equals( 1 )
        expect( S.domain().has( 'foo' ) ).equals( true )
        resS = S.restricted()
        expect( resS.domain().size ).equals( 1 )
        expect( resS.domain().has( 'foo' ) ).equals( true )
        expect( S.get( 'foo' ).equals( resS.get( 'foo' ) ) ).equals( true )
        // Add another Substitution, this time an extraneous one
        S.add( new M.Substitution(
            new LurchSymbol( 'bar' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(totally does not belong here)' )[0]
        ) )
        // Ensure that restricting it drops the extraneous Substitution
        expect( S.domain().size ).equals( 2 )
        expect( S.domain().has( 'foo' ) ).equals( true )
        expect( S.domain().has( 'bar' ) ).equals( true )
        resS = S.restricted()
        expect( resS.domain().size ).equals( 1 )
        expect( resS.domain().has( 'foo' ) ).equals( true )
        expect( S.get( 'foo' ).equals( resS.get( 'foo' ) ) ).equals( true )
        // Add another Substitution, also not relevant
        S.add( new M.Substitution(
            new LurchSymbol( 'x' ).asA( M.metavariable ),
            new LurchSymbol( 't' )
        ) )
        // Ensure that restricting it drops the extraneous Substitutions
        expect( S.domain().size ).equals( 3 )
        expect( S.domain().has( 'foo' ) ).equals( true )
        expect( S.domain().has( 'bar' ) ).equals( true )
        expect( S.domain().has( 'x' ) ).equals( true )
        resS = S.restricted()
        expect( resS.domain().size ).equals( 1 )
        expect( resS.domain().has( 'foo' ) ).equals( true )
        expect( S.get( 'foo' ).equals( resS.get( 'foo' ) ) ).equals( true )
        expect( resS.domain().has( 'x' ) ).equals( false )
        // Add another Substitution, another extraneous one
        S.add( new M.Substitution(
            new LurchSymbol( 'y' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '"lorem ipsum"' )[0]
        ) )
        // Ensure that restricting it yields the same thing as before
        expect( S.domain().size ).equals( 4 )
        expect( S.domain().has( 'foo' ) ).equals( true )
        expect( S.domain().has( 'bar' ) ).equals( true )
        expect( S.domain().has( 'x' ) ).equals( true )
        expect( S.domain().has( 'y' ) ).equals( true )
        resS = S.restricted()
        expect( resS.domain().size ).equals( 1 )
        expect( resS.domain().has( 'foo' ) ).equals( true )
        expect( S.get( 'foo' ).equals( resS.get( 'foo' ) ) ).equals( true )
        expect( resS.domain().has( 'x' ) ).equals( false )
        // Now apply restrict() to S and ensure it works in-place, too
        S.restrict()
        expect( S.domain().size ).equals( 1 )
        expect( S.domain().has( 'foo' ) ).equals( true )
        expect( resS.get( 'foo' ).equals( S.get( 'foo' ) ) ).equals( true )
        expect( S.domain().has( 'x' ) ).equals( false )
    } )

} )
