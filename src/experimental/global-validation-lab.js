////////////////////////////////////////////////////////////
// 
//  Global n-compact Validation
//
//  (KEEP OUT!  Work in progress.)
//
//  This file is still under construction and subject to frequent change.
//  It contains all of the infrastructure, surrounding utilities, and other 
//  content needed for the testing and design modifications for a global
//  n-compact validation tool.  Currently it is in a separate file that is only
//  imported when using Lode, the node LDE app, to keep it separate from the 
//  more thoroughly tested code in the LDE repo.  Use this code at your own risk.
// 
// TODO Summary: 
// * For each attribute we use below, decide whether it should be stored
//   cached as a permanent LC attribute or a normal js object attribute before 
//   moving to the repo.
// * Allow theorems proved in the user's document to be used as formulas
// * Optimizations: for a rule like symmetry of equality, it will ALWAYS be
//   instantiated twice for every equation in the user's doc.  Figure some way to 
//   improve that situation in general.
// * Eliminate or replace BIHs. 
//   * Add "Consider" options that are force-matched to lone metavariable and 
//     EFAs.
//   * When an EFA has a parameter that is partially instantiated, leverage that
//     by allowing it to match expressions that contain the partial
//     instantiations.
// * Consider speeding up matching in several ways.
//   * Allow an option to eliminate the constant lambda expression as a solution.
//   * Allow an option to efficiently solve 'Weenie' matching problems. e.g., if
//     (@ P c) where P is a metavar and c is a constant is matched to e, and e
//     does not contain c, return the constant solution (or none if the previous 
//     option is enabled.  If e only has one instance of c, there's only one
//     solution, so return that without recursing.  If it has two instances there
//     are four solutions, so return those.  Three have eight.  That should cover
//     about 99% of the cases.
// * Design a generic way to use multiple validation tools in the same document so
//   they work well together.  For example, to have a CAS rule work with this
//   501 validation tool we might insert a placeholder formula like 
//   `:{ CASRule }` and when an expression is supposed to be validated by the CAS
//   rule it can put 'instantiations' after that formula to make a valid CAS 
//   expression validate propositionally.
// * It would be nice to be able to have the following variant of substitution 
//   which constructs 'virtual' e expressions to match formulas as follows.
//   Suppose we have, say, a transitive chain. We look at the difference between
//   two consecutive expressions and the operator connecting them and try to 
//   find an instantiation that matches the expression formed by connecting the
//   differences with the operator.
//
// New LC attributes used here
//
//    LC attributes: Environments
//      'formula' - (isA) this environment is a formula
//      'blatant instantiation' - (isA) this environment is a blatant 
//                  instantiation hint supplied by the user.
//
//    LC attributes: Declarations
//      'Declare' - (isA) this declaration declares global constants and 
//                  has no propositional form, whether a given or claim.
//
//    LC attributes: Symbols
//      'ProperName' - its value is the proper name of this Lurch symbol
//
//    JS attributes: formula environments
//      'domain'   - the js Set of metavariable names (strings) in this formula
//      'isWeeny'  - boolean that is true iff this formula is Weeny 
//                   (has at least one metavariable and at least one Weeny 
//                   expression
//      'weenies'  - the array of Weeny expressions in this formula, if any
//      'finished' - boolean that is true if this formula is finished being 
//                   instantiated and should be ignored on future passes
//
//    JS attributes: user's document environment
//      'userPropositions' - cache of the user's propositions (the e expressions
//                           to match) stored in the last child of the document
//                           (the user's content)
//
//    JS attributes: instantiation environments & BIH's
//      'instantiation' - boolean indicating that this is an instantiation with
//                   no metavars left
//      'origin'   - the user proposition(s) that caused this instantiation
//
//    JS attributes: declarations body copy and premature generalizations
//      'bodyof'   - indicates an Expression is a copy of the body of the LC 
//                   stored as its value
//      'preemie'  - a expression that is a generalization associated with a Let
//                   (equal to its body) that is in the scope of that Let
//
//    JS attributes - Symbols
//      'constant' - boolean that indicates whether a free symbol is explicitly
//                   declared by a Let, Declare, or ForSome

/////////////////////////////////////////////////////////////////////////////
//
// Imports
//
// import index.js
import * as Lurch from '../index.js'
// import satSolve
import { satSolve } from '../../dependencies/LSAT.js'
// import the CNF toolkit
import CNF from '../validation/conjunctive-normal-form.js'
// import LogicConstruct so we can enhance it
import { LogicConcept } from '../logic-concept.js'
// same with Expression
import { Expression } from '../expression.js'
// same isAnEFA
import { isAnEFA } from '../matching/expression-functions.js'
// same with Declaration
import { Declaration } from '../declaration.js'
// same with Application
import { Application } from '../application.js'
// same with Application
import { Environment } from '../environment.js'
// same for LurchSymbol
import { Symbol as LurchSymbol } from '../symbol.js'
// same for Problem
import { Problem } from "../matching/problem.js"
// import Forumla utilities
import { default as Formula } from '../formula.js'
// import Scoping utilities
import Scoping from '../scoping.js'
// import Validation utilities
import Validation from '../validation.js'
// import BindingExpression
import { BindingExpression } from '../binding-expression.js'
// load the fs package
import fs from 'fs'
// load the execSync command for some utilities
import { execSync } from 'child_process'

/////////////////////////////////////////////////////////////////////////////
//
// Convenience Utilities
//
const lc = (s) => { return LogicConcept.fromPutdown(s)[0] }
const metavariable = 'LDE MV'
const instantiation = 'LDE CI'
const subscriptDigits = '₀₁₂₃₄₅₆₇₈₉'
const subscript = n => [...n.toString()].map( d => subscriptDigits[d]).join('')
const execStr = command => String(execSync(command))
// Debug is a global boolean
let Debug = true
const time = (description) => { if (Debug) console.time(description) }
const timeEnd = (description) => { if (Debug) console.timeEnd(description) }
/////////////////////////////////////////////////////////////////////////////////

//////////  Begin CNFProp ////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//
// CNFProp
//
// Represents the Propositional Form of any LC and the utilities 
// to convert that to cnf form required by satSolve.  It is needed because
// the PropositionalForm class does not support LCs, only sequents.
export class CNFProp {

  constructor ( op, ...kids ) {
    this.kids    = kids || [ ]               // Array of CNFProps or integers
    this.op      = op || 'and'               // 'and' or 'or'
    this.negated = false                     // negated or not
  }

