
/**
 * ## What is Validation?
 * 
 * Validation is the process of computing feedback for the user about the
 * validity of their reasoning.  It can be run on any {@link LogicConcept
 * LogicConcept}, from a small one that represents only a single equation of
 * arithmetic up to a large one that represents an entire document containing
 * many theorems and proofs.
 * 
 * The word "reasoning" is used in a very broad sense here; there are many
 * ways one can define validation and many meanings one can ascribe to symbols
 * in a document (or no meaning at all in a toy system).  But we will call the
 * user's work "reasoning" because typically Lurch will be grading actual
 * mathematical proofs, and the user will be doing some reasoning in any case
 * in order to use even a toy system, even if the system itself has no
 * meaning.
 * 
 * Because there can be many different ways to validate a
 * {@link Environment#conclusions conclusion()}, this module lets the client
 * {@link module:Validation.installTool install any number of validation
 * tools}.  Some validation tools will be installed in this module by default,
 * when the module is loaded, but the client can add others.
 * 
 * The user can also specify options for how validation tools should operate,
 * either global options for this whole module, or per-conclusion options, all
 * using the
 * {@link module:Validation.setOptions setOptions()} function.
 * 
 * @module Validation
 */

// Import all the functions from the validation engine:
import {
    installTool, installedToolNames,
    options, setOptions, clearOptions, result, setResult, clearResult,
    validate
} from './validation/engine.js'


// Import and install built-in validation tools:

// JS arithmetic
import { arithmeticValidator } from './validation/float-arithmetic.js'
installTool( 'floating point arithmetic', arithmeticValidator )

// CAS
import { CASValidator } from './validation/algebrite-cas.js'
installTool( 'CAS', CASValidator )


// Propositional Logic
import {
    classicalPropositionalValidator, intuitionisticPropositionalValidator
} from './validation/reduction.js'
installTool( 'classical propositional logic', classicalPropositionalValidator )
installTool( 'intuitionistic propositional logic',
             intuitionisticPropositionalValidator )

// Export the public API only:
export default {
    installTool, installedToolNames,
    options, setOptions, clearOptions, result, setResult, clearResult,
    validate
}