
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

This file contains ideas that were formerly listed as phases 2 through 11.
But since they were written, phase 1 was completely redesigned (in a very
helpful way).  Thus these ideas no longer apply as they once did.

However, they have many good ideas within them, and are thus retained here
to be referenced later when building on top of the newly-redesigned
foundation of `Structure`s.

# LDE Design Phase 2: Basic Validation

This phase defines:

 * Statements (just atomic expressions whose contents are a string, and
   contain no child structures)
 * Definitions of the simplest rule type only: code rules written in
   JavaScript
 * Formal systems (or "mathematical topics", which are structures we can
   put rules inside of)

This enables really simple formal systems, ones whose statements are strings
and that require no citing of premises.  Examples:

 * TriX game (in which the previous statement is always the only premise,
   and is never cited) would become possible after Phase 2.
 * A system that verifies each statement independently (e.g., arithmetic
   equations and inequalities) would also be possible.

While the intent is eventually for nontrivial validation tasks to be placed
in a queue and handled in background threads, that work is not part of
Phase 2.  A later phase will add support for it.

## Extending the `Structure` module

Giving feedback

 * Extend the generic `Structure` class with a convenience function called
   `feedback(a,b)` that sets the computed attribute with key "feedback" to a
   JSON object whose validation result is `a` and whose corresponding brief
   message is `b`.  If both arguments are omitted, then the "feedback"
   computed attribute is removed.  For instance, we might make calls like
   `S.feedback('valid','This rule is used correctly.')` or
   `S.feedback('invalid','You did not provide a valid reason.')`.

Event handlers

 * Extend the generic `Structure` class with new event handlers for
   `aboutToChange`, `aboutToBeInserted`, and `aboutToBeRemoved`.
 * Check to see whether the existing event handlers (`wasInserted`,
   `wasRemoved`, and `wasChanged`) are tested in the unit tests.  If not,
   add tests for them, together with tests for these new events.
 * Provide a default implementation for `aboutToBeRemoved()` that calls
   `whatCitesMe()` in the same object and stores the result in a temporary
   field in the object.  Then provide a default implementation of
   `wasRemoved()` that calls `validate()` on every structure on that list.
 * Provide default implementations of `wasInserted()` and `wasChanged()`
   that each call `validate()` in the same object, if that function exists.

Building and running functions

 * Add to the `Structure` class a class method `runFunction(f,args,cb)` that
   converts the string of JavaScript code `f` into a function (through the
   `Function` constructor), then runs it on the given set of arguments,
   sending the result to the given callback (or an error instead, using the
   standard two-argument callback signature).  This will be overridden by
   the LDE with an asynchronous method, but it needs to exist so that the
   `Structure` class is, in theory, independent of the LDE.

## Extending the `LDE` module

Building and running functions in the background

 * After loading the `Structure` module, replace its class method
   `runFunction` with one that operates asynchronously, sending the job to a
   background thread.  If the thread does not terminate in a short time,
   send back an error about termination time.  Keep track of all background
   threads that are currently running, so that the total can be queried at
   any given time.
 * Extend each of the LDE's functions (`insert`, `replace`, etc.) so that if
   it terminates without there being any currently running background
   threads then it posts a message that LDE computations are complete.
 * Extend the LDE's new implementation of `runFunction` so that whenever it
   finishes calling the callback, if there are no background threads
   running at that time, it posts the same message about computations being
   complete.

## Code-based rules

The `Rule` class will be a subclass of `Structure`.  If `R` is an instance
of `Rule` then its `validate()` function should be as follows.

 * If `R.isA 'code'` fails, then call `R.feedback('invalid','...')` with
   a message that only code rules are supported so far.  Then jump to the
   final bullet point in this list.
 * If `R.text()` isn't valid JavaScript code that defines a function,
   then `R.feedback('invalid','...')` with a message to that effect.
   Then jump to the final bullet point in this list.
 * Otherwise `R.feedback('valid','This is a valid code rule.')`.  Then:
 * For every expression in `R.whatCitesMe()`, revalidate it.

## Statements

