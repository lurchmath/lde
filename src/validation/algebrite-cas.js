//
//   A simple CAS arithmetic and algebra checker using Algebrite.
//   Importing this file installs a new validation
//   tool called "CAS".
//
import { Expression } from '../expression.js'
import { Symbol as LurchSymbol } from '../symbol.js'
import Algebrite from '../../dependencies/algebrite.js'

// All Algebrite mathematical operators
const allOps = [
    '+'          ,    '-'          ,    '*'          ,    '/'          ,
    '^'          ,    'mod'        ,    'abs'        ,    'adj'        ,
    'and'        ,    'arccos'     ,    'arccosh'    ,    'arcsin'     ,
    'arcsinh'    ,    'arctan'     ,    'arctanh'    ,    'arg'        ,
    'besselj'    ,    'bessely'    ,    'ceiling'    ,    'choose'     ,
    'circexp'    ,    'coeff'      ,    'cofactor'   ,    'conj'       ,
    'contract'   ,    'cos'        ,    'cosh'       ,    'cross'      ,
    'curl'       ,    'd'          ,    'defint'     ,    'deg'        ,
    'denominator',    'det'        ,    'dim'        ,    'dot'        ,
    'eigen'      ,    'eigenval'   ,    'eigenvec'   ,    'erf'        ,
    'erfc'       ,    'eval'       ,    'exp'        ,    'expand'     ,
    'expcos'     ,    'expsin'     ,    'factor'     ,    'factorial'  ,
    'filter'     ,    'float'      ,    'floor'      ,    'gcd'        ,
    'hermite'    ,    'hilbert'    ,    'imag'       ,    'inner'      ,
    'integral'   ,    'inv'        ,    'laguerre'   ,    'lcm'        ,
    'leading'    ,    'legendre'   ,    'log'        ,    'not'        ,
    'nroots'     ,    'numerator'  ,    'or'         ,    'outer'      ,
    'polar'      ,    'prime'      ,    'product'    ,    'quotient'   ,
    'rank'       ,    'rationalize',    'real'       ,    'rect'       ,
    'roots'      ,    'shape'      ,    'simplify'   ,    'sin'        ,
    'sinh'       ,    'sqrt'       ,    'subst'      ,    'sum'        ,
    'tan'        ,    'tanh'       ,    'taylor'     ,    'transpose'  ,
    'unit'       ,    'zero'       ,    '='          ,    '=='         ,
    '>'          ,    '<'          ,    '>='         ,    '<='         ,
    'isprime'
]
// All operators are prefix unless listed here
const infixOps = ['+','-','*','/','^','=','==','>','<','>=','<=']
// These are the relation operators 
const relationOps =
    ['=','==','>','<','>=','<=','isprime']
// string formatting utilities
const infix = (operator) => { return (x,y)=>`(${x})${operator}(${y})`}
const prefix = (operator) => { return (...args)=>`${operator}(${args})`}

// Treats the given expression as an Algebrite expression, and produce
// a string suitable for input to Algebrite. An error is thrown if the 
// input is anything other than nested application of the operators in 
// the above table, with the appropriate arities, to atomic values stored
// as symbols and converted to strings.
//
// This routine assumes expression is an LC expression
const toAlgebrite = ( expression ) => {
    // convert symbols to a string
    if ( expression instanceof LurchSymbol ) { return `${expression}`}
    // get the operator
    const operator = expression.firstChild()
    // is it a symbol
    if ( !( operator instanceof LurchSymbol ) ) 
        throw new Error( 'Operators must be symbols' )
    // convert the symbol to a string    
    const op = operator.text()
    // is it an Algebrite operator
    if ( !allOps.includes( op ) )
        throw new Error( 'Not a supported operator: ' + operator.text() )
    // get the operands        
    const operands = expression.allButFirstChild()
    // get the map to apply this operator to its operands
    let toApply
    // negation is special
    if (op==='-') {
        toApply = (operands.length===1) ? x=>`-(${x})` : infix(op)      
    // check for infix
    } else if (infixOps.includes(op)) { 
        toApply = infix(op)
    // everything else is prefix  
    } else { 
        toApply = prefix(op)
    }
    return toApply.apply( null, operands.map( toAlgebrite ) )
}

// use Algebrite to evaluate the given expression
// It must be an equation, inequality, or isprime(n) where
// n is an integer expression
const runCAS = ( expression ) => {
    // make sure the argument is an Expression
    if ( !( expression instanceof Expression ) )
        throw new Error('CAS supports only Expressions' )
    // we only allow relations for now
    const op = expression.firstChild().text()
    if ( !relationOps.includes(op) )
        throw new Error('CAS only validates equations, inequalities, and isprime.')
    return Algebrite.run( `check(${toAlgebrite(expression)})` )
}

// a validation tool (as documented in the tools.js file) that uses the above
// function to do validation of expressions that are supported by Algebrite
// Currently returns 0 for false and 1 for true.

/**
 * The {@link Validation Validation} module provides a framework for installing 
 * and using a collection of Validation Tools.  This virtual namespace documents
 * them all in one place.
 * 
 * **Validation Tools**
 * - [CAS]{@link ValidationTools.CASValidator}
 * - [floating point arithmetic]{@link ValidationTools.arithmeticValidator} 
 * - [Classical Propositional Logic]{@link
 *    ValidationTools.classicalPropositionalValidator}
 * - [Intuitionistic Propositional Logic]{@link 
 *    ValidationTools.intuitionisticPropositionalValidator}
 * @namespace ValidationTools
 */

/**
 * The CAS Validation Tool uses 
 * <a href='http://algebrite.org' target='blank'>Algebrite</a> to evaluate
 * whether an equation, inequality, or the statement `isprime(n)` is valid. 
 * It can be applied to a single {@link Expression}, and will mark it valid
 * if and only if the expression is a valid Algebrite equation, inequality,
 * or the statement `isprime(n)` where $n$ is an expression that evaluates
 * to an integer, and the Algebrite `check(expression)` command returns `1`.
 *
 * @memberof ValidationTools
 * @param {Expression} expression - An {@link Expression} that represents
 *   a valid Algebrite equation, inequality, or the statement `isprime(n)`.
 * @see {@link module:Validation Validation}
 */
const CASValidator = ( expression/*, options */ ) => {
    try {
        let value = runCAS(expression)
        return {
            result : (value==='1')?'valid':'invalid',
            reason : 'CAS',
            value  : value
        }  
    } catch ( error ) {
        return {
            result  : 'invalid',
            reason  : 'Invalid CAS expression',
            message : error.message
        }
    }
}

export { CASValidator }