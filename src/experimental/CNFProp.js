////////////////////////////////////////////////////////////
//
//  CNFProp (for Global n-compact Validation)
//
//  (KEEP OUT!  Work in progress.)
//
//  This file is still under construction and subject to frequent change.

/////////////////////////////////////////////////////////////////////////////
//
// Imports
//
import CNF from '../validation/conjunctive-normal-form.js'
import { LogicConcept } from '../logic-concept.js'
import { Environment } from '../environment.js'

/////////////////////////////////////////////////////////////////////////////////
//
// CNFProp
//
// Represents the Propositional Form of any LC and the utilities to convert that
// to cnf form required by satSolve.  It is needed because the PropositionalForm
// class does not support LCs, only sequents.
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
    // propositional form with constants renamed by the body.  A copy of the
    // body is added afterwards, and treated like any other LC in the document.
    if ( L.isAProposition() ) { 
      // propositions accessible to the target (nonreflexive) are treated as
      // given when the target is present.
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
      // givens and claims accessible to the target other than itself, should be
      // negated.  Thus we don't pass the second argument to isAccessibleTo to
      // say it should be reflexive.
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
         // if we do, and there's more than one kid, wrap the kids w/ previous
         // op
         if ( newop!==env.op && env.kids.length>1 ) {
            env.kids = [ new CNFProp( env.op , ...env.kids ) ]
         }
         env.op = newop
         // if the new guy has the same op and is not negated, unshift its
         // children, otherwise just unshift the whole thing
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
  
  // convert a CNFProp to algebraic form the optional argument n tells it the
  // lower bound for switch variables
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
      if ( Number.isInteger(x) ) { return ((x<0)?'¬':'')+catalog[Math.abs(x)-1]
      // x must be a CNFProp
    } else { return x.toEnglish(catalog) } 
    } )
    let joint = (this.op === 'and') ? ' and ' : ' or '
    ans = ans.join(joint)
    return (this.negated) ? `¬(${ans})` : 
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
  
  // Lprop should be a simplified CNFProp. switchvar is an object containing the
  // value to use for the next switch var with key num, e.g. a typical use might
  // be
  //
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
  
  // Convert a numerical CNF to an algebraic form with switch vars after n
  // Don't really need this, but is good for debugging
  static cnf2Algebraic ( C , n ) {
    let ans = C.map( x => x.map( y => CNFProp.toVar(y,n)).join('') )
    return ans.join('+')
  }


}

////////////////////////////////////////////////////////////////////////////////
//
//  Extensions of LogicConcept Class
//
//  For convenience in Lode, we make some of the method of the CNFProp class
//  available as LC extensions.
//

// convert to cnf in satSolve format
LogicConcept.prototype.cnf = function (target=this) {
  let cat = this.catalog()
  let n = cat.length+1 
  let ans = CNFProp.fromLC(this,cat,target).simplify()
  return CNFProp.toCNF(ans,{num:n})
}

// Convert an LC to its algebraic propositional form.
// Modes are 'raw', 'simplify', or 'cnf'. The 'raw' mode just converts t he LC
// to algebraic form.  The 'simplify' mode distributes negations by DeMorgan.
// The 'cnf' mode expands all the way to cnf.
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
////////////////////////////////////////////////////////////////////////////////