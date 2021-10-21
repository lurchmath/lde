
import M from '../src/matching.js'
import { Symbol } from '../src/symbol.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Application } from '../src/application.js'
import { Binding } from '../src/binding.js'
import { Environment } from '../src/environment.js'

describe( 'Problem', () => {

    it( 'Should declare the correct global identifiers', () => {
        expect( M.Problem ).to.be.ok
    } )

    it( 'Should let us construct empty problems and query them', () => {
        let P
        expect( () => P = new M.Problem() ).not.to.throw()
        expect( P.empty() ).to.equal( true )
        expect( P.length ).to.equal( 0 )
    } )

    it( 'Should let us add constraints in a wide variety of ways', () => {
        let P, C1, C2, C3, C4, p1, e1, p2, e2, p3, e3, p4, e4, p5, e5, p6, e6
        // start with a new P and add two different constraints by P.add(C1,C2)
        P = new M.Problem()
        C1 = new M.Constraint(
            new Symbol( 'A' ).asA( M.metavariable ),
            new Symbol( 5 )
        )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (- 12 (+ k 1))
            (- 3 (+ K 11))
        ` ) )
        expect( () => P.add( C1, C2 ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 2 )
        // ensure that the constraints we expect are in the problem
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        // add two more the same way, but one is a duplicate
        C3 = new M.Constraint( new Symbol( 'x' ), new Symbol( 'z' ) )
        C4 = C2.copy()
        expect( () => P.add( C3, C4 ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        // ensure that the constraints we expect are in the problem
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )

        // starting afresh, add two different constraints by P.add([C1,C2])
        P = new M.Problem()
        C1 = new M.Constraint(
            new Symbol( 'A' ).asA( M.metavariable ),
            new Symbol( 5 )
        )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (- 12 (+ k 1))
            (- 3 (+ K 11))
        ` ) )
        expect( () => P.add( [ C1, C2 ] ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 2 )
        // ensure that the constraints we expect are in the problem
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        // add two more the same way, but one is a duplicate
        C3 = new M.Constraint( new Symbol( 'x' ), new Symbol( 'z' ) )
        C4 = C2.copy()
        expect( () => P.add( [ C3, C4 ] ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        // ensure that the constraints we expect are in the problem
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )

        // starting afresh, add two different constraints by P.add(p1,e1,p2,e2)
        P = new M.Problem()
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        expect( () => P.add( p1, e1, p2, e2 ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 2 )
        // ensure that the constraints we expect are in the problem
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        // add one more the same way, it is a duplicate
        p3 = new Symbol( 'A' ).asA( M.metavariable )
        e3 = new Symbol( 5 )
        P.add( p3, e3 )
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 2 )
        // ensure that the constraints we expect are in the problem
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        // add three more the same way, new ones, but they're all equal
        p4 = new Application(
            new Symbol( 'f' ).asA( M.metavariable ),
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 )
        )
        e4 = LogicConcept.fromPutdown( '(∃ u v , (= (* (- u) (- v)) 0))' )[0]
        p5 = p4.copy()
        e5 = e4.copy()
        p6 = p4.copy()
        e6 = e4.copy()
        P.add( p4, e4, p5, e5, p6, e6 )
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        // ensure that the constraints we expect are in the problem
        C3 = new M.Constraint( p4, e4 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )

        // starting afresh, add two different constraints by P.add([p1,e1,p2,e2])
        P = new M.Problem()
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        expect( () => P.add( [ p1, e1, p2, e2 ] ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 2 )
        // ensure that the constraints we expect are in the problem
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        // add one more the same way, it is a duplicate
        p3 = new Symbol( 'A' ).asA( M.metavariable )
        e3 = new Symbol( 5 )
        P.add( p3, e3 )
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 2 )
        // ensure that the constraints we expect are in the problem
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        // add three more the same way, new ones, but they're all equal
        p4 = new Application(
            new Symbol( 'f' ).asA( M.metavariable ),
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 )
        )
        e4 = LogicConcept.fromPutdown( '(∃ u v , (= (* (- u) (- v)) 0))' )[0]
        p5 = p4.copy()
        e5 = e4.copy()
        p6 = p4.copy()
        e6 = e4.copy()
        P.add( [ p4, e4, p5, e5, p6, e6 ] )
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        // ensure that the constraints we expect are in the problem
        C3 = new M.Constraint( p4, e4 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )

        // starting afresh, add two different constraints by P.add([[p1,e1],[p2,e2]]])
        P = new M.Problem()
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        expect( () => P.add( [ [ p1, e1 ], [ p2, e2 ] ] ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 2 )
        // ensure that the constraints we expect are in the problem
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        // add two more the same way, but one is a duplicate
        p3 = new Symbol( 'x' )
        e3 = new Symbol( 'z' )
        p4 = p2.copy()
        e4 = e2.copy()
        expect( () => P.add( [ [ p3, e3 ], [ p4, e4 ] ] ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        // ensure that the constraints we expect are in the problem
        C3 = new M.Constraint( p3, e3 )
        C4 = new M.Constraint( p4, e4 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )
    } )

    it( 'Should let us add constraints at construction time', () => {
        let P, C1, C2, C3, C4, p1, e1, p2, e2, p3, e3, p4, e4, p5, e5, p6, e6
        // construct P = new Problem( C1, C2, C3, C4 ), but C4 is a repeat of C2
        C1 = new M.Constraint(
            new Symbol( 'A' ).asA( M.metavariable ),
            new Symbol( 5 )
        )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (- 12 (+ k 1))
            (- 3 (+ K 11))
        ` ) )
        C3 = new M.Constraint( new Symbol( 'x' ), new Symbol( 'z' ) )
        C4 = C2.copy()
        expect( () => P = new M.Problem( C1, C2, C3, C4 ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        // ensure that the constraints we expect are in the problem
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )

        // same as previous test, but using new Problem( [ C1, C2, C3, C4 ] )
        C1 = new M.Constraint(
            new Symbol( 'A' ).asA( M.metavariable ),
            new Symbol( 5 )
        )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (- 12 (+ k 1))
            (- 3 (+ K 11))
        ` ) )
        C3 = new M.Constraint( new Symbol( 'x' ), new Symbol( 'z' ) )
        C4 = C2.copy()
        expect( () => P = new M.Problem( [ C1, C2, C3, C4 ] ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        // ensure that the constraints we expect are in the problem
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )

        // now P = new Problem( p1, e1, p2, e2, p3, e3, p4, e4, p5, e5, p6, e6 )
        // but p3,e3 is the same as p1,e1
        // and p4,e4 through p6,e6 are all just repeats of p4,e4
        // for a total of just 3 unique constraints: p1,e1, p2,e2, p4,e4
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        p3 = new Symbol( 'A' ).asA( M.metavariable )
        e3 = new Symbol( 5 )
        p4 = new Application(
            new Symbol( 'f' ).asA( M.metavariable ),
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 )
        )
        e4 = LogicConcept.fromPutdown( '(∃ u v , (= (* (- u) (- v)) 0))' )[0]
        p5 = p4.copy()
        e5 = e4.copy()
        p6 = p4.copy()
        e6 = e4.copy()
        expect( () => P = new M.Problem(
            p1, e1, p2, e2, p3, e3, p4, e4, p5, e5, p6, e6 ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        C3 = new M.Constraint( p4, e4 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )

        // same as previous test, but using:
        // new Problem( [ p1, e1, p2, e2, p3, e3, p4, e4, p5, e5, p6, e6 ] )
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        p3 = new Symbol( 'A' ).asA( M.metavariable )
        e3 = new Symbol( 5 )
        p4 = new Application(
            new Symbol( 'f' ).asA( M.metavariable ),
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 )
        )
        e4 = LogicConcept.fromPutdown( '(∃ u v , (= (* (- u) (- v)) 0))' )[0]
        p5 = p4.copy()
        e5 = e4.copy()
        p6 = p4.copy()
        e6 = e4.copy()
        expect( () => P = new M.Problem( [
            p1, e1, p2, e2, p3, e3, p4, e4, p5, e5, p6, e6
        ] ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        C3 = new M.Constraint( p4, e4 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )

        // same as first test, but breaking each constraint into its p,e
        // components, and using the syntax new Problem( [ [ p1, e1 ], ... ] )
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        p3 = new Symbol( 'x' )
        e3 = new Symbol( 'z' )
        p4 = p2.copy()
        e4 = e2.copy()
        expect( () => P = new M.Problem( [
            [ p1, e1 ], [ p2, e2 ], [ p3, e3 ], [ p4, e4 ]
        ] ) ).not.to.throw()
        // test length and empty status of problem
        expect( P.empty() ).to.equal( false )
        expect( P.length ).to.equal( 3 )
        // ensure that the constraints we expect are in the problem
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        C3 = new M.Constraint( p3, e3 )
        C4 = new M.Constraint( p4, e4 )
        expect( P.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )
    } )

    it( 'Should let us add constraints while copying, with plus()', () => {
        let P1, P2, P3, P4
        let C1, C2, C3, C4, p1, e1, p2, e2, p3, e3, p4, e4, p5, e5, p6, e6
        // same as first test from previous function, except we create problems
        // iteratively using .plus()
        C1 = new M.Constraint(
            new Symbol( 'A' ).asA( M.metavariable ),
            new Symbol( 5 )
        )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (- 12 (+ k 1))
            (- 3 (+ K 11))
        ` ) )
        C3 = new M.Constraint( new Symbol( 'x' ), new Symbol( 'z' ) )
        C4 = C2.copy()
        // an empty problem
        expect( () => P1 = new M.Problem() ).not.to.throw()
        expect( P1.empty() ).to.equal( true )
        expect( P1.length ).to.equal( 0 )
        expect( P1.constraints.some( C => C.equals( C1 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C2 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C4 ) ) ).to.equal( false )
        // add first constraint
        expect( () => P2 = P1.plus( C1 ) ).not.to.throw()
        expect( P2 ).not.to.equal( P1 )
        expect( P2.empty() ).to.equal( false )
        expect( P2.length ).to.equal( 1 )
        expect( P2.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P2.constraints.some( C => C.equals( C2 ) ) ).to.equal( false )
        expect( P2.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        expect( P2.constraints.some( C => C.equals( C4 ) ) ).to.equal( false )
        // add next two constraints
        expect( () => P3 = P2.plus( C2, C3 ) ).not.to.throw()
        expect( P3 ).not.to.equal( P2 )
        expect( P3.empty() ).to.equal( false )
        expect( P3.length ).to.equal( 3 )
        expect( P3.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C4 ) ) ).to.equal( true ) // C2==C4
        // add final constraint
        expect( () => P4 = P3.plus( C4 ) ).not.to.throw()
        expect( P4 ).not.to.equal( P3 )
        expect( P4.empty() ).to.equal( false )
        expect( P4.length ).to.equal( 3 )
        expect( P4.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )

        // same as previous test, but using new Problem( [ constraints... ] )
        C1 = new M.Constraint(
            new Symbol( 'A' ).asA( M.metavariable ),
            new Symbol( 5 )
        )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (- 12 (+ k 1))
            (- 3 (+ K 11))
        ` ) )
        C3 = new M.Constraint( new Symbol( 'x' ), new Symbol( 'z' ) )
        C4 = C2.copy()
        // an empty problem
        expect( () => P1 = new M.Problem() ).not.to.throw()
        expect( P1.empty() ).to.equal( true )
        expect( P1.length ).to.equal( 0 )
        expect( P1.constraints.some( C => C.equals( C1 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C2 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C4 ) ) ).to.equal( false )
        // add first constraint
        expect( () => P2 = P1.plus( [ C1 ] ) ).not.to.throw()
        expect( P2 ).not.to.equal( P1 )
        expect( P2.empty() ).to.equal( false )
        expect( P2.length ).to.equal( 1 )
        expect( P2.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P2.constraints.some( C => C.equals( C2 ) ) ).to.equal( false )
        expect( P2.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        expect( P2.constraints.some( C => C.equals( C4 ) ) ).to.equal( false )
        // add next two constraints
        expect( () => P3 = P2.plus( [ C2, C3 ] ) ).not.to.throw()
        expect( P3 ).not.to.equal( P2 )
        expect( P3.empty() ).to.equal( false )
        expect( P3.length ).to.equal( 3 )
        expect( P3.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C4 ) ) ).to.equal( true ) // C2==C4
        // add final constraint
        expect( () => P4 = P3.plus( [ C4 ] ) ).not.to.throw()
        expect( P4 ).not.to.equal( P3 )
        expect( P4.empty() ).to.equal( false )
        expect( P4.length ).to.equal( 3 )
        expect( P4.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )

        // Now we repeat test 3 from the previous test function, but with .plus().
        // it's a problem with p1,e1, p2,e2, p3,e3, p4,e4, p5,e5, and p6,e6
        // but p3,e3 is the same as p1,e1
        // and p4,e4 through p6,e6 are all just repeats of p4,e4
        // for a total of just 3 unique constraints: p1,e1, p2,e2, p4,e4
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        p3 = new Symbol( 'A' ).asA( M.metavariable )
        e3 = new Symbol( 5 )
        p4 = new Application(
            new Symbol( 'f' ).asA( M.metavariable ),
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 )
        )
        e4 = LogicConcept.fromPutdown( '(∃ u v , (= (* (- u) (- v)) 0))' )[0]
        p5 = p4.copy()
        e5 = e4.copy()
        p6 = p4.copy()
        e6 = e4.copy()
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        C3 = new M.Constraint( p4, e4 )
        // start with an empty problem
        expect( () => P1 = new M.Problem() ).not.to.throw()
        expect( P1.empty() ).to.equal( true )
        expect( P1.length ).to.equal( 0 )
        expect( P1.constraints.some( C => C.equals( C1 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C2 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        // add the first two constraints
        expect( () => P2 = P1.plus( p1, e1, p2, e2 ) ).not.to.throw()
        expect( P2 ).not.to.equal( P1 )
        expect( P2.empty() ).to.equal( false )
        expect( P2.length ).to.equal( 2 )
        expect( P2.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P2.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P2.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        // add the next two constraints
        expect( () => P3 = P2.plus( p3, e3, p4, e4 ) ).not.to.throw()
        expect( P3 ).not.to.equal( P2 )
        expect( P3.empty() ).to.equal( false )
        expect( P3.length ).to.equal( 3 )
        expect( P3.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        // add the final two constraints
        expect( () => P4 = P3.plus( p5, e5, p6, e6 ) ).not.to.throw()
        expect( P4 ).not.to.equal( P3 )
        expect( P4.empty() ).to.equal( false )
        expect( P4.length ).to.equal( 3 )
        expect( P4.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )

        // same as previous test, but using array argument to .plus()
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        p3 = new Symbol( 'A' ).asA( M.metavariable )
        e3 = new Symbol( 5 )
        p4 = new Application(
            new Symbol( 'f' ).asA( M.metavariable ),
            new Symbol( 1 ), new Symbol( 2 ), new Symbol( 3 )
        )
        e4 = LogicConcept.fromPutdown( '(∃ u v , (= (* (- u) (- v)) 0))' )[0]
        p5 = p4.copy()
        e5 = e4.copy()
        p6 = p4.copy()
        e6 = e4.copy()
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        C3 = new M.Constraint( p4, e4 )
        // start with an empty problem
        expect( () => P1 = new M.Problem() ).not.to.throw()
        expect( P1.empty() ).to.equal( true )
        expect( P1.length ).to.equal( 0 )
        expect( P1.constraints.some( C => C.equals( C1 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C2 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        // add the first two constraints
        expect( () => P2 = P1.plus( [ p1, e1, p2, e2 ] ) ).not.to.throw()
        expect( P2 ).not.to.equal( P1 )
        expect( P2.empty() ).to.equal( false )
        expect( P2.length ).to.equal( 2 )
        expect( P2.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P2.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P2.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        // add the next two constraints
        expect( () => P3 = P2.plus( [ p3, e3, p4, e4 ] ) ).not.to.throw()
        expect( P3 ).not.to.equal( P2 )
        expect( P3.empty() ).to.equal( false )
        expect( P3.length ).to.equal( 3 )
        expect( P3.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        // add the final two constraints
        expect( () => P4 = P3.plus( [ p5, e5, p6, e6 ] ) ).not.to.throw()
        expect( P4 ).not.to.equal( P3 )
        expect( P4.empty() ).to.equal( false )
        expect( P4.length ).to.equal( 3 )
        expect( P4.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )

        // same as first test, but breaking each constraint into its p,e
        // components, and using .plus( [ [ p1, e1 ], ... ] )
        p1 = new Symbol( 'A' ).asA( M.metavariable ),
        e1 = new Symbol( 5 )
        p2 = LogicConcept.fromPutdown( '(- 12 (+ k 1))' )[0]
        e2 = LogicConcept.fromPutdown( '(- 3 (+ K 11))' )[0]
        p3 = new Symbol( 'x' )
        e3 = new Symbol( 'z' )
        p4 = p2.copy()
        e4 = e2.copy()
        C1 = new M.Constraint( p1, e1 )
        C2 = new M.Constraint( p2, e2 )
        C3 = new M.Constraint( p3, e3 )
        C4 = new M.Constraint( p4, e4 )
        // an empty problem
        expect( () => P1 = new M.Problem() ).not.to.throw()
        expect( P1.empty() ).to.equal( true )
        expect( P1.length ).to.equal( 0 )
        expect( P1.constraints.some( C => C.equals( C1 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C2 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        expect( P1.constraints.some( C => C.equals( C4 ) ) ).to.equal( false )
        // add first constraint
        expect( () => P2 = P1.plus( [ [ p1, e1 ] ] ) ).not.to.throw()
        expect( P2 ).not.to.equal( P1 )
        expect( P2.empty() ).to.equal( false )
        expect( P2.length ).to.equal( 1 )
        expect( P2.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P2.constraints.some( C => C.equals( C2 ) ) ).to.equal( false )
        expect( P2.constraints.some( C => C.equals( C3 ) ) ).to.equal( false )
        expect( P2.constraints.some( C => C.equals( C4 ) ) ).to.equal( false )
        // add next two constraints
        expect( () => P3 = P2.plus( [ [ p2, e2 ], [ p3, e3 ] ] ) ).not.to.throw()
        expect( P3 ).not.to.equal( P2 )
        expect( P3.empty() ).to.equal( false )
        expect( P3.length ).to.equal( 3 )
        expect( P3.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P3.constraints.some( C => C.equals( C4 ) ) ).to.equal( true ) // C2==C4
        // add final constraint
        expect( () => P4 = P3.plus( [ [ p4, e4 ] ] ) ).not.to.throw()
        expect( P4 ).not.to.equal( P3 )
        expect( P4.empty() ).to.equal( false )
        expect( P4.length ).to.equal( 3 )
        expect( P4.constraints.some( C => C.equals( C1 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C2 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C3 ) ) ).to.equal( true )
        expect( P4.constraints.some( C => C.equals( C4 ) ) ).to.equal( true )
    } )

    it( 'Should preserve increasing complexity ordering of constraints', () => {
        // create several constraints, at least one of each complexity level,
        // and more than one of some complexity levels.
        let C1, C2, C3, C4, C5, C6, C7
        C1 = new M.Constraint( new Symbol( 1 ), new Symbol( 2 ) )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (this thingy here is just)
            ("not equal to" this (other thingy) here)
        ` ) )
        C3 = new M.Constraint( ...LogicConcept.fromPutdown( 'same same' ) )
        C4 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (one large , (expression "and its" (twin twin) sister))
            (one large , (expression "and its" (twin twin) sister))
        ` ) )
        C5 = new M.Constraint(
            new Symbol( 'metavar' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(instantiation of that metavar)' )[0]
        )
        C6 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (the children of this one must match)
            (the children of this second one here)
        ` ) )
        C6.pattern.child( 1 ).makeIntoA( M.metavariable )
        C7 = new M.Constraint(
            M.newEFA( new Symbol( 'P' ).asA( M.metavariable ), new Symbol( 2 ) ),
            LogicConcept.fromPutdown( '(("some") (structure))' )[0]
        )
        expect( C1.complexity() ).to.equal( 0 )
        expect( C2.complexity() ).to.equal( 0 )
        expect( C3.complexity() ).to.equal( 1 )
        expect( C4.complexity() ).to.equal( 1 )
        expect( C5.complexity() ).to.equal( 2 )
        expect( C6.complexity() ).to.equal( 3 )
        expect( C7.complexity() ).to.equal( 4 )
        // now try inserting various combinations of them into various problem
        // instances, and ensure they always show up in an order that is a
        // suborder of C1,C2,C3,C4,C5,C6,C7, with the exceptions that C1,C2 are
        // interchangeable, as are C3,C4.
        let P
        // set 1, default ordering:
        P = new M.Problem( C1, C4, C7 )
        expect( P.length ).to.equal( 3 )
        expect( P.constraints[0].equals( C1 ) ).to.equal( true )
        expect( P.constraints[1].equals( C4 ) ).to.equal( true )
        expect( P.constraints[2].equals( C7 ) ).to.equal( true )
        // set 1, new ordering:
        P = new M.Problem( C4, C7, C1 )
        expect( P.length ).to.equal( 3 )
        expect( P.constraints[0].equals( C1 ) ).to.equal( true )
        expect( P.constraints[1].equals( C4 ) ).to.equal( true )
        expect( P.constraints[2].equals( C7 ) ).to.equal( true )
        // set 2, default ordering:
        P = new M.Problem( C3, C4, C5 )
        expect( P.length ).to.equal( 3 )
        expect( P.constraints[0].equals( C4 ) ).to.equal( true )
        expect( P.constraints[1].equals( C3 ) ).to.equal( true )
        expect( P.constraints[2].equals( C5 ) ).to.equal( true )
        // set 2, new ordering:
        P = new M.Problem( C5, C4, C3 )
        expect( P.length ).to.equal( 3 )
        expect( P.constraints[0].equals( C3 ) ).to.equal( true )
        expect( P.constraints[1].equals( C4 ) ).to.equal( true )
        expect( P.constraints[2].equals( C5 ) ).to.equal( true )
        // set 3, default ordering:
        P = new M.Problem( C2, C6 )
        expect( P.length ).to.equal( 2 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C6 ) ).to.equal( true )
        // set 3, new ordering:
        P = new M.Problem( C6, C2 )
        expect( P.length ).to.equal( 2 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C6 ) ).to.equal( true )
        // full set, default ordering:
        P = new M.Problem( C1, C2, C3, C4, C5, C6, C7 )
        expect( P.length ).to.equal( 7 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C3 ) ).to.equal( true )
        expect( P.constraints[4].equals( C5 ) ).to.equal( true )
        expect( P.constraints[5].equals( C6 ) ).to.equal( true )
        expect( P.constraints[6].equals( C7 ) ).to.equal( true )
        // full set, new ordering:
        P = new M.Problem( C3, C7, C5, C4, C2, C6, C1 )
        expect( P.length ).to.equal( 7 )
        expect( P.constraints[0].equals( C1 ) ).to.equal( true )
        expect( P.constraints[1].equals( C2 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C3 ) ).to.equal( true )
        expect( P.constraints[4].equals( C5 ) ).to.equal( true )
        expect( P.constraints[5].equals( C6 ) ).to.equal( true )
        expect( P.constraints[6].equals( C7 ) ).to.equal( true )
    } )

    it( 'Should remove constraints correctly, even using without()', () => {
        // re-use the same set of 7 constraints from the previous test function
        let C1, C2, C3, C4, C5, C6, C7
        C1 = new M.Constraint( new Symbol( 1 ), new Symbol( 2 ) )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (this thingy here is just)
            ("not equal to" this (other thingy) here)
        ` ) )
        C3 = new M.Constraint( ...LogicConcept.fromPutdown( 'same same' ) )
        C4 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (one large , (expression "and its" (twin twin) sister))
            (one large , (expression "and its" (twin twin) sister))
        ` ) )
        C5 = new M.Constraint(
            new Symbol( 'metavar' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(instantiation of that metavar)' )[0]
        )
        C6 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (the children of this one must match)
            (the children of this second one here)
        ` ) )
        C6.pattern.child( 1 ).makeIntoA( M.metavariable )
        C7 = new M.Constraint(
            M.newEFA( new Symbol( 'P' ).asA( M.metavariable ), new Symbol( 2 ) ),
            LogicConcept.fromPutdown( '(("some") (structure))' )[0]
        )
        // build one of the large problems from the previous test function,
        // and ensure it looks just like it did in that case
        let P, Q
        P = new M.Problem( C1, C2, C3, C4, C5, C6, C7 )
        expect( P.length ).to.equal( 7 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C3 ) ).to.equal( true )
        expect( P.constraints[4].equals( C5 ) ).to.equal( true )
        expect( P.constraints[5].equals( C6 ) ).to.equal( true )
        expect( P.constraints[6].equals( C7 ) ).to.equal( true )
        // remove a constraint and ensure P has changed
        P.remove( C3 )
        expect( P.length ).to.equal( 6 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C5 ) ).to.equal( true )
        expect( P.constraints[4].equals( C6 ) ).to.equal( true )
        expect( P.constraints[5].equals( C7 ) ).to.equal( true )
        // remove a constraint by index and ensure P has changed
        P.remove( 4 )
        expect( P.length ).to.equal( 5 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C5 ) ).to.equal( true )
        expect( P.constraints[4].equals( C7 ) ).to.equal( true )
        // remove a nonexistent constraint and ensure no changes
        P.remove( C6 )
        expect( P.length ).to.equal( 5 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C5 ) ).to.equal( true )
        expect( P.constraints[4].equals( C7 ) ).to.equal( true )
        // remove invalid indices and ensure no changes
        P.remove( -1 )
        expect( P.length ).to.equal( 5 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C5 ) ).to.equal( true )
        expect( P.constraints[4].equals( C7 ) ).to.equal( true )
        P.remove( 30 )
        expect( P.length ).to.equal( 5 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C5 ) ).to.equal( true )
        expect( P.constraints[4].equals( C7 ) ).to.equal( true )
        // make a copy of P without some entries (indicated by indices)
        // and ensure it works, and that P has not changed
        Q = P.without( 1 ).without( 0 )
        expect( Q ).not.to.equal( P )
        expect( P.length ).to.equal( 5 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C5 ) ).to.equal( true )
        expect( P.constraints[4].equals( C7 ) ).to.equal( true )
        expect( Q.length ).to.equal( 3 )
        expect( Q.constraints[0].equals( C4 ) ).to.equal( true )
        expect( Q.constraints[1].equals( C5 ) ).to.equal( true )
        expect( Q.constraints[2].equals( C7 ) ).to.equal( true )
        // similar to the previous, but this time removing constraints rather
        // than just indices
        Q = P.without( C1 ).without( C5 )
        expect( Q ).not.to.equal( P )
        expect( P.length ).to.equal( 5 )
        expect( P.constraints[0].equals( C2 ) ).to.equal( true )
        expect( P.constraints[1].equals( C1 ) ).to.equal( true )
        expect( P.constraints[2].equals( C4 ) ).to.equal( true )
        expect( P.constraints[3].equals( C5 ) ).to.equal( true )
        expect( P.constraints[4].equals( C7 ) ).to.equal( true )
        expect( Q.length ).to.equal( 3 )
        expect( Q.constraints[0].equals( C2 ) ).to.equal( true )
        expect( Q.constraints[1].equals( C4 ) ).to.equal( true )
        expect( Q.constraints[2].equals( C7 ) ).to.equal( true )
    } )

    it( 'Should compare problems for equality correctly', () => {
        // re-use the same set of 7 constraints from the previous test function
        let C1, C2, C3, C4, C5, C6, C7
        C1 = new M.Constraint( new Symbol( 1 ), new Symbol( 2 ) )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (this thingy here is just)
            ("not equal to" this (other thingy) here)
        ` ) )
        C3 = new M.Constraint( ...LogicConcept.fromPutdown( 'same same' ) )
        C4 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (one large , (expression "and its" (twin twin) sister))
            (one large , (expression "and its" (twin twin) sister))
        ` ) )
        C5 = new M.Constraint(
            new Symbol( 'metavar' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(instantiation of that metavar)' )[0]
        )
        C6 = new M.Constraint( ...LogicConcept.fromPutdown( `
            (the children of this one must match)
            (the children of this second one here)
        ` ) )
        C6.pattern.child( 1 ).makeIntoA( M.metavariable )
        C7 = new M.Constraint(
            M.newEFA( new Symbol( 'P' ).asA( M.metavariable ), new Symbol( 2 ) ),
            LogicConcept.fromPutdown( '(("some") (structure))' )[0]
        )
        // make several problems with various combinations of the constraints
        let P1, P2, P3, P4, P5
        P1 = new M.Problem( C1, C3, C5 )
        P2 = new M.Problem( C2, C3, C4 )
        P3 = new M.Problem( C3, C1, C5, C3 )
        P4 = new M.Problem( C3, C6, C7 )
        P5 = new M.Problem( C7, C3, C6 )
        // test all possible pairs for equality
        expect( P1.equals( P1 ) ).to.equal( true )
        expect( P1.equals( P2 ) ).to.equal( false )
        expect( P1.equals( P3 ) ).to.equal( true )
        expect( P1.equals( P4 ) ).to.equal( false )
        expect( P1.equals( P5 ) ).to.equal( false )
        expect( P2.equals( P1 ) ).to.equal( false )
        expect( P2.equals( P2 ) ).to.equal( true )
        expect( P2.equals( P3 ) ).to.equal( false )
        expect( P2.equals( P4 ) ).to.equal( false )
        expect( P2.equals( P5 ) ).to.equal( false )
        expect( P3.equals( P1 ) ).to.equal( true )
        expect( P3.equals( P2 ) ).to.equal( false )
        expect( P3.equals( P3 ) ).to.equal( true )
        expect( P3.equals( P4 ) ).to.equal( false )
        expect( P3.equals( P5 ) ).to.equal( false )
        expect( P4.equals( P1 ) ).to.equal( false )
        expect( P4.equals( P2 ) ).to.equal( false )
        expect( P4.equals( P3 ) ).to.equal( false )
        expect( P4.equals( P4 ) ).to.equal( true )
        expect( P4.equals( P5 ) ).to.equal( true )
        expect( P5.equals( P1 ) ).to.equal( false )
        expect( P5.equals( P2 ) ).to.equal( false )
        expect( P5.equals( P3 ) ).to.equal( false )
        expect( P5.equals( P4 ) ).to.equal( true )
        expect( P5.equals( P5 ) ).to.equal( true )
    } )

    it( 'Should make shallow copies correctly', () => {
        // re-use a few of the constraints from the previous test function
        let C1, C2, C3, C4
        C1 = new M.Constraint( new Symbol( 1 ), new Symbol( 2 ) )
        C2 = new M.Constraint( ...LogicConcept.fromPutdown( 'same same' ) )
        C3 = new M.Constraint(
            new Symbol( 'metavar' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(instantiation of that metavar)' )[0]
        )
        C4 = new M.Constraint(
            M.newEFA( new Symbol( 'P' ).asA( M.metavariable ), new Symbol( 2 ) ),
            LogicConcept.fromPutdown( '(("some") (structure))' )[0]
        )
        // make some problems using those constraints
        let P1, P2, P3, P4
        P1 = new M.Problem( C1, C2, C3 )
        P2 = new M.Problem( C2, C4 )
        // make copies and verify that they are the same structurally, but not
        // the same objects in memory
        expect( () => P3 = P1.copy() ).not.to.throw()
        expect( () => P4 = P2.copy() ).not.to.throw()
        expect( P3 ).not.to.equal( P1 )
        expect( P4 ).not.to.equal( P2 )
        expect( P1.length ).to.equal( P3.length )
        expect( P2.length ).to.equal( P4.length )
        expect( P1.equals( P3 ) ).to.equal( true )
        expect( P2.equals( P4 ) ).to.equal( true )
        expect( P3.equals( P1 ) ).to.equal( true )
        expect( P4.equals( P2 ) ).to.equal( true )
        // ensure they contain the exact same constraint objects in the same
        // order, since these are just shallow copies
        expect( P1.length ).to.equal( 3 )
        expect( P1.constraints[0] ).to.equal( P3.constraints[0] )
        expect( P1.constraints[1] ).to.equal( P3.constraints[1] )
        expect( P1.constraints[2] ).to.equal( P3.constraints[2] )
        expect( P2.length ).to.equal( 2 )
        expect( P2.constraints[0] ).to.equal( P4.constraints[0] )
        expect( P2.constraints[1] ).to.equal( P4.constraints[1] )
    } )

    it( 'Should correctly judge whether it can be applied', () => {
        // create a Problem that can be applied and check that it can
        let X = new Symbol( 'X' ).asA( M.metavariable )
        let Y = new Symbol( 'Y' ).asA( M.metavariable )
        let C1 = new M.Constraint(
            X.copy(),
            LogicConcept.fromPutdown( '(exp (- x))' )[0]
        )
        let C2 = new M.Constraint(
            Y.copy(),
            LogicConcept.fromPutdown( 'yes +{"color":"yellow"}' )[0]
        )
        let C3 = new M.Constraint(
            new Symbol( 'will not appear' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(so you will never see this)' )[0]
        )
        const Prob = new M.Problem( C1, C2, C3 )
        expect( Prob.canBeApplied() ).to.equal( true )
        // ensure that empty Problems can be appied
        expect( new M.Problem().canBeApplied() ).to.equal( true )
        // create a Constraint that can't be applied and verify that adding it
        // to either of the above problems spoils their ability to be applied
        let badC = new M.Constraint( ...LogicConcept.fromPutdown( `
            (this is not a single metavariable)
            (nor is this but that does not matter)
        ` ) )
        expect( Prob.plus( badC ).canBeApplied() ).to.equal( false )
        expect( new M.Problem( badC ).canBeApplied() ).to.equal( false )
    } )

    it( 'Should apply itself correctly in-place or functionally', () => {
        // create a Problem that can be applied (same as in previous test)
        let X = new Symbol( 'X' ).asA( M.metavariable )
        let Y = new Symbol( 'Y' ).asA( M.metavariable )
        let C1 = new M.Constraint(
            X.copy(),
            LogicConcept.fromPutdown( '(exp (- x))' )[0]
        )
        let C2 = new M.Constraint(
            Y.copy(),
            LogicConcept.fromPutdown( 'yes +{"color":"yellow"}' )[0]
        )
        let C3 = new M.Constraint(
            new Symbol( 'will not appear' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(so you will never see this)' )[0]
        )
        const Prob = new M.Problem( C1, C2, C3 )
        // create three patterns to which to apply it, and copies of each
        let P1 = new Application( new Symbol( 'f' ), X.copy() )
        let P2 = new Binding( new Symbol( '𝝺' ), new Symbol( 'v' ),
            new Application( Y.copy(), new Symbol( 'v' ), X.copy() ) )
        let P3 = new Environment( X.copy(), Y.copy() )
        const P1copy = P1.copy()
        const P2copy = P2.copy()
        const P3copy = P3.copy()
        expect( P1.equals( P1copy ) ).to.equal( true )
        expect( P2.equals( P2copy ) ).to.equal( true )
        expect( P3.equals( P3copy ) ).to.equal( true )
        // create expected results after applying the constraint
        const newP1 = LogicConcept.fromPutdown( '(f (exp (- x)))' )[0]
        const newP2 = LogicConcept.fromPutdown( `
            (𝝺 v ,
                ("yes" +{"color":"yellow"}
                v (exp (- x)))
            )
        ` )[0]
        const newP3 = LogicConcept.fromPutdown( ` {
            (exp (- x))
            "yes" +{"color":"yellow"}
        } `)[0]
        // apply Prob to P1 in place and ensure the result is as expected
        // and P1 is no longer equal to P1copy
        expect( () => Prob.applyTo( P1 ) ).not.to.throw()
        expect( P1.equals( P1copy ) ).to.equal( false )
        expect( P1.equals( newP1 ) ).to.equal( true )
        // repeat same experiment for P2 and P2copy
        expect( () => Prob.applyTo( P2 ) ).not.to.throw()
        expect( P2.equals( P2copy ) ).to.equal( false )
        expect( P2.equals( newP2 ) ).to.equal( true )
        // repeat same experiment for P3 and P3copy
        expect( () => Prob.applyTo( P3 ) ).not.to.throw()
        expect( P3.equals( P3copy ) ).to.equal( false )
        expect( P3.equals( newP3 ) ).to.equal( true )
        // make new targets from the backup copies we saved of P1,P2,P3
        let P1_2 = P1copy.copy()
        let P2_2 = P2copy.copy()
        let P3_2 = P3copy.copy()
        // apply Prob functionally (not in place) to those three, saving the
        // results as new expressions, then ensure that no change took place
        // in any of those originals
        const applied1 = Prob.appliedTo( P1_2 )
        const applied2 = Prob.appliedTo( P2_2 )
        const applied3 = Prob.appliedTo( P3_2 )
        expect( P1copy.equals( P1_2 ) ).to.equal( true )
        expect( P2copy.equals( P2_2 ) ).to.equal( true )
        expect( P3copy.equals( P3_2 ) ).to.equal( true )
        // then ensure that the results computed this way are the same as the
        // results computed with the in-place applyTo(), which were verified
        // above to be correct
        expect( applied1.equals( P1 ) ).to.equal( true )
        expect( applied2.equals( P2 ) ).to.equal( true )
        expect( applied3.equals( P3 ) ).to.equal( true )
        // ensure that Prob cannot be applied in-place to a Constraint
        let badTarget = new M.Constraint( P1.copy(),
            LogicConcept.fromPutdown( '(hello there "friend")' )[0] )
        expect( () => Prob.applyTo( badTarget ) ).to.throw(
            /^Cannot apply a constraint to that/ )
        // but it is okay to apply not-in-place to a Constraint, thus creating
        // a new, altered copy
        let substituted
        expect( () => substituted = Prob.appliedTo( badTarget ) ).not.to.throw()
        expect( substituted.pattern.equals( Prob.appliedTo( P1.copy() ) ) )
            .to.equal( true )
        expect( substituted.expression.equals( badTarget.expression ) )
            .to.equal( true )
        // ensure that Prob can be applied to another Problem in-place
        let probTarget = new M.Problem()
        const E1 = LogicConcept.fromPutdown( '(an appli cation)' )[0]
        const E2 = LogicConcept.fromPutdown( '(a bin , ding)' )[0]
        probTarget.add( P1copy, E1, P2copy, E2 )
        expect( probTarget.constraints.length ).to.equal( 2 )
        expect( probTarget.constraints.some( constraint =>
            constraint.pattern.equals( P1copy ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( probTarget.constraints.some( constraint =>
            constraint.pattern.equals( P2copy ) && constraint.expression.equals( E2 )
        ) ).to.equal( true )
        expect( () => Prob.applyTo( probTarget ) ).not.to.throw()
        expect( probTarget.constraints.length ).to.equal( 2 )
        expect( probTarget.constraints.some( constraint =>
            constraint.pattern.equals( newP1 ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( probTarget.constraints.some( constraint =>
            constraint.pattern.equals( newP2 ) && constraint.expression.equals( E2 )
        ) ).to.equal( true )
        // ensure that Prob can be applied to a problem to make a copy
        probTarget = new M.Problem()
        probTarget.add( P1copy, E1, P2copy, E2 )
        expect( probTarget.constraints.length ).to.equal( 2 )
        expect( probTarget.constraints.some( constraint =>
            constraint.pattern.equals( P1copy ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( probTarget.constraints.some( constraint =>
            constraint.pattern.equals( P2copy ) && constraint.expression.equals( E2 )
        ) ).to.equal( true )
        let probNew
        expect( () => probNew = Prob.appliedTo( probTarget ) ).not.to.throw()
        expect( probTarget.constraints.length ).to.equal( 2 )
        expect( probTarget.constraints.some( constraint =>
            constraint.pattern.equals( P1copy ) && constraint.expression.equals( E1 )
        ) ).to.equal( true )
        expect( probTarget.constraints.some( constraint =>
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

    it( 'Should correctly compute and cache capture constraints', () => {
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
        // Compute the capture constraints for P and ensure they are as expected
        let CCs
        expect( () => CCs = P.captureConstraints() ).not.to.throw()
        expect( CCs ).to.be.instanceof( M.CaptureConstraints )
        expect( CCs.empty() ).to.equal( false )
        expect( CCs.constraints.length ).to.equal( 4 )
        expect( CCs.constraints[0].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '∃' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[1].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '=' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[2].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '+' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[3].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '1' )
        ) ) ).to.equal( true )
        // Now ask it for the capture constraints again, and ensure the value
        // was cached, not recomputed--the resulting object is the exact same
        // object that it was before
        expect( P.captureConstraints() ).to.equal( CCs )

        // Now do the degenerate case--an empty problem has no capture
        // constraints, but still caches that value
        const emptyP = new M.Problem()
        expect( () => CCs = emptyP.captureConstraints() ).not.to.throw()
        expect( CCs ).to.be.instanceof( M.CaptureConstraints )
        expect( CCs.empty() ).to.equal( true )
        expect( CCs.constraints.length ).to.equal( 0 )
        expect( emptyP.captureConstraints() ).to.equal( CCs )
    } )

    xit( 'Should correctly invalidate the capture constraints cache', () => {
        // Repeat the same first test from the previous function, except at the
        // end we will invalidate the cache...
        // 1. construct the test
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
        // 2. compute capture constraints and ensure correctness
        let CCs
        expect( () => CCs = P.captureConstraints() ).not.to.throw()
        expect( CCs ).to.be.instanceof( M.CaptureConstraints )
        expect( CCs.empty() ).to.equal( false )
        expect( CCs.constraints.length ).to.equal( 4 )
        expect( CCs.constraints[0].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '∃' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[1].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '=' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[2].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '+' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[3].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '1' )
        ) ) ).to.equal( true )
        // Here's the new part: Invalidate the cache by removing the simpler
        // constraint, which has no impact on the capture constraints, but it
        // will invalidate the cache.
        expect( P.length ).to.equal( 2 )
        expect( P._captureConstraints ).to.be.ok // cache exists
        expect( () => P.remove( C2 ) ).not.to.throw()
        expect( P.length ).to.equal( 1 )
        expect( P._captureConstraints ).not.to.be.ok // cache cleared
        // And yet when we ask for the capture constraints again, they are
        // recomputed correctly.
        expect( () => CCs = P.captureConstraints() ).not.to.throw()
        expect( CCs ).to.be.instanceof( M.CaptureConstraints )
        expect( CCs.empty() ).to.equal( false )
        expect( CCs.constraints.length ).to.equal( 4 )
        expect( CCs.constraints[0].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '∃' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[1].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '=' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[2].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '+' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[3].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ), new Symbol( '1' )
        ) ) ).to.equal( true )
        // And if we remove yet another constraint, the process repeats, but now
        // giving us no capture constraints, because the problem is empty.
        expect( P.length ).to.equal( 1 )
        expect( P._captureConstraints ).to.be.ok // cache exists
        expect( () => P.remove( 0 ) ).not.to.throw()
        expect( P.length ).to.equal( 0 )
        expect( P._captureConstraints ).not.to.be.ok // cache cleared
        expect( () => CCs = P.captureConstraints() ).not.to.throw()
        expect( CCs ).to.be.instanceof( M.CaptureConstraints )
        expect( CCs.empty() ).to.equal( true )
        expect( CCs.constraints.length ).to.equal( 0 )
        expect( P.captureConstraints() ).to.equal( CCs )

        // Now repeat test 2 from the previous function, but this time we'll
        // subsequently add constraints and expect the cache to be invalidated,
        // so that recomputing capture constraints takes the new constraints
        // into account.
        // first, repeat the old test:
        const emptyP = new M.Problem()
        expect( () => CCs = emptyP.captureConstraints() ).not.to.throw()
        expect( CCs ).to.be.instanceof( M.CaptureConstraints )
        expect( CCs.empty() ).to.equal( true )
        expect( CCs.constraints.length ).to.equal( 0 )
        expect( emptyP.captureConstraints() ).to.equal( CCs )
        // now, add a constraint:
        const pat3 = LogicConcept.fromPutdown( '(sum i , (subscript X i))' )[0]
        pat3.child( 1 ).makeIntoA( M.metavariable ) // outer i
        pat3.index( [ 2, 2 ] ).makeIntoA( M.metavariable ) // inner i
        pat3.index( [ 2, 1 ] ).makeIntoA( M.metavariable ) // X
        const C3 = new M.Constraint(
            pat3,
            LogicConcept.fromPutdown( '(sum k , (subscript (union A B) k))' )[0]
        )
        expect( emptyP.length ).to.equal( 0 )
        expect( emptyP._captureConstraints ).to.be.ok // cache exists
        expect( () => emptyP.add( C3 ) ).not.to.throw()
        expect( emptyP.length ).to.equal( 1 )
        expect( emptyP._captureConstraints ).not.to.be.ok // cache cleared
        // And now when we compute a set of capture constraints, we get the
        // correct (non-empty) result.
        expect( () => CCs = emptyP.captureConstraints() ).not.to.throw()
        expect( CCs ).to.be.instanceof( M.CaptureConstraints )
        expect( CCs.empty() ).to.equal( false )
        expect( CCs.constraints.length ).to.equal( 2 )
        expect( CCs.constraints[0].equals( new M.CaptureConstraint(
            new Symbol( 'i' ).asA( M.metavariable ), new Symbol( 'subscript' )
        ) ) ).to.equal( true )
        expect( CCs.constraints[1].equals( new M.CaptureConstraint(
            new Symbol( 'i' ).asA( M.metavariable ),
            new Symbol( 'X' ).asA( M.metavariable )
        ) ) ).to.equal( true )
    } )

    xit( 'Should not invalidate cache when copying', () => {
        // We will make this straightforward by testing it with a simple case
        const pat = LogicConcept.fromPutdown( '(quantifier outer , inner)' )[0]
        pat.child( 1 ).makeIntoA( M.metavariable ) // outer
        const prob = new M.Problem( new M.Constraint(
            pat,
            LogicConcept.fromPutdown( '(quantifier a , inner)' )[0]
        ) )
        // compute capture constraints and compare to expectations
        let CCs
        expect( () => CCs = prob.captureConstraints() ).not.to.throw()
        expect( CCs ).to.be.instanceof( M.CaptureConstraints )
        expect( CCs.empty() ).to.equal( false )
        expect( CCs.constraints.length ).to.equal( 1 )
        expect( CCs.constraints[0].equals( new M.CaptureConstraint(
            new Symbol( 'outer' ).asA( M.metavariable ), new Symbol( 'inner' )
        ) ) ).to.equal( true )
        // make a copy of the problem and ensure that:
        // 1. the original didn't change its cache at all
        // 2. the copy has a deep copy of the same cache
        const probCopy = prob.copy()
        expect( prob._captureConstraints ).to.equal( CCs )
        const CCsInCopy = probCopy._captureConstraints
        expect( CCsInCopy ).to.be.ok
        expect( CCsInCopy ).not.to.equal( CCs )
        expect( CCsInCopy.constraints.length ).to.equal( 1 )
        expect( CCsInCopy.constraints[0].equals( CCs.constraints[0] ) )
            .to.equal( true )
        // now make a copy of the original by .without(), which deletes as it
        // copies, and ensure that:
        // 1. the original didn't change its cache at all
        // 2. the copy has no cache at all, because remove() was called in it
        // 3. the copy computes its capture constraints correctly, if asked
        const probWO = prob.without( prob.constraints[0] )
        expect( prob._captureConstraints ).to.be.ok
        expect( prob._captureConstraints ).to.equal( CCs )
        expect( probWO._captureConstraints ).not.to.be.ok
        expect( probWO.captureConstraints() ).to.be.ok
        expect( probWO.captureConstraints().empty() ).to.equal( true )
        // now make a copy of probCopy by .plus(), which adds as it
        // copies, and ensure that:
        // 1. the original didn't change its cache at all
        // 2. the copy has no cache at all, because add() was called in it
        // 3. the copy computes its capture constraints correctly, if asked
        const probPlus = probCopy.plus( new M.Constraint(
            new Symbol( 1 ), new Symbol( 2 )
        ) )
        expect( probCopy._captureConstraints ).to.be.ok
        expect( probCopy._captureConstraints ).to.equal( CCsInCopy )
        expect( probPlus._captureConstraints ).not.to.be.ok
        const CCsInPlus = probPlus.captureConstraints()
        expect( CCsInPlus ).to.be.ok
        expect( CCsInPlus.constraints.length ).to.equal( 1 )
        expect( CCsInPlus.constraints[0].equals( CCs.constraints[0] ) )
            .to.equal( true )
    } )

    it( 'Should know when its capture constraints are violated', () => {
        // Repeat the first problem and capture constraints setup from an
        // earlier test.  No capture constraints are violated here.
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
        expect( P.avoidsCapture() ).to.equal( true )

        // What about an empty Problem?  Should definitely avoid capture.
        const emptyP = new M.Problem()
        expect( emptyP.avoidsCapture() ).to.equal( true )

        // But if we create a problem that includes variable capture, it should
        // notice this.  Start with one that doesn't have any capture:
        const pat3 = LogicConcept.fromPutdown( '(∀ x , P)' )[0]
        pat3.child( 1 ).makeIntoA( M.metavariable ) // the x
        pat3.child( 2 ).makeIntoA( M.metavariable ) // the P
        const uhOh = new M.Problem(
            pat3, LogicConcept.fromPutdown( '(∀ t, Q)' )[0]
        )
        // Ensure its constraints are what you'd expect and it avoids capture:
        let CCs
        CCs = uhOh.captureConstraints()
        expect( CCs.constraints.length ).to.equal( 1 )
        expect( CCs.constraints[0].equals( new M.CaptureConstraint(
            new Symbol( 'x' ).asA( M.metavariable ),
            new Symbol( 'P' ).asA( M.metavariable )
        ) ) )
        expect( uhOh.avoidsCapture() ).to.equal( true )
        // Now make a substitution that could create variable capture, but does
        // not yet do so, because we have not yet instantiated x:
        const subst1 = new M.Constraint(
            new Symbol( 'P' ).asA( M.metavariable ),
            LogicConcept.fromPutdown( '(f t)' )[0]
        )
        subst1.applyTo( uhOh )
        // Ensure the constraints changed appropriately and yet capture has
        // still not yet happened:
        CCs = uhOh.captureConstraints()
        expect( CCs.constraints.length ).to.equal( 1 )
        expect( CCs.constraints[0].bound.equals(
            new Symbol( 'x' ).asA( M.metavariable ) ) ).to.equal( true )
        expect( CCs.constraints[0].free.equals(
            LogicConcept.fromPutdown( '(f t)' )[0] ) ).to.equal( true )
        expect( uhOh.avoidsCapture() ).to.equal( true )
        // Now make a substitution that does create variable capture:
        const subst2 = new M.Constraint(
            new Symbol( 'x' ).asA( M.metavariable ),
            new Symbol( 't' )
        )
        subst2.applyTo( uhOh )
        // Ensure the constraints changed appropriately and capture happened:
        CCs = uhOh.captureConstraints()
        expect( CCs.constraints.length ).to.equal( 1 )
        expect( CCs.constraints[0].bound.equals( new Symbol( 't' ) ) )
            .to.equal( true )
        expect( CCs.constraints[0].free.equals(
            LogicConcept.fromPutdown( '(f t)' )[0] ) ).to.equal( true )
        expect( uhOh.avoidsCapture() ).to.equal( false )
    } )

    it( 'Should compute correct solutions to trivial problems', () => {
        let P, S, expr1, expr2, pat1

        // problem: empty problem
        // solution set: one solution, the empty solution
        P = new M.Problem()
        expect( () => S = Array.from( P.allSolutions() ) ).not.to.throw()
        expect( S ).to.be.instanceof( Array )
        expect( S.length ).to.equal( 1 )
        expect( S[0] ).to.be.instanceof( M.Problem )
        expect( S[0].empty() ).to.equal( true )

        // problem: one constraint, (expr1,expr1) (no metavars)
        // solution set: one solution, the empty solution
        expr1 = LogicConcept.fromPutdown( '(an example)' )[0]
        P = new M.Problem( expr1, expr1 )
        expect( () => S = Array.from( P.allSolutions() ) ).not.to.throw()
        expect( S ).to.be.instanceof( Array )
        expect( S.length ).to.equal( 1 )
        expect( S[0] ).to.be.instanceof( M.Problem )
        expect( S[0].empty() ).to.equal( true )
        
        // problem: one constraint, (expr1,expr2) (no metavars, not equal)
        // solution set: one solution, the empty solution
        expr2 = new Symbol( 'not_the_same' )
        P = new M.Problem( expr1, expr2 )
        expect( () => S = Array.from( P.allSolutions() ) ).not.to.throw()
        expect( S ).to.be.instanceof( Array )
        expect( S.length ).to.equal( 0 )
        
        // problem: one constraint, (pat1,expr1) (with pat1 a metavar)
        // solution set: one solution, the solution (pat1,expr1)
        pat1 = new Symbol( 'foo' ).asA( M.metavariable )
        P = new M.Problem( pat1, expr1 )
        expect( () => S = Array.from( P.allSolutions() ) ).not.to.throw()
        expect( S ).to.be.instanceof( Array )
        expect( S.length ).to.equal( 1 )
        expect( S[0] ).to.be.instanceof( M.Problem )
        expect( S[0].length ).to.equal( 1 )
        expect( S[0].constraints[0].pattern.equals( pat1 ) ).to.equal( true )
        expect( S[0].constraints[0].expression.equals( expr1 ) ).to.equal( true )

        // problem: one constraint, but its pattern and expression are both
        // compound and have the same number of children, thus enabling us to
        // combine multiple constraints into one; here we choose just one
        // example of this type, ((expr1 pat1),(expr1 expr2))
        // solution set: one solution, the solution (pat1,expr2)
        P = new M.Problem(
            new Application( expr1.copy(), pat1.copy() ),
            new Application( expr1.copy(), expr2.copy() )
        )
        expect( () => S = Array.from( P.allSolutions() ) ).not.to.throw()
        expect( S ).to.be.instanceof( Array )
        expect( S.length ).to.equal( 1 )
        expect( S[0] ).to.be.instanceof( M.Problem )
        expect( S[0].length ).to.equal( 1 )
        expect( S[0].constraints[0].pattern.equals( pat1 ) ).to.equal( true )
        expect( S[0].constraints[0].expression.equals( expr2 ) ).to.equal( true )
    } )

    it( 'Should compute correct solutions to small EFA problems', () => {
        let pat, expr, prob, S
        // problem: pattern EFA (P 1), expression 1
        // solution set: two solutions, P = lambda v.1 or P = lambda v.v
        pat = M.newEFA( new Symbol( 'P' ).asA( M.metavariable ),
                        new Symbol( 1 ) )
        expr = new Symbol( 1 )
        prob = new M.Problem( pat, expr )
        expect( () => S = Array.from( prob.allSolutions() ) ).not.to.throw()
        expect( S.length ).to.equal( 2 )
        expect( S[0].length ).to.equal( 1 )
        expect( S[0].constraints[0].equals( new M.Constraint(
            new Symbol( 'P' ).asA( M.metavariable ),
            M.newEF( new Symbol( 'v1' ), new Symbol( 1 ) )
        ) ) ).to.equal( true )
        expect( S[1].length ).to.equal( 1 )
        expect( S[1].constraints[0].equals( new M.Constraint(
            new Symbol( 'P' ).asA( M.metavariable ),
            M.newEF( new Symbol( 'v1' ), new Symbol( 'v1' ) )
        ) ) ).to.equal( true )

        // problem: pattern EFA (P 3), expression 1
        // solution set: one solution, P = lambda v.1
        pat = M.newEFA( new Symbol( 'P' ).asA( M.metavariable ),
                        new Symbol( 3 ) )
        expr = new Symbol( 1 )
        prob = new M.Problem( pat, expr )
        expect( () => S = Array.from( prob.allSolutions() ) ).not.to.throw()
        expect( S.length ).to.equal( 1 )
        expect( S[0].length ).to.equal( 1 )
        expect( S[0].constraints[0].equals( new M.Constraint(
            new Symbol( 'P' ).asA( M.metavariable ),
            M.newEF( new Symbol( 'v1' ), new Symbol( 1 ) )
        ) ) ).to.equal( true )

        // problem: pattern EFA (P 1), expression 1=2
        // solution set: two solutions, P = lambda v.v=2 or P = lambda v.1=2

        // problem: pattern EFA (P 3), expression 1=2
        // solution set: one solution, P = lambda v.1=2
        //
        // NOT YET COMPLETE
    } )

    xit( 'Should compute correct solutions for the whole database', () => {
        // to do
    } )

} )
