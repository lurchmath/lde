
// A set of validation tools that reduce complex validation needs to cases that
// can be handled as queries about propositional logic, using the
// PropositionalForm class.

import { Environment } from '../environment.js'
import { PropositionalForm } from './propositional-form.js'

// What attributes are relevant for the propositional meaning of a LogicConcept?
const relevantAttributes = new Set( [
    'symbol text',
    '_type_given'
] )
// Function that deletes all non-meaningful attributes from a LogicConcept
const removeIrrelevantAttributes = LC => {
    const original = new Set( LC.getAttributeKeys() )
    const toRemove = Array.from( original.difference( relevantAttributes ) )
    if ( toRemove.length > 0 ) LC.clearAttributes( ...toRemove )
}

// If we convert the conclusion and all of its accessibles to propositional
// form, not trying to instantiate formulas or respect variable scoping rules,
// does the conclusion follow from its accessibles?
const createPropositionalValidator = classical =>
    ( conclusion/*, options */ ) => {
        // Copy all accessibles into a new sequent we can manipulate,
        // removing any irrelevant attributes such as old feedback:
        const sequent = new Environment(
            ...conclusion.accessibles().reverse().map(
                premise => premise.copy().makeIntoA( 'given' ) ),
            conclusion.copy() )
        sequent.children().forEach( removeIrrelevantAttributes )
        // Convert the sequent to propositional form:
        const proposition = PropositionalForm.fromConclusion(
            sequent.lastChild(), sequent )
        // Validate the sequent and return the result:
        const valid = classical ? proposition.isAClassicalTautology()
                                : proposition.isAnIntuitionisticTautology()
        return {
            result : valid ? 'valid' : 'invalid',
            reason : classical ? 'Classical Propositional Logic'
                               : 'Intuitionistic Propositional Logic'
        }
    }

// Export conveient access to classical propositional validation
export const classicalPropositionalValidator =
    createPropositionalValidator( true )

// Export conveient access to intuitionistic propositional validation
export const intuitionisticPropositionalValidator =
    createPropositionalValidator( false )
