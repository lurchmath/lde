
# LDE Design Phase 1C: Background Queue

This document is not yet complete.  Its content will eventually specify:

 * Add a mechanism for queueing tasks to be done later.
 * It should be smart enough that, whenever task X is enqueued, then any
   already-enqueued task Y that will need to be redone after X anyway
   should be removed form the queue, for efficiency.
 * Then rewrite Phase 1 and Interlude A to use this feature as needed.
   All later phases should enqueue all nontrivial processing tasks this way.
