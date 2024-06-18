
## Logic

### Rule 1

 * Intended LaTeX: `P\text{ and }Q` $P\text{ and }Q$
 * Lurch notation 1: `P and Q`
 * Converting Lurch notation 1 to LaTeX: ` P\text{ and } Q` $P\text{ and } Q$ :warning:
 * Converting Lurch notation 1 to putdown: `(and P Q)`
 * Lurch notation 2: `P∧Q`
 * Converting Lurch notation 2 to LaTeX: ` P\text{ and } Q` $P\text{ and } Q$ :warning:
 * Converting Lurch notation 2 to putdown: `(and P Q)`

### Rule 2

 * Intended LaTeX: `P\text{ or }Q` $P\text{ or }Q$
 * Lurch notation 1: `P or Q`
 * Converting Lurch notation 1 to LaTeX: ` P\text{ or } Q` $P\text{ or } Q$ :warning:
 * Converting Lurch notation 1 to putdown: `(or P Q)`
 * Lurch notation 2: `P∨Q`
 * Converting Lurch notation 2 to LaTeX: ` P\text{ or } Q` $P\text{ or } Q$ :warning:
 * Converting Lurch notation 2 to putdown: `(or P Q)`

### Rule 3

 * Intended LaTeX: `\neg P` $\neg P$
 * Lurch notation 1: `not P`
 * Converting Lurch notation 1 to LaTeX: `\neg P` $\neg P$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(¬ P)`
 * Lurch notation 2: `¬P`
 * Converting Lurch notation 2 to LaTeX: `\neg P` $\neg P$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(¬ P)`

### Rule 4

 * Intended LaTeX: `P\Rightarrow Q` $P\Rightarrow Q$
 * Lurch notation 1: `P implies Q`
 * Converting Lurch notation 1 to LaTeX: ` P\Rightarrow Q` $P\Rightarrow Q$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(⇒ P Q)`
 * Lurch notation 2: `P⇒Q`
 * Converting Lurch notation 2 to LaTeX: ` P\Rightarrow Q` $P\Rightarrow Q$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(⇒ P Q)`

### Rule 5

 * Intended LaTeX: `P\Leftrightarrow Q` $P\Leftrightarrow Q$
 * Lurch notation 1: `P iff Q`
 * Converting Lurch notation 1 to LaTeX: ` P\Leftrightarrow Q` $P\Leftrightarrow Q$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(⇔ P Q)`
 * Lurch notation 2: `P⇔Q`
 * Converting Lurch notation 2 to LaTeX: ` P\Leftrightarrow Q` $P\Leftrightarrow Q$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(⇔ P Q)`

### Rule 6

 * Intended LaTeX: `\rightarrow\leftarrow` $\rightarrow\leftarrow$
 * Lurch notation 1: `contradiction`
 * Converting Lurch notation 1 to LaTeX: `\rightarrow\leftarrow` $\rightarrow\leftarrow$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `contradiction`
 * Lurch notation 2: `→←`
 * Converting Lurch notation 2 to LaTeX: `\rightarrow\leftarrow` $\rightarrow\leftarrow$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `contradiction`

## Quantifiers and bindings

### Rule 1

 * Intended LaTeX: `\forall` $\forall$
 * Lurch notation 1: `forall `
 * Converting Lurch notation 1 to LaTeX: `\mathrm{forall}` $\mathrm{forall}$ :x:
 * Converting Lurch notation 1 to putdown: `forall`
 * Lurch notation 2: `for all `
 * Converting Lurch notation 2 to LaTeX: `\mathrm{for} \mathrm{all}` $\mathrm{for} \mathrm{all}$ :x:
 * Converting Lurch notation 2 to putdown: `for all`
 * Lurch notation 3: `∀`
 * Converting Lurch notation 3 to LaTeX: SyntaxError: Expected LC, [ \t\n\r], or end of input but "∀" found.
 * Converting Lurch notation 3 to putdown: SyntaxError: Expected " contradiction ", "Axiom", "Axioms", "Corollary", "Definition", "Definitions", "Given", "Givens", "Lemma", "Proof", "Recall", "Rule", "Rules", "Theorem", "Thm", "\"", "because", "since", "«", Comment, Declaration, Environment, Given, [ \t\n\r], or end of input but "∀" found.

