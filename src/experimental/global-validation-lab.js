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
// * Sometimes and instantiation will instantiate the variable in a Let with a
//   constant, either directly or indirectly, e.g. `Let 0'`. This doesn't seem
//   to hurt anything but it makes for stupid instantiations, and might speed
//   things up if we eliminate it.
// * For rules like transitivity, e.g. :{ :x=y y=z x=z }, if used successfully
//   they get instantiated six times, once for each pair of metavariables, but
//   produce the same instantiation, plus a lot more.  However, these rules do
//   not have a forbidden expression like the metavar W or (@ P x), so they
//   don't automatically require a BIH.  But it is clearly nice to have such
//   rules.  So add an attribute marking it as 'inefficient', and treat Rule or
//   Part containing only a forbidden W or (@ P x) as a special case of
//   'inefficient' so that in every case a BIH is required.
// * Make a substitution tool that does the following. 
//   - find any expressions of the form (R A B) where R is a relation like =. <.
//     etc, and A and B are expressions.
//   - compute the expression diff() between A and B, and see if there is only
//     one possible substitution, e.g. C=D, that when applied to A=A would
//     produce A=B.
//   - when making the CNF of the Propositional Form of the statement (R A B),
//     use the fact that CNF's have an OR operator to make it's prop form be:
//
//         (R A B) OR (= C D)
//
//   - thus if either (R A B) itself is justified directly, OR (= C D) is
//     justified, in both cases the original (R A B) will be justified.  
//   - do this for all expressions of the form (R A B) in the document.  This
//     gives us the main logic behind transitive chains by skipping the annoying
//     substitution BIHs
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
//    * 'creators'   - the user proposition(s) that caused this instantiation
//
//    JS attributes: declarations body copy and premature generalizations
//    * 'bodyof'   - indicates an Expression is a copy of the body of a
//      declaration
//    * 'preemie'  - a expression that is justified by a Let that it is in the
//                   scope
//    * 'badBIH'   - an environment marked asA 'BIH' that isn't one
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

// import experimental tools
import {
  Document, renameBindings, processLets, markDeclaredSymbols,
  assignProperNames, processForSomeBodies
}
  from '../experimental/document.js'

