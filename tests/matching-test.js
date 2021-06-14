
import { LogicConcept } from '../src/logic-concept.js'
import { Expression } from '../src/expression.js'
import { Binding } from '../src/binding.js'
import { Symbol } from '../src/symbol.js'
import * as Matching from '../src/matching.js'

// We first define a bunch of tools that are useful in the testing below.

// For this test file only, we define some shorthand abbreviations for
// matching-related concepts.
//  - We'll write a symbol _A to mean A, but flagged as a metavariable.
//  - We'll write A_of_B to mean the application of A to B as an
//    expression function.  Note that either A or B or both can begin
//    with an underscore to indicate that they are metavariables, as in
//    _A_of__B.
//  - We'll write lambda to have the usual meaning from the lambda
//    calculus, so putdown of (lambda x , x) is the identity function,
//    as an expression function.
// How to check for such conventions:
const needsMetavariableConversion = expression =>
    expression instanceof Symbol && expression.text().startsWith( '_' )
const needsEFAConversion = expression =>
    expression instanceof Symbol && /_of_/.test( expression.text() )
const lambda = new Symbol( 'lambda' )
const needsLambdaConversion = expression =>
    expression instanceof Binding && expression.head().equals( lambda )
// How to do all conventions at once, recursively, on any Expression:
const applyAllConventions = expression => {
    const convertToMetavariable = symbol =>
        new Symbol( symbol.text().substring( 1 ) ).makeIntoA( 'metavariable' )
    const convertToEFA = symbol => {
        const text = symbol.text()
        const index = text.indexOf( '_of_' )
        return Matching.makeExpressionFunctionApplication(
            applyAllConventions( new Symbol( text.substring( 0, index ) ) ),
            applyAllConventions( new Symbol( text.substring( index + 3 ) ) ) )
    }
    const convertToEF = expression =>
        applyAllConventions( Matching.makeExpressionFunction(
            expression.boundVariables()[0], expression.body() ) )
    if ( needsEFAConversion( expression ) )
        return applyAllConventions( convertToEFA( expression ) )
    if ( needsMetavariableConversion( expression ) )
        return convertToMetavariable( expression )
    if ( needsLambdaConversion( expression ) )
        return applyAllConventions( convertToEF( expression ) )
    expression.descendantsSatisfying( needsEFAConversion )
        .forEach( d => d.replaceWith( convertToEFA( d ) ) )
    expression.descendantsSatisfying( needsLambdaConversion )
        .forEach( d => d.replaceWith( convertToEF( d ) ) )
    expression.descendantsSatisfying( needsMetavariableConversion )
        .forEach( d => d.replaceWith( convertToMetavariable( d ) ) )
    return expression
}

// Given a string, we can parse it in putdown notation, ensure it gave
// a single expression, and then apply the above convention, all in one shot.
const quickExpression = maybeExpr => {
    if ( !( maybeExpr instanceof Expression ) ) {
        const parsed = LogicConcept.fromPutdown( maybeExpr )
        if ( parsed.length != 1 )
            throw 'Multiple LogicConcepts in putdown notation: '
                + maybeExpr
        if ( !( parsed[0] instanceof Expression ) )
            throw 'Parsing did not yield an Expression: ' + maybeExpr
        maybeExpr = parsed[0]
    }
    maybeExpr = applyAllConventions( maybeExpr )
    return maybeExpr
}

// We will want to be able to easily set up and solve MatchingChallenge
// instances.  We will use two global functions to do them, storing the data
// in these global variables.
let challenge
let solutions
// How to set up and solve a matching challenge:
// (Expects a challenge of the form {(p1,e1),...,(pn,en)} to be given as
// parameters p1,e1,...,pn,en--an even number of parameters.)
const solveChallenge = ( ...all ) => {
    if ( all.length % 2 != 0 )
        throw 'Number of arguments to setupChallenge must be even (pairs)'
    all = all.map( quickExpression )
    let pairs = [ ]
    for ( let i = 0 ; i < all.length ; i += 2 )
        pairs.push( [ all[i], all[i+1] ] )
    challenge = new Matching.MatchingChallenge( ...pairs )
    solutions = challenge.getSolutions()
}
// How to check to see if the last MatchingChallenge instance was solved in
// the expected way:
// (Expects a list of zero or more arguments, each of which is an array whose
// contents are of the form m1,e1,...,mn,en--an even number of arguments, each
// of which is a metavariable-expression pair.  A set of such pairs is a
// solution, and a set of such sets is a complete test.)
// Example calls:
// expect( checkSolutions() ).to.equal( true ) // expect no solutions
// expect( checkSolutions( [ ] ) ).to.equal( true ) // expect 1 empty solution
// expect( checkSolutions( [ '_metavar', 'instantiation' ] ) )
//                                // expect 1 solution, with one mv->inst pair
const checkSolutions = ( ...expected ) => {
    expected = expected.map( expectedSolution => {
        if ( expectedSolution.length % 2 != 0 )
            throw 'All solution constraint lists must be even (pairs)'
        expectedSolution = expectedSolution.map( quickExpression )
        let pairs = [ ]
        for ( let i = 0 ; i < expectedSolution.length ; i += 2 )
            pairs.push( new Matching.Constraint(
                expectedSolution[i], expectedSolution[i+1] ) )
        return new Matching.ConstraintList( ...pairs )
    } )
    if ( expected.length == solutions.length
      && expected.every( exp => solutions.some(
        sol => exp.equals( sol ) ) ) ) return true
    console.log( 'Solution sets not equal:' )
    console.log( '  Actual solutions:' )
    console.log( '    ' +
        Matching.display( solutions ).replace( /\n/g, '\n    ' ) )
    console.log( '  Expected solutions:' )
    console.log( '    ' +
        Matching.display( expected ).replace( /\n/g, '\n    ' ) )
    return false
}

