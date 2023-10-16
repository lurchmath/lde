# LDE Experiments

Welcome to the [experimental](.) folder of this branch of the Lurch LDE project.  Here we gather code and content for rapidly testing, benchmarking, and prototyping design ideas for the LDE.

The main experiment currently in progress is an implementation of the $n$-_compact polynomial time global validation algorithm_. This is contained primarily in the following files.
   1. [lode.js](./lode.js) - All lurch documents, libraries, rules, theorems, and proofs begin essentially as a string (or more generally, text).  Each UI provides some way for the users and library authors to enter, save, store, load, and merge such text.  
   
      𝕃𝕠𝕕𝕖 is a node.js command line UI intended for developers. Document text is created either directly at the command prompt as short test strings, or in an external editor and saved as a file for larger documents.  This file defines the 𝕃𝕠𝕕𝕖 repl and contains utilities for listing, loading, and merging such strings.

   2. [parsing.js(parsing.js)] - If the UI produces a string from the user's content it must be parsed into an LC to hand to the LDE for validation.  In some cases it may be easier to obtain the desired LC by first parsing the string to an LC has been converted to an LC by post processing what we refer to as `Shorthands` - special LC content that indicate some way in which the LC needs further modification before proceeding. Currently available parsers are for `putdown` and an [asciimath](parsers/asciimath.peggy) extension of putdown that supports a small but useful subset of asciimath (http://asciimath.org/).

   3. [interpret.js](interpret.js) - Any LC environment can be validated by $n$-_compact validation_, but will usually need to be modified in place to prepare it for validation by calling the main `interpret()` routine, contained in this file.  In particular, it will move all global constant declarations to the top of the environment, create a rule associated with each user theorem, move declaration bodies after the declaration, wrap all `Let` declarations in an environment as needed to form _Let environments_, give all bound variables a canonical alpha-equivalent name, convert all rules into formulas and store information about their domains, assign unique names to symbols declared with a body, and mark all global constants throughout the document.

   4. [global-validation.js](global-validation.js) - this is the main part of the validation routine.  It constructs all of the relevant instantiations, both for the n-compact global validation algorithm and for other validation tools for special entitied such as BIH and Transitive Chains and Scoping.  Each of these vlidation tools is run and it's validation results stored in the relevant locations in the document.  Additional information, such as which user espressions lead to a particular instantiation, is stored in the instantiations as well for future reporting.  Once that information is available, it is easy to validate a particular target or validate things in different ways (like whether the conclusion of a universal generalization appears within the scope of the required arbitrary declaration (preemie check).

   5. [reporting.js](reporting.js) - once a document is fully instanted, we can generate reports about the results.  This can be as simple as putting a green checkmark or red x after a conclusion, or giving entire reports about how a particular instantiation is found or what rules had something to say about a particular conclusion.  The routines in this file can mine a validated document for various information, and report it in a way that is compatible with 𝕃𝕠𝕕𝕖 (terminal output).

   6. [extensions.js](extensions.js) - contains miscellaneous extensions to the LC class and subclasses and utilties that are helpful for this code.



## Attributes

Any LC in a document can have two kinds of attributes - LC attributes and ordinary js attributes. This validation algorithm uses many different attributes of both kinds to carry out its work in addition to those already defined for all LCs. Attributes which must be supplied by the user are saved as LC attributes as part of the document content.  Attributes which can be computed from the user's content are stored in js attributes.  There are exceptions to this however, because the `LC.copy()` function only copies LC attributes, not js attributes, so sometimes we use an LC attribute when having that functionality makes the code simpler.

### LC Attributes

The following attributes set the type of the LC.
* `Declare` - an LC used to define global constants.  Always appears at the top of the document.
* `Rule` - an LC that defines a rule. It must be a given environment.
* `Theorem` - a claim environment that the user wants to prove, and then use as a new rule after that.
* `BIH` - a blatant instantiation hint. Allows the user to provide an explicit instantiation of some rule in the document.

In addition, these LC attributes store a value.

