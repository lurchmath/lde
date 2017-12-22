
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 5: Background Queue

## Content

This document is not yet complete.  Its content will eventually specify:

 * Add a mechanism for queueing tasks to be done later.
 * It should be smart enough that, whenever task X is enqueued, then any
   already-enqueued task Y that will need to be redone after X anyway
   should be removed form the queue, for efficiency.
 * Then rewrite Phases 2 and 3 to use this feature as needed.
   All later phases should enqueue all nontrivial processing tasks this way.

## Goal

All the work done before this operates more efficiently, and the large and
complex deductive engine we plan to build on the foundation we have so far
will still be performant.

## Status

This phase has not yet been implemented.  Once it has been implemented, its
contents will be documented in the API Documentation available from the
navigation menu at the top of this site.
