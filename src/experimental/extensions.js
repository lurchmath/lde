////////////////////////////////////////////////////////////
//
//  LDE extensions
//
//  (KEEP OUT!  Work in progress.)
//
//  This file is still under construction and subject to frequent change.
//
//  In the current implementation of global n-compact validation we currently
//  use some specialized extensions of the LogicConcept class. We collect them
//  here for easy importing into the other experimental modules.

/////////////////////////////////////////////////////////////////////////////
//
// Imports
//
import { LogicConcept } from '../logic-concept.js'
import { Environment } from '../environment.js'
import { Symbol as LurchSymbol } from '../symbol.js'
import { Declaration } from '../declaration.js'
import { Application } from '../application.js'

///////////////////////////////////////////////////////////////////////////////
//
// Extensions of LogicConcept
//

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

// Efficiently check if an LC has a descendant satisfying some predicate it
// aborts the search as soon as it finds one.  This is analogous to the same
// method for js arrays.
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

// This utility is also useful for what we need to do here. Insert this LC as
// the previous sibling of LC target. You might have to make a copy of 'this' if
// it is already in the same tree as the target. We don't check that here.
LogicConcept.prototype.insertBefore = function( target ) { 
  target.parent().insertChild(this,target.indexInParent())
}

// rename a symbol (in place)
LurchSymbol.prototype.rename = function( newname ) { 
  this.setAttribute( 'symbol text' , newname )
}

// return the Proper Name for a Lurch symbol if it has one, otherwise just
// return the name of the symbol
LurchSymbol.prototype.properName = function () {
  return (this.hasAttribute('ProperName')) 
         ? this.getAttribute('ProperName') 
         : this.text() 
}

// Toggle the 'given' status of an lc (in place)
LogicConcept.prototype.negate = function () {
  if (this.isA('given')) { this.unmakeIntoA('given') 
  } else { this.makeIntoA('given') 
  }
}

// Synonym for 'negate'
LogicConcept.prototype.toggleGiven = LogicConcept.prototype.negate

/////////////////////////////////////////////////////////////////////
// LC type checking and fetching

// A Statement is any outermost Expression that is not a declaration or a 
// declared symbol inside a declaration. The body of a declaration can contain
// statements. 
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

// We say an LC is a Propositon iff it has a .prop form and is not an
// environment. This includes all Statements but also Let's, and ForSome's. It
// does not include the bodies inside ForSome declarations since each of those
// declarations will have atomic propositional forms and a separate copy of the
// body. It ignores anything flagged with .ignore for defining shortucts and
// other content that is supposed to be ignored, and ignores anything passed in
// the argument ignores. 
LogicConcept.prototype.isAProposition = function ( ignores = []) { 
  return ( this.isAStatement()   && 
          !this.ignore           &&
          !this.hasAncestorSatisfying( A => A instanceof Declaration)
         ) || 
         ( this.isADeclaration() && 
          !this.isA('Declare')   &&
          !ignores.includes(this)
         ) 
}

// Check if an LC is a Let-environment 
LogicConcept.prototype.isALetEnvironment = function () { 
  return (this instanceof Environment && this.child(0) instanceof Declaration)
}

// We say an LC expression is a Comment if it has the form `(--- "Comment string
// here.")`.  These are ignored when computing prop form, and are converted to
// actual comments when printing the LC to the Lode terminal.
LogicConcept.prototype.isAComment = function () { 
  return (this instanceof Expression && this.numChildren()===2 && 
          this.child(0) instanceof LurchSymbol && 
          this.child(0).text()==='---')
}

// Compute the array of all Statements in this LC
LogicConcept.prototype.statements = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isAStatement() )]
}

// Compute the array of all declarations in this LC If the optional argument
// onlywithbodies is true, only return declarations with bodies.
LogicConcept.prototype.declarations = function ( onlywithbodies ) {
  return [...this.descendantsSatisfyingIterator( x => 
             x instanceof Declaration && 
             !x.isA('Declare')  &&  (!onlywithbodies || x.body())
         )]
}

// Compute the array of all Declare's in this LC
LogicConcept.prototype.Declares = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isA('Declare') )]
}

// A Let is defined to be a given declaration that is not marked as a 'Declare'
// whether or not it has a body
LogicConcept.prototype.isALet = function ( ) {
  return (this instanceof Declaration && this.isA('given') && !this.isA('Declare'))
}

// Get the array of all of the Let ancestors of this LC Note: since everything
// is its own ancestor by default, the Let that is the first child of a Let
// environment is considered to be a letAncestor of the Let environment.
LogicConcept.prototype.letAncestors = function ( ) {
  return this.ancestorsSatisfying(x => 
    x instanceof Environment && 
    x.numChildren()>0 && 
    x.firstChild().isALet()).map(a=>a.firstChild())
}

// Get the array of all of the Let's in the scope of this Let.
Declaration.prototype.letsInScope = function ( ) {
  return this.scope().filter( x => x.isALet() )
}

// Compute the array of all Let's in this LC. If the argument is true, only
// return those with bodies.
LogicConcept.prototype.lets = function ( onlywithbodies ) {
  return [...this.descendantsSatisfyingIterator( x => 
     x instanceof Declaration && x.isA('given') && 
     !x.isA('Declare') &&  (!onlywithbodies || x.body())
  )]
}

// Compute the array of all Let's in this environment whose parent is an
// inference in this environment
Environment.prototype.letInferences = function ( inThis ) {
  return this.lets().filter( L => L.parent().hasOnlyClaimAncestors( inThis ) )
}

// Compute the array of arrays containing the user's various let scopes, labled by their  
Environment.prototype.scopes = function ( ) {
  return this.letInferences().map( y => y.letAncestors() )
}