  // Make the CNFProp from an LC - this is the main purpose of this class
  static fromLC ( L , catalog , target=L ) {
    catalog = catalog || L.catalog()
    // Propositions have atomic prop form. ForSome declarations have an atomic 
    // propositional form with constants renamed by the body.  A copy of the body
    // is added afterwards, and treated like any other LC in the document.
    if ( L.isAProposition() ) { 
      // propositions accessible to the target (nonreflexive) are 
      // treated as given when the target is present.
      let sign = (L.isA('given') || L.isAccessibleTo(target)) ? -1 : 1
      return sign*L.lookup(catalog)  
    // if it's an environment process the relevant children, skipping over
    // anything irrelevant to the target and Declare's which have no prop form.
    } else if (L instanceof Environment) {
      let kids = L.children()
      // remove trailing givens and anything irrelevantTo the target
      while ( kids.length>0 && 
              ( kids.last().isA('given') || 
                kids.last().irrelevantTo(target)
              )
            ) 
        kids.pop()
      // make the environment's CNFProp     
      let env = new CNFProp()
      // givens and claims accessible to the target other than itself, 
      // should be negated.  Thus we don't pass the second argument
      // to isAccessibleTo to say it should be reflexive.
      env.negated = L.isA(`given`) || L.isAccessibleTo(target)
      while ( kids.length > 0 ) {
         let A = kids.pop()
         // skip it if it's a Declare
         if (A.isA('Declare')) continue
         // skip it if it's a Comment. 
         if (A.isAComment()) continue
         // otherwise get it's prop form  
         let Aprop = CNFProp.fromLC(A,catalog,target)
         if ( Aprop === null ) continue 
         // check if we have to change the op based on this latest child
         let newop = (A.isA(`given`) || A.isAccessibleTo(target)) ? `or` : `and`
         // if we do, and there's more than one kid, wrap the kids w/ previous op
         if ( newop!==env.op && env.kids.length>1 ) {
            env.kids = [ new CNFProp( env.op , ...env.kids ) ]
         }
         env.op = newop
         // if the new guy has the same op and is not negated, 
         // unshift its children, otherwise just unshift the whole thing
         if ( Aprop.op===env.op && 
              !(A.isA(`given`) || 
                A.isAccessibleTo(target)
               )
             ) {
           env.kids.unshift(...Aprop.kids)
         } else {
           env.kids.unshift(Aprop)
         }
      }
      // console.log(`returning ${env.toAlgebraic()}`)
      return env
    }
  }
    
  // convert an integer x to a variable.  If the optional argument n is present
  // return a switch variable if |x|>n
  static toVar ( x , n = Infinity ) {
    const A = 'A'.charCodeAt(0)
    let prefix = (x<0) ? ':' : ''
    x = Math.abs(x)
    let name = (n<x)  ? `𝒵_${x-n}` :
               (x<27) ? String.fromCharCode(x+A-1) :
               (x<53) ? String.fromCharCode(x+A+5) : `𝒳_${x}` 
    return prefix+name
  }
  
  // convert a CNFProp to algebraic form
  // the optional argument n tells it the lower bound for switch variables
  toAlgebraic ( n = Infinity ) {
    const A = 'A'.charCodeAt(0)
    let ans = this.kids.map( x => {
      // convert nonzero integers to variables 
      if ( Number.isInteger(x) ) { return CNFProp.toVar(x,n)
      // x must be a CNFProp  
      } else { return x.toAlgebraic(n) } 
    } )
    let joint = (this.op === 'and') ? '+' : ''
    ans = ans.join(joint)
    return (this.negated) ? `:(${ans})` : 
           (this.op==='and') ? `(${ans})` : ans
  }
  
  // convert this CNFProp to human readable form using the supplied catalog
  toEnglish (catalog) {
    let ans = this.kids.map( x => {
      // lookup nonzero integers in the catalog
      if ( Number.isInteger(x) ) { return ((x<0)?':':'')+catalog[Math.abs(x)-1]
      // x must be a CNFProp  
    } else { return x.toEnglish(catalog) } 
    } )
    let joint = (this.op === 'and') ? ' and ' : ' or '
    ans = ans.join(joint)
    return (this.negated) ? `:(${ans})` : 
           (this.op==='and') ? `(${ans})` : ans
  }
  
  // the variable name when showing switch variables in Algebraic form 
  static get switchVarSymbol () { return '𝒵'}  // 𝒵 = \u{1D4B5} unicode

  // check if this is already in cnf form
  hasCNFform () {
    return !this.negated && 
      this.op === 'and' && 
      this.kids.every( x => {
        return (x instanceof this.constructor) && x.kids.every(   Number.isInteger ) && (x.op === 'or')
      } )
  }

  // distribute all negatives by DeMorgan whenever possible
  simplify ( toggle ) {
    let ans = new CNFProp()
    // distribute the nots
    if ( (this.negated && !toggle) || (!this.negated && toggle) ) {
      ans.op = (this.op==='and') ? 'or' : 'and'
      ans.kids = this.kids.map( x => {
       return ( Number.isInteger(x) ) ? -x : x.simplify(true)  
      } )
    } else {
      ans.op = this.op
      ans.kids = this.kids.map( x => {
        return ( Number.isInteger(x) ) ? x : x.simplify( )
      } )
    }  
    return ans   
  }
  
  // Lprop should be a simplified CNFProp. 
  // switchvar is an object containing the value to use for the next switch var
  // with key num, e.g. a typical use might be
  //    CNFProp.toCNF(CNFProp.fromLC(L),{num:L.catalog().length})
  static toCNF ( Lprop , switchvar ) {
    if (Number.isInteger(Lprop)) { return [[Lprop]] }
    if (Lprop.kids.length===0) { return (Lprop.op==='and') ? [] : [[]] }
    if (Lprop.kids.length===1) { return CNFProp.toCNF(Lprop.kids[0]) }
    // it's compound
    if (Lprop.op==='and') { 
      return CNF.and(...Lprop.kids.map(x=>CNFProp.toCNF(x,switchvar))) 
    }
    // the only remaining case is Lprop === 'or'
    let kids = [...Lprop.kids]
    let ans = CNFProp.toCNF(kids.pop(),switchvar)
    while (kids.length>0) {
      let P=CNFProp.toCNF(kids.pop(),switchvar)
      ans = CNF.or( P, ans, () => {
        ++switchvar.num 
        return switchvar.num 
      } )
    }
    return ans
  }
  
  // an array form of this CNFProp
  toArray () {
    let unsigned = this.kids.map( x => ( Number.isInteger(x) ) ? x : x.toArray() )
    return (this.negated) ? ['-',unsigned] : unsigned
  }
  
}
////////////////////////////////////////////////////////////////////////////////
//////////  END CNFProp ////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
//
//  Global 501 Algorithm (polynomial time n-compact)
//
////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////
// Extensions of the LogicConcept class

// A Statement is any outermost Expression that is not a declaration or a 
// declared symbol inside a declaration. The body of a declaration can contain
// statements. 
// TODO: We are assuming declaration bodies are expressions for now. 
//       Either Update or keep it that way.
LogicConcept.prototype.isAStatement = function () {
  return (this instanceof Expression) && this.isOutermost() &&
         !((this.parent() instanceof Declaration) &&
            this.parent().symbols().includes(this)
          )
}

// matching syntactic sugar
LogicConcept.prototype.isADeclaration = function () { 
  return (this instanceof Declaration)
}

// We say an LC is a Propositon iff it has a .prop form and is not an environment.
// This includes all Statements but also Let's, and ForSome's.
// It does not include the bodies of ForSome declarations since each of those
// declarations will have atomic propositional forms and a copy of the body.
// Similarly, it does not include the bodies of Let declarations since they
// ought to appear as a copy after the environment and are only for marking 
// preemies and preventing the user from omitting the declarations.
LogicConcept.prototype.isAProposition = function () { 
  return (this.isAStatement() && 
         !this.hasAncestorSatisfying( A => A instanceof Declaration)) || 
         (this.isADeclaration() && !this.isA('Declare'))  
}

// We say an LC expression is a Comment if it has the form
// `(<<< "Comment string here.")`.  These are ignored when computing
// form, and are converted to actual comments when printing the LC to the 
// Lode terminal.
LogicConcept.prototype.isAComment = function () { 
  return (this instanceof Expression && this.numChildren()===2 && 
          this.child(0) instanceof LurchSymbol && 
          this.child(0).text()==='<<<')
}

