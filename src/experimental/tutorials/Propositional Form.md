<span hidden>$\newcommand{\lc}[1]{\left\\{~{#1}~\right\\}}\newcommand{\:}{\colon\hspace{-0.2em}}\newcommand{\implies}{\Rightarrow}\newcommand{\iff}{\Leftrightarrow}\DeclareMathOperator{\bbN}{\mathbb{N}}\DeclareMathOperator{\Let}{Let}\DeclareMathOperator{\Dec}{Declare}\DeclareMathOperator{\Bod}{Body}\DeclareMathOperator{\Som}{ForSome}\newcommand{\xor}{\text{ or }}\newcommand{\xand}{\text{ and }}$</span>
One way to view and use Lurch (but not the only way), is as a tool for determining whether a user's document asserts something that is true about every mathematical system, i.e., as a tool that is completely agnostic about what topic or branch of mathematics one might be considering, by simply checking if the user's document (or portion of it) is a tautological assertion about a mathematical system.

More precisely, let us say that a _mathematical system_ is a pair $(T,S)$ where $S$ is any set and $T\subseteq S$. Call the elements of $S$ the _statements_ of the system and the elements of $T$ the _theorems_. A user's document (an Environment) can then be viewed as making an assertion about any such system. 

For example, an Environment like $\lc{\\:P~Q}$ can be viewed as asserting "either $P$ is not a theorem or else $Q$ is a theorem", i.e., $P\notin T$ or $Q\in T$. When $P=Q$ this assertion is clearly true about every mathematical system regardless of what $T$, $S$, or $P$ might be.  This example generalizes to arbitrary nested Environments by assigning a propositional form to the entire environment. Lurch can then check if that proposition is a tautology. 

### Propositional Forms for Outermost Expressions

Each Lurch LC outermost Expression and Declaration is assigned a propositional form consisting of a single propositional variable so that two expressions that are supposed to have the same mathematical meaning have the same propositional form. That variable can be a letter, a string, an integer, or anything else as long as it satisfies the above condition.

Then one way to compute the propositional form of an environment is to ignore trailing givens, replace each outermost expression and declaration with some propositional form,convert environments to parentheses, negate every given, insert the operator `or` after each `given`, and the operator `and`after each claim (right associative).

For example, the propositional form of an LC, $L$, whose putdown representation is
```
{ :{ :{ :A B } { :A C } } :{ :B C D } C D }
```
could be
```
¬(¬(¬A or B) or ¬A or C) or ¬(¬B or (C and D)) or (C and D)
```
This is the propositional form produced by the LC extension `L.toEnglish()`, so we will call this the _English propositional form_. 

## Conjunctive Normal Form (CNF)

To check if the propositional form of an LC is a classical tautology we use a boolean satisfiability checker called `satSolve`.  This requires first converting the proposition to _conjunctive normal form_ (CNF), i.e., a conjunction of disjunctions of atomic propositions and their negations.  Every proposition like the example shown above can be converted to CNF form by 
1. Distributing the nots (¬) using DeMorgan's Law
2. Distributing the `or`s over the `and`s
3. Introducing switch variables when necessary.

### Easy CNF (Algebraic Form)

Computing the CNF by hand for even a relatively simple proposition such as the one in the example above can be tedious and time consuming. To simplify this process we define another (equivalent) propositional form called the _algebraic form_ of an LC environment. This is the expression obtained by replacing `or`'s by multiplication, `and`'s by addition, and writing negations as a `:` preceeding an atomic proposition in the English propositional form. This is computed by the LC extension `L.toAlgebraic()`.

For the above example, the algebraic form is then just
```
:(:(:AB):AC):(:B(C+D))(C+D)
```
To convert this to CNF form is now a matter of expanding this into a polynomial because we chose to assign `or` to multiplication and `and` to addition (as opposed to choosing it the other way around in which case the we would have to factor rather than expand).  

As described above, the first step is to first distribute the not's `:` to obtain the _simplified algebraic form_.  This is what is produced by calling `L.toAlgebraic('simplify')`.  By DeMorgan, distributing a `:` converts sums to products and products to sums, and double negatives `::` cancel out.  So for our example the simplified form would be
```
(:AB+(A+:C))(B+:C:D)(C+D)
```

Finally, we expand this polynomial, introducing switch variables as needed to minimize the number of terms.  This is called the _cnf algebriac form_ and is computed by the extension `L.toAlgebraic('cnf')`.  For our example the cnf algebraic form would then be
```
(:AB+(A+:C))(B+:C:D)(C+D) ≡ (:AB+(A+:C))(BC+BD+:C:DC+:C:DD)
                          ≡ 𝒵₁(:AB+(A+:C))+:𝒵₁(BC+BD+:C:DC+:C:DD)
                          ≡ 𝒵₁:AB+𝒵₁A+𝒵₁:C+:𝒵₁BC+:𝒵₁BD+:𝒵₁:C:DC+:𝒵₁:C:DD
```
where ≡ indicates the two expressions are equisatisfiable.

### Integer Form CNF

The booleans satifiability checker we use requires its input to be a cnf to be an array of arrays of non-zero integers, where each positive integer represents an atomic proposition, a negative one the corresponding negation.  The inner arrays represent disjunctions, and the outer array conjunctions. We call this the _integer propositional form_.  It is computed by the extension `L.cnf()`.

Thus, for our example above, assigning the integers `A=1`, `B=2`, `C=3`, `D=4` and `𝒵₁=7` the resulting integer proposition form is
```
[
 [ 7, -1, 2 ],
 [ 7, 1 ],
 [ 7, -3 ],
 [ -7, 2, 3 ],
 [ -7, 2, 4 ],
 [ -7, -3, -4, 3 ],
 [ -7, -3, -4, 4 ]
]
```