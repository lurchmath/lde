//////////////////////////////////////////////////////////////////////////////
//
//                       DOCUMENT CLASS and Utilties 
//                     for Global n-compact Validation 
//
//  (KEEP OUT!  Work in progress.)
//
//  This file is still under construction and subject to frequent change.
//
//  In the current implementation of global n-compact validation we currently
//  make many simplifying assumptions about the nature of a document.  But they
//  are hard to keep track of when just defined, but not codified.  So we make a
//  temporary document class here to codify those simplifying assumptions.
//
//  A 'library' for now is an environment of the form { :D₀⋅⋅⋅:Dm :F₀⋅⋅⋅:Fn }
//  where :D₀⋅⋅⋅:Dm are declarations with no body that declare all of the
//  constants (non-metavars), and :F₀⋅⋅⋅:Fn are environments which are not
//  Let-environments) representing the rules in that library. 
//
//  A 'document' is then obtained by adding a single claim environment U (the
//  user's content, aka `user's document)` as the last child of a library so a
//  document will have the form { :D₀⋅⋅⋅:Dm :F₀⋅⋅⋅:Fn U }
//
//  Since we don't have any other UI to input documents, all Lurch documents are
//  currently created from plain text content, in (extended) putDown notation
//  for now.  It is convenient to be able to load such files into Lode.  
//
//  We currently have two folders for test files: one for libraries and one for
//  user content (proofs and theorems).  We also have many convenient utilities
//  below for loading those strings from files given their filename.  Note that
//  all such text files end with the extension .lurch, which we tell VS Code to
//  syntax highlight as 'Go'.  This produces very nice syntax highlighting when
//  editing so that putdown comments starting with // get colored appropriately
//  and brackets color-match.
//
//
//                       Document level entities
//
//  We define Declares, Rules, Partials, Instantiations, Proofs, and BIHs to be
//  document-level concepts.
//
//  * Declare - declares constants (non-metavariables) in its scope. It is an LC
//              declaration and can be a given or a claim, but does not have a
//              body. Satisfies isA('Declare').
//
//  * Rule    - an axiom, definition, rule of inference, or theorem. It is an LC
//              formula. Satisfies isA('Rule').
//
//  * Partial - a partially instantiated Rule, where some metavariables have
//              been instantiated but other metavariables still remain.
//              Satisfies isA('Partial')
//
//  * Inst    - a fully instantiated Rule, where all metavariables have been
//              instantiated. Satisfies isA('Inst')
//
//  * Body    - a copy of the body of a ForSome declaration that is inserted
//              after the declaration. Satisfies isA('Body')
//
//  * Proof   - an environment in the user's document that is marked by them as
//              a proof. This can be used for counting the number of proofs in
//              the user's document and getting other statistics. Satisfies
//              isA('Proof')
//
//  * BIH     - an environment in the user's document that is marked by them as
//              a blatant instantiation hint. Satisfies isA('BIH')
//
//  * Comment - an expression of the form '(--- commentString )' where
//              commentString is a string to be printed as a comment. Satisfies
//              isA('Comment')

//////////////////////////////////////////////////////////////////////////////
//
// Imports
//
import fs from 'fs'
import { LogicConcept } from '../logic-concept.js'
import { Environment } from '../environment.js'
import { Symbol as LurchSymbol } from '../symbol.js'
import { lc , checkExtension } from '../experimental/extensions.js'
import { Validation } from '../index.js'

//////////////////////////////////////////////////////////////////////////////
//
// Utilities
//
// While the following are needed by the Document class, they can be useful
// outside of the class as well, so we export them here.  The basic decision
// regarding when a utility belongs in this module and when it belongs in the
// global validation lab module is roughly made as follows.  If a utility
// computes or caches or processes some aspect of a document that is independent
// of validation, it is included here.  If it is validation tool-specific, then
// it is not included here.

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

