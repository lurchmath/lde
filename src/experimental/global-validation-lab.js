////////////////////////////////////////////////////////////////////////////////
//
//  Global n-compact Validation
//
//  (KEEP OUT!  Work in progress.)
//
//  This file is still under construction and subject to frequent change. It
//  contains all of the infrastructure, surrounding utilities, and other content
//  needed for the testing and design modifications for a global n-compact
//  validation tool.  Currently it is in a separate file that is only imported
//  when using Lode, the node LDE app, to keep it separate from the more
//  thoroughly tested code in the LDE repo.  Use this code at your own risk.
//
// TODO Summary: 
// * For each attribute we use below, decide whether it should be stored cached
//   as a permanent LC attribute or a normal js object attribute before moving
//   to the repo.
// * Optimizations: for a rule like symmetry of equality, it will ALWAYS be
//   instantiated twice for every equation in the user's doc.  Figure some way
//   to improve that situation in general.
// * Eliminate or replace BIHs. 
//   * Add "Consider" options that are force-matched to lone metavariable and
//     EFAs.
//   * When an EFA has a parameter that is partially instantiated, leverage that
//     by allowing it to match expressions that contain the partial
//     instantiations.
//   * Along these lines, one 'strategy' is to consider 'BIH-makers', namely
//     what kinds of natural, minimal things can a user enter when doing, say,
//     substitution, that would be a tiny enough hint that Lurch could construct
//     an entire BIH from it?
// * Consider speeding up matching in several ways.
//   * Allow an option to eliminate the constant lambda expression as a
//     solution.
//   * Allow an option to efficiently solve 'Weenie' matching problems. e.g., if
//     (@ P c) where P is a metavar and c is a constant is matched to e, and e
//     does not contain c, return the constant solution (or none if the previous
//     option is enabled.  If e only has one instance of c, there's only one
//     solution, so return that without recursing.  If it has two instances
//     there are four solutions, so return those.  Three have eight.  That
//     should cover about 99% of the cases.
// * Design a generic way to use multiple validation tools in the same document
//   so they work well together.  For example, to have a CAS rule work with this
//   501 validation tool we might insert a placeholder formula like `:{ CASRule
//   }` and when an expression is supposed to be validated by the CAS rule it
//   can put 'instantiations' after that formula to make a valid CAS expression
//   validate propositionally.
// * It would be nice to be able to have the following variant of substitution
//   which constructs 'virtual' e expressions to match formulas as follows.
//   Suppose we have, say, a transitive chain. We look at the difference between
//   two consecutive expressions and the operator connecting them and try to
//   find an instantiation that matches the expression formed by connecting the
//   differences with the operator.
// * The following algorithm makes several passes through the entire document to
//   process each step/phase separately for testing and experimenting. It might
//   be more efficient to make one pass through the entire document, modifying
//   everything as you go. Update: initial benchmarks seem to indicate that ALL
//   of the computation time is coming from finding all of the instantiations,
//   so this probably doesn't matter.  Furthermore, initial tests seem to
//   indicate that that in an interactive UI almost everything this algorithm
//   does will be almost instantaneous.  So optimization would mainly only
//   affect batch mode instantiation of a large document from scratch.
//
// New LC attributes used here  
// TODO: these are out of date... go through the code and update eventually
//
//    LC attributes: Environments 
//    * 'Rule' - (isA) this environment is a library Formula 
//    * 'BIH'  - (isA) this environment is a blatant instantiation hint supplied
//               by the user.
//
//    LC attributes: Declarations 
//    * 'Declare' - (isA) this declaration declares global constants and has no
//                  propositional form, whether a given or claim.
//
//    LC attributes: Symbols 
//    * 'ProperName' - its value is the proper name of this Lurch symbol
//
//    JS attributes: formula environments 
//    * 'domain'   - the js Set of metavariable names (strings) in this formula 
//    * 'isWeeny'  - boolean that is true iff this formula is Weeny (has at
//                   least one metavariable and at least one Weeny expression 
//    * 'weenies'  - the array of Weeny expressions in this formula, if any 
//    * 'finished' - boolean that is true if this formula is finished being
//                   instantiated and should be ignored on future passes
//
//    JS attributes: user's document environment 
//    * 'userPropositions' - cache of the user's propositions (the e expressions
//      to match) stored in the last child of the document (the user's content)
//
//    JS attributes: instantiation environments & BIH's 
//    * 'instantiation' - boolean indicating that this is an instantiation with
//                        no metavars left
//    * 'origin'   - the user proposition(s) that caused this instantiation
//
//    JS attributes: declarations body copy and premature generalizations
//    * 'bodyof'   - indicates an Expression is a copy of the body of the LC
//    * 'preemie'  - a expression that is a generalization associated with a Let
//      stored as its value (equal to its body) that is in the scope of that Let
//
//    JS attributes - Symbols 
//    * 'constant' - boolean that indicates whether a free symbol is explicitly
//      declared by a Let, Declare, or ForSome

