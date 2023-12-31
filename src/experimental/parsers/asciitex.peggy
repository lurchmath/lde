///////////////////////////////////////////////////////////////////////////
// AsciiMath Peggy Grammar and Parser
//
// A peggy grammar definition file to generate a parser for converting
// AsciiMath expression to an LC.
//
// Note: for now we encode negative numbers as compound expressions e.g. -3 is
// encoded as (- 3). We also encode rational fractions as a product of the
// numerator times the multiplicative inverse of the denominator where / is the
// unary inverse operator, e.g. 2/3 parses as (⋅ 2 (/ 3)).  This is consistent
// with the way negation is handled.  We do not allow expresions like '/2' to
// represent one half. We do not have an Integer or Rational constant type for
// this reason.
//
// Note: Declare's have to be on a line by themselves and its declared
// constants separated by spaces (not commas)
//
// To save the resulting parser to a standalone .js file use:
//   peggy --cache --format es -o asciimath.js asciimath.peggy
//
//
// TODO: 
//  * add equiv classes, infix relation symbols family

{{

  // remove empty arrays from a nested array
  const clean = A => { 
    return A.map( c => { 
      return (Array.isArray(c) && c.length) ? clean(c) : c 
      } ).filter( e => !(Array.isArray(e) && e.length===0) )
  }
  
  // replace the commas in a sequence with spaces
  const spaced = s => s.replace(/,/g, ' ') 

  // tex utilities
  const texUnary = (op,arg) => {
    return (op) ? `${op} ${arg}` : arg
  }

  const texJoin = (op,args) => {
    if (args.length===1) return args.join(op)
    return args.map(x=>` ${x}`).join(op)
  }

  const texRightAssoc = (op,args) => {
    return args.reverse().slice(1).reduce(
      (ans,x)=>{ return `${x}${op}{${ans}}`},args[0])
  }

// convert signed sums to lisp
  const texSum = (first,rest) => {
    let ans = `${first}`
    rest.forEach( term => {
      ans = ans + ( (term[0]==='-') ? `-${term[1]}` : `+${term[1]}` )
    })
    return ans
  }

  // default: convert optional associative binary operator to lisp
  const lisp = (op,args) => {
    // if there's only one arg, return it, otherwise apply the op
    return (args.length>1) ? `(${op} ${args.join(' ')})` : args[0]
  }

  // convert optional unary operator to lisp
  const lispUnary = (op,arg) => {
    return (op) ? `(${op} ${arg})` : arg
  }

  // convert mandatory binary operator to lisp
  const lispBinary = (op,a,b) => {
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
    let ans = `(+ ${first}`
    rest.forEach( term => {
      ans = ans + ( (term[0]==='-') ? ` (- ${term[1]})` : ` ${term[1]}` )
    })
    return ans + ')'
  }

  // for debugging, shorthand for console.log
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
  //   * replace toxic unicode chars with equivalents
  input = input.replace(/𝜎/g, 'σ')
  input = input.replace(/𝜆/g, 'λ')
  input = input.replace(/≠/g, ' neq ')  
  input = input.replace(/∉/g, ' notin ') 
  
  //   * since we want to use → for maps, we replace the contradiction symbol pair up front
  input = input.replace(/→←/g, ' contradiction ')
  //   * we also prefer to write 'equivalence relation', etc. than equivalence_relation
  input = input.replace(/equivalence relation/g, ' equivalence_relation ')
  input = input.replace(/strict partial order/g, ' strict_partial_order ')
  input = input.replace(/partial order/g, ' partial_order ')
  input = input.replace(/total order/g, ' total_order ')
  //   * in order to use ~ and ≈ as both infix operations AND sets (and talk about their
  //     properties) we replace '~' and '≈' up front with (~) and (≈) respectively.
  input = input.replace(/'~'/g, '(~)')
  input = input.replace(/'≈'/g, '(≈)')
  //   * Let's used to require a colon ':Let' but we no longer require it, so 
  //     for backwards compatibility, remove it if its there.
  input = input.replace(/:([Ll]et )/g, '$1') 
  //   * Declaring reserved constants is tricky since it tries to parse them as they are
  //     intended to be used, so for now we convert any line of the form `Declare stuff`
  //     to escaped putdown up front.
  input = input.replace(/[Dd]eclare \s*([^\s].*)$/mg, 'declare> «:[$1]»\n')
  //   * also look for lines containing only a ➤ and whitespace, and replace
  //     them with (➤ " ") to act as a line break in the output
  input = input.replace(/^([ \t]*)➤[ \t]*$/mg, '$1➤ " " \n')
  //   * delete comments (but leave any \n's to keep the line counts right)
  input = input.replace(/\/\/[^\n\r]*(\n|\r|$)/g, '\n')
  //   * Replace tabs with a space
  input = input.replace(/\t/g, ' ')
  //   * shrink consecutive spaces to a single space
  input = input.replace(/ ( +)/g,' ') 
  //   * remove spaces around reserved infix unicode ops not inside literal putdown so
  //     the parser doesn't have to find and avoid them
  input = input.replace(/(?<!«[^«»]*)\s*([,.↦+⋅/^=<≤→⇒⇔|∩∪×∈⊆∖~≈])\s*(?![^«»]*»)/g,'$1')
  //   * same for prefix ops
  input = input.replace(/(?<!«[^«»]*)([-({∀∃])[ \t]*(?![^«»]*»)/g,'$1')
  //   * same for postfix ops
  input = input.replace(/(?<!«[^«»]*)[ \t]*([⁻°！)}])(?![^«»]*»)/g,'$1')
  //   * replace all '/' with '⋅/'
  input = input.replace(/(?<!«[^«»]*)\/(?![^«»]*»)/g,'⋅/')
  
  // uncomment the following for debugging
  // say(input)
}

// The start rule for a Peggy grammar is the first rule.  For us, it's a
// sequence of LCs.
LCs =  _ a:LC|..,__| _  { return a.join(' ') }

// A single LC
LC "LC" = @( Meta / Contradiction / Given / Declaration / Environment / Expression)

// givens
Given "Given" = (':' / 'Assume'i __ ) 
  a:(Environment / Expression) { return ':\\text{:}'+a }

// environments
Environment "Environment" = 
  '{' _ a:( Meta / Declaration / Given / Environment / Expression )|..,__| _ '}'
  { return `\\{ ${a.join(' ')} \\}` }

// things it searches for and replaces up front
Meta = Putdown / Comment / Shorthand / StringLiteral

// unprocessed putdown notation (cannot include // comments)
Putdown = '«' @$([^»]*) '»'  // todo: add a non-unicode way to do this

// insert a comment that gets echoed
Comment "Comment" = ('Comment'i / '➤') __ a:StringLiteral { return `(➤ ${a})` }
// String Literals for comments
StringLiteral = $('"' [^"]* '"')

// Shorthand symbols that will be post-processed
Shorthand = BIH / Ruleset / Rule / Thm / Proof

BIHLabel = 'since'i / 'because'i / 'Recall'i
BIH = BIHLabel { return '\\text{Recall }' }
RulesetLabel = 'Rules'i / 'Axioms'i / 'Givens'i / 'Definitions'i
Ruleset = RulesetLabel ':'? { return '\\text{Rules:}' }
RuleLabel = 'Rule'i / 'Axiom'i / 'Given'i / 'Definition'i
Rule = RuleLabel ':'? { return '\\text{Rule}' }
ThmLabel = 'Theorem'i / 'Thm'i / 'Lemma'i / 'Corollary'i
Thm = ThmLabel ':'? { return '\\text{Theorem}' }
ProofLabel = 'Proof'i 
Proof = ProofLabel ':'? { return '\\text{Proof:}' }

// declarations
Declaration "Declaration" = ForSome / Let

ForSome = body:Expression __ 'for'i __ 'some'i __ a:SymbolSeq 
          { return `${body}\\text{ for some }${a}` }
// the 'given' colon is optional since these are always 'given'.          
Let =  'Let'i __ a:SymbolSeq __ ('be'i __)? 'such'i __ 'that'i __ b:Expression 
       { return `\\text{Let }${a}\\text{ be such that }${b}` } /
       'Let'i __ a:SymbolSeq { return `\\text{Let }${a}` }

// expressions - get's Stuff from Not
Expression "Expression" = Quantified / Binding / Prop / EFA  

// quantified binding expressions
Quantified = a:BindingSymbol b:Binding
          { return `\\left(${a} ${b}\\right)` }

// binding expressions
Binding = a:Symbol (period / '↦') b:(Expression / Binding) 
          { return `${a}, ${b}` }

// propositional expressions
Prop = Iff / Implies / And / Or / Not

Contradiction = a:'contradiction'           { return '\\Leftarrow\\Rightarrow' }

Iff           = a:Implies|1..,'⇔'/' iff '|    { return texJoin('\\Leftrightarrow',a) }
Implies       = a:Or|1..,'⇒'/' implies '|     { return texJoin('\\Rightarrow',a) }
Or            = a:And|1..,' or '/'∨'|         { return texJoin('\\text{ or }',a) }
And           = a:Not|1..,' and '/'∧'|        { return texJoin('\\text{ and }',a) }
Not           = a:('¬'/'not ')? _ b:Stuff     { return (a==='not ' || a==='¬')
                                                        ?texUnary('\\neg',b)
                                                        :b
                                              }

// stuff that might be a prop
Stuff = Relations / Thing

// relations
Relations = Maps / Partition / Congruent / Subset / ElementOf / NotEltOf / Divides / 
            Leq / LessThan / Relation / Equation / NotEqual / Loves / Is

Maps       = a:Thing _ ':' _ b:Thing '→' c:Thing      { return `a\\colon ${b}\\to ${c}` }

Partition  = a:(Binding/Thing) ' is a partition of 'i b:(Binding/Thing)
             { return texJoin('\\text{ is a partition of }',[a,b]) }
Congruent  = a:(Binding/Thing) '≈' b:(Binding/Thing) ' mod 'i c:(Binding/Thing)
             { return `${a}\\underset{${c}}{\\equiv}${b}` }
Subset     = a:Thing|2..,'⊆'/' subset '/' subseteq '| { return texJoin('\\subseteq',a) }
NotEltOf   = a:Thing (' notin ') b:Thing              { return texJoin('\\in',[a,b])        } 
ElementOf  = a:Thing ('∈'/' in ') b:Thing             { return texJoin('\\in',[a,b]) }
Divides    = a:Thing ('|'/' divides ') b:Thing        { return texJoin('\\mid',[a,b]) }
Leq        = a:Thing|2..,'≤'/' leq '|                 { return texJoin('\\leq',a) }
LessThan   = a:Thing|2..,'<'/' lt '|                  { return texJoin('<',a) }
NotEqual   = a:Thing (' neq '/' ne ') b:Thing         { return texJoin('\\neq',[a,b]) }
Relation   = a:(Binding/Thing)|2..,'~'|               { return texJoin('\\sim',a) }        
Equation   = a:(Binding/Thing)|2..,'='|               { return texJoin('=',a) }
Loves      = a:Thing|2..2,' loves '|                  { return texJoin('\\text{ loves }',a) }
Is         = a:Thing|2..2,' is an '/' is a '/' is '|  { return texJoin('\\text{ is }',a) }


// things to relate
Thing = Set / Algebraic

// sets
Set = Composition / CartProd / Union / Intersection / RelativeComp / Complement

Composition   = a:Atomic|2..,'∘'/' circ '|            { return texJoin('\\circ',a) }
CartProd      = a:CompAtomic|2..,'×'/' times '|  { return texJoin('×',a) }
Union         = a:CompAtomic|2..,'∪'/' cup '/' union '|  { return texJoin('\\cup',a) }
Intersection  = a:CompAtomic|2..,'∩'/' cap '/' intersect '|  { return texJoin('\\cap',a) }
RelativeComp  = a:CompAtomic|2..,'∖'/' setminus '|  { return texJoin('\\setminus',a) }
// we don't want to have to do e.g. A∩(B°) instead of just A∩B°
CompAtomic    = Complement / Atomic
Complement    = a:Atomic ('°'/' complement') { return `${a}^\\circ` }

// algebraic expressions
Algebraic = Sum / Product

Sum       = a:Product b:([-+] Product)+             { return texSum(a,b)   }
Product   = a:(Recip/Factorial/Inversed/Negated)|1..,'⋅'/' cdot '| 
                                                    { return texJoin('',a) }
Recip     = a:Atomic ('⁻'/' recip')                 { return `${a}^-`      }
Factorial = a:Atomic ('！'/' factorial')            { return `${a}!`       }
Inversed  = a:'/'? b:Exp                            { return texUnary(a,b) }
Negated   = a:'-'? b:Exp                            { return texUnary(a,b) }
Exp       = a:Atomic|1..,'^'|                       { return texRightAssoc('^',a) } 

// morally atomic (do not require parentheses)
Atomic =   EFA / Prefix / Parenthesized / EquivalenceClass / Tuple / Symbol / Number

// TODO: fix this hack for inverse functions
Prefix = a:(Symbol ('⁻'/' recip') / Symbol / Parenthesized ) 
         b:( '(' @Expression|..,comma| ')' )+ 
  { if (Array.isArray(a)) return `${a[0]}^-\\left(${b}\\right)` 
    return `${a}\\left(${b}\\right)` 
  }
  

// For convenience we define 𝜆P(k) to be (λ P k) and replace λ with "LDE EFA"
// as a shortcut
EFA = 'λ' a:Symbol '(' b:Expression ')' { return `\\lambda{${a}}(${b})` }

EquivalenceClass = '[' b:(  @Expression|1..2,comma| )+ ']' { 
  // if the optional relation is missing from an equivalence class, don't print it
  if (b.length===1 && b[0].length===1) {
    return `\\left[${b[0]}\\right]` 
  } else {
    return `\\left[${b[0]}\\right]_{${b[1]}}` 
  }
}
Tuple = '⟨' b:(  @Expression|1..,comma| )+ '⟩' { return `\\langle{${b}}\\rangle` }
Parenthesized = '(' a:Expression ')' { return `\\left(${a}\\right)` }
 

// while we probably will never use a number or reserved symbol as a bound var, 
// we might Declare one to be a constant, e.g. Peano or ops
// TODO: try to unify the lists of reserved symbols in one place
DeclareSeq = a:(Symbol/Number/ReservedChars)|1..,comma| { return a.join(' ') }
// numbers
Number  = Decimal / Natural
Decimal = $( Natural '.' [0-9]+ )
Natural = $( [1-9][0-9]* / '0' )

// Symbols can't start with a digit, contain reserved constants, or keywords
SymbolSeq = a:(Symbol/Number)|1..,comma| { return a.join(',') }
Symbol "Symbol" = $( '≡' / '→←' / '~' / '"' [^"]* '"' /
                     !([0-9]/ReservedWord)
                     [^-\][()⟨⟩ \t\n✦{},.:+⋅/^=<≤¬→←⇒⇔|∀∃∩∪×∈⊆∖⁻°∘∧∨≡↦~≈！]+ )
BindingSymbol = ('∃!'/'exists unique ') { return '\\exists!' } /
                ('∀'/'forall '/'for all ') { return '\\forall' } /
                ('∃'/'exists ') { return '\\exists' } 

// punctuation
comma  =  ','
period =  '.'
__  = [ \t\n\r]+
_   = [ \t\n\r]*

ReservedChars = $([:+⋅/^=<≤¬→←⇒⇔|∀∃∩∪×∈⊆∖⁻°∘∧∨≡σλ↦~≈！])
ReservedWord = ' or '/' and '/' loves '/' cdot '/' complement' / 
                ' setminus '/' cap '/' cup '/' times '/' lt '/' leq '/
                ' in '/' subset '/' implies '/' iff ' / 'maps ' /
                ' contradiction ' / ' divides '