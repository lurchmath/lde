//////////////////////////////////////////////////////////////////////////////
//
// LurchNode (Lode)
//
// Description: This allows us to define a node REPL which has all
//              of the lurch LDE brains loaded.
//
// Syntax: at the bash prompt type "node lode.js" where lode.js is this file,
//         assuming the current directory is the /scripts directory containing
//         the file, OR type "npm run lode" in the root folder of the repository.
//
// TODO: clean out cruft from "Ends" and add appropriate syntax highlighting for
//       Let-bodies.
///////////////////////////////////////////////////////////////////////////////

// NOTE: all imports must be at the top of the file
import repl from 'repl'
// file system module
import fs from 'fs'
// import the exec command from the child_process module
import { execSync } from 'child_process'
// In LODE we have no need for EventTarget because we don't edit MCs in 
// real time and react to changes.  Importing this BEFORE importing 
// math-concept.js disables that.  This keeps the size and complexity of LCs 
// simpler and avoids spamming 'inspect' reports.
import disableEventTarget from './disable-event-target.js'
// load everything from index.js
import * as Lurch from '../src/index.js'
// load the Problem class
import { Problem } from '../src/matching/problem.js'
// load CNFTools
import CNF from '../src/validation/conjunctive-normal-form.js'
// load Ken's experimental code
import Compact, { CNFProp } from '../src/experimental/global-validation-lab.js'
// load PropositionalForm
import { PropositionalForm } from '../src/validation/propositional-form.js'
// load Solution class
import { Solution } from "../src/matching/solution.js"
// load DeBruijn
import { encodeExpression } from '../src/matching/de-bruijn.js'
// load SourceMap
import { SourceMap  } from '../src/source-map.js'
// load Algebrite
import Algebrite from '../dependencies/algebrite.js'
// load SAT
import { satSolve } from '../dependencies/LSAT.js'
// load chalk and stripAnsi
import chalk from 'chalk'
import erase from 'strip-ansi'

const blueText = text => chalk.ansi256(12)(text)
const heading = text => chalk.ansi256(226)(text)
const item = text => chalk.ansi256(214)(text)
// Lode conveniences
const timer = f => {
  let start = Date.now()
  f()
  console.log((Date.now()-start)+' ms')
}
const metavariable = 'LDE MV'
const instantiation = 'LDE CI'
const EFA = 'LDE EFA'
const formula = 'formula'
const constant = 'constant'
const hint = 'blatant instantiation'
const scoping = 'scope errors'
const valid = 'valid'
const invalid = 'invalid'
const context = 'context'
const declare = 'Declare'
const ProperName = 'ProperName'
const validation = 'validation result'
const End = 'End'
const isEnd   = L=> (L instanceof Expression && 
                     L.child(0) instanceof LurchSymbol &&
                     L.child(0).text()===End) || 
                     (L instanceof LurchSymbol && L.text()===End)

/////////////////////////////////////////////////////////////////////////
// Lode syntax highlighting

// Lode Color Theme
const defaultPen = chalk.ansi256(12)       // Lode blue
const metavariablePen = chalk.ansi256(3)   // orangish (also 220 is nice)
const constantPen = chalk.ansi256(226)     // yellowish
const instantiationPen = chalk.ansi256(8)  // dirt
const hintPen = chalk.ansi256(93)          // purpleish
const attributePen = chalk.ansi256(249)    // shade of grey
const attributeKeyPen = chalk.ansi256(2)   // matches string green
const checkPen = chalk.ansi256(46)         // bright green
const starPen = chalk.ansi256(226)         // bright gold
const xPen = chalk.ansi256(9)              // brightred
const contextPen = chalk.ansi256(56)       // purpleish
const decPen = chalk.ansi256(30)           // aqua-ish
const commentPen = chalk.ansi256(19)       // dim purple-blue 
const headingPen = chalk.ansi256(226)      // bright Yellow
const docPen = chalk.ansi256(248)          // light grey text
const linenumPen = chalk.ansi256(22)       // slightly darker blue than default
// const smallPen (maybe TODO some day) \u{1D5BA} is the code for small a

