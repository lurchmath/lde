///////////////////////////////////////////////////////////////////////////
// Math 299 Lurch Peggy Grammar and Parser
//
// A peggy grammar definition file to generate a parser for converting
// AsciiMath expression to an LC.
//
// For now we encode negative numbers as compound expressions e.g. -3 is
// encoded as (- 3). We also encode rational fractions as a product of the
// numerator times the multiplicative inverse of the denominator where / is the
// unary inverse operator, e.g. 2/3 parses as (⋅ 2 (/ 3)).  This is consistent
// with the way negation is handled.  We do not allow expresions like '/2' to
// represent one half. We do not have an Integer or Rational constant type for
// this reason.
//
// To make the parser more robust, all symbols can only consist of upper and 
// lower case letters A-Z and a-z and digits 0-9, but cannot start with a digit.
//
// To save the resulting parser to a standalone .js file use:
//   peggy --cache --format es -o outfilename.js infilename.peggy
//

{{

  /////////////////////////////////////////////////////////////////
  // Peggy-specific utilities
  
  // It is essential to understand how peggy parses a rule into strings and
  // nested so that these can be processed appropriately.  We list here some
  // notes for quick reference.  Let A, B, C ... denote rule names and 
  // A',B',.. the result of parsing those.
  // 
  // Rule Form                 Returns
  // A                         A'
  // (A)                       A'
  // A B C                     [ A' , B' , C']
  // (A B C)                   [ A', B' , C' ]
  // (A B) C                   [ [A',B'] , C' ]
  // A (B C)                   [ A' , [B',C'] ]
  // A* or A+                  [A',A',...]
  // A|m..n,separator|         [A',A',...]
  // !anything or &anything    undefined
  // A?                        null or A' 
  
  // Since we are returning a string with this parser, no matter how nested and
  // convoluted an array might be, we always want to ignore undefined and empty
  // arrays that peggy creates when interpreting the rule.  Here we remove both
  // undefined terms and empty arrays that appear in array A.
  const clean = A => { 
    return A.filter(x=>x!==undefined && !(Array.isArray(x) && x.length===0))
             .map( c => { return (Array.isArray(c)) ? clean(c) : c } )
  }
  // take an array of tex'ed expressions a, and make a comma separated sequence
  // of them that is grammatically correct.  If a has one element x, just return
  // x. If it has two elements, x and y, just return `x and y`.  If it has
  // elements x1, x2, ..., xn for n>2 return `x1, x2, ..., x_{n-1}, and x_n`.
  const sequence = s => {
    const a = s.map(texsymbol)  
    if (a.length>2) {
      return a.slice(0,-1).join('\\text{, }')+'\\text{, and }'+a[a.length-1]
    } else if (a.length === 2) {
      return `${a[0]}\\text{ and }${a[1]}`
    } else {
      return a[0]
    }
  }

  // cleaner notation for latex plain text
  const txt = a => `\\text{${a} }`

  // tex utilities
  const texUnary = (op,arg) => {
    return (op) ? `${op}${arg}` : arg
  }
  
  // join a tex sequence with an operator
  const texJoin = (op,args) => {
    if (args.length===1) return args.join(op)
    return args.join(` ${op} `)
  }

  // apply a right associative binary operator chain 
  const texRightAssoc = (op,args) => {
    return args.reverse().slice(1).reduce(
      (ans,x)=>{ return `${x}${op}{${ans}}`},args[0])
  }

  // convert signed sums to tex
  const texSum = (first,rest) => {
    let ans = `${first}`
    rest.forEach( term => {
      ans = ans + ( (term[1]==='-') ? `-${term[3]}` : `+${term[3]}` )
    })
    return ans
  }

  // remove tex parentheses from a string
  const nopar = s => {
    return s.replace(/^\\left\((.*)\\right\)$/,'$1')
  }

  // convert products (which include / operators) to tex
  const texProduct = term => {
    // latest is the most recent processed factor in the product
    // it will either be concatenated to ans, or put in the numerator
    // of a \frac, depending on whether the next factor is a reciprocal
    let latest = term.shift()
    let ans = ''
    while (term.length>0) {
      // get the next factor
      let next = term.shift()
      // if it starts with / put the latest in the numerator
      // and next in the denominaator
      if (next.startsWith('/')) {
        latest = 
        `\\frac{${nopar(latest)}}{${nopar(next.substring(1))}}`
      // otherwise the next term is not a reciprocal, so append and update latest  
      } else {
        // in more elementary courses we might want to use the following to 
        // have concatenation for products, e.g. in polynomials, but for 
        // Math 299 it is not useful for things like n⋅0 in the Peano Axioms 
        //
        // ans += (ans.length>0 && /\d$/.test(ans) && /^\d/.test(latest)) 
        //        ? `\\cdot ${latest}` 
        //        : latest
        ans += (ans.length>0) ? `\\cdot ${latest}` : latest
        latest = next
      }
    }
    // no more factors, so just cat the latest
    ans += (ans.length>0) ? `\\cdot ${latest}` : latest
    return ans
  }
  // instead of making a separate paring class for each symbol we want 
  // to convert to tex, we just remap them here
  const texsymbol = s => {
    const tex = {
      sigma   : '\\sigma'   , 'σ'      : '\\sigma'     , alpha      : '\\alpha'      ,
      nu      : '\\nu'      , beta     : '\\beta'      , xi         : '\\xi'         ,
      Xi      : '\\Xi'      , gamma    : '\\gamma'     , Gamma      : '\\Gamma'      ,
      delta   : '\\delta'   , Delta    : '\\Delta'     , pi         : '\\pi'         ,
      Pi      : '\\Pi'      , epsilon  : '\\epsilon'   , varepsilon : '\\varepsilon' ,
      rho     : '\\rho'     , varrho   : '\\varrho'    , zeta       : '\\zeta'       ,
      Sigma   : '\\Sigma'   , eta      : '\\eta'       , tau        : '\\tau'        ,
      theta   : '\\theta'   , vartheta : '\\vartheta'  , Theta      : '\\Theta'      ,
      upsilon : '\\upsilon' , Upsilon  : '\\Upsilon'   , iota       : '\\iota'       ,
      phi     : '\\phi'     , varphi   : '\\varphi'    , Phi        : '\\Phi'        ,
      kappa   : '\\kappa'   , chi      : '\\chi'       , lambda     : '\\lambda'     ,
      Lambda  : '\\Lambda'  , psi      : '\\psi'       , Psi        : '\\Psi'        ,
      mu      : '\\mu'      , omega    : '\\omega'     , Omega      : '\\Omega'      ,
      NN      : '\\mathbb{N}'   , ZZ   : '\\mathbb{Z}' , QQ         : '\\mathbb{Q}'  , 
      RR      : '\\mathbb{R}'   , CC   : '\\mathbb{C}' , or         : '\\text{or}'   ,
      implies : '\\Rightarrow'  , and  : '\\text{and}' , not        : '\\neg'        ,
      '~'     : '\\sim'         , iff  : '\\Leftrightarrow' ,   
      contradiction : '\\rightarrow\\leftarrow' ,
      equivalenceRelation : '\\text{equivalence relation}' ,
      strictPartialOrder : '\\text{strict partial order}' ,
      partialOrder : '\\text{partial order}' ,
      totalOrder : '\\text{total order}' 
    } 
    return (tex[s]) ? tex[s] : s
  }
  // convert equations with more than two arguments to a transitive chain
  const texEquation = a => {
    if (a.length === 2) return a.join('=')
    let ans = `\\begin{align}\n  ${a[0]} &= ${a[1]}`
    a.slice(2).forEach( eq => ans += ` \\\\\n    &= ${eq}`)
    ans += '\n\\end{align}'
    return ans 
  }

  // convert prefix function application to lisp
  const texPrefix = (op,args) => {
      return op+args.map(s=>`\\left(${s}\\right)`).join('')
  }

  // Convert optional associative binary operator to lisp. This is used to
  // process rules that use the |m..n,op| sequence syntax. This returns an array
  // which is passed as the args argument.  We do not clean the args to force being
  // more careful when defining the rules.
  const lispSeq = (op,args) => {
    debug(`\nlispSeq ${op}`,args)
    // if there's only one arg, return it, otherwise apply the op
    return (args.length>1) ? `(${op} ${args.join(' ')})` : args[0]
  }

  // convert optional unary operator to lisp
  const lispUnary = (op,arg) => {
    debug(`\nlispUnary: ${op}`,arg)
    return `(${op} ${arg})`
  }

  // convert mandatory binary operator to lisp
  const lispBinary = (op,a,b) => {
    debug(`\nlispBinary: ${op}`,a,b)
    return `(${op} ${a} ${b})`
  }

  // convert prefix function application to lisp
  const lispPrefix = (op,args) => {
    if (!Array.isArray(args)) { return `(${op} ${args})` }
    else if (!args.every(Array.isArray)) { 
      return `(${op} ${args.join(' ')})` 
    } else {
      return args.reduce( (ans,group) => { 
        return (group.length) ? `(${ans} ${group.join(' ')})` : `(${ans})`  
      } , op )
    }
  }

  // convert signed sums to lisp
  const lispSum = (first,rest) => {
    // console.log(`lispSum:\n`)
    // write(first)
    // console.log(rest)
    let ans = `(+ ${first}`
    rest.forEach( term => {
      ans = ans + ( (term[1]==='-') ? ` (- ${term[3]})` : ` ${term[3]}` )
    })
    return ans + ')'
  }

  /////////////////////////////////////////////////////////////////
  // Parser specific utilities

  // replace tabs with a space
  const replaceTabs = s => s.replace(/\t/g,' ') 

  // shrink consecutive spaces to a single space
  const shrink = s => s.replace(/ ( +)/g,' ') 
  
  // Replace reserved phrases with Symbols.  These should be replaced in order
  // so longer phrases are replaced before subphrases. We shrink the string
  // before doing these substitutions in case someone has, e.g. 'partial    order'
  // with extra spaces.  We also replace some standard words with unicode characters
  // so they are easy to prevent being interpreted as Symbols.
  const Phrases = [
    [ '→←'                     , 'contradiction'          ] , 
    [ '∃!'                     , 'existsUnique'           ] , 
    [ 'exists unique'          , 'existsUnique'           ] , 
    [ 'exists!'                , 'existsUnique'           ] , 
    [ 'equivalence relation'   , 'equivalenceRelation'    ] ,
    [ 'strict partial order'   , 'strictPartialOrder'     ] ,
    [ 'partial order'          , 'partialOrder'           ] ,
    [ 'total order'            , 'totalOrder'             ] ,
    [ 'for all'                , 'forall'                 ] ,
    [ 'for each'               , 'forall'                 ] ,
    [ 'for every'              , 'forall'                 ] ,
    [ 'there exists'           , 'exists'                 ] 
  ]
  
  const UnicodeNames = {
    '⋅' : '*'          ,  '≤' : 'leq'       , '¬' : 'not'    , '→' : 'to'        ,
    '←' : 'from'       ,  '⇒' : 'implies'   , '⇔' : 'iff'    , '∩' : 'intersect' ,   
    '∪' : 'union'      ,  '×' : 'cross'     , '∈' : 'in'     , '⊆' : 'subset'    ,    
    '∖' : 'setminus'   ,  '∘' : 'circ'      , '∧' : 'wedge'  , '∨' : 'vee'       ,
    '≡' : 'equiv'      ,  '↦' : 'mapsto'    , '≈' : 'approx' , '∀' : 'forall'    ,
    '∃' : 'exists'     ,  '⟨' : 'langle'    , '⟩' : 'rangle' , '➤' : 'comment'   ,
    '°' : 'complement' ,  '≅' : 'cong'      , '\\': ' '      , '!' : 'factorial' 
  }
  
  const internalNames = {
    'equiv'     : '≡' , 'forall'   : '∀' , 'exists' : '∃'  , 'existsUnique' : '∃!'    ,
    'iff'       : '⇔' , 'implies'  : '⇒' , 'vee'    : 'or' , 'wedge'        : 'and'   ,
    'not'       : '¬' , 'setminus' : '∖' , 'subset' : '⊆'  , 'subseteq'     : '⊆'     ,
    'cong'      : '≅' , 'leq'      : '≤' , 'lt'     : '<'  , 'factorial'    : '!'     ,
    'divides'   : '|' , 'cdot'     : '⋅' , '*'      : '⋅'  , 'love'         : 'loves' ,
    'in'        : '∈' , '\\'       : ' ' , 'fear'   : 'fears'           
  }

  // for use in Declare's, look up the internal name of a reserted word or
  // symbol that might appear in the declare sequence
  const internal = s => {
    return internalNames[s] || s
  }

  // replace phrases first
  const replacePhrases = s => {
    Phrases.forEach( p => { 
      const regex = new RegExp(p[0],'g')
      s = s.replace(regex,` ${p[1]} ` )  
    } )
    return shrink(s)
  }
  
  // then remove the unicodes
  const replaceUnicode = s => {
    // first, replace toxic unicode chars with their ascii synonym
    s = s.replace(/𝜎/g  , ' sigma' ) // usually used as a function so no following space
         .replace(/𝜆/g  , '@'      ) // for "LDE EFA"
         .replace(/≠/g  , ' neq '  )
         .replace(/∉/g  , ' notin ')
         .replace(/⁻/g  , '^-'     ) // no need to declare this.. declare - instead
    // now replace the given unicode characters that do not appear in strings or
    // putdown
    const chars = '[⋅≤¬→←⇒⇔∩∪×∈⊆∖∘∧∨≡↦≈∀∃⟨⟩➤°!⁻≅\\\\]'      
    const regex = new RegExp(`(?<!«[^«»]*)(?<!^[^"]*"[^"]*)${chars}(?![^«»]*»)`,'mg')
    const ans = shrink(s.replace(regex, c => { return ` ${UnicodeNames[c]} ` } ) )
    return ans
  }

  // for debugging, say where you are in the parse and what you are seeing
  const debug = (name,...args) => {
    if (options.debug) {
      write(`${name}:`)
      args.forEach(a=>write(a))
    }
    return true
  }
  
  // for debugging, echo a string with line numbers
  const say = s => {
    const lines = s.split('\n')
    const lineNumberWidth = String(lines.length).length
    lines.forEach( (line, index) => {
      const lineNumber = String(index + 1).padStart(lineNumberWidth, ' ')
      console.log(`${lineNumber}: ${line}`)
    })
  }

}}

