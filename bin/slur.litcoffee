
# Slur Command-Line LDE Interface

"Slur" is short for "simple Lurch."

This file is a simple command-line client for the LDE.  It uses a
proprietary text format documented below.  It is not yet part of the
unit-testing suite.  Example uses appear in this `bin` folder, with the
`.slur` extension.

The purpose of this script is to read files in a very simple text format
that describes the input tree, construct the input tree in accordance with
that file's contents, run the LDE's process, and output the results.

## Running the command

For now, the command *must* be invoked from the root of this repository;
that can be fixed later.

Invoke as follows:
```
coffee bin/slur.litcoffee FILENAME.slur
```

Options, if present, are placed immediately before the filename.  These are
the currently available options:
 * `-v` or `--verbose`: Print an output line (possibly with some indented
   details on subsequent lines) for each event in the LDE's processing,
   including reading the file, populating the input tree, running
   interpretation, validating each step, and finishing validation.
 * `-c` or `--commands`: Don't build the Input Tree; just display the
   commands that would be sent to the LDE to build the Input Tree, then
   stop without doing anything else.
 * `-i` or `--input-tree`: Don't run interpretation or validation; just
   build the Input Tree, then display it in JSON format, and stop without
   doing anything else.
 * `-o` or `--output-tree`: Don't run validation; just build the Input Tree
   and run interpretation, then display the Output Tree in JSON format, and
   stop without doing anything else.

## The `.slur` file format

