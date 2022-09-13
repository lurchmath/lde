
// Import what we're testing
import { PropositionalForm } from '../src/validation/propositional-form.js'
import { LogicConcept } from '../src/logic-concept.js'

// Test suite begins here.

describe( 'Propositional form', () => {

    it( 'should be imported successfully', () => {
        expect( PropositionalForm ).to.be.ok
    } )
    
    it( 'should correctly support atomic "true"', () => {
        const T = PropositionalForm.constantTrue()
        expect( T instanceof PropositionalForm ).to.equal( true )
        expect( T.isAtomic() ).to.equal( true )
        expect( T.isConstantTrue() ).to.equal( true )
        expect( T.isConditional() ).to.equal( false )
        expect( T.isAClassicalTautology() ).to.equal( true )
        expect( T.isAnIntuitionisticTautology() ).to.equal( true )
    } )

    it( 'should correctly support atomic propositions', () => {
        const T = PropositionalForm.constantTrue()
        const catalog = [ ]
        const P = PropositionalForm.atomic(
            LogicConcept.fromPutdown( 'P' )[0], catalog )
        expect( P.isAtomic() ).to.equal( true )
        expect( P.isConstantTrue() ).to.equal( false )
        expect( P.isAClassicalTautology() ).to.equal( false )
        expect( P.index() ).to.equal( 1 ) // first thing put in the catalog
        expect( P.text ).not.to.equal( T.text )
        const Q = PropositionalForm.atomic(
            LogicConcept.fromPutdown( 'Q' )[0], catalog )
        expect( Q.isAtomic() ).to.equal( true )
        expect( Q.isConstantTrue() ).to.equal( false )
        expect( Q.isAClassicalTautology() ).to.equal( false )
        expect( Q.index() ).to.equal( 2 ) // second thing put in the catalog
        expect( Q.text ).not.to.equal( T.text )
        expect( Q.text ).not.to.equal( P.text )
        const PandQ = PropositionalForm.atomic(
            LogicConcept.fromPutdown( '(and P Q)' )[0], catalog )
        expect( PandQ.isAtomic() ).to.equal( true )
        expect( PandQ.isConstantTrue() ).to.equal( false )
        expect( PandQ.isAClassicalTautology() ).to.equal( false )
        expect( PandQ.index() ).to.equal( 3 ) // third thing put in the catalog
        expect( PandQ.text ).not.to.equal( T.text )
        expect( PandQ.text ).not.to.equal( P.text )
        expect( PandQ.text ).not.to.equal( Q.text )
    } )

    xit( 'should correctly support conditional expressions', () => {
        // TO DO:
        // conditional(A,B,cat) satisfies isConditional() but not isAtomic or
        //   isConstTrue and you can fetch A and B with LHS() and RHS()
    } )

    xit( 'should correctly check small expressions classically', () => {
        // TO DO:
        // For some small implication-fragment expressions, we can build them,
        //   check if they're CPL tautologies, and even verify their CNF and
        //   negated CNF as well (ensuring we pick some that are and some that
        //   are not CPL tautologies)
        // For all those same small implications, you can ask if they're
        //   tautologies using followsClassicallyFrom() also.
    } )

    xit( 'should correctly create and use catalogs of atomics', () => {
        // TO DO:
        // For some modest sized nested conditionals, we can check index() of
        //   each leaf, as well as checking unused() and watching it increase
        //   w/more calls.
        // For those same expressions and their leaves, we can also check
        //   isIn() and addedTo().
    } )

    xit( 'should correctly check small expressions intuitionistically', () => {
        // TO DO:
        // For some small implication-fragment expressions, we can build them
        //   and check if they're IPL tautologies (ensuring we pick some that
        //   are and some that are not IPL tautologies, including some that are
        //   CPL but not IPL tauts)
    } )

} )
