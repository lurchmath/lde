/**
 * Lode is the Lurch Node app. It defines a node REPL which has all of the Lurch
 * LDE brains loaded. For details see the [Lode tutorial](@tutorial Lurch Node REPL).
 *
 * @module Lode
 */
//////////////////////////////////////////////////////////////////////////////
//
// LurchNode (Lode)
//
// Description: This allows us to define a node REPL which has all
//              of the lurch LDE brains loaded.
//
// Syntax: at the bash prompt type "node lode" where lode.js is this file,
//         assuming the current directory is the directory containing
//         the file.
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Imports
//
// NOTE: all imports must be at the top of the file

// REPL and file system utilities (non-Lurch modules)
import repl from 'repl'
import fs, { write } from 'fs'
import { execSync } from 'child_process'
import util from 'util'
import peggy from 'peggy'
// import asciimath2latex from './parsers/asciimath-to-latex.js'
import { latexToLurch } from './parsers/tex-to-lurch.js'
// import * as MathLive from 'mathlive'
// import { getConverter } from './utils/math-live.js'
// import katex from 'katex'
// import mathjax from 'mathjax-node'
// import React from 'react'

// In LODE we have no need for EventTarget because we don't edit MCs in real
// time and react to changes.  Importing this BEFORE importing math-concept.js
// disables that.  This keeps the size and complexity of LCs simpler and avoids
// spamming 'inspect' reports.
//
// NOTE: do not import any lurch modules above this point (in case they load
// something that loads MathConcept first before we get a chance to import the
// following).
import './disable-event-target.js'
// with that disabled, now we can load everything from index.js and other LDE tools
import * as Lurch from '../index.js'
import { Problem } from '../matching/problem.js'
import CNF from '../validation/conjunctive-normal-form.js'

// Experimental Code
//
// parsing
// import { Tokenizer, Grammar } from 'earley-parser'
// generic helper utilities
import Utilities from './utils.js'
// interpretation utilities
import Interpret from './interpret.js'
// everything in the global validation lab. 
import Compact from './global-validation.js'
// load the custom formatters and reporting tools
import Reporting from './reporting.js' 
// import the parsing utiltiies (processShorthands comes from Interpret)
import { makeParser, parselines } from './parsing.js'
// load the CNFProp tools for testing
import { CNFProp } from './CNFProp.js'

// External packages
// load Algebrite
import Algebrite from '../../dependencies/algebrite.js'
// load SAT
import { satSolve } from '../../dependencies/LSAT.js'
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Globals
//
// Initialize the global namespace to make the following commands available
//
// LDE basic code
Object.assign( global, Lurch )

// Experimental code
Object.assign( global, Utilities )
Object.assign( global, Interpret)
Object.assign( global, Compact )
Object.assign( global, Reporting )
global.CNF = CNF
global.Problem = Problem
global.CNFProp = CNFProp

// External packages
global.satSolve = satSolve
global.Algebrite = Algebrite
global.peggy = peggy
// global.Tokenizer = Tokenizer
// global.Grammar = Grammar
// global.MathLive = MathLive
// global.asciimath2latex = asciimath2latex
global.untex = latexToLurch
// global.getConverter = getConverter
// global.katex = katex
// global.mathjax = mathjax
// global.React = React
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Lode Utiltities
//
// Custom Lode commands and utilties
global.compute = Algebrite.run

// Run terminal commands from the Lode REPL
global.exec = command => console.log(String(execSync(command)))
global.execStr = command => String(execSync(command))
global.ls = (args='') => {
  const command = `ls -pC ${args}`
  console.log(
  `\n${docPen(execStr(command))}\n`)
}

// because it's easier to remember
global.metavariable = 'LDE MV'

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
/** List libs and proofs */
const list = () => { console.log(
  `\n${headingPen('Available Libraries:')}\n`+
  `${docPen(execStr('cd '+libPath+';ls -pRC '))}\n`+
  `${headingPen('Available Proofs:')}\n` +
  `${docPen(execStr('cd '+proofPath+';ls -pRC'))}`
)}