// and now we do the actual tests

describe( 'Matching', () => {

    it( 'Should declare the expected tools', () => {
        expect( Matching.makeExpressionFunction ).to.be.ok
        expect( Matching.makeExpressionFunctionApplication ).to.be.ok
        expect( Matching.MatchingChallenge ).to.be.ok
    } )

    it( 'Should correctly solve very simple matching challenges', () => {
        // this does not match
        solveChallenge( 'x', 'y' )
        expect( checkSolutions() ).to.equal( true )
        // this matches in exactly one way -- no instantiations needed
        solveChallenge( 'x', 'x' )
        expect( checkSolutions( [ ] ) ).to.equal( true )
        // this matches in exactly one way -- instantiate A to x
        solveChallenge( '_A', 'x' )
        expect( checkSolutions( [ '_A', 'x' ] ) ).to.equal( true )
        // this matches in exactly one way -- { A:x, B:y }
        solveChallenge( '(and _A _B)', '(and x y)' )
        expect( checkSolutions( [ '_A', 'x', '_B', 'y' ] ) ).to.equal( true )
    } )

    it( 'Should correctly solve matching challenges with an EFA', () => {
        // this matches in four ways
        solveChallenge( '_P_of_x', '(f 1)' )
        expect( checkSolutions(
            [ '_P', '(lambda v0 , v0)', '_x', '(f 1)' ],
            [ '_P', '(lambda v0 , (f v0))', '_x', '1' ],
            [ '_P', '(lambda v0 , (v0 1))', '_x', 'f' ],
            [ '_P', '(lambda v0 , (f 1))' ]
        ) ).to.equal( true )
        // this matches in five ways
        solveChallenge( '_P_of_x', '(f f)' )
        expect( checkSolutions(
            [ '_P', '(lambda v0 , v0)', '_x', '(f f)' ],
            [ '_P', '(lambda v0 , (f v0))', '_x', 'f' ],
            [ '_P', '(lambda v0 , (v0 f))', '_x', 'f' ],
            [ '_P', '(lambda v0 , (v0 v0))', '_x', 'f' ],
            [ '_P', '(lambda v0 , (f f))' ]
        ) ).to.equal( true )
    } )

    it( 'Should correctly solve a few miscellaneous challenges', () => {
        // test 1
        solveChallenge( '_P_of__x', '(b 2)', '_P_of__y', '(b 3)' )
        expect( checkSolutions(
            [ '_x', '(b 2)', '_y', '(b 3)', '_P', '(lambda v0 , v0)' ],
            [ '_x', '2', '_y', '3', '_P', '(lambda v0 , (b v0))' ]
        ) ).to.equal( true )
        // test 2
        solveChallenge( '_P_of__x', '(f a a)', '_x', 'b' )
        expect( checkSolutions(
            [ '_x', 'b', '_P', '(lambda v0 , (f a a))' ]
        ) ).to.equal( true )
        // test using induction on N
        solveChallenge( '_P_of_0', '(= 7 5)',
                        '(∀ _k , (=> _P_of__k ("symbol: EFA" _P (+ _k 1))))',
                        '(∀ n , (=> (= 7 5) (= 7 5)))',
                        '(∀ _n , _P_of__n)', '(∀ n , (= 7 5))' )
        expect( checkSolutions(
            [ '_P', '(lambda v0 , (= 7 5))', '_k', 'n', '_n', 'n' ]
        ) ).to.equal( true )
        // test using ∃E rule
        solveChallenge(
            '(∃ _x , _P_of__x)',         '(∃ x , (> x 0))',
            '(∀ _y , (=> _P_of__y _Q))', '(∀ x , (=> (> x 0) (> -1 0)))',
            '_Q',                        '(> -1 0)' )
        expect( checkSolutions(
            [ '_x', 'x', '_y', 'x',
              '_P', '(lambda v0 , (> v0 0))', '_Q', '(> -1 0)' ]
        ) ).to.equal( true )
    } )

    it( 'Should correctly solve challenges for the ∀E rule', () => {
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // Forall x, P(x)               Forall r, r^2+1>0
        // Thus P(T)                    Thus (-9)^2+1>0
        solveChallenge( '(∀ _x , _P_of__x)', '(∀ r , (> (+ (sq r) 1) 0))',
                        '_P_of__T',          '(> (+ (sq -9) 1) 0)' )
        expect( checkSolutions(
            [ '_P', '(lambda v0 , (> (+ (sq v0) 1) 0))',
              '_T', '-9', '_x', 'r' ]
        ) ).to.equal( true )
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // Forall x, P(x)               Forall x, R(x,y)
        // Thus P(t)                    Thus R(3,y)
        solveChallenge( '(∀ _x , _P_of__x)', '(∀ x , (R x y))',
                        '_P_of__t',          '(R 3 y)' )
        expect( checkSolutions(
            [ '_P', '(lambda v0 , (R v0 y))', '_t', '3', '_x', 'x' ]
        ) ).to.equal( true )
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // Forall x, P(x)               Forall x, Exists y, x < y
        // Thus P(t)                    Thus Exists y, y < y
        solveChallenge( '(∀ _x , _P_of__x)', '(∀ x , (∃ y , (< x y)))',
                        '_P_of__t',          '(∃ y , (< y y))' )
        expect( checkSolutions() ).to.equal( true )
    } )

    it( 'Should correctly solve challenges for the ∃I rule', () => {
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // P(t)                         1 > 0
        // Thus exists x, P(x)          Exists x, x > 0
        solveChallenge( '_P_of__t',          '(> 1 0)',
                        '(∃ _x , _P_of__x)', '(∃ x , (> x 0))' )
        expect( checkSolutions(
            [ '_P', '(lambda v0 , (> v0 0))', '_t', '1', '_x', 'x' ]
        ) ).to.equal( true )
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // P(t)                         x != t
        // Thus exists x, P(x)          Exists y, y != t
        solveChallenge( '_P_of__t',          '(!= x t)',
                        '(∃ _x , _P_of__x)', '(∃ y , (!= y t))' )
        expect( checkSolutions(
            [ '_P', '(lambda v0 , (!= v0 t))', '_t', 'x', '_x', 'y' ]
        ) ).to.equal( true )
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // P(t)                         x != t
        // Thus exists x, P(x)          Exists x, x != x
        solveChallenge( '_P_of__t',          '(!= x t)',
                        '(∃ _x , _P_of__x)', '(∃ x , (!= x x))' )
        expect( checkSolutions() ).to.equal( true )
    } )

    it( 'Should correctly solve challenges for the =E rule', () => {
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // a = b                        t = 1
        // P(a)                         t > 0
        // Thus P(b)                    Thus 1 > 0
        solveChallenge( '(= _a _b)', '(= t 1)',
                        '_P_of__a',  '(> t 0)',
                        '_P_of__b',  '(> 1 0)' )
        expect( checkSolutions(
            [ '_a', 't', '_b', '1', '_P', '(lambda v0 , (> v0 0))' ]
        ) ).to.equal( true )
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // a = b                        t = 1
        // P(a)                         1 + 1 = 2
        // Thus P(b)                    t + 1 = 2
        solveChallenge( '(= _a _b)', '(= t 1)',
                        '_P_of__a',  '(= (+ 1 1) 2)',
                        '_P_of__b',  '(= (+ t 1) 2)' )
        expect( checkSolutions() ).to.equal( true )
        // Trying to match this rule:   To this instance:
        // --------------------------   -----------------
        // a = b                        1 = 2
        // P(a)                         1 + 1 = 2
        // Thus P(b)                    1 + 2 = 2
        solveChallenge( '(= _a _b)', '(= 1 2)',
                        '_P_of__a',  '(= (+ 1 1) 2)',
                        '_P_of__b',  '(= (+ 1 2) 2)' )
        expect( checkSolutions(
            [ '_a', '1', '_b', '2', '_P', '(lambda v0 , (= (+ 1 v0) 2))' ]
        ) ).to.equal( true )
    } )

} )