// A more efficient descendants iterator for finding all descendents satisfying
// an 'include' predicate when it is known that no descendant of a descendant
// that satisfies the predicte can also satisfy the predicate.  If a second
// 'exclude' predicate is supplied, that signals that none of its descendants
// can satisfy the 'include' predicate, so whenever it is true the search can
// skip that entire branch and move on to its next sibling.
//
// This is useful for finding, say, all statements or declarations or all 
// formulas in an LC.  The default is to include everything and exclude nothing.
LogicConcept.prototype.descendantsSatisfyingIterator = 
  function* ( include = x=>true , exclude = x=>false ) {
    if ( include(this) ) { yield this
    } else if (!exclude(this)) { 
      for ( let child of this._children ) { 
        yield* child.descendantsSatisfyingIterator( include , exclude )
      }
    }
  }

// Compute the array of all Statements in this LC
LogicConcept.prototype.statements = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isAStatement() )]
}

// Compute the array of all declarations in this LC
// If the optional argument onlywithbodies is true, only return
// declarations with bodies.
LogicConcept.prototype.declarations = function ( onlywithbodies ) {
  return [...this.descendantsSatisfyingIterator( x => 
             x instanceof Declaration && 
             !x.isA('Declare')  &&  (!onlywithbodies || x.body())
         )]
}

// Compute the array of all Let's in this LC
// If the argument is true, only return those with bodies.
LogicConcept.prototype.lets = function ( onlywithbodies ) {
  return [...this.descendantsSatisfyingIterator( x => 
           x instanceof Declaration && x.isA('given') && 
           !x.isA('Declare') &&  (!onlywithbodies || x.body())
         )]
}

// Compute the array of all ForSomes's in this LC.  If the argument is true,
// only return those with bodies.
LogicConcept.prototype.forSomes = function ( onlywithbodies ) {
  return [...this.descendantsSatisfyingIterator( x => 
           x instanceof Declaration && !x.isA('given') && 
           !x.isA('Declare')  &&  (!onlywithbodies || x.body())
         )]
}

// Compute the array of all formulas in this LC
LogicConcept.prototype.formulas = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isA('formula') )]
}

// Compute the array of all propositions in this LC
LogicConcept.prototype.propositions = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isAProposition() )]
}

// We say an LC is an Inference of an environment L if it is either
//    (a) a conclusion of that environment or
//    (b) an environment whose ancestors are all claims, except possibly for L
// i.e., it extends the notion of a conclusion to include environments.  L is
// not considered to be a conclusion or inference of itself.
//
// Compute the array of all inferences in this LC.  
Environment.prototype.inferences = function () {
  // this is effectively the same code as for .conclusions
  let ans = [ ]
  this.children().forEach( child => {
    if ( child.isA( 'given' ) || child.isAComment() ) return
    // we assume Declare declarations are given's for now
    if ( child instanceof Expression || child instanceof Declaration )
        ans.push( child ) // guaranteed to be outermost expr/decl
    else if ( child instanceof Environment ) {
        ans.push( child ) // the only difference between this and conclusions
        ans = ans.concat( child.inferences() )
    }    
  })
  return ans
}

// Compute the array of all environments in this LC
LogicConcept.prototype.environments = function () {
  // this is effectively the same code as for .conclusions
  let ans = [ ]
  this.children().forEach( child => {
    if (!(child instanceof Environment)) return
    ans.push( child ) // it's an environment
    ans = ans.concat( child.environments() )    
  })
  return ans  
}

// Similarly, compute the array of all bindings in this LC
LogicConcept.prototype.bindings = function () {
  let ans = [ ]
  if (this instanceof BindingExpression) ans.push( this )
  this.children().forEach( child => 
      ans = ans.concat( child.bindings() )    
  )
  return ans  
}

// Similarly, compute the array of all LurchSymbols in this LC
LogicConcept.prototype.symbols = function () {
  return this.descendantsSatisfying( x => x instanceof LurchSymbol )
}

// efficiently see if an LC has a descendant satisfying some predicate
// it aborts the search as soon as it finds one
LogicConcept.prototype.some = function ( predicate ) {
   const gen = this.descendantsIterator()
   let descendant = gen.next()
   while (!descendant.done) { 
     if (predicate(descendant.value)) { return true }
     descendant=gen.next() 
   }
   return false  
}

// This utility is useful for what we need to do here. Insert this LC as the
// next sibling of LC target. You might have to make a copy of 'this' if it is
// already in the same tree as the target. We don't check that here.
LogicConcept.prototype.insertAfter = function( target ) { 
  target.parent().insertChild(this,target.indexInParent()+1)
}

// rename a symbol in place
LurchSymbol.prototype.rename = function( newname ) { 
  this.setAttribute( 'symbol text' , newname )
}

// return the Proper Name for a Lurch symbol if it has one, otherwise just
// return the name of the symbol
LurchSymbol.prototype.properName = function () {
  return (this.hasAttribute('ProperName')) ? this.getAttribute('ProperName') :
                                             this.text() 
}

// Compute the Prop Form string for an expression.  This is the .putdown form
// except that we must use the ProperName for symbols instead of their text.
// For bound symbols, this is their canonical name so alpha equivalent 
// expressions have the same propositional form.  For symbols declared with
// a body this is the renaming that accounts for the body.
// Note that the Prop form does not include the leading : for givens.
// We cache the results in a .propform js attribute and return them if present.
//
Expression.prototype.prop = function () {
  if (!this.propform) this.propform = this.toPutdown((L,S,A) => {
    let ans = (L instanceof LurchSymbol) ? L.properName() : S
    return ans.replace( /^[:]/, '' )
  }) 
  return this.propform
}

// Compute the Prop Form string for a Let or ForSome Declaration. 
// We will format both as [s1 ... sn] where s_i is the properName of the ith
// symbol it declares, whether or not it has a body, since if it is a ForSome
// with a body processForSomes will put a copy of the body after the declaration,
// which then will get its own propositional form. If it is a Let with a body
// processLetBodies will only use the body to rename the declared symbols with 
// that body, and use it to flag preemies. If it eventually appears outside the
// Let environment it gets its own prop form. Declare's don't have a prop form.
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

// convert to cnf in satSolve format
LogicConcept.prototype.cnf = function (target=this) {
  let cat = this.catalog()
  let n = cat.length+1 
  let ans = CNFProp.fromLC(this,cat,target).simplify()
  return CNFProp.toCNF(ans,{num:n})
}

// Modes are 'raw', 'simplify', or 'cnf'. The 'raw' mode just 
// converts t he LC to algebraic form.  The 'simplify' mode distributes negations
// by DeMorgan.  The 'cnf' mode expands all the way to cnf.
LogicConcept.prototype.toAlgebraic = function ( mode = 'raw' , target=this ) { 
  let cat = this.catalog()
  let raw = CNFProp.fromLC(this,cat,target)
  if (mode==='raw') { return raw.toAlgebraic() }
  let simp = raw.simplify()
  if (mode==='simplify') { return simp.toAlgebraic() }
  // otherwise mode must be 'cnf' 
  let n = cat.length
  return cnf2Algebraic( CNFProp.toCNF(simp,{num:n}) , n )
}

// Useful for seeing the raw prop form of small LCs
LogicConcept.prototype.toEnglish = function (target) { 
  let cat = this.catalog()
  return CNFProp.fromLC(this,cat,target).toEnglish(cat)
}

