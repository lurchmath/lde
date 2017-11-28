
# LDE Design Phase 1B: Dependencies

This document is not yet complete.  Its content will eventually specify:

 * Support dependencies as read-only first-few-children of the document.
 * They need to be validated only to be sure they don't redeclare one
   another's stuff.
 * Note that every structure already has an .exports() method, so we just
   need to implement that structure for the root of the LDE Document, and
   that will be what a document exports when it is used as a dependency.
