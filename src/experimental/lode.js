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
import peggy from 'peggy'
import { Tokenizer, Grammar } from 'earley-parser'

// In LODE we have no need for EventTarget because we don't edit MCs in 
// real time and react to changes.  Importing this BEFORE importing 
// math-concept.js disables that.  This keeps the size and complexity of LCs 
// simpler and avoids spamming 'inspect' reports.
import './disable-event-target.js'

// with that disabled, now we can load everything from index.js and other LDE tools
import * as Lurch from '..//index.js'
import { Problem } from '..//matching/problem.js'
import CNF from '..//validation/conjunctive-normal-form.js'

// Experimental Code
// everything in the global validation lab. 
import Compact from './global-validation-lab.js'
// load the custom formatter class
import Reporting from './reporting.js' 
// load the Document class
import { Document , assignProperNames , markDeclaredSymbols } 
       from './document.js'
// load the lc command
import { lc , mc , checkExtension, diff } from './extensions.js'
// load the CNFProp tools for testing
import { CNFProp } from './CNFProp.js'

// External packages
// load Algebrite
import Algebrite from '../../dependencies/algebrite.js'
// load SAT
import { satSolve } from '../../dependencies/LSAT.js'
import { makeParser , processShorthands } from './parsing.js'
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Globals
//
// Initialize the global namespace to make the following commands available
//
// LDE basic code
Object.assign( global, Lurch )

// Experimental code
Object.assign( global, Compact )
Object.assign( global, Reporting )
global.CNF = CNF
global.Problem = Problem
global.Document = Document
global.CNFProp = CNFProp

// exposing commands for debugging
global.assignProperNames = assignProperNames
global.markDeclaredSymbols = markDeclaredSymbols
global.processShorthands = processShorthands

// External packages
global.satSolve = satSolve
global.Algebrite = Algebrite
global.peggy = peggy
global.Tokenizer = Tokenizer
global.Grammar = Grammar
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Lode Utiltities
//
// Custom Lode commands and utilties
global.compute = Algebrite.run

// Run terminal commands from the Lode REPL
global.exec = command => console.log(String(execSync(command)))
global.execStr = command => String(execSync(command))

// because it's easier to remember
global.metavariable = 'LDE MV'

// see if a filename has the correct extension and add it if it doesn't
global.checkExtension = checkExtension

// find the subtitution delta between two Application expressions if it exists
global.diff = diff

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
    `cat "${proofPath}${checkExtension(fname,'lurch')}"`)))
  }

  // display a library file by filename
global.catlib = function(fname) {
  console.log(defaultPen(execStr(
    `cat "${libPath}${checkExtension(fname,'lurch')}"`)))
  } 

  // List both libs and proofs
const list = () => { console.log(
  `\n${headingPen('Available Libraries:')}\n`+
  `${docPen(execStr('cd '+libPath+';ls -pRC '))}\n`+
  `${headingPen('Available Proofs:')}\n` +
  `${docPen(execStr('cd '+proofPath+';ls -pRC'))}`
  )}
  
/////////////////////////////////////////////////////////////////////////////
//
//  File handling utilities
//

// the path to library definition files
global.libPath = './libs/'

// the path to proof definition files
global.proofPath = './proofs/'

// the path to parser definition files
global.parserPath = './parsers/'

// the file extension used by default for libraries and proof files. Don't
// include the . here for easy use in RegExp's
global.LurchFileExtension = 'lurch'  

// the file extension used by default for libraries and proof files
global.ParserFileExtension = 'peggy' 

// the file extension used for libraries and proof files for parsing with the
// toy peggy parser
global.PegFileExtension = 'peg' 

// check a file name to see if it has the .lurch extension and if not, add it
global.checkLurchExtension = name => checkExtension(name , LurchFileExtension )

// Load just the string for a library and return that.  You can omit the .js 
// extension.
global.loadLibStr = (name) => {
  const filename = libPath + checkLurchExtension(name)
  if (!fs.existsSync(filename)) {
    console.log(`No such file or folder: ${name}`)
    return
  }
  return fs.readFileSync( filename , { encoding:'utf8'} )
}

// Load just the string for a proof document and return that.    
global.loadProofStr = (name,extension) => {
  const filename = proofPath + checkLurchExtension(name)
  if (!fs.existsSync(filename)) {
    console.log(`No such file or folder: ${name}`)
    return
  }
  return fs.readFileSync( filename , { encoding:'utf8'} )
}

// Load just the string for a parser grammar and return that.
global.loadParserStr = (name) => {
  const filename = parserPath + 
  checkExtension(name, ParserFileExtension)
  if (!fs.existsSync(filename)) {
    console.log(`No such file or folder: ${name}`)
    return
  }
  return fs.readFileSync( filename , { encoding:'utf8'} )
}

// Load just the string for a proof in toy ascii format and return that
global.loadPegStr = (name) => {
  const filename = proofPath + 
  checkExtension(name, PegFileExtension)
  if (!fs.existsSync(filename)) {
    console.log(`No such file or folder: ${name}`)
    return
  }
  return fs.readFileSync( filename , { encoding:'utf8'} )
}

// load a parser by specifying it's filename
global.loadParser = (name) => {
  const parserstr = loadParserStr(name)
  return makeParser(parserstr)
}

// a convenient way to make an lc or mc at the Lode prompt or in scripts
global.parsers = loadParser('asciimath')
global.parse = parsers[0]
global.trace = parsers[1]
global.lc = lc 
global.mc = mc
global.$ = s => {
  let parsed = parse(s)
  return (parsed) ? lc(parsed) : undefined
}

// print a string to the console with line numbers
global.say = s => {
  const lines = s.split('\n')
  const lineNumberWidth = String(lines.length).length
  lines.forEach( (line, index) => {
    const lineNumber = String(index + 1).padStart(lineNumberWidth, ' ')
    console.log(`${lineNumber}: ${line}`)
  })
}


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
    if (isNestedArrayofLCs(expr) || isNestedSetofLCs(expr)) {
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
      start. If the expression echoed is an LC (resp. MC) or array of
      those, its putdown (resp. smackdown) form is printed on the next line
      instead of the usual default (util.inspect). In addition, it provides
      the following.
      
      ${headingPen('Useful Syntactic sugar')}
      ${itemPen('$(s)')}          : constructs an LC from the ascii-putdown string s
      ${itemPen('lc(s)')}         : constructs an LC from the putdown string s
      ${itemPen('mc(s)')}         : constructs an MC from the smackdown string s
      ${itemPen('X.report()')}    : prints a syntax highlighted, numbered view of LC X
                      Optional args 'everything', 'show', 'detailed',
                      'clean' and 'user' (with no quotes) show variations
      ${itemPen('X.inspect(x,d)')}: prints the object structure of X to depth d. If d
                      is omitted the default is 1
      ${itemPen('.list')}         : show the list of known libs and proofs
      ${itemPen('.test')}         : run the acidtests script
      ${itemPen('exec(command)')} : execute the given shell commmand and print the result
      ${itemPen('initialize()')}  : loads and executes 'initproof.js' from the scripts
                      folder. A different file can be executed by calling 
                      it with the optional filename, e.g. initialize('acidtests') 
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

// define the Lode .list command
rpl.defineCommand( "test", {
  help: "Run the default test script ('acidtests.js').",
  action() { 
    initialize('acidtests')
    this.displayPrompt()
  }
})

// export the repl.writer to be available at the repl command line
global.write = s => console.log(rpl.writer(s))

/////////////////////////////////////////////