// Preprocess the input string
{ 
  
  // Comments
  //
  // Comments are defined to start at // and continue to the end of the line.
  // Delete comments first, but leave any \n's to keep the line counts right for
  // debugging.
  input = input.replace(/\/\/[^\n\r]*(\n|\r|$)/g, '\n')
  // Look for lines containing only a ➤ and whitespace, and replace them
  // with (➤ " ") to act as a line break in the output in Lode
  input = input.replace(/^([ \t]*)➤[ \t]*$/mg, '$1➤ " " \n')
  
  // Tabs and Spaces
  //
  // replace tabs with a space
  input = replaceTabs(input)
  // remove double spaces
  input = shrink(input)

  // Phrases and unicode
  //
  // replace phrases with symbols
  input = replacePhrases(input)
  // replace unicode characters with ascii symbols
  input = replaceUnicode(input)
  
  // Relations
  //
  // In order to use ~ and ≈ as both infix operations AND sets (and talk about
  // their properties) we replace '~' and '≈' up front with (~) and (≈)
  // respectively.
  input = input.replace(/'~'/g, '(~)')
  input = input.replace(/'≈'/g, '(approx)')
  
  // Optional Given Colons
  //
  // Lets used to require a colon e.g. ':Let' but we no longer require it, so
  // for backwards compatibility, remove it if its there.  If someone puts it
  // there, no big deal.
  input = input.replace(/:([Ll]et )/g, '$1') 
  
  // Division '/' to product ' cdot /'
  //
  // Replace all '/' with ' cdot /'
  input = input.replace(/(?<!«[^«»]*)\/(?![^«»]*»)/g,' cdot /')
  
  // Remove any double spaces that were created
  input = shrink(input)
  
  // uncomment the following for debugging
  if (options.debug) say(input)
}

