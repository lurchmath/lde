//////////////////////////////////////////////////////////////////////////////
//
//                                Docify
//                prepare an LC for Global n-compact Validation 
//
//  (KEEP OUT!  Work in progress.)
//
//  This file is still under construction and subject to frequent change.
//
//  In the current implementation of global n-compact validation we currently
//  make many simplifying assumptions about the nature of a document.  But they
//  are hard to keep track of when just defined, but not codified.  So we
//  include here routines for the phase of processing that moves things around
//  and computes js attributes that are required for validation.

//////////////////////////////////////////////////////////////////////////////
//
// Imports
//
import fs from 'fs'
import { LogicConcept } from '../logic-concept.js'
import { Environment } from '../environment.js'
import { Symbol as LurchSymbol } from '../symbol.js'
import { lc , checkExtension, subscript } from './extensions.js'
import { processShorthands } from './parsing.js'

//////////////////////////////////////////////////////////////////////////////
//
// Utilities
//

//////////////////////////////////////
//
// Structural Changing Utilities
//

// Move Declares to the top of the document.
export const moveDeclaresToTop = doc => {
  doc.Declares().reverse().forEach( dec => {
    dec.remove()
    doc.unshiftChild(dec)
  })
  return doc
}

// Process the user's theorems 
//
// If a user specifies that a claim Environment is a Theorem, he is declaring
// that he wants to use it as a Rule after that (if we enable the option to
// allow users to enter Theorems... otherwise just let them enter them as
// ordinary claim environments like proofs that aren't marked asA 'Theorem' but
// can be formatted as such). But we want to mark his theorem as valid or
// invalid just like any other proof in addition to using it as a Rule.  To
// accomplish this, we make an invisible copy of the Theorem immediately
// following the theorem, make that a formula, and label it as a Rule for future
// use.  This does not have to be done if the Theorem has no metavariables as a
// Rule because it would be redundant. When a Rule copy of the user's Theorem is
// inserted it does not have to be marked as a given since it has no prop form,
// but its instantiations do.  We flag the inserted Rule version of the Theorem as
// .userThm to distinguish it from ordinary Rules.
//
// This has to be done after processing Shorthands and moving Declares to the
// top so the user's theorems are in the scope of declared constants in the
// library, which then prevents them from being metavariables. 
export const processTheorems = doc => {
  [ ...doc.descendantsSatisfyingIterator( x => x.isA('Theorem') ) ].forEach( 
    thm => {
      // to make this idempotent, check if the copy is already there
      if ( thm.nextSibling()?.userRule ) { return }
      // make a formula copy of the thm
      let thmrule = Formula.from(thm)
      // if it doesn't have any metavars there's no need for it
      if ( Formula.domain(thmrule).size === 0 ) { return }
      // if it does, change it from a Theorem to a Rule
      thmrule.unmakeIntoA('Theorem')
      thmrule.makeIntoA('Rule')
      // mark it for easy identification later
      thmrule.userRule = true
      // and insert it after the theorem
      thmrule.insertAfter(thm)
    })
  return doc
}

// Process Declaration Bodies
//
// Append the bodies of all ForSomes.
// export const processDeclarationBodies = doc => {
//   // get the declarations with a body (hence the 'true') that don't contain 
//   // metavariables
//   const decs = doc.declarations(true).filter( dec =>
//      Formula.domain(dec).size===0)   
//   // get the lets with a body (hence the 'true') that don't contain 
//   // metavariables
//   const lets = doc.lets(true).filter( dec =>
//     Formula.domain(dec).size===0)
//   // push the lets onto the forSomes array
//   forSomes.push(...lets) 
//   // insert a copy of the body after the declaration and mark where it came from
//   // with the js attribute .bodyof, unless it's already there
//   forSomes.forEach( decl => {
//     if (!(decl.nextSibling() && decl.nextSibling().bodyof &&
//           decl.nextSibling().bodyof === decl )) {      
//       let decbody = decl.body().copy()
//       if (decl.isA('given')) decbody.makeIntoA('given')
//       decbody.insertAfter(decl)
//       decbody.bodyof = decl
//       decbody.makeIntoA('Body')
//     }
//   })
// }  

// We keep a list of js attribute names that are used by validation.  Since
// these are computed from the original content of the LC supplied by the user
// having this list lets us reset the entire LC by removing these attributes and
// recomputing them to revalidate it from scratch when we need to. 
export const computedAttributes = [
  'Constant', 'ProperName'
] 

// Reset all of the attributes computed by these docify utilities.  
//
// NOTE: it might be faster to just rebuild and recompute the whole document
// from source, but we put this here just in case it's needed. 
export const resetComputedAttributes = doc => {
  [...doc.descendantsIterator()].forEach( x => {
    computedAttributes.forEach( a => delete x[a])
  })
  return doc
}

//////////////////////////////////////////////////////////////////////////////
// Mark Declared Symbols
//
// Mark explicitly declared symbols s, throughout an LC by setting
// s.constant=true
export const markDeclaredSymbols = doc => {
  // fetch all of the declarations
  let Declares = doc.Declares()
  // fetch all of the symbols
  let symbols = doc.descendantsSatisfying( x => x instanceof LurchSymbol )
  // for each one, see if it is in the scope of any Declare declaration of that symbol
  symbols.forEach( s => {
      if (Declares.some( d => 
        (d.isAccessibleTo(s) || (s.parent()===d)) && 
         d.symbols().map(x=>x.text()).includes(s.text())
      ))
      s.constant = true
    }
  )
  return doc
}