/////////////////////////////////////////////////////////////////////////////
//
// Convenience Utilities
//
const instantiation = 'LDE CI'
const subscriptDigits = '₀₁₂₃₄₅₆₇₈₉'
const subscript = n => [...n.toString()].map(d => subscriptDigits[d]).join('')

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
// Validate
//
// Validate the target of this LC, store the result, and return true or false.
//
// This routine currently can use one or both of two validation tools: the
// propositional checker and the preemie checker.  The second and third optional
// arguments are booleans which specify whether it should be prop checked and
// preemie checked respectively.  This is useful for calling this efficiently
// from .validateall.  If both are false, it does nothing and returns undefined.)
//
// With both tools, in order for this to provide more localized information
// about what is wrong with a proof, everything that is accessible to the target
// is temporarily treated as a Given, so that the propositional validity of a
// target is not dependent on the propositional validity of the things
// accessible to it.  
//
// We assume that every instantiation that will be required for computing the
// prop form and propositional validation has already been added to the
// document.  Thus, other Validation Tools, like BIH, and CAS, which might
// create instantiations, need to be run on the entire document before this
// final step as part of the instantiation phase.
//
// There are also some validation checks that may not need to instantiate
// anything, like checking that Let-environments don't violate the 'preemie'
// restriction by validating them without the initial Let() and making sure they
// are still valid and ignoring all tick marks on non-constant variables in
// instantiations or that are in the scope of a deleted Let. This check only
// makes sense when a target is propositionally valid, but should not be valid
// because of violating the preemie condition. So we only need to check for
// preemies only after doing propositional validation, and then only check the
// valid inferences in the scope of a Let or containing a Let.
//
// Just as for propositional checking, when checking to see if the target is a
// preemie, we do not care if anything accessible to it is a preemie. Keep in
// mind that by ignoring Lets, some of the things accessible to it might have a
// different propositional form (no tick marks on some variables in addition to
// being givens), but since they are temporarily treated as givens, even if they
// are preemies themselves, they will not be flagged as such.
//
// For targets which are Expressions or ForSomes we only check the target to see
// if it is a preemie, regardless of whether there might be other preemies in
// the LC.  But when the target is an environment, we only check if it is a
// preemie by ignoring the Lets it is in the scope of and its own Let if it is
// a Let-env. Thus, this routine assumes that all descendant Let-environments of
// this environment have already been preemie-checked (which will be the case
// when .validateall has been called).  Thus, this routine will tell you if the
// target is, itself, a preemie, but not if contains any preemies if you don't
// check for those first.  So it could return 'valid' for an environment, which
// is useful for .validateall, but might be misleading if you don't interpret it
// correctly.
//
// Moral: use only for targets that do not contain any descendant
//        Let-environments, or just call .validateall for environments that do.
//
LogicConcept.prototype.validate = function (target = this,
  checkPreemies = false) {

  // store the answer and result here
  let ans, result
  const checkProps = !checkPreemies

  // TODO: to get it into form that CNF.isSatisfiable accepts we have to
  //       temporarily negate this, then toggle it back afterwards.  Modify
  //       CNF.isSatisfiable to make this unnecessary.

  // to prevent this routine from exiting while this LC is still negated we wrap
  // up the negation and un-negation with the CNF.isSatisfiable call
  const satCheck = (doc, target, checkPreemies = false) => {
    let answer
    // negate this
    doc.negate()
    try {
      answer = !CNF.isSatisfiable(this.cnf(target, checkPreemies))
    } catch (e) {
      doc.negate()
      say(`\nError validating the following for ${(checkPreemies) ? 'preemies' : 'prop'}:\n`)
      write(target)
      say(`at address: ${target.address()}`)
    }
    // un-negate this
    doc.negate()
    return answer
  }

  // if we have to check props or we have to check preemies but it hasn't
  // already been prop checked, prop check it
  if (checkProps) {
    // say(`Checking prop`)
    // if it is already validated, just return that
    if (Validation.result(target) &&
      Validation.result(target).reason === 'n-compact') {
      // say(`Already validated by n-compact, so returning that`)
      ans = Validation.result(target).result === 'valid'
    } else {
      // say(`Not already validated by n-compact.. checking`)
      ans = satCheck(this, target)
      // determine the appropriate feedback
      result = (ans)
        ? { result: 'valid', reason: 'n-compact' }
        : { result: 'indeterminate', reason: 'n-compact' }
      Validation.setResult(target, result)
    }
  }

  // if we have to check preemies, check them
  if (checkPreemies) {
    // say(`Checking preemie`)
    // if it's already a preemie return the same thing
    if (Validation.result(target) &&
      Validation.result(target).reason === 'preemie') {
      // say(`Already a preemie`)
      ans = false
      // otherwise 
    } else {
      // if it's not already validated propositionally, validate it
      if (!(Validation.result(target) &&
        Validation.result(target).reason === 'n-compact')) {
        // say(`Not already validated, so doing it`)
        ans = this.validate(target)
        result = (ans)
          ? { result: 'valid', reason: 'n-compact' }
          : { result: 'indeterminate', reason: 'n-compact' }
        Validation.setResult(target, result)
      }
      // if it is propositionally valid, check it for preemies           
      if (Validation.result(target).result === 'valid') {
        // say(`Prop valid, so checking for preemies`)
        // say(`this is currently a given ${this.isA('given')}`)
        ans = satCheck(this, target, true)
        // determine the appropriate feedback
        result = (ans)
          ? { result: 'valid', reason: 'n-compact' }
          : { result: 'invalid', reason: 'preemie' }
        Validation.setResult(target, result)
        // finally, it is invalid propositionally, so just return that
      } else {
        ans = false
      }
    }
  }

  return ans

}