// two useful abbreviations
global.lc = s => { 
  const L = LogicConcept.fromPutdown(s)
  return (L.length===1) ? L[0] : L 
}
global.mc = s => { 
  const M = MathConcept.fromSmackdown(s)
  return (M.length===1) ? M[0] : M  
}
global.check = s => { 
  const doc = $(s)
  validate(doc)  
  return doc
}
// a useful utility for exploring matching
global.matchMaker = (decl,pstr,estr) => {
  let doc = $(`{
    Declare ${decl}
    Rule: :{ ${pstr} }
    ${estr}
  }`)
  interpret(doc)
  doc.report(all)
  const p = doc.child(2,0)
  const e = doc.child(3)
  const ans = matchPropositions(p,e)
  return ans.toString().split(/(?<=}),(?={)/)
            .map( s=>s.slice(1,-1) )
            .map( s=>s.split(/(?<=\)),(?=\()/) )
            .map( s=>s.map( x=>x.replace(/__/g,'') ) )
            .map( s=>s.map( x=>x.replace(/\(([^,]+),(.+)\)$/g,'$1=$2') ) )
}

/////////////////////////////////////////////////////////////////////////////
//
//  File handling utilities
//

// the path to library definition files
/** 
 * A library path 
 */
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

// check a file name to see if it has the .lurch extension and if not, add it
global.checkLurchExtension = name => checkExtension(name , LurchFileExtension )

// Load a LDE document
//
// Load a document string, recursively replacing included files, and wrap the
// result in environment brackets, { }. before returning.
//
global.loadDoc = ( name, folder='./', extension=LurchFileExtension ) => {
  // load the specified file
  let doc = `{\n${loadDocStr( name, folder, extension )}\n}`
  doc = parse(doc)
  doc = lc(doc)
  interpret(doc)
  validate(doc)
  return doc
}

// Load a LDE document string
//
// This command works just like loadStr with one difference. If the string that
// is loaded contains a line of the form 
//
//    include fname
//
// it will load the string in fname and replace that line with the contents of
// that file recursively checking for more include statements.  No checking is
// done to prevent circular dependencies.
//
global.loadDocStr = ( name, folder='./', extension=LurchFileExtension ) => {
  // load the specified file
  let ans = loadStr( name, folder, extension )
  // recursively replace all of the includes
  const regx = /(?:^|\n)[ \t]*[iI]nclude[ \t]+([^ \t][^\n]*)(?:\n|$)/gm
  return ans.replace(regx,(line,fname) => { return loadDocStr(fname) })
}

// Load just the string for a file and return that. You can omit the .lurch
// extension. The second argument is the folder which default to the current folder. 
global.loadStr = ( name, folder='./', extension=LurchFileExtension) => {
  const filename = folder + checkExtension(name,extension)
  if (!fs.existsSync(filename)) {
    console.log(`No such file or folder: ${name}`)
    return
  }
  return fs.readFileSync( filename , { encoding:'utf8'} )
}

// Convenience versions of the same thing
global.loadLibStr = (name) => loadStr(name,libPath)
global.loadProofStr = (name) => loadStr(name,proofPath)
global.loadParserStr = (name) => loadStr(name,parserPath,ParserFileExtension)

// load a parser by specifying it's filename
global.loadParser = (name) => {
  const parserstr = loadParserStr(name)
  return makeParser(parserstr)
}

// a convenient way to make an lc or mc at the Lode prompt or in scripts
let parsers = loadParser('lurch-to-putdown')
global.parse = parsers[0]
global.trace = parsers[1]
global.$ = s => {
  let parsed = parse(s)
  return (parsed) ? lc(parsed) : undefined
}

// a parser from my asciimath to LaTeX
parsers = loadParser('lurch-to-tex')
global.tex = parsers[0]
global.textrace = parsers[1]
global.parselines = parselines
// global.mathlive = MathLive.convertLatexToMarkup
// global.html = katex.renderToString