/////////////////////////////////////////////////////////////////////////////
//
// Imports
//

// import LDE tools
import CNF from '../validation/conjunctive-normal-form.js'
import { LogicConcept } from '../logic-concept.js'
import { Expression } from '../expression.js'
import { isAnEFA } from '../matching/expression-functions.js'
import { Declaration } from '../declaration.js'
import { Environment } from '../environment.js'
import { Symbol as LurchSymbol } from '../symbol.js'
import { Problem } from "../matching/problem.js"
import Formula from '../formula.js'
import Scoping from '../scoping.js'
import Validation from '../validation.js'

// import system tools
import { execSync } from 'child_process'

// import experimental tools
import { CNFProp } from '../experimental/CNFProp.js'
import { Document , renameBindings , processLets , markDeclaredSymbols ,
         assignProperNames , processForSomeBodies } 
         from '../experimental/document.js'

/////////////////////////////////////////////////////////////////////////////
//
// Convenience Utilities
//
// const lc = (s) => { return LogicConcept.fromPutdown(s)[0] }
const metavariable = 'LDE MV'
const instantiation = 'LDE CI'
const subscriptDigits = '₀₁₂₃₄₅₆₇₈₉'
const subscript = n => [...n.toString()].map( d => subscriptDigits[d]).join('')
const execStr = command => String(execSync(command))

// Debug is a global boolean
const time = (description) => { if (Debug) console.time(description) }
const timeEnd = (description) => { if (Debug) console.timeEnd(description) }
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
//
//  Global 501 Algorithm (polynomial time n-compact)
//
// This module is intended to be the location of the utilities and code needed
// to implement the Global n-compact validation algorithm.  It is currently not
// implemented as a validation tool.

////////////////////////////////////////////////////////////////////////////////
// Extensions of the LogicConcept class

// return the Proper Name for a Lurch symbol if it has one, otherwise just
// return the name of the symbol
LurchSymbol.prototype.properName = function () {
  return (this.hasAttribute('ProperName')) ? this.getAttribute('ProperName') :
                                             this.text() 
}

// Compute the Prop Form string for an expression.  This is the .putdown form
// except that we must use the ProperName for symbols instead of their text. For
// bound symbols, this is their canonical name so alpha equivalent expressions
// have the same propositional form.  For symbols declared with a body this is
// the renaming that accounts for the body. Note that the Prop form does not
// include the leading : for givens. We cache the results in a .propform js
// attribute and return them if present.
//
Expression.prototype.prop = function () {
  if (!this.propform) this.propform = this.toPutdown((L,S,A) => {
    let ans = (L instanceof LurchSymbol) ? L.properName() : S
    return ans.replace( /^[:]/, '' )
  }) 
  return this.propform
}

// Compute the Prop Form string for a Let or ForSome Declaration. We will format
// both as [s1 ... sn] where s_i is the properName of the ith symbol it
// declares, whether or not it has a body, since if it is a ForSome with a body
// processForSomes will put a copy of the body after the declaration, which then
// will get its own propositional form. A Let should not have a body for not, so
// this is already its prop form.  Declare's don't have a prop form.
//
// Note that the Prop form does not include the leading : for givens.
Declaration.prototype.prop = function () {
    if (!this.propform) this.propform = this.isA('Declare') ? '' : 
           '['+this.symbols().map(s=>s.properName()).join(' ')+']'
    return this.propform
}

