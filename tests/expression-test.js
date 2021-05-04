
import { MathConcept } from '../src/math-concept.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Expression } from '../src/expression.js'

describe( 'Expression', () => {

    it( 'Should declare the expected global identifiers', () => {
        expect( Expression ).to.be.ok
    } )

    it( 'Should compute isOutermost/getOutermost correctly', () => {
        // Make a deeply nested hierarchy
        let A, B, C, D, E, F
        A = new MathConcept(
            B = new LogicConcept(
                C = new Expression(),
                D = new Expression(
                    E = new Expression(
                        F = new Expression()
                    )
                )
            )
        )
        // Expect that only the Expressions define the isOutermost() and
        // getOutermost() functions.
        expect( A.isOutermost ).to.not.be.ok
        expect( B.isOutermost ).to.not.be.ok
        expect( A.getOutermost ).to.not.be.ok
        expect( B.getOutermost ).to.not.be.ok
        // Expect that C and D are outermost Expressions, but E and F are not
        expect( C.isOutermost() ).to.equal( true )
        expect( D.isOutermost() ).to.equal( true )
        expect( E.isOutermost() ).to.equal( false )
        expect( F.isOutermost() ).to.equal( false )
        // Expect that the outermost for C is itself, and the outermost for
        // everything else is D
        expect( C.getOutermost() ).to.equal( C )
        expect( D.getOutermost() ).to.equal( D )
        expect( E.getOutermost() ).to.equal( D )
        expect( F.getOutermost() ).to.equal( D )
    } )

    it( 'Should return an undefined value for Expression instances', () => {
        let E1 = new Expression
        let E2 = new Expression
        expect( E1.value ).to.be.ok
        expect( E1.value() ).to.be.undefined
        expect( E2.value ).to.be.ok
        expect( E2.value() ).to.be.undefined
    } )

} )
