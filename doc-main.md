
# The Lurch Deductive Engine (LDE) Source Code Documentation

This repository is in the process of rebuilding the LDE, discarding an old
design and replacing it with a better, updated design.  That work is still in
progress, and is perhaps 50% complete.

The navigation menu on the left shows classes and namespaces in alphabetical
order, but the overview below is more logically organized.

## Tutorials

Probably the easiest way to get familiar with the classes and methods defined
in this repository, together with how to use them, is to read the tutorials:

 * {@tutorial Constructing LCs}
 * {@tutorial Methods in each LC subclass}
 * {@tutorial LC tree hierarchies}
 * {@tutorial Serialization and attributes of LCs}
 * {@tutorial Free and bound variables}
 * {@tutorial Connections among LCs}
 * {@tutorial Pattern matching}
 * {@tutorial Lurch Node REPL}
 
## Foundational classes

Every symbolic math software needs some data structure for storing trees of
mathematical symbols that represent mathematical meaning.  In the LDE, the
most generic of these is the {@link MathConcept Math Concept}.

Later, complex math concepts will be able to be compiled down to a set of
simpler special cases that can be processed by the LDE.  We call that simpler
subset the {@link LogicConcept Logic Concepts}, or LCs for short.

Logic concepts come in four types: {@link Environment Environment},
{@link Formula Formula}, {@link Declaration Declaration}, and
{@link Expression Expression}.

Expressions come in three types: {@link Symbol Symbol},
{@link Application Application}, and {@link Binding Binding}.

## Other tools

Other basic tools support the classes above, including:

 * a class for {@link Connection connecting} math concept instances irrespective of
   tree structure,
 * functions for working with {@link JSON JSON} and
   {@link predictableStringify serializing it}.

There is also a host of advanced tools for doing {@link module:Matching pattern
matching} with {@link LogicConcept Logic Concept} instances.

And when working in the test suite, feel free to import
{@link Database the Database module} for access to a library of
{@link LogicConcept Logic Concept} instances written in
{@link LogicConcept.fromPutdown putdown} notation, with
corresponding metadata.

## GitHub

[Source code](http://github.com/lurchmath/lde) (including a README on how to
set up your own development environment)

[Design wiki](http://github.com/lurchmath/lde/wiki) (currently out-of-date; do
not trust the content of that wiki until it has been updatedm, at which point
we will update this note to reflect that it has been updated)