// compute once for efficiency
const goldstar   = starPen('★')
const greencheck = checkPen('✔︎')
const redx       = xPen('✗')
const idunno     = '❓'  // the emoji itself is red

///////////////////////////
// Lode custom LC formatter
//
// Options (booleans to show/hide things)
// showAttributes
// showContexts
// showValidation
// showProperNames
// simpleProperNames
// showEnds
// showInstantiations
// showFormulas
// showUserOnly
//
// useful unicode chars: ✔︎★✗

// utilities:
const tab = n => { return Array.seq(()=>'',1,n+1).join(' ') }
//
const indent = (s,n) => {
  const t = tab(n)
  return t+s.replaceAll(/\n(.)/g,'\n'+t+'$1')
}
// All attributes option
const All = { 
  showAttributes:true,
  showContexts:true,  // we currently don't use these
  showValidation:true,
  showProperNames:true,
  simpleProperNames:false,
  showEnds:true,
  showInstantiations:true
} 
// clean report option
const detailed = {
  numbered:true,
  showcontexts:true,
  showEnds:true, 
  hideFinished:false,
  showProperNames:true,
  simpleProperNames:false,
  showInstantiation:true
} 
// clean report option
const clean = {
  numbered:true, 
  hideFinished:true
} 
// user report option
const user = {
  numbered:false, 
  hideFinished:true,
  showUserOnly:true
} 

// custom formatter
const formatter = (options={showValidation:true}) => {
  return (L, S, attr) => {
    let ans = ''

    // hint markers
    if (L.isA(hint) || (L instanceof LurchSymbol && L.text()==='<<')) {  
      ans += hintPen(S)
    // metavariables        
    } else if (L.isA(metavariable)) {
      ans += metavariablePen(S)        
    // the LDE EFA constant symbols
    } else if (L instanceof LurchSymbol && L.text()===EFA) {
      ans += (L.constant) ? constantPen('@') : defaultPen('@')
    // the End constant symbol is a kind of instantiation (inserted by the LDE)
    } else if (L instanceof LurchSymbol && L.text()===End) {
      ans += instantiationPen(End)
    // comments just display their string (second arg) with the comment pen 
    } else if (L.isAComment()) {
      ans += commentPen('// '+L.child(1))
    // proper names for constants with body and bound symbols 
    } else if (options.showProperNames && L.hasAttribute(ProperName)) {
      const propname = L.getAttribute(ProperName)
      // we put quotes around the properName if it contains whitespace
      ans += attributePen((/\s/g.test(propname))?`'${propname}'`:propname)
    // proper names color but not text for constants with body but not bound 
    } else if (options.simpleProperNames && L.hasAttribute(ProperName)) {
      // we put quotes around the properName if it contains whitespace
      ans += attributePen(S)
    // constants
    } else if (L.constant) {
      ans += constantPen(S)
    // declaration prefixes
    } else if (L instanceof Declaration) {
      const label = L.isA('Declare') ? decPen('Declare') : 
                    L.isA('given')   ? decPen('Let')     : decPen('ForSome')
      ans += (L.isA('given') ? ':' : '') + label + 
              S.slice(0).replace(/\s*,\s*]$/,']') 
    // Ends
    } else if (L.hasAncestorSatisfying( isEnd )) {
      ans += (options.showEnds) ? instantiationPen(S) : ''
    // Ends  
    } else if (isEnd(L)) {
      ans += (options.showEnds) ? instantiationPen(S) : ''
    // Declaration body copies
    } else if (L.bodyof) {
      ans += (options.showEnds) ? instantiationPen(S) : ''
    // instantiations  
    } else if (L.hasAncestorSatisfying( x => x.isA(instantiation) )) {
      ans += (options.showInstantiations) ? instantiationPen(S) : ''
    // everything else  
    } else {
      ans += defaultPen(S)
    }
    // show contexts    
    if (options.showContexts) {
      if (L.hasAttribute(context)) {
        const symblist = L.getAttribute(context)
        if (symblist.length > 0) {
          ans += attributePen('.')+
                 symblist.map(x=>contextPen(x)).join(attributePen(','))
        } 
      }
    }
    // show attributes
    if (options.showAttributes) {
      // skip highlighted attributes - first the types
      const highlighted=[ metavariable, constant, instantiation, hint, valid, 
            invalid, declare, End, formula ].map( s => '_type_'+s )
      // then non-types
      highlighted.push(scoping,context,ProperName,validation)
      let keys=attr.filter( a => !highlighted.includes(a) )
      // format what's left
      if (keys.length>0) {
        // open attribute bracket
        ans += attributeKeyPen('❲')
        keys.forEach( (a,k) => {
          // separate keys with commas
          ans += (k>0) ? attributePen(',') : ''
          // format types or true values just with their key
          ans += (a.startsWith('_type_')) ?
                  attributeKeyPen(a.replace(/^_type_/,'')) :
                  (L[a]===true) ? attributeKeyPen(a) :
                  attributeKeyPen(a)+
                  attributePen('='+JSON.stringify(L.getAttribute(a)))
        })
        ans+=attributeKeyPen('❳')
      }
    }
    // show validation except for hidden ForSome bodies
    if (options.showValidation && ans.length>0 ) {
      if (Validation.result(L) && Validation.result(L).result==='valid') {
        if (L.isA(hint)) {  
          ans += goldstar
        } else {
          ans += greencheck
        }
      } else if ((Validation.result(L) && Validation.result(L)!=='valid') || 
                 L.preemie) {
        ans += redx
      }
    }
    // mark redeclared symbols
    if (L instanceof LurchSymbol && L.parent() instanceof Declaration &&
        L.parent().symbols().includes(L) &&
        L.parent().hasAttribute('scope errors') &&
        L.parent().getAttribute('scope errors').redeclared &&
        L.parent().getAttribute('scope errors').redeclared.includes(L.text())) {
       ans+=redx    
    }   
    return ans
  }  
}

