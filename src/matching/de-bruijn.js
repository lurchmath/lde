
import { LogicConcept } from '../logic-concept.js'
import { Application } from '../application.js'
import { BindingExpression } from '../binding-expression.js'
import { Symbol as LurchSymbol } from '../symbol.js'

/**
 * Documentation forthcoming
 * 
 * @module DeBruijn
 */

export const deBruijn = 'LDE DB'
const deBruijnSymbol = new LurchSymbol( deBruijn )

const symbolToIndices = symbol => {
    const binders = symbol.ancestorsSatisfying(
        a => a instanceof BindingExpression )
    for ( let i = 0 ; i < binders.length ; i++ ) {
        const boundSymbols = binders[i].boundSymbols()
        for ( let j = 0 ; j < boundSymbols.length ; j++ )
            if ( boundSymbols[j].text() == symbol.text() )
                return [ i, j ]
    }
}

export const encodeSymbol = symbol => {
    const indices = symbolToIndices( symbol )
    return new LurchSymbol( JSON.stringify(
        indices ? [ deBruijn, ...indices ] : [ deBruijn, symbol.text() ]
    ) ).attr( [ [ deBruijn, symbol.toJSON() ] ] )
}

export const encodedIndices = symbol => {
    if ( !( symbol instanceof LurchSymbol ) ) return
    try {
        const parts = JSON.parse( symbol.text() )
        return parts.length == 3 && parts[0] == deBruijn ?
            parts.slice( 1 ) : undefined
    } catch {
        return undefined
    }
}

export const decodeSymbol = symbol => {
    const serialized = symbol.getAttribute( deBruijn )
    if ( !serialized ) throw new Error( 'No de Bruijn information to decode' )
    return LogicConcept.fromJSON( serialized )
}

export const encodeExpression = expression =>
    expression instanceof LurchSymbol ? encodeSymbol( expression ) :
    expression instanceof Application ? new Application(
        ...expression.children().map( encodeExpression ) ) :
    // therefore expression instanceof BindingExpression:
    new Application(
        deBruijnSymbol.copy(), encodeExpression( expression.body() )
    ).attr( [ [
        deBruijn, expression.boundSymbols().map( symbol => symbol.toJSON() )
    ] ] )

export const decodeExpression = expression => {
    if ( expression instanceof LurchSymbol )
        return decodeSymbol( expression )
    if ( expression instanceof Application ) {
        if ( expression.child( 0 ).equals( deBruijnSymbol ) ) {
            // subcase 1: application that encodes what used to be a binding
            const symbolNames = expression.getAttribute( deBruijn )
            if ( !symbolNames )
                throw new Error( 'Missing de Bruijn attribute on Application' )
            return new BindingExpression(
                ...symbolNames.map( json => LogicConcept.fromJSON( json ) ),
                decodeExpression( expression.child( 1 ) ) )
        } else {
            // subcase 2: application that is just an application
            return new Application(
                ...expression.children().map( decodeExpression ) )
        }
    }
    // therefore expression instanceof BindingExpression, which means this is
    // not a correctly-encoded de Bruijn expression
    throw new Error( 'No bindings permitted in de Bruijn encodings' )
}

export const equal = ( expression1, expression2 ) =>
    expression1.equals( expression2, [ deBruijn ] )

