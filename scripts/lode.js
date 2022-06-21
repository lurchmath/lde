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

// NOTE: keeping all imports must be at the top of the file
import repl from 'repl'
// load everything from index.js
import * as Lurch from '../src/index.mjs'
// load Algebrite
import Algebrite from 'algebrite'
// load SAT
import { satSolve } from '../dependencies/LSAT.js'
// load chalk
import chalk from 'chalk'

// Welcome splash screen
// console.log(`\nWelcome to \x1B[1;34m𝕃𝕠𝕕𝕖\x1B[0m - the Lurch Node app\n(type help() for help)`)
console.log(`\nWelcome to \x1B[1;34m𝕃𝕠𝕕𝕖\x1B[0m - the Lurch Node app\n(type .help for help)\n`)
// start a new context
//
// Note: that we use the useGlobal parameter so the current context
// is shared with this script.  Otherwise by importing things below
// into the repl context we ended up with errors due to there being two contexts
// and uncertainty about which one is running what.  That's why we use global.
// below to import things.
//
const rpl = repl.start({ 
              ignoreUndefined: true,
              prompt:`\x1B[1;34m▶︎\x1B[0m `,
              useGlobal: true,
              writer: ( expr ) => {
                if (expr instanceof LogicConcept) {
                   return '\x1B[1;34m'+expr.toPutdown()+'\x1B[0m'
                } else { 
                   return util.inspect(expr,
                      { customInspect:false,
                        depth: Infinity,
                        colors: true
                   }) } 
                }
             })

for ( let key in Lurch ) 
global[key] = Lurch[key]
global.Algebrite = Algebrite
global.compute = Algebrite.run
global.satSolve = satSolve
global.chalk = chalk
global.lc = (s) => { return LogicConcept.fromPutdown(s)[0] }
global.print = console.log
global.inspect = (x,d=null) => {
      console.log(util.inspect(x,
        { customInspect:false,
          depth:d,
          colors:true
        }))
    }
  
rpl.defineCommand(
  "features",
  {
    help: "Show Lode features",
    action() {
      let heading = x => chalk.ansi256(226)(x)
      let item = x => chalk.ansi256(214)(x) 
      print(
        chalk.ansi256(248)(
`
${heading('Lode Features')}
  Lode is the Node.js REPL with all of the modules in index.js loaded at the
  start. If the expression on the input line is an LC, its .toPutdown form is
  printed on the next line instead of the usual default (util.inspect). In
  addition, it provides the following.

  ${heading('Syntactic sugar')}
    ${item('lc(s)')}         : constructs an LC from the putDown string s
    ${item('print(s)')}      : prints s to the console
    ${item('inspect(x,d)')}  : prints the object structure of x to depth d. If d is
                    omitted the default is Infinity
    ${item('compute(s)')}    : calls Algebrite.run(s) 
                    (see Algebrite docs at algebrite.org)')}
    
  ${heading('Extra Packages')}  
    ${item('Algebrite')}     : a computer algebra system (see algebrite.org)
    ${item('satSolve')}      : a boolean satisfiability program 
                    (see www.comp.nus.edu.sg/~gregory/sat)
    ${item('chalk')}         : a Node package to colorize text output to the terminal 
                    (see www.npmjs.com/package/chalk)
`          
        )
      )
      this.displayPrompt()
    }
  }
)