// Nested arrays of LCs come up often in Lode (e.g. X.children()) so we want to 
// be able to syntax highlight them.  This identifies them.
const isNestedArrayofLCs = A => {
  return ((A instanceof LogicConcept) || 
          (A instanceof Array) && (A.every(isNestedArrayofLCs))
         )
}

// Apply the custom formatter to nested arrays of LCs.
// Indent and number lines as needed.  Note that for arrays we usually are
// debugging something, so we show everything by default.
const format = (x,options,indentlevel=0) => {
  if (x instanceof LogicConcept) {
    return defaultPen(indent(
           x.toPutdown(formatter(options), 
                       text => /\n/.test( text ) || erase(text).length > 50 ) , 
           indentlevel))
  } else if (isNestedArrayofLCs(x)) { 
    return indent(`[\n${x.map(y=>format(y,All,indentlevel+1))
                  .join(',\n')}\n]`,
                  indentlevel)
  } else {
    return x
  }
}

// The following 'show' commands are depricated in favor of the .report() 
// commands. Not deleting them yet until I check that they aren't used by the
// code.
const show = (L,options={showValidation:true}) => console.log(format(L,options))

// see above
const shownice = L => console.log(format( L , 
  { showAttributes:true,
    showContexts:false,
    showValidation:true,
    showProperNames:false,
    simpleProperNames:true,
    showEnds:false,
    showInstantiations:true
 }
))

// see above
const showall = L => console.log(format( L , All ))

// Just list the keys in an LC.  This would be more useful as an LC extension.
const showkeys = L => { 
  let keys = L.getAttributeKeys()
  keys.forEach( key => { 
    console.log(`${chalk.ansi256(2)(key.replace(/^_type_/,''))}: ${attributePen(format(L.getAttribute(key)))}`)
  })
}

