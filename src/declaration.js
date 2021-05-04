
import { MathConcept } from './math-concept.js'
import { LogicConcept } from './logic-concept.js'

/**
 * The Declaration class, still just a stub for now.
 * 
 * Documentation coming later.
 */
export class Declaration extends LogicConcept {
    
    static className = MathConcept.addSubclass( 'Declaration', Declaration )
    
}
