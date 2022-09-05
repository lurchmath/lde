
import { LogicConcept } from '../logic-concept.js'
import { Environment } from '../environment.js'
import { Expression } from '../expression.js'

// Module-level constant in which we store all validation tools.  Users can
// install new tools using installTool(), defined below.  This module also
// installs some of its own tools, further down in this file.
const tools = { }
// Module-level settings object.  Users can change its key-value pairs using
// routines below.  We call it "settings" instead of options so as not to
// conflict with the getter function defined below, named options().
const settings = { }

/**
 * This module stores a collection of validation tools.  Each such tool is a
 * function with the following signature:
 * 
 *  * Argument 1 is a {@link Environment#conclusions conclusion} to be
 *    validated.
 *  * Argument 2 is an options object, combining the module-level validation
 *    options with any options stored in the conclusion, with those in the
 *    conclusion superceding module-level options.
 *  * The return value should be the validation results for that conclusion.
 * 
 * That result will be written into the conclusion using the
 * {@link module:Validation.setResult setResult()}
 * function.
 * 
 * Each tool gets stored under a name chosen by the client, so that the tool
 * can be referred to later by this name as a unique ID.  Installing another
 * tool later with the same name overwrites the previous.
 * 
 * If this is the first tool installed in this module, it will immediately
 * become the default.  You can change this later using the
 * {@link module:Validation.setOptions setOptions()} function; see its
 * documentation for further details.
 * 
 * @function
 * @alias module:Validation.installTool
 * 
 * @param {string} name the name by which this tool will be called, and under
 *   which it will be stored in this module
 * @param {function} func the function that will be run when the tool is used;
 *   it will be called on the conclusion to be validated
 * 
 * @see {@link module:Validation.installedToolNames installedToolNames()}
 * @see {@link module:Validation.setResult setResult()}
 * @see {@link module:Validation.result result()}
 * @see {@link module:Validation.clearResult clearResult()}
 */
export const installTool = ( name, func ) => {
    tools[name] = func
    if ( !options().hasOwnProperty( 'tool' ) ) setOptions( 'tool', name )
}

/**
 * This module is a collection of validation tools, which are installed using
 * the {@link module:Validation.installTool installTool()} function, each
 * under a unique name.  This function returns that list of unique names.
 * 
 * @function
 * @alias module:Validation.installedToolNames
 * 
 * @returns {string[]} an array of the names of all validation tools installed
 *   in this module
 * 
 * @see {@link module:Validation.installTool installTool()}
 */
export const installedToolNames = () => Object.keys( tools )

/**
 * Store the results of a validation tool in the conclusion that was validated.
 * Validation results are a JavaScript object amenable to JSON storage, and
 * having the following keys (some optional, some required).
 * 
 *  * `result` - any string representing the validation result, though the only
 *    officially supported ones at the moment are `"valid"` (meaning the user's
 *    work is correct), `"invalid"` (meaning the user's work has a mistake),
 *    and `"indeterminate"` (meaning that Lurch cannot find the answer, perhaps
 *    because of limited computing resources or some ambiguity in the user's
 *    input)
 *  * `reason` - any string representing the reason for why the validation
 *    result was what it was.  We leave it up to the author of the validation
 *    tool how to use this attribute, but we recommend using short English
 *    phrases as error codes that can be looked up in a larger dictionary of
 *    detailed descriptions.  For example, you might use `"No such reason"` or
 *    `"Too many premises"` or any other simple phrase.
 *  * Any other keys in the object are optional, and can be used at the
 *    discretion of the author of the validation tool to store whatever other
 *    information will help Lurch give helpful feedback to the user.
 * 
 * Example validation result:
 * ```json
 * {
 *     "result" : "invalid",
 *     "reason" : "Too many premises",
 *     "formula cited" : "conjunction introduction",
 *     "num premises needed" : 2,
 *     "num premises cited" : 4
 * }
 * ```
 * 
 * @function
 * @alias module:Validation.setResult
 * 
 * @param {LogicConcept} target the conclusion into which to store the given
 *   data as its validation result
 * @param {Object} result data that can be stored in JSON form, representing
 *   the validation result for the given `target`, using the format described
 *   above
 * 
 * @see {@link module:Validation.result result()}
 * @see {@link module:Validation.clearResult clearResult()}
 */
export const setResult = ( target, result ) =>
    target.setAttribute( 'validation result', result )

/**
 * Read the validation result stored in a conclusion that has been validated
 * before by one of this module's validation tools, and return it, or return
 * undefined if no validation result is stored in the given conclusion.
 * 
 * @function
 * @alias module:Validation.result
 * 
 * @param {LogicConcept} target the conclusion in which to look up the stored
 *   validation result
 * @returns {Object} any validation result stored previously using
 *   {@link module:Validation.setResult setResult()},
 *   or undefined if none is stored
 * 
 * @see {@link module:Validation.setResult setResult()}
 * @see {@link module:Validation.clearResult clearResult()}
 */
export const result = ( target ) =>
    target.getAttribute( 'validation result' )

/**
 * Remove the validation result stored in a conclusion that has been validated
 * before by one of this module's validation tools.  If no validation result
 * was stored there, this function does nothing.
 * 
 * @function
 * @alias module:Validation.clearResult
 * 
 * @param {LogicConcept} target the conclusion from which to remove any stored
 *   validation result
 * 
 * @see {@link module:Validation.setResult setResult()}
 * @see {@link module:Validation.result result()}
 */
export const clearResult = ( target ) =>
    target.clearAttributes( 'validation result' )

