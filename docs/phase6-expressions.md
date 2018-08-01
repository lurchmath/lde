
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 6: Expressions

## Content

In this phase, we build on the foundation of generic interpretation and
validation to build the second feature necessary for validating steps of
work:  Expressions.

## Goal

By the end of this phase, the Input Tree can contain arbitrarily complex
mathematical expressions.

## Status

This has not been implemented.  In fact, the design below has not yet been
converted into actionable tasks.  So the next steps are to do that
conversion, and then execute the resulting tasks.

## Design

### Output Tree

In the Output Tree, we design things so that they are easy to compute with.
In the case of expressions, that means three things.

 1. They should be in fully expanded form.
 1. They should be `OutputStructure` instances because the rest of the tree
    is.
 1. They should be OpenMath instances, because many of the tools (like the
    formidable Matching Package) we've created take OpenMath structures as
    inputs.

The second and third items conflict, but the design below attempts to solve
that problem.

Define a subclass `OutputExpression` of `OutputStructure`.  It will support
these new features:

 * `E.isAtomic() == true` iff the expression has no children
 * If `E.isAtomic()`, then `E.text()` is the value of its "text" attribute,
   treated as a string (or the empty string if there is no such attribute);
   this will be used to store the text content of atomic expressions.
 * If `E.isAtomic()` is false, then `E.text()` is undefined.
 * `E.addBound(i)` marks child `i` of `E` as a bound variable.  For
   instance, in an expression like $\forall x, P(x)$ (which we represent
   with the LISP notation `(forall x (P x))`), you might call
   `E.addBound(1)` to mark it as bound by the forall, if we're counting
   subexpressions from zero (`forall`, then `x`, then `(P x)`).  And in
   $\frac{d}{dx}x$ (`(diff (f x) x)`), you might call `E.addBound(2)`.
   These indices can be stored in the "bound variables" attribute.
 * `E.bound()` returns the list of all indices of bound children of `E`.
   (At times below, this document may refer to `E.bound()` as the variables
   themselves, because they can easily be looked up from these indices.)
 * `E.isBinding() == true` iff `E.bound()` is nonempty.

Later we may extend this with settings that permit various types of
expressions to be considered equal (for example, case insensitive
identifiers) and the interpretation phase could accomplish this by reducing
all text to a canonical form as it creates `OutputStructure` instances.  But
for now we do not stipulate that feature as a requirement.

That should be all we need to create any kind of mathematical expression.
Examples:

 * $3$ can be represented as an atomic expression with text 3
 * $x$ can be represented as an atomic expression with text x
 * $x+y$ can be represented as a nonatomic expression with three children:
	* an atomic expression with text +
	* an atomic expression with text x
	* an atomic expression with text y
 * $\forall x, P(x)$ can be represented as a nonatomic expression with
   three children, the second of which is bound:
	* an atomic expression with text $\forall$
	* an atomic expression with text x
	* an nonatomic expression with two children:
	   * an atomic expression with text P
	   * an atomic expression with text x

Although examples so far have not bound more than one thing, you can bind as
many as you like in one expression.  It is not necessary to have just one
body of a binding expression, as it was in OpenMath.  It is not necessary to
have a head symbol at the start of a binding expression, as it was in
OpenMath.

So let us then return to criterion 3 from above, about OpenMath.  We need
expressions in OpenMath form to hand to the
[Matching Package](https://lurchmath.github.io/first-order-matching/site/),
because that package would be awful to rewrite.  So we create a method on
the `OutputExpression` class that converts its instances to OpenMath.  It
accepts a parameter `V` listing the names of all known variables in the
surrounding context, which defaults to the empty list (but could include,
for instance, all variables currently declared).  `E.toOpenMath(V)` then
does this:

 * If `E.isAtomic()`:
    * If `E.text()` is on the list `V`, then return a new OpenMath variable
      with name `E.text()`.  (This may require an embedding from all strings
      into the space of valid OpenMath variable names.)
    * Otherwise, return a new OpenMath string with contents `E.text()`.
 * Otherwise let $c_1,\ldots,c_n$ be the children of `E` and do this:
    * If `E.isBinding() == false`:
       * Let $C_1=c_1$`.toOpenMath(V)`, and so on through
         $C_n=c_n$`.toOpenMath(V)`.
       * Return the OpenMath application node with children $C_1$ through
         $C_n$, in that order.
    * Otherwise:
       * Let V' be the list `V` appended with the names of all the variables
         in `E.bound()`.
       * Let $C_1=c_1$`.toOpenMath(V')`, and so on through
         $C_n=c_n$`.toOpenMath(V')`.
       * Let `P` be a single, fixed OpenMath symbol we will use as a
         placeholder, just to satisfy the OpenMath syntactic requirements.
       * Let `Q` be the OpenMath application of `P` to the nodes $C_1$
         through $C_n$, in that order.
       * Return the OpenMath binding with head symbol `P`, bound variables
         `E.bound()`, and body `Q`.

Furthermore, `E.toOpenMath(V)` will cache its result, so that it needs to be
computed only once in the life of `E`.

### Input Tree

There will be simple `InputStructure` subclasses that allow the client to
form expressions hierarchically in the Input Tree by nesting atomic nodes
within nonatomic ones in hierarchies like those described above, which get
converted directly (during the interpretation phase) into isomorphic
structures in the Output Tree.  So there will be a subclass
`InputExpression` that also supports `E.isAtomic()`, `E.text()`,
`E.addBound()`, `E.bound()`, and `E.isBinding()`, and in which
`E.interpret()` creates the fully-expanded-form `OutputExpression`
isomorphic to `E`.

We will also want there to be parseable `InputExpression`s that create
fully-expanded `OutputExpression`s.  But this document does not attempt to
also design all of customizable parsing.  Instead, we make a few brief
notes:

 1. If `E` is an atomic `InputExpression`, and `E` has a "grammar"
    attribute, then `E.interpret()` will try to find a grammar with the
    name `E.getAttribute("grammar")` and use it to parse `E.text()`, and
    use the parsed result as the result of `E.interpret()`.
 1. To test this feature without building customizable parsing, build a few
    simple parsers for testing purposes into the `InputExpression` class,
    like a LISP parser, so that an atomic `InputExpression` with text
    "(diff (f x) x)" and grammar "LISP" would be parsed into a non-atomic
    `OutputExpression` in the expected way.  Such built-in parsers could be
    very handy in early testing.

As per [existing design](phase3-interpretation.md), `E.interpret()` will
have access to all its accessibles, so later when it becomes possible to
cite a grammar defined in the document or a dependency, it will be able to
find all that grammar's details in those accessible nodes.

### User Interface

There will be many ways to write expressions in the UI, including unusual
and very handy methods such as automatic bubbling, default grammars for all
expressions in certain libraries, and so on.  But let us begin simpler than
that.

An early UI should have a bubble type for expressions, and it should be the
main/default bubble type, just as Meaningful Expression is the most common
type in Desktop Lurch.  By default, such bubbles will have no grammar
attached, and will thus convert into `InputExpression`s in fully expanded
form, and from there into `OutputExpression`s in fully expanded form.  There
will be no way to bind variables at first.  We can later add features, like
context menu items for choosing a grammar, specifying which variables are
bound in a fully expanded form expression, and more.
