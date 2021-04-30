
// We import this because it's the subject of this test suite.
import { LogicConcept } from '../src/logic-concept.js'
import { MathConcept } from '../src/math-concept.js'

// I'm rollying my own spy functions, because chai's are annoying to use in
// the browser.
const makeSpy = () => {
    const result = ( ...args ) => result.callRecord.push( args )
    result.callRecord = [ ]
    return result
}

// Test suites begin here.

describe( 'LogicConcept module', () => {

    it( 'Should have all expected global identifiers declared', () => {
        expect( LogicConcept ).to.be.ok
    } )

    it( 'Should correcty construct LogicConcepts', () => {
        // Can we create an empty one?
        let L = new LogicConcept()
        expect( L ).to.be.ok
        expect( L ).to.be.instanceOf( LogicConcept )
        expect( L.numChildren() ).to.equal( 0 )
        // Can we create a hierarchy of them?
        L = new LogicConcept(
            new LogicConcept(),
            new LogicConcept(
                new LogicConcept()
            )
        )
        expect( L ).to.be.ok
        expect( L ).to.be.instanceOf( LogicConcept )
        expect( L.numChildren() ).to.equal( 2 )
        expect( L.child( 0 ).numChildren() ).to.equal( 0 )
        expect( L.child( 1 ).numChildren() ).to.equal( 1 )
        // If we try to put non-LogicConcepts inside a LogicConcept,
        // does it filter them out?
        L = new LogicConcept(
            new LogicConcept(),
            new MathConcept(),
            new LogicConcept()
        )
        expect( L ).to.be.ok
        expect( L ).to.be.instanceOf( LogicConcept )
        expect( L.numChildren() ).to.equal( 2 )
        expect( L.child( 0 ) ).to.be.instanceOf( LogicConcept )
        expect( L.child( 1 ) ).to.be.instanceOf( LogicConcept )
    } )

} )

describe( 'Dirty flags for LogicConcepts', () => {

    it( 'Should be on by default', () => {
        // make a small hierarchy
        let L = new LogicConcept(
            new LogicConcept(),
            new LogicConcept()
        )
        // ensure all entries are dirty
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
    } )

    it( 'Should not propagate dirty changes upward', () => {
        // make a small hierarchy
        let L = new LogicConcept(
            new LogicConcept(),
            new LogicConcept()
        )
        // repeat previous test just as a sanity check
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        // change them one at a time to not dirty and ensure
        // that they change only one at a time
        L.child( 0 ).markDirty( false )
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        L.child( 1 ).markDirty( false )
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( false )
        L.markDirty( false )
        expect( L.isDirty() ).to.equal( false )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( false )
        // marking them dirty again also does not propagate
        L.child( 0 ).markDirty( true )
        expect( L.isDirty() ).to.equal( false )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( false )
        L.child( 1 ).markDirty( true )
        expect( L.isDirty() ).to.equal( false )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        L.markDirty( true )
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( true )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        // unless you ask it to propagate
        L.child( 0 ).markDirty( false, true )
        expect( L.isDirty() ).to.equal( false )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
        L.child( 1 ).markDirty( true, true )
        expect( L.isDirty() ).to.equal( true )
        expect( L.child( 0 ).isDirty() ).to.equal( false )
        expect( L.child( 1 ).isDirty() ).to.equal( true )
    } )

} )

describe( 'Sending feedback about LogicConcepts', () => {

    let L
    let M

    beforeEach( () => {
        // Create a LogicConcept with a MathConcept origin and spy on
        // that origin's feedback method
        L = new LogicConcept
        M = new MathConcept
        L._origin = M
        M.feedback = makeSpy()
    } )

    it( 'Should send feedback through their origins by default', () => {
        // Have the LogicConcept send feedback about itself and ensure
        // that the MathConcept hears about it
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.feedback( { 'sky color' : 'blue', 'grass color' : 'green' } )
        expect( M.feedback.callRecord ).to.eql( [
            [ { 'sky color' : 'blue', 'grass color' : 'green' } ]
        ] )
        L.feedback( [ 'x', 'y', 'z' ] )
        expect( M.feedback.callRecord ).to.eql( [
            [ { 'sky color' : 'blue', 'grass color' : 'green' } ],
            [ [ 'x', 'y', 'z' ] ]
        ] )
    } )

    it( 'Should not send feedback if feedback is disabled', () => {
        // Disable feedback
        L.enableFeedback( false )
        // Have the LogicConcept send feedback about itself and ensure
        // that the MathConcept hears nothing
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.feedback( { 'sky color' : 'blue', 'grass color' : 'green' } )
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.feedback( [ 'x', 'y', 'z' ] )
        expect( M.feedback.callRecord ).to.eql( [ ] )
    } )

    it( 'Can flush the queue when feedback is enabled', () => {
        // Disable feedback
        L.enableFeedback( false )
        // Have the LogicConcept send feedback about itself
        L.feedback( { 'sky color' : 'blue', 'grass color' : 'green' } )
        L.feedback( [ 'x', 'y', 'z' ] )
        // Re-enable feedback and flush the queue, then check to be
        // sure that M heard everything at once at the end
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.enableFeedback( true, true )
        expect( M.feedback.callRecord ).to.eql( [
            [ { 'sky color' : 'blue', 'grass color' : 'green' } ],
            [ [ 'x', 'y', 'z' ] ]
        ] )
    } )

    it( 'Can discard the queue when feedback is enabled', () => {
        // Disable feedback
        L.enableFeedback( false )
        // Have the LogicConcept send feedback about itself
        L.feedback( { 'sky color' : 'blue', 'grass color' : 'green' } )
        L.feedback( [ 'x', 'y', 'z' ] )
        // Re-enable feedback but don't flush the queue, then check to be
        // sure that M heard nothing
        expect( M.feedback.callRecord ).to.eql( [ ] )
        L.enableFeedback( true, false )
        expect( M.feedback.callRecord ).to.eql( [ ] )
    } )

} )
