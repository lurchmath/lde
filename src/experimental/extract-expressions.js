
import {
    LogicConcept, Expression, BindingExpression, LurchSymbol
} from '../index.js'
import fs from 'fs'

const operators = [
    [
        { name : '⇔', type : 'infix', arity : 2 },
    ],
    [
        { name : '⇔', type : 'infix', arity : 2 },
    ],
    [
        { name : '⇒', type : 'infix', arity : 2 },
    ],
    [
        { name : 'or', type : 'infix', arity : [ 2, 3 ] },
    ],
    [
        { name : 'and', type : 'infix', arity : 2 },
    ],
    [
        { name : '=', type : 'infix', arity : 2 },
        { name : '<', type : 'infix', arity : 2 },
        { name : '>', type : 'infix', arity : 2 },
        { name : '≤', type : 'infix', arity : 2 },
        { name : '⊆', type : 'infix', arity : 2 },
        { name : '∈', type : 'infix', arity : 2 },
    ],
    [
        { name : '∀', type : 'prefix', arity : 1 },
        { name : '∃', type : 'prefix', arity : 1 },
        { name : '∃!', type : 'prefix', arity : 1 },
    ],
    [
        { name : '¬', type : 'prefix', arity : 1 },
    ],
    [
        { name : '×', type : 'infix', arity : [ 2, 3 ] },
    ],
    [
        { name : '∩', type : 'infix', arity : 2 },
        { name : '-', type : 'dual', arity : [ 1, 2 ] },
    ],
    [
        { name : '∪', type : 'infix', arity : 2 },
    ],
    [
        { name : 'Set', type : 'set literal', arity : undefined },
    ],
    [
        { name : '∘', type : 'infix', arity : 2 },
    ],
    [
        { name : '→', type : 'mapping', arity : 3 },
    ],
    [
        { name : '+', type : 'infix', arity : 2 },
    ],
    [
        { name : '⋅', type : 'infix', arity : 2 },
    ],
    [
        { name : '℘', type : 'function', arity : undefined },
        { name : '𝜎', type : 'function', arity : 1 },
    ],
    [
        { name : '@', type : 'EFA', arity : undefined },
    ],
]
const getData = operator => {
    for ( let precedence = 0 ; precedence < operators.length ; precedence++ )
        for ( let data of operators[precedence] )
            if ( data.name == operator )
                return Object.assign( { precedence }, data )
}
const repr = ( expr, options = { } ) => {
    // console.log( expr.toPutdown(), JSON.stringify( options ) )
    if ( expr.isAtomic() ) return expr.toPutdown()
    if ( expr instanceof BindingExpression ) {
        const recur = expr.children().map( rand => repr( rand, options ) )
        const body = recur.pop()
        const separator = options.separator || '.'
        return recur.join( ',' ) + separator + body
    }
    if ( !options.hasOwnProperty( 'parentPrecedence' ) )
        options.parentPrecedence = 0
    const operator = expr.child( 0 )
    const name = operator.isAtomic() ? operator.text() : null
    let data = getData( name )
    if ( !data ) {
        // console.log( `No information on this operator: ${expr.toPutdown()}` )
        data = {
            precedence : operators.length - 1,
            type : 'function',
            arity : [ 1, 2, 3, 4 ]
        }
    }
    // console.log( '\t' + JSON.stringify( data ) )
    let { precedence, type, arity } = data
    const numOperands = expr.children().length - 1
    if ( arity !== undefined && !( arity instanceof Array ) ) arity = [ arity ]
    if ( arity !== undefined && !arity.includes( numOperands ) )
        throw new Error( `Wrong arity: ${expr.toPutdown()}` )
    const recurOpts = JSON.parse( JSON.stringify( options ) )
    recurOpts.parentPrecedence = precedence
    const finalize = precedence < options.parentPrecedence ?
    ( text => `(${text})` ) : ( text => text )
    if ( type == 'infix' || ( type == 'dual' && numOperands == 2 ) ) {
        const recur = expr.children().map( rand => repr( rand, recurOpts ) )
        return finalize( recur.slice( 1 ).join( ` ${recur[0]} ` ) )
    } else if ( type == 'prefix' || ( type == 'dual' && numOperands == 1 ) ) {
        const recur = expr.children().map( rand => repr( rand, recurOpts ) )
        return finalize( recur[0] + recur.slice( 1 ).join( ' ' ) )
    } else if ( type == 'function' ) {
        const noParens = JSON.parse( JSON.stringify( recurOpts ) )
        noParens.parentPrecedence = 0
        const recur = expr.children().map(
            ( rand, index ) => repr( rand, index ? noParens : recurOpts ) )
        return finalize( `${recur[0]}(${recur.slice(1).join(",")})` )
    } else if ( type == 'EFA' ) {
        const noParens = JSON.parse( JSON.stringify( recurOpts ) )
        noParens.parentPrecedence = 0
        const recur = expr.children().map(
            ( rand, index ) => repr( rand, index ? noParens : recurOpts ) )
        return finalize( `${recur[1]}(${recur.slice(2).join(",")})` )
    } else if ( type == 'set literal' ) {
        recurOpts.separator = ' | '
        const recur = expr.children().map( rand => repr( rand, recurOpts ) )
        return finalize( `{ ${recur.slice(1).join(", ")} }` )
    } else if ( type == 'mapping' ) {
        const recur = expr.children().map( rand => repr( rand, recurOpts ) )
        return finalize( `${recur[1]}:${recur[2]}${recur[0]}${recur[3]}` )
    }
    throw new Error( `Cannot represent this yet: ${expr.toPutdown()}` )
}

const allExprs = [ ]
;[ 'libs', 'proofs', 'proofs/acid tests' ].forEach( folder => {
    fs.readdirSync( folder ).forEach( file => {
        if ( !file.endsWith( '.js' ) ) return
        try {
            const putdown = fs.readFileSync(
                `${folder}/${file}`, { encoding : 'utf8' } )
            LogicConcept.fromPutdown( putdown ).forEach( LC => {
                LC.descendantsSatisfying(
                    d => ( d instanceof Expression ) && d.isOutermost()
                ).forEach( expression => {
                    if ( expression.isAtomic()
                      || expression.child( 0 ).equals( new LurchSymbol( '<<<' ) ) )
                        return
                    allExprs.push( expression.copy().unmakeIntoA( 'given' ) )
                } )
            } )
        } catch ( e ) {
            console.log( `Failed to read from ${folder}/${file}: ${e}` )
            console.log( e.stack )
        }
    } )
} )
const parsingData = [ ]
allExprs.forEach( expr => {
    const putdown = expr.toPutdown()
    if ( parsingData.findIndex( data => data.putdown == putdown ) > -1 ) return
    parsingData.push( {
        // expression : expr,
        desiredParsedResult : putdown,
        fromThisTextInput : repr( expr )
    } )
} )
console.log( JSON.stringify( parsingData, null, 4 ) )
// const lpad = ( text, len ) => text.length < len ? lpad( ' '+text, len ) : text
// parsingData.forEach( record =>
//     console.log( lpad( record.putdown, 90 ) + '   ==>   ' + record.natural ) )
// console.log( `${parsingData.length} unique nonatomic expressions` )
