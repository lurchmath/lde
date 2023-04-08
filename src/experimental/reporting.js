//////////////////////////////////////////////////////////////////////////////
//
// Reporting Utilties
//
// Description: This allows for custom formatting and customize reports
//              for LCs and various output devices.  For now we only support
//              the terminal in Lode.
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Imports
//
// NOTE: all imports must be at the top of the file

// load everything from index.js
import * as Lurch from '../index.js'
// load the experimental code
import Compact from './global-validation-lab.js'
// load chalk and stripAnsi
import chalk from 'chalk'
import erase from 'strip-ansi'
// load the commands from Lurch and Compact
Object.assign( global, Lurch )
Object.assign( global, Compact )

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
const commentPen = chalk.ansi256(252)      // light grey
const headingPen = chalk.ansi256(226)      // bright Yellow
const docPen = chalk.ansi256(248)          // light grey text
const linenumPen = chalk.ansi256(22)       // darkish green
const itemPen =  chalk.ansi256(214)        // orangish
const stringPen =  chalk.ansi256(2)        // the green that node useds for strings
// const smallPen (maybe TODO some day) \u{1D5BA} is the code for small a

// compute once for efficiency
const goldstar   = starPen('★')
const greencheck = checkPen('✔︎')
const redx       = xPen('✗')
const idunno     = '❓'  // the emoji itself is red


/////////////////////////////////////////////////////////////////////////
// Utilities
//

// Return a string of spaces of length n
const tab = n => { return Array.seq(()=>'',1,n+1).join(' ') }

// indent string s with a tab of size n
const indent = (s,n) => {
  const t = tab(n)
  return t+s.replaceAll(/\n(.)/g,'\n'+t+'$1')
}

// report the time it took to execute function f
const timer = f => {
  let start = Date.now()
  f()
  console.log((Date.now()-start)+' ms')
}

// Just list the keys in an LC.  This would be more useful as an LC extension.
LogicConcept.prototype.showkeys = function() { 
  let keys = this.getAttributeKeys()
  keys.forEach( key => { 
    console.log(`${stringPen(key.replace(/^_type_/,''))}:`+
                ` ${attributePen(format(this.getAttribute(key)))}`)
  })
}

////////////////////////////////////////////////////////
// Lode custom LC formatter
//
// Options (booleans)
//
// The idea here is that we pass an options object to the various formatting
// routines that is of the form { showP1, ... , showPn } where all of the
// showPi's are assigned 'true'.  Thus, by just listing what you want to show
// you can customize the output in a succinct manner.
//
// show LC attributes
const showAttributes =  true
// show Declares
const showDeclares =  true
// show red subscripts for declaration contexts
const showContexts = true
// show formulas
const showRules = true
// show partial instantiations
const showPartials = true
// show instantiations of formulas in the library
const showInstantiations = true
// show Bodies of ForSome declarations
const showBodies = true
// number the children of the LC being shown
const showNumbers = true
// show the proper names of symbols
const showProperNames = true
// show symbols with ProperNames in a different color
const showSimpleProperNames = true
// show just the last child of the document
const showUserOnly = true
// show user theorems as formulas
const showUserRules = true
// show user theorems (not the Rule copy)
const showUserThms = true
// show instantiations of user theorems
const showUserInstantiations = true
// show validation icons
const showValidation = true

// useful sets of options
//
// show everything report option
const everything = { showDeclares, showAttributes , showBodies, showContexts,
                     showRules , showUserThms , showPartials,
                     showInstantiations , showNumbers , showProperNames ,
                     showUserRules , showUserInstantiations , showValidation
                   }  
// simple report option
const show = { showDeclares, showAttributes , showBodies, showContexts,
               showRules , showUserThms , showPartials,
               showInstantiations , showProperNames ,
               showUserRules , showUserInstantiations , showValidation 
             }
// detailed report option
const detailed = {  showDeclares, showRules , showPartials, showInstantiations ,
                    showNumbers , showBodies, showProperNames , showUserRules ,
                    showUserThms , showValidation 
                 }
// clean report option
const clean = { showInstantiations, showNumbers, showSimpleProperNames , showUserThms ,
                showValidation } 
// user report option
const user = { showNumbers, showUserThms , showSimpleProperNames, showUserOnly , 
               showValidation }
// user report option
const defaultOptions = { showDeclares, showNumbers, showRules , showSimpleProperNames , 
  showUserThms , showValidation }