### Rule 2

 * Intended LaTeX: `\exists` $\exists$
 * Lurch notation 1: `exists `
 * Converting Lurch notation 1 to LaTeX: `\mathrm{exists}` $\mathrm{exists}$ :x:
 * Converting Lurch notation 1 to putdown: `exists`
 * Lurch notation 2: `∃`
 * Converting Lurch notation 2 to LaTeX: SyntaxError: Expected LC, [ \t\n\r], or end of input but "∃" found.
 * Converting Lurch notation 2 to putdown: SyntaxError: Expected " contradiction ", "Axiom", "Axioms", "Corollary", "Definition", "Definitions", "Given", "Givens", "Lemma", "Proof", "Recall", "Rule", "Rules", "Theorem", "Thm", "\"", "because", "since", "«", Comment, Declaration, Environment, Given, [ \t\n\r], or end of input but "∃" found.

### Rule 3

 * Intended LaTeX: `\exists!` $\exists!$
 * Lurch notation 1: `exists unique `
 * Converting Lurch notation 1 to LaTeX: `\mathrm{exists} \mathrm{unique}` $\mathrm{exists} \mathrm{unique}$ :x:
 * Converting Lurch notation 1 to putdown: `exists unique`
 * Lurch notation 2: `∃!`
 * Converting Lurch notation 2 to LaTeX: SyntaxError: Expected LC, [ \t\n\r], or end of input but "∃" found.
 * Converting Lurch notation 2 to putdown: SyntaxError: Expected " contradiction ", "Axiom", "Axioms", "Corollary", "Definition", "Definitions", "Given", "Givens", "Lemma", "Proof", "Recall", "Rule", "Rules", "Theorem", "Thm", "\"", "because", "since", "«", Comment, Declaration, Environment, Given, [ \t\n\r], or end of input but "∃" found.

### Rule 4

 * Intended LaTeX: `\forall x, x&lt;x+1` $\forall x, x&lt;x+1$
 * Lurch notation 1: `forall x.x&lt;x+1`
 * Converting Lurch notation 1 to LaTeX: `\left(\forall x, \mathrm{x&lt;x}+1\right)` $\left(\forall x, \mathrm{x&lt;x}+1\right)$ :x:
 * Converting Lurch notation 1 to putdown: `(∀ x, (+ x&lt;x 1))`
 * Lurch notation 2: `for all x.x&lt;x+1`
 * Converting Lurch notation 2 to LaTeX: `\left(\forall x, \mathrm{x&lt;x}+1\right)` $\left(\forall x, \mathrm{x&lt;x}+1\right)$ :x:
 * Converting Lurch notation 2 to putdown: `(∀ x, (+ x&lt;x 1))`
 * Lurch notation 3: `∀x.x&lt;x+1`
 * Converting Lurch notation 3 to LaTeX: `\left(\forall x, \mathrm{x&lt;x}+1\right)` $\left(\forall x, \mathrm{x&lt;x}+1\right)$ :x:
 * Converting Lurch notation 3 to putdown: `(∀ x, (+ x&lt;x 1))`

### Rule 5

 * Intended LaTeX: `\exists x, x=2x` $\exists x, x=2x$
 * Lurch notation 1: `exists x.x=2 cdot x`
 * Converting Lurch notation 1 to LaTeX: `\left(\exists x,  x=  2 x\right)` $\left(\exists x,  x=  2 x\right)$ :x:
 * Converting Lurch notation 1 to putdown: `(∃ x, (= x (⋅ 2 x)))`
 * Lurch notation 2: `∃x.x=2⋅x`
 * Converting Lurch notation 2 to LaTeX: `\left(\exists x,  x=  2 x\right)` $\left(\exists x,  x=  2 x\right)$ :x:
 * Converting Lurch notation 2 to putdown: `(∃ x, (= x (⋅ 2 x)))`