// print a string to the console with line numbers
global.say = s => {
  const lines = s.split('\n')
  const lineNumberWidth = String(lines.length).length
  lines.forEach( (line, index) => {
    const lineNumber = linenumPen(
      String(index + 1).padStart(lineNumberWidth, ' ')+':')
    const coloredLine = (/^\s*\/\//.test(line)) ? instantiationPen(line) : line
    console.log(`${lineNumber} ${coloredLine}`)
  })
}

// Concatenate the parsed contents of the specified files in order as children
// of a single environment and return the environment. The arguments can be
// strings interpreted as file names relative to the experimental folder, or LCs
// that are already constructed in Lode.
global.catdocs = ( ...files ) => {
  // the reserved constants are declared at the top of every document
  // Note: we temporarily include '/' here until we can fix the bug in the 
  // ascii peggy parser that prevents it from being Declared. 
  const system = lc(`:[ 'LDE EFA' '➤' ]`).asA('Declare')
  // create a temporary empty environment to hold the final answer
  let ans = new Environment()
  ans.pushChild(system)
  // if no file is specified just return the system declaration
  if ( files.length === 0 ) return ans
  // for each file specified on the argument list, load it if necessary and
  // add it to the answer environment
  files.forEach( original => {
    // create a place to store it
    let file
    // if it's already an LC, just make a copy
    if (original instanceof LogicConcept) { 
      file = original.copy() 
      // otherwise it must be a string containing a filename, so load it  
    } else {
      const filestr = loadStr(original)
      // if the file is not found it will print a message and return undefined,
      // so just return 
      if (!filestr) return
      // it succeeded so convert it to an LC
      file = $(filestr)
    }
    // if it's not an array, make it be one
    if (file instanceof LogicConcept) { file = [file] }
    // then push all of the elements onto the answer environment
    file.forEach( x => ans.pushChild(x) )
  } )
  return ans
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
    return format(expr)
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
      ${itemPen('$(s)')}          : constructs an LC from the lurchmath string s
      ${itemPen('lc(s)')}         : constructs an LC from the putdown string s
      ${itemPen('mc(s)')}         : constructs an MC from the smackdown string s
      ${itemPen('X.report()')}    : prints a syntax highlighted, numbered view of LC X
                      Optional args 'all', 'show', 'detailed', 'allclean'
                      and 'clean' (with no quotes) show variations
      ${itemPen('X.inspect(x,d)')}: prints the object structure of X to depth d. If d
                      is omitted the default is 1
      ${itemPen('.list')}         : show the list of known libs and proofs
      ${itemPen('.test')}         : run the acidtests script
      ${itemPen('.makedocs')}     : make the jsdoc docs
      ${itemPen('.showdocs')}     : open the jsdoc docs in the browser
      ${itemPen('.compileparser')}: compile the parser to js
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

// define the Lode .test command
rpl.defineCommand( "test", {
  help: "Run the default test script ('acidtests.js').",
  action() { 
    initialize('utils/acidtests')
    this.displayPrompt()
  }
})

// define the Lode .compileparser command
rpl.defineCommand( "compileparser", {
  help: "Compile the Lurch parser.",
  action() { 
    try {
      console.log(`${defaultPen('Compiling Lurch parser to lurch-to-putdown.js...')}`)
      execStr('cd parsers && peggy --cache --format es -o lurch-to-putdown.js lurch-to-putdown.peggy')
      execStr('cd parsers && cp lurch-to-putdown.js ../../../../lurchmath/parsers/')
      console.log(`${defaultPen('Compiling Lurch parser to lurch-to-tex.js...')}`)
      execStr('cd parsers && peggy --cache --format es -o lurch-to-tex.js lurch-to-tex.peggy')
      execStr('cd parsers && cp lurch-to-tex.js ../../../../lurchmath/parsers/')
      console.log(`${defaultPen('Done.')}`)
    } catch (err) {
      console.log(xPen('Error compiling the parser.'))
    }
    this.displayPrompt()
  }
})

// define the Lode .list command
rpl.defineCommand( "parsertest", {
  help: "Run the Lurch parser test.",
  action() { 
    try { 
      const s=lc(parse(loadStr('parsers/LurchParserTest')))
      parselines(parse)
      console.log(`${itemPen('Parser Test:')} → ok`)
    } catch (e) { 
      console.log(xPen(`ERROR: Parser test failed.`)) 
    }
    this.displayPrompt()
  }
})

// define the Lode .makedocs command
rpl.defineCommand( "makedocs", {
  help: "Run jsdocs to make the documentation.",
  action() {
    console.log(defaultPen('Building docs...')) 
    try {
      execStr('rm -rf docs && jsdoc ./* -d docs -c utils/jsdoc-conf.json -u tutorials/ && node utils/post-docs && syncdocs')
      console.log(defaultPen('...done'))
    } catch (err) {
      console.log('Error building docs.')
    }
    this.displayPrompt()
  }
})

// define the Lode .showdocs command
rpl.defineCommand( "showdocs", {
  help: "Open the jsdocs index.html page in the browser.",
  action() { 
    exec('open docs/index.html')
    this.displayPrompt()
  }
})


// export the repl.writer to be available at the repl command line
global.write = s => console.log(rpl.writer(s))

// Just a global place to store benchmarking informtion.  Just assign properties
// to it if you want to benchmark e.g. number of times a routine is called,
// total time, number of instantiations created, etc.
global.Accumulator = { }
/////////////////////////////////////////////