// Compute the catalog for this LC environment.
LogicConcept.prototype.catalog = function ( ) { 
  let catalog = new Set()
  this.propositions()
      .map( s => s.prop() )
      .forEach( x => catalog.add( x ) )
  return [ ...catalog ] 
}

// look up this expression's numerical prop form in the catalog
Expression.prototype.lookup = function (catalog) {
  return catalog.indexOf(this.prop()) + 1
}

// look up this declaration's numerical prop form in the catalog
Declaration.prototype.lookup = function (catalog) {
  return catalog.indexOf(this.prop()) + 1
}

////////////////////////////////////////////////////////////////////////////////
// Validate
//
// Validate this LC, store the result, and return true or false
LogicConcept.prototype.validate = function (target=this) {
  
  // If it's a preemie, it's wrong by definition. 
  //
  // TODO:
  // * implement the preemie check by checking Let-environments validity
  //   a second time where the Let is ignored and making sure it still 
  //   validates.
  if (this.preemie) { 
    Validation.setResult(conc,{ result:'invalid', reason:'preemie' })
    return false 
  } 
  
  // Validate everything else
  //
  // TODO: to get it into form that CNF.isSatisfiable accepts we have to
  //       temporarily negate this, then toggle it back afterwards.  Modify
  //       CNF.isSatisfiable to make this unnecessary.
  this.negate()
  let ans = !CNF.isSatisfiable(this.cnf(target))
  this.negate()
  const result = (ans)?'valid':'indeterminate'
  Validation.setResult(target,{ result , reason:'n-compact' })
  return ans
}

