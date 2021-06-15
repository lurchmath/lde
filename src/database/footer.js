
// This file is a footer that will be embedded within /src/database.js when
// that file is regenerated using the "npm run build-db" command, as
// documented in /src/database/generate.js.

/**
 * The putdown database is built from a hierarchy of folders in the source
 * code repository, containing `.putdown` files.  The functions in this
 * namespace are for querying that database.  They are used in some of our
 * testing suite, so that a library of large expressions, even large proofs,
 * can be created outside of code, and just loaded from disk.
 * 
 * The documentation of each function below assumes you have imported the
 * database using the code `import Database from '/path/to/database.js'`.
 * For example, importing it from a script in the `/tests` folder would use
 * `import Database from '../src/database.js'`.  Thus when the identifier
 * `Database` appears in the documentation below, it is referring to the
 * database module itself, as documented in this namespace.
 * 
 * The source code file `database.js` will not be built into the LDE by
 * default, when we add a build process to this repository, because it
 * contains a large block of JSON in the code itself that is the entire
 * contents of the database; that would significantly bloat the size of any
 * app that used the LDE.  However, that file is available for use in all of
 * our testing scripts, and it is very useful in that regard.
 * 
 * @namespace Database
 */

// The features added by this file are various querying conveniences for the
// database, which include conversion of putdown notation to LogicConcept
// instances.  For that, we need the LogicConcept class.
import { LogicConcept } from './logic-concept.js'

/**
 * Each entry in the database has a unique name by which it is identified, and
 * we call those names "keys."  You can get a list of all keys using this
 * function.
 * 
 * The keys are simply the paths in the filesystem from which the data was
 * loaded.  So you might get a response of the form
 * `['/folder1/file1.putdown','/folder2/subfolder/file2.putdown']` and so on,
 * containing as many files as there are in the database.  If you think of the
 * database as a filesystem, this function is like a recursive directory
 * listing, filtering for only the `.putdown` files.
 * 
 * @returns {string[]} all keys in the database
 * @see {@link Database.keysStartingWith keysStartingWith()}
 * @see {@link Database.keysPaths keysPaths()}
 * @memberof Database
 * @alias Database.keys
 */
export const keys = () =>
    putdownDatabase.map( entry => entry.filename )

/**
 * This is a convenience function that returns just those keys in the database
 * that begin with a certain prefix.  You can use this to get all files
 * recursively beneath a certain folder, for example, with a call like
 * `Database.keysStartingWith('/my/folder/name/')`.
 * 
 * @param {string} prefix - the prefix by which to filter
 * @returns {string[]} all keys in the database that begin with the given
 *   prefix
 * @see {@link Database.keys keys()}
 * @see {@link Database.keysPaths keysPaths()}
 * @memberof Database
 * @alias Database.keysStartingWith
 */
export const keysStartingWith = prefix =>
    keys().filter( key => key.startsWith( prefix ) )

/**
 * Since the keys in the database are file paths, we might want to ask for the
 * list of files inside a certain folder.  We can do so recursively with
 * {@link Database.keysStartingWith keysStartingWith()}, but this function
 * lets us do so non-recursively.
 * 
 * For example, if we call `Database.keysPaths('/example')`, we might get a
 * response like `['one','two','x.putdown']` if indeed there were three things
 * in the `/example` folder, including subfolders `one` and `two` and a file
 * `x.putdown`.  If the database is viewed as a filesystem, this function is
 * like a directory listing.
 * 
 * @param {string} folder - the folder whose contents should be listed
 * @returns {string[]} all subfolder names or filenames that sit within the
 *   given folder (or the empty list if there are none, or if the folder name
 *   was invalid)
 * @see {@link Database.keys keys()}
 * @see {@link Database.keysStartingWith keysStartingWith()}
 * @memberof Database
 * @alias Database.keysPaths
 */
export const keysPaths = ( folder = '' ) => {
    if ( !folder.endsWith( '/' ) ) folder += '/'
    return Array.from( new Set( keysStartingWith( folder ).map(
        key => key.substring( folder.length ).split( '/' )[0] ) ) )
}

