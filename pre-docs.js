
/*
 * This is a brief script that will run all the files in tutorials/*.js and
 * record the output of each, creating files in tutorials/output/.  Those
 * files will then be incorporated into the source code documentation.
 */

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'

// Find all folders that are relevant here.
const thisFolder = path.dirname( import.meta.url.substring( 7 ) )
const inputFolder = path.join( thisFolder, 'tutorials', 'input' )
const outputFolder = path.join( thisFolder, 'tutorials', 'output' )
if ( !fs.existsSync( inputFolder ) ) fs.mkdirSync( inputFolder )
if ( !fs.existsSync( outputFolder ) ) fs.mkdirSync( outputFolder )

// How to run JavaScript code in an Rmarkdown/Jupyter style.
// Takes an array of code strings as input, all to be run in the same context.
const runSnippets = ( snippets, uniqueId, callback ) => {
    const tmpFile = path.join( thisFolder, `tutorial-tmp-file-${uniqueId}.js` )
    const separator = '---------OUTPUT DIVIDER---------'
    const codeToRun = snippets.join( `\nconsole.log( '${separator}' )\n` )
    fs.writeFileSync( tmpFile, codeToRun )
    let output = ''
    exec( `cd '${thisFolder}' && node '${tmpFile}'`, ( error, stdout, stderr ) => {
        if ( stdout ) output += stdout
        if ( stderr ) output += stderr
    } ).on( 'close', () => {
        fs.rmSync( tmpFile )
        callback( output.split( separator ) )
    } )
}
// Routine for finding any JS code snippet inside a Markdown code string
const startMarker = '\n```js\n'
const endMarker = '\n```\n'
const getSnippetPosition = ( markdownString, index ) => {
    let start = markdownString.indexOf( startMarker )
    while ( start > -1 && index-- > 0 )
        start = markdownString.indexOf( startMarker, start + 1 )
    if ( start == -1 ) return undefined
    start += startMarker.length
    const end = markdownString.indexOf( endMarker, start )
    if ( end == -1 ) return undefined
    return [ start, end ]
}
// Function to replace any given JS code snippet in a Markdown code string with
// arbitrary other Markdown code.
const replaceSnippet = ( markdownString, index, replacement ) => {
    const position = getSnippetPosition( markdownString, index )
    if ( !position ) return undefined
    return markdownString.substring( 0, position[0] - startMarker.length )
         + replacement
         + markdownString.substring( position[1] + endMarker.length )
}
// Function to call getSnippetPosition() repeatedly and extract all JS code snippets
// from a Markdown source string, yielding an array of such snippets' contents, as
// JS code strings.
const extractSnippets = markdownString => {
    const snippets = [ ]
    let index = 0
    let position = getSnippetPosition( markdownString, index )
    while ( position ) {
        snippets.push( markdownString.substring( position[0], position[1] ) )
        position = getSnippetPosition( markdownString, ++index )
    }
    return snippets
}
// Take a tutorial filename (/path/to/something.md) as input, extract all code
// snippets, run them and get their output, inject that output back into the
// original tutorial Markdown code, and save it as a new file of the same name,
// but in the tutorials folder that will be scanned by JSDoc.
const prepareTutorial = ( inFile, callback ) => {
    fs.readFile( inFile, ( err, buffer ) => {
        if ( err )
            return console.error( 'Unable to read this tutorial:', inFile )
        let tutorial = String( buffer )
        const snippets = extractSnippets( tutorial )
        if ( snippets.length == 0 ) return callback( tutorial )
        runSnippets( snippets, path.basename( inFile ), results => {
            results.map( ( output, index ) => {
                let replacement = `\`\`\`js\n${snippets[index]}\n\`\`\`\n`
                if ( !/^\s*$/.test( output ) )
                    replacement += `\n\n\`\`\`text\n// Console output:\n${output.trim()}\n\`\`\`\n\n`
                    tutorial = replaceSnippet( tutorial, index,
                        `\n<br/>\n<hr/>\n\n${replacement}\n\n<hr/>\n<br/>\n` )
            } )
            callback( tutorial )
        } )
    } )
}

// Read all files in the examples folder
fs.readdir( inputFolder, ( err, files ) => {
    if ( err )
        return console.error(
            'Unable to get list of Markdown files in tutorials folder:', err )
    // keep only those that are Markdown files, which will contain tutorials
    files = files.filter( file => file.endsWith( '.md' ) )
    // For each such file...
    files.forEach( file => {
        // Create a version of it in which the code's output is included:
        const inFile = path.join( inputFolder, file )
        prepareTutorial( inFile, newContent => {
            const outFile = path.join( outputFolder, file )
            fs.writeFileSync( outFile, newContent )
            console.log( `Ran code in tutorial: ${file}` )
        } )
    } )
} )
