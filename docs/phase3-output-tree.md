
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 3: The Output Tree

## Content

In this phase, we add the Output Tree, a hierarchy comprised of a new kind
of `Structure` subclass, called `OutputStructure`.

## Goal

The `OutputStructure` class will exist and be imported by the LDE module
but not yet used for anything.

## Status

This phase has been implemented and documented in the API Documentation. It
added some features to the `LDE` module ([API Documentation
here](api-lde.md)) and created the `OutputStructure` module ([API
documentation here](api-output-structures.md)).
