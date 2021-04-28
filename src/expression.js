
import { MathConcept } from '../src/math-concept.js'
import { LogicConcept } from '../src/logic-concept.js'

/**
 * The Expression class, still just a stub for now.
 * 
 * Documentation coming later.
 */
export class Expression extends LogicConcept {
    
    static className = MathConcept.addSubclass( 'Expression', Expression )
    
}
