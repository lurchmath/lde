
// Launch a simple web server in the test folder, so that the user can
// point to it with their browser.

require( './simple-server.js' ).startServer( { verbose : true } )

// Figure out which command is appropriate for opening URLs, based on
// the user's platform.

const command = /^darwin/.test( process.platform ) ? 'open' :
                /^win/.test( process.platform ) ? 'start' : 'xdg-open'

// Run the command to open the test suite page in the user's browser.

const { execSync } = require( 'child_process' )
execSync( `${command} http://localhost:8080/tests/test-index.html` )
