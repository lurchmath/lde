
import { predictableStringify } from '../src/utilities.js'

describe( 'Utilities', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( predictableStringify ).to.be.ok
        expect( JSON.equals ).to.be.ok
        expect( EventTarget.prototype.emit ).to.be.ok
    } )

    it( 'predictableStringify yields JSON with alphabetical keys', () => {
        // test some atomics
        expect( predictableStringify( 5 ) ).to.equal( "5" )
        expect( predictableStringify( 'five' ) ).to.equal( '"five"' )
        // test some empty containers
        expect( predictableStringify( [ ] ) ).to.equal( "[]" )
        expect( predictableStringify( { } ) ).to.equal( "{}" )
        // test an array
        expect( predictableStringify( [ 1, 'two', 3.3 ] ) ).to.equal( '[1,"two",3.3]' )
        // test predictable alphabetical-ness of keys
        expect( predictableStringify( { a : 'x', b : 'y' } ) ).to.equal(
            '{"a":"x","b":"y"}' )
        expect( predictableStringify( { b : 'y', a : 'x' } ) ).to.equal(
            '{"a":"x","b":"y"}' )
        // do a compound example with some nesting
        expect( predictableStringify( {
            one : 1,
            two : -222.222,
            three : [ 3, 3, 3 ],
            four : { f : 'o', u : 'r', t : 'y' }
        } ) ).to.equal(
            '{"four":{"f":"o","t":"y","u":"r"},"one":1,"three":[3,3,3],"two":-222.222}'
        )
    } )

    it( 'JSON.equals correctly assesses structural equality', () => {
        // build a whole bunch of data amenable to JSON encoding
        const values = [
            1, -10, 33.33, 'my string', "your string",
            [ ], { }, [ 'one' ], [ 50, -99, 0, 3000 ], { k : 'v' },
            { name : 'Sam', atBats : 50, hits : 15, RBIs : 8 },
            [ { x : 1 }, { y : 10 } ]
        ]
        // make deep structural copies of all of them, the slow but sure way
        const copies = values.map( x => JSON.parse( JSON.stringify( x ) ) )
        // ensure that everything in the values array matches only itself,
        // under the JSON.equals comparison
        for ( let i = 0 ; i < values.length ; i++ )
            for ( let j = 0 ; j < values.length ; j++ )
                expect( JSON.equals( values[i], values[j] ) ).to.equal( i == j )
        // ensure the same about everything in the copies array
        for ( let i = 0 ; i < values.length ; i++ )
            for ( let j = 0 ; j < values.length ; j++ )
                expect( JSON.equals( copies[i], copies[j] ) ).to.equal( i == j )
        // ensure the same if we use an entry from the values array compared to
        // an entry from the copies array
        for ( let i = 0 ; i < values.length ; i++ )
            for ( let j = 0 ; j < values.length ; j++ )
                expect( JSON.equals( values[i], copies[j] ) ).to.equal( i == j )
    } )

    it( 'The EventTarget.prototype.emit function behaves correctly', () => {
        // create a thing that can emit events
        const E = new EventTarget
        // attach an event listener
        const eventsHeard = [ ]
        E.addEventListener( 'example-event',
            event => eventsHeard.push( event ) )
        // emit an event of the type we're listening for
        E.emit( 'example-event', {
            exampleDetail1 : 'xyz',
            exampleDetail2 : [ 5, 10, 15 ],
            other : { a : 10, b : -10 }
        } )
        // verify that we heard it and it's of the correct structure
        expect( eventsHeard.length ).to.equal( 1 )
        expect( eventsHeard[0] ).to.be.instanceOf( Event )
        expect( eventsHeard[0].type ).to.equal( 'example-event' )
        expect( eventsHeard[0].exampleDetail1 ).to.equal( 'xyz' )
        expect( eventsHeard[0].exampleDetail2 ).to.eql( [ 5, 10, 15 ] )
        expect( eventsHeard[0].other ).to.eql( { a : 10, b : -10 } )
        // remember that event object for later comparisons
        const firstHeard = eventsHeard[0]
        // emit an event of the type we're not listening for
        E.emit( 'not-listening-for', { foo : 'bar' } )
        // verify that we did not hear that event
        expect( eventsHeard.length ).to.equal( 1 )
        expect( eventsHeard[0] ).to.equal( firstHeard )
    } )

} )