//////////////////////////////////////////////////////////////////////////////
// Rename bound variables for alpha equivalence
//
// We also need alpha equivalent statements to have the same propositional form.
// This assigns canonical names x₀ , x₁ , etc. as the ProperName attribute of
// bound variables, and that is what .prop uses to make the propositional form.
export const renameBindings = ( expr , symb='x' ) => {
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

//////////////////////////////////////////////////////////////////////////////
// Replace bound variables in formulas
//
// Matching checks if a match would violate variable capture, but
// Formula.instantiate does not.  So we need to turn all bound variables in
// formulas to a canonical form e.g. y₀, y₁, ... that cannot be entered by the
// user. Applying this to formulas before instantiating fixes that.  
//
// TODO: 
// * When making this permanent, just upgrade Formula.instantiate to respect
//   ProperNames so we can delete this routine and just use the previous one
//   instead. 
// * Also enforce the requirement that user's can't enter any of y₀, y₁, ... .
// * We might want to keep the user's original bound formula variable names
//   somewhere for feedback purposes, but the canonical ones aren't that bad for
//   now.
export const replaceBindings = ( expr , symb='y' ) => {
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

//////////////////////////////////////////////////////////////////////////////
// Mark Declared Symbols
//
// Mark explicitly declared symbols s, throughout an LC by setting
// s.constant=true
export const markDeclaredSymbols = doc => {
  const metavariable = 'LDE MV'
  // fetch all of the declarations
  let declarations = doc.descendantsSatisfying( x => x instanceof Declaration )
  // fetch all of the symbols
  let symbols = doc.descendantsSatisfying( x => x instanceof LurchSymbol )
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

//////////////////////////////////////////////////////////////////////////////
// Process Let Environments
//
// Get the Lets.  If they don't start an environment, wrap them to make a valid
// Let-environment. We make this restriction, so that a Let-env is a type of LC
// that can be used as a rule premise and can only be satisfied by another
// Let-env.  We don't upgrade that to a subclass for now.
// TODO: consider upgrading let-envs to a subclass of environment
export const processLets = ( doc ) => {
  // Get all of the Let's whether or not they have bodies and make sure they are
  // the first child of their enclosing environment.  If not, wrap their scope
  // in an environment so that they are.
  doc.lets().forEach( decl => {
    const i = decl.indexInParent()
    const parent = decl.parent()
    if (i) parent.insertChild( new Environment(...parent.children().slice(i)) , i )
  })
}

//////////////////////////////////////////////////////////////////////////////
// Process Declaration Bodies
//
// Append the bodies of all ForSomes.
export const processForSomeBodies = doc => {
  // get the ForSomes with a body (hence the 'true') that don't contain 
  // metavariables
  const forSomes = doc.forSomes(true).filter( dec =>
     Formula.domain(dec).size===0)

  // TODO: delete this if not needed.   
  // get the lets with a body (hence the 'true') that don't contain 
  // metavariables
  const lets = doc.lets(true).filter( dec =>
    Formula.domain(dec).size===0)
  // push the lets onto the forSomes array
  forSomes.push(...lets) 

  // insert a copy of the body after the declaration and mark where it came from
  // with the js attribute .bodyof, unless it's already there
  forSomes.forEach( decl => {
    if (!(decl.nextSibling() && decl.nextSibling().bodyof &&
          decl.nextSibling().bodyof === decl )) {      
      let decbody = decl.body().copy()
      if (decl.isA('given')) decbody.makeIntoA('given')
      decbody.insertAfter(decl)
      decbody.bodyof = decl
      decbody.makeIntoA('Body')
    }
  })
}  

//////////////////////////////////////////////////////////////////////////////
// Assign Proper Names
//
// Rename any symbol declared by a declartion with body by appending the putdown
// form of their body. Rename any symbol in the scope of a Let-without body by
// appending a tick mark.
//
// For bodies that have a binding we want to use the alpha-equivalent canonical
// form.
export const assignProperNames = doc => {
  
  const metavariable = "LDE MV"
  
  // get the declarations with a body (hence the 'true') which is an expression
  // TODO: we don't support environments as bodies yet.  Decide or upgrade.
  let declarations = doc.declarations(true).filter( x => 
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

  // if it is an instantiation it is possible that some of the declarations
  // without bodies have been instantiated with ProperNames already (from the
  // user's expressions) that are not the correct ProperNames for the
  // instantiation, so we fix them.  
  // TODO: merge this with the code immediately above.
  declarations = doc.declarations().filter( x => x.body()===undefined )
  declarations.forEach( decl => {
    decl.symbols().filter(s=>!s.isA(metavariable)).forEach( c => {
      // Compute the new ProperName
      c.setAttribute('ProperName', c.text())
      // apply it to all c's in it's scope
      decl.scope().filter( x => x instanceof LurchSymbol && x.text()===c.text())
        .forEach(s => s.setAttribute('ProperName',c.getAttribute('ProperName')))
    })
  })

  // Now add tick marks for all symbols declared with Let's.
  doc.lets().forEach( decl => {
    decl.symbols().filter(s=>!s.isA(metavariable)).forEach( c => {
      // Compute the new ProperName
      let cname = c.properName()
      if (!cname.endsWith("'")) c.setAttribute( 'ProperName' , cname + "'" )
      c.declaredBy = decl
      // apply it to all c's in it's scope
      decl.scope().filter( x => x instanceof LurchSymbol && x.text()===c.text())
        .forEach( s => {
          s.declaredBy = decl
          s.setAttribute('ProperName',c.getAttribute('ProperName'))
      })
    })
  })

}

//////////////////////////////////////////////////////////////////////////////
// Load Parser
//
// Load a peggy parser from the parser folder, convert it to a parser, and 
// customize it's error formatting in Lode, and return it the parser.
export const loadParser = (name) => {
  const parserstr = Document.loadParserStr(name)
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
           grammarSource:Document.parserPath+name,
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
//
//  Private Methods (for the Document class)
//

//////////////////////////////////////////////////////////////////////////////
// Load Libraries
//
// In desktop Lurch we have the idea of 'dependencies' which can be loaded on
// top of other dependencies in order to expand the rule set from, e.g. Prop
// Logic to Predicate Logic to Set Theory, etc.  We imitate that here by loading
// and merging libraries, and preparing them for use.
//
// TODO: 
//   * allow a .lurch library string file to contain an array of strings, and
//     when such a thing is loaded, treat it as if it were the libs argument.
//     This allows us to have libraries that load other libraries as prerequisites.
const loadLibs = (...libs) => {
  // the reserved constants are declared at the top of every document, 
  // even if no library is specified
  const system = lc(`:[ 'LDE EFA' '---' ]`).asA('Declare')

  // create a temporary empty environment to hold the final answer
  let ans = new Environment()

  // if no library is specified just return the system declaration
  if ( libs.length === 0 ) return [ system ]

  // for each library specified on the argument list, load it if necessary and
  // add it to the answer environment
  libs.forEach( original => {
    // create a place to store it
    let lib
    // if it's already an environment, just make a copy
    if (original instanceof Environment) { 
      lib = original.copy() 
    // otherwise it must be a string containing a filename, so load it  
    } else {
      const libstr = Document.loadLibStr(original)
      // if the file is not found it will print a message and return undefined,
      // so just return 
      if (!libstr) return
      // it succeeded so convert it to an LC
      lib = lc(libstr)
    }

    // Process any shorthands, like ≡.
    // TODO: Replace with Peggy Parser
    processShorthands(lib)

    // Now that we have this lib, add its kids to the answer environment,
    // with Declares at the top and Rules after that.
    lib.children().forEach( kid => {
      // put the declarations at the top so the constant syntax highlighting
      // works for instantiations.  The order we do it doesn't matter.
      if (kid instanceof Declaration) { 
        ans.unshiftChild(kid) 
      } else {
        ans.pushChild(kid)
      }
    })
  })

  // Finally, declare the reserved constants at the top
  ans.unshiftChild( system )
  
  // Now we have the entire merged library, with all of the declarations on
  // top. Time to polish it.

  // Check and mark the Declares
  const Decs = ans.children().filter(kid => kid instanceof Declaration)
  Decs.forEach( dec => { 
    if (dec.body()) throw new Error('Library declarations cannot have a body.')
    dec.makeIntoA('Declare') 
  } )
  
  // make copies of ForSome bodies after the ForSome.  
  //
  // TODO: is this the efficient way to do this?
  //   * idea: maybe make decs with body be treated as a shortHand that gets
  //     converted to a dec-without-body plus a copy of the body?
  //   * Is this being called at the right time?  Don't we have to mark the
  //     the Rules and convert them to formulas first before running this?
  //     Check this.
  processForSomeBodies(ans)

  // Check and mark the Rules and make them into formulas
  const Rules = ans.children().filter(kid => !(kid instanceof Declaration))
  Rules.forEach( f => { 
    // check if f is not an Environment or is a Let-environment and throw
    // an error
    if (!f instanceof Environment || f.isALetEnvironment() )
      throw new Error('A rule must be an environment that is not a Let-environment.')
    // it's not, so mark it as a Rule, and convert it into a formula
    f.makeIntoA('Rule')
    // the second arg specifies it should be done in place
    Formula.from(f,true)
    // if it has metavariables, ignore it as a proposition
    if (Formula.domain(f).size>0) f.ignore = true
    // replace all bound variables with y₀, y₁, ... etc and rename them to
    // ProperNames x₀, x₁, ... etc to make them canonical
    f.statements().forEach( expr => { 
      replaceBindings( expr , 'y' )
      renameBindings( expr )
    } )
  } )

  // We return the array of children, as the use case will be to insert these
  // into the Document environment. 
  return ans.children()
}

//////////////////////////////////////////////////////////////////////////////
// Load User Doc
//
// The user's content is stored in an Environment as the last child of the
// Document. A typical user's document will contain one or more theorems,
// definitions, and proofs.
const loadDocs = (...docs) => {
  // create an empty environment to wrap the final answer
  let ans = new Environment()

  // for each doc specified on the argument list, load it if necessary and
  // add it to the answer environment
  docs.forEach( original => {
    // if it's already an LC, just make a copy
    if ( original instanceof LogicConcept ) { 
      ans.pushChild(original.copy()) 
    // otherwise it must be a string containing a filename, so load it  
    } else {
      const docstr = Document.loadProofStr(original)
      // if the file is not found it will print a message and return undefined,
      // so just return 
      if (!docstr) return
      // it succeeded so convert it to an LC. There might be a list of them
      // depending on what is in the source file.
      const doclist = LogicConcept.fromPutdown(docstr)
      // push each of them onto our answer environment
      doclist.forEach( x => ans.pushChild(x) )
    }  
  })

  // Now we have the entire merged document. Time to polish it.
  
  // process all of the shortHands like ≡, <<, <thm, ✔︎, and ✗
  // TODO: replace with peggy parsing
  processShorthands(ans)
  
  // process Let's to ensure they are Let-environments
  processLets(ans)

  // make copies of ForSome bodies after the ForSome
  processForSomeBodies(ans)

  // make all bindings canonical by assigning ProperNames x₀, x₁, ...
  ans.statements().forEach( expr => renameBindings( expr ))
  
  return ans
}

//////////////////////////////////////////////////////////////////////////////
//
//  Document class
//
//////////////////////////////////////////////////////////////////////////////

export class Document extends Environment {
  
  constructor ( docs , libs ) {
    // * docs must be a single string, array of strings, or a single LC.
    // * libs is the same thing for libraries, but may be omitted.
    
    // make an empty environment for 'this' instance
    super()

    // convert the args arrays, if needed
    if (!(docs instanceof Array)) docs = [ docs ]
    // libs is optional
    if ( libs === undefined ) libs = [] 
    if (!(libs instanceof Array)) libs = [ libs ]

    // get the array of children of the merged libs and push it onto this
    // Document
    loadLibs(...libs).forEach( x => this.pushChild(x) )

    // load the merged docs and push the resulting environment onto the end
    // of this Document
    this.pushChild( loadDocs(...docs) )
        
    // assign the Proper Names for symbols declared by a ForSome with body or a
    // Let
    assignProperNames(this)
  
    // now that the doc is in the scope of the library, mark all of the declared
    // symbols
    markDeclaredSymbols( this )

    // process the user's theorems. This has to be done after prepending the
    // library so the user's theorems are in the scope of declared constants in
    // the library, which then prevents them from being metavariables 
    //
    // TODO:
    //   * these are being processed after we've already inserted ForSome bodies
    //     for ForSomes not containing metavars.  But that means every ForSome
    //     body will be copied.  Check if this should be run before copying
    //     the ForSome bodies or if it's ok as is.
    ;[ ...this.lastChild().descendantsSatisfyingIterator( x => x.userThm ) ].forEach( 
      thm => {
      // make a copy of the thm after the theorem
      let formula = thm.copy()
      formula.insertAfter(thm)
      // mark it for easy identification later
      formula.userRule = true
      formula.makeIntoA('Rule')
      // convert it to a formula
      Formula.from(formula,true)
    })

  }

  // If we want to revalidate a document from scratch after it has been
  // validated, we can reset the document. To do that we remove all partial
  // instantiations and instantiations, unmark the Rules as .finished, and
  // remove all validation results stored in inferences. This does not reset
  // things like constant declarations.
  //
  // TODO: 
  // * this isn't quite right, so I'm commenting it out to finish later. I
  //   basically need to go through the entire validation algorithm used by
  //   load() and make sure everything that needs to be reset and recomputed is done.
  //
  // reset () { this.getAll('Rule').forEach(x=>x.finished=false)
  //   this.getAll('Part').forEach(x=>x.remove())
  //   this.getAll('Inst').forEach(x=>x.remove())
  //   this.inferences().forEach(x=>Validation.clearResult(x))
  //   Validation.clearResult(this)
  // }

  // Since there's no way to separate just the library as an LC from the document,
  // we instead return the array of library children
  library () { return this.children().slice(0,-1) }

  // The User Content is the last child of the document, and must be an Environment
  // This returns an LC, not an array like library() does.
  userdoc () { return this.lastChild() }

  ////////////////////////////////////////////////////////////////////////////////////
  
  // Convenience utility to fetch the array of all of the things above
  // satisfying isA(thing). If the second argument is present, it can be either
  // 'library' or 'userdoc' to specify which part of the document to collect
  // them from.  The default is to search the entire document (and will do that
  // if 'inside' is anything other than 'library' or 'userdoc' as well).
  getAll( thing , inside ) {
    // none of them can be nested, so we use the speedy iterator
    if ( inside === 'userdoc' ) {
      return [ ...this.lastChild().descendantsSatisfyingIterator( 
               x => x.isA(thing) ) ]
    }
    const exclude = (inside==='library') ? z => z===this.lastChild() : () => false
    return [ ...this.descendantsSatisfyingIterator( x => x.isA(thing) , exclude ) ]
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  //  File handling utilities
  //

  // the path to library definition files
  static libPath = './libs/'
  
  // the path to proof definition files
  static proofPath = './proofs/'
  
  // the path to parser definition files
  static parserPath = './parsers/'
  
  // the file extension used by default for libraries and proof files. Don't
  // include the . here for easy use in RegExp's
  static LurchFileExtension = 'lurch'  
  
  // the file extension used by default for libraries and proof files
  static ParserFileExtension = 'peggy' 
  
  // the file extension used for libraries and proof files for parsing with the
  // toy peggy parser
  static PegFileExtension = 'peg' 
  
  // check a file name to see if it has the .lurch extension and if not, add it
  static checkLurchExtension = name => checkExtension(name , Document.LurchFileExtension )
  
  // Load just the string for a library and return that.  You can omit the .js 
  // extension.
  static loadLibStr = (name) => {
    const filename = Document.libPath + Document.checkLurchExtension(name)
    if (!fs.existsSync(filename)) {
      console.log(`No such file or folder: ${name}`)
      return
    }
    return fs.readFileSync( filename , { encoding:'utf8'} )
  }
  
  // Load just the string for a proof document and return that.    
  static loadProofStr = (name,extension) => {
    const filename = Document.proofPath + Document.checkLurchExtension(name)
    if (!fs.existsSync(filename)) {
      console.log(`No such file or folder: ${name}`)
      return
    }
    return fs.readFileSync( filename , { encoding:'utf8'} )
  }
  
  // Load just the string for a parser grammar and return that.
  static loadParserStr = (name) => {
    const filename = Document.parserPath + 
      checkExtension(name, Document.ParserFileExtension)
    if (!fs.existsSync(filename)) {
      console.log(`No such file or folder: ${name}`)
      return
    }
    return fs.readFileSync( filename , { encoding:'utf8'} )
  }

  // Load just the string for a proof in toy format and return that
  static loadPegStr = (name) => {
    const filename = Document.proofPath + 
      checkExtension(name, Document.PegFileExtension)
    if (!fs.existsSync(filename)) {
      console.log(`No such file or folder: ${name}`)
      return
    }
    return fs.readFileSync( filename , { encoding:'utf8'} )
  }
  
  /////////////////////////////////////////////////////////////////////////////

}
// end Document class
///////////////////////////////////////////////////////////////////////////////