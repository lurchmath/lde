 
# The Lurch Deductive Engine (LDE) Source Code Documentation

This repository is in the process of rebuilding the LDE, discarding an old
design and replacing it with a better, updated design.  That work is still in
progress, and is perhaps 50% complete.

The navigation menu on the left shows classes and namespaces in alphabetical
order, but the overview below is more logically organized.

## Overview

Every symbolic math software needs some data structure for storing trees of
mathematical symbols that represent mathematical meaning.  In the LDE, the
most generic of these is the {@link MathConcept MathConcept}.

Later, complex math concepts will be able to be compiled down to a set of
simpler special cases that can be processed by the LDE.  We call that simpler
subset the {@link LogicConcept LogicConcepts}.

Logic concepts come in four types: {@link Environment Environment},
{@link Formula Formula}, {@link Declaration Declaration}, and
{@link Expression Expression}.

Expressions come in three types: {@link Symbol Symbol},
{@link Application Application}, and {@link Binding Binding}.

There are also some basic tools, including:

 * for {@link Connection connecting} math concept instances irrespective of
   tree structure,
 * for {@link Matching pattern-matching} with math concepts,
 * for working with {@link JSON JSON} and
   {@link predictableStringify serializing it}.

And when working in the test suite, feel free to import
{@link Database the Database module} for access to a library of
{@link LogicConcept LogicConcept} instances written in putdown notation, with
corresponding metadata.

## GitHub

[Source code](http://github.com/lurchmath/lde)

[Design wiki](http://github.com/lurchmath/lde/wiki)