### Rule 6

 * Intended LaTeX: `x, x+1` $x, x+1$
 * Lurch notation 1: `x.x+2`
 * Converting Lurch notation 1 to LaTeX: `x, x+2` $x, x+2$ :x:
 * Converting Lurch notation 1 to putdown: `x, (+ x 2)`
 * Lurch notation 2: `x↦x+2`
 * Converting Lurch notation 2 to LaTeX: `x, x+2` $x, x+2$ :x:
 * Converting Lurch notation 2 to putdown: `x, (+ x 2)`

## Algebraic expressions

### Rule 1

 * Intended LaTeX: `\left(x\right)` $\left(x\right)$
 * Lurch notation 1: `(x)`
 * Converting Lurch notation 1 to LaTeX: `\left(x\right)` $\left(x\right)$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `x`

### Rule 2

 * Intended LaTeX: `x+y` $x+y$
 * Lurch notation 1: `x+y`
 * Converting Lurch notation 1 to LaTeX: `x+y` $x+y$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(+ x y)`

### Rule 3

 * Intended LaTeX: `2+x+y` $2+x+y$
 * Lurch notation 1: `2+x+y`
 * Converting Lurch notation 1 to LaTeX: `2+x+y` $2+x+y$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(+ 2 x y)`

### Rule 4

 * Intended LaTeX: `-x` $-x$
 * Lurch notation 1: `-x`
 * Converting Lurch notation 1 to LaTeX: `- x` $- x$ :warning:
 * Converting Lurch notation 1 to putdown: `(- x)`

