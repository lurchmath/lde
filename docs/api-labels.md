
# API Documentation for the `Labels` Class

## Source Code

 * [The `Labels` class](https://github.com/lurchmath/lde/blob/master/src/label.litcoffee)
 * [Unit tests of the `Label` class](https://github.com/lurchmath/lde/blob/master/tests/label-spec.litcoffee)

## Purpose

The Lurch Deductive Engine (LDE, [documented here](api-lde.md)) maintains a
document called the LDE Document, which is a hierarchy (or tree).  The nodes
in that tree are instances of the class `Structure` or one of its
subclasses.  The `Label` class is one such subclass.  It is intended to represent the general concept of a label in mathematics.  In particular, it provides any functionality required to (a) store information about the names and name spaces of particular instances of `Structure`s, (b) assign that information to those instances, and (c) to allow other `Structure`s to query that information.  

This document is currently a stub for the API of the `Label` class.  We will add the actual API here once the class has been coded.
