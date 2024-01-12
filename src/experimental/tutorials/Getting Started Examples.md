<span hidden>$\newcommand{\lc}[1]{\left\\{~{#1}~\right\\}}\newcommand{\:}{\colon\hspace{-0.2em}}\newcommand{\implies}{\Rightarrow}\newcommand{\iff}{\Leftrightarrow}\DeclareMathOperator{\bbN}{\mathbb{N}}\DeclareMathOperator{\Let}{Let}\DeclareMathOperator{\Dec}{Declare}\DeclareMathOperator{\Bod}{Body}\DeclareMathOperator{\Som}{ForSome}\newcommand{\xor}{\text{ or }}\newcommand{\xand}{\text{ and }}\newcommand{\lode}{\mathbb{LODE}}$</span>
Let's illustrate the features of this software with some hands-on examples in $\lode$. 

To run $\lode$ from the `experimental` folder enter the command
```
node lode
```
This will show you the welcome message and prompt.
```
Welcome to 𝕃𝕠𝕕𝕖 - the Lurch Node app
(type .help for help)
▶︎ 
```
## Example 1: There is only one Mars

Let's start by making a simple document. We will call it `doc`. The simplest kind of document a user can provide is a string. Let's say we want to prove that if two things are both the planet `Mars`, they must be the same thing.  We might start with something like this.
```js
▶︎ doc = `{ x is Mars   y is Mars   x = y  }`
{ x is Mars   y is Mars  x = y  }
▶︎ doc=$(doc)
{ (is x Mars) (is y Mars) (= x y) }
▶︎ interpret(doc)
{ :Declare[𝜆 ➤] (is x Mars) (is y Mars) (= x y) }
▶︎ validate(doc)
{ :Declare[𝜆 ➤] (is x Mars)✗ (is y Mars)✗ (= x y)✗ }✗
```
The command `$()` parses a string using the Lurch math parser and creates the corresponding LC, which is echoed back in putdown notation. The parser recognizes `=` and `is` as infix operators so in this case it creates an environment with three children, each of which is an expression. 

Every document has to be interpreted before validating, which in this case only adds the system declarations of `𝜆` and `➤`, which are reserved symbols.  Validation does not know or assume anything at all about `Mars` or `=` or `is`, so it shrugs and marks this with ✗ to indicate that the claims are `indeterminate` - Lurch cannot determine that the given reasoning is correct from the information given.  So we need to tell it more.

The first thing we might tell it is that `Mars`, `is`, and `=` are meant to be constants, not variables.  To do this we `Declare` them, which must be on a line by itself.  Since it is hard to edit multiline text strings at the command prompt, instead we define the `doc` string in `initproofs.js` and use the `initialize()` command to load it into $\lode$.
```js
// in file initproofs.js:
doc = `
{ 
  Declare Mars is =
  x is Mars
  y is Mars
  x = y
}`
```
Loading it into $\lode$.
```js
▶︎ initialize()
Loading proofs ...
done! (0 ms)

▶︎ doc
{ 
  Declare Mars is =
  x is Mars
  y is Mars
  x = y
}

▶︎ doc=$(doc)
{
  declare>
  :Let[Mars is =]
  (is x Mars)
  (is y Mars)
  (= x y)
}

▶︎ interpret(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Mars is =]
  (is x Mars)
  (is y Mars)
  (= x y)
}

▶︎ validate(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Mars is =]
  (is x Mars)✗
  (is y Mars)✗
  (= x y)✗
}✗
```
Parsing the original string produces a shorthand `declare>` which `interpret()` then uses to change the declaration into a `Declare` type. Naturally, Lurch still cannot certify this as valid because it can't know if any of the three claims are valid. Indeed, since we don't know anything about `x` or `y`, we can't certify that they are both `Mars`.  Instead, what we probably intend here is to conclude that assuming `x is Mars` and `y is Mars` we could conclude that `x=y`.  So we need to tell Lurch that the first two statements are assumptions.
```js
▶︎ doc
{ 
  Declare Mars is =
  Assume x is Mars
  Assume y is Mars
  x = y
}

▶︎ doc = $(doc)
{
  declare>
  :Let[Mars is =]
  :(is x Mars)
  :(is y Mars)
  (= x y)
}

▶︎ interpret(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Mars is =]
  :(is x Mars)
  :(is y Mars)
  (= x y)
}

▶︎ validate(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Mars is =]
  :(is x Mars)
  :(is y Mars)
  (= x y)✗
}✗
```
Now it only tries to check our claim that `x=y` because we told it to simply assume the other two statements.  But we still haven't told Lurch any facts about `Mars` for it to conclude this definitively.  So it is still marking the result as `indeterminate`. Let's give it a rule that it can assume to successfully validate this.
```js
▶︎ doc
{ Declare Mars = is
  Rule: :{ :W is Mars :V is Mars W = V }
  Assume x is Mars
  Assume y is Mars
  x = y
}

▶︎ doc=$(doc)
{
  declare>
  :Let[Mars = is]
  rule>
  :{ :(is W Mars) :(is V Mars) (= W V) }
  :(is x Mars)
  :(is y Mars)
  (= x y)
}

▶︎ interpret(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Mars = is]
  :{ :(is W Mars) :(is V Mars) (= W V) }
  :(is x Mars)
  :(is y Mars)
  (= x y)
}

▶︎ validate(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Mars = is]
  :{ :(is W Mars) :(is V Mars) (= W V) }
  :(is x Mars)
  :(is y Mars)
  (= x y)✔︎
}✔︎

▶︎ doc.report(all)
  {
 0  :Declare[𝜆 ➤]
 1  :Declare[Mars = is]
 2  :{ :(is W Mars) :(is V Mars) (= W V) }❲Rule❳
 3  :{ :(is x Mars) :(is y Mars) (= x y) }❲Inst❳
 4  :(is x Mars)
 5  :(is y Mars)
 6  (= x y)✔︎
  }✔︎
```
Here we have specified a rule that tells Lurch to assume that whenever someone assumes both `W is Mars` and `V is Mars`, it can conclude that `W=V` (here we use the abbreviation `:` for `Assume`).  Now Lurch can mark this document and the claims it contains as `valid` and mark them with a green check.  Using the `.report(all)` command we can see that line 2 has been marked as a `Rule` by interpretation (indicated by the `Rule` suffix), and validation then created the instantiation of that rule on line 3 (indicated by the `Inst` suffix).  Note that Lurch can also now check that `y=x` as well, by instantiating it the other way
```js
▶︎ doc.report(all)
  {
 0  :Declare[𝜆 ➤]
 1  :Declare[Mars = is]
 2  :{ :(is W Mars) :(is V Mars) (= W V) }❲Rule❳
 3  :{ :(is y Mars) :(is x Mars) (= y x) }❲Inst❳
 4  :{ :(is x Mars) :(is y Mars) (= x y) }❲Inst❳
 5  :(is x Mars)
 6  :(is y Mars)
 7  (= x y)✔︎
 8  (= y x)✔︎
  }✔︎
```

## Example 2: A famous syllogism

Let's prove the famous syllogism
```
All men are mortal.
Socrates is a man.
Therefore, Socrates is mortal.
```
We might try to do something like this
```js
▶︎ doc
`{ 
  Declare Socrates mortal man is ⇒ ∀

  Assume forall x. x is a man ⇒ x is mortal
  Assume Socrates is a man
  Socrates is mortal
}
`
▶︎ validate($(doc))
{
  :Declare[𝜆 ➤]
  :Declare[Socrates mortal man is ⇒ ∀]
  :(∀ x , (⇒ (is x man) (is x mortal)))
  :(is Socrates man)
  (is Socrates mortal)✗
}✗
```
Lurch marks this as indeterminate because it doesn't know anything about `∀` or `⇒`.  So let's tell it the relevant facts.
```js
▶︎ doc
`{ 
  Declare Socrates mortal man is ⇒ ∀

  Rules:
  {
    :{ :W⇒V :W V }
    :{ :(∀y.𝜆P(y)) 𝜆P(z) }
  }
  Assume forall x. x is a man ⇒ x is mortal
  Assume Socrates is a man
  Socrates is mortal
}`

▶︎ doc=$(doc)
{
  declare>
  :Let[Socrates mortal man is ⇒ ∀]
  rules>
  { :{ :(⇒ W V) :W V } :{ :(∀ y , (λ P y)) (λ P z) } }
  :(∀ x , (⇒ (is x man) (is x mortal)))
  :(is Socrates man)
  (is Socrates mortal)
}

▶︎ interpret(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Socrates mortal man is ⇒ ∀]
  :{ :(⇒ W V) :W V }
  :{ :(∀ y₁ , (𝜆 P y₁)) (𝜆 P z) }
  :(∀ x , (⇒ (is x man) (is x mortal)))
  :(is Socrates man)
  (is Socrates mortal)
}

▶︎ validate(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Socrates mortal man is ⇒ ∀]
  :{ :(⇒ W V) :W V }
  :{ :(∀ y₁ , (𝜆 P y₁)) (𝜆 P z) }
  :(∀ x , (⇒ (is x man) (is x mortal)))
  :(is Socrates man)
  (is Socrates mortal)✗
}✗

▶︎ validate(doc).report(all)
  {
 0  :Declare[𝜆 ➤]
 1  :Declare[Socrates mortal man is ⇒ ∀]
 2  :{ :(⇒ W V) :W V }❲Rule❳
 3  :{ :(∀ x₁ , (𝜆 P x₁)) (𝜆 P z) }❲Rule❳
 4  :{
      :(∀ x₁ , (⇒ (is x₁ man) (is x₁ mortal)))
      (⇒ (is z man) (is z mortal))
    }❲Part❳
 5  :(∀ x₁ , (⇒ (is x₁ man) (is x₁ mortal)))
 6  :(is Socrates man)
 7  (is Socrates mortal)✗
  }✗
```
Here we have specified two rules by wrapping them in `Rules: { }`. Parsing and interpretation then converts them both to rules as can be seen in the report.  But this proof still fails because the user has supplied insufficient proof. In this sense Lurch behaves like an instructor grading a student's proposed proof, deciding when more explanation and detail is needed before certifying it as a valid proof.

We can expand our proof by explaining that `Socrates is a man ⇒ Socrates is mortal` follows from the second rule.
```js
▶︎ doc
`{ 
  Declare Socrates mortal man is ⇒ ∀

  Rules:
  {
    :{ :W⇒V :W V }
    :{ :(∀y.𝜆P(y)) 𝜆P(z) }
  }
  
  Assume forall x. x is a man ⇒ x is mortal
  Assume Socrates is a man
  
  Socrates is a man ⇒ Socrates is mortal
  
  Socrates is mortal
}`

▶︎ doc=$(doc)

▶︎ validate(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Socrates mortal man is ⇒ ∀]
  :{ :(⇒ W V) :W V }
  :{ :(∀ y₁ , (𝜆 P y₁)) (𝜆 P z) }
   
  :(∀ x , (⇒ (is x man) (is x mortal)))
  :(is Socrates man)
  (⇒ (is Socrates man) (is Socrates mortal))✔︎
  (is Socrates mortal)✔︎
}✔︎

▶︎ doc.report(all)
  {
 0  :Declare[𝜆 ➤]
 1  :Declare[Socrates mortal man is ⇒ ∀]
 2  :{ :(⇒ W V) :W V }❲Rule❳
 3  :{
      :(⇒ (is Socrates man) (is Socrates mortal))
      :(is Socrates man)
      (is Socrates mortal)
    }❲Inst❳
 4  :{ :(∀ x₁ , (𝜆 P x₁)) (𝜆 P z) }❲Rule❳
 5  :{
      :(∀ x₁ , (⇒ (is x₁ man) (is x₁ mortal)))
      (⇒ (is z man) (is z mortal))
    }❲Part❳
 6  :{
      :(∀ x₁ , (⇒ (is x₁ man) (is x₁ mortal)))
      (⇒ (is Socrates man) (is Socrates mortal))
    }❲Inst❳
 1   
12  :(∀ x₁ , (⇒ (is x₁ man) (is x₁ mortal)))
13  :(is Socrates man)
14  (⇒ (is Socrates man) (is Socrates mortal))✔︎
15  (is Socrates mortal)✔︎
  }✔︎
```
Adding the claim that `Socrates is a man ⇒ Socrates is mortal` to our proof causes the instantiation on line 3 and also can now find the value of `z` in the partial instantiation on line 5 to produce the instantiation on line 6. 

So this Aristotlian syllogism is right!

## Example 3: Syllogism, Take 2

Lurch is just a tool, and like all tools can be used in different ways to accomplish the same goal. In the previous example we encoded the syllogism using `∀` and `⇒`, and added the corresponding necessary definitions for those symbols as rules.  But that is not the only way one might encode and validate that syllogism.  Here is a much simpler approach.
```js
▶︎ doc
`{ 
  Declare Socrates mortal man is
  Rule:  :{ :W is a man    W is a mortal }

  Assume Socrates is a man  
  Socrates is mortal
}`

▶︎ doc=$(doc)
{
  declare>
  :Let[Socrates mortal man is]
  rule>
  :{ :(is W man) (is W mortal) }
  :(is Socrates man)
  (is Socrates mortal)
}

▶︎ validate(doc)
{
  :Declare[𝜆 ➤]
  :Declare[Socrates mortal man is]
  :{ :(is W man) (is W mortal) }
  :(is Socrates man)
  (is Socrates mortal)✔︎
}✔︎

▶︎ doc.report(all)
  {
 0  :Declare[𝜆 ➤]
 1  :Declare[Socrates mortal man is]
 2  :{ :(is W man) (is W mortal) }❲Rule❳
 3  :{ :(is Socrates man) (is Socrates mortal) }❲Inst❳
 4  :{ :(is Socrates man) (is Socrates mortal) }❲Inst❳
 5  :(is Socrates man)
 6  (is Socrates mortal)✔︎
  }✔︎
```
Much simpler!  Lurch found the same instantiation twice, once due to line 5 and once due to line 6, but it was trivial for it to validate this without any additional lines of proof needed from the user.

The difference between this example and the previous one illustrates an important aspect of using Lurch. Lurch is a tool, and like any tool it can be weilded incorrectly and inefficiently, or expertly with great elegance. There are many different ways to encode a particular mathematical system, concept, or proof. Instructors who are designing rule libraries for their course and users who are writing proofs can have a big impact on whether a particular topic is correctly encoded, how efficient it is, how easy to use, and so on.  Just like everything else in mathematics, Lurch still requires the skill and experience of its authors to use it correctly and elegantly.  It doesn't change how we do mathematics beyond the additional features it provides.