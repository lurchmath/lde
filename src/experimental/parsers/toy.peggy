///////////////////////////////////////////////////////////////////////////
// Toy Peggy Grammar and Parser
//
// A peggy grammar definition file to generate a parser for converting more
// natural math notation into putdown, which can then be converted to an LC. 
//
// Note: for now we encode negative numbers as compound expressions e.g. -3 is
// encoded as (- 3). We also encode rational fractions as a product of the
// numerator times the multiplicative inverse of the denominator where / is the
// unary inverse operator, e.g. 2/3 parses as (⋅ 2 (/ 3)).  This is consistent
// with the way negation is handled.  We do not allow expresions like '/2' to
// represent one half. We do not have an Integer or Rational constant type for
// this reason.
//
// TODO: 
//  * add x≠y but have it parse as (¬ (= x y)), & same for other negated ops
//  * add f:A→B, ∘, injective, surjective, bijective, ^inv, etc.
//  * Integrate Declare() with the parser creation.  For example, if we want to
//    Declare reserved symbols like < or = at the top of the document we don't
//    want the parser to try to parse them as infix operators at that point
//    Idea: make it possible to Declare the constants both syntactically and
//    semantically at the same time.
//  * discuss if it makes sense to just have a meta-grammar that first
//    reads the user's document and finds 'parsing directives' and then
//    generates the PEG grammar to use to make the parser which is then used to 
//    parse the document. 
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
  //   * delete comments (but leave any \n's to keep the line counts right)
  input = input.replace(/\/\/.*(\n|\r|$)/g, '\n')
  //   * Replace tabs with a space
  input = input.replace(/\t/g, ' ')
  //   * shrink consecutive spaces to a single space
  input = input.replace(/ ( *)/g,' ') 
  //   * remove spaces around reserved infix ops not inside literal putdown so
  //     the parser doesn't have to find and avoid them
  input = input.replace(/(?<!«[^«»]*)\s*([,.+⋅/^=<≤⇒⇔|∩∪×∈⊆∖])\s*(?![^«»]*»)/g,'$1')
  //   * same for prefix ops
  input = input.replace(/(?<!«[^«»]*)([-({∀∃])\s*(?![^«»]*»)/g,'$1')
  //   * same for postfix ops
  input = input.replace(/(?<!«[^«»]*)\s*([⁻)}])(?![^«»]*»)/g,'$1')
  //   * replace all '/' with '⋅/'
  input = input.replace(/(?<!«[^«»]*)\/(?![^«»]*»)/g,'⋅/')
  
  // uncomment the following for debugging
  // say(input)
}

// The start rule for a Peggy grammar is the first rule.  For us, it's an LC.
LC = _ @( Meta / Given / Declaration / Equivalence / Environment / Expression) _

// givens
Given = (':' / 'Assume'i __ ) 
        a:(Declaration / Equivalence / Environment / Expression)
        { return ':'+a }

// equivalence
Equivalence = '{' _ a:( Declaration / Environment / Expression ) _ '≡' _
                    b:( Declaration / Environment / Expression ) _  '}'
  { return `{ { :${a} ${b} } { :${b} ${a} } }` }

// environments
Environment = 
  '{' _ a:( Meta / Declaration / Given / Environment / Expression )|..,__| _ '}'
  { return `{ ${a.join(' ')} }` }

// things it searches for and replaces up front
Meta = Putdown / BIH / Comment / Thm

// unprocessed putdown notation (cannot include // comments)
Putdown = '«' @$([^»]*) '»'

// flag the next environment as a BIH
BIH = 'Recall'i { return '>>' }

// synonyms for theorems
ThmLabel = 'Theorem'i / 'Thm'i / 'Lemma'i / 'Corollary'i

// flag the next environment as a BIH
Thm = ThmLabel ':'? { return 'thm>' }

