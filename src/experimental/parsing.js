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
//
//    (i) if the preceding sibling is an environment, attribute it
//    as a 'BIH'. 
//
//    (ii) if the preceding sibling is a declaration, attribute it
//    as a 'Declare', 
//
//    (iii) in either case, finally, delete the marker.
//
//   * Scan for occurrences of the symbol 'λ' (or  '@' for backwards
//     compatibility) and replace that with the symbol "LDE EFA" (which then
//     will still print as '𝜆' but it's what is needed under the hood).
//
//   * Scan for occurrences of the symbol '<thm' and mark its previous sibling
//     as a user theorem, or 'thm> and mark its next sibling as a Theorem.
//
//   * Scan for occurrences of the symbol `✔︎` and `✗` and mark its previous
//     sibling with .expectedResult 'valid' or 'invalid', respectively.
//
// Naturally we have to run this FIRST before anything else.  These changes are
// made in-place - they don't return a copy of the document.
//
// This does no error checking, so << has to be an outermost expression with a
// previous sibling and λ has to appear in some sensible location.
//
export const processShorthands = L => {

  // for each symbol named symb, do f
  const processSymbol = ( symb , f ) =>  {
    L.descendantsSatisfying( x => (x instanceof LurchSymbol) && x.text()===symb )
     .forEach( s => f(s) )
  }
  // make next sibling have a given type
  const makeNext =  (m,type) => {
    m.nextSibling().makeIntoA(type)
    m.remove()
  }
  // make previous sibling have a given type
  const makePrevious =  (m,type) => {
    m.previousSibling().makeIntoA(type)
    m.remove()
  }
  
  // declare the type of the next or previous sibling 
  processSymbol( 'BIH>'     , m => makeNext(m,'BIH') )
  processSymbol( 'declare>' , m => makeNext(m,'Declare') )
  processSymbol( 'rule>'    , m => makeNext(m,'Rule') )  
  processSymbol( 'thm>'     , m => makeNext(m,'Theorem') )  
  processSymbol( '<thm'     , m => makePrevious(m,'Theorem') )  
  
  // depricated but kept for backward compatibility
  processSymbol( '<<' , m => { 
    const target = m.previousSibling()
    const type = (target instanceof Declaration) ? 'Declare' : 'BIH'
    target.makeIntoA(type)
    m.remove()
  } )
  // depricated but kept for backward compatibility
  processSymbol( '>>'     , m => makeNext(m,'BIH') )
  
  // rules> - Mark each of the children of the next sibling (which should be an
  // environment) as a Rule, and delete both the shorthand and the environment. 
  processSymbol( 'rules>' , m => {
    const wrapper = m.nextSibling()
    wrapper.children().forEach( kid => {
      if (kid instanceof Environment) { kid.makeIntoA('Rule') }
      wrapper.shiftChild()
      kid.insertBefore(wrapper) 
    } )
    wrapper.remove()
    m.remove()
  } )
  
  // simple replacements
  processSymbol( 'λ' , m => { 
    m.replaceWith(new LurchSymbol('LDE EFA'))
  } )  
  processSymbol( '@' , m => { 
    m.replaceWith(new LurchSymbol('LDE EFA'))
  } )
  
  // expand equivalences
  processSymbol( '≡' ,  m => { 
    const LHS = m.previousSibling()
    const RHS = m.nextSibling()
    let A1=LHS.copy().asA('given'), A2=LHS.copy(),
        B1=RHS.copy(), B2=RHS.copy().asA('given')
    LHS.replaceWith(new Environment(A1,B1))
    RHS.replaceWith(new Environment(B2,A2))
    m.remove()
  } )

  // For testing purposes, flag the expected result
  processSymbol( '✔︎' , m => { 
    m.previousSibling().setAttribute('ExpectedResult','valid')
    m.remove() 
  } )

  processSymbol( '✗' , m => { 
    m.previousSibling().setAttribute('ExpectedResult','indeterminate') 
    m.remove()
  } )

  processSymbol( '!✗' , m => { 
    m.previousSibling().setAttribute('ExpectedResult','invalid') 
    m.remove()
  } )
  
  // TODO: make this more consistent with the other shorthands
  processSymbol( '---' , m => { 
    if (m.parent().isAComment()) m.parent().ignore=true 
  })

  return L
}
///////////////////////////////////////////////////////////////////////////////