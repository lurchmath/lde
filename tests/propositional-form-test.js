
// Import what we're testing
import { PropositionalForm } from '../src/validation/propositional-form.js'
import { LogicConcept } from '../src/logic-concept.js'

// Test suite begins here.

describe( 'Propositional form', () => {

    it( 'should be imported successfully', () => {
        expect( PropositionalForm ).to.be.ok
    } )
    
    it( 'should correctly support atomic "true"', () => {
        // the constant true is atomic, is the constant true (of course), is a
        // classical tautology, is an intuitionistic tautology, but is not a
        // conditional
        const T = PropositionalForm.constantTrue()
        expect( T instanceof PropositionalForm ).to.equal( true )
        expect( T.isAtomic() ).to.equal( true )
        expect( T.isConstantTrue() ).to.equal( true )
        expect( T.isConditional() ).to.equal( false )
        expect( T.isAClassicalTautology() ).to.equal( true )
        expect( T.isAnIntuitionisticTautology() ).to.equal( true )
    } )

    it( 'should correctly support atomic propositions', () => {
        // P and Q are atomic, but are not the constant true, nor are they
        // classical nor intuitionistic tautologies, while "P and Q" is not
        // atomic, nor is it the constant true, nor a classical nor
        // intuitionistic tautology
        const T = PropositionalForm.constantTrue()
        const catalog = [ ]
        const P = PropositionalForm.atomic(
            LogicConcept.fromPutdown( 'P' )[0], catalog )
        expect( P.isAtomic() ).to.equal( true )
        expect( P.isConstantTrue() ).to.equal( false )
        expect( P.isAClassicalTautology() ).to.equal( false )
        expect( P.isAnIntuitionisticTautology() ).to.equal( false )
        const Q = PropositionalForm.atomic(
            LogicConcept.fromPutdown( 'Q' )[0], catalog )
        expect( Q.isAtomic() ).to.equal( true )
        expect( Q.isConstantTrue() ).to.equal( false )
        expect( Q.isAClassicalTautology() ).to.equal( false )
        expect( Q.isAnIntuitionisticTautology() ).to.equal( false )
        const PandQ = PropositionalForm.atomic(
            LogicConcept.fromPutdown( '(and P Q)' )[0], catalog )
        expect( PandQ.isAtomic() ).to.equal( true )
        expect( PandQ.isConstantTrue() ).to.equal( false )
        expect( PandQ.isAClassicalTautology() ).to.equal( false )
        expect( PandQ.isAnIntuitionisticTautology() ).to.equal( false )
        // Each thing we put into the catalog is there, in the order we added
        // them, but they all have different text values and indices
        expect( P.index() ).to.equal( 1 )
        expect( Q.index() ).to.equal( 2 )
        expect( PandQ.index() ).to.equal( 3 )
        expect( P.text ).not.to.equal( T.text )
        expect( Q.text ).not.to.equal( T.text )
        expect( Q.text ).not.to.equal( P.text )
        expect( PandQ.text ).not.to.equal( T.text )
        expect( PandQ.text ).not.to.equal( P.text )
        expect( PandQ.text ).not.to.equal( Q.text )
    } )

    it( 'should correctly support conditional expressions', () => {
        // P=>Q, Q=>P, and (PandQ)=>P are all non-atomic conditionals that are
        // not exactly equal to the constant true, nor are any of them
        // classical nor intuitionistic tautologies (even the last one,
        // because this test treats PandQ as an atomic, not as a conjunction).
        const catalog = [ ]
        const PimpQ = PropositionalForm.conditional(
            LogicConcept.fromPutdown( 'P' )[0],
            LogicConcept.fromPutdown( 'Q' )[0], catalog )
        expect( PimpQ.isConditional() ).to.equal( true )
        expect( PimpQ.isAtomic() ).to.equal( false )
        expect( PimpQ.isConstantTrue() ).to.equal( false )
        expect( PimpQ.isAClassicalTautology() ).to.equal( false )
        expect( PimpQ.isAnIntuitionisticTautology() ).to.equal( false )
        const QimpP = PropositionalForm.conditional(
            LogicConcept.fromPutdown( 'Q' )[0],
            LogicConcept.fromPutdown( 'P' )[0], catalog )
        expect( QimpP.isConditional() ).to.equal( true )
        expect( QimpP.isAtomic() ).to.equal( false )
        expect( QimpP.isConstantTrue() ).to.equal( false )
        expect( QimpP.isAClassicalTautology() ).to.equal( false )
        expect( QimpP.isAnIntuitionisticTautology() ).to.equal( false )
        const PandQimpP = PropositionalForm.conditional( 
            LogicConcept.fromPutdown( '(and P Q)' )[0],
            LogicConcept.fromPutdown( 'P' )[0], catalog )
        expect( PandQimpP.isConditional() ).to.equal( true )
        expect( PandQimpP.isAtomic() ).to.equal( false )
        expect( PandQimpP.isConstantTrue() ).to.equal( false )
        expect( PandQimpP.isAClassicalTautology() ).to.equal( false )
        expect( PandQimpP.isAnIntuitionisticTautology() ).to.equal( false )
    } )

    it( 'should build instances from conclusions correctly', () => {
        // conclusion in LC { :P P } leads to PropositionalForm P=>P
        let LC = LogicConcept.fromPutdown( '{ :P P }' )[0]
        const PimpP = PropositionalForm.fromConclusion( LC.conclusions()[0] )
        expect( PimpP.isConditional() ).to.equal( true )
        expect( PimpP.isAtomic() ).to.equal( false )
        expect( PimpP.isConstantTrue() ).to.equal( false )
        expect( PimpP.LHS().isAtomic() ).to.equal( true )
        expect( PimpP.LHS().text ).to.equal( 'P' )
        expect( PimpP.RHS().isAtomic() ).to.equal( true )
        expect( PimpP.RHS().text ).to.equal( 'P' )
        // conclusion in LC { :P { :Q P } }
        // leads to PropositionalForm P=>(Q=>P)
        LC = LogicConcept.fromPutdown( '{ :P { :Q P } }' )[0]
        const PimpQimpP = PropositionalForm.fromConclusion(
            LC.conclusions()[0] )
        expect( PimpQimpP.isConditional() ).to.equal( true )
        expect( PimpQimpP.isAtomic() ).to.equal( false )
        expect( PimpQimpP.isConstantTrue() ).to.equal( false )
        expect( PimpQimpP.LHS().isAtomic() ).to.equal( true )
        expect( PimpQimpP.LHS().text ).to.equal( 'P' )
        expect( PimpQimpP.RHS().isAtomic() ).to.equal( false )
        expect( PimpQimpP.RHS().text ).to.equal( '[Q,P]' )
        expect( PimpQimpP.RHS().LHS().isAtomic() ).to.equal( true )
        expect( PimpQimpP.RHS().LHS().text ).to.equal( 'Q' )
        expect( PimpQimpP.RHS().RHS().isAtomic() ).to.equal( true )
        expect( PimpQimpP.RHS().RHS().text ).to.equal( 'P' )
        // conclusions in LC { :{ P Q } { Q R } }
        // lead to PropositionalForms P=>(Q=>Q) and P=>(Q=>R)
        LC = LogicConcept.fromPutdown( '{ :{ P Q } { Q R } }' )[0]
        const pair = PropositionalForm.fromConclusionsIn( LC )
        expect( pair ).to.have.lengthOf( 2 )
        expect( pair[0].isConditional() ).to.equal( true )
        expect( pair[0].isAtomic() ).to.equal( false )
        expect( pair[0].isConstantTrue() ).to.equal( false )
        expect( pair[0].text ).to.equal( '[P,[Q,Q]]' )
        expect( pair[0].LHS().isAtomic() ).to.equal( true )
        expect( pair[0].LHS().text ).to.equal( 'P' )
        expect( pair[0].RHS().isAtomic() ).to.equal( false )
        expect( pair[0].RHS().text ).to.equal( '[Q,Q]' )
        expect( pair[0].RHS().LHS().isAtomic() ).to.equal( true )
        expect( pair[0].RHS().LHS().text ).to.equal( 'Q' )
        expect( pair[0].RHS().RHS().isAtomic() ).to.equal( true )
        expect( pair[0].RHS().RHS().text ).to.equal( 'Q' )
        expect( pair[1].isConditional() ).to.equal( true )
        expect( pair[1].isAtomic() ).to.equal( false )
        expect( pair[1].isConstantTrue() ).to.equal( false )
        expect( pair[1].text ).to.equal( '[P,[Q,R]]' )
        expect( pair[1].LHS().isAtomic() ).to.equal( true )
        expect( pair[1].LHS().text ).to.equal( 'P' )
        expect( pair[1].RHS().isAtomic() ).to.equal( false )
        expect( pair[1].RHS().text ).to.equal( '[Q,R]' )
        expect( pair[1].RHS().LHS().isAtomic() ).to.equal( true )
        expect( pair[1].RHS().LHS().text ).to.equal( 'Q' )
        expect( pair[1].RHS().RHS().isAtomic() ).to.equal( true )
        expect( pair[1].RHS().RHS().text ).to.equal( 'R' )
        // conclusion in LC { :{ :{ :P Q } P } P }
        // leads to PropositionalForm ((P=>Q)=>P)=>P (Peirce's Law)
        LC = LogicConcept.fromPutdown( '{ :{ :{ :P Q } P } P }' )[0]
        const Peirce = PropositionalForm.fromConclusion(
            LC.conclusions()[0] )
        expect( Peirce.isConditional() ).to.equal( true )
        expect( Peirce.isAtomic() ).to.equal( false )
        expect( Peirce.isConstantTrue() ).to.equal( false )
        expect( Peirce.LHS().isAtomic() ).to.equal( false )
        expect( Peirce.LHS().text ).to.equal( '[[P,Q],P]' )
        expect( Peirce.RHS().isAtomic() ).to.equal( true )
        expect( Peirce.RHS().text ).to.equal( 'P' )
        expect( Peirce.LHS().LHS().isAtomic() ).to.equal( false )
        expect( Peirce.LHS().LHS().text ).to.equal( '[P,Q]' )
        expect( Peirce.LHS().RHS().isAtomic() ).to.equal( true )
        expect( Peirce.LHS().RHS().text ).to.equal( 'P' )
        expect( Peirce.LHS().LHS().LHS().isAtomic() ).to.equal( true )
        expect( Peirce.LHS().LHS().LHS().text ).to.equal( 'P' )
        expect( Peirce.LHS().LHS().RHS().isAtomic() ).to.equal( true )
        expect( Peirce.LHS().LHS().RHS().text ).to.equal( 'Q' )
    } )

    it( 'should correctly check small expressions', () => {
        // construct P=>P as in previous test, check its CNF, and be sure that
        // it is both a classical tautology and an intuitionistic one
        let LC = LogicConcept.fromPutdown( '{ :P P }' )[0]
        const PimpP = PropositionalForm.fromConclusion( LC.conclusions()[0] )
        expect( PimpP.CNF() ).to.eql( [ [ -1, 1 ] ] )
        expect( PimpP.isAClassicalTautology() ).to.equal( true )
        expect( PimpP.isAnIntuitionisticTautology() ).to.equal( true )
        // construct P=>(Q=>P) as in previous test, check its CNF, and be sure
        // that it is both a classical tautology and an intuitionistic one
        LC = LogicConcept.fromPutdown( '{ :P { :Q P } }' )[0]
        const PimpQimpP = PropositionalForm.fromConclusion(
            LC.conclusions()[0] )
        expect( PimpQimpP.CNF() ).to.eql( [ [ -1, -2, 1 ] ] )
        expect( PimpQimpP.isAClassicalTautology() ).to.equal( true )
        expect( PimpQimpP.isAnIntuitionisticTautology() ).to.equal( true )
        // construct P=>(Q=>Q) and P=>(Q=>R) as in previous test, check their
        // CNFs, and be sure that the first is both a classical tautology and
        // and intuitionistic one, but the second is neither.
        LC = LogicConcept.fromPutdown( '{ :{ P Q } { Q R } }' )[0]
        const pair = PropositionalForm.fromConclusionsIn( LC )
        let Pidx = pair[0].LHS().index()
        let Qidx = pair[0].RHS().RHS().index()
        expect( pair[0].CNF() ).to.eql( [ [ -Pidx, -Qidx, Qidx ] ] ) // -Pv-QvQ
        expect( pair[0].isAClassicalTautology() ).to.equal( true )
        expect( pair[0].isAnIntuitionisticTautology() ).to.equal( true )
        Pidx = pair[1].LHS().index()
        Qidx = pair[1].RHS().LHS().index()
        let Ridx = pair[1].RHS().RHS().index()
        expect( pair[1].CNF() ).to.eql( [ [ -Pidx, -Qidx, Ridx ] ] ) // -Pv-QvR
        expect( pair[1].isAClassicalTautology() ).to.equal( false )
        expect( pair[1].isAnIntuitionisticTautology() ).to.equal( false )
        // construct Peirce's Law as in previous test, check its CNF, and be
        // sure that it is a classical tautology but not an intuitionistic one
        LC = LogicConcept.fromPutdown( '{ :{ :{ :P Q } P } P }' )[0]
        const Peirce = PropositionalForm.fromConclusion(
            LC.conclusions()[0] )
        Pidx = Peirce.RHS().index()
        Qidx = Peirce.LHS().LHS().RHS().index()
        // Peirce CNF simplifies like so:
        // CNF(((P=>Q)=>P)=>P) == or(negatedCNF((P=>Q)=>P),[[P]])
        //                     == or(and(CNF(P=>Q),[[-P]]),[[P]])
        //                     == or(and(or(-P,Q),[[-P]]),[[P]])
        //                     == or(and([[-P,Q]],[[-P]]),[[P]])
        //                     == or([[-P,Q],[-P]],[[P]])
        //                     == [[P,-P,Q],[P,-P]]
        expect( Peirce.CNF() ).to.eql(
            [ [ Pidx, -Pidx, Qidx ], [ Pidx, -Pidx ] ] )
        expect( Peirce.isAClassicalTautology() ).to.equal( true )
        expect( Peirce.isAnIntuitionisticTautology() ).to.equal( false )
    } )

} )
