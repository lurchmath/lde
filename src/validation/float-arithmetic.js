
// A simple JavaScript (floating point) arithmetic checker, just as an
// example validation tool.  Importing this file defines the function
// arithmeticValidator() which is installed as a new validation
// tool called "floating point arithmetic" by validation.js.

import { Expression } from '../expression.js'
import { Symbol as LurchSymbol } from '../symbol.js'

// Table of supported arithmetic operators
// and the functions associated with each.
const arithmeticOperatorsInJS = {
    '+'  : [ (x,y)=>x+y ],
    '-'  : [ x=>-x, (x,y)=>x-y ],
    '*'  : [ (x,y)=>x*y ],
    '/'  : [ (x,y)=>x/y ],
    '%'  : [ (x,y)=>x%y ],
    '^'  : [ (x,y)=>Math.pow(x,y) ],
    '='  : [ (x,y)=>x===y ],
    '>'  : [ (x,y)=>x>y ],
    '<'  : [ (x,y)=>x<y ],
    '>=' : [ (x,y)=>x>=y ],
    '<=' : [ (x,y)=>x<=y ],
}

// Internal function that treats the given conclusion as an arithmetic
// expression, and runs the appropriate functions to compute its value.
// (That includes equality and inequality operators, so that the result can be
// true or false.)
// An error is thrown if the input is anything other than nested application
// of the operators in the above table, with the appropriate arities, to
// floating point atomic values stored as symbols.
const runArithmeticInJS = ( conclusion ) => {
    if ( conclusion instanceof LurchSymbol ) {
        const result = Number( conclusion.text() )
        if ( isNaN( result ) )
            throw new Error( 'Invalid number: ' + conclusion.text() )
        return result
    }
    if ( !( conclusion instanceof Expression ) )
        throw new Error(
            'Arithmetic supports only Expressions and Symbols' )
    const operator = conclusion.firstChild()
    if ( !( operator instanceof LurchSymbol ) )
        throw new Error( 'Operators must be symbols' )
    if ( !arithmeticOperatorsInJS.hasOwnProperty( operator.text() ) )
        throw new Error( 'Not a supported operator: ' + operator.text() )
    const operands = conclusion.allButFirstChild()
    const toApply = arithmeticOperatorsInJS[operator.text()].find(
        func => func.length == operands.length )
    if ( !toApply )
        throw new Error( 'Wrong number of arguments to ' + operator.text() )
    return toApply.apply( null, operands.map( runArithmeticInJS ) )
}

// a validation tool (as documented in the tools.js file) that uses the above
// function to do validation of conclusions that are just equalities or
// inequalities of basic floating point arithmetic
export const arithmeticValidator = ( conclusion/*, options */ ) => {
    try {
        return runArithmeticInJS( conclusion ) === true ? {
            result : 'valid',
            reason : 'JavaScript floating point check'
        } : {
            result : 'invalid',
            reason : 'JavaScript floating point check'
        }
    } catch ( error ) {
        return {
            result : 'invalid',
            reason : 'Invalid expression structure',
            message : error.message,
            stack : error.stack
        }
    }
}
