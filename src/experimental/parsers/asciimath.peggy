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
//  * add x≠y but have it parse as (¬ (= x y)), & same for other negated ops
//  * add f:A→B, ∘, injective, surjective, bijective, ^inv, etc.
//  * Integrate Declare() with the parser creation.  For example, if we want to
//    Declare reserved symbols like < or = at the top of the document we don't
//    want the parser to try to parse them as infix operators at that point
//    Idea: make it possible to Declare the constants both syntactically and
//    semantically at the same time.

{{

  // remove empty arrays from a nested array
  const clean = A => { 
    return A.map( c => { 
      return (Array.isArray(c) && c.length) ? clean(c) : c 
      } ).filter( e => !(Array.isArray(e) && e.length===0) )
  }
  
  // replace the commas in a sequence with spaces
  const spaced = s => s.replace(/,/g, ' ') 

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
  //   * Declaring reserved constants is tricky since it tries to parse them as they are
  //     intended to be used, so for now we convert any line of the form `Declare stuff`
  //     to escaped putdown up front.
  input = input.replace(/[Dd]eclare \s*([^\s].*)$/mg, 'declare> «:[$1]»\n')
  //   * also look for lines containing only a ➤ and whitespace, and replace
  //     them with (➤ " ") to act as a line break in the output
  input = input.replace(/^([ \t]*)➤[ \t]*$/mg, `$1➤ " " \n`)
  //   * delete comments (but leave any \n's to keep the line counts right)
  input = input.replace(/\/\/[^\n\r]*(\n|\r)/g, '\n')
  //   * Replace tabs with a space
  input = input.replace(/\t/g, ' ')
  //   * shrink consecutive spaces to a single space
  input = input.replace(/ ( +)/g,' ') 
  //   * remove spaces around reserved infix unicode ops not inside literal putdown so
  //     the parser doesn't have to find and avoid them
  input = input.replace(/(?<!«[^«»]*)\s*([,.+⋅/^=<≤⇒⇔|∩∪×∈⊆∖])\s*(?![^«»]*»)/g,'$1')
  //   * same for prefix ops
  input = input.replace(/(?<!«[^«»]*)([-({∀∃])[ \t]*(?![^«»]*»)/g,'$1')
  //   * same for postfix ops
  input = input.replace(/(?<!«[^«»]*)[ \t]*([⁻°)}])(?![^«»]*»)/g,'$1')
  //   * replace all '/' with '⋅/'
  input = input.replace(/(?<!«[^«»]*)\/(?![^«»]*»)/g,'⋅/')
  
  // uncomment the following for debugging
  // say(input)
}

// The start rule for a Peggy grammar is the first rule.  For us, it's a
// sequence of LCs.
LCs = 
_ a:(Meta / Given / Declaration / Environment / Expression)|..,__| _ 
  { return a.join(' ') }

// A single LC
LC "LC" = _ @( Meta / Given / Declaration / Environment / Expression) _

// givens
Given "Given" = (':' / 'Assume'i __ ) 
  a:(Declaration / Environment / Expression) { return ':'+a }

// environments
Environment "Environment" = 
  '{' _ a:( Meta / Declaration / Given / Environment / Expression )|..,__| _ '}'
  { return `{ ${a.join(' ')} }` }

// things it searches for and replaces up front
Meta = Putdown / Comment / Shorthand

// unprocessed putdown notation (cannot include // comments)
Putdown = '«' @$([^»]*) '»'  // todo: add a non-unicode way to do this

// insert a comment that gets echoed
Comment "Comment" = ('Comment'i / '➤') __ a:StringLiteral { return `(➤ ${a})` }
// String Literals for comments
StringLiteral = $('"' [^"]* '"')

// Shorthand symbols that will be post-processed
Shorthand = BIH / Ruleset / Rule / Thm / Proof

BIHLabel = 'since'i / 'because'i / 'Recall'i
BIH = BIHLabel { return '>>' }
RulesetLabel = 'Rules'i / 'Axioms'i / 'Givens'i / 'Definitions'i
Ruleset = RulesetLabel ':'? { return 'rules>' }
RuleLabel = 'Rule'i / 'Axiom'i / 'Given'i / 'Definition'i
Rule = RuleLabel ':'? { return 'rule>' }
ThmLabel = 'Theorem'i / 'Thm'i / 'Lemma'i / 'Corollary'i
Thm = ThmLabel ':'? { return 'thm>' }
ProofLabel = 'Proof'i 
Proof = ProofLabel ':'? { return 'proof>' }

// declarations
Declaration "Declaration" = ForSome / Let

ForSome = body:Expression __ 'for'i __ 'some'i __ a:SymbolSeq 
          { return `[${spaced(a)}, ${body}]` }
Let = 'Let'i __ a:SymbolSeq __ ('be'i __)? 'such'i __ 'that'i __ b:Expression 
       { return `[${spaced(a)}, ${b}]` } /
      'Let'i __ a:SymbolSeq { return `[${spaced(a)}]` }

// expressions
Expression "Expression" = Quantified / Binding / Prop / EFA  // get's Stuff from Not

// quantified binding expressions
Quantified = a:BindingSymbol b:Binding
          { return `(${a} ${b})` }

// binding expressions
Binding = a:Symbol period b:(Expression / Binding) 
          { return `${a}, ${b}` }

// propositional expressions
Prop = Iff / Implies / And / Or / Not

Iff        = a:Implies|1..,'⇔'/' iff '|    { return lisp('⇔',a) }
Implies    = a:Or|1..,'⇒'/' implies '|     { return lisp('⇒',a) }
Or         = a:And|1..,' or '/'∨'|         { return lisp('or',a) }
And        = a:Not|1..,' and '/'∧'|        { return lisp('and',a) }
Not        = a:('¬'/'not ')? _ b:Stuff     { return (a==='not ')
                                                     ?lispUnary('¬',b)
                                                     :lispUnary(a,b)
                                           }

// stuff that might be a prop
Stuff = Relation / Thing

// relations
Relation = Subset / ElementOf / NotEltOf / Divides / Leq / 
           LessThan / Equation / NotEqual / Loves / Is

Subset     = a:Thing|2..,'⊆'/' subset '/' subseteq '| { return lisp('⊆',a) }
NotEltOf   = a:Thing (' notin '/' !in ') b:Thing 
             { return `(¬ ${lispBinary('∈',a,b)})` }
ElementOf  = a:Thing ('∈'/' in ') b:Thing             { return lispBinary('∈',a,b) }
Divides    = a:Thing '|' b:Thing                      { return lispBinary('|',a,b) }  
Leq        = a:Thing|2..,'≤'/' leq '|                 { return lisp('≤',a) }
LessThan   = a:Thing|2..,'<'/' lt '|                  { return lisp('<',a) }
NotEqual   = a:Thing (' neq '/' ne ') b:Thing 
             { return `(¬ ${lispBinary('=',a,b)})` }
Equation   = a:Thing|2..,'='|                         { return lisp('=',a) }
Loves      = a:Thing|2..2,' loves '|                  { return lisp('loves',a) }
Is         = a:Thing|2..2,' is an '/' is a '/' is '|  { return lisp('is',a) }

// things to relate
Thing = Set / Algebraic

// sets
Set = CartProd / Union / Intersection / RelativeComp / Complement

CartProd      = a:CompAtomic|2..,'×'/' times '|  { return lisp('×',a) }
Union         = a:CompAtomic|2..,'∪'/' cup '/' union '|  { return lisp('∪',a) }
Intersection  = a:CompAtomic|2..,'∩'/' cap '/' intersect '|  { return lisp('∩',a) }
RelativeComp  = a:CompAtomic|2..,'∖'/' setminus '|  { return lisp('∖',a) }
// we don't want to have to do e.g. A∩(B°) instead of just A∩B°
CompAtomic    = Complement / Atomic
Complement    = a:Atomic ('°'/' complement') { return lispUnary('°',a) }

// algebraic expressions
Algebraic = Sum / Product

Sum       = a:Product b:([-+] Product)+                   { return lispSum(a,b)     }
Product   = a:(Recip/Inversed/Negated)|1..,'⋅'/' cdot '|  { return lisp('⋅',a)      }
Recip     = a:Atomic ('⁻'/' recip')                       { return lispUnary('⁻',a) }
Inversed  = a:'/'? b:Exp                                  { return lispUnary(a,b)   }    
Negated   = a:'-'? b:Exp                                  { return lispUnary(a,b)   }
Exp       = a:Atomic|1..,'^'|                             { return lisp('^',a)      } 

// morally atomic (do not require parentheses)
Atomic = Parenthesized / EFA / Prefix / Tuple / Symbol / Number

// For convenience we define 𝜆P(k) to be (λ P k) and replace λ with "LDE EFA"
// as a shortcut
EFA = 'λ' a:Symbol '(' b:Expression ')' { return `(λ ${a} ${b})` }

Tuple = '⟨' b:(  @Expression|1..,comma| )+ '⟩' { return lispPrefix('tuple',b) }
Prefix = a:Symbol b:( '(' @Expression|..,comma| ')' )+ { return lispPrefix(a,b) }
Parenthesized = '(' @Expression ')' 

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
Symbol "Symbol" = $( '≡' / 
                     !([0-9]/ReservedWords)
                     [^-\][()⟨⟩ \t\n✦{},.:+⋅/^=<≤¬⇒⇔|∀∃∩∪×∈⊆∖⁻°∧∨≡]+ )
BindingSymbol = ('∃!'/'exists unique ') { return '∃!' } /
                ('∀'/'forall '/'for all ') { return '∀' } /
                ('∃'/'exists ') { return '∃' } 

// punctuation
comma  =  ','
period =  '.'
__  = [ \t\n\r]+
_   = [ \t\n\r]*

ReservedChars = $([+⋅/^=<≤¬⇒⇔|∀∃∩∪×∈⊆∖⁻°∧∨≡σλ])
ReservedWords = ' or '/' and '/' loves '/' cdot '/' complement'/
                ' setminus '/' cap '/' cup '/' times '/' lt '/' leq '/
                ' in '/' subset '/' implies '/' iff '