
import { MathConcept } from './math-concept.js'
import { Expression } from './expression.js'

/**
 * A Symbol is an atomic {@link Expression}.  This includes all types of
 * mathematical symbols, from variables like x and y to constants like 1, 2,
 * and pi, as well as symbols for operators like `+` or the capital sigma for
 * summation.
 * 
 * The primary datum stored in a Symbol is a single text string, which defines
 * the symbol.  For more information on this datum, see the constructor.
 */
export class Symbol extends Expression {
    
    static className = MathConcept.addSubclass( 'Symbol', Symbol )

    /**
     * When constructing a symbol, we must provide the text that defines it.
     * This will typically be the Unicode text for the symbol itself, such as
     * `"x"` or `"1"`, or the Unicode character for the Greek letter pi.  But
     * there is no formal requirement that the text stored in the symbol be
     * exactly the text that would be used to represent the symbol in a
     * typical mathematical document.  There is not even a requirement that
     * the text have any particular form, except that it be a nonempty string.
     * 
     * @param {String} text - any nonempty string to be used as the text for
     *   this symbol
     * @throws Will throw an error if the argument is not a string, or is the
     *   empty string.
     */
    constructor ( text ) {
        super()
        if ( typeof( text ) !== 'string' || text === '' )
            throw new Error(
                'Symbols are constructed from a nonempty string' )
        this._text = text
    }
    
}