The `Statement` class will be a subclass of `Structure`.  If `S` is an
instance of `Statement` then its `validate()` function should be as follows.

 * If `S.children().length > 0` then call `S.feedback('invalid','...')`
   with a message that only atomic statements supported so far.
   Then stop.
 * If `S` does not have a reason attached to it, then call
   `S.feedback()` to clear feedback, and stop.
 * If `S` has more than one reason attached to it, then call
   `S.feedback('invalid','...')` with a message that multiple reasons is
   not permitted.  Then stop.
 * Treat the one reason attached to `S` as a reference and look it up.
   If it produces no structure, call `S.feedback('invalid','...')` with a
   message that there is no such reason.  Then stop.
 * Take the object found in the previous bullet point.  If it is not an
   instance of the `Rule` subclass defined below, call
   `S.feedback('invalid','...')` with a message that the cited reason is
   not a rule.  Then stop.
 * If the cited rule has not been validated, then stop here.  (When it
   gets validated, it will trigger a re-validation of `S`.)
 * Let f be the JavaScript function defined in the text of the rule and
   call `f(S)` in a background thread.
 * If `f(S)` ends with an error, then call `S.feedback("invalid","...")`
   with a message about an internal rule error.
 * If `f(S)` does not terminate quickly, then call
   `S.feedback("invalid","...")` with a message about an internal rule
   error.
 * If `f(S)` is not a correctly formed validation result object, then
   call `S.feedback("invalid","...")` with a message about an internal
   rule error.  Note that a correctly formed validation result object
   will have a `type` ("valid", "invalid") and a `message`.
 * Otherwise call `S.feedback(f(S).type,f(S).message)`.

## Formal systems (or "mathematical topics")

The `FormalSystem` class will be a subclass of `Structure`, and will add
support for the following new member functions.  Assume `F` is an instance
of `FormalSystem` in each case.  Further assume that `S` is an instance of
`Structure` in each case.

 * `F.exports()` returns an array composed of these things, in the order
   they appear in the document:
    * any `Rule` instance in `F.children()`
    * any element of `F2.exports()` for any formal system `F2` in
      `F.children()`
 * Extend `S.lookup(label)` to also check `F.exports()` whenever it
   encounters an accessible `FormalSystem` instance.
 * Extend `S.whatCitesMe()` to also looks at the scope of `S.parent()` iff
   it is a `FormalSystem` instance (and its `parent()` iff that is a
   `FormalSystem` instance, and so on).
 * Override the default implementation of `F.wasInserted()` so that it now
   calls `R.whatCitesMe()` for every `R` in `F.exports()` and revalidates
   every structure on any of those lists.
 * Extend the implementation of `F.aboutToBeRemoved()` and `F.wasRemoved()`
   so that each propagates the call to the function of the same name in all
   structures in `F.exports()`.

## Unit testing

How we could do unit testing on this simple LDE:

 * Fire up the LDE so that its document is new and thus blank.
 * Set up a listener for the "computation finished" signals from the LDE,
   storing the results for use in testing.
 * Tell the LDE to add three children to the LDE Document: a rule, a step
   using it correctly, and a step using it incorrectly.
 * Wait until we receive the signal that says the LDE has finished
   computing.
 * Examine the computation results stored in step 2 and verify correct
   processing of the rule and two steps.

Consider each of the unusual corner cases handled above and create tests for
it, including such situations as these:

 * Send a signal to the LDE to alter the incorrect use of the rule, making
   it correct.  Wait for computation to finish and check to be sure it
   re-validated that step as correct now.
 * Insert a rule with label X, followed by a statement with label X,
   followed by a statement citing reason X.  Ensure the statement does not
   validate because it cites a non-rule.  Remove the statement labeled X.
   Ensure the remaining statement validates because it now cites rule X.
 * In a blank document, insert a statement that cites rule Y.  Then insert a
   formal system containing rule Y before the statement.  Ensure that the
   system notices, and that the statement automatically had its validation
   updated.

# LDE Design Phase 3: The Client

This phase defines the LDE Client, a thin interface to the LDE defined in a
separate module.

The Client maintains the Facade, a shallow copy of the LDE Document that it
keeps in sync with it, thus providing an easy API for interacting with the
LDE.

This page is just a description; it's not actually written in a "design" or
"how to build" manner, at least not to the same degree that Phase 2 was.

This phase's work just makes Phase 1's work easier to use for most clients.

## App launch

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

## Background threads

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

## No subclasses

Because the nodes in the Facade don't actually do anything, they have no
subclasses.

 * Unlike the Structure class, which it makes sense to subclass so that
   we can add various features like validation functions and so forth,
   none of that matters in the Facade.  It ships all that work to
   someone else.
 * Thus every node in the Facade hierarchy is a generic Facade node,
   storing a dictionary of attributes given to it at construction time,
   which are precisely the attributes for that node.
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

## Serialization

 * Facade nodes do one thing, actually:  They know how to serialize
   themselves into JSON, including all their children.
 * This is so that they can pass themselves across to the LDE for syncing,
   and so that the entire Facade can be serialized by the UI (later of
   course) for saving in document metadata.

