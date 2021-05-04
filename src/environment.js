
import { MathConcept } from './math-concept.js'
import { LogicConcept } from './logic-concept.js'

/**
 * The Environment class, still just a stub for now.
 * 
 * Documentation coming later.
 */
export class Environment extends LogicConcept {
    
    static className = MathConcept.addSubclass( 'Environment', Environment )
    
}
