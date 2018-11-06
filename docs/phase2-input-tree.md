
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 2: The Input Tree

## Content

In this phase, we add the Input Tree, a hierarchy comprised of a new kind of
`Structure` subclass, called `InputStructure`.

## Goal

The `InputStructure` class will exist and be used by the LDE module.

## Status

This phase has been implemented and documented in the API Documentation.
It added some features to the `Structure` module
([API Documentation here](api-structures.md)) and some features to the `LDE`
module ([API Documentation here](api-lde.md)) and created the
`InputStructure` module ([API documentation here](api-input-structures.md)).