/**
 * Get the list of all keys in the database that refer to entries whose
 * metadata satisfies a given predicate.  For details on metadata content,
 * see {@link Database.getMetadata getMetadata()}.
 * 
 * @param {function} predicate - a function that takes as input a JSON object
 *   containing the metadata for a database entry and returns a boolean
 * @returns {string[]} an array of all keys in the database whose
 *   corresponding entries pass the test inherent in the given predicate,
 *   that is, the predicate returns true when run on their metadata
 * @see {@link Database.getMetadata getMetadata()}
 * @memberof Database
 * @alias Database.filterByMetadata
 */
export const filterByMetadata = predicate =>
    putdownDatabase.filter( entry => predicate( entry.metadata ) )
    .map( entry => entry.filename )

// Read attributes from database entries; internal module helper function.
const getEntryAttribute = ( entryName, attribute ) => {
    const entry = putdownDatabase.find( entry => entry.filename == entryName )
    return entry ? entry[attribute] : undefined
}

// Set attributes on database entries; internal module helper function.
const setEntryAttribute = ( entryName, attribute, value ) => {
    const entry = putdownDatabase.find( entry => entry.filename == entryName )
    if ( entry ) entry[attribute] = value
    return value
}

/**
 * Look up the metadata associated with a database entry.  The result will be
 * a JavaScript `Object` instance, as if produced by `JSON.parse()`, possibly
 * the empty object `{}` if the entry had no metadata, or `undefined` if the
 * given key is invalid.
 * 
 * The metadata of any entry in the database is a JSON object extracted from
 * the (optional) YAML header in the original `.putdown` file.  It can contain
 * any information the original author put there.  For example, it might state
 * that the contents of the file are (or are not) valid `.putdown` syntax, so
 * that the file can be used for testing the putdown parser.  Or it might be
 * used to include other `.putdown` files as headers.  The list of uses for
 * this metadata is intended to grow over time, and thus not be fully
 * specified in advance.
 * 
 * The object returned is the actual metadata stored in the database, not a
 * copy, so altering it will alter the contents of the database in memory (but
 * not on the filesystem).
 * 
 * @param {string} key - the key for the entry to look up
 * @returns {Object} a JSON object containing the metadata for the entry
 * @see {@link Database.filterByMetadata filterByMetadata()}
 * @see {@link Database.getPutdown getPutdown()}
 * @memberof Database
 * @alias Database.getMetadata
 */
export const getMetadata = key => getEntryAttribute( key, 'metadata' )

/**
 * Look up the putdown code associated with a database entry.  The result will
 * a string containing whatever was in the original `.putdown` file on disk
 * when the database was created, or `undefined` if the key is invalid.
 * 
 * If the entry's metadata has an `"includes"` member, the database build
 * process respects this and includes other `.putdown` files as headers within
 * this one.  The result of this function will include the full `.putdown`
 * code for this entry, which includes any code that was imported using the
 * `"includes"` member of the metadata.  To get just the original code without
 * the other included files, see
 * {@link Database.getPutdownWithoutIncludes getPutdownWithoutIncludes()}.
 * 
 * The return value includes only putdown code, not the YAML header that was
 * converted into metadata.  To get access to that information, see
 * {@link Database.getMetadata getMetadata()}.
 * 
 * The return value is just the code, not the actual objects signified by that
 * code.  To get access to those objects, see
 * {@link Database.getLogicConcepts getLogicConcepts()}.
 * 
 * @param {string} key - the key for the entry to look up
 * @returns {string} the putdown source code for the entry
 * @see {@link Database.getPutdownWithoutIncludes getPutdownWithoutIncludes()}
 * @see {@link Database.getMetadata getMetadata()}
 * @see {@link Database.getLogicConcepts getLogicConcepts()}
 * @memberof Database
 * @alias Database.getPutdown
 */
export const getPutdown = key => getEntryAttribute( key, 'content' )

/**
 * This function works exactly the same as
 * {@link Database.getPutdown getPutdown()}, except that any code included
 * from a separate file using the `"includes"` member of the metadata object
 * will not be included here.  Thus the return value from this function is
 * always a terminal substring of the return value of
 * {@link Database.getPutdown getPutdown()}.
 * 
 * @param {string} key - the key for the entry to look up
 * @returns {string} the putdown source code for the entry
 * @see {@link Database.getPutdown getPutdown()}
 * @see {@link Database.getMetadata getMetadata()}
 * @memberof Database
 * @alias Database.getPutdownWithoutIncludes
 */
