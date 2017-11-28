
# LDE Design Overview

This page lists the design decisions made by the Lurch team to date
regarding the LDE, with reasons and explanations for each.  This document
can be used as reference, and to guide development, but it may also be
changed as better ideas come along.

## Elegance and Simplicity

These are of utmost importance, because

 * they make Lurch easier to explain to students or in an Advanced User's
   Guide (AUG),
 * they make Lurch easier to test because it has fewer unusual corner cases
   or special handling of odd circumstances,
 * they make Lurch easier to implement for the same reason, and
 * they make it easier for us to be confident that our designs are good,
   because they're easier to hold in your head and grok all at once.

## Feedback and Validation

 * The primary purpose of the Lurch application is to give feedback to the
   user about the work they type into their document.
 * Because this will often involve validating steps of work in a proof, we
   may use the terms "feedback" and "validation" interchangeably, even
   though technically validation is just a particular type of feedback
   (though the most common type in our case).
 * *One-Pass Validation (OPV)* is a paradigm in which, whenever the app
   needs to update feedback in response to changes made by the user, it
   does so by reprocessing every bit of meaningful content from scratch, in
   one (large, possibly time-consuming) pass over the whole document.
 * *Real-Time Validation (RTV)* is a paradigm in which, whenever the app
   needs to update feedback in response to changes made by the user, it
   attempts to re-use as much information from previous validation as
   possible, only updating those portions of it that need updating in
   response to the specific change the user just made.  Thus RTV is
   trickier to design and implement than OPV, but more efficient at
   run-time.
 * An important concept for our test suite is that any RTV design can be
   converted to an OPV design trivially, and then used for comparison
   testing.  Simply replace all sophisticated RTV-style change event
   handlers with OPV-style ones, that mark the entire document as needing
   reprocessing.  Then any potential change that can be made to the user's
   document can be run through each of these engines in parallel, and the
   results compared for equivalence.
 * Note that the choice of OPV vs. RTV is independent of the choice of
   manual validation vs. automatic validation.  RTV certainly makes
   automatic validation nicer, and thus makes manual validation less
   appealing, but you could choose anything from among
   \(\{\text{OPV},\text{RTV}\}\times\{\text{auto},\text{manual}\}\).

## LDE and UI

 * We have a paradigm in which the UI is exactly that (user interface) and
   the LDE (Lurch Deductive Engine) is the brain that operates in one or
   more background threads, processing what the user has given the app
   through the UI.
 * We aim to implement every feature in the LDE if possible, but implement
   in the UI only those features that can't be implemented in the LDE.
   Here, "if possible" means that it would not break the model-view
   paradigm to implement it in the LDE (i.e., the LDE wouldn't need to
   speak HTML).  Reasons for this:
    * The LDE will be implemented in pure JS, no DOM, so that it can be
      used in a WebWorker and in the unit testing suite.
    * Therefore the bigger the LDE is, the more of our code has been
      subject to rigorous unit tests.
    * And the bigger the LDE is, the more of our code is run out of the UX
      thread, and thus the more responsive our app is.
 * The decisions recorded here are almost entirely about the design of the
   LDE, not the UI.

## Structures

 * Define a *structure* to be the basic unit of meaning in the LDE.
    * This includes document-level structures such as a section,
      subsection, proof, subproof, etc., which are analogous to block-level
      items like DIV or P in HTML, and `\begin{X}...\end{X}` in LaTeX.
    * But it also includes inline structures (SPANs in HTML, `\foo{...}` or
      `$...$` in LaTeX).
    * Structures can be nested acyclically.
 * Examples of types of structures that we may choose to define later:
    * Proofs/Subproofs, with one specific flavor of it being the kind that
      declares a variable first
    * Definitions of rules, axioms, language rules
    * Formal systems (or "mathematical topics")
    * Theorems and pairing of them with proofs
    * Expressions
    * Maybe variables will be declared by based on placing a variable
      inside an expression by itself, at the head of a variable declaration
      subproof, or maybe by creating a new structure type for variable
      declarations, or maybe something else
    * Homework problems
    * Examples (an environment in which anything you declare ends its scope
      at the end of the example, no matter what it was)
 * The set of structure types should equal the set of common mathematical
   structures that mathematics students should be learning anyway, and they
   should behave the same in Lurch as in mathematics.  This ensures that
   Lurch doesn't add to the mathematics learning curve in this sense.
 * Not every structure is permitted to contain every other type of
   structure.  But such rules are enforced through validation, which we
   will not be defining for some time yet, so this comment is just a
   preview of what's to come.  For instance, expressions can contain only
   other expressions.
 * At some later point, we may care about the meanings of structures, so
   that they can be used as premises in proofs.  At such a time, we will
   ensure that a structure's meaning includes the unjustified steps in the
   structure (which function as premises), the final step in the structure
   (which functions as its conclusion), any variables declared within it
   (which are bound in it), and so on, but it is not necessary to define
   those details yet.  I mention them here merely so that the idea is not
   lost.

## Accessibility

 * A structure A is accessible to a structure B if some ancestor structure
   of B (possibly B itself) is a sibling of A, but A is the (strictly)
   earlier of the two siblings within their parent structure.
 * Equivalently, we can speak of "scope" rather than accessibility.  The
   scope of a structure A is all later siblings of A in the same parent,
   along with all their descendants.  Thus B is in the scope of A iff A is
   accessible to B.

