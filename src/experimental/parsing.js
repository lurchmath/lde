//////////////////////////////////////////////////////////////////////////////
//
//                       Parsers and Parsing Utilties 
//                       for converting strings to LCs
//
//  (KEEP OUT!  Work in progress.)
//
//  This file is still under construction and subject to frequent change.

//////////////////////////////////////////////////////////////////////////////
//
// Imports
//
import { Environment } from '../environment.js'
import { Symbol as LurchSymbol } from '../symbol.js'

//////////////////////////////////////////////////////////////////////////////
// Make Parser
//
// Make a normal and tracing peggy parser from the given string and customize
// the error formatting, then return both parsers in an array.
export const makeParser = parserstr => {
  const opts = { cache:true }
  const traceopts = { ...opts , trace:true }
  const rawparser = peggy.generate(parserstr,opts)
  const rawtraceparser = peggy.generate(parserstr,traceopts)
  const parser = s => {
    try { 
      return rawparser.parse(s)
    } catch(e) {
      if (typeof e.format === 'function') {
        console.log(e.format([{
          grammarSource:parserstr,
          text:s
        }]))
      } else {    
        console.log(e.toString())
      }
      return undefined
    }
  }
  const traceparser = s => {
    try { 
      return rawtraceparser.parse(s)
    } catch(e) {
      if (typeof e.format === 'function') {
        console.log(e.format({ }))
      } else {    
        console.log(e.toString())
      }
      return undefined
    }
  }
  return [parser,traceparser]
}

//////////////////////////////////////////////////////////////////////////////
// Process Shorthands 
//
// In order to make it convenient to enter large documents in putdown notation,
// it is convenient to use fromPutdown to enter some reserved content in the
// document that is preprocessed before evaluating the document.
// 
// The following are what we have for Shorthands. More might be added later. 
//
//  * Scan a document looking for the symbol '<<', which we call a 'marker'. 
//    For every marker, 
//      (i) if the preceding sibling is an environment, attribute it 
//          as a 'BIH'. 
//      (ii) if the preceding sibling is a declaration, attribute it 
//           as a 'Declare',
//      (iii) in either case, finally, delete the marker.
//
//   * Scan for occurrences of the symbol '@' and replace that with the 
//     symbol "LDE EFA" (which then will still print as '@' but it's what is
//     needed under the hood).
//
//   * Scan for occurrences of the symbol '<thm' and mark its previous
//     sibling as a user theorem.
//
//   * Scan for occurrences of the symbol `✔︎` and `✗` and mark its 
//     previous sibling with .expectedResult 'valid' or 'invalid', 
//     respectively.
//
// Naturally we have to run this FIRST before anything else.  These changes are
// made in-place - they don't return a copy of the document.
//
// This does no error checking, so << has to be an outermost expression with a
// previous sibling and @ has to appear in some sensible location.
//
// TODO: 
//   * when this becomes permanent, just modify fromPutdown to support this
//     functionality or generalize adding customized shorthands.  One can
//     imagine wanting to add things like an easy way to enter labels or
//     reasons or citations or mark things as a formula in the future that are
//     easier than the current putdown attribute notation.  I have not played
//     with smackdown notation yet either.  Consider that option.
export const processShorthands = L => {

  // for each symbol named symb, do f
  const processSymbol = ( symb , f ) =>  {
    L.descendantsSatisfying( x => (x instanceof LurchSymbol) && x.text()===symb )
     .forEach( s => f(s) )
  }

  processSymbol( '@' , m => { 
      m.replaceWith(new LurchSymbol('LDE EFA'))
    } )

  processSymbol( '≡' ,  m => { 
    const LHS = m.previousSibling()
    const RHS = m.nextSibling()
    let A1=LHS.copy().asA('given'), A2=LHS.copy(),
        B1=RHS.copy(), B2=RHS.copy().asA('given')
    LHS.replaceWith(new Environment(A1,B1))
    RHS.replaceWith(new Environment(B2,A2))
    m.remove()
  } )

  processSymbol( '<<' , m => { 
      const target = m.previousSibling()
      if (target instanceof Declaration) {
        target.makeIntoA('Declare')
      } else { 
        target.makeIntoA('BIH')
      }  
      m.remove()
    } )

  // Same as the previous, but attributes the next sibling.
  processSymbol( '>>' , m => { 
    m.nextSibling().makeIntoA('BIH')
    m.remove()
  } )

  processSymbol( '<thm' , m => {
    // There's a subtlety here.  We don't want top mark this as a 'Rule' yet
    // because it has not yet been converted to an LC Formula. We will need the
    // non-formula original (with no metavariables) for Matching so the user's
    // theorem can be validated but also a Formula version that can be
    // instantiated to prove Corollaries.  So for now we just flag this with an
    // internal js attribute 'userthm' to indicated it was flagged by the
    // shortHand '<thm' and process it later when processing the doc.
    m.previousSibling().userThm = true
    m.remove()
  } )
  
  processSymbol( 'thm>' , m => {
    // Same as the previous, but attributes the next sibling.
    m.nextSibling().userThm = true
    m.remove()
  } )

  // Mark the next sibling as a RuleSet (should be an environment)
  processSymbol( 'rules>' , m => {
    const wrapper = m.nextSibling()
    wrapper.children().forEach( kid => {
      kid.makeIntoA('Rule')
      wrapper.shiftChild()
      kid.insertBefore(wrapper) 
    } )
    wrapper.remove()
    m.remove()
  } )
  
  // Mark the next sibling as a Rule (should also be an environment)
  processSymbol( 'rule>' , m => {
    m.nextSibling().makeIntoA('Rule')
    m.remove()
  } )

  processSymbol( '✔︎' , m => { 
    m.previousSibling().expectedResult = 'valid'
    m.remove() 
  } )

  processSymbol( '✗' , m => { 
    m.previousSibling().expectedResult = 'indeterminate' 
    m.remove()
  } )

  processSymbol( '!✗' , m => { 
    m.previousSibling().expectedResult = 'invalid' 
    m.remove()
  } )

  processSymbol( '---' , m => { 
    if (m.parent().isAComment()) m.parent().ignore=true 
  })
}
///////////////////////////////////////////////////////////////////////////////