See examples of `.slur` files in the folder containing this script.

 * A line beginning with a `#` is a comment line and is ignored.  Everything
   else in the file is significant.
 * The format is plain text, and will typically include many instances of
   OpenMath expressions in the
   [simple encoding](https://github.com/lurchmath/openmath-js/blob/master/openmath.litcoffee#simple-encoding-and-decoding)
   format.  Within such expressions, whitespace is not permitted, except
   within string literals.  Example:
    * `logic1.and(P,Q)`
 * Any OpenMath expression can be followed by JSON (also containing no
   whitespace outside of string literals) to add attributes to the OpenMath
   expression.  There must be whitespace between the OpenMath and the JSON.
   Example:
    * `logic1.and(P,Q) {"color":"green","how many friends":0}`
 * Outside of OpenMath and JSON expressions, whitespace is insignificant and
   can be used to organize the file as you see fit, with indentation,
   newlines, etc. as might help a human reader.
 * For any subclass of [InputStructure](../src/input-structure.litcoffee),
   you can create an instance of it by writing the class name followed by
   its children in curly brackets.  No whitespace is permitted between the
   class name and the open curly bracket.  Example, the equality
   introduction rule:
    * `InputRule{ relation1.eq(a,a) }`
 * Curly brackets can be used without a preceding class name to form a
   generic parent `Structure`, for scoping purposes.
 * In a rule, all variables are treated as metavariables.
 * To add attributes to a parent structure, place the JSON immediately after
   the open curly bracket.  Example, a generic structure with a name and two
   children:
    * `{ {"name":"Edwina"} f(x) f(y) }`
 * Label any `InputStructure` or OpenMath expression by placing the label
   before it, followed by a period or colon.  Examples:
    * `Equality Introduction: InputRule{ relation1.eq(a,a) }`
    * `1. "my string"`
    * `2. My(Open,Math,Expression)`
 * To make a step of work cite a rule, suffix the step with a "by" clause,
   which is of the form `by(reason,premise1,premise2,...)`.  The `reason`
   should be a label that's been attached to a rule structure accessible to
   the step.  The premises (if there are any) should be the labels of
   earlier expressions accessible to the step, in the correct order.
   Example:
    * `EqIntro: InputRule{ relation1.eq(a,a) }`
    * `Copy: InputRule{  P {"premise":true}    P  }`
    * `1. relation1.eq(3,3) by(EqIntro)`
    * `2. relation1.eq(3,3) by(Copy,1)`

## Initial declarations

Import modules.

    { Structure, InputExpression, OutputRule } = LDE =
        require "#{__dirname}/../src/lde.litcoffee"
    { OM } = require 'openmath-js'
    fs = require 'fs'

Define an `InputExpression` subclass for parsing OpenMath.  It expects an
attribute with key "OM" containing the simple encoding of an OpenMath
expression, and its interpret routine produces the `OutputExpression` that
encodes the same meaning.

It also copies to the Output Tree all attributes that have been assigned to
the structure (excepting IDs and ones used internally by this package) and
enables basic validation if the expression is a step of work.

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

## Routines for parsing `.slur` files

We process `.slur` files by creating a state object which contains all the
text left to parse in the file, plus all the other information about what
has been parsed so far, and what is expected next.

Thus we define a function that can take the contents of a `.slur` file as
input and form an empty initial state, with that text stored for future
parsing.

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

We then define a utility function that consumes the first `n` characters
from a state by chopping them off of the text to parse and augmenting the
"position" counter that's used to remember where, in the initial file, each
structure was found.  This routine is used in many places in the `parse`
routine, below.

    consume = ( state, n ) ->
        state.text = state.text[n..]
        state.position += n
        state

Earlier we stated that both OpenMath and JSON were to appear with no
whitespace except within string literals.  We thus define a routine that
computes the length of the longest initial segment of the text to be parsed
that has no whitespace except within string literals.  This helps us to do
something like tokenizing, in the `parse` routine, below.

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

The parse routine proceeds to recursively consume the text in the given
`state`, at the end doing one of two things:  If anything in the input text
is malformed, an error is thrown.  Otherwise, it returns an array of calls
that should be made to the LDE to form the Input Tree.

    parse = ( state ) ->

If we were asked to parse text, convert it into a state object.

        if typeof state is 'string'
            return parse initialState state

When developing, it is sometimes helpful to uncomment the following lines.

        # console.log state.text
        # console.log JSON.stringify state, null, 4

If we've finished processing the file, then one of two things happens.
Either we discover unbalanced curly brackets and thus throw an error, or we
don't, and thus have succeeded.  In the latter case, we return the list of
LDE API calls that we have accrued in the `state` parameter.

        if state.text.length is 0
            if state.bracketDepth > 0
                throw
                    message : 'Unexpected end of file'
                    state : state
            return state.calls

If the next text to parse is just whitespace, skip over it.

        if /\s/.test state.text[0]
            return parse consume state, 1

If the next text to parse is an open curly bracket, then we should build a
new parent structure and insert that into the Input Tree, and remember that
until we encounter its close curly bracket, other expressions are its
children.

        if /^[{]\s/.test state.text

Build an empty instance of the class in question.  If there was a class
name before the curly bracket, already recorded, use that, otherwise make a
generic `Structure`.

            className = state.nextClass or 'Structure'
            ctor = Structure::subclasses[className]
            struct = new ctor().attr id : state.position
            if state.labels.length > 0
                struct.setAttribute 'label regex',
                    "^(#{state.labels.join '|'})$"

Create an API call that would construct a copy of that empty instance.

            state.calls.push
                method : 'insertStructure'
                args : [
                    struct.toJSON()
                    state.parentIds[state.parentIds.length-1]
                    state.nextIndex[state.nextIndex.length-1]
                ]

Increase our bracket depth counter and our list of indices at which we're
inserting children, then recur.

            state.nextIndex[state.nextIndex.length-1]++
            state.bracketDepth++
            state.nextIndex.push 0
            state.labels = [ ]
            state.lastInsertedId = state.position
            state.parentIds.push state.position
            return parse consume state, 1

If we find the close curly bracket for a parent, then one of two things
happens.  If there was no parent to end, throw an error; malformed input.
Otherwise, decrease bracket depth and pop the appropriate stacks.

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

If we have an identifier followed by an open curly bracket, then we'll just
record the class name in question, consume everything but the curly bracket,
and then let the earlier case that handles open curly brackets do its job.

        if match = /^([a-zA-Z_][a-zA-Z0-9_]*)[{]/.exec state.text
            state.nextClass = match[1]
            return parse consume state, match[0].length-1

If we have any kind of alphanumeric text (optionally with underscores and
spaces) followed by a dot or colon, that's a label, so just record it so
that we can attach it to the next structure we encounter.

        if match = /^([a-zA-Z0-9_][a-zA-Z0-9_ ]*)[:.]\s/.exec state.text
            state.labels.push match[1]
            return parse consume state, match[0].length

If we encounter a "by" clause, one of two things happens, each of which is
documented below.

        if match = /^(by\([a-zA-Z0-9_ ,]+\))/.exec state.text

If there is no structure that we just inserted, then this by clause is
misplaced, and we throw an error for malformed input.

            if not state.lastInsertedId?
                throw
                    message : 'Unexpected "by"'
                    state : state

Otherwise, we split the contents of the clause by commas and attach them as
attributes to the most recently inserted thing, so that it has the
attributes that a step of work should have to cite a reason and premises.

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

We are down to only two more possibilities:  Either the next text is an
OpenMath structure or some JSON.  Let's fetch the next chunk of text that
has no spaces other than within string literals, and then figure out which
of the two it is.

        segLength = initialSegmentWithoutSpacesOutsideQuotes state.text
        segment = state.text[...segLength]

Try to parse it as OpenMath.  If this fails, it will return a string
containing an error message.  Thus if the result is something other than a
string, we will form an `OpenMathIS` instance with all the correct
attributes, and use that to create a new API call for inserting such a
thing.

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

Since parsing the next chunk as OpenMath failed, let us try to do it as
JSON.  If this fails, throw an error because that's our last option, and
thus the file is malformed.

        try
            maybeJSON = JSON.parse segment
        catch e
            throw
                message : 'Not valid OpenMath nor JSON: ' + segment
                OMerror : maybeOM
                JSONerror : e
                state : state

Now, since it was JSON, it must be used to modify a previous OpenMath
expression or other `InputStructure`.  If there was no such thing, throw an
error.

        if not state.lastInsertedId?
            throw
                message : 'Unexpected JSON'
                state : state

We have JSON and a structure to apply it to, so create API calls for adding
all the JSON's contents as attributes to the structure.

        for own key, value of maybeJSON
            state.calls.push
                method : 'setStructureAttribute'
                args : [
                    state.lastInsertedId
                    key
                    value
                ]
        return parse consume state, segLength

## Main script process

This section includes the code that is actually run when this script is
invoked.  All the code above defines subroutines used herein.

Figure out which options were passed on the command line and convert them
all into a standard format (some subset of "verbose", "commands",
"input-tree", and "output-tree").  Also determine which filename, if any,
was specifid on the command line.  If none was, quit with an error.

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

The following convenience function writes output to the console if and only
if the user asked for it by specifying the "verbose" option.

    verbose = ( text ) ->
        if 'verbose' in options then console.log text

Load the file the user specified on the command line and filter out all
lines that begin with the comment character.

    contents = String fs.readFileSync filename
    allLines = contents.split '\n'
    lines = allLines.filter ( x ) -> x[0] isnt '#'
    contents = lines.join ' '
    verbose "Read #{lines.length} lines from #{filename}."

The following function converts character indices into the input file into
line-column pairs that are more meaningful to the user for feedback..

    posToPair = ( position ) ->
        line = 0
        while position > lines[line].length
            position -= lines[line++].length + 1
        "#{line+1}:#{position}"

Run the big parse routine defined [above](#routines-for-parsing-slur-files)
and quit if it gave any errors.

    try
        commands = parse contents
    catch e
        console.log 'Error:', e
        process.exit 1

If the user asked us to report the API calls we would make to the LDE to
generate the input tree and then quit, do exactly that right now.

    if 'commands' in options
        console.log JSON.stringify commands, null, 4
        process.exit 0

If the commands list is empty, then the user's file was probabyl all
comments or blank lines.  In such a case, it's important to stop here,
because all the code below is contingent upon listening for feedback from
the LDE, of which there will be none if we don't send it any commands.

    if commands.length is 0
        verbose 'No commands to execute.'
        process.exit 0

Install in the LDE an event handler for feedback messages.  Each of its
cases is documented below.

    LDE.Feedback.addEventListener 'feedback', ( event ) ->

If the LDE has just signalled the end of interpretation, and the user asked
us to stop there, then stop there after printing the Output Tree.

        if event.type is 'updated LDE state'
            verbose 'Interpretation complete.'
            if 'output-tree' in options
                console.log JSON.stringify \
                    LDE.getOutputTree().toJSON(), null, 4
                process.exit 0

If the LDE has just signalled the validation of a step of work, output all
of the details that came in the feedback event.  Note that we do this in
verbose or non-verbose mode.

        if event.type is 'validation result'
            console.log "Step at #{posToPair event.subject} is
                #{event.validity}."
            for own key, value of event
                if key not in [ 'validity', 'subject', 'type' ]
                    console.log "\t#{key}: #{value}"

If the LDE has just signalled the end of valiation, then all our work is
done, so print a message and stop.

        if event.type is 'validation complete'
            verbose 'Validation complete.'
            process.exit 0

In order for any of the messages just described to actually come out of the
LDE, we need to send it commands to obey.  So now we reset the LDE and then
transmit it all the commands for populating the Input Tree in accordance
with the user's `.slur` file.

    LDE.reset()
    for command in commands
        LDE[command.method] command.args...

If the user asked us to stop before hearing any feedback messages, then just
print out the Input Tree and stop here.

    if 'input-tree' in options
        console.log \
            JSON.stringify LDE.getInputTree().toJSON(), null, 4
        process.exit 0
    verbose 'Input Tree populated.'

If enough time passes without hearing anything from the LDE, then probably
some subtle internal error has occurred.  In that case, quit and print an
error about this.  This guarantees that the script will terminate within a
given time frame in every case.

    maxWait = 5000
    setTimeout ->
        console.error "LDE did not complete processing in
            #{maxWait}ms.  Force quitting now."
        process.exit 1
    , maxWait
