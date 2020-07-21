
/*
 * Used by the test suite to load expect.js into the global namespace.
 * This is so that each test file needn't load that itself, because doing so
 * does not work in browser-based testing.  See package.json for how this file
 * is automatically imported by command-line mocha.
 * 
 * Now, neither browser-based testing nor node-based testing explicitly load
 * expect.js, but both have it automatically imported for them.  And the test
 * suite can thus be used in both the browser and the command line.
 */
import expect from 'expect.js'
global.expect = expect
