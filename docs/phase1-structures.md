
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 1: Structures

## Content

In this phase, we just design the generic Structure class on which
everything else will depend, and the infrastructure of the LDE itself.

## Goal

At the end of this phase, we could write unit tests of the whole Structure
class and its LDE context, thus guaranteeing that all later phases rest on a
good foundation.

## Status

This phase has been implemented, and is documented in the API Documentation,
accessible from the navigation menu at the top of this site.

# The Structure module

That module defines a single `Structure` class, and has been implemented.
[Its API Documentation appears here](api-structures.md).

# LDE Module

That module defines several global functions, and has been implemented.
[Its API Documentation appears here](api-lde.md).

There is one task left to implement before this phase is complete:

If the LDE detects that it is being run in a background thread, it will set
up listeners for messages from the parent thread.  These listeners will
handle messages of four types, insert/delete/replace/attribute, mirroring
the four functions given above, and calling them internally.  Here is some
code showing how that was done in the First Order Matching module.

```coffeescript
    if WorkerGlobalScope? # browser case
        importScripts 'openmath.js'
    else if self?.importScripts? # node case
        importScripts 'node_modules/openmath-js/openmath.js'
    # else not in a worder
```