export const getPutdownWithoutIncludes = key => {
    const original = getEntryAttribute( key, 'original' )
    return typeof( original ) == 'undefined' ?
        getEntryAttribute( key, 'content' ) : original
}

// Get a cached parsed result of the given entry's full putdown source, if any
// exists yet in the database.
const getParsedResult = key => getEntryAttribute( key, 'parsed' )

// Store in the cache the parsed result of the given entry's putdown source,
// overwriting any previous cache value if there was one.
const setParsedResult = ( key, result ) =>
    setEntryAttribute( key, 'parsed', result )

/**
 * This function works exactly the same as
 * {@link Database.getPutdown getPutdown()}, with two exceptions.
 * 
 *  1. In addition to fetching the putdown code, it also interprets it if
 *     possible, yielding an array of {@link LogicConcept LogicConcepts} as
 *     the result.
 *  2. Such results are cached so that future calls to this function with the
 *     same arguments will return the exact same
 *     {@link LogicConcept LogicConcepts} instances.  In particular, this
 *     means that if you manipulate the copies you get, you are mainpulating
 *     the copies in the cache.  If this is not what you want, make separate
 *     copies.
 * 
 * If the putdown code fetched for the entry is not valid putdown code, then
 * this function will instead throw a parsing error.  If the key is an invalid
 * key for the database, this function will return undefined.  If the file
 * contains the putdown code for zero actual objects (e.g., only whitespace
 * and comments) then this function will return an empty array.
 * 
 * If you know that there is only one object in the file, and you want to get
 * it without bothering to do `getLogicConcepts(key)[0]`, you can just call
 * {@link Database.getLogicConcept getLogicConcept()} instead.
 * 
 * @param {string} key - the key for the entry to look up
 * @returns {LogicConcept[]} the meaning of the putdown source code for the
 *   entry, as an array of {@link LogicConcept LogicConcept} instances
 * @see {@link Database.getPutdown getPutdown()}
 * @see {@link Database.getLogicConcept getLogicConcept()}
 * @memberof Database
 * @alias Database.getLogicConcepts
 */
 export const getLogicConcepts = key => {
    const cached = getParsedResult( key )
    // if we cached a list of LCs, return them
    if ( cached instanceof Array ) return cached
    // if we cached something else, it was an error object; re-throw it
    if ( cached ) throw cached
    // we have no cache, so we must parse; get the putdown code
    const putdownCode = getPutdown( key )
    // if we have no code, we cannot proceed
    if ( !putdownCode ) return undefined
    try {
        // if we parse without error, cache the result and then return it
        return setParsedResult( key,
            LogicConcept.fromPutdown( putdownCode ) )
    } catch ( error ) {
        // otherwise, cache the error and also throw it
        throw setParsedResult( key, error )
    }
}

/**
 * This function works exactly the same as
 * {@link Database.getLogicConcepts getLogicConcepts()}, with one exception:
 * If the putdown source code parses into an array of length one, this
 * function just returns the sole entry of that array, but if instead the
 * array has any other length, this function throws an error, whose message
 * states that it expected an array of length one.
 * 
 * @param {string} key - the key for the entry to look up
 * @returns {LogicConcept} the meaning of the putdown source code for the
 *   entry, as a single {@link LogicConcept LogicConcept} instance
 * @see {@link Database.getPutdown getPutdown()}
 * @see {@link Database.getLogicConcepts getLogicConcepts()}
 * @memberof Database
 * @alias Database.getLogicConcept
 */
 export const getLogicConcept = key => {
    const all = getLogicConcepts( key )
    if ( all.length != 1 )
        throw `Expected 1 LogicConcept, got ${all.length}`
    return all[0]
}

// create a default object so that clients can do:
// import Database from './database.js'
export default {
    keys, keysStartingWith, keysPaths, filterByMetadata,
    getMetadata, getPutdown, getPutdownWithoutIncludes,
    getLogicConcepts, getLogicConcept
}
