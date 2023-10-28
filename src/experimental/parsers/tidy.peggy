///////////////////////////////////////////////////////////////////////////
// Tidy Peggy Grammar and Parser
//
// A peggy grammar definition file to generate a parser for converting
// putdown expressions to a asciimath syntax.

{{

  // Convert // and (--- ) comments to ➤ comments
  const tidy =  s => {
    // convert all js comments to asciimath comments
    let ans = s.replace(/\/\/\s*([^\n]+)(\n|$)/g,`➤ "$1"$2`)
    ans = ans.replace(/\(---(.+)\)/g,`➤$1`)
    return ans
  }

  // remove empty arrays from a nested array
  const clean = A => { 
    return A.map( c => { 
      return (Array.isArray(c) && c.length) ? clean(c) : c 
      } ).filter( e => !(Array.isArray(e) && e.length===0) )
  }
  
  // replace the commas in a sequence with spaces
  const spaced = s => s.replace(/,/g, ' ') 

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
  input = tidy(input)
  
  // uncomment the following for debugging
  // say(input)
}

// The start rule for a Peggy grammar is the first rule.  For us, it's a
// sequence of LCs.
LCs = 
_ a:(Meta / Given / Declaration / Equivalence / Environment / Expression)|..,__| _ 
  { return a.join(' ') }

// A single LC
LC "LC" = _ @( Meta / Given / Declaration / Equivalence / Environment / Expression) _

// givens
Given "Given" = (':' / 'Assume'i __ ) 
  a:(Declaration / Equivalence / Environment / Expression)
  { return ':'+a }

// equivalence
Equivalence "Equivalence" = '{' _ a:( Declaration / Environment / Expression ) _ '≡' _
                    b:( Declaration / Environment / Expression ) _  '}'
  { return `{ { :${a} ${b} } { :${b} ${a} } }` }

// environments
Environment "Environment" = 
  '{' _ a:( Meta / Declaration / Given / Environment / Expression )|..,__| _ '}'
  { return `{ ${a.join(' ')} }` }

// things it searches for and replaces up front
Meta = Putdown / Comment / Shorthand

// unprocessed putdown notation (cannot include // comments)
Putdown = '«' @$([^»]*) '»'  // todo: add a non-unicode way to do this

// insert a comment that gets echoed
Comment "Comment" = ('Comment'i / '➤') __ a:StringLiteral { return `(--- ${a})` }
// String Literals for comments
StringLiteral = $('"' [^"]* '"')

// Shorthand symbols that will be post-processed
Shorthand = BIH / Ruleset / Rule / Thm

BIHLabel = 'since'i / 'because'i / 'by'i / 'Recall'i
BIH = BIHLabel { return '>>' }
RulesetLabel = 'Rules'i / 'Axioms'i / 'Givens'i
Ruleset = RulesetLabel ':'? { return 'rules>' }
RuleLabel = 'Rule'i / 'Axiom'i / 'Given'i / 'Definition'i
Rule = RuleLabel ':'? { return 'rule>' }
ThmLabel = 'Theorem'i / 'Thm'i / 'Lemma'i / 'Corollary'i
Thm = ThmLabel ':'? { return 'thm>' }

// declarations
Declaration "Declaration" = ForSome / Let

ForSome = body:Expression __ 'for'i __ 'some'i __ a:SymbolSeq 
          { return `[${spaced(a)}, ${body}]` }
Let = 'Let'i __ a:SymbolSeq __ ('be'i __)? 'such'i __ 'that'i __ b:Expression 
       { return `[${spaced(a)}, ${b}]` } /
      'Let'i __ a:SymbolSeq { return `[${spaced(a)}]` }

// expressions
Expression "Expression" = EFA / Binding / Prop  // get's Stuff from Not

// binding expressions
Binding = a:BindingSymbol b:SymbolSeq period c:Expression
          { return `(${a} ${b}, ${c})` }

// propositional expressions
Prop = Iff / Implies / And / Or / Not

Iff        = a:Implies|1..,'⇔'/' iff '|    { return lisp('⇔',a) }
Implies    = a:Or|1..,'⇒'/' implies '|     { return lisp('⇒',a) }
Or         = a:And|1..,' or '/'∨'|         { return lisp('or',a) }
And        = a:Not|1..,' and '/'∧'|        { return lisp('and',a) }
Not        = a:('¬'/'not ')? b:Stuff       { return (a==='not ')
                                                     ?lispUnary('¬',b)
                                                     :lispUnary(a,b)
                                           }

// stuff that might be a prop
Stuff = Relation / Thing

// relations
Relation = Subset / ElementOf / Divides / Leq / LessThan / Equation / Loves

Subset     = a:Thing|2..,'⊆'/' subset '/' subseteq '| { return lisp('⊆',a) }
ElementOf  = a:Thing ('∈'/' in ') b:Thing             { return lispBinary('∈',a,b) }
Divides    = a:Thing '|' b:Thing                      { return lispBinary('|',a,b) }  
Leq        = a:Thing|2..,'≤'/' leq '|                 { return lisp('≤',a) }
LessThan   = a:Thing|2..,'<'/' lt '|                  { return lisp('<',a) }
Equation   = a:Thing|2..,'='|                         { return lisp('=',a) }
Loves      = a:Thing|2..2,' loves '|                  { return lisp('loves',a) }

// things to relate
Thing = Set / Algebraic

// sets
Set = CartProd / Union / Intersection / RelativeComp / Complement

CartProd      = a:CompAtomic|2..,'×'/' times '|  { return lisp('×',a) }
Union         = a:CompAtomic|2..,'∪'/' cup '/' union '|  { return lisp('∪',a) }
Intersection  = a:CompAtomic|2..,'∩'/' cap '/' intersect '|  { return lisp('∩',a) }
RelativeComp  = a:CompAtomic|2..,'∖'/' setminus '|  { return lisp('∖',a) }
// we don't want to have to do e.g. A∩(B⁻) instead of just A∩B⁻
CompAtomic    = Complement / Atomic
Complement    = a:Atomic ('⁻'/' complement') { return lispUnary('⁻',a) }

// algebraic expressions
Algebraic = Sum / Product

Sum       = a:Product b:([-+] Product)+               { return lispSum(a,b)   }
Product   = a:(Inversed/Negated)|1..,'⋅'/' cdot '|    { return lisp('⋅',a)    }
Inversed  = a:'/'? b:Exp                              { return lispUnary(a,b) }    
Negated   = a:'-'? b:Exp                              { return lispUnary(a,b) }
Exp       = a:Atomic|1..,'^'|                         { return lisp('^',a)    } 

// morally atomic (do not require parentheses)
Atomic = Parenthesized / Prefix / Symbol / Number

// For convenience we define 𝜆P(k) to be (λ P k) and replace λ with "LDE EFA"
// as a shortcut
EFA = 'λ' a:Symbol '(' b:Expression ')' { return `(λ ${a} ${b})` }

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
SymbolSeq = a:(Symbol/Number)|1..,[\s]| { return a.join(' ') }
Symbol "Symbol" =  $( !([0-9]/ReservedWords)
                      [^-\][() \t\n✦{},.:+⋅/^=<≤¬⇒⇔|∀∃∩∪×∈⊆∖⁻∧∨≡]+ )
BindingSymbol = ('∃!'/'exists unique ') { return '∃!' } /
                ('∀'/'forall '/'for all ') { return '∀' } /
                ('∃'/'exists ') { return '∃' } 


// punctuation
comma  =  ','
period =  '.'
__  = [ \t\n\r]+
_   = [ \t\n\r]*

ReservedChars = $([+⋅/^=<≤¬⇒⇔|∀∃∩∪×∈⊆∖⁻∧∨≡σλ])
ReservedWords = ' or '/' and '/' loves '/' cdot '/' complement'/
                ' setminus '/' cap '/' cup '/' times '/' lt '/' leq '/
                ' in '/' subset '/' implies '/' iff '