* `ExpectedResult` - Stores the expected result from validating this LC.  Intended primarily for testing, where the actual validation result can be compared to the expected one.  Typical results are 'valid', 'indeterminate', and 'invalid'.
* `ID` - stores an ID number associated with this LC.  Can be used by a UI to map LC feedback results to entities in the user's original content that produced the document.
* `ProperName` - the alternate name of a symbol used when computing propositional form. 
   - Bound symbols have `ProperName` `x₀,x₁,x₂,...` so alpha equivalent expressions have the same propositional form.
   - Free symbols, `c`, in the scope of a declaration of `c` with a body have `ProperName` formed by appending the putdown form of the body to the symbol name separated by a `#` character, e.g., `c#body`, so symbols with the same name that are defined differently have different propositional forms.
* `Part` - indicates this is a partial instantiation constructed during validation (still contains metavariables).  It is ignored for propositional form.
* `Inst` - indicates this is an instantiation and should be used for propositional form.
* `validation results` - a replacement for `validation result` set by the [validation engine](../validation/engine.js).

### js Attributes

The following js attributes store data that is computed from the user's content, and needed for validation and reporting feedback.
* `.userRule` - true for the Rule copies of Theorems.
* `.bodyOf` - true for the copies of declaration bodies
* `.ignore` - true for anything that should be ignored when computing the propositional form (e.g., expressions or rules containing metavariables)
* `.domain` - stores the domain of a non-forbidden proposition or a formula (`Rule`s or `Part`s) containing at least one non-forbidden proposition whose domain is nonempty.
* `.isWeeny` - true for a formula that contains one or more propositions containing all of the metavariables in the formula
* `.weenies` - the set of all maximally weeny propositions in a formula (i.e., containing the largest number of metavariables), whether or not the formula itself is weeny.
* `.domainsProcessed` - true if this document has already had all of its domain information processed and stored.  Should only appear on an entire document, not on any target inside the document.
* `.rule` - the rule that this `Part` or `Inst` is an instantiation of.
* `.creators` - the list of user expressions that created this `Part` or `Inst`.
* `.pass` - which instantiation pass created the `Part` or `Inst`.
* `.numsolns` - the number of solutions found when matching the expression and formula proposition that created this `Part` or `Inst`
* `letScopes` - caches the Let scopes in the document (not targets)
* `cat` - caches the docuement catalog in the document (not targets)
* `.userPropositions` - caches the user's propositions (things that have a propositional form, do not contain metavariables, and are not inside a `Rule`).

### n-compact Documents

An LC is a *$n$-compact Document* (or simply a *doc*) if it is a claim environment that has been processed and transformed as follows.
   - `processShorthands()` - All shortHands have been processed.
   - `moveDeclaresToTop()` - move all `Declare`'s to the top (i.e., make them be the first children of the document).
   - `processTheorems()` - put a copy of every `Theorem` after it as a next sibling and mark it as a `Rule` and a `.userRule` (unless such a copy would have no metavars).
   - `processDeclarationBodies()` - put a copy of the body of every declaration which has a body after it as a next sibling and store the declaration in the `.bodyOf` attribute of the copy.
   - `processLetEnvironments()` - check that every Let (i.e. given) declaration that is not the first child of its parent is wrapped in an environment containing its scope (a *Let-environment*).
   - `processBindings` - assign `ProperNames` `x₀,x₁,x₂,...` to all bound variables to allow alpha-equivalent expressions to have the same propositional form.
   - `processRules()` - convert every `Rule` to a formula and mark it `.ignore` if it contains metavariables. Also rename any bound variables in it to something that cannot be entered by the user (currently, `y₀,y₁,y₂...`).
   - `assignProperNames()` - assign `ProperNames` to any symbol, `c` in the scope of a declaration with body by appending `#` followed by the putdown form of the body, e.g., `c#body`.  This applies to both `Let` and `ForSome` declarations with body. 
   - `markDeclaredSymbols` - mark every symbol declared by a global `Declare` declaration as a `.constant`.

