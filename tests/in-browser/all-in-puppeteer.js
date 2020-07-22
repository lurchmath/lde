
// Run the entire unit testing suite in the browser through puppeteer,
// extract the results, and dump them to the console with nice colors,
// in a simple imitation of how Mocha actually looks on the command line.

// ---

// The first portion of this code was taken from a StackOverflow question.
// https://stackoverflow.com/questions/16333790/node-js-quick-file-server-static-files-over-http
// Thank you!

const http = require( 'http' )
const url = require( 'url' )
const fs = require( 'fs' )
const path = require( 'path' )
const port = 8080

http.createServer( ( req, res ) => {
    const parsedUrl = url.parse( req.url )
    let pathname = `.${parsedUrl.pathname}`
    const ext = path.parse( pathname ).ext
    const extensionToMime = {
        '.ico'  : 'image/x-icon',
        '.html' : 'text/html',
        '.js'   : 'text/javascript',
        '.json' : 'application/json',
        '.css'  : 'text/css',
        '.png'  : 'image/png',
        '.jpg'  : 'image/jpeg',
        '.wav'  : 'audio/wav',
        '.mp3'  : 'audio/mpeg',
        '.svg'  : 'image/svg+xml',
        '.pdf'  : 'application/pdf',
        '.doc'  : 'application/msword'
    };
  
    fs.exists( pathname, exist => {
        // if no such file
        if( !exist ) {
            res.statusCode = 404
            res.end( `File ${pathname} not found!` )
            return
        }
    
        // if directory search for index file matching the extention
        if ( fs.statSync( pathname ).isDirectory() )
            pathname += '/index' + ext
    
        // read file from file system
        fs.readFile( pathname, ( err, data ) => {
            if ( err ) {
                // error getting file
                res.statusCode = 500
                res.end( `Error getting the file: ${err}.` )
            } else {
                // found; send type and data
                res.setHeader( 'Content-type', extensionToMime[ext] || 'text/plain' )
                res.end( data )
            }
        } )
    } )


} ).listen( port )

// ---
//
// (end of borrowed code)

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
    await page.goto( 'http://localhost:8080/tests/in-browser/all-node-tests.html' )
    await page.waitFor( () => window.hasOwnProperty( 'allMochaResults' ) )
    const results = await page.evaluate( () => window.allMochaResults )
    results.forEach( showTest )
    showSummary()
    await browser.close()
    process.exit()
} )()