////////////////////////////////////////////////////////////////////////////////
// Validate All
// 
// Validate every claim in this LC, store the result, and return true or false.
// We do this efficiently as follows. check the entire document.  If it's valid
// we are done and can mark everything valid.  If not, most likely previous
// proofs were already valid, but the one we are working on isn't.  So check the
// children of the document. The ones that are valid, mark everything in them as
// valid. Then recurse in the children of any invalid proof until we reach just
// the individual propositions that are invalid.
Environment.prototype.validateall = function ( target = this ) {
  // validate this environment (which saves the result in the environment)
  const result = this.validate(target)
  // if the target is an environment, recurse
  if (target instanceof Environment) {
    // if it was valid, so are all of its inferences, unless they were
    // already marked invalid (e.g. preemies) and we're done
    if (result) { 
      return target.inferences().forEach( C => {
        if (!C.preemie) Validation.setResult(C,
          { result:'valid' , reason:'n-compact'})
        })
    // validateall the inference children of this target
    } else {
      target.children().forEach( C => {
        // skip givens
        if (C.isA('given') || C.isAComment()) return 
        this.validateall(C)
      })
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
//
//        Load, Process, and Validate an entire document from scratch
//
// This is an all-in-one workhorse for making and testing documents. 
// * docs are a single string, array of strings or a single LC environment. It
//   is not optional.
// * libs is the same thing for libraries, but defaults to LurchLib if omitted
//
// TODO: maybe go until a fixed point
const load = (docs, libs=undefined, n=4) => {
                                                // time('Make Document') 
  const doc = new Document(docs,libs)
                                                // timeEnd('Make Document')
                                                // time('Process Document') 
  let ans = processDoc(doc)
                                                // timeEnd('Process Document')
                                                // time('Instantiate')     
  instantiate(ans,n)
                                                // timeEnd('Instantiate')
                                                // time('Validate Everything')
  ans.validateall()
                                                // timeEnd('Validate Everything')
  return ans
}


////////////////////////////////////////////////////////////////////////////////
//
//                  Cache all Domains 
//
// For efficiency, mark all of the expressions in formulas with their domains
// (the set of metavariable text names) for easy lookup.  This assumes that the
// metavariables have been marked in Step #2 above.  We also mark the formula
// with its maximally Weenie expressions, and its domain size while we are
// caching stuff for easy access later.
//
// TODO: 
// * maybe the above information should be saved with the Library itself so it
//   only has to be computed once.  But that may not help much because partial
//   instantiations still need to have it computed. Check how much of 
//   the processing time is being used for this.

// Forbid toxic Weenies
//
// Check if an expression is potentially Weenie.  
// Currently we don't try to match user expressions to a pattern that is a
// single metavariable or EFA because they match everything.  
// This causes some rules, like or- or substitution, to require BIH's for now.
//
// for benchmarking use: const forbiddenWeeny = L => (L instanceof Environment)
const forbiddenWeeny = L => (
  (L instanceof Environment) || (L instanceof LurchSymbol) || isAnEFA(L) )
    
// Cache the domain information for a formula.  
//
// This should be done after processing the Declarations so it applies, e.g. to
// declaration bodies.
const cacheFormulaDomainInfo = f => {
  let max = 0
  f.propositions().forEach( p => {
    if (!forbiddenWeeny(p)) { 
      p.domain = Formula.domain(p)
      max = Math.max(max,p.domain.size) 
    } else { 
      p.domain=undefined
    }
  })
  // the js Set of text names of the metavariables
  f.domain = Formula.domain(f)
  // if it has no metavariables, or the only remaining metavariables are
  // forbidden, it can't be instantiated, so mark it finished.  
  // Note that max===0 is not the same as f.domain.size===0 because of
  // forbidden lone metavariables
  if (max===0)  f.finished=true
  // boolean that is true iff f is Weeny
  f.isWeeny = (f.domain.size === max && max>0)
  // the array of maximally Weeny expressions in this formula (whether or not
  // it is Weeny).  Don't add any when max===0 or you can match already
  // partially instantiated expressions with the same expression when
  // forbidden metavars are still present but max===0.
  f.weenies = f.propositions().filter( p => 
                max>0 && p.domain && (p.domain.size === max) )
}

// Apply that to the entire document
const processDomains = doc => doc.formulas().forEach( f => {
  cacheFormulaDomainInfo(f) 
  // If there are no metavariables in this formula, instantiate it so it is 
  // available for validation
  if (f.domain.size===0) {
    let inst=f.copy()
    assignProperNames(inst)
    inst=inst.unmakeIntoA('formula')
    inst.instantiation = true
    Formula.addCachedInstantiation( f , inst )
  }
})

////////////////////////////////////////////////////////////////////////////////
//
//                 Process Blatant Instantiation Hints
//
// For now we define a Blatant Instantiation Hint to be an environment in the
// user's content that is marked as a "BIH".

// Match Givens
//
// Since Matching won't match an environment to a formula that has a different
// given status, check if LCs a and b are both givens or both claims and if
// not, toggle the given status of a, and return true if it was toggled and
// false it it wasn't.  This is just a utility used by processHints.
//
// TODO: when this is made permanent, just upgrade Matching to make this hoop
//       jumping unneccesary.
const matchGivens = (a,b) => {
  let toggle = false
  if (a.isA('given') && !b.isA('given')) {
    toggle = true
    a.unmakeIntoA('given')
  } else if (!a.isA('given') && b.isA('given')) { 
    toggle = true
    a.makeIntoA('given')
  }
  return toggle
}

// Process BIHs
//
// Go through and create the appropriate instantiations from the Blatant Hints
// in document L, mark each as valid or not, and insert the relevant 
// instantiation when they are valid.
//
// TODO: Store the validation information in a more standard and sensible way.
const processHints = L => {
  const formulas = L.formulas()
  const BIH = [...L.descendantsSatisfyingIterator( x => 
    (x instanceof Environment && x.isA('BIH') ) )]
  BIH.forEach( i => {
      formulas.forEach( f => {  
        const toggle = matchGivens(f,i);
        try {
          [...Formula.allPossibleInstantiations(f,i)].forEach( s => {
            const inst = Formula.instantiate(f,s)
            assignProperNames(inst)
            if (toggle) inst.toggleGiven()
            inst.instantiation=true
            Formula.addCachedInstantiation( f , inst )
          })
        } catch { }
        if (toggle) { f.toggleGiven() }
      })
    })
  }

////////////////////////////////////////////////////////////////////////////////
//
//                  Instantiate!
// 

// This is the meat of the algorithm for n-compact validation. 
// It takes a document and the value of n as arguments.
//   0. If n==0 there's nothing to instantiate and we are done.
//   1. Get the propositions, E, in the user's document.
//   2. If n==1 get the Weeny formulas, F, that are not marked 
//      'finished'. Otherwise get all unfinished formulas with 
//      any max weenies.
//   3. For each f in F,
//      a. Match each maximally weeny p in f to each e in E.
//      b. Every time a match is found.
//         i. Insert the relevant instantiation, and store e in its .origin
//            js attribute (it can have more than one) along with other info.
//         ii. Cache its domain and update its weenies.
//   4. Mark f as 'finished'.  It cannot be instantiated again on future passes
//      because while the number of available formulas can go up on each pass,
//      the set of user expressions E cannot.
//   5. Call instantiate again, this time for n-1.  
//

// Get the e's
//
// Get all of the user proposition in the document, but don't include any
// duplicates, i.e., no two expressions should have the same prop form. 
const getUserPropositions = (document) => {
  // We cache these for multiple pass n-compact validation
  if (document.lastChild().userPropositions) 
      return document.lastChild().userPropositions
  // if not cached, fetch them   
  const allE=document.lastChild().propositions()
  // filter out duplicates so we don't make multiple copies of the same
  // instantiation
  const E = []
  const dups = new Set()
  allE.forEach( e => {
    const eprop = e.prop().replace( /^[:]/, '' ) 
    if (!dups.has(eprop)) {
        dups.add(eprop) 
        E.push(e) 
    }
  })
  // cache it
  document.lastChild().userPropositions = E
  return E
}

// Matching Propositions 
//
// Since we consider Lets and ForSomes to be proposition, we want to be able to
// try to match any proposition to any other proposition.  The Problem class
// currently can't handle this, so we add a utility here to make it possible.
//
// This routine returns an array of solutions. 
//
// Aside: Crude Attribute and matching documentation for quick reference
//
// We have the following situation regarding attributes in matching:
// 1) For atomic expressions, attributes matter.  That is, x with color=purple
//    is not the same as x with color=orange.
// 2) For non-atomic expressions, attributes do not matter, and matching is
//    defined only in terms of their children.  I could change this without too
//    much trouble if you prefer that it be changed for consistency.
// 3) When using the Formula namespace to match a formula against a possible
//    instance, then given vs. not given matters for both environments and
//    outermost expressions. No other attributes other than "given" are checked
//    when converting a formula-and-possible-instance pair into a matching
//    problem, but once it has been converted into one, then rules 1) and 2)
//    apply.
// 4) Although this should be 100% invisible to any user of the matching
//    package, and therefore 100% irrelevant, I will state it for completeness's
//    sake:  There are some de Bruijn attributes used internally by the matching
//    package to record the original symbol names, and those are (necessarily
//    and correctly) ignored during matching.
//
// TODO: Add to Problem class and Matching as needed. We assume the bodies of
//       ForSomes are expressions for now.
const matchPropositions = (p,e) => {
  // if they are both Expressions proceed as usual.
  if (p instanceof Expression && e instanceof Expression) {
      return Array.from(new Problem(p,e).solutions())
  // if they are declarations that declare the same number of symbols ...
  } else if (p instanceof Declaration && e instanceof Declaration &&
              p.symbols().length===e.symbols().length) {
    // ... and neither has a body, just match their symbols
    const esymbols=e.symbols()
    let merged = p.symbols().map( (x,k) => [x,esymbols[k]] ).flat()
    if (!p.body() && !e.body()) {
      return Array.from(new Problem(...merged).solutions())
    // ... but if both have bodies, include them in the problem  
    } else if (p.body() && e.body()) {
      return Array.from(new Problem(...merged,p.body(),e.body()).solutions())
    }
  }
  // if we made it to here it's not going to match      
  return []
} 

// Instantiate!  The second argument is the n level for n-compact validation.
const instantiate = (document,n=1) => {
  if (n==0) return
                                        // time('Get the user propositions')
  // get the user's Propisitions to match
  const E = getUserPropositions(document)
                                        // timeEnd('Get the user propositions') 
                                        
  // now loop through all of the formulas, check if they are finished and if
  // not, match all of their Weeny propositions to all of the elements of E to
  // find instantiations and partial instantiations
  document.formulas().forEach( f => {
      // skip finished formulas
      if (!f.finished && 
          // only try full Weeny formulas when n=1 since this is the last pass
          // and check that the formula has some non-forbidden patterns to
          // match
          ((n===1 && f.isWeeny) || (n>1 && f.weenies && f.weenies.length>0))) {
        // get this formula's maximally weeny patterns (must be cached)   
        f.weenies.forEach( p => {
            // try to match this pattern p to every user proposition e
            E.forEach( e => {
              // get all valid solutions 
              // declarations with body are a special case
              
              let solns =[]
                                        // console.log(`${p} ${e}`)
                                        // time('Solve one matching problem')
              try { solns = matchPropositions(p,e) } catch { }
                                        // timeEnd('Solve one matching problem')
              // for each solution, try to make a valid instantiation of f
              solns.forEach( s => {
                let inst
                                        // time('Instantiate a formula')
                try { inst = Formula.instantiate(f,s) } catch { return }
                                        // timeEnd('Instantiate a formula')
                // all instantiations are givens
                inst.makeIntoA('given')                         
                // if we made it here, we have a valid instantation
                inst.formula = true
                // it might contain a Let which was instantiated by some other
                // statment, so we might have to add the tickmarks, but don't
                // add yet another headless copy to an instantiation (there are
                // probably too many already)
                //
                // TODO: we need to check that in a rule like :{:{:Let(x) (@ P
                //       x)} (@ P y)} that it doesn't instantiate (@ P y) first
                //       with a constant lambda expression like 𝜆y,Q(z) which
                //       has z free and then instantiate the metavar x with z,
                //       since then 'the free z becomes bound' in a sense.
                //       Otherwise you could conclude, e.g. ∀y,Q(z) from {
                //       :Let(z) Q(z) } instead of just ∀y,Q(y). 
                assignProperNames(inst)
                // TODO: when making a proper testing suite check if we need to
                //       do any of these to the instantiation (and anything
                //       else)
                //
                //     processLets( inst , false ) 
                //     processForSomes( inst )
                //
                // let's also remember which expression created this
                // instantiation, and which pass for debugging and feedback
                // Note that .pass is the number of passes remaining. 
                //
                // TODO: do the same for BIH's
                inst.origin = e
                inst.pass = n
                inst.numsolns = solns.length
                inst.weenienum = f.weenies.length 
                // if the instantiation left some metavariables, we will want
                // to cache it's domain info and mark it as a formula for use
                // possible use in the next round
                                        // time('Cache Formula Domain Info')
                cacheFormulaDomainInfo(inst)
                                        // timeEnd('Cache Formula Domain Info')
                // if there are no more metavars, flag it as a completed 
                // instantiation
                if (inst.domain.size===0) { 
                  inst.unmakeIntoA('Rule')
                  inst.unmakeIntoA('Part')
                  inst.makeIntoA('Inst')
                  inst.instantiation=true 
                } else {
                  inst.unmakeIntoA('Rule')
                  inst.makeIntoA('Part')
                }
                // either way, rename ForSome constants that aren't metavars We
                // should not have to insert a copy of the bodies of ForSomes
                // since they should be there automatically because they were
                // in the formulas. TODO: * we might want to upgrade .bodyof to
                // an LC attribute since Formula.instantiate doesn't copy that
                // attribute
                //
                // also rename the bindings to match what the user would have
                // for the same expressions in his document
                                        // time('Rename bindings')
                inst.statements().forEach( x => renameBindings(x) )
                                        // timeEnd('Rename bindings')
                // then insert this intantiation after its formula
                Formula.addCachedInstantiation( f , inst )
              })
            })
        // we've matched every user proposition to every weenie pattern in
        // this formula, and don't want to do it again on future passes, so
        // mark it as finished.
        f.finished=true
      })
    }
  })
  // mark the declared symbols in the instantiations we added on this pass
  //
  // TODO: 
  // * it would be more efficient to do this to just the instantiations as they
  //   are inserted, since this makes a pass through the entire document on each
  //   pass, which has a lot of redundancy (but perhaps not significant).
  markDeclaredSymbols(document)
  instantiate(document,n-1)
}

////////////////////////////////////////////////////////////////////////////////
//
//                  Validation!
//
// The final thing we might want to do is validate the LC.  This can be done for
// the entire document with doc.validate() above.  But we would like to get more
// refined feedback about individual claims in the document itself.
//
// Given that we have already cached all of the necessary information, the only
// thing that remains is to allow L.validate() to take a target as an argument,
// which we do now.

// We say an LC in an environment L is irrelevant to the inference 'target' if
// no ancestor of it is accessible to the target.  Note that this is the
// 501-level definition, so we keep the instantiations of formulas that are
// created by expressions that appear in the user's document that come after the
// target.
LogicConcept.prototype.irrelevantTo = function (target) {
  return target.ancestors().indexOf(this)<0 && 
    !this.hasAncestorSatisfying( z => { return z.isAccessibleTo(target,true) } )
}

////////////////////////////////////////////////////////////////////////////////
// Declaration contexts
//
// Utiltities for adding the declaration contexts to all of the statements and
// declarations in the document.  This is no longer needed, but potentially
// gives nice feedback so we keep it for now.
//////////////////////////////////////////////////////////////

// Mark Declaration contexts
//
// the context attribute key, just for modularity
const context = 'context'

// Add the symbol names (as strings) to this expressions context If the context
// doesn't exit, create it, even if no args are supplied. If it already has one
// add the symbol names to the end, whether or not they are duplicates.  We will
// let scope checking worry about that.
LogicConcept.prototype.addToContext = function ( ...names ) {
  if (!this.hasAttribute(context)) { this.setAttribute(context,[]) }
  this.getAttribute(context).push(...names)
}

// Mark all of the declaration contexts
//
// TODO: this is no longer needed, but perhaps will be useful, so we keep it for
//       now.
const markDeclarationContexts = doc => {
  doc.declarations().filter(d=>!d.isA('Declare'))
    .forEach( decl => {
      const syms = decl.symbols().map( x => x.text()) 
      decl.scope(false).filter( x => x.isAStatement()||x.isADeclaration())
      .forEach( s => { s.addToContext(...syms) })
  })
}

///////////////////////////////////////////////////////////////////////////////
//
//                     LDE Documents
//
// The Document class handles most of the file handling and computes properties
// of Documents that are mostly independent of what validation tool will be used.
// The remainder of the processing that has to be done here is more specific to
// this validation tool.
const processDoc = (doc) => {
  // These have been moved to the Document class, but we keep the comments here
  // for a quick reference.
  // let doc=d.copy()
  // processShorthands(doc)        
  // processDeclarationBodies(doc) 
  // replaceFormulaBindings(doc)   
  // makeBindingsCanonical(doc)    
  // markMetavars(doc)             
  // assignProperNames(doc)        
  processDomains(doc)
  processHints(doc)
  // instantiate(doc,n) // can be done afterwards
  Scoping.validate(doc)
  markDeclaredSymbols(doc)
  // no longer needed, but it works and could be useful some day
  // markDeclarationContexts(doc)
  return doc
}
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Debottlenecker
//
// In order to see where the bottlenecks are in the code, we build here a crude
// custom code profiler/timer. It works as follows. Calling Benchmark(f,name)
// times the execution of function f and stores the time it took under the name
// 'name', which should be a string, in a global object called Report with a key
// for each name.  The value of each key is an object of the form { calls:n ,
// time:t } where n is the number of times the routine was called, and t was the
// total time it took for those calls.
//
// TODO:
// * finish this
let Report = {}
const Benchmark = function ( f , name ) {
   const start = Date.now()
   f()
   const t = Date.now()-start
   if (!Report[name]) { 
     Report[name] = { calls:1 , time:t} 
   } else { 
     Report[name].calls++
     Report[name].time += t
   }
}

export default { getUserPropositions, instantiate, markDeclarationContexts,
  load, processHints, processDoc, processDomains, subscript,  
  cacheFormulaDomainInfo, Benchmark, Report
}
///////////////////////////////////////////////////////////////////////////////