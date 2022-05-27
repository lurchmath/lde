
import { Symbol } from '../src/symbol.js'
import { Application } from '../src/application.js'
import { Binding } from '../src/binding.js'
import { Environment } from '../src/environment.js'
import { LogicConcept } from '../src/logic-concept.js'
import M from '../src/matching.js'

describe( 'Constraint', () => {

    it( 'Should declare the relevant global identifiers', () => {
        expect( M.Constraint ).to.be.ok
    } )

    it( 'Should let us construct only well-formed Constraints', () => {
        // if there are no metavariables, everything is fine
        let P, E, C
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 2)
            (* n m)
        ` )
        expect( () => C = new M.Constraint( P, E ) ).not.to.throw()
        expect( C ).to.be.instanceOf( M.Constraint )
        // in here, we also test the getters for pattern and expression, briefly
        expect( C.pattern ).to.equal( P )
        expect( C.expression ).to.equal ( E )
        // if there are metavariables in the pattern only, everything is fine
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 (- K Q))
            (* n m)
        ` )
        expect( P.child( 2 ).child( 1 ).text() ).to.equal( 'K' )
        P.child( 2 ).child( 1 ).makeIntoA( M.metavariable )
        expect( P.child( 2 ).child( 2 ).text() ).to.equal( 'Q' )
        P.child( 2 ).child( 2 ).makeIntoA( M.metavariable )
        expect( () => C = new M.Constraint( P, E ) ).not.to.throw()
        expect( C ).to.be.instanceOf( M.Constraint )
        expect( C.pattern ).to.equal( P )
        expect( C.expression ).to.equal ( E )
        // if there are metavariables in both, errors should be thrown
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 (- K Q))
            (* n m)
        ` )
        expect( P.child( 2 ).child( 1 ).text() ).to.equal( 'K' )
        P.child( 2 ).child( 1 ).makeIntoA( M.metavariable )
        expect( P.child( 2 ).child( 2 ).text() ).to.equal( 'Q' )
        P.child( 2 ).child( 2 ).makeIntoA( M.metavariable )
        expect( E.child( 1 ).text() ).to.equal( 'n' )
        E.child( 1 ).makeIntoA( M.metavariable )
        expect( E.child( 2 ).text() ).to.equal( 'm' )
        E.child( 2 ).makeIntoA( M.metavariable )
        expect( () => C = new M.Constraint( P, E ) ).to.throw(
            'may not contain metavariables' )
        // if there are metavariables in the expression, errors should be thrown
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 (- K Q))
            (* n m)
        ` )
        expect( E.child( 1 ).text() ).to.equal( 'n' )
        E.child( 1 ).makeIntoA( M.metavariable )
        expect( E.child( 2 ).text() ).to.equal( 'm' )
        E.child( 2 ).makeIntoA( M.metavariable )
        expect( () => C = new M.Constraint( P, E ) ).to.throw(
            'may not contain metavariables' )
        // even just one metavariable is problematic in the expression
        E = new Symbol( 'oh well' ).asA( M.metavariable )
        expect( () => C = new M.Constraint( P, E ) ).to.throw(
            'may not contain metavariables' )
    } )

    it( 'Should support making shallow copies', () => {
        // Construct one of the constraints we made in the previous test
        let P, E, C
        ;[ P, E ] = LogicConcept.fromPutdown( `
            (+ 1 (- K Q))
            (* n m)
        ` )
        P.child( 2 ).child( 1 ).makeIntoA( M.metavariable )
        P.child( 2 ).child( 2 ).makeIntoA( M.metavariable )
        C = new M.Constraint( P, E )
        // make a copy and ensure it throws no errors
        let copy
        expect( () => copy = C.copy() ).not.to.throw()
        // ensure that it has the same pattern and expression as the original
        expect( C.pattern ).to.equal( copy.pattern )
        expect( C.expression ).to.equal( copy.expression )
        // and yet they are not the same object
        expect( C ).not.to.equal( copy )
    } )

    it( 'Should correctly compute equality for two instances', () => {
        // a constraint is equal to one that looks exactly the same
        expect( new M.Constraint(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ).equals( new M.Constraint(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ) ) ).to.equal( true )
        // two constraints are not equal if their patterns differ, even if just
        // by an attribute, such as whether one is a metavariable
        expect( new M.Constraint(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ).equals( new M.Constraint(
            new Symbol( 'X' ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ) ) ).to.equal( false )
        // two constraints are not equal if their expressions differ
        expect( new M.Constraint(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ).equals( new M.Constraint(
            new Symbol( 'X' ).asA( M.metavariable ),
            new Symbol( 'y' )
        ) ) ).to.equal( false )
        // two constraints are not equal if both pattern and expression differ
        expect( new M.Constraint(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        ).equals( new M.Constraint(
            new Symbol( 'X' ),
            new Symbol( 'y' )
        ) ) ).to.equal( false )
        // a constraint is equal to a copy of itself
        let C = new M.Constraint(
            new Symbol( 'X' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(sqrt (+ (^ x 2) (^ y 2)))' )[0]
        )
        expect( C.equals( C.copy() ) ).to.equal( true )
    } )

    it( 'Should reliably test whether it is an instantiation', () => {
        let C
        // a Constraint whose pattern is a single metavar is an instantiation
        C = new M.Constraint(
            new Symbol( 'example' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(x y z a b c)' )[0]
        )
        expect( C.isAnInstantiation() ).to.equal( true )
        // a Constraint whose pattern is a single symbol is not an instantiation
        // if we don't mark that symbol as a metavariable
        C = new M.Constraint(
            new Symbol( 'example' ),
            LogicConcept.fromPutdown( '(x y z a b c)' )[0]
        )
        expect( C.isAnInstantiation() ).to.equal( false )
        // a Constraint whose pattern is anything other than a symbol is not an
        // instantiation, even if we (erroneously) mark the pattern as a metavar
        C = new M.Constraint(
            LogicConcept.fromPutdown( '(1 2 3)' )[0].asA( M.metavariable ),
            LogicConcept.fromPutdown( '(x y z a b c)' )[0]
        )
        expect( C.isAnInstantiation() ).to.equal( false )
        C = new M.Constraint(
            LogicConcept.fromPutdown( '[pi const]' )[0].asA( M.metavariable ),
            LogicConcept.fromPutdown( '(x y z a b c)' )[0]
        )
        expect( C.isAnInstantiation() ).to.equal( false )
        C = new M.Constraint(
            LogicConcept.fromPutdown( '{ { } }' )[0].asA( M.metavariable ),
            LogicConcept.fromPutdown( '(x y z a b c)' )[0]
        )
        expect( C.isAnInstantiation() ).to.equal( false )
    } )

    it( 'Can remove all bindings in its pattern and expression', () => {
        // create a Constraint with no bindings; ensure no change happens
        let C1 = new M.Constraint(
            LogicConcept.fromPutdown( '"atomic expression"' )[0],
            LogicConcept.fromPutdown( '(nested (application expressions) only)' )[0]
        )
        let copy = C1.copy()
        expect( C1.equals( copy ) ).to.equal( true )
        C1.removeBindings()
        expect( C1.equals( copy ) ).to.equal( true )
        // create a Constraint with one binding in each of its parts;
        // ensure both are removed upon request
        let C2 = new M.Constraint(
            LogicConcept.fromPutdown( '(forall x , (P x))' )[0],
            LogicConcept.fromPutdown( '(and (exists y , (Q y 3)) (R z))' )[0]
        )
        copy = C2.copy()
        expect( C2.equals( copy ) ).to.equal( true )
        C2.removeBindings()
        expect( C2.equals( copy ) ).to.equal( false )
        expect( C2.pattern.equals( LogicConcept.fromPutdown(
            '("LDE binding" forall x (P x))'
        )[0] ) ).to.equal( true )
        expect( C2.expression.equals( LogicConcept.fromPutdown(
            '(and ("LDE binding" exists y (Q y 3)) (R z))'
        )[0] ) ).to.equal( true )
        // create a Constraint with a nested binding in its pattern;
        // ensure the expansion takes place recursively/nested
        let C3 = new M.Constraint(
            LogicConcept.fromPutdown( '(forall x , (exists y , (> x y)))' )[0],
            LogicConcept.fromPutdown( '"nothing to see here"' )[0]
        )
        copy = C3.copy()
        expect( C3.equals( copy ) ).to.equal( true )
        C3.removeBindings()
        expect( C3.equals( copy ) ).to.equal( false )
        expect( C3.pattern.equals( LogicConcept.fromPutdown(
            '("LDE binding" forall x ("LDE binding" exists y (> x y)))'
        )[0] ) ).to.equal( true )
        expect( C3.expression.equals( copy.expression ) ).to.equal( true )
        // same test as previous, but put it in the expression instead
        let C4 = new M.Constraint(
            LogicConcept.fromPutdown( '"nothing to see here"' )[0],
            LogicConcept.fromPutdown( '(forall x , (exists y , (> x y)))' )[0]
        )
        copy = C4.copy()
        expect( C4.equals( copy ) ).to.equal( true )
        C4.removeBindings()
        expect( C4.equals( copy ) ).to.equal( false )
        expect( C4.pattern.equals( copy.pattern ) ).to.equal( true )
        expect( C4.expression.equals( LogicConcept.fromPutdown(
            '("LDE binding" forall x ("LDE binding" exists y (> x y)))'
        )[0] ) ).to.equal( true )
    } )

    it( 'Can become a Substitution that works in-place or functionally', () => {
        // create a Constraint that is an instantiation
        let X = new Symbol( 'X' ).asA( M.metavariable )
        let C = new M.Constraint(
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
        // create expected results after applying the constraint
        const newP1 = LogicConcept.fromPutdown( '(f (exp (- x)))' )[0]
        const newP2 = LogicConcept.fromPutdown( '(𝝺 v , ((exp (- x)) v))' )[0]
        const newP3 = LogicConcept.fromPutdown(
            '{ (exp (- x)) (exp (- x)) (exp (- x)) }' )[0]
        // Convert C into a Substitution instance so we can use it
        let S = new M.Substitution( C )
        // apply C to P1 in place and ensure the result is as expected
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
        // apply C functionally (not in place) to those three, saving the
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
        // ensure that Substitutions cannot be applied in-place to Constraints
        let badTarget = new M.Constraint( P1.copy(),
            LogicConcept.fromPutdown( '(hello there "friend")' )[0] )
        expect( () => S.applyTo( badTarget ) ).to.throw( /^Target.*must be/ )
        // but it is okay to apply not-in-place to a Constraint, thus creating
        // a new, altered copy
        let substituted
        expect( () => substituted = S.appliedTo( badTarget ) ).not.to.throw()
        expect( substituted.pattern.equals( S.appliedTo( P1.copy() ) ) )
            .to.equal( true )
        expect( substituted.expression.equals( badTarget.expression ) )
            .to.equal( true )
        // ensure that Substitutions can be applied to Problems in-place
        let prob = new M.Problem()
        const E1 = LogicConcept.fromPutdown( '(an appli cation)' )[0]
        const E2 = LogicConcept.fromPutdown( '(a bin , ding)' )[0]
        prob.add( P1copy, E1, P2copy, E2 )
        expect( prob.constraints.length ).to.equal( 2 )
        expect( prob.constraints.some( constraint =>
            constraint.pattern.equals( P1copy ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( prob.constraints.some( constraint =>
            constraint.pattern.equals( P2copy ) && constraint.expression.equals( E2 )
        ) ).to.equal( true )
        expect( () => S.applyTo( prob ) ).not.to.throw()
        expect( prob.constraints.length ).to.equal( 2 )
        expect( prob.constraints.some( constraint =>
            constraint.pattern.equals( newP1 ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( prob.constraints.some( constraint =>
            constraint.pattern.equals( newP2 ) && constraint.expression.equals( E2 )
        ) ).to.equal( true )
        // ensure that Substitutions can be applied to Problems to make copies
        prob = new M.Problem()
        prob.add( P1copy, E1, P2copy, E2 )
        expect( prob.constraints.length ).to.equal( 2 )
        expect( prob.constraints.some( constraint =>
            constraint.pattern.equals( P1copy ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( prob.constraints.some( constraint =>
            constraint.pattern.equals( P2copy ) && constraint.expression.equals( E2 )
        ) ).to.equal( true )
        let probNew
        expect( () => probNew = S.appliedTo( prob ) ).not.to.throw()
        expect( prob.constraints.length ).to.equal( 2 )
        expect( prob.constraints.some( constraint =>
            constraint.pattern.equals( P1copy ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( prob.constraints.some( constraint =>
            constraint.pattern.equals( P2copy ) && constraint.expression.equals( E2 )
        ) ).to.equal( true )
        expect( probNew.constraints.length ).to.equal( 2 )
        expect( probNew.constraints.some( constraint =>
            constraint.pattern.equals( newP1 ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( probNew.constraints.some( constraint =>
            constraint.pattern.equals( newP2 ) && constraint.expression.equals( E2 )
        ) ).to.equal( true )
    } )

    it( 'Should correctly compute complexity levels and names', () => {
        let P, E, C
        // Two different non-patterns = failure
        P = LogicConcept.fromPutdown( 'a' )[0]
        E = LogicConcept.fromPutdown( '(b c)' )[0]
        C = new M.Constraint( P, E )
        expect( C.complexity() ).to.equal( 0 )
        expect( C.complexityName() ).to.equal( 'failure' )
        // Applications with different sizes = failure
        P = LogicConcept.fromPutdown( '(x y z)' )[0]
        P.child( 1 ).makeIntoA( M.metavariable )
        E = LogicConcept.fromPutdown( '(a b)' )[0]
        C = new M.Constraint( P, E )
        expect( C.complexity() ).to.equal( 0 )
        expect( C.complexityName() ).to.equal( 'failure' )
        // Two different non-patterns = success
        P = LogicConcept.fromPutdown( '(x (w w) z)' )[0]
        E = LogicConcept.fromPutdown( '(x (w w) z)' )[0]
        C = new M.Constraint( P, E )
        expect( C.complexity() ).to.equal( 1 )
        expect( C.complexityName() ).to.equal( 'success' )
        // Metavariable pattern = instantiation
        P = new Symbol( 'A' ).asA( M.metavariable )
        E = LogicConcept.fromPutdown( '(a b)' )[0]
        C = new M.Constraint( P, E )
        expect( C.complexity() ).to.equal( 2 )
        expect( C.complexityName() ).to.equal( 'instantiation' )
        // Applications with same sizes = children
        P = LogicConcept.fromPutdown( '(x y z)' )[0]
        P.child( 1 ).makeIntoA( M.metavariable )
        E = LogicConcept.fromPutdown( '(a b c)' )[0]
        C = new M.Constraint( P, E )
        expect( C.complexity() ).to.equal( 3 )
        expect( C.complexityName() ).to.equal( 'children' )
        // Exprssion Function Application pattern = EFA
        P = M.newEFA( new Symbol( 'P' ).asA( M.metavariable ), new Symbol( 'x' ) )
        E = LogicConcept.fromPutdown( '(a b c d)' )[0]
        C = new M.Constraint( P, E )
        expect( C.complexity() ).to.equal( 4 )
        expect( C.complexityName() ).to.equal( 'EFA' )
    } )

    it( 'Should correctly compute arrays of child constraints', () => {
        let P, E, C
        // First, it should throw an error if you try to compute child
        // constraints for the wrong type of constraints.
        P = LogicConcept.fromPutdown( 'a' )[0]
        E = LogicConcept.fromPutdown( '(b c)' )[0]
        C = new M.Constraint( P, E )
        expect( () => C.children() ).to.throw( /^Cannot compute.*this type/ )
        P = M.newEFA( new Symbol( 'P' ).asA( M.metavariable ), new Symbol( 'x' ) )
        E = LogicConcept.fromPutdown( '(a b c d)' )[0]
        C = new M.Constraint( P, E )
        expect( () => C.children() ).to.throw( /^Cannot compute.*this type/ )
        // Next, consider two applications of the same size
        P = LogicConcept.fromPutdown( '(x y z)' )[0]
        P.child( 1 ).makeIntoA( M.metavariable )
        E = LogicConcept.fromPutdown( '(a b c)' )[0]
        C = new M.Constraint( P, E )
        let result
        expect( () => result = C.children() ).not.to.throw()
        expect( result.length ).to.equal( 3 )
        expect( result[0] ).to.be.instanceOf( M.Constraint )
        expect( result[0].pattern.equals( new Symbol( 'x' ) ) ).to.equal( true )
        expect( result[0].expression.equals( new Symbol( 'a' ) ) ).to.equal( true )
        expect( result[1] ).to.be.instanceOf( M.Constraint )
        expect( result[1].pattern.equals( new Symbol( 'y' ).asA( M.metavariable ) ) )
            .to.equal( true )
        expect( result[1].expression.equals( new Symbol( 'b' ) ) ).to.equal( true )
        expect( result[2] ).to.be.instanceOf( M.Constraint )
        expect( result[2].pattern.equals( new Symbol( 'z' ) ) ).to.equal( true )
        expect( result[2].expression.equals( new Symbol( 'c' ) ) ).to.equal( true )
    } )

} )
