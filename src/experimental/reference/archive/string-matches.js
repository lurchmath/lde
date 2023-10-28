
function* stringMatches ( constraints, options={}, partialSolution={} ) {
    const indent = options.indent ? options.indent : ''
    const inputs = JSON.stringify( constraints )
          + '  ' + JSON.stringify( partialSolution )
    const log = options.debug ?
        ( x => console.log( indent + inputs + '  -->  ' + x ) ) : ( () => { } )
    if ( constraints.length == 0 ) {
        log( `Found solution: ${JSON.stringify(partialSolution)}` )
        yield partialSolution
        return
    }
    let [ pattern, expression ] = constraints.shift()
    const isAMetavar = options.symbols ?
        ( x => options.symbols.indexOf( x ) == -1 ) :
        ( x => /^[a-zA-Z_]$/.test( x ) )
    for ( let i = 0 ; i < expression.length ; i++ )
        if ( isAMetavar( expression[i] ) )
            throw new Error( 'Metavariable found in expression: '
                           + expression[i] )
    while ( pattern.length > 0 ) {
        if ( isAMetavar( pattern[0] )
          && partialSolution.hasOwnProperty( pattern[0] ) ) {
            // pattern starts with a known metavariable, so just
            // replace the pattern with the known value and continue
            pattern = partialSolution[pattern[0]] + pattern.substring( 1 )
            log( `Instantiate first metavar -> ${pattern}` )
        } else if ( isAMetavar( pattern[0] ) ) {
            // pattern starts with an uninstantiated metavar, so
            // consider all possible values it might have
            const start = options.emptyString ? 0 : 1
            const end = options.emptyString ? expression.length :
                expression.length - pattern.length + 1
            for ( let i = start ; i <= end ; i++ ) {
                const newSolution =
                    JSON.parse( JSON.stringify( partialSolution ) )
                newSolution[pattern[0]] = expression.substring( 0, i )
                const newConstraint = [
                    pattern.substring( 1 ),
                    expression.substring( i )
                ]
                options.indent = indent + '    '
                log( `Set ${pattern[0]}=${expression.substring(0,i)} and recur` )
                yield* stringMatches(
                    [ newConstraint, ...constraints ], options, newSolution )
            }
            return
        } else if ( expression.length == 0 ) {
            // pattern has more non-metavariables, but expression empty; fail
            log( `No solution (unmatched pattern ${pattern})` )
            return
        } else if ( pattern[0] == expression[0] ) {
            // pattern and expression match same first char; continue
            log( `Matched initial ${pattern[0]}` )
            pattern = pattern.substring( 1 )
            expression = expression.substring( 1 )
        } else {
            // pattern and expression do not have same first char; no solutions
            log( `No solution (${pattern[0]} != ${expression[0]})` )
            return
        }
    }
    if ( expression.length == 0 ) {
        log( `Possible solution: ${JSON.stringify(partialSolution)} ...recur` )
        yield* stringMatches( constraints, options, partialSolution )
    } else {
        log( `No solution (unmatched expression ${expression})` )
    }
}

const test = ( constraints, options={} ) => {
    console.log()
    console.log( 'Constraints:  ' + JSON.stringify( constraints ) )
    console.log( 'Options:      ' + JSON.stringify( options ) )
    try {
        let prefix = 'Results:      '
        let count = 0
        for ( let result of stringMatches( constraints, options ) ) {
            console.log( prefix + JSON.stringify( result ) )
            prefix = '              '
            count++
        }
        console.log( '# Results:    ' + count )
    } catch ( e ) {
        console.log( 'Error thrown: ' + e.message )
    }
    console.log()
}

test( [
    [ "xy", "4325634" ],
    [ "x", "4" ]
] )
test( [
    [ "x56y", "4325634" ]
] )
test( [
    [ "WV", "oo..oo...o" ],
    [ "VW", "o...ooo..o" ],
    [ "W",  "oo..o" ]
], { symbols : 'o.' } )
test( [
    [ "WV", "oo..oo...o" ],
    [ "VW", "o...ooo..o" ],
    [ "W",  "ooo" ]
], { symbols : 'o.' } )
test( [
    [ "WV", "oo..oo...o" ],
    [ "VW", "o...ooo..o" ]
], { symbols : 'o.' } )
test( [
    [ "WV", "oo..oo...o" ]
], { symbols : 'o.' } )
test( [
    [ "WV", "oo..oo...o" ]
] ) // throws an error because o is a metavariable--that's correct behavior