////////////////////////////////////////////////////////////////////////////////
// Validate All
//
// Validate every claim in this LC, store the result, and return true or false.
// The optional second argument, if false tells it to do an ordinary
// propositional check but not check for preemies. This may be all that is
// needed in the case where the library or document doesn't contain any Lets and
// thus doesn't have to check for preemies.
//
// We do the propositional check efficiently as follows. First, check the entire
// document. If it's valid we are done and can mark everything valid. If not,
// frequently it will be the case that previous proofs were already valid, but
// the one we are working on isn't. So check the children of the document. The
// ones that are valid, mark everything inside them as valid. Then recurse in
// the children of any invalid proof until we reach just the individual
// conclusions that are invalid.
//
// If checkPreemies is true, we have to additionally check if any
// propositionally valid inferences were preemies or valid because they contain
// preemies.  This must only be checked after propositional validation is
// complete since it relies on those results to know what to check.
//
// We do the preemie check efficiently as follows.
// * If the target is not valid, we don't have to do anything.
// * If the target is valid and not an environment, we just call .validate on
//   the target with checkPreemies=true. Update the validation result of the
//   target and its valid ancestors if it is a preemie. 
// * If the target is a valid environment we do the following.  
//   - Get all top level Let-env descendants of X (those not nested inside
//     another Let-env descendant of X).  
//   - If any exist, call .validateall(-,true) on each of those recursively
//     until we reach one that has no Let-env descendants.
//   - for the base case of the recursion, when a Let environment is reached
//     that does not contain any Let-environment descendants, validate it with
//     checkPreemies=true, and follow the same algorithm as for the
//     Propositional check above (if it's preemie-valid we're done because
//     everything is already prop valid, and if any of the conclusions were
//     preemies the whole thing would be invalid. So if it's not preemie valid,
//     recurse into the environment tree to locate the individual preemies it
//     contains as for prop checking).
//   - when the recursion is complete, do the same check on the ancestor
//     Let-env, by omitting just it's own Let and the Let's it is in the scope
//     of, but not the ones that are descendants.  This will detect any
//     additional preemies that are descendants but not inside descendant
//     Let-envs. If any new ones are found or if one of the recursive checks
//     found a preemie, in either case mark them and the parent being checked as
//     invalid for reason 'contains preemie'.
//
// This routine does not return anything, it just marks the document.

// If checkPreemies is false it only
// checks the target propositionally, otherwise it only checks the target for
// preemies.
Environment.prototype.validateall = function (
  target = this, checkPreemies = false
) {
  const checkProps = !checkPreemies

  // Props
  if (checkProps) {

    // validate this environment (which saves the result in the target)
    const result = this.validate(target)

    // if the target is an Environment, recurse
    if (target instanceof Environment) {

      // if it was prop valid, so are all of its inferences
      if (checkProps) {

        if (result) {
          // mark all of the target's inferences propositionally valid 
          target.inferences().forEach(C => {
            Validation.setResult(C, { result: 'valid', reason: 'n-compact' })
          })

          // otherwise .validateall the inference children of this target
        } else {
          target.children().forEach(kid => {
            // skip givens and things marked .ignore, e.g. Comments
            if (kid.isA('given') || kid.ignore) return
            this.validateall(kid, false)
          })
        }

      }
    }
  }

  // if we are supposed to check for preemies.  This assumes we've already
  // validated propositionally.  This should only be called once on the entire
  // document (i.e. it's not recursive) and it will mark all of the preemies in
  // one pass.
  //
  // TODO: it probably makes more sense to separate the prop and preemie parts
  // of this routine into two separate functions since they are dissimilar.
  if (checkPreemies) {

    // get the set of all Lets in inference let environments of this environment
    // unless their parent has no conclusions
    let lets = this.lets().filter(x =>
      !x.parent().ancestors().some(y => y.isA('given'))
      // && x.parent().conclusions().length>0   // inefficient but ok for now
    )

    // sort them by the number of lets in their scope so we can check them from
    // the inside out (this modifies the lets array)
    lets.sort((a, b) => a.letsInScope().length - b.letsInScope().length)

    // validate each of the lets in order
    lets.forEach(L => {

      // see if this Let environment is a preemie (it should delete it's own let)
      let preemie = !this.validate(L.parent(), true)

      // if it is a preemie, mark it, and then narrow down which of it's
      // children is the offender
      if (preemie) {

        // mark it and all of it's ancestors as a preemie
        L.parent().ancestors().forEach(a => {
          Validation.setResult(a, { result: 'invalid', reason: 'preemie' })
        })

        // narrow it down to the specific preemies causing this let-environment
        // to be a preemie
        //
        // TODO: for now we're just brute force checking all of the valid conclusions
        // of the offending preemie let-environment.  Upgrade this to do the
        // recursive descent like we do for the prop check above.
        L.parent().conclusions()
         .filter( x => !x.ignore && Validation.result(x).result==='valid')         .forEach( conc => {
          let result = this.validate(conc,true)
          if (!result) {
            conc.ancestors().forEach( a => {
              Validation.setResult( a , { result:'invalid' , reason:'preemie'})
            })  
          }
        })
      }
    })
  }
}