### Rule 5

 * Intended LaTeX: `1-x` $1-x$
 * Lurch notation 1: `1-x`
 * Converting Lurch notation 1 to LaTeX: `1-x` $1-x$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(+ 1 (- x))`

### Rule 6

 * Intended LaTeX: `x\cdot y` $x\cdot y$
 * Lurch notation 1: `x cdot y`
 * Converting Lurch notation 1 to LaTeX: ` x y` $x y$ :x:
 * Converting Lurch notation 1 to putdown: `(⋅ x y)`
 * Lurch notation 2: `x⋅y`
 * Converting Lurch notation 2 to LaTeX: ` x y` $x y$ :x:
 * Converting Lurch notation 2 to putdown: `(⋅ x y)`

### Rule 7

 * Intended LaTeX: `2\cdot x\cdot y` $2\cdot x\cdot y$
 * Lurch notation 1: `2 cdot x cdot y`
 * Converting Lurch notation 1 to LaTeX: ` 2 x y` $2 x y$ :x:
 * Converting Lurch notation 1 to putdown: `(⋅ 2 x y)`
 * Lurch notation 2: `2⋅x⋅y`
 * Converting Lurch notation 2 to LaTeX: ` 2 x y` $2 x y$ :x:
 * Converting Lurch notation 2 to putdown: `(⋅ 2 x y)`

### Rule 8

 * Intended LaTeX: `1/x` $1/x$
 * Lurch notation 1: `1/x`
 * Converting Lurch notation 1 to LaTeX: ` 1 / x` $1 / x$ :warning:
 * Converting Lurch notation 1 to putdown: `(⋅ 1 (/ x))`

### Rule 9

 * Intended LaTeX: `x^2` $x^2$
 * Lurch notation 1: `x^2`
 * Converting Lurch notation 1 to LaTeX: `x^{2}` $x^{2}$ :x:
 * Converting Lurch notation 1 to putdown: `(^ x 2)`

### Rule 10

 * Intended LaTeX: `x!` $x!$
 * Lurch notation 1: `x factorial`
 * Converting Lurch notation 1 to LaTeX: `x!` $x!$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(! x)`
 * Lurch notation 2: `x！`
 * Converting Lurch notation 2 to LaTeX: `x!` $x!$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(! x)`

## Set Theory

### Rule 1

 * Intended LaTeX: `x\in A` $x\in A$
 * Lurch notation 1: `x in A`
 * Converting Lurch notation 1 to LaTeX: ` x\in A` $x\in A$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(∈ x A)`
 * Lurch notation 2: `x∈A`
 * Converting Lurch notation 2 to LaTeX: ` x\in A` $x\in A$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(∈ x A)`

### Rule 2

 * Intended LaTeX: `x\notin A` $x\notin A$
 * Lurch notation 1: `x notin A`
 * Converting Lurch notation 1 to LaTeX: ` x\notin A` $x\notin A$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(¬ (∈ x A))`
 * Lurch notation 2: `x∉A`
 * Converting Lurch notation 2 to LaTeX: ` x\notin A` $x\notin A$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(¬ (∈ x A))`

### Rule 3

 * Intended LaTeX: `A\subseteq B` $A\subseteq B$
 * Lurch notation 1: `A subset B`
 * Converting Lurch notation 1 to LaTeX: ` A\subseteq B` $A\subseteq B$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(⊆ A B)`
 * Lurch notation 2: `A subseteq B`
 * Converting Lurch notation 2 to LaTeX: ` A\subseteq B` $A\subseteq B$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(⊆ A B)`
 * Lurch notation 3: `A⊆B`
 * Converting Lurch notation 3 to LaTeX: ` A\subseteq B` $A\subseteq B$ :heavy_check_mark:
 * Converting Lurch notation 3 to putdown: `(⊆ A B)`

### Rule 4

 * Intended LaTeX: `A\cup B` $A\cup B$
 * Lurch notation 1: `A cup B`
 * Converting Lurch notation 1 to LaTeX: ` A\cup B` $A\cup B$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(∪ A B)`
 * Lurch notation 2: `A union B`
 * Converting Lurch notation 2 to LaTeX: ` A\cup B` $A\cup B$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(∪ A B)`
 * Lurch notation 3: `A∪B`
 * Converting Lurch notation 3 to LaTeX: ` A\cup B` $A\cup B$ :heavy_check_mark:
 * Converting Lurch notation 3 to putdown: `(∪ A B)`

### Rule 5

 * Intended LaTeX: `A\cap B` $A\cap B$
 * Lurch notation 1: `A cap B`
 * Converting Lurch notation 1 to LaTeX: ` A\cap B` $A\cap B$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(∩ A B)`
 * Lurch notation 2: `A intersect B`
 * Converting Lurch notation 2 to LaTeX: ` A\cap B` $A\cap B$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(∩ A B)`
 * Lurch notation 3: `A∩B`
 * Converting Lurch notation 3 to LaTeX: ` A\cap B` $A\cap B$ :heavy_check_mark:
 * Converting Lurch notation 3 to putdown: `(∩ A B)`

### Rule 6

 * Intended LaTeX: `A\setminus B` $A\setminus B$
 * Lurch notation 1: `A setminus B`
 * Converting Lurch notation 1 to LaTeX: ` A\setminus B` $A\setminus B$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(∖ A B)`
 * Lurch notation 2: `A∖B`
 * Converting Lurch notation 2 to LaTeX: ` A\setminus B` $A\setminus B$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(∖ A B)`

### Rule 7

 * Intended LaTeX: `A^\circ` $A^\circ$
 * Lurch notation 1: `A complement`
 * Converting Lurch notation 1 to LaTeX: `A^\circ` $A^\circ$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(° A)`
 * Lurch notation 2: `A°`
 * Converting Lurch notation 2 to LaTeX: `A^\circ` $A^\circ$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(° A)`

### Rule 8

 * Intended LaTeX: `f\colon A\to B` $f\colon A\to B$
 * Lurch notation 1: `f:A→B`
 * Converting Lurch notation 1 to LaTeX: `f\colon A\to B` $f\colon A\to B$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(maps f A B)`