// String Literals for comments
StringLiteral = $('"' [^"]* '"')

// insert a comment that gets echoed
Comment = ('Comment'i / '➤') __ a:StringLiteral { return `(--- ${a})` }

// declarations
Declaration = ForSome / Declare / Let

ForSome = body:Expression __ 'For'i __ 'some'i __ a:SymbolSeq 
          { return `[${spaced(a)}, ${body}]` }
Declare = 'Declare'i __ a:DeclareSeq { return `:[${a}]` }
Let = 'Let'i __ a:SymbolSeq __ ('be'i __)? 'such'i __ 'that'i __ b:Expression 
       { return `[${spaced(a)}, ${b}]` } /
      'Let'i __ a:SymbolSeq { return `[${spaced(a)}]` }

// expressions
Expression = Binding / Prop // get's Stuff from Not

// binding expressions
Binding = a:BindingSymbol b:SymbolSeq period c:Expression
          { return `(${a} ${b}, ${c})` }

// propositional expressions
Prop = Iff / Implies / And / Or / Not

Iff        = a:Implies|1..,'⇔'|              { return lisp('⇔',a) }
Implies    = a:Or|1..,'⇒'|                   { return lisp('⇒',a) }
Or         = a:And|1..,(' or '/'∨')|         { return lisp('or',a) }
And        = a:Not|1..,(' and '/'∧')|        { return lisp('and',a) }
Not        = a:'¬'? b:Stuff                  { return lispUnary(a,b) }

// stuff that might be a prop
Stuff = Relation / Thing

// relations
Relation = Subset / ElementOf / Divides / Leq / LessThan / Equation / Loves

Subset     = a:Thing|2..,'⊆'|                { return lisp('⊆',a) }
ElementOf  = a:Thing '∈' b:Thing             { return lispBinary('∈',a,b) }
Divides    = a:Thing '|' b:Thing             { return lispBinary('|',a,b) }  
Leq        = a:Thing|2..,'≤'|                { return lisp('≤',a) }
LessThan   = a:Thing|2..,'<'|                { return lisp('<',a) }
Equation   = a:Thing|2..,'='|                { return lisp('=',a) }
Loves      = a:Thing|2..2,' loves '|         { return lisp('loves',a) }

// things to relate
Thing = Set / Algebraic

// sets
Set = CartProd / Union / Intersection / RelativeComp / Complement

CartProd      = a:CompAtomic|2..,'×'|        { return lisp('×',a) }
Union         = a:CompAtomic|2..,'∪'|        { return lisp('∪',a) }
Intersection  = a:CompAtomic|2..,'∩'|        { return lisp('∩',a) }
RelativeComp  = a:CompAtomic|2..,'∖'|        { return lisp('∖',a) }
// we don't want to have to do e.g. A∩(B⁻) instead of just A∩B⁻
CompAtomic    = Complement / Atomic
Complement    = a:Atomic '⁻'                 { return lispUnary('⁻',a) }

// algebraic expressions
Algebraic = Sum / Product

Sum       = a:Product b:([-+] Product)+      { return lispSum(a,b) }
Product   = a:(Inversed/Negated)|1..,'⋅'|    { return lisp('⋅',a) }
Inversed  = a:'/'? b:Exp                     { return lispUnary(a,b) }    
Negated   = a:'-'? b:Exp                     { return lispUnary(a,b) }
Exp       = a:Atomic|1..,'^'|                { return lisp('^',a) } 

// morally atomic (do not require parentheses)
Atomic = Parenthesized / Prefix / Symbol / Number

Prefix = a:Symbol b:( '(' @Expression|..,comma| ')' )+ { return lispPrefix(a,b) }
Parenthesized = '(' @Expression ')'

// while we probably will never use a number or reserved symbol as a bound var, 
// we might Declare one to be a constant, e.g. Peano or ops
// TODO: try to unify the lists of reserved symbols in one place
DeclareSeq = a:(Symbol/Number/[+⋅/^=<≤¬⇒⇔|∀∃∩∪×∈⊆∖⁻∧∨≡])|1..,comma| { return a.join(' ') }
// numbers
Number  = Decimal / Natural
Decimal = $( Natural '.' [0-9]+ )
Natural = $( [1-9][0-9]* / '0' )

// Symbols can't start with a digit or contain constants
SymbolSeq = a:Symbol|1..,comma| { return a.join(',') }
Symbol "Symbol" =  $( !([0-9]/'or'/'and'/'loves') 
                      [^-\][() \t\n✦{},.:+⋅/^=<≤¬⇒⇔|∀∃∩∪×∈⊆∖⁻∧∨≡]+ )  
BindingSymbol = '∃!'/[∀∃]

// punctuation
comma  =  ','
period =  '.'
__ "mandatory whitespace" = [ \t\n\r]+
_  "optional whitespace"  = [ \t\n\r]*