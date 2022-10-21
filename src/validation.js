
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
 * Because there can be many different ways to validate a document and its
 * contents, this module lets the client {@link module:Validation.installTool
 * install any number of validation tools}.  Some validation tools will be
 * installed in this module by default, when the module is loaded, but the
 * client can add others.
 * 
 * The user can also specify options for how validation tools should operate,
 * either global options for this whole module, or options installed on
 * individual {@link LogicConcept LogicConcepts} (for when that individual
 * {@link LogicConcept} is validated), all using the
 * {@link module:Validation.setOptions setOptions()} function.
 * 
 * @module Validation
 */

import { Expression } from './expression.js'
import { Environment } from './environment.js'

// Import all the functions from the validation engine:
import {
    installTool, installedToolNames, installedTool, functionToTool,
    getOptions, setOptions, clearOptions, result, setResult, clearResult,
    validate
} from './validation/engine.js'
// And the sequent class:
import { Sequent } from './validation/sequent.js'


// A meta-tool: validateConclusionsWith(T) returns a validation tool that, if
// given a conclusion, validates it with the tool named T; if given an
// Environment, validates each of its conclusions with the tool named T; and
// if given anything else, throws an error.
const validateConclusionsWith = toolName => {
    return ( target, options ) => {
        // console.log( 'val concls of',
        //     target.toPutdown ? target.toPutdown() : target,
        //     'w/opts', options )
        options = Object.assign( JSON.copy( options ), { tool : toolName } )
        if ( target instanceof Environment ) {
            target.conclusions().forEach( concl => validate( concl, options ) )
        } else if ( ( target instanceof Expression )
                 && target.isAConclusionIn( /* top-level ancestor */ ) ) {
            validate( target, options )
        } else {
            throw new Error( 'validateConclusionsWith() '
                           + 'accepts only Environments and conclusions' )
        }
    }
}
// And an easy way to apply it to any tool, by installing a new validator that
// distributes an old one over conclusions:
const installConclusionsVersion = toolName =>
    installTool( `${toolName} on conclusions`,
        validateConclusionsWith( toolName ) )


// Import and install built-in validation tools:

// JS arithmetic
import { arithmeticValidator } from './validation/float-arithmetic.js'
installTool( 'floating point arithmetic',
    functionToTool( arithmeticValidator ) )
installConclusionsVersion( 'floating point arithmetic' )

// CAS
import { CASValidator } from './validation/algebrite-cas.js'
installTool( 'CAS', functionToTool( CASValidator ) )
installConclusionsVersion( 'CAS' )

// Propositional Logic
import {
    classicalPropositionalValidator, intuitionisticPropositionalValidator
} from './validation/reduction.js'
installTool( 'classical propositional logic',
    functionToTool( classicalPropositionalValidator ) )
installConclusionsVersion( 'classical propositional logic' )
installTool( 'intuitionistic propositional logic',
    functionToTool( intuitionisticPropositionalValidator ) )
installConclusionsVersion( 'intuitionistic propositional logic' )

// Export the public API only:
export default {
    installTool, installedToolNames, installedTool,
    functionToTool, installConclusionsVersion,
    getOptions, setOptions, clearOptions, result, setResult, clearResult,
    validate, validateConclusionsWith,
    Sequent
}