## IDs

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

## Unit testing

 * Verify that the Facade hierarchy can be built and works independent of
   the LDE
 * Verify that if you connect it to an LDE background thread, the documents
   stay in sync
 * Verify that the same tests done in Phase 2 can be done also through this
   "API" to the LDE
 * All further testing in later phases has the option of using the Client
   or not, depending on what's best for testing in that particular instance.

## Extendability

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

# LDE Design Phase 4: Dependencies

 * Support dependencies as read-only first-few-children of the document.
 * They need to be validated only to be sure they don't redeclare one
   another's stuff.
 * Note that every structure already has an .exports() method, so we just
   need to implement that structure for the root of the LDE Document, and
   that will be what a document exports when it is used as a dependency.

Rule definitions can be stored in a master document on which others depend,
and many later documents can all use the same central rule set.

# LDE Design Phase 5: Background Queue

## New stuff

The stuff in the "old stuff" section, immediately after this one, may no
longer apply; it is from an old design.  But these new plans may still be
relevant, depending on how efficiently interpretation is eventually seen to
be:

Currently, interpretation is triggered immediately in response to calls to
the LDE's API.  If that interpretation process takes too long, a queue of
API calls can be formed.  When any request comes in to the LDE API, rather
than being immediately executed, it would go on a queue.  The *old* way of
processing such events is analogous to handling the queue like so:

 * Pop an item off this API command queue
 * Perform the item
 * Call .markDirty() in the relevant node
 * Call root.recursiveInterpret()
 * Repeat from step 1 until the queue is empty

But now that we have a queue, we can do the following more efficient procedure instead:

 * Pop an item off this API command queue
 * Perform the item
 * Call .markDirty in the relevant node
 * Repeat from step 1 until the queue is empty
 * Call root.recursiveInterpret()

Thus many quick API calls in succession will result in just one (possibly
expensive) call to root.recursiveInterpret(), rather than many such
(possibly expensive) calls.

## Old stuff

 * Add a mechanism for queueing tasks to be done later.
 * It should be smart enough that, whenever task X is enqueued, then any
   already-enqueued task Y that will need to be redone after X anyway
   should be removed form the queue, for efficiency.
 * Then rewrite Phases 2 and 3 to use this feature as needed.
   All later phases should enqueue all nontrivial processing tasks this way.

All the work done before this operates more efficiently, and the large and
complex deductive engine we plan to build on the foundation we have so far
will still be performant.

# LDE Design Phase 6: String Matching

Extend rules to include string-based matching (like the kind of matching
Circle-Dot and MIU use)

This enables: toy systems like Circle-Dot and MIU

# LDE Design Phase 7: Theorems and Proofs

 * Proofs (which are also subproofs)
 * Theorem statements
 * Pairing of theorems with proofs
 * Homework problems (which may be the same as a theorem-proof pair!)

This enables:

 * Proofs
 * Homework assignments

# LDE Design Phase 8: Expressions

 * Expanded form for non-atomic expressions (function applications,
   binding, variables, constants, etc.)
 * Extend rules to pattern-based matching (the usual kind of rules we think
   of in math)

This enables: propositional logic, but with statements in expanded form only

# LDE Design Phase 9: Parsing

 * Rules for defining parsing
 * Constant declarations may be implemented under the hood as special cases
   of language rules.
    * This does not mean they must parse into OpenMath symbols.  It is
      acceptable to parse them into, for example, OpenMath strings, with a
      special attribute Constant=True, or any equally unique/recognizable
      expression.
    * Also, this does not mean that constant declarations must feel to the
      user like language rule declarations feel.  We can let users think of
      them and express them as constant declarations, but under the hood it
      may be implemented as if it had been a language rule.

This enables: propositional logic in its usual notation, and other related
simple systems

# LDE Design Phase 10: Declarations

 * Variable declarations (which may be a special type of expression, or may
   be a special type of subproof--i.e., do we mark a variable as a
   declaration, or do we mark a subproof as a variable declaration one, and
   then the variable at the start of it is declared?)
 * Examples (structures in which you declare all manner of stuff that
   doesn't bleed out)

This enables: predicate logic in standard math notation, and many other math
topics

# LDE Design Phase 11: Features

Add features to anything built so far (like multiple conclusions from a
rule, or automatic premise finding, or automatic premise ordering, or the
ability to specify metavariable instantiations, or any of 1000 other
features we'd like to add)
