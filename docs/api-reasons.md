
# API Documentation for the `Reasons` Class

## Source Code

 * [The `Reasons` class](https://github.com/lurchmath/lde/blob/master/src/reason.litcoffee)
 * [Unit tests of the `Reason` class](https://github.com/lurchmath/lde/blob/master/tests/reason-spec.litcoffee)

## Purpose

The Lurch Deductive Engine (LDE, [documented here](api-lde.md)) maintains a
document called the LDE Document, which is a hierarchy (or tree).  The nodes
in that tree are instances of the class `Structure` or one of its
subclasses.  The `Reason` class is one such subclass.  It is intended to represent the general concept of a reason in mathematics.  In particular, it provides any functionality required to reference `Rule Structure`s, usually by querying their associated `Label`s.

This document is currently a stub for the API of the `Reason` class.  We will add the actual API here once the class has been coded.
