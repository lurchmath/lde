
import { predictableStringify } from '../src/utilities.js'

describe( 'Utilities', () => {

    it( 'Ensure all expected global identifiers are declared', () => {
        expect( predictableStringify ).to.be.ok
        expect( JSON.equals ).to.be.ok
        expect( EventTarget.prototype.emit ).to.be.ok
    } )

} )

describe( 'JSON tools', () => {

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

} )

describe( 'Prototype extensions', () => {

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

    it( 'The Map.prototype.deepCopy function behaves correctly', () => {
        // create a Map with all JSON-encodable contents (because the function
        // we are testing is guaranteed to work only for such Maps)
        const M = new Map( [
            [ 'favorite number', 5 ],
            [ 'favorite color', 'blue' ],
            [ 'favorite bands', [
                'Destroy the Raging Monkeys',
                'Unbelievable Hangover',
                'Thrash Machine from the Grave'
            ] ],
            [ 'favorite data', { one : 1, two : 2, three : 3 } ]
        ] )
        // make a deep copy
        const Mcopy = M.deepCopy()
        // verify that the two maps have the same sets of keys
        expect( M.keys() ).to.eql( Mcopy.keys() )
        // verify that all atomic values are identical
        expect( M.get( 'favorite number' ) ).to.equal(
            Mcopy.get( 'favorite number' ) )
        expect( M.get( 'favorite color' ) ).to.equal(
            Mcopy.get( 'favorite color' ) )
        // verify that all non-atomic values match structurally
        expect( M.get( 'favorite bands' ) ).to.eql(
            Mcopy.get( 'favorite bands' ) )
        expect( M.get( 'favorite data' ) ).to.eql(
            Mcopy.get( 'favorite data' ) )
        // verify that all non-atomic values are not identical
        expect( M.get( 'favorite bands' ) ).not.to.equal(
            Mcopy.get( 'favorite bands' ) )
        expect( M.get( 'favorite data' ) ).not.to.equal(
            Mcopy.get( 'favorite data' ) )
    } )

    it( 'The Array.prototype.without() function works as expected', () => {
        // test on an array of values
        let array = [ 1, 2, 3 ]
        expect( array.without( -1 ) ).to.eql( [ 1, 2, 3 ] )
        expect( array.without( 0 ) ).to.eql( [ 2, 3 ] )
        expect( array.without( 1 ) ).to.eql( [ 1, 3 ] )
        expect( array.without( 2 ) ).to.eql( [ 1, 2 ] )
        expect( array.without( 3 ) ).to.eql( [ 1, 2, 3 ] )
        // test on an array of references
        array = [ { }, { } ]
        let test = array.without()
        expect( test ).not.to.equal( array )
        expect( test ).to.eql( [ { }, { } ] )
        expect( test[0] ).to.equal( array[0] )
        expect( test[1] ).to.equal( array[1] )
        test = array.without( 0 )
        expect( test ).not.to.equal( array )
        expect( test ).to.eql( [ { } ] )
        expect( test[0] ).to.equal( array[1] )
        test = array.without( 1 )
        expect( test ).not.to.equal( array )
        expect( test ).to.eql( [ { } ] )
        expect( test[0] ).to.equal( array[0] )
        test = array.without( 2 )
        expect( test ).not.to.equal( array )
        expect( test ).to.eql( [ { }, { } ] )
        expect( test[0] ).to.equal( array[0] )
        expect( test[1] ).to.equal( array[1] )
    } )

    it( 'The Array.prototype.last() function works as expected', () => {
        // make some objects for use in testing
        const obj1 = { }
        const obj2 = /foo/
        const obj3 = [ [ [ ] ] ]
        // run some tests
        expect( [ 1, 2, 3 ].last() ).to.equal( 3 )
        expect( [ 'help', 'me' ].last() ).to.equal( 'me' )
        expect( [ obj1, obj2, obj3 ].last() ).to.equal( obj3 )
        expect( [ obj2 ].last() ).to.equal( obj2 )
        expect( [ obj1, obj1 ].last() ).to.equal( obj1 )
        expect( [ ].last() ).to.equal( undefined )
    } )

} )
