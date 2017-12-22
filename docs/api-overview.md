
# API Documentation Overview

## Design Plans vs. API Documentation

At the top of this site, notice the two navigation menus entitled "Design
Plans" and "API Documentation."  The difference between them is this:

 * *Design Plans* lists concepts that have not yet been implemented and
   documented.  Consequently, the concepts are usually not described in full
   detail, but just the best detail available in the planning phase.
 * *API Documentation* lists concepts that have been implemented, and for
   which the developers have therefore been able to document their work.
   Having the benefit of hindsight, this is therefore more detailed, and
   often even contains links directly into the source code.

## Developer Workflow

Developers designing and/or implementing concepts should therefore progress
those concepts through a lifecycle like so:

 1. Describe the concept in one of the Design Plans page.  Provide as much
    detail as you can, knowing of course that full details is impossible to
    provide before the work has been done.
 1. As you implement and test the concept, update those design documents
    with whatever new information you create or learn as part of the work,
    thus making them more precise.
 1. Once the concept is fully implemented and tested, document the work in
    an existing or new page in the API Documentation section.  This may
    involve copying and pasting some of the content from the design plan,
    provided that it still applies.  It will probably also involve adding
    significant detail about the particulars of the implementation.
 1. Replace the original (less detailed) documentation in the design plans
    with a brief description of the concept, followed by a link to the
    corresponding part of the API Documentation for full details.

## For the Reader

Readers of this documentation will therefore be able to see how much has
been implemented by perusing the Design Plans pages.  Those that are brief
overviews of concepts with links to API Documentation have been implemented.
Those that are plans for future work, with no links to any API
Documentation, have not yet been implemented.
