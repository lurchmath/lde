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
import * as Lurch from '../src/index.js'
// load PropositionalForm
import { PropositionalForm } from '../src/validation/propositional-form.js'
// load Algebrite
import Algebrite from '../dependencies/algebrite.js'
// load SAT
import { satSolve } from '../dependencies/LSAT.js'
// load chalk
import chalk from 'chalk'
const blueText = text => `\x1B[1;34m${text}\x1B[0m`
const heading = text => chalk.ansi256(226)(text)
const item = text => chalk.ansi256(214)(text) 

// Welcome splash screen
// console.log(`\nWelcome to \x1B[1;34m𝕃𝕠𝕕𝕖\x1B[0m - the Lurch Node app\n(type help() for help)`)
console.log(`\nWelcome to ${blueText("𝕃𝕠𝕕𝕖")} - the Lurch Node app\n(type .help for help)\n`)
// start a new context
//
// Note: that we use the useGlobal parameter so the current context
// is shared with this script.  Otherwise by importing things below
// into the repl context we ended up with errors due to there being two contexts
// and uncertainty about which one is running what.  That's why we use global.
// below to import things.
//
const patternsToIgnore = [
    'Symbol(kEvents)',
    'Symbol(events.maxEventTargetListeners)',
    'Symbol(events.maxEventTargetListenersWarned)'
]
const withPatternsIgnored = text => {
    patternsToIgnore.forEach( pattern => {
        const escaped = pattern.replace( /[-\/\\^$*+?.()|[\]{}]/g, '\\$&' )
        text = text.replace( new RegExp( `\n.*${escaped}.*\n`, 'g' ), '\n' )
    } )
    return text
}
const rpl = repl.start( { 
    ignoreUndefined: true,
    prompt: blueText('▶︎')+' ',
    useGlobal: true,
    writer: ( expr ) => {
        if ( expr instanceof LogicConcept ) {
            return blueText( expr.toPutdown() )
        } else if ( expr instanceof MathConcept ) {
            return blueText( expr.toSmackdown() )
        } else { 
            return withPatternsIgnored( util.inspect( expr, {
                customInspect:false,
                depth: Infinity,
                colors: true
            } ) )
        } 
    }
} )

Object.assign( global, Lurch )
global.Algebrite = Algebrite
global.compute = Algebrite.run
global.PropositionalForm = PropositionalForm
global.satSolve = satSolve
global.chalk = chalk
global.lc = s => { return LogicConcept.fromPutdown(s)[0] }
global.mc = s => { return MathConcept.fromSmackdown(s)[0] }
global.print = console.log
global.inspect = ( object, depth=null ) => {
    console.log( withPatternsIgnored( util.inspect( object, {
        customInspect: false,
        depth: depth,
        colors: true
    } ) ) )
}
  
