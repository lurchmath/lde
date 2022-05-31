
/*
 * This is a brief script that will add MathJax support to each HTML file in
 * the JSDoc output directory of this repository, which is the docs folder.
 * This script is run by "npm run docs" immediately after jsdoc completes.
 */

import fs from 'fs'
import path from 'path'

// The script content to insert:
const MathJaxCode = `
    <script>
        MathJax = { tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']] } };
    </script>
    <script id="MathJax-script" async
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js">
    </script>
`

// Read all files in the docs folder
const docsFolder = path.join( path.dirname(
    import.meta.url.substring( 7 ) ), 'docs' )
fs.readdir( docsFolder, ( err, files ) => {
    if ( err )
        return console.error(
            'Unable to get list of HTML files in docs directory:', err )
    // keep only those that are HTML files documenting code
    files = files.filter( file =>
        file.endsWith( '.html' ) && !file.endsWith( '.js.html' ) )
    // For each such file...
    let counter = 0
    files.forEach( file => {
        const absFile = path.join( docsFolder, file )
        // Read its contents...
        fs.readFile( absFile, ( err, buffer ) => {
            if ( err )
                return console.error( 'Unable to read this HTML file:', file )
            // Insert the MathJax code...
            const modified = String( buffer ).replace(
                '</head>', () => MathJaxCode + '</head>' )
            // And save the new version.
            fs.writeFile( absFile, modified, err => {
                if ( err )
                    console.error(
                        'Unable to write to this HTML file:', file )
                else if ( ++counter == files.length )
                    console.log( 'Added MathJax to all HTML doc files.' )
            } )
        } )
    } )
} )