### Rule 9

 * Intended LaTeX: `f\left(x\right)` $f\left(x\right)$
 * Lurch notation 1: `f(x)`
 * Converting Lurch notation 1 to LaTeX: `f\left(x\right)` $f\left(x\right)$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(f x)`

### Rule 10

 * Intended LaTeX: `g\circ f` $g\circ f$
 * Lurch notation 1: `g circ f`
 * Converting Lurch notation 1 to LaTeX: ` g\circ f` $g\circ f$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(∘ g f)`
 * Lurch notation 2: `g∘f`
 * Converting Lurch notation 2 to LaTeX: ` g\circ f` $g\circ f$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(∘ g f)`

### Rule 11

 * Intended LaTeX: `A\times B` $A\times B$
 * Lurch notation 1: `A times B`
 * Converting Lurch notation 1 to LaTeX: ` A\times B` $A\times B$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(× A B)`
 * Lurch notation 2: `A×B`
 * Converting Lurch notation 2 to LaTeX: ` A\times B` $A\times B$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(× A B)`

### Rule 12

 * Intended LaTeX: `\langle x,y \rangle` $\langle x,y \rangle$
 * Lurch notation 1: `⟨x,y⟩`
 * Converting Lurch notation 1 to LaTeX: `\langle{x,y}\rangle` $\langle{x,y}\rangle$ :x:
 * Converting Lurch notation 1 to putdown: `(tuple x y)`

## Relations

### Rule 1

 * Intended LaTeX: `x&lt;0` $x&lt;0$
 * Lurch notation 1: `x &lt; 0`
 * Converting Lurch notation 1 to LaTeX: `x \mathrm{&lt;} 0` $x \mathrm{&lt;} 0$ :x:
 * Converting Lurch notation 1 to putdown: `x &lt; 0`
 * Lurch notation 2: `x lt 0`
 * Converting Lurch notation 2 to LaTeX: ` x< 0` $x< 0$ :x:
 * Converting Lurch notation 2 to putdown: `(< x 0)`

### Rule 2

 * Intended LaTeX: `x\leq 0` $x\leq 0$
 * Lurch notation 1: `x leq 0`
 * Converting Lurch notation 1 to LaTeX: ` x\leq 0` $x\leq 0$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(≤ x 0)`
 * Lurch notation 2: `x ≤ 0`
 * Converting Lurch notation 2 to LaTeX: ` x\leq 0` $x\leq 0$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(≤ x 0)`

### Rule 3

 * Intended LaTeX: `x\neq 0` $x\neq 0$
 * Lurch notation 1: `x neq 0`
 * Converting Lurch notation 1 to LaTeX: ` x\neq 0` $x\neq 0$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(¬ (= x 0))`
 * Lurch notation 2: `x ne 0`
 * Converting Lurch notation 2 to LaTeX: ` x\neq 0` $x\neq 0$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(¬ (= x 0))`
 * Lurch notation 3: `x≠0`
 * Converting Lurch notation 3 to LaTeX: ` x\neq 0` $x\neq 0$ :heavy_check_mark:
 * Converting Lurch notation 3 to putdown: `(¬ (= x 0))`

### Rule 4

 * Intended LaTeX: `m\mid n` $m\mid n$
 * Lurch notation 1: `m | n`
 * Converting Lurch notation 1 to LaTeX: ` m\mid n` $m\mid n$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(| m n)`
 * Lurch notation 2: `m divides n`
 * Converting Lurch notation 2 to LaTeX: ` m\mid n` $m\mid n$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(| m n)`

### Rule 5

 * Intended LaTeX: `a\underset{m}{\equiv}b` $a\underset{m}{\equiv}b$
 * Lurch notation 1: `a≈b mod m`
 * Converting Lurch notation 1 to LaTeX: `a\underset{m}{\equiv}b` $a\underset{m}{\equiv}b$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(≈ a b m)`

### Rule 6

 * Intended LaTeX: `x\sim y` $x\sim y$
 * Lurch notation 1: `x~y`
 * Converting Lurch notation 1 to LaTeX: ` x\sim y` $x\sim y$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(~ x y)`

### Rule 7

 * Intended LaTeX: `x\sim y\sim z` $x\sim y\sim z$
 * Lurch notation 1: `x~y~z`
 * Converting Lurch notation 1 to LaTeX: ` x\sim y\sim z` $x\sim y\sim z$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(~ x y z)`

### Rule 8

 * Intended LaTeX: `x=y` $x=y$
 * Lurch notation 1: `x=y`
 * Converting Lurch notation 1 to LaTeX: ` x= y` $x= y$ :warning:
 * Converting Lurch notation 1 to putdown: `(= x y)`

