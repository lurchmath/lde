
import { predictableStringify } from '../src/utilities.js' // ensure JSON.equals loaded
import M from '../src/matching.js'
import { Symbol as LurchSymbol } from '../src/symbol.js'
import { LogicConcept } from '../src/logic-concept.js'
import { Application } from '../src/application.js'
import Database from '../src/database.js'

const makeMetavars = ( these, inThis ) => {
    inThis.descendantsSatisfying(
        d => ( d instanceof LurchSymbol ) && these.includes( d.text() )
    ).forEach(
        d => d.makeIntoA( M.metavariable )
    )
    return inThis
}
const smallEFAProblems = [
    // These come from various tests in tests/problem-test.js,
    // but not from the testing Database
    new M.Problem(
        M.newEFA( new LurchSymbol( 'P' ).asA( M.metavariable ),
                  new LurchSymbol( 1 ) ),
        new LurchSymbol( 1 )
    ),
    new M.Problem(
        M.newEFA( new LurchSymbol( 'P' ).asA( M.metavariable ),
                  new LurchSymbol( 3 ) ),
        new LurchSymbol( 1 )
    ),
    new M.Problem(
        M.newEFA( new LurchSymbol( 'P' ).asA( M.metavariable ),
                  new LurchSymbol( 1 ) ),
        LogicConcept.fromPutdown( '(= 1 2)' )[0]
    ),
    new M.Problem(
        M.newEFA( new LurchSymbol( 'P' ).asA( M.metavariable ),
                  new LurchSymbol( 3 ) ),
        LogicConcept.fromPutdown( '(= 1 2)' )[0]
    ),
    new M.Problem(
        makeMetavars( [ 'P', 'Q' ], LogicConcept.fromPutdown(
            '( = ("LDE EFA" P a b) ("LDE EFA" Q a b) )'
        )[0] ),
        LogicConcept.fromPutdown( '( = (+ a b) (+ b a) )' )[0]
    ),
    new M.Problem(
        makeMetavars( [ 'P', 'Q', 'x', 'y' ], LogicConcept.fromPutdown(
            '( = ("LDE EFA" P x y) ("LDE EFA" P y x) )'
        )[0] ),
        LogicConcept.fromPutdown( '( = (+ a b) (+ b a) )' )[0]
    )
]

const matchingTests = Database.filterByMetadata( metadata =>
    metadata.testing && metadata.testing.type &&
    metadata.testing.type == 'matching' )
const getNum = key => {
    const parts = key.split( ' ' )
    return parseInt( parts[parts.length-1].split( '.' )[0] )
}
matchingTests.sort( ( a, b ) => getNum( a ) - getNum( b ) )

const getProblemFromDatabaseEntry = key => {
    // See tests/problem-test.js for details on how this works; no docs here
    const LCs = Database.getObjects( key )
    const metavars = LCs[0].children().slice( 1 )
    metavars.forEach( mv => {
        LCs[1].descendantsSatisfying(
            d => d.equals( mv ) && d.address( LCs[1] )[0] % 2 == 1
        ).forEach( d => d.makeIntoA( M.metavariable ) )
        LCs[2].descendantsSatisfying(
            d => d.equals( mv ) && d.address( LCs[2] ).length == 2
              && d.address( LCs[2] )[1] % 2 == 0
        ).forEach( d => d.makeIntoA( M.metavariable ) )
    } )
    let constraints = LCs[1].children().slice( 1 )
    const apply = new LurchSymbol( '@apply' )
    const isEFANotation = lc => ( lc instanceof Application )
                             && lc.numChildren() == 3
                             && lc.child( 0 ).equals( apply )
    const convertToEFA = lc => M.newEFA( lc.child( 1 ), lc.child( 2 ) )
    const wrapper = new Application( ...constraints )
    wrapper.descendantsSatisfying( isEFANotation )
           .map( d => d.replaceWith( convertToEFA( d ) ) )
    constraints = wrapper.children()
    return new M.Problem( ...constraints )
    // Note: The database entry also contains the solution set; we ignore that.
}
const allDatabaseEntries = matchingTests.map( getProblemFromDatabaseEntry )

const seconds = 1000
const timeBetweenOutputs = 2*seconds
const timeThis = ( title, func, iterations = 1 ) => {
    console.log( `Running "${title}," ${iterations} times...` )
    const before = new Date
    let lastOutput = new Date
    for ( let i = 0 ; i < iterations ; i++ ) {
        const startOfRun = new Date
        if ( i == 0 || i == iterations - 1
          || startOfRun - lastOutput > timeBetweenOutputs ) {
            console.log( `\tRun ${i+1}/${iterations}...` )
            lastOutput = startOfRun
        }
        func()
    }
    const after = new Date
    const elapsed = after - before
    console.log( `${elapsed/seconds}s for ${iterations} runs ~ ${elapsed/iterations}ms/run` )
}

timeThis(
    'Small EFA Problems (not all unary)',
    () => smallEFAProblems.forEach( P => Array.from( P.solutions() ) ),
    100
)
timeThis(
    'Full Matching database (all unary)',
    () => allDatabaseEntries.forEach( P => Array.from( P.solutions() ) ),
    25
)
