//////////////////////////////////////////////////////////////////////////////
//
// LurchNode (Lode)
//
// Description: This allows us to define a node REPL which has all
//              of the lurch LDE brains loaded.
//
// Syntax: at the bash prompt type "node lode.js" where lode.js is this file,
//         assuming the current directory is the /scripts directory containing,
//         the file, OR type "npm run lode" in the root folder of the repository.
//
///////////////////////////////////////////////////////////////////////////////

// Welcome splash screen
// console.log(`\nWelcome to \x1B[1;34m𝕃𝕠𝕕𝕖\x1B[0m - the Lurch Node app\n(type help() for help)`)
console.log(`\nWelcome to \x1B[1;34m𝕃𝕠𝕕𝕖\x1B[0m - the Lurch Node app`)

// start a new context
//
// Note: that we use the useGlobal parameter so the current context
// is shared with this script.  Otherwise by importing things below
// into the repl context we ended up with errors due to there being two contexts
// and uncertainty about which one is running what.  That's why we use global.
// below to import things.
//
import repl from 'repl'
repl.start({ ignoreUndefined: true,
             prompt:`\x1B[1;34m▶︎\x1B[0m `,
             useGlobal: true })

// load everything from index.js
import * as Lurch from '../src/index.js'
for ( let key in Lurch ) global[key] = Lurch[key]

// load Algebrite
import Algebrite from 'algebrite'
global.Algebrite = Algebrite

// load SAT
import { satSolve } from '../dependencies/LSAT.js'
global.satSolve = satSolve