// Syntactic sugar for the formatter
const metavariable = 'LDE MV'
const instantiation = 'LDE CI'
const EFA = 'LDE EFA'
const formula = 'Formula'
const constant = 'constant'
const hint = 'BIH'
const scoping = 'scope errors'
const valid = 'valid'
const invalid = 'invalid'
const context = 'context'
const declare = 'Declare'
const ProperName = 'ProperName'
const validation = 'validation result'

// custom formatter
const formatter = ( options=defaultOptions ) => {
  return (L, S, attr) => {
    let ans = ''
    
    // optionally hide userThms or userRules
    if ((L.userThm && !options.showUserThms) ||
        (L.userRule && !options.showUserRules))  { // do nothing
    // hint markers
    } else if (L.isA(hint) || (L instanceof LurchSymbol && L.text()==='<<')) {  
      ans += hintPen(S)
    // metavariables        
    } else if (L.isA(metavariable)) {
      ans += metavariablePen(S)        
    // the LDE EFA constant symbols
    } else if (L instanceof LurchSymbol && L.text()===EFA) {
      ans += (L.constant) ? constantPen('@') : defaultPen('@')
    // comments just display their string (second arg) with the comment pen 
    } else if (L.isAComment()) {
      ans += commentPen(L.child(1))
    // proper names for constants with body and bound symbols 
    } else if (options.showProperNames && L.hasAttribute(ProperName)) {
      const propname = L.getAttribute(ProperName)
      // we put quotes around the properName if it contains whitespace
      ans += attributePen((/\s/g.test(propname))?`'${propname}'`:propname)
    // proper names color but not text for constants with body but not bound 
    } else if (options.showSimpleProperNames && L.hasAttribute(ProperName)) {
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
    // Declaration body copies
    } else if (L.bodyof) {
      ans += (options.showBodies) ? instantiationPen(S) : ''
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
            invalid, declare, formula ].map( s => '_type_'+s )
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
    return indent(`[\n${x.map(y=>format(y,everything,indentlevel+1))
                  .join(',\n')}\n]`,
                  indentlevel)
  } else {
    return x
  }
}

///////////////////////////////////////////////////////////////////////////
//
//  Reporting
//

// We assume 'this' is a document with all of the usual simplifying assumptions.
LogicConcept.prototype.report = function ( options ) {
  // default report
  options = options || defaultOptions
  
  if (options.showUserOnly) {
   console.log(defaultPen(this.lastChild().toPutdown(formatter(options), 
      text => /\n/.test( text ) || erase(text).length > 1 )))
  } else if (options.showNumbers) {
    
    let ans = defaultPen('  {\n')
    
    let linenum = ''
    this.children().forEach( c => {
      // hide Formulas, Instantiations, Partials, and Bodies unless they ask for them
      if ( (!options.showRules && c.isA('Rule')) ||
           (!options.showPartials && c.isA('Part')) ||
           (!options.showInstantiations && c.isA('Inst')) ||
           (!options.showBodies && c.isA('Body')) ||
           (!options.showDeclares && c.isA('Declare'))
         ) return
      linenum = `${c.indexInParent()}`
      linenum += tab(4-linenum.length)
      linenum = (!c.isA(instantiation)) ? linenumPen(linenum) 
                                        : instantiationPen(linenum)
      ans += linenum+format(c,options).replace(/\n/g,'\n    ')+'\n'
    })

    ans += defaultPen('  }')
    ans +=  (!Validation.result(this)) ? '' :
              (Validation.result(this).result==='valid') ? greencheck : redx
            
    console.log(ans)
  
  } else {
    console.log(defaultPen(this.toPutdown(formatter(options))))
  }
}

export default {
  
  // formatting utiltiies
  formatter, format, isNestedArrayofLCs, tab, indent, erase, timer, chalk,
  
  // special symbols
  goldstar, greencheck, redx, idunno,
  
  // Pens
  defaultPen , metavariablePen , constantPen , instantiationPen, hintPen, 
  attributePen , attributeKeyPen , checkPen , starPen , xPen , contextPen , 
  decPen , commentPen , headingPen , docPen , linenumPen , itemPen ,
  
  // report definitions
  everything, show, detailed , clean , user ,
  
  // report options
  showAttributes , showContexts , showRules , showInstantiations , 
  showNumbers , showProperNames , showUserRules , showUserInstantiations ,
  showValidation

}

/////////////////////////////////////////////