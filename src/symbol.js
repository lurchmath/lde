
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
 * 
 * Note:  It is unfortunate that we have a class named Symbol in our
 * ontology while JavaScript also has a class named Symbol.  When there is a
 * need to use both in the same namespace (which occasionally arises, but not
 * often), we will import this class using the alias `LurchSymbol` instead.
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
     *   this symbol.  If this is not a string, it will be converted into
     *   one with the `String` constructor in JavaScript.  If that returns an
     *   empty string, it will be treated as `"undefined"` instead.
     */
    constructor ( text ) {
        super()
        text = String( text )
        this.setAttribute( 'symbol text', text === '' ? 'undefined' : text )
    }

    /**
     * Symbols are supposed to be the atomic type of {@link Expression}.  Thus
     * we override here the default behavior of the
     * {@link MathConcept#insertChild insertChild()} member of the
     * {@link MathConcept} class, making it now do nothing.  Since all other
     * child insertion functions (such as
     * {@link MathConcept#pushChild pushChild()}, etc.) rely internally on
     * {@link MathConcept#insertChild insertChild()}, this effectively makes
     * it impossible to add children to a Symbol instance.
     */
    insertChild () { }

    /**
     * A Symbol never changes its text.  To have a new Symbol, just construct
     * a new one with the new text, rather than trying to re-use an old one
     * and change its text.  Consequently, this function returns the text
     * given at the time the Symbol was constructed.
     * 
     * @returns {String} the text given at construction time
     */
    text () { return this.getAttribute( 'symbol text' ) }

    /**
     * This method overrides {@link MathConcept#toString the implementation in
     * the MathConcept class}, which creates LISP-style S-expressions.  Here we
     * handle the atomic case by writing the name of the symbol instead.
     * 
     * @returns {String} the string representation of this Symbol, which is just
     *   its {@link Symbol#text text()}
     */
    toString () { return this.text() }

    /**
     * The original `value()` function was {@link Expression#value implemented
     * in the Expression class}, but as a pure virtual method, meaning that it
     * defers its implementation to subclasses.  Here, we add support for the
     * following conventions:
     * 
     *  * A Symbol with the `"evaluate as"` attribute set to `"integer"` will
     *    have a `value()` equal to the result of parsing the Symbol's
     *    {@link Symbol#text text()} content as an integer, using the standard
     *    JavaScript `parseInt()` function.  This includes ignoring nonsense
     *    at the end of the string, returning the inital number only.  Nan
     *    will be returned if the string does not even begin with an integer.
     *  * A Symbol with the `"evaluate as"` attribute set to `"real"` will
     *    have a `value()` equal to the result of parsing the Symbol's
     *    {@link Symbol#text text()} content as a real number, using the
     *    standard JavaScript `parseFloat()` function.  Note that this
     *    supports not only standard decimal notation, but also the text
     *    `"Infinity"` and scientific notation of the form `1.2e3` or
     *    `1.2E3`.  Spaces are permitted and nonsense at the end of the string
     *    is ignored.  NaN will be returned if the string does not even begin
     *    with a float.
     *  * A Symbol with the `"evaluate as"` attribute set to `"string"` will
     *    have a `value()` equal to its {@link Symbol#text text()}.
     * 
     * @returns {*} The value of the Symbol, as documented above, or undefined
     *   if none of the above cases applies
     */
    value () {
        switch ( this.getAttribute( 'evaluate as' ) ) {
            case 'integer' : return parseInt( this.text() )
            case 'real' : return parseFloat( this.text() )
            case 'string' : return this.text()
        }
    }
    
}
