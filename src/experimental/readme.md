# LDE Experiments

Welcome to the [experimental](.) folder of this branch of the Lurch LDE project.  Here we gather code and content for rapidly testing, benchmarking, and prototyping design ideas for the LDE.

The main experiment currently in progress is an implementation of the $n$-_compact polynomial time global validation algorithm_. This is contained primarily in the following files.
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
  * [acidtests.js](../../scripts/acidtests.js) - runs all of the acid tests by typing .test in Lode
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
4. Add the reserved _system constants_ on top (e.g. `LDE EFA` and `---`)
5. mark the `Declare` declarations asA 'Declare'
6. insert copies of `ForSome` declaration bodies containing no metavariables (which will be all of them at this point) after the declaration, and mark asA 'Body'.  These can be instantiated later $^2$
7. mark all Rules asA 'Rule'
8. make all Rule environments into Formulas
9. mark .ignore on all Rules containing metavariables so they don't get a prop form
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
2. for `Let`s with no body set its symbol ProperNames to their ordinary .text() name (this is important later to clear any extraneous ProperNames inherited via an instantiation)
3. all symbols in the scope of a `Let` are assigned a ProperName by adding a tick mark to their symbol name
4. mark all symbols in the scope of a Declare as a .constant <span style='font-family:monospace;font-size:9pt'>(see [markDeclaredSymbols()](document.js#L1))</span>

### IV. Process the User's Theorems <span style='font-family:monospace;font-size:9pt'>(see [Document Class constructor](document.js#L1))</span>
1. For each user environment flagged as a .userThm (after processing shorthands) make a copy of it immediately after it
2. mark the copy as a .userRule
3. mark the copy as a 'Rule'
4. convert the copy to a formula

At this point the document has been loaded and constructed. It is ready to be validated.

### V. Process the Document <span style='font-family:monospace;font-size:9pt'>(see [processDoc()](global-validation-lab.js#L1))</span>
1. Process Domains <span style='font-family:monospace;font-size:9pt'>(see [processDomains()](global-validation-lab.js#L1))</span>
   1. cache the domain and maximal weeny expressions in each formula, avoiding forbidden weenies, and mark anything .finished that can no longer be instantiated (because it has only forbidden metavars or no metavars)
   2. if the domain is empty mark the formula asA 'Inst' and unmark it as a 'Rule'

2. Process Hints <span style='font-family:monospace;font-size:9pt'>(see [processHints()](global-validation-lab.js#L1))</span>
   1. process all Blatant Instantiation Hints (BIH's) $^4$
   2. if a BIH is valid, create its instantiation, and mark it as an 'Inst' and set its .rule attribute to the 'Rule' it instantiates
   3. if a BIH is valid as a BIH, it has to be valid propositionally by definition, and will be marked with a gold star after validation, but if it is not a valid BIH, it might still be propositionally valid or invalid, so in that case it will receive both a propositional green check or redx in addition to a red star

3. Check for Scoping errors <span style='font-family:monospace;font-size:9pt'>(see [Scoping.validate()](../scoping.js#L1))</span>
   1. run the built-in scoping tool to check for scoping errors. $^4$

4. Mark Declared Symbols <span style='font-family:monospace;font-size:9pt'>(see [markDeclaredSymbols()](document.js#L1))</span>
   1. Mark declared constants with .constant $^5$

It is now ready for the main validation algorithm to work its magic.

### VI. Instantiate (for $n$-compact) <span style='font-family:monospace;font-size:9pt'>(see [instantiate()](global-validation-lab.js#L1))</span>
1. if $n=0$ we are done
2. get a list of all user propositions (no duplicates)  
3. get all formulas which are not .finished
4. if $n=1$ restrict to purely Weeny formulas (ones that have a single expression containing all of their metavariables)
5. try to match each maximally Weeny (containing the most number of distinct metavariables) expression in each formula to every user proposition $^6$
6. for each solution found, try to instantiate the formula.
7. for each instantiation found, insert it after the formula, mark it asA 'Given'
8. assign the ProperNames in the instantiation in case it contains a `Let` or `ForSome` declaration $^7$
9. mark the instantiation with the user proposition that created it by adding it to the `.creators` list (which may have other entries if it was created from a partial instantiation)
10. mark the instantiation which the Rule it is a `.rule`
11. mark which `.pass` created this instantiation
12. cache the formula domain information for this instantiation
13. mark the instantiation asA 'Part' (partial instantiation) if it still has metavariables, or a 'Inst' if it does not
14. if the instantiation isA 'Part', `.ignore` it when computing Prop form
15. assign the Proper Names to the bindings in the instantiation to give them a canonical Prop form for alpha-equivalence
16. mark each formula .finished when it is done so we don't try to match it again on a future pass
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
   2. check if it is still propositionally valid when it's `Let` is deleted and all occurrences of the symbols it declares in either the scope of the deleted `Let` or instantiations that do not themselves have their own copy of `Let` use their ordinary symbol name instead of their ProperName (i.e., instantiation proper names are ignored for symbols that have the same .text name as one of the symbols in the deleted `Let` but aren't in the scope of a declaration of that symbols that is, itself, inside the instantiation)
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