
import { Expression } from './expression.js'
import { Application } from './application.js'
import { Binding } from './binding.js'
import { Symbol } from './symbol.js'
import { setAPI, makeExpressionFunction, makeExpressionFunctionApplication,
    Constraint, ConstraintList, MatchingChallenge
} from '../node_modules/second-order-matching/src/matching-without-om.js'

// The following function call teaches the second-order-matching module
// imported from npm the specific expression API used in this repository.

setAPI( {

    // The matching module needs to how how to answer several key questions
    // about our specific expression class and its tools, so that it can
    // interface with them.  Here are the questions and our answers.
    
    // How can we tell what an "expression" is?
    // For us, that's any instance of the Expression class.
    isExpression : object => object instanceof Expression,

    // How can we get the list of subexpressions of a given expression
    // satisfying a given predicate?
    // We have a function for exactly that.
    filterSubexpressions : ( expression, filter ) =>
        expression.descendantsSatisfying( filter ),
    
    // How can we detect whether two expression are the same "type"?
    // For us, that just means checking if they belong to the same class.
    sameType : ( expression1, expression2 ) =>
        expression1.constructor.className == expression2.constructor.className,
    
    // How to make deep copies?  We have a function for that.
    copy : expression => expression.copy(),

    // How to compare expressions for equality?  Again, we have a function.
    equal : ( expression1, expression2 ) => expression1.equals( expression2 ),
    
    // How to replace any expression, in place in its parent context, with a
    // different expression?  Again, we have a function.
    replace : ( toReplace, withThis ) => toReplace.replaceWith( withThis ),

    // How to tell if an expression is a variable?
    // The LDE does not distinguish constants from variables internally, so we
    // will artificially prefix anything that the matching package wants to
    // call a "symbol" with the prefix "symbol: " and use that as an indicator.
    // See the function further below for constructing symbols.
    isVariable : expression => expression instanceof Symbol
                            && !expression.text().startsWith( 'symbol: ' ),
    
    // If we have a variable instance, how can we fetch its name?
    // There is a function built into the Symbol class for that purpose.
    getVariableName : expression => expression.text(),

    // How can we construct a new variable with a given name?
    // Just use the Symbol constructor.  (Yes, there's the small chance that
    // this could cause problems if any client named a variable with a name
    // that literally begins with the text "symbol: " but that's highly
    // unlikely and a very confusing decision anyway.)
    variable : text => new Symbol( text ),

    // How can we construct a new symbol with a given name?
    // Same as constructing a variable, but prefix it with the text "symbol: "
    // mentioned above for distinguishing symbols from variables.
    symbol : text => new Symbol( `symbol: ${text}` ),

    // How can we tell if an expression is a function application?
    // This answer is straightforward, we have a function application class for
    // exactly this purpose.
    isApplication : expression => expression instanceof Application,

    // How can we construct a new application instance?
    // Just call the Application constructor.
    application : children =>
        new Application( ...children.map( c => c.copy() ) ),

    // How can we get the list of children of a function application instance?
    // There is a method in the LogicConcept class for this purpose.
    getChildren : expression => expression.children(),

    // How can we tell if an expression is a binding (e.g., quantification)?
    // This answer is straightforward, we have a binding class for this.
    isBinding : expression => expression instanceof Binding,

    // How can we construct a new bidning instance?
    // Just call the Binding constructor; it has almost the same signature as
    // the corresponding method from the matching API.
    binding : ( symbol, variables, body ) => new Binding(
        symbol.copy(), ...variables.map( v => v.copy() ), body.copy() ),

    // How can we get the head symbol/expression of a binding?
    // There is a built-in method from the Binding class for this.
    bindingHead : binding => binding.head(),

    // How can we get the list of variables a binding expression binds?
    // There is a built-in method from the Binding class for this.
    bindingVariables : binding => binding.boundVariables(),

    // How can we get the body expression of a binding?
    // There is a built-in method from the Binding class for this.
    bindingBody : binding => binding.body(),

    // How can we tell if a particular instance of a variable is free in a
    // given ancestor expression?
    // We have a method in the MathConcept class that could answer this same
    // question for any subexpression, not just one of variable type.  So we
    // can just defer this question to that method.
    variableIsFree : ( variable, expression ) => variable.isFree( expression ),

    // How can we mark a variable as being a metavariable?
    // There is a feature of MathConcepts that lets you read/write/clear any
    // attribute from them using functions isA/makeIntoA/unmakeIntoA.  We just
    // leverage that functionality.
    setMetavariable : variable => variable.makeIntoA( 'metavariable' ),

    // How can we check if a veriable is a metavariable?  Same; see above.
    isMetavariable : variable => variable.isA( 'metavariable' ),

    // How can we set a veriable to no longer be a metavariable?
    // Same; see above.
    clearMetavariable : variable => variable.unmakeIntoA( 'metavariable' )

} )

export const display = matchingData => {
    if ( matchingData instanceof Constraint )
        return ( '(' + matchingData.pattern.toPutdown()
              + ', ' + matchingData.expression.toPutdown() + ')' )
            .replace( / \+\{"_type_metavariable":true\}\n/g, '' )
    if ( matchingData instanceof ConstraintList )
        return '{ ' + matchingData.contents.map( display ).join( ', ' ) + ' }'
    if ( matchingData instanceof Array
      && matchingData.every( entry => entry instanceof ConstraintList ) )
        return matchingData.length == 0 ? 'No solutions' :
            matchingData.map( ( entry, index ) =>
                `${index}. ${display( entry )}` ).join( '\n' )
    return String( matchingData )
}

export {
    Constraint,
    ConstraintList,
    makeExpressionFunction,
    makeExpressionFunctionApplication,
    MatchingChallenge
}