// Welcome splash screen
console.log(`\nWelcome to ${blueText("𝕃𝕠𝕕𝕖")} - the Lurch Node app\n(type .help for help)\n`)
// start a new context
//
// Note: that we use the useGlobal parameter so the current context
// is shared with this script.  Otherwise by importing things below
// into the repl context we ended up with errors due to there being two contexts
// and uncertainty about which one is running what.  That's why we use global.
// below to import things.
//
const rpl = repl.start( { 
    ignoreUndefined: true,
    prompt: defaultPen('▶︎')+' ',
    useGlobal: true,
    writer: ( expr ) => {
        if (isNestedArrayofLCs(expr)) {
          let ans=format(expr)
          return (ans==='')?format(expr,All):ans             
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

// Load all of the following into the Lode global object
Object.assign( global, Lurch )
Object.assign( global, Compact )
global.Depth = Infinity
global.Algebrite = Algebrite
global.compute = Algebrite.run
global.CNF = CNF
global.CNFProp = CNFProp
global.Problem = Problem
global.PropositionalForm = PropositionalForm
global.encodeExpression = encodeExpression
global.SourceMap = SourceMap
global.satSolve = satSolve
global.chalk = chalk
global.erase = erase
global.instantiationPen = instantiationPen
global.defaultPen = defaultPen
global.linenumPen = linenumPen
global.headingPen = headingPen
global.docPen = docPen
global.goldstar = goldstar
global.greencheck = greencheck
global.redx = redx
global.idunno = idunno
global.All = All
global.detailed = detailed
global.clean = clean
global.user = user
global.lc = s => { return LogicConcept.fromPutdown(s)[0] }
global.mc = s => { return MathConcept.fromSmackdown(s)[0] }
global.tab = tab
global.indent = indent
global.inspect = ( object, depth=1 ) => {
    console.log( util.inspect( object, {
        customInspect: false,
        showHidden: false,
        depth: depth,
        colors: true
    } ) )
}
global.timer = timer
global.Debug = true
global.formatter = formatter
global.format = format
global.show = show
global.shownice = shownice
global.showall = showall
global.showkeys = showkeys
global.list = list
global.isNestedArrayofLCs = isNestedArrayofLCs
// user initialization file
global.initialize = function(fname='initproofs.js') { 
  const init = fs.readFileSync(fname,{ encoding:'utf8'}) 
  eval.apply(this,[init+'\n'])  
}
global.Report = Report
global.Benchmark = Benchmark
global.execStr = command => String(execSync(command))
global.exec = command => console.log(String(execSync(command)))

// Convenience syntax
LogicConcept.prototype.show = function(options={showValidation:true}) {
                              show(this,options) }
LogicConcept.prototype.shownice = function() { shownice(this) }
LogicConcept.prototype.showall = function() { showall(this) }
LogicConcept.prototype.print = function() { console.log(defaultPen(this)) }
LogicConcept.prototype.inspect = function(...args) { inspect(this,...args) }

rpl.defineCommand( "features", {
    help: "Show Lode features",
    action() {
        console.log( chalk.ansi256(248)(
`
${heading('Lode Features')}
  Lode is the Node.js REPL with all of the modules in index.js loaded at the
  start. If the expression echoed is an LC (resp. MC) or array of those, its 
  putdown (resp. smackdown) form is printed on the next line instead of the 
  usual default (util.inspect). In addition, it provides the following.

  ${heading('Useful Syntactic sugar')}
    ${item('lc(s)')}         : constructs an LC from the putdown string s
    ${item('mc(s)')}         : constructs an MC from the smackdown string s
    ${item('X.report()')}    : prints a syntax highlighted, numbered view of LC X
                    Optional args 'detailed', 'clean' and 'user' (no quotes) 
                    show variations
    ${item('X.inspect(x,d)')}: prints the object structure of X to depth d. If d
                    is omitted the default is 1
    ${item('.list')}         : show the list of known libs and proofs
    ${item('exec(command)')} : execute the given shell commmand and print the result
    ${item('initialize()')}  : loads and executes 'initproof.js' from the scripts
                    folder. A different file can be executed by calling it with
                    the optional filename, e.g. initialize('initacid.js') 
    ${item('compute(s)')}    : calls Algebrite.run(s) 
                    (see Algebrite docs at algebrite.org)')}
    
  ${heading('Extra Packages')}  
    ${item('Algebrite')}     : a computer algebra system (see algebrite.org)
    ${item('satSolve')}      : a boolean satisfiability program 
                    (see www.comp.nus.edu.sg/~gregory/sat)
    ${item('chalk')}         : a Node package to colorize text output to the terminal 
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