///////////////////////////////////////////////////////////////////////////////
// LCs
//
// The philosophy behind this parser design is as follows.  Peggy parsing only
// can implement precedence by testing all of the lower precedent rules before
// the higher ones. 
//
// * For space sparated sequences of LCs and environments things are rather
//   straightforward.  Expressions are more nuanced.  
// * Meta content like comments and «» escaped raw putdown are easily handled
//   right up front as they are nevey part of other expressions.
// * Declarations are also not considered to be Expressions here, because we do
//   not allow them to be part of larger compound expressions or other
//   Declarations, and so they too can be handled separately up front right
//   after Meta.
// * Expressions are then processed in a strict order from lowest to highest
//   precedence. Because of this all compound expressions are processed first,
//   and atomic ones like symbols, numbers, and things in parentheses are
//   handled last.  Thus, even though a single symbol like P might be a
//   Proposiiton, or a Set, or a Relation, or an Algebraic, we only define those
//   to be compound expressions for each of their operators, and save the atomic
//   ones to be checked for last, with the arguments to lower precendence
//   operations coming from the category of expressions that are higher than it
//   in precedence.  The order we define here is roughly as follows from lowest
//   to highest.
//
//     - Quantified  
//     - Binding    
//     - Prop       
//     - Relations  
//     - Set        
//     - Prefix     
//     - Algebraic  
//     - Atomic     
//
// The start rule for a Peggy grammar is the first rule.  For us, it's a
// sequence of LCs. 
//
// (this consumes all of the inter-LC spaces)
LCs "LC" = _ a:(LC)|..,__| _  { return a.join(' ') }

