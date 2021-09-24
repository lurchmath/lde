
import M from '../src/matching.js'
import { Symbol } from '../src/symbol.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Application } from '../src/application.js'

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

    xit( 'Should preserve increasing complexity ordering of constraints', () => {
        // to do
    } )

    xit( 'Should remove constraints correctly, even using without()', () => {
        // to do
        // also test empty and length in each case here
    } )

    xit( 'Should compare problems for equality correctly', () => {
        // to do
    } )

    xit( 'Should make shallow copies correctly', () => {
        // to do
    } )

} )
