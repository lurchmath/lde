
// Import what we're testing
import { PropositionalForm } from '../src/validation/propositional-form.js'

// Test suite begins here.

describe( 'Propositional form', () => {

    it( 'should be imported successfully', () => {
        expect( PropositionalForm ).to.be.ok
    } )
    
    xit( 'should correctly support atomic "true"', () => {
        // TO DO:
        // constantTrue() satisfies isConstantTrue() and isClassicalTaut
        //   and satisfies isAtomic() but not isConditional()
    } )

    xit( 'should correctly support atomic propositions', () => {
        // TO DO:
        // atomic(LC) satisfies isAtomic() but not isConstantTrue() but not
        //   isCLTaut and has the right index in whatever catalog you pass at
        //   construction time
        // two atomics have different texts, be it True vs. an LC, or two
        //   different LCs
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
