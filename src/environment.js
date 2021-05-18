
import { MathConcept } from './math-concept.js'
import { LogicConcept } from './logic-concept.js'
import { Expression } from './expression.js'
import { Declaration } from './declaration.js'

/**
 * The Environment class, still just a stub for now.
 * 
 * Documentation coming later.
 */
export class Environment extends LogicConcept {
    
    static className = MathConcept.addSubclass( 'Environment', Environment )

    /**
     * Any {@link LogicConcept} can be marked as a "given," meaning that it is
     * to be seen as a hypothesis/assumption within its context.  Any
     * {@link LogicConcept} not so marked is viewed as a "claim," meaning that
     * it is an assertion/statement of truth, within its context.  For this,
     * we use the attribute functions built into the {@link MathConcept}
     * class, including {@link MathConcept#isA isA()},
     * {@link MathConcept#asA asA()}, and so on.
     * 
     * The conclusions of a LogicConcept include:
     * 
     *  * all of its children that are claim {@link Expression Expressions}
     *  * all of the conclusions in any of its child Environments, recursively
     */
    conclusions () {
        let result = [ ]
        this.children().forEach( child => {
            if ( child.isA( 'given' ) ) return
            if ( child instanceof Expression || child instanceof Declaration )
                result.push( child ) // guaranteed to be outermost expr/decl
            else if ( child instanceof Environment )
                result = result.concat( child.conclusions() )
        } )
        return result
    }

}
