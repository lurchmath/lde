
import { Structure } from '../src/structure.js'

/**
 * The InputStructure class, still just a stub for now.
 */
export class InputStructure extends Structure {
    
    static className = Structure.addSubclass( 'InputStructure', InputStructure )
    
    /**
     * Setter for the "dirty" flag of this Structure.  For information on the
     * general meaning of the flag, see {@link Structure#isDirty isDirty()}.
     * For `InputStructure`s specifically, it indicates that the Structure needs
     * to be re-interpreted, because it has changed since interpretation was
     * last run.
     * 
     * This method extends the parent class's method by ensuring that marking an
     * `InputStructure` dirty propagates up the ancestor chain, so that all
     * ancestors are also marked as needing to be interpreted again.  (Marking
     * an `InputStructure` clean by passing false to this function does *not*
     * propagate up the ancestor chain.)
     * 
     * @param {boolean} [on=true] Whether to mark it dirty (true)
     *   or clean (false).  If this value is not boolean, it will be converted
     *   to one (with the `!!` idiom).
     * @see {@link Structure#isDirty isDirty()}
     */
    markDirty ( on = true ) {
        super.markDirty( on )
        if ( on && this.parent() ) this.parent().markDirty()
    }

}
