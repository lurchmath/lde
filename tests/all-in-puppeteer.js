
// Run the entire unit testing suite in the browser through puppeteer,
// extract the results, and dump them to the console with nice colors,
// in a simple imitation of how Mocha actually looks on the command line.

// First launch a simple web server in the test folder.

require( './simple-server.js' ).startServer( { verbose : false } )

// Now fire up an invisible Chromium to visit the test page and get its results:

const puppeteer = require( 'puppeteer' )

// define colors for various test result types
const clr = require( 'ansi-colors' )
const color = ( type, text ) => {
    if ( typeof text == 'undefined' ) text = type
    return type == 'passed' ? clr.green( text ) :
           type == 'failed' ? clr.red( text ) : clr.yellow( type )
}
const stateToSymbol = { 'passed' : '✓', 'failed' : '❌' }

// print one test result, and log what type it was for a later summary:
const results = { }
let lastSuite = null
const showTest = test => {
    if ( test.suite != lastSuite ) {
        console.log( `\n  ${test.suite}` )
        lastSuite = test.suite
    }
    const timedOut = test.timedOut ? ', timed out' : ''
    console.log( `    ${color( test.result, stateToSymbol[test.result] )} `
               + clr.gray( test.name )
               + clr.gray( ` (${test.speed}: ${test.duration}ms${timedOut})` ) )
    if ( test.hasOwnProperty( 'error' ) ) {
        console.log( test.error.message )
        console.log( test.error.stack )
    }
    if ( results.hasOwnProperty( test.result ) )
        results[test.result]++
    else
        results[test.result] = 1
}

// print the summary data in the results variable:
const showSummary = () => {
    console.log( '\n' )
    const types = Object.keys( results )
    for ( const type of types ) {
        console.log( color( type, `  ${results[type]} ${type}` ) )
    }
    console.log()
}

// run puppeteer and collect results, sending them to the above functions
( async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto( 'http://localhost:8080/tests/test-index.html' )
    await page.waitFor( () => window.hasOwnProperty( 'allMochaResults' ) )
    const results = await page.evaluate( () => window.allMochaResults )
    results.forEach( showTest )
    showSummary()
    await browser.close()
    process.exit()
} )()