// the exposed routine
// Environment.prototype.validateall = function ( target = this , checkPreemies = true ) {
// always prop check it first
// this._validateall(target, false)
// then check preemies if we want to
// if (checkPreemies) this._validateall(target, true)
// // if the target is not an environment, and we have to check Preemies, check
// // them and return
// if (!(target instanceof Environment)) { 
//   result = this.validate(target, false, true)
// // if the target is an environment, recurse
// } else {
//   // if it was prop valid, so are all of its inferences, unless they
//   // contain a preemie
//   if (result) {
//     // mark all of the target's inferences propositionally valid 
//     target.inferences().forEach( C => {
//       if (!C.preemie) Validation.setResult(C,
//         { result:'valid' , reason:'n-compact'})
//       })
//     // if we are also supposed to check for preemies
//     if (checkPreemies) {
//       // check each of the top level Lets of the target
//       [...target.descendantsSatisfyingIterator( x => {
//         (x instanceof Environment) && (x.child(0) instanceof Declaration)
//       })].forEach( L => { 
//         // we already know L is propositionally valid, but we want to recurse,
//         // so we just call .validateall on it

//       })
//     }
//   // otherwise validateall the inference children of this target
//   } else {
//     target.children().forEach( C => {
//       // skip givens and things marked .ignore, e.g. Comments
//       if (C.isA('given') || C.ignore) return 
//       this.validateall(C , checkPreemies)
//     })
//   }
// }
// }

////////////////////////////////////////////////////////////////////////////////
//
//  Load , Process, and Validate an entire document from scratch
//
// This is an all-in-one workhorse for making and testing documents. 
// * docs are a single string, array of strings or a single LC environment. It
//   is not optional.
// * libs is the same thing for libraries, but defaults to LurchLib if omitted
//
// TODO: maybe go until a fixed point
const load = (docs, libs = undefined, n = 4) => {
  // make a new document
  const doc = new Document(docs, libs)
  // process the pre-instantiated document
  let ans = processDoc(doc)
  // instantiate everything
  instantiate(ans, n)
  // cache the let-scopes in the root
  ans.letScopes = ans.scopes()
  // cache the catalog in the root
  ans.cat = ans.catalog()
  // validate everything
  ans.validateall()
  ans.validateall(undefined,true)
  // return the final validated document
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
  (L instanceof Environment) || (L instanceof LurchSymbol) || isAnEFA(L))

// Cache the domain information for a formula.  
//
// This should be done after processing the Declarations so it applies, e.g. to
// declaration bodies.
const cacheFormulaDomainInfo = f => {
  let max = 0
  f.propositions().forEach(p => {
    if (!forbiddenWeeny(p)) {
      p.domain = Formula.domain(p)
      max = Math.max(max, p.domain.size)
    } else {
      p.domain = undefined
    }
  })
  // the js Set of text names of the metavariables
  f.domain = Formula.domain(f)
  // if it has no metavariables, or the only remaining metavariables are
  // forbidden, it can't be instantiated, so mark it finished.  
  // Note that max===0 is not the same as f.domain.size===0 because of
  // forbidden lone metavariables
  if (max === 0) f.finished = true
  // boolean that is true iff f is Weeny
  f.isWeeny = (f.domain.size === max && max > 0)
  // the array of maximally Weeny expressions in this formula (whether or not
  // it is Weeny).  Don't add any when max===0 or you can match already
  // partially instantiated expressions with the same expression when
  // forbidden metavars are still present but max===0.
  f.weenies = f.propositions().filter(p =>
    max > 0 && p.domain && (p.domain.size === max))
}