// Toggle the 'given' status of an lc (in place)
LogicConcept.prototype.negate = function () {
  if (this.isA('given')) { this.unmakeIntoA('given') 
  } else { this.makeIntoA('given') 
  }
}

// Synonym for 'negate'
LogicConcept.prototype.toggleGiven = LogicConcept.prototype.negate

// Validate this LC, store the result, and return true or false
LogicConcept.prototype.validate = function (target=this) {
  
  // If it's a preemie, it's wrong by definition.
  // Note that it might be the case that a preemie gets marked wrong
  // simply because it's a preemie, but is actually valid for some other reason
  // e.g. if the same statement is valid immediately prior to the Let-env.
  // But we are making this the definition of the Let-declaration by fiat, so
  // in that case the user should just put the preemie before the Let-environment
  // (in which case one wonders why he's making a Let-env with that body anyway).
  // The bottom line is that this works just fine in practice.       
  if (this.preemie) { 
    Validation.setResult(conc,{ result:'invalid', reason:'preemie' })
    return false 
  } 
  
  // validate everything else
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

// Validate every claim in this LC, store the result, and return true or false
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

//////////////////////////////////////////////////////////////////////
//
//                     DOCUMENT PROCESSING
//
// A 'library' for now consists of initial children that declare all of
// the constants (non-metavars) followed by one or more siblings, each of
// which is a given environment representing a formula in that library. 
//
// A 'document' for now consists of a library with a single environment 
// (the user's content) as its last child.
//
// TODO: 
//   *  Allow the users to supply their own formulas in their document, and
//      declare their own constants in their documents.  Note that this might
//      already work for the following reason. We put the instantiations 
//      immediately after the formula they instantiate.  That means that the 
//      instantiations are accessible wherever the formula is by definition.
//      So the only 'weird' aspect to consider is that statements which come 
//      before the Theorem/Formula in the user's document would still be used to 
//      try to instantiate the theorem.  And yet any instantiation of the theorem
//      ought to be valid, no matter what oracle it obtained the instantiation
//      from.  In any event, implement a convenient way to flag a user formula
//      and test if it works as predicted.
//
//   *  The following algorithm makes several passes through the entire document
//      to process each step/phase separately for testing and experimenting.
//      It might be more efficient to make one pass through the entire document, 
//      modifying everything as you go.  Update: initial benchmarks seem to 
//      indicate that ALL of the computation time is coming from finding all of 
//      the instantiations, so this probably doesn't matter.  Furthermore, 
//      initial tests seem to indicate that that in an interactive UI almost
//      everything this algorithm does will be almost instantaneous.  So 
//      optimization would mainly only affect batch mode instantiation of a 
//      large document from scratch.

  //////////////////////////////////////////////////////////////////////////
  //
  //                  0. Start with Plain Text Files
  //
  // Since we don't have any other UI to input documents, all Lurch documents
  // are created from plain text content, in (extended) putDown notation 
  // for now.  It is convenient to be able to load such files into Lode.  We
  // currently have two folders for test files.  One for libraries and one for 
  // user content (proofs).  We have some convenient utilities for loading those 
  // strings from files given their filename.  Note that all such text files end
  // with the extension .js.  This is so we don't have to enclose the files in
  // string quotes and obtain js syntax highlighting when editing so that putdown 
  // comments // get colored appropriately.
  
  // Load a Library that is saved as a text file.
  const libPath = '../src/experimental/libs/'
  // Load a user document is where his proofs and theorems go.    
  const proofPath = '../src/experimental/proofs/'
  // List the available libs
  const listLibs = () => console.log(execStr('ls -C '+libPath))
  // List the available proofs
  const listProofs = () => console.log(execStr('ls -C '+proofPath))
  // List both libs and proofs
  // NOTE: this can also be called by just typing '.list' (no quotes) in Lode.
  const list = () => { console.log(
    `\n${headingPen('Available Libraries:')}\n`+
    `${docPen(execStr('cd '+libPath+';ls -pRC '))}\n`+
    `${headingPen('Available Proofs:')}\n` +
    `${docPen(execStr('cd '+proofPath+';ls -pRC;cd ../../../scripts '))}`
  )} 
  // Load just the string for a library and return that.  You can omit the .js 
  // extension.
  const loadLibStr = (name) => {
        return fs.readFileSync(libPath+name+((!/\.js$/.test(name))?'.js':''),
        { encoding:'utf8'}) 
      }
  // Load just the string for a proof document and return that.    
  const loadProofStr = (name) => {
        return fs.readFileSync(proofPath+name+((!/\.js$/.test(name))?'.js':''),
        { encoding:'utf8'}) 
      }

  //////////////////////////////////////////////////////////////////////////
  //
  //         1. Make an LC document with Constants and Metavars
  //
  // After loading the strings for a lib and proof, we would like to join them
  // to form an actual LC version of the document.  For convenience, we do not 
  // require the text files for libraries to specify which children are formulas
  // since we just assume all of the non-declaration children of a library are
  // formulas.  Thus we do the following processing.
  //
  // * Convert the loaded library strings and proof strings to LCs using the
  //   lc command.
  // * Convert all of the children of an LC library to formulas and Declares.
  // * Merge any number of LC libraries and proofs into a single document.
  // * Process all shorthands in the merged document.
  // * Mark all metavariables in the merged document.
  
  // Make a library (from its string or an environment)
  //
  // A Library is a Document with no user content (i.e., `{ :D F₁ ... Fn }`)
  // where D is a declaration with no body and F₁ ... Fn are formulas.
  //
  // For convenience, we do the following.
  //   * If the argument is a string, load that library string and use lc to
  //     convert it to an LC.
  //   * Mark every declaration child of the LC library as a 'Declare'.
  //   * Mark all of the remaining children (which must be environments)
  //     as formulas (so they satisfy .isA('formula'))
  //   * Return the resulting LC.
  //
  // TODO: We are assuming that a formula must be an environment.  Enforce
  //       or generalize this.
  const makeLib = (library) => {
    let lib = (library instanceof Environment) ? library.copy() : 
                                                 lc(loadLibStr(library))
    const Decs = lib.children().filter(kid => kid instanceof Declaration)
    const Forms = lib.children().filter(kid => !(kid instanceof Declaration))
    Decs.forEach( dec => dec.makeIntoA('Declare') )
    Forms.forEach( f => f.makeIntoA('formula') )
    return lib
  }
  // syntactic sugar for when we want to load the LC version of a library directly
  const loadLib = makeLib
  
  // Merge Libraries
  //
  // In desktop Lurch we have the idea of 'dependencies' which can be loaded on 
  // top of other dependencies in order to expand the rule set from, e.g. Prop
  // Logic to Predicate Logic to Set Theory, etc.  We imitate that here by merging
  // libraries.  This assumes that makeLib has been run on all libs being merged.
  const mergeLibs = (...libs) => {
    let ans = new Environment()
    libs.forEach( original => {      
      let lib = (original instanceof Environment) ? original.copy()
                                                  : loadLib(original)
      lib.children().forEach( kid => {
        // put the declarations at the top so the constant syntax highlighting
        // works for instantiations.  The order we do it doesn't matter.
        if (kid.isA('Declare')) { 
          ans.unshiftChild(kid) 
        } else {
          ans.pushChild(kid)
        }
      })
    })
    return ans
  }
  // syntactic sugar for when we want to load the LC version of several libraries
  const loadLibs = mergeLibs

  // Load one or more proofs (from their filename strings)
  //
  // To do this, just concatenate all of the strings wrapped in environment
  // brackets, wrap the whole thing in environment brackets, and convert the
  // resulting string to an LC with lc().
  const loadProofs = (...proofstr) => {
    return lc('{'+proofstr.map(x=>loadProofStr(x)).join('}{')+'}')
  }

  // To make a user's 'document' we will just add an environment with
  // the user's content as the last child of a copy of a library.  Then
  // we insert a new 'Declare' as the first child containing the reserved 
  // symbols '<<<' and "LDE EFA".  The arguments can be 
  //   * strings - interpreted as a single filename
  //   * Environments - interpreted as a single library or userdoc
  //   * arrays - of strings or environments, interpreted as more than one of
  //              the previous two kinds of things
  const makeDoc = (userdoc, library = LurchLib) => {
    // start with a copy of the library
    let doc=library.copy()
    // Add system global constants to the very top
    // TODO: this doesn't check if they user already defined them.  Enforce or 
    //       check for it.
    const system = lc(`:[ 'LDE EFA' '<<<' ]`).asA('Declare')
    doc.unshiftChild( system )
    doc.pushChild(userdoc.copy())
    return doc
  }

  //
  //        Load, Process, and Validate an entire document from scratch.
  //
  // This is an all-in-one workhorse for making and testing documents. 
  // * docs are a single string, array of strings or a single LC environment. 
  //   It is not optional.
  // * libs is the same thing for libraries, but defaults to LurchLib if omitted
  // TODO: maybe add the n-compactness level as an argument or go until a fixed
  //       point
  const load = (docs,libs = LurchLib, n=4) => {
                                                 // console.log()
                                                 // time('Load User Doc')
    const userdoc = 
      (docs instanceof Array) ? 
        (docs.length === 0) ? new Environment()
        : loadProofs(...docs)
      : (docs instanceof Environment) ? docs 
        : loadProofs(docs) 
                                                 // timeEnd('Load User Doc')
                                                 // time('Load Libraries') 
    const lib =       
      (libs instanceof Array) ? 
        (libs.length === 0) ? LurchLib
        : loadLibs(...libs)
      : (libs instanceof Environment) ? libs
        : loadLibs(libs)
                                                 // timeEnd('Load Libraries')
                                                 // time('Make Document') 
    const doc = makeDoc(userdoc,lib)
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


  //////////////////////////////////////////////////////////////////////////
  //
  //                  1. Process Shorthands 
  //
  //
  // In order to make it convenient to enter large documents in putdown notation,
  // it is convenient to use fromPutdown to enter some reserved content in the
  // document that is preprocessed before evaluating the document.
  // 
  // The following are what we have for Shorthands. More might be added later. 
  //
  //  * Scan a document looking for the symbol <<, which we call a 'marker'. 
  //    For every marker, 
  //      (i) if the preceding sibling is an environment, attribute it 
  //          as a 'blatant instantiation hint'. 
  //      (ii) if the preceding sibling is a declaration, attribute it 
  //           as a 'Declare',
  //      (iii) in either case, finally, delete the marker.
  //
  //   * Scan for occurrences of the symbol '@' and replace that with the 
  //     symbol "LDE EFA" (which then will still print as '@' but it's what is
  //     needed under the hood).
  //
  //   * Scan for occurrences of the symbol '<<thm' and mark it's previous
  //     sibling as a user theorem, and make a copy of that user theorem,
  //     ans insert it after the user's theorem and mark it as a formula and
  //     user formula.
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
  const processShorthands = L => {
    L.descendantsSatisfying( x => (x instanceof LurchSymbol) && x.text()==='<<' )
      .forEach( m => { 
        const target = m.previousSibling()
        if (target instanceof Declaration) {
          target.makeIntoA('Declare')
        } else { 
          target.makeIntoA('blatant instantiation')
        }  
        m.remove()
      } )
    L.descendantsSatisfying( x => (x instanceof LurchSymbol) &&
                                   x.text() === '<<thm' )
      .forEach( m => {
        let thm = m.previousSibling()
        thm.userThm = true
        let formula = thm.copy()
        formula.insertAfter(thm)
        formula.makeIntoA('formula')
        formula.userFormula = true
        m.remove()
      } )
    L.descendantsSatisfying( x => (x instanceof LurchSymbol) && x.text()==='@' )
      .forEach( m => { 
        m.replaceWith(new LurchSymbol('LDE EFA'))
      } )
    L.descendantsSatisfying( x => (x instanceof LurchSymbol) && x.text()==='≡' )
      .forEach( m => { 
        const LHS = m.previousSibling()
        const RHS = m.nextSibling()
        let A1=LHS.copy().asA('given'), A2=LHS.copy(),
            B1=RHS.copy(), B2=RHS.copy().asA('given')
        LHS.replaceWith(new Environment(A1,B1))
        RHS.replaceWith(new Environment(B2,A2))
        m.remove()
      } )
  }

  
  ///////////////////////////////////////////////////////////////////////
  //
  //                  2. Process all Declarations and Bindings
  // 
  // * For each Let-environment, flag any copies of the body of the Let() that
  //   are in its scope to be automatically marked wrong during validation.
  // * For each ForSome declaration with body, insert a copy of its body after
  //   the declaration. 
  // * Rename all bound variables in all formulas to a canonical form by
  //   giving them a Proper Name that cannot be entered by the user like 
  //   y₀, y₁, etc.
  // * Rename all bound variables in all non-formulas to a canonical form by
  //   giving them a Proper Name like x₀, x₁, etc. that cannot be captured
  //   by a binding in a formula because formulas can only use the disjoint
  //   set of names reserved for them, e.g. y₀, y₁, ...
  // * Mark the metavariables in all of the formulas.  
  // * Rename the constants declared by a ForSome or Let-with-body to their
  //   Proper Names (unique for each constant-body pair) in both the declaration
  //   and its scope (including any copy of the body just inserted).  There's no
  //   need to rename them in the original copy of the body inside the
  //   declaration because it has already served its purpose and won't be used
  //   again for anything.
  //
  // TODO: One assumption we are making for now is that a formula
  //       cannot, itself, be a Let-environment.  That's because we are 
  //       assuming that a Let declaration is only inserted in a formula
  //       that does some generalization, and the generalization must be
  //       outside of the scope of that Let-declaration.  Enforce this.
  //
  //       Indeed, it would make more sense to just have a different flavor of
  //       environment, called a LetEnvironment, that automatically requires 
  //       declarations at the beginning (like a binding environment does).
  //
  //       Furthermore, we are making another simplifying assumption
  //       that the every Let() declaration must be made with the intent of 
  //       concluding some particular generalization, and that generalization
  //       must be specified as the body of the declaration.  Unlike ForSome
  //       declaration, the body of the Let does not indicate what we already
  //       know about the declared variable, but rather it indicates what we
  //       intend to deduce (via a generalization) that we need the declared
  //       variable as a premise for.
  // 
  //       This allows us to then easily enforce the final restriction on 
  //       generalizations, namely, that they cannot appear inside any 
  //       Let-environment that is a premise for the generalization rule.
  //       By specifying what we hope to generalize in the body of the Let
  //       we can then flag, and give feedback about any copy of the body
  //       that is in the scope of that Let. It also prevents a user from
  //       omitting the Let declaration altogether in their proof by 
  //       providing a premise that is stronger than the Let-enviroment premise
  //       of a rule, and omits the Let.
  //
  //       How to make it convenient and natural for the user to enter the body
  //       of the Let's is something to be discussed and sorted out.  User's can
  //       omit it as long as they are willing to accept that Lurch won't flag 
  //       the error of including the generalization in the scope of the Let, or
  //       fail to provide a required Let in their proof.
  //       If they want to have Lurch flag that, then they will have to specify
  //       the body in some way, e.g. "In order to show ∀z,P(z), let x be
  //       arbitrary" or "in order to show A⊆B, let x be an arbitrary element 
  //       of A", or have the statement being generalized cite its corresponding
  //       Let.

  // Get the Lets with body and flag any 'preemies'.
  const processLetBodies = doc => {
    // Get the lets with body (hence the 'true').
    // If a let has no body, no problem.  It means they are taking the risk
    // the Lurch won't catch a premature generalization that is inside the
    // scope of this declaration, or omit a Let, and most likely their library is 
    // inconsistent.  But if it has a body, mark any preemie conclusions
    // of this let environment.
    // TODO: There's really no reason to do this to formulas containing 
    //       metavariables, since they do not have a prop form.  Only full 
    //       instantiations and user content gets converted.  We don't check
    //       for that here because it's not obvious that it would be a speed up
    //       instead of a slow down, and there would be no harm in flagging a
    //       preemie in a formula (and in fact might actually give the formula
    //       author or user some feedback about his formula or theorem.
    doc.lets(true).forEach( decl => {
      // TODO:Once again, we are assuming the Let environments start with a Let.
      //      We also are assuming all declaration bodies are Expressions.
      const body = decl.body()
      const letenv = decl.parent()
      letenv.conclusions().forEach( conc =>  {
        // Note the .equals also checks that the attributes are the same
        // TODO: Check if that matters for this purpose.  Will it miss some 
        //       preemies due to attribute differences?
        if (conc.equals(body)) { 
          conc.preemie = true
        }
      }) 
    })
  }

  // Append the bodies of all ForSomes
  const processForSomeBodies = doc => {
    // get the ForSomes with a body (hence the 'true') that don't contain 
    // metavariables
    const forSomes = doc.forSomes(true).filter( dec =>
       Formula.domain(dec).size===0)
    // insert a copy of the body after the declaration and mark where it came from
    // with the js attribute .bodyof, unless it's already there
    forSomes.forEach( decl => {
      if (!(decl.nextSibling() && decl.nextSibling().bodyof &&
            decl.nextSibling().bodyof === decl )) {      
        let decbody = decl.body().copy()
        decbody.insertAfter(decl)
        decbody.bodyof = decl
      }
    })
  }  

  // Rename any symbol declared by a declartion with body by appending the
  // putdown form of their body.  Note that for bodies that have a binding
  // we want to use the alpha-equivalent canonical form, 
  // 
  const assignProperNames = doc => {
    // get the declarations with a body (hence the 'true') which is an expression
    // TODO: we don't support environment as bodies yet.  Decide or upgrade.
    const declarations = doc.declarations(true).filter( x => 
                           x.body() instanceof Expression)
    // rename all of the declared symbols with body that aren't metavars
    declarations.forEach( decl => {
       decl.symbols().filter(s=>!s.isA(metavariable)).forEach( c => {
         // Compute the new ProperName
         c.setAttribute('ProperName',
             c.text()+'#'+decl.body().toPutdown((L,S,A)=>S)) //.prop())
         // apply it to all c's in it's scope
         decl.scope().filter( x => x instanceof LurchSymbol && x.text()===c.text())
           .forEach(s => s.setAttribute('ProperName',c.getAttribute('ProperName')))
       })
     })
  }  
    
  // Handle the bodies of the declarations
  const processDeclarationBodies = doc => {
    processLetBodies(doc)
    processForSomeBodies(doc)
  }
  
  // Matching checks if a match would violate variable capture, but 
  // Formula.instantiate does not.  So we need to turn all bound variables in 
  // formulas to a canonical form e.g. y₀, y₁, ... that cannot be entered by the
  // user. Applying this to formulas before instantiating fixes that.  
  //
  // TODO: when making this permanent, just upgrade Formula.instantiate to 
  //       respect ProperNames so we can delete this routine and just use the
  //       next one instead. Also enforce the requirement that user's can't 
  //       enter any of y₀, y₁, ....
  const replaceBindings = ( expr , symb='y' ) => {
      const stack = new Map()
      const push = () => stack.forEach( value => value.push( value.last() ) )
      const pop = () => stack.forEach( ( value, key ) => {
          if ( value.length > 0 ) value.pop()
          else stack.delete( key )
      } )
      const get = name => stack.has( name ) ? stack.get( name ).last()
                                            : undefined
      const set = ( name, newname ) => {
          if ( stack.has( name ) ) {
              const array = stack.get( name )
              array[array.length-1] = newname
          } else {
              stack.set( name, [ newname ] )
          }
      }
      let counter = 0
      const solve = e => {
          if ( e instanceof LurchSymbol && stack.has(e.text()) ) 
              e.rename( get( e.text() ) )
          if ( e instanceof BindingExpression ) {
              push()
              e.boundSymbolNames().forEach( name => {
                  counter++
                  set( name, `${symb}${subscript(counter)}` ) 
              })
              e.children().forEach( c => solve(c) )
              pop()
          }
          if ( e instanceof Application)
               e.children().forEach( c => solve(c) )
      }
      solve( expr )
  }
  
  // We also need alpha equivalent statements to have the same propositional 
  // form.  This routine does the same thing as the previous routine, but 
  // instead of renaming the variables in place, we just assign their 
  // canonical names x₀ , x₁ , etc. to their ProperName attribute, since that is
  // what .prop uses to make the propositional form.
  const renameBindings = ( expr , symb='x' ) => {
      const stack = new Map()
      const push = () => stack.forEach( value => value.push( value.last() ) )
      const pop = () => stack.forEach( ( value, key ) => {
          value.pop()
          if ( value.length == 0 ) stack.delete( key )
      } )
      const get = name => stack.has( name ) ? stack.get( name ).last()
                                            : undefined
      const set = ( name, newname ) => {
          if ( stack.has( name ) ) {
              const array = stack.get( name )
              array[array.length-1] = newname
          } else {
              stack.set( name, [ newname ] )
          }
      }
      let counter = 0
      const solve = e => {
          // console.log(`Solving ${e.toPutdown()} with stack`)
          // stack.forEach( (x,key) => console.log([key,x]))
          if ( e instanceof LurchSymbol && stack.has(e.text()) ) 
              e.setAttribute( 'ProperName' , get( e.text() ) )
          if ( e instanceof BindingExpression ) {
              push()
              let savecounter = counter
              e.boundSymbolNames().forEach( name => {
                  counter++
                  set( name, `${symb}${subscript(counter)}` ) 
              })
              e.children().forEach( c => solve(c) )
              counter = savecounter
              pop()
          }
          if ( e instanceof Application)
               e.children().forEach( c => solve(c) )
      }
      solve( expr )
  }
    
  // Apply replaceBindings to all of the formulas in the document
  const replaceFormulaBindings = doc => {
    doc.formulas().forEach( f => {
      f.statements().forEach( expr => replaceBindings( expr , 'y' )
      )
    })
  }

  // Apply renameBindings() to the entire document
  const makeBindingsCanonical = doc => {
    doc.statements().forEach( expr => renameBindings( expr , 'x' ) )
  }

  // Mark the metavariables in all of the formulas in a document.
  //
  // Note: the second arg of .from() tells it to mark them in place rather than 
  //       making a copy, so this marks them in place.
  const markMetavars = doc => doc.formulas().forEach( x => Formula.from(x,true) )
  
  ///////////////////////////////////////////////////////////////////////
  //
  //                  3. Cache all Domains 
  // 
  
  // For efficiency, mark all of the expressions in formulas with their domains
  // (the set of metavariable text names) for easy lookup.  This assumes that 
  // the metavariables have been marked in Step #2 above.  We also mark the 
  // formula with its maximally Weenie expressions, and its domain size while we
  // are caching stuff for easy access later.
  //
  // TODO: maybe the above information should be saved with the Library itself so 
  //       it only has to be computed once.  But for now, this is fine and allows
  //       the library text files to be clean and uncluttered.

  // Check if an expression is potentially Weenie.  
  // Currently we don't try to match user expressions to a pattern that is 
  // a single metavariable or EFA because they match everything.  
  // This causes some rules, like or- or substitution, to require BIH's for now.
  const forbiddenWeeny = L => (
    (L instanceof Environment) || (L instanceof LurchSymbol) || isAnEFA(L) )
  // for benchmarking
  // const forbiddenWeeny = L => (L instanceof Environment)
     
  // Cache the domain information for a formula.  This should be done after
  // processing the Declarations so it applies, e.g. to declaration bodies.
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
    // if it has no metavariables, or the only remaining metavariables
    // are forbidden, it can't be instantiated, so mark it finished.  
    // Note that max===0 is not the same as f.domain.size===0 because of forbidden
    // lone metavariables
    if (max===0)  f.finished=true
    // boolean that is true iff f is Weeny
    f.isWeeny = (f.domain.size === max && max>0)
    // the array of maximally Weeny expressions in this formula (whether or not 
    // it is Weeny).  Don't add any when max===0 or you can match already 
    // partially instantiated expressions with the same expression when forbidden
    // metavars are still present but max===0.
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

  ///////////////////////////////////////////////////////////////////////
  //
  //                  4. Process Blatant Instantiation Hints
  // 
  // For now we define a Blatant Instantiation to be an environment in the user's
  // content that is marked as a "blatant instantiation".

  // Since Matching won't match an environment to a formula that has a 
  // different given status, check if LCs a and b are both givens or both
  // claims and if not, toggle the given status of a, and return true if it was
  // toggled and false it it wasn't.  This is just a utility used by processHints.
  //
  // TODO: when this is made permanent, just upgrade Matching to make this
  //       hoop jumping unneccesary.
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

  // Go through and create the appropriate instantiations from the Blatant Hints
  // in document L, mark each as valid or not, and insert the relevant 
  // instantiation when they are valid.
  //
  // TODO: Store the validation information in a more standard and sensible way.
  const processHints = L => {
    const formulas = L.formulas()
    const BIH = [...L.descendantsSatisfyingIterator( x => 
      (x instanceof Environment && x.isA('blatant instantiation') ) )]
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
  
  ///////////////////////////////////////////////////////////////////////
  //
  //                  5. Instantiate!
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
  // Since we consider Lets and ForSomes to be proposition, we want to be able to 
  // try to match any proposition to any other proposition.  The Problem class
  // currently can't handle this, so we add a utility here to make it possible.
  //
  // This routine returns an array of solutions.
  // TODO: Add to Problem class and Matching as needed.
  //       We assume the bodies of ForSomes are expressions for now.
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
    // now loop through all of the formulas, check if they are finished and 
    // if not, match all of their Weeny propositions to all of the elements of E
    // to find instantiations and partial instantiations
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
                 // let's also remember which expression created this 
                 // instantiation, and which pass for debugging and feedback
                 // Note that .pass is the number of passes remaining. 
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
                 if (inst.domain.size===0) { inst.instantiation=true }
                 // either way, rename ForSome constants that aren't metavars
                 // We should not have to insert a copy of the bodies of ForSomes
                 // since they should be there automatically because they were
                 // in the formulas.
                 // TODO: * we might want to upgrade .bodyof to an LC attribute
                 //         since Formula.instantiate doesn't copy that attribute
                 // 
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
    // TODO: it would be more efficient to do this to just the instantiations
    //       as they are inserted, since this makes a pass through the entire
    //       document on each pass, which has a lot of redundancy.
    markDeclaredSymbols(document)
    instantiate(document,n-1)
  }

///////////////////////////////////////////////////////////////////////
//
//                  6. Scoping Validation
// 
// After instantiating we can check all the scopes and flag any errors that
// occur using the existing Scoping.validate() tool.  Errors that occur in the 
// instantiations shouldn't matter because the user won't see the instantiations.
// TODO: check if this order (scope checking after instantiating) makes sense
//       by getting our hands dirty.


///////////////////////////////////////////////////////////////////////
//
//                  7. Validation!
// 
// The final thing we might want to do is validate the LC.  This can be done
// for the entire document with doc.validate() above.  But we would like to 
// get more refined feedback about individual claims in the document itself.
//
// Given that we have already cached all of the necessary information, the only
// thing that remains is to allow L.validate() to take a target as an argument, 
// which we do now.

// We say an LC in an environment L is irrelevant to the inference 'target'
// if no ancestor of it is accessible to the target.  Note that this is 
// the 501-level definition, so we keep the instantiations of formulas that 
// are created by expressions that appear in the user's document that come after
// the target.
LogicConcept.prototype.irrelevantTo = function (target) {
  return target.ancestors().indexOf(this)<0 && 
    !this.hasAncestorSatisfying( z => { return z.isAccessibleTo(target,true) } )
}

//////////////////////////////////////////////////////////////
// Syntax Highlighting
//
// In order to support syntax highlighting in our outputs 
// like Lode (or html, latex, etc) we markup the document
// with various attributes Currently we mark constants and 
// declaration scopes for Lets.
//
// TODO: this should be factored out and combined with the 
//       utilities in Lode for syntax highlighting to a more general
//       system where we can replace, e.g. ansi terminal codes
//       with html tags, or whatever.

//////////////////////////////////////////////////////////////
// Declaration contexts
//
// Utiltities for adding the declaration contexts to all of the statements and
// declarations in the document.  This is no longer needed, but gives nice 
// feedback so we keep it for now.
//////////////////////////////////////////////////////////////

// mark explicitly declared symbols throughout the document
const markDeclaredSymbols = doc => {
   // fetch all of the declarations
   let declarations = doc.descendantsSatisfying(x=>(x instanceof Declaration))
   // fetch all of the symbols
   let symbols = doc.descendantsSatisfying(x=>x instanceof LurchSymbol)
   // for each one, see if it is in the scope of any declaration of that symbol
   symbols.forEach( s => {
     if (!s.isA(metavariable)) {
        if (declarations.some( d => 
             (d.isAccessibleTo(s) || (s.parent()===d)) && 
              d.symbols().map(x=>x.text()).includes(s.text())
           ))
        s.constant = true
      }
   })
 }

// Mark Declaration contexts
//
// the context attribute key, just for modularity
const context = 'context'

// Add the symbol names (as strings) to this expressions context 
// If the context doesn't exit, create it, even if no args are supplied.
// If it already has one add the symbol names to the end,
// whether or not they are duplicates.  We will let scope checking worry about
// that.
LogicConcept.prototype.addToContext = function ( ...names ) {
  if (!this.hasAttribute(context)) { this.setAttribute(context,[]) }
  this.getAttribute(context).push(...names)
}

// Mark all of the declaration contexts
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
// In this file we make some simplifying assumptions in how we define a 
// Document.  Currently, we assume that a Document is an Environment of the
// form `{ :D F₁ ... Fn U }` where D is a Declare declaratation that declares
// all of the global constants, F₁ ... Fn is a sequence of zero or more formulas
// and U is a single environment containing the user created content in the 
// document.

// then to process the document we make a copy and insert all the extra crap
// The optional n specifies what n-compact mode should be used for instantiations
// The default is to not do any instantiation unless requested.
const processDoc = (d,n=0) => {
  let doc=d.copy()
  processShorthands(doc)
  processDeclarationBodies(doc)
  replaceFormulaBindings(doc)
  makeBindingsCanonical(doc)
  markMetavars(doc)
  assignProperNames(doc)
  processDomains(doc)
  processHints(doc)
  // instantiate(doc,n) // can be done afterwards
  Scoping.validate(doc)
  markDeclaredSymbols(doc)
  // no longer needed, but it works and could be useful some day
  // markDeclarationContexts(doc)
  return doc
}
///////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////
// 
//  Reporting Utilities
//
//  Here we collect various "reports" we can ask about a document to generate
//  various kinds of specific information and views of the document.  This
//  has more flexibility thabn simply adding options to .show() via our
//  Lode formatter.

// We assume 'this' is a document with all of the above simplifying assumptions.
LogicConcept.prototype.report = function ( options={numbered:true}) {
  if (options.showUserOnly) {
   console.log(defaultPen(this.lastChild().toPutdown(formatter(options), 
      text => /\n/.test( text ) || erase(text).length > 1 )))
  } else if (options.numbered) {
    let ans = defaultPen('  {\n')
    let linenum = ''
    const numberedTheme = {
      showAttributes:true,
      showContexts:false,  // we currently don't use these
      showValidation:true,
      showProperNames:false,  // once this works, no need to see it
      simpleProperNames:true,
      showEnds:true,
      showInstantiations:true}
    this.children().forEach( c => {
      // for a summary report, only show final instantiations and user's content
      if (options.hideFinished && (c.isA('Declare') || c.isA('formula')) &&
          !c.instantiation) return
      linenum = `${c.indexInParent()}`
      linenum += tab(4-linenum.length)
      linenum = (!c.isA(instantiation)) ? linenumPen(linenum) 
                                        : instantiationPen(linenum)
      if (options.showProperNames) numberedTheme.showProperNames=true
      if (options.showUserFormulas) numberedTheme.showUserFormulas=true
      ans += linenum+format(c,numberedTheme).replace(/\n/g,'\n    ')+'\n'
    })
    ans += defaultPen('  }') +
           ((Validation.result(this).result==='valid') ? greencheck :
           ((Validation.result(this).result!=='valid') ? redx       : ''))
    console.log(ans)
  }
}

// Default Lurch Lib: we load this for debugging purposes for now.
// TODO: finish LurchLib
const LurchLib = loadLib('Lurch')

// example default documents just for convenience
let propdoc = makeDoc(lc(`
  { // user doc
    { :(¬ (or P Q)) (and (¬ P) (¬ Q)) }  // Thm: DeMorgan
    // proof
    { :(¬ (or P Q) )
       { :P (or P Q) →← } (¬ P)
       { :Q (or P Q) →← } (¬ Q) 
    }
  } // end user's doc`
))
let newpropdoc = processDoc(propdoc)
instantiate(newpropdoc,2)
newpropdoc.validateall()

let doc = makeDoc(lc(`
  // user doc
  {  
    // have to debug exists-. Here's a BIH for now. TODO: remove later.
    // { :(∃ z , (¬ (P z))) [c,(¬ (P c))] } // <<
    // hopefully that will fix this:
    { 
      { :(∀ y , (P y)) (¬ (∃ z , (¬ (P z))) ) }
      { :(¬ (∃ z , (¬ (P z)))) (∀ y , (P y))  }   
    }  // Thm: DeMorgan  
    // proof
    { :(∀ y , (P y))
      { :(∃ z , (¬ (P z)))
        [c,(¬ (P c))]
        (P c)
        →←
      }
      (¬ (∃ z , (¬ (P z))))
    }
    {:(¬ (∃ z , (¬ (P z))))
      { :[x]
        { :(¬ (P x))
          (∃ z , (¬ (P z)))
          →← 
        }
        (P x)
      } 
      (∀ y , (P y))
    }
  } // end user's doc
  `
))

let newdoc = processDoc(doc)
instantiate(newdoc,4)
newdoc.validateall()

///////////////////////////////////////////////////////////////////
// Misc Utility
//
// Convert a numerical CNF to an algebraic form with switch vars after n
// Don't really need this, but is good for debugging
const cnf2Algebraic = ( C , n ) => {
  let ans = C.map( x => x.map( y => CNFProp.toVar(y,n)).join('') )
  return ans.join('+')
}

///////////////////////////
// Debottlenecker
// 
// In order to see where the bottlenecks are in the code, we build here a crude
// custom code profiler/timer. It works as follows.
// Calling Benchmark(f,name) times the execution of function f and stores the time
// it took under the name 'name', which should be a string, in a global object
// called Report with a key for each name.  The value of each key is an 
// object of the form { calls:n , time:t } where n is the number of times the 
// routine was called, and t was the total time it took for those calls.
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

export default { cnf2Algebraic, getUserPropositions, instantiate, 
   LurchLib, propdoc, newpropdoc, doc, newdoc, markDeclaredSymbols, markMetavars,
   markDeclarationContexts, list, listLibs, listProofs, loadLibStr, loadProofStr,
   loadLib, loadProofs, load, makeLib, mergeLibs, loadLibs, 
   makeDoc, processShorthands, processHints, processLetBodies,
   processForSomeBodies, assignProperNames, processDeclarationBodies, processDoc,
   cacheFormulaDomainInfo, processDomains, subscript, renameBindings,
   replaceFormulaBindings, makeBindingsCanonical, Report, Benchmark }
   
// Crude Attribute and matching documentation for quick reference

//I think we have the following (rather inconsistent, I admit) situation regarding attributes in matching:
// 1) For atomic formulas, attributes matter.  That is, x with color=purple is not the same as x with color=orange.
// 2) For non-atomic formulas, attributes do not matter, and matching is defined only in terms of their children.  I could change this without too much trouble if you prefer that it be changed for consistency.
// 3) When using the Formula namespace to match a formula against a possible instance, then given vs. not given matters for both environments and outermost expressions.
// 4) Although this should be 100% invisible to any user of the matching package, and therefore 100% irrelevant, I will state it for completeness's sake:  There are some de Bruijn attributes used internally by the matching package to record the original symbol names, and those are (necessarily and correctly) ignored during matching.
// That should be it.
//
// Sorry, here are corrections to the above statements:
// 1) This should say "for atomic expressions"
// 2) This should say "for non-atomic expressions"
// 3) This is correct as stated above, but I should add more info:  No other attributes other than "given" are checked when converting a formula-and-possible-instance pair into a matching problem, but once it has been converted into one, then rules 1) and 2) apply.
// 4) Correctly stated above.
