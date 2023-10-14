////////////////////////////////////////////////////////////
//
//  CNFProp (for Global n-compact Validation)
//
//  (KEEP OUT!  Work in progress.)
//
//  This file is still under construction and subject to change.

/////////////////////////////////////////////////////////////////////////////
//
// Imports
//
import CNF from '../validation/conjunctive-normal-form.js'
import { LogicConcept } from '../logic-concept.js'
import { Environment } from '../environment.js'
import { Symbol as LurchSymbol } from '../symbol.js'
import { Expression } from '../expression.js'
import { Declaration } from '../declaration.js'
import Extensions from './extensions.js'
const { tab, indent, subscript } = Extensions

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
  static fromLC ( L , catalog = L.cat, target = L , checkPreemies = false) {
        
    catalog = catalog || L.catalog()

    // TODO: for now, simply use two separate routines for checkPreemies vs not, and
    //       optionally merge them later
    if (checkPreemies) {
      // Lets to ignore for this target
      const ignores = target.letAncestors()
      
      // Propositions have atomic prop form. ForSome declarations have an atomic
      // propositional form with constants renamed by the body.  A copy of the
      // body is added afterwards, and treated like any other LC in the
      // document. Note that .isAProposition ignores anything that is marked
      // .ignore or in the array ignores.
      if ( L.isAProposition( ignores ) ) { 

        // propositions accessible to the target (nonreflexive) are treated as
        // given when the target is present.
        let sign = (L.isA('given') || L.isAccessibleTo(target)) ? -1 : 1
        return sign*L.lookup( catalog , ignores )  

      // if it's an environment process the relevant children, skipping over
      // anything irrelevant to the target and Declare's which have no prop form.
      } else if (L instanceof Environment) {
        let kids = L.children()
        // remove trailing givens and anything irrelevantTo the target
        while ( kids.length>0 && 
                ( kids.last().isA('given') || 
                  kids.last().irrelevantTo( target )
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
           // skip it if it's a Comment or anything with .ignore.  This eliminates
           // entire subenvironments and everything inside them because of this
           // recursion is top-down.
           if (A.ignore) continue
           // since we are doing the preemie check, skip all of the Lets on the
           // ignores list
           if (ignores.includes(A)) continue
           // otherwise get it's prop form  
           let Aprop = CNFProp.fromLC(A,catalog,target,checkPreemies)
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

    // check propositionally
    } else {

      // Propositions have atomic prop form. ForSome declarations have an atomic
      // propositional form with constants renamed by the body.  A copy of the
      // body is added afterwards, and treated like any other LC in the document.
      // Note that .isAProposition ignores anything that is marked .ignore.
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
        while ( kids.length > 0 && 
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
           // skip it if it's a Comment or anything with .ignore.  This eliminates
           // entire subenvironments and everything inside them because of this
           // recursion is top-down.
           if (A.ignore) continue
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
  }
    
  // convert an integer x to a variable.  If the optional argument n is present
  // return a switch variable if |x|>n
  static toVar ( x , n = Infinity ) {
    const A = 'A'.charCodeAt(0)
    let prefix = (x<0) ? ':' : ''
    x = Math.abs(x)
    let name = (n<x)  ? `𝒵${subscript(x-n)}` :
               (x<27) ? String.fromCharCode(x+A-1) :
               (x<53) ? String.fromCharCode(x+A+5) : `𝒳${subscript(x)}` 
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
  
  // convert this CNFProp to a legible human readable form using the supplied catalog
  toNice (catalog, level = 0) {
    // get the array of nice kids, indented by level+1
    let ans = this.kids.map( x => {
      // lookup nonzero integers in the catalog
      if ( Number.isInteger(x) ) { // +`${Math.abs(x)}`
        return indent(((x<0)?':':'')+catalog[Math.abs(x)-1],(level+1)*2) 
      // x must be a CNFProp
      } else { return x.toNice(catalog, level+1) } 
    } )
    // join them with newlines
    ans = ans.join('\n')
    // wrap the whole thing appropriately
    // say(`This is negated? ${this.negated}`)
    return (this.negated) ? tab(level*2)+`:{\n${ans}}` :  
           (this.op==='and') ? tab(level*2)+`{\n${ans}}` : tab(level*2)+`{\n${ans}}`  
  }
  
  // the variable name when showing switch variables in Algebraic form 
  static get switchVarSymbol () { return '𝒵'}  // 𝒵 = \u{1D4B5} unicode

  // check if this is already in cnf form
  hasCNFform () {
    return !this.negated && 
      this.op === 'and' && 
      this.kids.every( x => {
        return (x instanceof this.constructor) && 
                x.kids.every(   Number.isInteger ) && 
               (x.op === 'or')
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

// end CNFProp class
}

////////////////////////////////////////////////////////////////////////////////
//
//  Extensions of LogicConcept Class
//
//  For convenience in Lode, we make some of the method of the CNFProp class
//  available as LC extensions.
//
////////////////////////////////////////////////////////////////////////////////
// Extensions of the LogicConcept class

// Compute the Prop Form string for an expression.  This is the .putdown form
// except that we must use the ProperName for symbols instead of their text. For
// bound symbols, this is their canonical name so alpha equivalent expressions
// have the same propositional form.  For symbols declared with a body this is
// the renaming that accounts for the body. Note that the Prop form does not
// include the leading : for givens. 
//
// We cache the results in a .propform js attribute and return them if present.
//
// In order to check for preemies we need a different propositional form in some
// cases. The optional argument 'ignore' is an array of Let's such that if a
// symbol in the expression is defined by one of the Let's on the list, we use
// it's text name instead of its ProperName (i.e., no ticks).  These are not
// cached in the .propform attribute (when ignore is nonempty).
Expression.prototype.prop = function ( ignore = [] ) {
  // determine exactly when to use the proper name
  return this.toPutdown((L,S,A) => {
    let ans =
      // if this is not a Symbol, or
      ( !(L instanceof LurchSymbol) ||
        // it is a Symbol, and
        ( L instanceof LurchSymbol &&   
            // either declared by one of the ignored lets, or
          ( (L.declaredBy && ignore.includes(L.declaredBy)) ||
              // undeclared (e.g. in an instantiation or binding) and 
            ( !(L.declaredBy) && 
              // has the same propername as something declared by one of the
              // ignored lets
              ignore.some( x => x.symbols().some( x => 
                x.properName()===L.properName()) 
              ) 
            )
          )
        )
      ) 
      // use it's original name
      ? S
      // otherwise use it's properName
      : L.properName()
    return ans.replace( /^[:]/, '' )
  })
}

// Compute the Prop Form string for a Let or ForSome Declaration. We will format
// both as [s1 ... sn] where s_i is the properName of the ith symbol it
// declares, whether or not it has a body, since if it is a ForSome with a body
// processForSomes will put a copy of the body after the declaration, which then
// will get its own propositional form. A Let should not have a body for not, so
// this is already its prop form.  Declare's don't have a prop form.
//
// Note that the Prop form does not include the leading : for givens.
//
// Compute the Preemie Prop Form string for a Let or ForSome Declaration. This
// is the same as the ordinary prop form, but is ignored if it is contained on
// the ignore argument list (of Lets to ignore).
Declaration.prototype.prop = function ( ignore = [] ) {
  return this.isA('Declare') || ignore.includes(this)
         ? '' 
         : '['+this.symbols().map(s=>s.properName()).join(' ')+']'
}

// compute all of the propositional forms of this expression (both standard and
// preemie) and return them as a Set.  This is not defined for environments.
Expression.prototype.allProps = function ( ) {
  // if its the user's proposition, use it's own scopes
  if (this.parent().hasOnlyClaimAncestors()) {
    // get the lets it is in the scope of
    const mylets = this.letAncestors()
    // it is possible that any sub-scope might be being tested, so we need
    // to add all of the possible forms
    let ans = new Set(mylets.map( (x,k) => this.prop(mylets.slice(k))))
    ans.add(this.prop())
    return ans
  // but if it is in an instantiation and has any undeclared tick marks, check
  // it against every possible scope 
  //
  // TODO: is it more efficient to eliminate any scopes not involving any of the
  // tick-marked symbols in this expression, or would that take more time than
  // simply checking against all of the scopes?
  } else if (this.some( x => 
    x instanceof LurchSymbol && 
    x.properName().endsWith("'") &&
    !x.constant
  ) ) {
    // get the cached value of all of the let-scopes
    const scopes = this.root().letScopes
    // add the propform for this for each of the let-scopes
    let ans = new Set([ this.prop() ])
    // check every scope to see if it gives this a new prop form
    scopes.forEach( s => ans = ans.add(this.prop(s)) )
    return ans
  }
  return new Set([this.prop()])
}

// Declarations can only have one prop form, but we need it to be consistent
// with the previous routine.
Declaration.prototype.allProps = function ( ) {
  return new Set([this.prop()])
}

// Compute the catalog for this LC environment.
Environment.prototype.catalog = function ( ) {
  // store them in here
  let catalog = new Set()
  // some propositions might contain tickmarked symbols that are not in the
  // scope of any declaration of that symbol. To minimize the number of prop
  // forms for such a proposition, we need to know all of the let-scopes in the
  // document.  Ignore everything containing a metavariable.
  this.propositions()
      .filter( P => !P.some( x => x.isA('LDE MV') ) )
      .map( s => s.allProps() )
      .forEach( x => catalog = catalog.union( x ) )
  return [ ...catalog ] 
}

// look up this expression's numerical prop form in the catalog
Expression.prototype.lookup = function ( catalog , ignores = []) {
  return catalog.indexOf(this.prop(ignores)) + 1
}

// look up this declaration's numerical prop form in the catalog
Declaration.prototype.lookup = function ( catalog, ignores = []) {
  return catalog.indexOf(this.prop(ignores)) + 1
}

// convert to cnf in satSolve format
Environment.prototype.cnf = function ( target=this , checkPreemies = false ) {
  // get the catalog.. this assumes this environment is a document and it has
  // been cached
  let cat = this.cat || this.catalog()
  // number the switch vars starting at one more than the catalog length
  let n = cat.length+2 
  // make the CNFProp from this LC, either with or without the preemie check
  let ans = CNFProp.fromLC( this , cat , target , checkPreemies ).simplify()
  // convert the resulting CNFProp to a cnf that can be passed to CNF.isSatisfiable
  return CNFProp.toCNF(ans,{num:n})
}

// Convert an LC to its algebraic propositional form.
// Modes are 'raw', 'simplify', or 'cnf'. The 'raw' mode just converts t he LC
// to algebraic form.  The 'simplify' mode distributes negations by DeMorgan.
// The 'cnf' mode expands all the way to cnf.
LogicConcept.prototype.toAlgebraic = function ( 
  mode = 'raw' , target=this , checkPreemies = false
) { 
  let cat = this.catalog()
  let raw = CNFProp.fromLC(this,cat,target,checkPreemies)
  if (mode==='raw') { return raw.toAlgebraic() }
  let simp = raw.simplify()
  if (mode==='simplify') { return simp.toAlgebraic() }
  // otherwise mode must be 'cnf' 
  let n = cat.length
  return CNFProp.cnf2Algebraic( CNFProp.toCNF(simp,{num:n}) , n )
}

// Useful for seeing the raw prop form of small LCs
LogicConcept.prototype.toEnglish = function ( target = this, checkPreemies = false ) { 
  let cat = this.catalog()
  return CNFProp.fromLC(this,cat,target,checkPreemies).toEnglish(cat)
}

// Even more useful for seeing the raw prop form of small LCs
LogicConcept.prototype.toNice = function ( target = this, checkPreemies = false ) { 
  let cat = this.catalog()
  return say(stringPen(CNFProp.fromLC(this,cat,target,checkPreemies).toNice(cat)))
}
////////////////////////////////////////////////////////////////////////////////