/**
 * When validation is performed on a conclusion, using
 * {@link module:Validation.validate validate()}, it will compute the
 * relevant options to be passed to the validation tool as follows.  First,
 * look up any options stored in this module, and second, look up any options
 * stored in the conclusion to be validated, overwriting the module-level
 * options with the conclusion-specific ones in the case of any conflicts.
 * The resulting set of options is given to the
 * {@link module:Validation.validate validate()} routine.
 * 
 * This function can be used to change options either at the module level,
 * by calling `setOptions( key1, value1, key2, value2, ... )`, or for a
 * specific conclusion, by calling
 * `setOptions( conclusion, key1, value1, key2, value2, ... )`.
 * 
 * Although most options will be specific to the validation tool being used,
 * one essential option that matters in all cases is *which* validation tool
 * to use for the conclusion.  That option has the simple key `"tool"`, so
 * you can set it for a conclusion with code such as
 * `Validation.setOptions( conclusion, 'tool', 'tool name here' )`.  But it is
 * inconvenient to do this for every conclusion in a large
 * {@link LogicConcept LogicConcept}, so it is preferable to be able to set a
 * default validation tool that will be used when the conclusion does not
 * specify one.  Since module-level options are the defaults or "fallbacks"
 * when a conclusion doesn't have an option specified, just set a module-level
 * tool with code such as `Validation.setOptions( 'tool', 'tool name here' )`.
 * 
 * @function
 * @alias module:Validation.setOptions
 * 
 * @see {@link module:Validation.validate validate()}
 * @see {@link module:Validation.options options()}
 * @see {@link module:Validation.clearOptions clearOptions()}
 */
export const setOptions = ( ...args ) => {
    if ( args[0] instanceof LogicConcept ) {
        const target = args.shift()
        if ( !target.isAConclusionIn( /* top-level ancestor */ ) )
            throw new Error(
                'Cannot set validation options in a non-conclusion' )
        if ( args.length % 2 != 0 )
            throw new Error(
                'Validation options must come in key-value pairs' )
        const options = { }
        for ( let i = 0 ; i < args.length - 1 ; i += 2 )
            options[args[i]] = args[i+1]
        target.setAttribute( 'validation options', options )
    } else {
        if ( args.length % 2 != 0 )
            throw new Error(
                'Validation options must come in key-value pairs' )
        for ( let i = 0 ; i < args.length - 1 ; i += 2 )
            settings[args[i]] = args[i+1]
    }
}

/**
 * For a general description of how validation options work, refer to the
 * documentation for the {@link module:Validation.setOptions setOptions()}
 * function.  Calling this function with no arguments, `Validation.options()`,
 * returns the full set of module-level options.  Calling it with one
 * argument, a conclusion, `Validation.options(C)`, returns just those
 * conclusion-specific options stored in that {@link Expression Expression}.
 * 
 * @function
 * @alias module:Validation.options
 * 
 * @see {@link module:Validation.setOptions setOptions()}
 * @see {@link module:Validation.clearOptions clearOptions()}
 */
export const options = ( maybeTarget ) => {
    if ( maybeTarget ) {
        if ( !( maybeTarget instanceof LogicConcept )
          || !maybeTarget.isAConclusionIn( /* top-level ancestor */ ) )
            throw new Error(
                'Validation options exist only in conclusion expressions' )
        return maybeTarget.getAttribute( 'validation options' )
    } else {
        return settings
    }
}

/**
 * Remove the validation options stored in a conclusion. The conclusion will
 * have options stored in it if the client has used
 * {@link module:Validation.setOptions setOptions()} on that conclusion.
 * After calling this, a future call to
 * {@link module:Validation.options options()} on the same conclusion will
 * yield undefined.
 * 
 * @function
 * @alias module:Validation.clearOptions
 * 
 * @param {LogicConcept} conclusion the conclusion whose validation options
 *   should be deleted
 * 
 * @see {@link module:Validation.setOptions setOptions()}
 * @see {@link module:Validation.options options()}
 */
export const clearOptions = ( conclusion ) =>
    conclusion.clearAttributes( 'validation options' )

// Internal utility function used by the validate() function below.
const validateConclusion = conclusion => {
    // merge the module-level options with this conclusion's options:
    const conclOptions = Object.assign( options(), options( conclusion ) )
    // if there is no validation tool specified, that's an error:
    const tool = tools[conclOptions.tool]
    if ( !tool ) {
        setResult( conclusion, {
            result : 'indeterminate',
            reason : 'No validation tool available'
        } )
    } else {
        // otherwise, run that tool, and record its result if it works:
        try {
            setResult( conclusion, tool( conclusion, conclOptions ) )
        } catch ( error ) {
            // but if it didn't work, record a result anyway---the error:
            setResult( conclusion, {
                result : 'indeterminate',
                reason : 'Internal validation error',
                message : error.message,
                stack : error.stack
            } )
        }
    }
}

/**
 * Validating a {@link Environment.conclusions conclusion} means finding the
 * appropriate validation routine for that conclusion and calling it on the
 * conclusion.  (See {@link module:Validation.setOptions setOptions()} for how
 * we determine the appropriate validation routine for a conclusion.)  If this
 * function is called on a conclusion, that is what it does.
 * 
 * Validating an {@link Environment Environment} means validating all of its
 * conclusions, in the order in which they appear
 * ({@link MathConcept#isEarlierThan earlier ones} first).  If this function
 * is called on an {@link Environment Environment}, that is what it does.
 * 
 * @function
 * @alias module:Validation.validate
 * 
 * @param {LogicConcept} L the {@link LogicConcept LogicConcept} to validate,
 *   either a conclusion or an environment
 */
export const validate = ( L ) => {
    if ( L instanceof Environment ) {
        L.conclusions().forEach( validateConclusion )
    } else if ( L.isAConclusionIn( /* top-level ancestor */ ) ) {
        validateConclusion( L )
    } else {
        throw new Error(
            'Can validate only Environments and Conclusions' )
    }
}