Additionally, the following processing of the document is more specific to the n-compact validation algorithm.   
   - `processDomains()` - for each formula (`Rule` or `Part`) and each proposition they contain, store the domain (=set of metavariable names), whether or not the formula is a Weeny (contains a non-forbidden proposition containing all of the metavariables), and what it's weenies are, if any (propositions containing the maximal number of metavariables, even if the formula isn't iteself a weeny formula). The only part of this that is sort of specific to the n-compact validation algorithm is the definition of what is 'forbidden', so if we consider that to be a parameter this can be moved up with the previous collection of utilities that pre-process the document before validation. 



This is contained primarily in the following files.
 * [global-validation-lab.js](./global-validation-lab.js) - the validation algorithm itself.
 * [document.js](document.js) - defines a [Document class](document.js#L604) that makes it easy to manage and load the lbiraries, proofs, and parsers.
 * [extensions.js](extensions.js) - defines extensions to the LC class and other LDE classes to support the algorithm.
 * [CNFProp.js](CNFProp.js) - defines a class to construct the CNF propositional form of an LC to support this algorithm.
 * [reporting.js](reporting.js) - custom utilities for outputing LC documents with syntax highlighting and other informative annotation in a terminal.

This algorithm can be tested using the files in the following subfolders:
 * [libs](./libs) - libraries that can be loaded at the top of documents
 * [parsers](./parsers) - parsers to convert user friendly text to LCs
 * [proofs](./proofs) - example proofs to add after the libraries in a document
   -  [acid tests](./proofs/acid%20tests/) - proofs used to test basic functionality
   - [tasty](./proofs/tasty/) - some example proofs for a version of the Tasty toy system.

In addition to the content of the [experiments](./) folder, there are some supporting files in the [scripts](../../scripts/) folder.
  * [lode.js](../../scripts/lode.js) - LODE, the Lurch Node app.  Used with the node REPL for testing.
  * [acidtests.js](../../scripts/acidtests.js) - runs all of the acid tests by typing `.test` in Lode
  * [init.js](../../scripts/init.js) - an initialization file for Lode that is run at startup.
  * [initproofs.js](../../scripts/initproofs.js) - another initialization file that is loaded when you enter the `initialize()` command in Lode.
  * [disable-event-target.js](../../scripts/disable-event-target.js) - disables the event-target content in LCs since they are not needed for Lode.

## The n-compact Algorithm

Here we describe the n-compact algorithm in detail as currently implemented.  This is subject to a lot of change, but we will attempt to keep it up to date.

**Document** - an LC is considered to be a document if it consists of a single LC environment, whose children are either 
  1. `Declare` - Declarations of constants that cannot be metavariables.
  2. `Rules` - given environments used as formulas.
  3. `User's content` - a single claim environment which must be the last child and contains the user's theorems, definitions, and proofs.

The command `load(docs,libs)` in [global-validation-lab.js](global-validation-lab.js#L1) calls the constructor for a Document with args `docs` and `libs`.  Each is either a single string or an array of strings, each of which is the filename of a proof or library to load from their respective folders (with optional file extension). $^0$

To construct the document initially it does the following.

### I. Load Libraries <span style='font-family:monospace;font-size:9pt'>(see [loadLibs()](document.js#L1))</span>
1. load each library named in `libs`
2. process its shorthands $^1$
3. merge the libs - move all `Declare`'s to the beginning and all `Rules` after that.
4. add the reserved _system constants_ on top (e.g. `LDE EFA` and `---`)
5. mark the `Declare` declarations asA `Declare`
6. insert copies of `ForSome` declaration bodies containing no metavariables (which will be all of them at this point) after the declaration, and mark asA `Body`.  These can be instantiated later $^2$
7. mark all Rules asA 'Rule'
8. make all Rule environments into Formulas
9. mark `.ignore` on all Rules containing metavariables so they don't get a prop form
10. replace all bound variables in Rules with y₀, y₁, ... which cannot be entered in a user's doc $^3$
11. assign all bound vars ProperNames to x₀, x₁, ... so that Propositional Forms are canonical for alpha-equivalence

### II. Load the User Docs <span style='font-family:monospace;font-size:9pt'>(see [loadDocs()](document.js#L1))</span>
1. create an empty environment to store all of the docs
2. load the docs one at a time and push them on the environment
3. process all shorthands $^1$
4. process all Lets by adding appropriate environments as needed so that `Let` declarations are always the first child of their parent
5. insert copies of `ForSome` bodies with no metavariables after the declarations, and mark asA 'Body' $^2$
6. assign all of the user's bound variables ProperNames to x₀, x₁, ... so that Propositional Forms are canonical for alpha-equivalence
7. Push the entire resulting user doc environment onto the environment holding the libraries to form the Document <span style='font-family:monospace;font-size:9pt'>(see the [Document class constructor](document.js))</span>

### III. Assign Proper Names <span style='font-family:monospace;font-size:9pt'>(see [assignProperNames()](document.js#L1))</span>
1. all symbols in the scope of a `ForSome` or `Let` with body are renamed by appending the prop form of the body to the symbol name
2. for `Let`s with no body set its symbol ProperNames to their ordinary `.text()` name (this is important later to clear any extraneous ProperNames inherited via an instantiation)
3. all symbols in the scope of a `Let` are assigned a ProperName by adding a tick mark to their symbol name
4. mark all symbols in the scope of a Declare as a `.constant` <span style='font-family:monospace;font-size:9pt'>(see [markDeclaredSymbols()](document.js#L1))</span>

### IV. Process the User's Theorems <span style='font-family:monospace;font-size:9pt'>(see [Document Class constructor](document.js#L1))</span>
1. For each user environment flagged as a `.userThm` (after processing shorthands) make a copy of it immediately after it
2. mark the copy as a `.userRule`
3. mark the copy as a 'Rule'
4. convert the copy to a formula

At this point the document has been loaded and constructed. It is ready to be validated.

### V. Process the Document <span style='font-family:monospace;font-size:9pt'>(see [processDoc()](global-validation-lab.js#L1))</span>
1. Process Domains <span style='font-family:monospace;font-size:9pt'>(see [processDomains()](global-validation-lab.js#L1))</span>
   1. for each formula, cache the domain in `.domain`, the maximal weeny expressions in `.weenies`, avoiding forbidden weenies, and mark anything `.finished` that can no longer be instantiated (because it has only forbidden metavars or no metavars)
   2. if the domain is empty mark the formula asA `Inst` and unmark it as a `Rule`

2. Process Hints <span style='font-family:monospace;font-size:9pt'>(see [processBIHs()](global-validation-lab.js#L1))</span>
   1. process all Blatant Instantiation Hints (BIH's) $^4$
   2. if a BIH is valid, create its instantiation, and mark it as an 'Inst' and set its `.rule` attribute to the 'Rule' it instantiates
   3. if a BIH is valid as a BIH, it has to be valid propositionally by definition, and will be marked with a gold star after validation, but if it is not a valid BIH, it might still be propositionally valid or invalid, so in that case it will receive both a propositional green check or redx in addition to a red star

3. Check for Scoping errors <span style='font-family:monospace;font-size:9pt'>(see [Scoping.validate()](../scoping.js#L1))</span>
   1. run the built-in scoping tool to check for scoping errors. $^4$

4. Mark Declared Symbols <span style='font-family:monospace;font-size:9pt'>(see [markDeclaredSymbols()](document.js#L1))</span>
   1. Mark declared constants with `.constant` $^5$

It is now ready for the main validation algorithm to work its magic.

### VI. Instantiate (for $n$-compact) <span style='font-family:monospace;font-size:9pt'>(see [instantiate()](global-validation-lab.js#L1))</span>
1. if $n=0$ we are done
2. get a list of all user propositions (no duplicates)  
3. get all formulas which are not `.finished`
4. if $n=1$ restrict to purely Weeny formulas (ones that have a single expression containing all of their metavariables)
5. try to match each maximally Weeny (i.e., containing the most number of distinct metavariables) expression in each formula to every user proposition $^6$
6. for each solution found, try to instantiate the formula.
7. for each instantiation found, insert it after the formula, mark it asA 'Given'
8. assign the ProperNames in the instantiation in case it contains a `Let` or `ForSome` declaration $^7$
9. mark the instantiation with the user proposition that created it by adding it to the `.creators` list (which may have other entries if it was created from a partial instantiation)
10. mark the instantiation which Rule it is a `.rule` of
11. mark which `.pass` created this instantiation
12. cache the formula domain information for this instantiation
13. mark the instantiation asA 'Part' (partial instantiation) if it still has metavariables, or a 'Inst' if it does not
14. if the instantiation isA 'Part', `.ignore` it when computing Prop form
15. assign the Proper Names to the bindings in the instantiation to give them a canonical Prop form for alpha-equivalence
16. mark each formula `.finished` when it is done so we don't try to match it again on a future pass
17. mark the declared constant symbols in the document again $^5$
18. instantiate another pass for $(n-1)$-compact

### VII. Propositionally Validate Everything <span style='font-family:monospace;font-size:9pt'>(see [Environment.prototype.validateall()](global-validation-lab.js#L1))</span>
1. to validate the entire document at this point we just compute its propositional form and ask SAT (or FIC $^8$) if it is a tautology
2. define an _inference_ to be any claim expression or environment in the document, all of whose ancestors are claims, and have a propositional form
3. to validate a particular inference in the document the prop form computation ignores anything that is not relevant to the propositional validation of the inference (for example anything not accessible to it)
4. to validate every inference in the document, first validate the entire document - if it is valid mark every inference as valid and we are done
5. if not valid recurse on the children - any valid child can have all of its inferences marked as valid immediately, and invalid ones are recursed into and their children checked until the everything is checked

### VIII. Preemie Check
1. If the document contains any inference `Let` environments, fetch them and sort them by the number of `Let`s in their scope so we can check them from the inside out
2. for each such `Let` validate it's parent as a preemie 
   1. if it's not already validated propositionally, check it, and don't check it for preemies unless it is 'valid' by 'n-compact'
   2. check if it is still propositionally valid when its `Let` is deleted and all occurrences of the symbols it declares in either the scope of the deleted `Let` or instantiations that do not themselves have their own copy of `Let` use their ordinary symbol name instead of their ProperName (i.e., instantiation proper names are ignored for symbols that have the same `.text` name as one of the symbols in the deleted `Let` but aren't in the scope of a declaration of that symbols that is, itself, inside the instantiation)
   3. if it is no longer propositionally valid, it is a preemie, so mark it and all of its ancestors as a preemie
   4. to narrow down specifically what inside the `Let` environment is a preemie, check all of it's conclusions to see if they are a preemie, and mark all of their ancestors as one if one or more is found.

<div style="color:cadetblue;font-size:9pt">
TODO footnotes: 

0. upgrade this to allow doc and libs to be passed as LCs or putdown or pegdown directly without saving them as files first
1. Replace this functionality with the more powerful peggy parser.
2. Consider the following upgrade. Have the peggy parser (or other input) simply create the body after the declaration immediately, and attribute them to show they are associated with each other.
3. This is needed because Matching checks for variable capture, but `Formula.instantiate()` does not.
4. Upgrade this to handle all sorts of local tools, not just BIH's, e.g. CAS, Preemie check for Let-envs, transitive chains, other kinds of hints.  Decide where the right place is to handle these. Still return one validation result for each LC that needs one, but such a validation object can contain an array of the results and feedback from each of the tools. (Q: Is the current scoping check really just one of these sorts of tools?)
5. We run this check several times.  Perhaps some are redundant?
6. This requires a special `matchPropositions` routine because `Let` and `ForSome` declarations have a propositional form and the `Problem` class doesn't support this.
7. We don't insert `ForSome` bodies here because they were inserted in the original Rules above.  Check that this is the sensible way to do this.
8. Currently implemented only for individual conclusions inside the document.
</div>