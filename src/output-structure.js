
import { Structure } from '../src/structure.js'

/**
 * The OutputStructure class, still just a stub for now.
 */
export class OutputStructure extends Structure {
    
    static className = Structure.addSubclass( 'OutputStructure', OutputStructure )

    /**
     * Create a new OutputStructure.  This function simply calls the constructor
     * in {@link Structure the parent class}, then marks this newly created
     * instance as dirty (with {@link Structure#markDirty markDirty()}).  The
     * reason is that the dirty flag for `OutputStructure`s indicates whether
     * they need to be validated.  A newly created `OutputStructure` has not
     * been validated, and thus should be marked dirty.
     * 
     * @constructor
     * @param {...Structure} children - child Structures to be added to this
     *   one, by passing them to the  constructor in
     *   {@link Structure the parent class}
     */
    constructor ( ...children ) {
        super( ...children )
        this.markDirty()
    }
    
}