### Rule 9

 * Intended LaTeX: `x=y=z` $x=y=z$
 * Lurch notation 1: `x=y=z`
 * Converting Lurch notation 1 to LaTeX: ` x= y= z` $x= y= z$ :warning:
 * Converting Lurch notation 1 to putdown: `(= x y z)`

### Rule 10

 * Intended LaTeX: `X\text{ loves }Y` $X\text{ loves }Y$
 * Lurch notation 1: `X loves Y`
 * Converting Lurch notation 1 to LaTeX: ` X\text{ loves } Y` $X\text{ loves } Y$ :warning:
 * Converting Lurch notation 1 to putdown: `(loves X Y)`

### Rule 11

 * Intended LaTeX: `X\text{ is }Y` $X\text{ is }Y$
 * Lurch notation 1: `X is Y`
 * Converting Lurch notation 1 to LaTeX: ` X\text{ is } Y` $X\text{ is } Y$ :warning:
 * Converting Lurch notation 1 to putdown: `(is X Y)`
 * Lurch notation 2: `X is an Y`
 * Converting Lurch notation 2 to LaTeX: ` X\text{ is } Y` $X\text{ is } Y$ :warning:
 * Converting Lurch notation 2 to putdown: `(is X Y)`
 * Lurch notation 3: `X is a Y`
 * Converting Lurch notation 3 to LaTeX: ` X\text{ is } Y` $X\text{ is } Y$ :warning:
 * Converting Lurch notation 3 to putdown: `(is X Y)`

### Rule 12

 * Intended LaTeX: `P\text{ is a partition of }A` $P\text{ is a partition of }A$
 * Lurch notation 1: `P is a partition of A`
 * Converting Lurch notation 1 to LaTeX: ` P\text{ is a partition of } A` $P\text{ is a partition of } A$ :warning:
 * Converting Lurch notation 1 to putdown: `(partition P A)`

### Rule 13

 * Intended LaTeX: `\sim\text{ is equivalence relation}` $\sim\text{ is equivalence relation}$
 * Lurch notation 1: `'~' is an equivalence relation`
 * Converting Lurch notation 1 to LaTeX: ` \left(~\right)\text{ is } \mathrm{equivalence_relation}` $\left(~\right)\text{ is } \mathrm{equivalence_relation}$ :x:
 * Converting Lurch notation 1 to putdown: `(is ~ equivalence_relation)`

