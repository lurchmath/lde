
import { LogicConcept } from '../logic-concept.js'
import { Expression } from '../expression.js'

// Module-level constant in which we store all validation tools.  Users can
// install new tools using installTool(), defined below.  This module also
// installs some of its own tools, further down in this file.
const tools = { }
// Module-level options object.  Users can change its key-value pairs using
// routines below.
const options = { }

/**
 * This module stores a collection of validation tools.  Each such tool is a
 * function with the following signature:
 * 
 *  * Argument 1 is a target {@link LogicConcept} to be validated.
 *  * Argument 2 is an options object, which this module guarantees will be the
 *    module-level validation options, possibly superceded by any options
 *    passed to the {@link module:Validation.validate validate function}, and
 *    further possibly overridden by options stored in the target itself.
 *  * The function should store the validation results in the target.  If you
 *    have a function that just returns validation results instead, you can
 *    easily convert it to one that writes its results into the target, using
 *    the convenient meta-function {@link module:Validation.functionToTool
 *    functionToTool()}.  If you are writing your own validation tool, you can
 *    write the results into a target using the
 *    {@link module:Validation.setResult setResult()} function.
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
    if ( !getOptions().hasOwnProperty( 'tool' ) ) setOptions( 'tool', name )
}

/**
 * This is the corresponding getter function for the {@link
 * module:Validation.installTool installTool()} function.  Anything installed
 * with that function can later be looked up with this one.
 * 
 * @param {String} name - the name of the tool, as it was initially installed
 *   by {@link module:Validation.installTool installTool()}
 * @returns {Function} the tool with the given name, or undefined if there was
 *   no such tool
 */
export const installedTool = name => tools[name]

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
 * A useful tool for converting pure validation functions into validation tools
 * (that is, functions with the side effect of writing their results into the
 * target object).
 * 
 * For example, let's say you have a function that can take as input any
 * expression in a simple toy system and return a validation result, either
 * `{ result:'valid', reason:'...' }` or `{ result:'invalid', reason:'...' }`.
 * Call this function on it to produce a validation tool that you can install
 * in this module, and that will write its results into the appropriate
 * attribute of any target on which it is called.
 * 
 * @param {Function} func a function that can take as input a target
 *   {@link LogicConcept} to validate, and an options object, and return a
 *   validation result object that should be stored in the target
 * @returns a function that can serve as a validation tool; rather than just
 *   returning the validation results (as the input function does), it stores
 *   those results in the target object
 */
export const functionToTool = func =>
    ( target, options ) => setResult( target, func( target, options ) )

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
 * @see {@link module:Validation.getOptions getOptions()}
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
            options[args[i]] = args[i+1]
    }
}

/**
 * For a general description of how validation options work, refer to the
 * documentation for the {@link module:Validation.setOptions setOptions()}
 * function.  Calling this function with no arguments,
 * `Validation.getOptions()`, returns the full set of module-level options.
 * Calling it with one argument, a conclusion, `Validation.getOptions(C)`,
 * returns just those conclusion-specific options stored in that
 * {@link Expression Expression}.
 * 
 * @function
 * @alias module:Validation.getOptions
 * 
 * @see {@link module:Validation.setOptions setOptions()}
 * @see {@link module:Validation.clearOptions clearOptions()}
 */
export const getOptions = ( maybeTarget ) =>
    maybeTarget ? maybeTarget.getAttribute( 'validation options' ) : options

/**
 * Remove the validation options stored in a conclusion. The conclusion will
 * have options stored in it if the client has used
 * {@link module:Validation.setOptions setOptions()} on that conclusion.
 * After calling this, a future call to
 * {@link module:Validation.getOptions getOptions()} on the same conclusion
 * will yield undefined.
 * 
 * @function
 * @alias module:Validation.clearOptions
 * 
 * @param {LogicConcept} conclusion the conclusion whose validation options
 *   should be deleted
 * 
 * @see {@link module:Validation.setOptions setOptions()}
 * @see {@link module:Validation.getOptions getOptions()}
 */
export const clearOptions = ( conclusion ) =>
    conclusion.clearAttributes( 'validation options' )

/**
 * This function computes the validation result for any given
 * {@link LogicConcept} `L` and stores it in `L`'s validation attribute.  It
 * prioritizes various sets of options as follows.
 * 
 *  1. If the options stored in the {@link LogicConcept} `L` itself, obtained
 *     by calling {@link module:Validation.getOptions
 *     Validation.getOptions( L )}, give us a validation tool, then we call it
 *     on `L` and store its result in `L`.
 *  2. Otherwise, if the second parameter to the validation function (an
 *     options object) specifies which tool to use, that one is used to compute
 *     the result.  We call that validation tool and store its result in `L`.
 *  3. If even that does not specify a tool, we fall back on the global options
 *     stored in the {@link module:Validation Validation module}, fetched by
 *     calling {@link module:Validation.getOptions Validation.getOptions()}.
 *     If that gives us a validation tool, call it on `L` and store its result
 *     in `L`.
 *  4. No tool is available, so we store in `L` a validation result object with
 *     result "indeterminate" and reason stating that no validation tool was
 *     available for `L`.
 * 
 * This function computes the validation result afresh every time it is called.
 * See other functions below for how to read cache validation results.
 * 
 * @function
 * @alias module:Validation.validate
 * 
 * @param {LogicConcept} L the {@link LogicConcept LogicConcept} to validate
 * @param {Object} [options] an options object to pass on to any validation
 *   tool called by this routine
 * 
 * @see {@link module:Validation.setResult setResult()}
 * @see {@link module:Validation.getResult getResult()}
 */
export const validate = ( L, options = { } ) => {
    // merge the module-level options, the options parameter, and the
    // conclusion's options, with later ones overriding earlier ones:
    // (use JSON.copy so as not to modify anything, but just make a new object)
    options = Object.assign(
        JSON.copy( getOptions() ), options, getOptions( L ) )
    // if there is no validation tool specified, that's an error:
    const tool = tools[options.tool]
    if ( !tool ) {
        setResult( L, {
            result : 'indeterminate',
            reason : 'No validation tool available'
        } )
    } else {
        // otherwise, run that tool, and record its result if it works:
        try {
            tool( L, options ) // should write the result itself
        } catch ( error ) {
            // but if it didn't work, record a result anyway---the error:
            setResult( L, {
                result : 'indeterminate',
                reason : 'Internal validation error',
                message : error.message,
                stack : error.stack
            } )
        }
    }
}