rpl.defineCommand( "features", {
    help: "Show Lode features",
    action() {
        print( chalk.ansi256(248)(
`
${heading('Lode Features')}
  Lode is the Node.js REPL with all of the modules in index.js loaded at the
  start. If the expression on the input line is an LC (resp. MC), its putdown
  (resp. smackdown) form is printed on the next line instead of the usual default
  (util.inspect). In addition, it provides the following.

  ${heading('Syntactic sugar')}
    ${item('lc(s)')}         : constructs an LC from the putdown string s
    ${item('mc(s)')}         : constructs an MC from the smackdown string s
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
        ) )
        this.displayPrompt()
    }
} )

/*
  show - utility to provide options for formatting and syntax highlighting
         the smackdown format of an MC in the terminal.  This can be thought of 
         as the prettyprint exporter for terminal interfaces (currently designed
         for the Mac terminal).
         
  Syntax:  show( LC { optional options object } )
  
  Options:
     
*/
/*
global.lisp2pre ( string ) {
  let ans = '', open = 0, current 
  let tokens = string.split(' ').filter(x=>x)
  while (tokens.length) {
      current = tokens.shift()
      if (current = '(') { 
         ++open
      }
  }  
}

global.show ( L, options = { Indent:true, Color:true, Compact:false } ,
          ...args ) {
    // allow multiple option arguments to be combined into one
    let allopts = { ...options }
    for (let n=0;n<args.length;n++) allopts = { ...allopts , ...(args[n]) }
    
    // define syntax highlighting
    let colorize = ( x, col , font ) =>
      ( options && options.Color ) ?
        ( ( font ) ? chalk[col][font](x) : chalk[col](x) ) : x

    let decColor = 'yellow',
        envColor = 'whiteBright'
    let colon    = colorize(':','whiteBright','bold'),
        lsqr     = colorize('[',envColor),
        lset     = colorize('{',envColor),
        letStr   = colorize('Let{',decColor),
        decStr   = colorize('Declare{',decColor),
        rsqr     = colorize(']',envColor),
        rset     = colorize('}',envColor),
        closeDec = colorize('}',decColor),
        boundYes = colorize('✓','yellowBright'),
        concYes  = colorize('✔︎','yellowBright'),
        envYes   = colorize('★','yellowBright'),
        concNo   = colorize('✗','redBright'),
        envNo    = colorize('✘','redBright')

    // Separate styling for EEs
    if (this.inEE) {
      let EEcolor = 'blue'
      colon    = colorize(':',EEcolor)
      lsqr     = colorize('[',EEcolor)
      lset     = colorize('{',EEcolor)
      letStr   = colorize('Let{',EEcolor)
      decStr   = colorize('Declare{',EEcolor)
      rsqr     = colorize(']',EEcolor)
      rset     = colorize('}',EEcolor)
      closeDec = colorize('}',EEcolor)
      boundYes = colorize('✓',EEcolor)
      concYes  = colorize('✔︎',EEcolor)
      envYes   = colorize('★',EEcolor)
      concNo   = colorize('✗',EEcolor)
      envNo    = colorize('✘',EEcolor)
    }

    // initialize
    let result = ''

    // options.Indent determines if we should indent and add newlines
    if ( options && options.Indent ) {
      // indentLevel and tabsize are also optional options
      if (!options.hasOwnProperty('indentLevel')) options.indentLevel = 0
      if (!options.hasOwnProperty('tabsize')) options.tabsize = 2
      let tab = () => ' '.repeat(options.tabsize).repeat(options.indentLevel)

      // given's : first before environments and declarations
      result  +=  this.isAGiven ? colon : ''

      // Declarations are formatted on a single line, unless their body is an
      // environment, in which case we format the body starting on the following
      // line.
      if ( this.isAnActualDeclaration() ) {
        result+= ((this.declaration === 'variable') ? letStr : decStr)
              + ' '
              + this.allButLast.map(
                    child => child.toString(options)
                  ).join(' ')
        // Check for environment bodies
        if (this.last.isAnActualEnvironment() && !this.last.isEmpty) {
          options.indentLevel++
          result+= '\n'
                +  tab()
                +  this.last.toString( options )
                +  '\n'
          options.indentLevel--
          result+= tab()
        // otherwise format the body on one line
        } else {
          result+= ' '
                +  this.last.toString( options )
                +  ' '
        }
        // then close the declaration
          result+= closeDec
                + ( ( options && options.Conc && this.isValidated ) ?
                  ( (this.isValid) ? concYes : concNo ) : '' )
                + ( ( options && options.Conc && this.isvalidated ) ?
                    ( (this.isvalid) ? ' '+concYes : ' '+concNo ) : '' )

      // empty environments are formatted inline
      } else if ( this.isEmpty ) {
        return lset+' '+rset
               + ( ( options && options.Env && this.isValidated ) ?
                   ( (this.isValid) ? envYes : envNo ) : '' )

      // Ordinary environments are printed as indented subproofs
      } else {
        options.indentLevel++
        let lf = ( options && options.Compact ) ? ' ' : '\n'+tab()
        result+= ( this.isAFormula  ? lsqr  : lset )
              +  lf
              +  this.children().map(
                   child => child.toString( options ) )
                            .filter( Boolean )  // filter out empty strings
                            .join('\n'+tab())
              +  '\n'
        options.indentLevel--
        result+= tab()
              + ( this.isAFormula ? rsqr : rset )
              + ( ( options && options.Env && this.isValidated ) ?
                ( (this.isValid) ? envYes : envNo ) : '' )
      }

    // if indentations not requested, print it as a flat string
    } else {
      result+=( this.isAGiven    ? colon         : '' )
            + ( this.isAFormula  ? lsqr          :
              ( this.declaration && this.declaration === 'variable'
                                 ? letStr        :
              ( this.declaration && this.declaration === 'constant'
                                 ? decStr : lset )))
            + ' '
            + this.children().map( child => child.toString(options) )
                        .filter( Boolean )  // skip empty strings
                        .join( ' ' )
            + ' '
            + ( this.isAFormula  ? rsqr        : rset )
            + ( ( options && options.Env && this.isValidated ) ?
                ( (this.isValid) ? envYes : envNo ) : '' )
            + ( ( options && options.Conc && this.isvalidated ) ?
                ( (this.isvalid) ? ' '+concYes : ' '+concNo ) : '' )

    }

    return result

   }    
    // see if we have to markAll it to give the appropriate feedback
    // if ( ( allopts.Skolem || allopts.EEs ) && !this.isMarked ) this.markAll()

    // print the result
    console.log(X.toString( allopts ))
  }
*/
