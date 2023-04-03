//////////////////////////////////////////////////////////////////////////////
//
// LurchNode (Lode)
//
// Description: This allows us to define a node REPL which has all
//              of the lurch LDE brains loaded.
//
// Syntax: at the bash prompt type "node lode" where lode.js is this file,
//         assuming the current directory is the /scripts directory containing
//         the file.
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Imports
//
// NOTE: all imports must be at the top of the file

// REPL and file system utilities
import repl from 'repl'
import fs from 'fs'
import { execSync } from 'child_process'
import util from 'util'

// In LODE we have no need for EventTarget because we don't edit MCs in 
// real time and react to changes.  Importing this BEFORE importing 
// math-concept.js disables that.  This keeps the size and complexity of LCs 
// simpler and avoids spamming 'inspect' reports.
import './disable-event-target.js'

// with that disabled, now we can load everything from index.js and other LDE tools
import * as Lurch from '../src/index.js'
import { Problem } from '../src/matching/problem.js'
import CNF from '../src/validation/conjunctive-normal-form.js'

// Experimental Code
// everything in the global validation lab. 
import Compact from '../src/experimental/global-validation-lab.js'
// load the custom formatter class
import Reporting from '../src/experimental/reporting.js' 
// load the Document class
import { Document , myLoadLibs } from '../src/experimental/document.js'
// load the lc command
import { lc , mc , checkExtension } from '../src/experimental/extensions.js'

// External packages
// load Algebrite
import Algebrite from '../dependencies/algebrite.js'
// load SAT
import { satSolve } from '../dependencies/LSAT.js'
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Globals
//
// Initialize the global namespace to make the following commands available
//
// LDE basic code
Object.assign( global, Lurch )
//
// Experimental code
Object.assign( global, Compact )
Object.assign( global, Reporting )
//
// additional LDE code
global.CNF = CNF
global.Problem = Problem
// additional experimental code
global.Document = Document
//
// External packages
global.satSolve = satSolve
global.Algebrite = Algebrite
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Lode Utiltities
//
// Custom Lode commands and utilties
global.compute = Algebrite.run
// Run terminal commands from the Lode REPL
global.exec = command => console.log(String(execSync(command)))
global.execStr = command => String(execSync(command))
// a convenient way to make an lc or mc at the Lode prompt or in scripts
global.lc = lc 
global.mc = mc
// see if a filename has the correct extension and add it if it doesn't
global.checkExtension = checkExtension
global.myLoadLibs = myLoadLibs
// for controlling the inspect-level for the default REPL echo
global.Depth = Infinity
// just a shorthand
global.inspect = (x , depth=1) => console.log(util.inspect(x , {
  customInspect: false , showHidden: false , depth: depth , colors: true
} ) )
// load an initialization file or js script and execute it
global.initialize = function(fname='initproofs') { 
  const init = fs.readFileSync(checkExtension(fname),{ encoding:'utf8'}) 
  eval.apply(this,[init+'\n'])  
}
// display a proof file by filename
global.catproof = function(fname) {
  console.log(defaultPen(execStr(
    `cat ${Document.proofPath}${checkExtension(fname,'lurch')}`)))
}
// display a library file by filename
global.catlib = function(fname) {
  console.log(defaultPen(execStr(
    3`cat ${Document.libPath}${checkExtension(fname,'lurch')}`)))
}
// List both libs and proofs
const list = () => { console.log(
  `\n${headingPen('Available Libraries:')}\n`+
  `${docPen(execStr('cd '+Document.libPath+';ls -pRC '))}\n`+
  `${headingPen('Available Proofs:')}\n` +
  `${docPen(execStr('cd '+Document.proofPath+';ls -pRC;cd ../../../scripts '))}`
)}

////////////////////////////////////////////////////////////////////////////
//
// Welcome splash screen
//
console.log(`\nWelcome to ${defaultPen("𝕃𝕠𝕕𝕖")}`+
            ` - the Lurch Node app\n(type .help for help)\n`)
// if there is an argument to lode.js, i.e., if someone runs this script as
//
// > node lode fname
//  
// then initialize the lode instance with the script named fname.js
if (process.argv.length>2) {
  let fname=process.argv[2]
  initialize(fname)
// if there is no argument, try to load init.js in the current folder
} else if ( fs.existsSync('init.js') ) {
  initialize('init')
}
// start a new REPL context
//
// Note: that we use the useGlobal parameter so the current context is shared
// with this script.  Otherwise by importing things into the repl context we
// ended up with errors due to there being two contexts and uncertainty about
// which one is running what.  That's why we use global.* above to import things.
//
const rpl = repl.start( { 
    ignoreUndefined: true,
    prompt: defaultPen('▶︎')+' ',
    useGlobal: true,
    writer: ( expr ) => {
      if (isNestedArrayofLCs(expr)) {
        let ans=format(expr)
        return (ans==='') ? format(expr,everything) : ans             
      } else if ( expr instanceof MathConcept ) {
        try { return defaultPen(expr.toSmackdown()) }
        catch { return defaultPen(expr.toString()) }
      } else { 
        return util.inspect( expr, 
          {
            customInspect: false,
            showHidden: false,
            depth: Depth,
            colors: true
          } 
        )
      } 
    }
} )
////////////////////////////////////////////////////////////////////////////

// define the .features command
rpl.defineCommand( "features", {
    help: "Show Lode features",
    action() {
        console.log( chalk.ansi256(248)(
`
${headingPen('Lode Features')}
  Lode is the Node.js REPL with all of the LDE modules loaded at the
  start. If the expression echoed is an LC (resp. MC) or array of those, its 
  putdown (resp. smackdown) form is printed on the next line instead of the 
  usual default (util.inspect). In addition, it provides the following.

  ${headingPen('Useful Syntactic sugar')}
    ${itemPen('lc(s)')}         : constructs an LC from the putdown string s
    ${itemPen('mc(s)')}         : constructs an MC from the smackdown string s
    ${itemPen('X.report()')}    : prints a syntax highlighted, numbered view of LC X
                    Optional args 'everything', 'detailed', 'clean' and 'user' 
                    (with no quotes) show variations
    ${itemPen('X.inspect(x,d)')}: prints the object structure of X to depth d. If d
                    is omitted the default is 1
    ${itemPen('.list')}         : show the list of known libs and proofs
    ${itemPen('exec(command)')} : execute the given shell commmand and print the result
    ${itemPen('initialize()')}  : loads and executes 'initproof.js' from the scripts
                    folder. A different file can be executed by calling it with
                    the optional filename, e.g. initialize('acidtests') 
    ${itemPen('compute(s)')}    : calls Algebrite.run(s) 
                    (see Algebrite docs at algebrite.org)')}
    
  ${headingPen('Extra Packages')}  
    ${itemPen('Algebrite')}     : a computer algebra system (see algebrite.org)
    ${itemPen('satSolve')}      : a boolean satisfiability program 
                    (see www.comp.nus.edu.sg/~gregory/sat)
    ${itemPen('chalk')}         : a Node package to colorize text output to the terminal 
                    (see www.npmjs.com/package/chalk)
                    
`
        ) )
        this.displayPrompt()
    }
} )

// define the Lode .list command
rpl.defineCommand( "list", {
    help: "List currently available Lode libraries and proofs",
    action() { 
      list()
      this.displayPrompt()
    }
  })

/////////////////////////////////////////////