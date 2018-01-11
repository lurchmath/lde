
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 3: The Client

## Content

This phase defines the LDE Client, a thin interface to the LDE defined in a
separate module.

The Client maintains the Facade, a shallow copy of the LDE Document that it
keeps in sync with it, thus providing an easy API for interacting with the
LDE.

This page is just a description; it's not actually written in a "design" or
"how to build" manner, at least not to the same degree that Phase 2 was.

## Goal

This phase's work just makes Phase 1's work easier to use for most clients.

## Status

This phase has not yet been implemented.  Once it has been implemented, its
contents will be documented in the API Documentation available from the
navigation menu at the top of this site.

# App launch

When the Client is loaded into memory (say, at app launch) it will create a
global structure that is intended to be a sort of shallow/shadow/fake copy
of the LDE Document.

 * Because it will imitate the structure of the LDE Document, it will be
   a hierarchy.
 * But it will not be a hierarchy of Structures, because as we know,
   Structures do computation, and that's the job of the LDE.  This is
   just a front-end; it doesn't do anything.
 * So rather than calling each node in the Client's hierarchy a
   Structure, I'll call it a *Facade.*  This is to emphasize that this
   hierarchy, stored in the Client (part of the UI) can't do anything at
   all.  It's picture of what's really going on elsewhere, in the LDE.

# Background threads

The Client can be told about the existence of a background thread that's
running the LDE.

 * If it is told about such a thread, then any later
   insertions/deletions/changes to the Facade hierarchy will immediately
   be communicated by the Client to that LDE thread as a change event
   (defined above).
 * This guarantees that the Facade hierarchy and LDE Document are always
   in sync:  Because the LDE never alters its hierarchy, messages need
   propagate in only one direction to guarantee that the two hierarchies
   are isomorphic.

# No subclasses

Because the nodes in the Facade don't actually do anything, they have no
subclasses.

 * Unlike the Structure class, which it makes sense to subclass so that
   we can add various features like validation functions and so forth,
   none of that matters in the Facade.  It ships all that work to
   someone else.
 * Thus every node in the Facade hierarchy is a generic Facade node,
   storing a dictionary of attributes given to it at construction time,
   which are precisely the external attributes for that node.
 * These attributes will have been communicated to the LDE when the
   Facade node was constructed, and the LDE can use them to figure out
   how to create a corresponding Structure node on the LDE side (or any
   subclass of Structure; one attribute should be the class name
   itself!).
 * But the point here is that what it means for the Facade to be a
   shallow/inactive copy of the LDE Document is that:
    * Every node is just a Facade node, and thus they have no
      specialized functionality at all.
    * Every node just stores its attributes, not doing anything with
      them, unlike on the LDE Document side, which does computation.

# Serialization

 * Facade nodes do one thing, actually:  They know how to serialize
   themselves into JSON, including all their children.
 * This is so that they can pass themselves across to the LDE for syncing,
   and so that the entire Facade can be serialized by the UI (later of
   course) for saving in document metadata.

# IDs

Each Facade node will be given, at the time it's created, an ID unique
among all nodes in the Facade hierarchy.

 * This unique ID will be part of what's communicated in the change event
   to the LDE, so that the corresponding Structure created in the LDE can
   have the same ID.
 * Thus future change events from the Client to the LDE can reference nodes
   in the hierarchy by this common ID system.
 * Similarly, when the LDE sends out signals about new computed attributes
   being stored in the LDE Document, it will mention these unique IDs to
   unambiguously indicate in which node the new computed attribute is
   stored.
 * The Client will then store the same computed attribute in the
   corresponding Facade node, so that it is accessible to the entire UI as
   well.

# Unit testing

 * Verify that the Facade hierarchy can be built and works independent of
   the LDE
 * Verify that if you connect it to an LDE background thread, the documents
   stay in sync
 * Verify that the same tests done in Phase 2 can be done also through this
   "API" to the LDE
 * All further testing in later phases has the option of using the Client
   or not, depending on what's best for testing in that particular instance.

# Extendability

 * The LDE is free to expose to clients any other functionality it sees
   fit.  That is, interaction with the LDE is not limited to syncing the
   Facade with the LDE Document and waiting for computed responses.
 * For instance, one type of response that should only be produced when
   specifically asked for is a "verbose feedback" response, like what we
   get in the old desktop Lurch by double-clicking a traffic light.  This
   is too much work to create for every step of work, but should be created
   only when needed.
 * Thus the LDE could expose a computeVerboseFeedback() function that took
   the unique ID of an LDE Document structure as input and later sent back
   a message with the corresponding verbose feedback (in HTML form) as the
   result.
