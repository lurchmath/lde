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

// rename a symbol in place
LurchSymbol.prototype.rename = function( newname ) { 
  this.setAttribute( 'symbol text' , newname )
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

// We say an LC is a Propositon iff it has a .prop form and is not an
// environment. This includes all Statements but also Let's, and ForSome's. It
// does not include the bodies inside ForSome declarations since each of those
// declarations will have atomic propositional forms and a separate copy of the body.
LogicConcept.prototype.isAProposition = function () { 
  return (this.isAStatement() && 
         !this.hasAncestorSatisfying( A => A instanceof Declaration)) || 
         (this.isADeclaration() && !this.isA('Declare'))  
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

// Compute the array of all Let's in this LC. If the argument is true, only
// return those with bodies.
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
  return [...this.descendantsSatisfyingIterator( x => x.isA('Rule') )]
}

// Compute the array of all propositions in this LC
LogicConcept.prototype.propositions = function () {
  return [...this.descendantsSatisfyingIterator( x => x.isAProposition() )]
}

// We say an LC is an Inference of an environment L if it is either
//
//    (a) a conclusion of that environment or
//
//    (b) an environment whose ancestors are all claims, except possibly for L
//
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

// convenience syntax. 
LogicConcept.prototype.inspect = function(x) { 
  console.log(util.inspect(x , depth = 1) , 
  { customInspect: false , showHidden: false , depth: depth , colors: true } ) 
}

LogicConcept.prototype.inspect = function(...args) { inspect(this,...args) }

//////////////////////////////////////////////////////////////////////////
// Generic utiltiies

// useful abbreviations
export const lc = s => { return LogicConcept.fromPutdown(s)[0] }
export const mc = s => { return MathConcept.fromSmackdown(s)[0] }

// check a filename to see if it has the right extension and add the extension
// if it doesn't. The default extension is 'js'.
export const checkExtension = ( name , ext = 'js' ) => 
    ( !(new RegExp(`\\.${ext}$`).test(name)) ) ? name +'.' + ext : name 