### Rule 14

 * Intended LaTeX: `\left[a\right]` $\left[a\right]$
 * Lurch notation 1: `[a]`
 * Converting Lurch notation 1 to LaTeX: `\left[a\right]` $\left[a\right]$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(class a ~)`

### Rule 15

 * Intended LaTeX: `\left[a\right]_{\sim}` $\left[a\right]_{\sim}$
 * Lurch notation 1: `[a,~]`
 * Converting Lurch notation 1 to LaTeX: `\left[a,~\right]_{undefined}` $\left[a,~\right]_{undefined}$ :x:
 * Converting Lurch notation 1 to putdown: `(class a ~)`

### Rule 16

 * Intended LaTeX: `\sim\text{ is strict partial order}` $\sim\text{ is strict partial order}$
 * Lurch notation 1: `'~' is a strict partial order`
 * Converting Lurch notation 1 to LaTeX: ` \left(~\right)\text{ is } \mathrm{strict_partial_order}` $\left(~\right)\text{ is } \mathrm{strict_partial_order}$ :x:
 * Converting Lurch notation 1 to putdown: `(is ~ strict_partial_order)`

### Rule 17

 * Intended LaTeX: `\sim\text{ is partial order}` $\sim\text{ is partial order}$
 * Lurch notation 1: `'~' is a partial order`
 * Converting Lurch notation 1 to LaTeX: ` \left(~\right)\text{ is } \mathrm{partial_order}` $\left(~\right)\text{ is } \mathrm{partial_order}$ :x:
 * Converting Lurch notation 1 to putdown: `(is ~ partial_order)`

### Rule 18

 * Intended LaTeX: `\sim\text{ is total order}` $\sim\text{ is total order}$
 * Lurch notation 1: `'~' is a total order`
 * Converting Lurch notation 1 to LaTeX: ` \left(~\right)\text{ is } \mathrm{total_order}` $\left(~\right)\text{ is } \mathrm{total_order}$ :x:
 * Converting Lurch notation 1 to putdown: `(is ~ total_order)`

## Assumptions and Declarations

### Rule 1

 * Intended LaTeX: `\text{Assume }P` $\text{Assume }P$
 * Lurch notation 1: `Assume P`
 * Converting Lurch notation 1 to LaTeX: `\text{Assume }P` $\text{Assume }P$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `:P`
 * Lurch notation 2: `:P`
 * Converting Lurch notation 2 to LaTeX: `\text{Assume }P` $\text{Assume }P$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `:P`

### Rule 2

 * Intended LaTeX: `\text{Let }x` $\text{Let }x$
 * Lurch notation 1: `Let x`
 * Converting Lurch notation 1 to LaTeX: `\text{Let }x` $\text{Let }x$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `:[x]`

### Rule 3

 * Intended LaTeX: `\text{Let }x\text{ be such that }x\in\mathbb{R}` $\text{Let }x\text{ be such that }x\in\mathbb{R}$
 * Lurch notation 1: `Let x be such that x in ℝ`
 * Converting Lurch notation 1 to LaTeX: `\text{Let }x\text{ be such that } x\in ℝ` $\text{Let }x\text{ be such that } x\in ℝ$ :x:
 * Converting Lurch notation 1 to putdown: `:[x, (∈ x ℝ)]`
 * Lurch notation 2: `Let x such that x in ℝ`
 * Converting Lurch notation 2 to LaTeX: `\text{Let }x\text{ be such that } x\in ℝ` $\text{Let }x\text{ be such that } x\in ℝ$ :x:
 * Converting Lurch notation 2 to putdown: `:[x, (∈ x ℝ)]`

### Rule 4

 * Intended LaTeX: `f(c)=0\text{ for some }c` $f(c)=0\text{ for some }c$
 * Lurch notation 1: `f(c)=0 for some c`
 * Converting Lurch notation 1 to LaTeX: ` f\left(c\right)= 0\text{ for some }c` $f\left(c\right)= 0\text{ for some }c$ :x:
 * Converting Lurch notation 1 to putdown: `[c, (= (f c) 0)]`

## Miscellaneous

### Rule 1

 * Intended LaTeX: `f^-\left(x\right)` $f^-\left(x\right)$
 * Lurch notation 1: `f⁻(x)`
 * Converting Lurch notation 1 to LaTeX: `f^-\left(x\right)` $f^-\left(x\right)$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `((⁻ f) x)`
 * Lurch notation 2: `f recip(x)`
 * Converting Lurch notation 2 to LaTeX: `f^-\left(x\right)` $f^-\left(x\right)$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `((⁻ f) x)`
 * Lurch notation 3: `f inv(x)`
 * Converting Lurch notation 3 to LaTeX: SyntaxError: Expected end of input but "(" found.
 * Converting Lurch notation 3 to putdown: `((⁻ f) x)`

### Rule 2

 * Intended LaTeX: `x^-` $x^-$
 * Lurch notation 1: `x recip`
 * Converting Lurch notation 1 to LaTeX: `x^-` $x^-$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(⁻ x)`
 * Lurch notation 2: `x inv`
 * Converting Lurch notation 2 to LaTeX: `x^-` $x^-$ :heavy_check_mark:
 * Converting Lurch notation 2 to putdown: `(⁻ x)`
 * Lurch notation 3: `x⁻`
 * Converting Lurch notation 3 to LaTeX: `x^-` $x^-$ :heavy_check_mark:
 * Converting Lurch notation 3 to putdown: `(⁻ x)`

### Rule 3

 * Intended LaTeX: `\lambda{P}(k)` $\lambda{P}(k)$
 * Lurch notation 1: `λP(k)`
 * Converting Lurch notation 1 to LaTeX: `\lambda{P}(k)` $\lambda{P}(k)$ :heavy_check_mark:
 * Converting Lurch notation 1 to putdown: `(λ P k)`

