$\newcommand{\lode}{\mathbb{LODE}}$This tutorial covers how to run an instance of
the node REPL in a terminal which has all of the LDE commands and supporting
utilities preloaded.  This is useful for debugging and experimenting with the
functions and classes defined in the repository. This initialized version of
`node` can be thought of as `Lurch node`, or simply $\lode$ for short.

The other tutorials cover what kinds of objects you can create in Lode and what you can do with them.

 * {@tutorial Constructing LCs}
 * {@tutorial Methods in each LC subclass}
 * {@tutorial LC tree hierarchies}
 * {@tutorial Serialization and attributes of LCs}
 * {@tutorial Free and bound variables}
 * {@tutorial Connections among LCs}
 * {@tutorial Pattern matching}

## Running $\lode$

To run $\lode$ from the command line in a terminal at the the root folder of your
local copy of this source code repository simply type the command
`npm run lode`.  Alternatively, you can run it from the `scripts` subfolder of
the root folder with the command `node lode`. (If you have not yet set up a copy
of this repository with the appropriate Node.js version installed, see
<a href='https://github.com/lurchmath/lde'>our GitHub README</a>, which explains
how to do so.)

```
> node lode

Welcome to 𝕃𝕠𝕕𝕖 - the Lurch Node app
▶︎
```

You are now at the Lurch Node REPL command prompt.  All of the exported modules in
the [src/index.js file]{@link https://github.com/lurchmath/lde/blob/main/src/index.js} in this repository.  For example, you can now do things like this (see
{@link LogicConcept LogicConcept} and {@link LogicConcept#toPutdown toPutdown}):

```
Welcome to 𝕃𝕠𝕕𝕖 - the Lurch Node app
▶︎ LogicConcept.fromPutdown(`{ :Hello ( World ! ) }`)[0].toPutdown()
'{ :Hello (World !) }'
▶︎
```

$\lode$ also loads [Algebrite]{@link 'http://algebrite.org'}.
So you can do numerical and algebraic calculations such as these (see the
[Algebrite documentation]{@link http://algebrite.org/docs/latest-stable/reference.html}
for details).

```
Welcome to 𝕃𝕠𝕕𝕖 - the Lurch Node app
▶︎ Algebrite.run(`2^100`)
'1267650600228229401496703205376'
▶︎ Algebrite.run(`(x+1)^10`)
'x^10+10*x^9+45*x^8+120*x^7+210*x^6+252*x^5+210*x^4+120*x^3+45*x^2+10*x+1'
▶︎
```