///////////////////////////////////////////////////////////////////////////////
// Overview
//
// Here we just put a high level overview that shows the precedence of
// operations. All of these are defined below.
//
// A single LC
LC = Meta / Given / Environment / Declaration / Expression
  // Things it searches for and replaces up front
  Meta = Putdown / Comment / StringLiteral / Shorthand 
  // Declarations
  Declaration = Declare / ForSome / Let 
  // Expressions
  Expression =  Quantified / Binding / Prop / PropArg
    // higher precedence than Prop ops for use in Props
    PropArg  = Relations / RelArg
      // higher precedence than Relations for use in Relations
      // Algebraic includes Atomic
      RelArg = Set / Algebraic

  // It is often useful to have a sequence of one or more expressions separated
  // by commas
  ExpressionSeq = a:Expression|..,comma| { return a.join(',') }
    
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// Meta
//
// Unprocessed putdown notation (cannot include // comments)
Putdown = '«' @$([^»]*) '»'  
// Insert a comment that gets echoed in Lode
Comment = ( '%' / 'Comment'i ) __ a:StringLiteral 
            { return a.replace(/"([^"]*)"/,"\\text{``$1''}") }
  
// A string literal is anything enclosed in double quotes
// Currently only used for comments
StringLiteral = $('"' [^"]* '"') 
// Shorthands are special symbols which are not allowed to be part
// of a larger expression and are post-processed by the LDE
// They cannot be part of a longer symbol
Shorthand = Equiv / a:(BIH / Ruleset / Rule / Thm / Proof / Cases)
                     !alphanum { return txt(a) }
  // Shorthands
  Equiv   = 'equiv'i { return '\\equiv ' }
  BIH     = $('since'i / 'because'i / 'recall'i)
  Ruleset = $(('rules'i / 'axioms'i / 'definitions'i) ':'?) 
  Rule    = $(('rule'i / 'axiom'i / 'definition'i) ':'?)
  Thm     = $(('theorem'i / 'thm'i / 'lemma'i / 'corollary'i) ':'?)
  Proof   = $('proof'i ':'?)
  Cases   = $('CasesRule'i ':'?)

///////////////////////////////////////////////////////////////////////////////
// Givens
//
// A Given label that is not part of a longer symbol or followed by another :
// character, separated from either an Environment or Expession sequence by
// optional spaces.
// TODO: use Expression|1..,comma|
Given = a:GivenLabel b:Environment { return `${txt(a)} ${b}` } /
        a:GivenLabel b:Expression|1..,comma| { return `${txt(a)} ${sequence(b)}` }
  GivenLabel = @':'_ / @('assume'i / 'given'i / 'suppose'i / 'if'i) _x

///////////////////////////////////////////////////////////////////////////////
// Environments
//
Environment =  '{' a:LCs '}' { return `\\left\\{ ${a} \\right\\}` }

///////////////////////////////////////////////////////////////////////////////
// Declarations
//
// Declare constants (cannot have a body and is a given)
Declare = a:'declare'i __ b:DeclareSeq { return `${txt(a)} ${b}` }
// ForSome declaration (always a claim)
ForSome = body:Expression __ 'for' __ 'some' __ a:SymbolSeq 
          { return `${body}\\text{ for some }${a}` }
// the 'given' colon is optional since these are always 'given'.          
Let = a:'Let'i __ b:SymbolSeq __ 'be' __ 'such' __ 'that' __ c:Expression 
          { return `${txt(a)}${b}\\text{ be such that }${c}` } /
      a:'Let'i __ b:SymbolSeq __ 'such'i __ 'that'i __ c:Expression
          { return `${txt(a)}${b}\\text{ such that }${c}` }    /
      a:'Let'i __ b:SymbolSeq { return `${txt(a)}${b}`       }
  // Comma separated symbols, numbers, and reserved words
  DeclareSeq = a:(ReservedWord / Number / Symbol)|1..,comma| {return sequence(a) }
  // We allow Reserved Words and Numbers to be declared by a Declare, but not
  // by a Let or ForSome.
  SymbolSeq  = a:(Symbol)|1..,comma| { return sequence(a) }

///////////////////////////////////////////////////////////////////////////////
// Expressions 
//
// The trick here is that we want long, complex, compound expressions to be
// matched before simpler, more atomic ones. We basically have three current
// collections of related expressions: Propositions, Sets, and Algebraic.
// However a single atomic Symbol could be any of those, e.g. P might be a
// proposition, or a set, or a number because the symbols are not typed. Thus we
// need to be careful to check for all compound propositions, sets, and
// algebraic expressions before checking any of them for propositional variable
// so that e.g. checking for Propositions doesn't skip over the checks for
// compound sets or algebraic expressions that begin with an atomic. To do this,
// we think of each category above Atomic as representing compound expressions
// only of that category and order everything in terms of precedence.

///////////////////////////////////////////////////////////////////////////////
// Quantified and Binding
//
// quantified binding expressions
Quantified = 'forall' _x b:Binding           { return `\\forall ${b}`   } /
             'exists' _x b:Binding           { return `\\exists ${b}`   } /
             'existsUnique' _x b:Binding     { return `\\exists! ${b}` } 
// binding expressions / anonymous maps
Binding = a:Symbol period _ b:Expression 
          { return `${a}. ${b}` } /
  a:Symbol _'mapsto'_x b:Expression 
          { return `${a}\\mapsto ${b}` }

///////////////////////////////////////////////////////////////////////////////
// Propositional expressions
//
// We want a strict precedence of operations here, so lower precedence items 
// should only permit higher precedence arguments.
// Thus we only need Prop to point to Iff because the higher precedent ones feed
// into that, and they use BelowProp and higher precendent Prop's as arguments. 
Prop = Iff

  Iff     = a:(Implies/PropArg)|1..,_'iff'_x|        
              { return a.join('\\Leftrightarrow ')  }
  Implies = a:(Or/And/PropArg)|1..,_'implies'_x|     
              { return a.join('\\Rightarrow ')      }
  Or      = a:(And/PropArg)|1..,_('or'/'vee')_x|     
              { return a.join('\\text{ or }')       }
  And     = a:(Not/PropArg)|1..,_('and'/'wedge')_x|  
              { return a.join('\\text{ and }')      }
  Not     = _'not'_x b:PropArg                       
              { return '\\neg '+b                   }
  
///////////////////////////////////////////////////////////////////////////////
// Relations
//
Relations = Maps / Partition / Congruent / Subset / ElementOf / NotEltOf / 
            Divides / Leq / LessThan / Relation / Equation / NotEqual / 
            Loves / Fears / Is

  Maps       = a:RelArg _':'_ b:RelArg _'to'_x c:RelArg  
                 { return `${a}\\colon ${b}\\to ${c}` }
  Partition  = a:(Binding/RelArg) _'is' __ 'a' __ 'partition' __ 'of' __ 
               b:(Binding/RelArg)
                 { return `${a}\\text{ is a partition of }${b}` }
  Congruent  = a:(Binding/RelArg) _'cong'_x b:(Binding/RelArg) _'mod'i_x 
               c:(Binding/RelArg)
                 { return `${a}\\underset{${c}}{\\equiv}${b}` } /
               a:(Binding/RelArg) _'cong mod'i_x c:(Binding/RelArg) _'to'_x 
               b:(Binding/RelArg)
                 { return `${a}\\underset{${c}}{\\equiv}${b}` } 
  Subset     = a:RelArg|2..,_('subset'/'subseteq')_x|  
                 { return a.join('\\subseteq ') }
  NotEltOf   = a:RelArg _'notin'_x b:RelArg        
                 { return `${a}\\notin ${b}` }
  ElementOf  = a:RelArg _'in'_x b:RelArg           
                 { return `${a}\\in ${b}`  }
  Divides    = a:RelArg _('|'_ / 'divides'_x) b:RelArg      
                 { return `${a}\\mid ${b}` }  
  Leq        = a:RelArg|2..,_'leq'_x|             
                 { return a.join('\\leq ') }
  LessThan   = a:RelArg|2..,_('<'_ / 'lt'_x)|
                 { return a.join('\\lt ')  }
  NotEqual   = a:RelArg _('neq'/'ne')_x b:RelArg   
                 { return `${a}\\neq ${b}` }
  Relation   = a:(Binding/RelArg)|2..,_'~'_|       
                { return a.join('\\sim ')  }             
  Equation   = a:(Binding/RelArg)|2..,_'='_|       
                { return texEquation(a) }
  Loves      = a:RelArg _ b:('loves'/'love')_x c:RelArg
                { return `${a}${txt(' '+b)}${c}` }
  Fears      = a:RelArg _ b:('fears'/'fear')_x c:RelArg
                { return `${a}${txt(' '+b)}${c}` }
  Is         = a:RelArg _ b:('is' __ 'an'/'is' __ 'a'/'is'/'are') _x c:RelArg
                { return (Array.isArray(b)) 
                  ? `${a}\\text{ ${b[0]} }${txt(b[2])}${c}`
                  : `${a}\\text{ ${b} }${c}` }


///////////////////////////////////////////////////////////////////////////////
// Sets 
//
// We imitate Algebraic operator precendence as much as possible and rank from
// lowest to highest: set difference < set product < ∪ and ∩ (tied) <
// composition , complement (tie) Thus, as for Prop we only need for Set to
// point to the first one. Algebraic bubbles up from Composition.
Set = RelativeComp

  RelativeComp  = a:CartProd|1..,_'setminus'_x| 
                    { return a.join('\\setminus ') }  
  CartProd      = a:Union|1..,_('times'/'cross')_x| 
                    { return a.join('\\times ') }
  Union         = a:Intersection|1..,_('cup'/'union')_x| 
                    { return a.join('\\cup ') }
  Intersection  = a:(Complement/Composition)|1..,_('cap'/'intersect')_x| 
                    { return a.join('\\cap ') }               
  Complement    = a:Algebraic _'complement'!alphanum
                    { return `{${a}}^\\circ ` }
  Composition   = a:Algebraic|1..,_('circ'/'comp')_x| 
                    { return a.join('\\circ ') }
  
///////////////////////////////////////////////////////////////////////////////
// Algebraic Expressions
//
// For now we implement binomial coefficients with the infix operator 'choose'
// and make it even lower precedence than sum so you can do things like '(n+1
// choose k)' without additional parentheses. Sums and Products are particularly
// subtle because of the need to integrate them with the standard conventions
// for negation and division.
//
// Once again, Algebraic only has to point to the lowest precedence operator
// that inherits the ones below it (but Choose does not). Atomic is passed up
// the chain from Exp.
Algebraic = Choose / Sum / Product
  
  Choose    = a:(Sum / Product) _'choose'_x b:(Sum / Product) 
                { return `\\binom{${nopar(a)}}{${nopar(b)}}` }
  Sum       = a:Product _ b:(_ [-+] _ Product)+            
                { return texSum(a,b) }
  Product   = a:(Denom/Negated/ExpArgs)
                |1..,(_'⋅'_/_'cdot'_x/_'*'_)| 
                { return texProduct(a) }
                
    Denom     = '/' _ a:ExpArgs 
                  { return '/'+a }    
    Negated   = '-' _ a:ExpArgs 
                  { return '-'+a }

    // Exp and higher precedence args
    ExpArgs = Factorial / Prefix / Exp / Atomic

    // The choice of precedence of Function application vs Exp is tricky.
    // Consider e.g. 2^cos(x), f^2(x), 2^f(x), f^(-1)(x), and the nightmare
    // expressions like sin^2(x) vs sin(x)^2. What is the natural way to parse
    // each of those? 
    //
    // The main use case in the intro to proof course is for inverse functions.
    // For this reason we choose to make exponentiation higher precedence than
    // function application, and remove parentheses from exponents.  With this
    // choice of precedence we most likely would want to type the above
    // expressions as: 2^(cos(x)), f^2(x), 2^(f(x)), f^(-1)(x), and either
    // define a rule that says sin^2(x)=sin(x)^2, or just don't ever use
    // sin^2(x) at all for input. 
    //
    // For a similar reason, Factorials are lower precedence than exponentials
    // so that e.g. 2^n! parses as (2^n)! instead of 2^(n!). And since f(n)!
    // really only makes sense in one way, function application is a higher
    // precedence than Factorial.
    //
    // So the precedence from lowest to highest is
    //
    //                   Factorial < Prefix < Exp
    
    Factorial = a:(Prefix / Exp / Atomic) _'factorial'!alphanum
                  {  return a+'!' }

///////////////////////////////////////////////////////////////////////////////
// Prefix operators (function application)
//
// n-ary, left associative, function application. Args can be any Expressions
// but the head (function) can only have higher precedence. One common situation
// we want to support is something like (g∘f)^(-1)(x), so we allow Inverse for
// the head in addition to Symbols and Parenthesized.
//
// Since we want to allow things like (g∘f)(x), but don't want something like
// `(x≤y) (z=0)` to parse as function application, we require that function
// application does NOT allow a space between the function and the parentheses
// wrapping it's arguments.  To enable this, Inverse, Symbol, and
// Parenthesized cannot consume any spaces after their content.
//
// For convenience we define special Symbols beginning with '@' so that @P(k)
// becomes (λ P k) and then replace λ with "LDE EFA" as a shortcut in
// parsing.js.  Note that 𝜆 gets replaced by '@' up front in the input. This is
// not intended for use in any other way than for writing rules that require
// 𝜆P(k) where P is a single character Symbol and k an Expression.
Prefix = // LDE EFA's first
         '@' a:[a-z]i b:( '('_ @ExpressionSeq _')' )+ 
            { return `\\lambda ${a}\\left(${b})\\right)` } /
          // then the rest 
          a:(Exp / Symbol / Parenthesized)
          b:( '('_ @ExpressionSeq _')' )+ { return texPrefix(a,b) }
  
    // If we made it to here, we are at the bottom of the food chain for
    // compound expressions, so it's ok to return a symbol or other atomic at
    // this point. Exp also passes Prefix, Inverse and Factorial up to Product,
    // Denom, and Negated.
    Exp = a:Atomic _'^'_ b:(Atomic / '-') 
            { return `{${a}}^{${nopar(b)}}` } 

///////////////////////////////////////////////////////////////////////////////
// Atomic Expressions
//
// morally atomic expressions (do not require parentheses)
Atomic = Parenthesized / EquivalenceClass / Tuple / Symbol / Number

///////////////////////////////////////////////////////////////////////////////
// Things in parentheses
//

// equivalence class - if the optional relation is missing from an equivalence
//                     class we use '~'
EquivalenceClass = 
  '[' a:( @Expression ) ']'                   { return `\\left[${a}\\right]` } /
  '[' a:Expression comma b:Symbol ']'    { return `\\left[${a}\\right]_${b}` }  /
  '[' a:Expression comma b:'~' ']'    { return `\\left[${a}\\right]_{\\sim}` }
// tuples
Tuple = 'langle'_x a:ExpressionSeq _'rangle'!alphanum
        { return `\\left\\langle{${a}}\\right\\rangle` }
// parenthesized
Parenthesized = '(' _ a:Expression _ ')' { 
  // we have to check for ~ as a special case (see above)
  return (a === '\\sim') ? a : `\\left(${a}\\right)` }

///////////////////////////////////////////////////////////////////////////////
// Numbers 
// (negatives and fractions are compound)
Number  = Decimal / Natural
Decimal = $( Natural '.' [0-9]+ )
Natural = $( [1-9][0-9]* / '0' )

///////////////////////////////////////////////////////////////////////////////
// Symbols and Reserved Words
//
// Symbols can be anything string of alphanumeric characters [a-zA-Z0-9] that
// does not start with a digit and is not a reserved word.  Reserved words are not
// symbols, but can be declared with a Declare.
//
// For clarity in reading the putdown output we rename some special frequently used
// symbols.
Symbol "Symbol" =  a:('contradiction' / '✔︎' / '✗' / '⁉︎' / '~' ) { return texsymbol(a) } / 
  !(ReservedWord !alphanum) a:([a-z]i alphanum* ) 
  { let b = texsymbol(a[0]+a[1].join(''))
    return (b.length>1 && !b.startsWith('\\')) ? `\\text{${b}}` : b }

// Reserved Words
//
// a string is a reserved word if it starts with one of these and is not
// followed by an alphanum, so not part of a longer symbol, or things that
// aren't symbols that we still want to declare as constants.
ReservedWord  = $(
    'declare'i / 'existsUnique' / 'forall' / 'exists' / '*' / 'leq' /
    'not' / 'to' / 'from' / 'implies' / 'iff' / 'intersect' / 'union' /
    'cross' / 'in' / 'subset' / 'setminus'i / 'circ' / 'wedge' / 'vee' / 
    'equiv' / 'mapsto' / 'approx' / 'langle' / 'rangle' / 'complement' / 
    'inv' / 'and' / 'or' / '=' / '<' / '+' / '*' / '|' / '-')

///////////////////////////////////////////////////////////////////////////////
// punctuation and character classes

// alphanum checks for a nonalphanumeric character without consuming any input.  It
// is useful for checking for the end of reserved words and classes that end
// with a word
alphanum = [a-z0-9]i

// We frequently want to allow optional spacing before or after a reserved word.
// We might need to consume the space, but if there is no space there we need to
// ensure that there isn't an alphanumeric character immediately following the
// reserved word.  So we first check for that before consuming the space in case
// it is the space that statisfies that condition. Then we just return undefined so 
// it will be cleaned out of in the result.
_x = !alphanum _ { return undefined }

// commas, periods, and spaces
comma  =  _ ',' _
period =  '.'
__  = [ \t\n\r]+
_   = [ \t\n\r]*