// Apply that to the entire document
const processDomains = doc => doc.formulas().forEach(f => {
  cacheFormulaDomainInfo(f)
  // If there are no metavariables in this formula, instantiate it so it is
  // available for validation.
  if (f.domain.size === 0) {
    // let inst=f.copy()
    // assignProperNames(inst)
    f.unmakeIntoA('Rule')
    f.makeIntoA('Inst')
    f.makeIntoA(instantiation)
    f.instantiation = true
    // Formula.addCachedInstantiation( f , inst )
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
const matchGivens = (a, b) => {
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
// in document L, mark each as BIH-valid or not, and insert the relevant 
// instantiation when they are BIH-valid.  Note that we are keeping track of
// the distinction between being propositionally valid, and being BIH-valid.
// Namely, a particular environment, marked as a BIH, could be propositionally
// valid in the user's document, but not a BIH. e.g. { :P (⇒ P P)} << would be
// propositionally valid in a document that depends on Prop lib but not an 
// instatiation of the ⇒+ rule.
//
// TODO: Store the validation information in a more standard and sensible way.
const processHints = L => {
  const formulas = L.formulas()
  const BIH = [...L.descendantsSatisfyingIterator(x => x.isA('BIH'))]
  BIH.forEach(b => {
    let found = false
    formulas.forEach(f => {
      const toggle = matchGivens(f, b);
      try {
        ;[...Formula.allPossibleInstantiations(f, b)].forEach(s => {
          found = true
          const inst = Formula.instantiate(f, s)
          assignProperNames(inst)
          if (toggle) inst.toggleGiven()
          inst.unmakeIntoA('Rule')
          inst.unmakeIntoA('Part')
          inst.makeIntoA('Inst')
          inst.instantiation = true
          inst.rule = f.rule || f
          if (!inst.creators) inst.creators = []
          inst.creators.push(b)
          Formula.addCachedInstantiation(f, inst)
        })
      } catch { }
      if (toggle) { f.toggleGiven() }
    })
    // if it's not a BIH, mark it as such with .badBIH
    if (!found) { b.badBIH = true }
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
//         i. Insert the relevant instantiation, and store e in its .creators
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
  const allE = document.lastChild().propositions()
  // filter out duplicates so we don't make multiple copies of the same
  // instantiation
  const E = []
  const dups = new Set()
  allE.forEach(e => {
    const eprop = e.prop().replace(/^[:]/, '')
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
const matchPropositions = (p, e) => {
  // if they are both Expressions proceed as usual.
  if (p instanceof Expression && e instanceof Expression) {
    return Array.from(new Problem(p, e).solutions())
    // if they are declarations that declare the same number of symbols ...
  } else if (p instanceof Declaration && e instanceof Declaration &&
    p.symbols().length === e.symbols().length) {
    // ... and neither has a body, just match their symbols
    const esymbols = e.symbols()
    let merged = p.symbols().map((x, k) => [x, esymbols[k]]).flat()
    if (!p.body() && !e.body()) {
      return Array.from(new Problem(...merged).solutions())
      // ... but if both have bodies, include them in the problem  
    } else if (p.body() && e.body()) {
      return Array.from(new Problem(...merged, p.body(), e.body()).solutions())
    }
  }
  // if we made it to here it's not going to match      
  return []
}

// Instantiate!  The second argument is the n level for n-compact validation.
const instantiate = (document, n = 1) => {
  if (n == 0) return
  // time('Get the user propositions')
  // get the user's Propositions to match
  const E = getUserPropositions(document)
  // timeEnd('Get the user propositions') 

  // now loop through all of the formulas, check if they are finished and if
  // not, match all of their Weeny propositions to all of the elements of E to
  // find instantiations and partial instantiations
  document.formulas().forEach(f => {
    // skip finished formulas
    if (!f.finished &&
      // only try full Weeny formulas when n=1 since this is the last pass
      // and check that the formula has some non-forbidden patterns to
      // match
      ((n === 1 && f.isWeeny) || (n > 1 && f.weenies && f.weenies.length > 0))) {
      // get this formula's maximally weeny patterns (must be cached)   
      f.weenies.forEach(p => {
        // try to match this pattern p to every user proposition e
        E.forEach(e => {
          // get all valid solutions 
          // declarations with body are a special case

          let solns = []
          // console.log(`${p} ${e}`)
          // time('Solve one matching problem')
          try { solns = matchPropositions(p, e) } catch { }
          // timeEnd('Solve one matching problem')
          // for each solution, try to make a valid instantiation of f
          solns.forEach(s => {
            let inst
            // time('Instantiate a formula')
            try { inst = Formula.instantiate(f, s) } catch { return }
            // timeEnd('Instantiate a formula')
            // all instantiations are givens
            inst.makeIntoA('given')
            // if we made it here, we have a valid instantation
            //
            // inst.formula = true // replaced by 'Rule', 'Part', 'Inst', .finished
            //
            // it might contain a Let which was instantiated by some other
            // statment, so we might have to add the tickmarks.
            //
            // Note: we had to check that in a rule like :{:{:Let(x) (@ P
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
            // instantiation, what original Rule it instantiates, and which
            // pass for debugging and feedback.
            //
            inst.creators = (f.creators) ? [...f.creators] : []
            inst.creators.push(e)
            // whether it's a Part or an Inst, save the rule it originates from
            inst.rule = f.rule || f
            //  Note that .pass is the number of passes remaining. 
            inst.pass = n
            inst.numsolns = solns.length
            inst.weenienum = f.weenies.length
            // if the instantiation left some metavariables, we will want to
            // cache it's domain info and mark it as a formula for use
            // possible use in the next round
            // time('Cache Formula Domain Info')
            cacheFormulaDomainInfo(inst)
            // timeEnd('Cache Formula Domain Info')
            // if there are no more metavars, flag it as a completed
            // instantiation
            if (inst.domain.size === 0) {
              inst.unmakeIntoA('Rule')
              inst.unmakeIntoA('Part')
              inst.makeIntoA('Inst')
              inst.instantiation = true
            } else {
              inst.unmakeIntoA('Rule')
              inst.makeIntoA('Part')
              // since it still has metavariables, ignore it for
              // propositional form
              inst.ignore = true
            }

            // either way, rename ForSome constants that aren't metavars. We
            // should not have to insert a copy of the bodies of ForSomes
            // since they should be there automatically because they were in
            // the formulas. 
            //
            // TODO: 
            //  * we might want to upgrade .bodyof to an LC attribute since
            //    Formula.instantiate doesn't copy that attribute
            //
            // also rename the bindings to match what the user would have
            // for the same expressions in his document
            // time('Rename bindings')
            inst.statements().forEach(x => renameBindings(x))
            // timeEnd('Rename bindings')
            // then insert this intantiation after its formula
            Formula.addCachedInstantiation(f, inst)
          })
        })
        // we've matched every user proposition to every weenie pattern in
        // this formula, and don't want to do it again on future passes, so
        // mark it as finished.
        f.finished = true
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
  instantiate(document, n - 1)
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
  // it's not an ancestor of the target and has an ancestor that is not
  // accessible to the target
  return target.ancestors().indexOf(this) < 0 &&
    !this.hasAncestorSatisfying(z => { return z.isAccessibleTo(target, true) })
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
LogicConcept.prototype.addToContext = function (...names) {
  if (!this.hasAttribute(context)) { this.setAttribute(context, []) }
  this.getAttribute(context).push(...names)
}

// Mark all of the declaration contexts
//
// TODO: this is no longer needed, but perhaps will be useful, so we keep it for
//       now.
const markDeclarationContexts = doc => {
  doc.declarations().filter(d => !d.isA('Declare'))
    .forEach(decl => {
      const syms = decl.symbols().map(x => x.text())
      decl.scope(false).filter(x => x.isAStatement() || x.isADeclaration())
        .forEach(s => { s.addToContext(...syms) })
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
const Benchmark = function (f, name) {
  const start = Date.now()
  f()
  const t = Date.now() - start
  if (!Report[name]) {
    Report[name] = { calls: 1, time: t }
  } else {
    Report[name].calls++
    Report[name].time += t
  }
}

export default {
  getUserPropositions, instantiate, markDeclarationContexts,
  load, processHints, processDoc, processDomains, subscript,
  cacheFormulaDomainInfo, Benchmark, Report
}
///////////////////////////////////////////////////////////////////////////////