// Determine the topmost ancestor of this LC.  This corresponds to the 
// Document containing the LC.
LogicConcept.prototype.root = function ( ) {
  return this.ancestorsSatisfying( x => !x.parent() )[0]
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
  return [...this.descendantsSatisfyingIterator( x => x.isA('Rule') || x.isA('Part'))]
}

// Compute the array of all propositions in this LC
LogicConcept.prototype.propositions = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isAProposition() )]
}

// Compute the array of all instantiations in the document that contain a
// proposition that has the same propositional form as a given proposition e
LogicConcept.prototype.mentions = function (e) {
  const eprop = e.prop()
  return [...this.descendantsSatisfyingIterator( x => {
    return (x.isA('Inst')) && x.propositions().some( p => p.prop() === eprop )
  })]
}

// We say an LC is an Inference of an environment L if it is either
//
//    (a) a conclusion of that environment or
//
//    (b) an environment whose ancestors are all claims, except possibly for L
//
// i.e., it extends the notion of a conclusion to include environments.  L is
// not considered to be a conclusion or inference of itself.

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

// convenience syntax. 
LogicConcept.prototype.inspect = function(x) { 
  console.log(util.inspect(x , depth = 1) , 
  { customInspect: false , showHidden: false , depth: depth , colors: true } ) 
}

LogicConcept.prototype.inspect = function(...args) { inspect(this,...args) }

///////////////////////////////////////////////////////////////////////////////
// isMinimal
//
// If the current document is valid, check if it is minimal in the sense that if
// you delete any conclusion it becomes invalid. Currently, for testing
// purposes, this resets the entire document and revalidates it from scratch. If
// you don't ignore the existing instantations, deleting a conclusion will have
// no effect on the outcome since after the instantiations are found the
// document will validate even if you delete one of the conclusions.  But it is
// inefficient to do this by deleting and recomputing all of the instantiations
// since that is where the bulk of the time is used in the algorithm.  So while
// it is good for testing purposed and gives the expected answer, it's very
// inefficient. 
//
// TODO: 
// * This routine doesn't work yet, so I'm commenting it out to finish later.
//   The basic idea should work, but there are some prerequisites for validation
//   that might need to be reset and recomputed rather than this naive attempt.
// * upgrade it to optionally not do a full reset, but rather cache which
//   instantiations were created by the conclusion being deleted
//
//
// LogicConcept.prototype.isMinimal = function() { if (!this.validate()) {
//   return false } let extraneous = [] this.reset() this.conclusions().forEach(
//   c => { this.reset() let saveignore = c.ignore c.ignore=true if (!saveignore
//   && this.validate() && this.validate(this,true)) extraneous.push(c) c.ignore
//   = saveignore 
//   })
//   this.validateall() return extraneous
// }

//////////////////////////////////////////////////////////////////////////
// Generic utiltiies

// Expression Diff
//
// Given two Application LC's which differ only at one node, return the address
// of that node (or undefined if no such node exists). This is useful in
// transitive chains for determining when a substitution occurs within a
// compound expression.  
//
// For example, in (x+1)+(x^2+x)=(x+1)+(x⋅x+x) we want to know that the LHS can
// be obtained from the RHS by substituting x^2=x⋅x. 
export const diff = (LHS,RHS) => {
  let ans=[]
  // a Symbol doesn't match an Application.
  if ( 
    ((LHS instanceof LurchSymbol) && (RHS instanceof Application)) ||
    ((LHS instanceof Application) && (RHS instanceof LurchSymbol)) 
  ) return [[]]
  // two Symbols match iff they are .equal
  if ((LHS instanceof LurchSymbol) && (RHS instanceof LurchSymbol))  
    return (LHS.equals(RHS))?undefined:[[]]
  // two Applications  
  if ((LHS instanceof Application) && (RHS instanceof Application)) {
    // they don't match if they don't have the same number of children
    if (LHS.numChildren()!==RHS.numChildren()) return [[]]
    // check the children one at a time
    const n = LHS.numChildren()
    for (let k=0 ; k<n ; k++) {
      let nodeans = diff(LHS.child(k),RHS.child(k))
      // if an array is returned, it should be an array of arrays containing the
      // relative address inside the node of the various discrepancies, so
      // unshift each of them with the index of this node, unless this is the
      // first node in which case just abort so that the answer points to the
      // entire Application
      if (Array.isArray(nodeans)) {
        if (k>0) nodeans.forEach(node=>node.unshift(k)) 
        else k=n
        ans.push(...nodeans)
      }
    }
    return (ans.length)?ans:undefined
  }
}

// useful abbreviations
export const lc = s => { 
  const L = LogicConcept.fromPutdown(s)
  return (L.length===1) ? L[0] : L 
}
export const mc = s => { 
  const M = MathConcept.fromSmackdown(s)
  return (M.length===1) ? M[0] : M  
}

// check a filename to see if it has the right extension and add the extension
// if it doesn't. The default extension is 'js'.
export const checkExtension = ( name , ext = 'js' ) => 
    ( !(new RegExp(`\\.${ext}$`).test(name)) ) ? name +'.' + ext : name 

// string formatting utilities used in more than one place
// Return a string of spaces of length n
export const tab = (n , char=' ') => { return Array.seq(()=>'',1,n+1).join(char) }

// indent string s with a tab of size n
export const indent = (s,n) => {
  const t = tab(n)
  return t+s.replaceAll(/\n(.)/g,'\n'+t+'$1')
}    

// unicode numerical subscripts
const subscriptDigits = '₀₁₂₃₄₅₆₇₈₉'
export const subscript = n => [...n.toString()].map(d => subscriptDigits[d]).join('')
