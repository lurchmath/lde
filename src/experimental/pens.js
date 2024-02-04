/**
 * Lode Pens
 *
 * This module contains the various colored pens we use using the `chalk`
 * package in Lode.
 *
 */

///////////////////////////////////////////////////////////////////////////////
// Imports
//
// NOTE: all imports must be at the top of the file

// load chalk and erase
import chalk from 'chalk'
import erase from 'strip-ansi'

/////////////////////////////////////////////////////////////////////////
// Lode syntax highlighting

// Lode Color Theme
const defaultPen = chalk.ansi256(12)       // Lode blue
const metavariablePen = chalk.ansi256(3)   // orangish (also 220 is nice)
const constantPen = chalk.ansi256(226)     // yellowish
const instantiationPen = chalk.ansi256(8)  // dirt
const hintPen = chalk.ansi256(93)          // purpleish
const attributePen = chalk.ansi256(249)    // shade of grey
const declaredPen = chalk.ansi256(212)     // pinkish
const attributeKeyPen = chalk.ansi256(2)   // matches string green
const checkPen = chalk.ansi256(46)         // bright green
const starPen = chalk.ansi256(226)         // bright gold
const xPen = chalk.ansi256(9)              // brightred
const contextPen = chalk.ansi256(56)       // purpleish
const decPen = chalk.ansi256(30)           // aqua-ish
const commentPen = chalk.ansi256(252)      // light grey
const headingPen = chalk.ansi256(226)      // bright Yellow
const docPen = chalk.ansi256(248)          // light grey text
const linenumPen = chalk.ansi256(22)       // darkish green
const itemPen =  chalk.ansi256(214)        // orangish
const stringPen =  chalk.ansi256(2)        // the green that node useds for strings
// const smallPen (maybe TODO some day) \u{1D5BA} is the code for small a

// compute once for efficiency
const goldstar   = starPen('★')
const redstar    = xPen('☆')
const greencheck = checkPen('✔︎')
const redx       = xPen('✗')
const idunno     = '❓'  // the emoji itself is red
const preemiex   = xPen('!✗') 

export default {
  
  // formatting utiltiies
  erase, chalk,
  
  // special symbols
  goldstar, redstar, greencheck, redx, idunno, preemiex, 
  
  // Pens
  defaultPen , metavariablePen , constantPen , instantiationPen, hintPen, 
  attributePen , attributeKeyPen , declaredPen, checkPen , starPen , xPen , contextPen , 
  decPen , commentPen , headingPen , docPen , linenumPen , itemPen , stringPen
  
}

/////////////////////////////////////////////