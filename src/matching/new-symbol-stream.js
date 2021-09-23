
import { MathConcept } from "../math-concept.js"
import { Symbol } from "../symbol.js"

/**
 * In many situations, it's useful to be able to create new symbols, which
 * means symbols that have not already appeared in a given context.  Consider
 * the following example.
 * 
 * Say we have a mathematical expression like $\forall x,x>y$, and we wish to
 * substitute some value for $y$, and we want to avoid variable capture.
 * That is, perhaps we're substituting $y=x^2$, and we want to avoid the $x$ in
 * $x^2$ becoming bound by the quantifier.  So we need to perform
 * $\alpha$-renaming on $\forall x,x>y$, using a new symbol that does not
 * show up in any of these expressions so far.  That is, the new symbol should
 * not be any of $x,y,\forall,>,=,2$.
 * 
 * In that example, we would like to create one new symbol, where "new" means
 * "does not appear in any of a chosen set of expressions."  In other
 * situations, we may need to create many new variables, such as when
 * constructing an $n$-ary $\lambda$ expression and needing to name its
 * parameters.  In either case, a NewSymbolStream can solve the problem, as
 * follows.
 * 
 * {@link NewSymbolStream Construct a NewSymbolStream}, passing as arguments to
 * the constructor all the expressions containing "old" symbols, those that are
 * not permitted to be created.  Then ask for one new symbol with
 * {@link NewSymbolStream#next next()}, or ask for many new symbols with
 * {@link NewSymbolStream#nextN nextN()}.
 */
export class NewSymbolStream {

    /**
     * Construct an object that can produce new symbols.  Provide as arguments
     * any expressions whose symbols must be avoided when producing new symbols.
     * This object guarantees that new symbols produced by calls to
     * {@link NewSymbolStream#next next()} or
     * {@link NewSymbolStream#nextN nextN()} will never yield a symbol that
     * appears in any of the expressions given as arguments.
     * 
     * @param  {...any} args These are passed directly to the
     *   {@link NewSymbolStream#avoid avoid()} function; see its documentation
     *   for details.
     */
    constructor ( ...args ) {
        this._lastIndex = 0
        this.avoid( ...args )
    }

    /**
     * This function instructs the stream to avoid producing any of the symbols
     * appearing in the `args` list.  Those arguments may be any
     * {@link MathConcept MathConcept}, in which case all descendants of it
     * (including itself) that are {@link Symbol Symbols} will be avoided by
     * this stream (i.e., never produced as output).  The arguments may also be
     * strings, in which case they are treated as the names of symbols that
     * cannot be produced as output.
     * 
     * To be precise, if $A$ is any argument to this function, and $s$ is the
     * name of any symbol appearing in $A$ (or $A$ is simply the string $s$)
     * then this object guarantees that, for any $n$, calling
     * {@link NewSymbolStream#nextN nextN()} on $n$ will produce an Array of
     * {@link Symbol Symbol} instances none of which are named $s$.
     * 
     * Note that if you later change the expressions provided here, those
     * changes are not tracked or noticed by this stream.  The stream takes note
     * of the symbols in the arguments at the time you call it, and does not
     * check back later to see if the expressions have changed.  You can update
     * the stream using more calls to {@link NewSymbolStream#avoid avoid()}.
     * 
     * @param  {...any} args Any combination of {@link MathConcept MathConcepts}
     *   and JavaScript strings, which will be interpreted as the set of symbols
     *   that this stream is not allowed to produce, as defined above.
     * @see {@link NewSymbolStream#avoid avoid()}
     */
    avoid ( ...args ) {
        const avoidString = str => {
            if ( /^v([0-9]+)$/.test( str ) ) {
                let index = parseInt( str.substring( 3 ) )
                this._lastIndex = Math.max( this._lastIndex, index )
            }
        }
        args.forEach( arg => {
            if ( typeof( arg ) == 'string' )
                avoidString( arg )
            else if ( arg instanceof MathConcept )
                arg.descendantsSatisfying( d => d instanceof Symbol )
                   .forEach( symbol => avoidString( symbol.text() ) )
        } )
    }

    /**
     * Produce a single new symbol from this stream.  The stream guarantees that
     * it will not produce any of the symbols it was instructed to avoid, by
     * all earlier calls to the {@link NewSymbolStream#avoid avoid()} function,
     * and it guarantees that it will not produce any symbol it has produced
     * before.
     * 
     * Of course, calls to {@link NewSymbolStream#avoid avoid()} must precede
     * calls to this function if they are to be obeyed.  That is, calling
     * `S.avoid(x)` and then `S.next()` and then `S.avoid(y)` guarantees that
     * the result of the call to `next()` will avoid `x`, but makes no
     * guarantees about `y`, since it was not instructed to avoid `y` until
     * after the call to `next()`.  But later calls to `next()` will also avoid
     * `y`.
     * 
     * @returns {Symbol} a single {@link Symbol Symbol} instance whose name is
     *   guaranteed to satisfy the constraint described in the documentation for
     *   the {@link NewSymbolStream#avoid avoid()} function.
     * @see {@link NewSymbolStream#nextN nextN()}
     */
    next () { return new Symbol( `v${++this._lastIndex}` ) }

    /**
     * Produce new symbols from this stream.  The stream guarantees that
     * it will not produce any of the symbols it was instructed to avoid, by
     * calls to the {@link NewSymbolStream#avoid avoid()} function, and it
     * guarantees that it will not produce any symbol it has produced before.
     * 
     * @param {integer} N the number of symbols to produce
     * @returns {Symbol[]} An array of length `N` containing all new symbols,
     *   produced by repeated calls to {@link NewSymbolStream#next next()}.
     * @see {@link NewSymbolStream#next next()}
     */
    nextN ( N ) { return Array.from( { length : N } ).map( () => this.next() ) }

}

