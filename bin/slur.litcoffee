
This files is a simple command-line client for the LDE.  It uses a
proprietary text format that is not yet documented or fully tested.
Tests and documentation will come in the future.  Right now the
command *must* be invoked from the root of this repository; that
can be fixed later.

Invoke as follows:
```
coffee bin/slur.litcoffee FILENAME.slur
```
See examples of `.slur` files in this folder.

Import stuff.

    { Structure, InputExpression, OutputRule } = LDE =
        require "#{__dirname}/../src/lde.litcoffee"
    { OM } = require 'openmath-js'
    fs = require 'fs'

Define a class for parsing OpenMath.

    class OpenMathIS extends InputExpression
        className : Structure.addSubclass 'OpenMathIS', OpenMathIS
        interpret : ( accessibles, childResults, scope ) ->
            if ( OMObj = OM.simple @getAttribute 'OM' )? and \
               ( OE = OMObj.toOutputExpression() )?
                for own key, value of @attributes
                    if not /^_|^OM$|^id$|^step$/.test key
                        OE.setAttribute key, value
                if @getAttribute 'step'
                    OE.validate = OutputRule.basicValidate
                [ OE ]
            else [ ]

Define the parsing routine and helper functions.

    initialState = ( text ) ->
        text : text
        bracketDepth : 0
        nextClass : null
        position : 0
        parentIds : [ 'root' ]
        nextIndex : [ 0 ]
        lastInsertedId : null
        labels : [ ]
        calls : [ ]
    consume = ( state, n ) ->
        state.text = state.text[n..]
        state.position += n
        state
    initialSegmentWithoutSpacesOutsideQuotes = ( text ) ->
        inQuote = no
        position = 0
        numSlashes = 0
        while position < text.length
            char = text[position]
            position++
            if inQuote
                if char is '\\'
                    numSlashes++
                else
                    numSlashes = 0
                    if char is '"' and numSlashes % 2 is 0
                        inQuote = no
            else
                if char is ' ' then position-- ; break
                if char is '"' then inQuote = yes
        return position
    parse = ( state ) ->
        if typeof state is 'string'
            return parse initialState state
        #console.log state.text
        #console.log JSON.stringify state, null, 4
        if state.text.length is 0
            if state.bracketDepth > 0
                throw
                    message : 'Unexpected end of file'
                    state : state
            return state.calls
        if /\s/.test state.text[0]
            return parse consume state, 1
        if /^[{]\s/.test state.text
            className = state.nextClass or 'Structure'
            ctor = Structure::subclasses[className]
            struct = new ctor().attr id : state.position
            if state.labels.length > 0
                struct.setAttribute 'label regex',
                    "^(#{state.labels.join '|'})$"
            state.calls.push
                method : 'insertStructure'
                args : [
                    struct.toJSON()
                    state.parentIds[state.parentIds.length-1]
                    state.nextIndex[state.nextIndex.length-1]
                ]
            state.nextIndex[state.nextIndex.length-1]++
            state.bracketDepth++
            state.nextIndex.push 0
            state.labels = [ ]
            state.lastInsertedId = state.position
            state.parentIds.push state.position
            return parse consume state, 1
        if state.text[0] is '}'
            if state.bracketDepth is 0
                throw
                    message : 'Unmatched }'
                    state : state
            state.bracketDepth--
            state.parentIds.pop()
            state.nextIndex.pop()
            state.nextClass = null
            return parse consume state, 1
        if match = /^([a-zA-Z_][a-zA-Z0-9_]*)[{]/.exec state.text
            state.nextClass = match[1]
            return parse consume state, match[0].length-1
        if match = /^([a-zA-Z0-9_][a-zA-Z0-9_ ]*)[:.]\s/.exec state.text
            state.labels.push match[1]
            return parse consume state, match[0].length
        if match = /^(by\([a-zA-Z0-9_ ,]+\))/.exec state.text
            if not state.lastInsertedId?
                throw
                    message : 'Unexpected "by"'
                    state : state
            [ reason, premises... ] = match[1][3...-1].split ','
            state.calls.push
                method : 'setStructureAttribute'
                args : [
                    state.lastInsertedId
                    'step'
                    yes
                ]
            state.calls.push
                method : 'setStructureAttribute'
                args : [
                    state.lastInsertedId
                    'reason citations'
                    [ reason ]
                ]
            if premises.length > 0
                state.calls.push
                    method : 'setStructureAttribute'
                    args : [
                        state.lastInsertedId
                        'premise citations'
                        premises
                    ]
            return parse consume state, match[0].length
        segLength = initialSegmentWithoutSpacesOutsideQuotes state.text
        segment = state.text[...segLength]
        maybeOM = OM.simple segment
        if typeof maybeOM isnt 'string'
            struct = new OpenMathIS().attr
                id : state.position
                OM : segment
            if state.labels.length > 0
                struct.setAttribute 'label regex',
                    "^(#{state.labels.join '|'})$"
            state.labels = [ ]
            state.calls.push
                method : 'insertStructure'
                args : [
                    struct.toJSON()
                    state.parentIds[state.parentIds.length-1]
                    state.nextIndex[state.nextIndex.length-1]
                ]
            state.nextIndex[state.nextIndex.length-1]++
            state.lastInsertedId = state.position
            return parse consume state, segLength
        try
            maybeJSON = JSON.parse segment
        catch e
            throw
                message : 'Not valid OpenMath nor JSON: ' + segment
                OMerror : maybeOM
                JSONerror : e
                state : state
        if not state.lastInsertedId?
            throw
                message : 'Unexpected JSON'
                state : state
        for own key, value of maybeJSON
            state.calls.push
                method : 'setStructureAttribute'
                args : [
                    state.lastInsertedId
                    key
                    value
                ]
        return parse consume state, segLength

Get options and an input file.

    filename = null
    options = [ ]
    optionConversion =
        "-v" : '--verbose'
        "-c" : '--commands'
        "-i" : '--input-tree'
        "-o" : '--output-tree'
    for arg in process.argv[2..]
        if arg[0] is '-'
            if optionConversion.hasOwnProperty arg
                arg = optionConversion[arg]
            options.push arg[2..]
        else if filename?
            console.error 'Provide exactly one input filename.'
            process.exit 1
        else
            filename = arg
    if not filename?
        console.error 'Usage: coffee slur.litcoffee [options] <file.slur>'
        process.exit 1
    verbose = ( text ) ->
        if 'verbose' in options then console.log text

Load that file.

    contents = String fs.readFileSync filename
    allLines = contents.split '\n'
    lines = allLines.filter (x) -> !(x.charAt(0)=='#')
    contents = lines.join ' '
    verbose "Read #{lines.length} lines from #{filename}."

Create a function to convert string positions to line:col pairs.

    posToPair = ( position ) ->
        line = 0
        while position > lines[line].length
            position -= lines[line++].length + 1
        "#{line}:#{position}"

Parse it and stop there if requested.

    try
        commands = parse contents
    catch e
        console.log 'Error:', e
        process.exit 1
    if 'commands' in options
        console.log JSON.stringify commands, null, 4
        process.exit 0

If there weren't any commands, stop now.  (Otherwise we'll be
waiting for the LDE to send responses that will never come.)

    if commands.length is 0
        verbose 'No commands to execute.'
        process.exit 0

Prepare to listen to the LDE when it sends messages.

    LDE.Feedback.addEventListener 'feedback', ( event ) ->
        if event.type is 'updated LDE state'
            verbose 'Interpretation complete.'
            if 'output-tree' in options
                console.log JSON.stringify \
                    LDE.getOutputTree().toJSON(), null, 4
                process.exit 0
        if event.type is 'validation result'
            console.log "Step at #{posToPair event.subject} is
                #{event.validity}."
            for own key, value of event
                if key not in [ 'validity', 'subject', 'type' ]
                    console.log "\t#{key}: #{value}"
        if event.type is 'validation complete'
            verbose 'Validation complete.'
            process.exit 0

Tell the LDE to do those things.

    LDE.reset()
    for command in commands
        LDE[command.method] command.args...
    if 'input-tree' in options
        console.log \
            JSON.stringify LDE.getInputTree().toJSON(), null, 4
        process.exit 0
    verbose 'Input Tree populated.'

If you don't hear back soon, quit with an error.

    maxWait = 5000
    setTimeout ->
        console.error "LDE did not complete processing in
            #{maxWait}ms.  Force quitting now."
        process.exit 1
    , maxWait