## Attributes

 * Every structure contains a key-value dictionary called *external
   attributes,* which are read-only from the point of view of the LDE, and
   are read-write from the point of view of the UI.  They are called
   "external" because, from the LDE's point of view, they come from
   elsewhere (the UI).
 * Every structure contains a key-value dictionary called *computed
   attributes,* which are read-only from the point of view of the UI, and
   are read-write from the point of view of the LDE.  They are called
   "computed" because the LDE's job is to compute stuff, which it stores in
   these attributes.
 * These two dictionaries are disjoint.  It is possible for a single key k
   to have one value in the one dictionary, and another value in the other
   dictionary.

## Document

 * The entire document will be represented to the LDE as a single
   structure, usually with a nonzero number of inner structures.
 * We call the representation of the entire document as a structure the LDE
   Document, a phrase chosen to connote "the LDE's view of the document,
   not the one the user sees in the UI."
 * One main job of the UI is to convert from what the user sees into the
   LDE Document.
 * So to the list of structure types above, add "Document."
 * The entire LDE Document data structure will live inside the LDE module.
   In the main Lurch app, this implies that the LDE Document will be stored
   in the background thread where the LDE runs, not in the UI.  Thus the UI
   will communicate across threads to create the LDE Document.  Details on
   this later.

## Some brief UI comments

 * Most of the purpose of the UI will be to convert the HTML document the
   user sees into the LDE Document the LDE processes, then to show the user
   in the HTML document and feedback the LDE sends back.
    * In service to that purpose, the UI contains many (largely independent
      and usually small) features for encoding the HTML document into the
      LDE Document.
    * Examples include conventions for processing groups, connections,
      numbered lists, section headings, finding meaning in text through
      regular expressions, and the meanings of various LaTeX-like
      `\shortcuts`.
    * A document author chooses which subset of these features to enable by
      making choices in the document settings dialog.  Those settings are
      stored in document metadata, and propagate to dependencies (defined
      below).
    * The UI will have very little hard-coded (i.e., non-customizable)
      procedures for interpreting the HTML document into the LDE document;
      the settings above are highly choosable by the user.
    * The only constrained interpretation conventions (i.e., few or no
      options for changing the interpretation) would be those that have
      mathematical names, such as "proof," which have a specific meaning
      that it would be educationally counterproductive to interpret another
      way.
    * In addition, we may choose a specific set of document settings to use
      throughout the standard libraries that ship with Lurch, to show best
      practices and help users with consistency and predictability.
 * Other UI details:
    * Because we have a UI that allows users to make connections among
      groups, the structures in the hierarchy may include, among their
      external attributes, a binary, edge-labeled multigraph.  (Note that
      this does not require that every connection in the HTML document
      become two Structures in the LDE Document with attributes connecting
      them.  Nor does it stipulate that some concept--such as
      labeling--that we might decide to represent as part of this
      multigraph can't also be represented sometimes in another way as
      well.)
    * If we require the LDE to send a signal when validation completes,
      then we can make a UI setting of whether to show feedback as the
      feedback arrives, or only after the "all validation complete" signal
      arrives (and thus feedback has stabilized).

## Structures are OOP Objects

 * A structure exposes a set of data and methods about its internal state
   to the rest of the app, in much the same way as Objects in OOP do, with
   the type of structure (from the list above, e.g., Theorem or Example)
   functioning as the "class" of the Object.
 * Some methods in a structure will be time-intensive to run, and thus
   should use an asynchronous paradigm, queueing the tasks for running when
   the LDE thread has time.  The most time-intensive tasks, such as
   matching and parsing, may be delegated to yet other background threads
   by the LDE thread.

## Exporting data from structures

 * Here is an important example method that all structures should have
   (though each class may implement it differently):
    * A method that reports which structures (usually child structures of
      A), if any, are to be made accessible to any structure B in the scope
      of A (thus changing the normal scoping rules).
    * The flexibility inherent in the vagueness of this exporting notion is
      useful.  For instance, a single theorem in the document might be
      encoded in the LDE document as having many children, some of which
      are its various interpretations as a rule of inference, and export
      them all, so that any can be used/cited later.
    * Note that the exports method need not copy child structures directly
      for exporting.  It may combine/manipulate/compute structures to
      export based on its children in any way.  Thus "scope" is a simple
      and clean definition, which this function sort of indirectly extends.
 * We will define much of the functionality of the LDE as the various
   structures in the document calling methods in one another, which is
   simple and elegant.  But it requires that we carefully track and cache
   the clean/dirty status of each structure, to retain efficiency.

## Dependencies as a special case

 * The current paradigm (already implemented) in webLurch is that a
   dependency must specify what data it exports to any document that
   depends on it.
 * Such data will be stored in the dependency document's metadata, so that
   documents depending on it can easily import it.  It will include
   anything that the dependency imported from its dependencies, and so on
   to arbitrary depth.
 * Because we now require every structure to know what it exports to later
   structures, the question of what a document exports is simply a special
   case of that.  The document is itself a structure, and thus it can
   already answer the "what does this document export?" question.
 * Recall from above that one of the pieces of data that a document will
   export is its document settings, as described earlier.

## Design Phases

 * The question, "Which structure should be designed first?" is tricky
   because each structure is rather complex, and they're rather
   interdependent.
 * One approach would be to design each structure incrementally, adding
   features in phases.
 * Thus we might begin with an LDE implementation that has just a few
   features for a few structure types, and yet is sufficient for building
   very simply Lurch libraries.
 * This lets us build familiarity and knowledge as we do the design, so
   we're better at it by the time we get to the hard stuff.
 * Phases 2, 3, and so on can add features and structure types, thus
   enabling more and more sophisticated Lurch libraries, until we have
   reached the level of power that supports a first proof course.

See other documentation on this site for the contents of each design phase.
