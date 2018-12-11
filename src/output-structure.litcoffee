
# Output Structures

The LDE module constructs, for its internal use, a hierarchy of
`OutputStructure` instances called the Output Tree.  The word "output" is
used because it is the output of an interpretation process defined
throughout the subclasses of `InputStructure`.

These have entirely different functionality than their cousins
`InputStructure` instances.  In short, these support validation while
`InputStructure`s support interpretation.  You can also think of the
difference as this:  `InputStructure`s represent the syntax of what the user
has expressed to the client, and `OutputStructure`s represent the semantics
into which we interpret that syntax.

## Import modules

Import the `Structure` class.  The following lines detect whether this
is being used in Node.js or a WebWorker, or a WebWorker-like background
thread within Node.js, and do the right thing in any case.

In the Worker cases, it is important not to call `importScripts` on the same
module more than once from different files, or all manner of confusing logic
errors manifest at runtime, hence the checks below.

    if require?
        { Structure } = require './structure'
        { InputStructure } = require './input-structure'
        { OM } = require 'openmath-js'
        FOM = require 'first-order-matching'
    else if WorkerGlobalScope?
        if not WorkerGlobalScope.Structure?
            importScripts 'structure.js'
            importScripts 'input-structure.js'
        if not WorkerGlobalScope.OM?
            importScripts 'openmath.js'
        if not WorkerGlobalScope.metavariableSymbol?
            importScripts 'first-order-matching.js'
    else if self?.importScripts?
        if not self.Structure?
            importScripts 'release/structure.js'
            importScripts 'release/input-structure.js'
        if not self.OM?
            importScripts 'node_modules/openmath-js/openmath.js'
        if not self.metavariableSymbol?
            importScripts 'node_modules/first-order-matching/first-order-matching.js'

## Define the `OutputStructure` class

    class OutputStructure extends Structure

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'OutputStructure', OutputStructure

Marking an `OutputStructure` dirty, unlike with `InputStructure`s, does not
propagate up the ancestor chain.  Thus we define the following function
analogous to the one in the `InputStructure` class, but without the
recursive propagation.

        markDirty : ( yesOrNo = yes ) -> @dirty = yesOrNo

A newly constructed instance should be considered dirty (because it probably
just changed and thus may need to be validated).  It should also record the
`InputStructure` instance that gave rise to it, if indeed this construction
happend as part of interpretation.

        constructor : ->
            super arguments...
            @markDirty()
            IS = Structure::subclasses.InputStructure
            if len = IS::instancesBeingInterpreted?.length
                @origin = IS::instancesBeingInterpreted[len-1]
            @enableFeedback yes, no

Similar to tracking origins for `OutputStructure` nodes, if a connection is
formed between `OutputStructure` instances, we will want to track its origin
in the sense of which `InputStructure` was being interpreted when the
connection was formed.

        addConnectionOrigin : ( source, target, data ) ->
            IS = Structure::subclasses.InputStructure
            if ( target instanceof OutputStructure ) and \
               ( len = IS::instancesBeingInterpreted?.length )
                data._origin = IS::instancesBeingInterpreted[len-1].id()

## Feedback

Feedback on this structure can be given by calling a single function,
`feedback`, and passing an object with a feedback `type` field and optional
other fields.  By default, that method finds the `InputStructure` instance
that created this `OutputStructure` and if there is such a thing, calls the
`feedback` method in it.  (That will delegate the work further, but that is
not our concern here.)

But it is sometimes the case that we do not wish generated feedback to be
immediately emitted to the client.  For instance, if several different
methods to validate this `Structure` are being attempted in sequence, we
might wish to inspect all the generated feedback before deciding which
subset of it to emit to the client.

Thus we provide a function for enabling or disabling the storing of
feedback.  When enabled, no feedback is emitted, but it is all stored in a
`feedbackQueue`.  At any point, that queue can be cleared, optionally
emitting all of its contents first, using the methods below.

        feedback : ( feedbackData ) ->
            if @sendingFeedback
                @origin?.feedback feedbackData
            else
                @feedbackStore.push feedbackData
        enableFeedback : ( enable = yes, emitAll = no ) ->
            if ( @sendingFeedback = enable ) and emitAll
                @feedback feedbackData for feedbackData in @feedbackStore
            @feedbackStore = [ ]

## Labels

`OutputStructure`s can be labeled.  This is implemented by a function that
takes a string as input and returns true or false, whether the structure has
that label.  This permits a lot of freedom in how we match labels to
structures, including case sensitivity, punctuation sensitivity, multiple
labels, and so on.  By default, however, everything is unlabeled, so the
base implementation is as follows.

        hasLabel : ( label ) -> no

We can look back through a list of all the `OutputStructure`s accessible to
a given one, seeking the first one that admits to having a given label, by
use of the `hasLabel()` function on each accessible structure.  We implement
that generically with the following class method, then make a shortcut for
use by instances below.  Here we assume that the accessibles array is given
in the order in which the nodes appear in the tree
(`Structure.isEarlierThan()`).

        @lookUpIn : ( label, accessibles ) ->
            for candidate in accessibles[...].reverse()
                return candidate if candidate.hasLabel label
            undefined

When an instance asks to look up the nearest accessible thing with a given
label, what it means is among those things accessible to that instance.

        lookUp : ( label ) ->
            @firstAccessible ( candidate ) -> candidate.hasLabel label

When an instance asks to look up all accessible things with a given label,
they are still returned in the order in which they are encountered when
traversing the list of accessibles.

        lookUpAll : ( label ) ->
            @allAccessibles ( candidate ) -> candidate.hasLabel label

## Citations

Obeying the conventions set down by interpretation, as defined in
[the InputStructure class](input-structure.litcoffee#citations), we provide
the following function to look up all structures cited by this one.  The
notion of "looking them up" here means finding the targets that are cited by
the data stored in this object and creating a dictionary mapping the means
of citation to the structures cited.

We respect the following citation conventions set down by the
`InputStructure` class linked to in the previous paragraph:
 * The "premise citations" and "reason citations" attributes will each map
   to a list of strings, each of which attempts to cite something by label.
 * Connections out of this node whose JSON data contains the key-value pair
   ("type","premise citation") or ("type","reason citation") are each
   interpreted as a citation.

The form of the result will be a JSON structure with this format:
```javascript
{
    premises : { // citations of premises go in here
        connections : [ // citations by connection go in here
            {
                cited : "id of target structure",
                id : "id of connection, so you can get its data later"
            }
            // zero or more such objects in this array
        ],
        labels : [ // citations by label go in here
            {
                cited : "id of cited structure",
                label : "text of label by which it was cited"
            }
            // zero or more such objects in this array
        ]
    },
    reasons : {
        // same structure as premises object above
    }
}
```

        lookUpAllCitations : ->

Initialize the data structure we will return, empty at first.

            result =
                premises :
                    connections : [ ]
                    labels : [ ]
                reasons :
                    connections : [ ]
                    labels : [ ]

Fill both connections arrays by examining all connections out of this
structure for their types.

            for connection in @getConnectionsOut()
                data = @getConnectionData connection
                for type in [ 'premise', 'reason' ]
                    if data?.type is "#{type} citation" and
                       ( target = @getConnectionTarget connection )?
                        result["#{type}s"].connections.push
                            cited : target.id()
                            id : connection

Fill both labels arrays by examining the relevant attributes of this
structure.

            for type in [ 'premise', 'reason' ]
                if ( labels = @getAttribute "#{type} citations" ) and \
                   labels instanceof Array
                    for label in labels
                        for cited in @lookUpAll( label ).reverse()
                            result["#{type}s"].labels.push
                                cited : cited.id()
                                label : label

Return the result.

            result

## Handling change events

When interpretation has completed, the `justChanged()` function will be
called in every structure in the Output Tree has been updated during that
interpretation phase.  We provide the following default implementation for
`justChanged()` that will defer the work to the class method
`instanceJustChanged` if and only if that class method exists.  It doesn't
yet exist, so this is ineffective unless some later code installs just such
a class method.

The reason for this is that the actual implementation we want to provide
depends upon some global data structures in the LDE to which this module
does not have access.  When the LDE loads this module, it can fill in the
missing class method with the appropriate implementation, which accesses its
own internals.

        justChanged : -> OutputStructure::instanceJustChanged? @

## Define `OutputExpression` as a type of `OutputStructure`

An `OutputExpression` is the most common type of mathematics we think of
when doing mathematics on a computer.  It may be a mathematical noun, such
as 3x, or a mathematical statement, such as "not every number is even."
These are what typically appear inside dollar signs in LaTeX documents, and
form the majority of the content of any proof in a formal system.

In the LDE, we use OpenMath data types to store expressions.  In particular,
we rely on a JavaScript implementation of part of the OpenMath Standard,
[published here](https://github.com/lurchmath/openmath-js).  Each expression
is a tree made up of instances of the following class, each of which
corresponds to a node in an OpenMath tree, and there are conversion
functions between the two data structures.

    class OutputExpression extends OutputStructure

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'OutputExpression',
            OutputExpression

The constructor takes an arbitrary number of parameters.  The first is
always the OpenMath type that this object represents (e.g., string, integer,
function application, etc.).  That type should be expressed in the
three-letter form used in the OpenMath module's code (e.g., "int", "flo",
"str", etc., as a JavaScript string).

The remaining parameters depend on the first.

 * If the first parameter gives this object an OpenMath atomic type, then
   the next should contain the atomic content (e.g., string data if this is
   a string).  In one case (OpenMath symbol) this atomic content is spread
   over two or three parameters: name, CD, and optional URI.
 * If the first parameter gives this object an OpenMath binding type, then
   the second parameter should be an array of the indices of bound
   variables, and then the third and further parameters are its children,
   which must be `OutputExpression` instances, and will be passed to the
   superclass's constructor.
 * In all other cases, the second and further parameters are the children,
   and are passed on as in the previous case.

If an invalid type is passed as first parameter, we construct an OpenMath
error object instead, with no children and no attributes.  Any other
configuration of invalid parametrs (e.g., bad binding indices) will be
accepted, but may not convert to an OpenMath object in `toOpenMath()`.
Note that an error object constructed that way will not correctly convert
to an OpenMath object, because it has not head symbol.

        constructor : ( type, rest... ) ->
            switch type
                when 'int', 'flo', 'str', 'byt', 'var'
                    super()
                    @setAttribute 'OM type', type
                    @setAttribute 'OM atomic value', rest[0]
                when 'sym'
                    super()
                    @setAttribute 'OM type', type
                    @setAttribute 'OM atomic value', rest
                when 'bin'
                    super rest[1..]...
                    @setAttribute 'OM type', type
                    @setAttribute 'OM bound indices', rest[0]
                when 'app', 'err'
                    super rest...
                    @setAttribute 'OM type', type
                else
                    super()
                    @setAttribute 'OM type', 'err'

We wish to be able to extract from any `OutputExpression` instance the
OpenMath object that it represents.  We do so with the following conversion
function.  If conversion to an OpenMath object fails from an error in the
OpenMath package, that error is not caught; clients should take care to
form their `OutputExpression` instances correctly or use `try`/`catch`.

Attributes whose keys do not begin with an underscore, and are not "id" will
be added to the resulting OpenMath object.  Because all OpenMath attributes
must have values that are OpenMath objects, we convert the `Structure`
attribute to JSON and embed it in an OpenMath string.  By default,
attributes are not included; you can include them with the parameter.

        toOpenMath : ( withAttributes = no ) ->
            result = switch type = @getAttribute 'OM type'
                when 'int', 'flo', 'str', 'byt', 'var'
                    new OM[type] @getAttribute 'OM atomic value'
                when 'sym'
                    new OM[type] @getAttribute( 'OM atomic value' )...
                when 'app', 'err'
                    childResults = ( child.toOpenMath withAttributes \
                        for child in @children() )
                    new OM[type] childResults...
                when 'bin'
                    indices = @getAttribute 'OM bound indices'
                    vars = for i in indices
                        OM.var @children()[i].getAttribute 'OM atomic value'
                    notVarIndices = ( i for i in [0...@children().length] \
                        when i not in indices )
                    head = @children()[notVarIndices[0]].toOpenMath \
                        withAttributes
                    body = @children()[notVarIndices[1]].toOpenMath \
                        withAttributes
                    new OM.bin head, vars..., body
                else
                    throw "Not a valid OpenMath type: #{type}"
            if withAttributes
                for own key, value of @attributes
                    if key isnt 'id' and key[0] isnt '_'
                        newKey = OM.encodeAsIdentifier key
                        result.setAttribute OM.sym( newKey, 'Lurch' ),
                            OM.str JSON.stringify [ value ]
            result

We also want the inverse conversion function, from `OMNode` instances (from
the OpenMath package) to instances of this type.  We provide that function
as a class method here, and one should call it on an instance of the
`OMNode` class; it will yield an instance of this class in every case,
because `OMNode` instances cannot be incorrectly formed.

It inverts the attribute encoding described above the previous function.

        @fromOpenMath : ( node, withAttributes = no ) ->
            childResults = ( OutputExpression.fromOpenMath( child,
                withAttributes ) for child in node.children )
            result = switch node.type
                when 'i' then new OutputExpression 'int', node.value
                when 'f' then new OutputExpression 'flo', node.value
                when 'st' then new OutputExpression 'str', node.value
                when 'ba' then new OutputExpression 'byt', node.value
                when 'sy' then new OutputExpression 'sym', node.name,
                    node.cd, node.uri
                when 'v' then new OutputExpression 'var', node.name
                when 'a' then new OutputExpression 'app', childResults...
                when 'bi'
                    vars = ( new OutputExpression 'var', v.name \
                        for v in node.variables )
                    head = OutputExpression.fromOpenMath node.symbol,
                        withAttributes
                    body = OutputExpression.fromOpenMath node.body,
                        withAttributes
                    new OutputExpression 'bin', [1...childResults.length],
                        head, vars..., body
                when 'e' then new OutputExpression 'err',
                    OutputExpression.fromOpenMath( node.symbol,
                        withAttributes ), childResults...
                else throw "This should never happen - how did an
                    OMNode instance get type #{node.type}?"
            if withAttributes
                for own key, value of node.tree.a
                    try
                        decodedKey = OM.decodeIdentifier \
                            OM.decode( key ).name
                        result.setAttribute decodedKey,
                            JSON.parse( value.v )[0]
            result

For convenience, we install in the `OMNode` class a method for converting
instances to `OutputExpression` types by simply deferring the work to the
above function.

    OM::toOutputExpression = ( withAttributes ) ->
        OutputExpression.fromOpenMath @, withAttributes

## Define `OutputRule` as a type of `OutputStructure`

An `OutputRule` is a member of the Output Tree that has a function
`validateStep()` that can be called on a step of work to validate it.  As
documented
[elsewhere](https://lurchmath.github.io/lde/site/api-phases/#validation),
a step `S` is normally validated by calling `S.validate(worker,callback)`,
but in the case when the step cites a rule, that function will typically
want to delegate the work to the rule itself, so that we can support rules
with arbitrary decision procedures within an object-oriented framework.

    class OutputRule extends OutputStructure

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'OutputRule', OutputRule

The `validateStep()` function takes three parameters: the step to validate
and the `worker` and `callback` functions that were given to its `validate`
routine.  The `worker` can be used to do any lengthy tasks in the
background and the `callback` should naturally be called to indicate when
the task is complete (passing no arguments).

The default implementation just produces feedback saying that no real
validation was done, and then calls the callback.  Naturally, subclasses
that do real work will want to override this default.

        validateStep : ( step, worker, callback ) ->
            step.feedback
                type : 'validation result'
                validity : 'indeterminate'
                message : 'No real validation was performed.'
            callback()

We also provide a class member that can be copied out of this class and into
`OutputExpression` instances as their validate routine.  This routine just
delegates validation to the cited rule.  If there is any non-`OutputRule`
instance cited as a reason, the step is judged invalid.  If there is more
than one `OutputRule` step cited as a reason, then this routine checks each
in turn to see if any will validate the step.  If not, then the resulting
negative feedback includes a `phases` field containing all the feedback
objects generated by all the cited rules.

        @basicValidate : ( worker, callback ) ->

Disable feedback emission, because we will want to inspect the feedback
generated instead of just immediately sending it out.  Compute the list of
cited reasons.

Note that throughout this routine, the `this` object is assumed to be a step
of work, because this function is designed to be installed in such objects
as their `validate` routine.

            @enableFeedback no
            reasons = @lastCitationLookup.reasons
            reasons = reasons.connections.concat reasons.labels

We process each cited reason asynchronously, using a function that calls
itself recursively in callbacks.

            do processNext = =>

The base csae is when we've finished processing all reasons.  This may be
because there weren't any, in which case we do nothing, or because all of
them said the step was invalid, in which case we combine them into a single
feedback message, which we emit.

                if reasons.length is 0
                    keptFeedback = @feedbackStore
                    @enableFeedback yes, no
                    if keptFeedback.length > 1
                        @feedback
                            type : 'validation result'
                            validity : 'invalid'
                            components : keptFeedback
                    else if keptFeedback.length is 1
                        @feedback keptFeedback[0]
                    return callback()

There remain reasons to process, so get the next one.  If we can't seem to
find it by its ID, then some internal error has happened, because that's not
supposed to ever happen.  Report it just in case and stop validation
entirely in that case.

                reason = reasons.shift()
                if not ( rule = Structure.instanceWithID reason.cited )?
                    @enableFeedback yes, no
                    @feedback
                        type : 'validation result'
                        validity : 'invalid'
                        message : "Internal error:
                            No Structure with ID #{reason.cited}"
                        missingID : reason.cited
                    return callback()

If they cited a non-rule, stop right now and tell them that's invalid and we
won't proceed to even try to validate this step.

                if rule not instanceof OutputRule
                    @enableFeedback yes, no
                    @feedback
                        type : 'validation result'
                        validity : 'invalid'
                        message : 'You cited a non-rule as a reason.'
                        nonRule : reason.cited
                    return callback()

Run the validation procedure for the cited rule, and when it completes,
inspect the feedback it produced.  If it's positive, send it right now and
be done.  If it's anything else, keep looking, via a recursive call.

                rule.validateStep @, worker, =>
                    lastFeedback = @feedbackStore[@feedbackStore.length - 1]
                    if lastFeedback?.validity is 'valid'
                        @enableFeedback yes, no
                        @feedback lastFeedback
                        callback()
                    else
                        processNext()

## Define `TemplateRule` as a type of `OutputRule`

A `TemplateRule` is an `OutputRule` that validates steps based on a template
of zero or more premises and one or more conclusion.  They can be
tree-based (meaning that they perform pattern matching based on expression
trees) or string-based (meaning that they perform pattern matching based on
strings) and they can be uni-directional (if premises then conclusion) or
bi-directional (premises if and only if conclusions).

    class TemplateRule extends OutputRule

In order for a hierarchy of structures to be able to be serialized and
deserialized, we need to track the class of each structure in the hierarchy.
We do so for this class with the following line of code.

        className : Structure.addSubclass 'TemplateRule', TemplateRule

### Main `TemplateRule` functions

The `validateStep()` function of the this class assumes the class was
constructed syntactically correctly, that is, with only children that are of
the class `OutputExpression` and with some subset of them having the
attribute "premise" set to true (the rest of them being conclusions).

It assumes tree-based matching, but can be configured to use string-based
matching if the attribute "matching type" is set to "string".  It assumes a
one-way (if-then) rule, but can be configured to perform two-way (if and
only if) checking if the attribute "iff" is set to true.

        validateStep : ( step, worker, callback ) ->

Compute the list of premises and conclusions in OpenMath form.  Then compute
how many forms this rule has (one for each conclusion in one-way form, plus
one for each premise if we're allowed to use it in two-way form as well).
Write a function that can produce any of those forms, but don't compute them
all up front, because we don't yet know if we need them.  We can call that
function later to create them just in time.

            rulePremises = ( child.toOpenMath yes for child in @children() \
                when child.getAttribute 'premise' )
            ruleConclusions = ( child.toOpenMath yes \
                for child in @children() \
                when not child.getAttribute 'premise' )
            numRuleForms = ruleConclusions.length
            if @getAttribute 'iff' then numRuleForms += rulePremises.length
            buildRuleForm = ( prems, concl ) ->
                OM.app(
                    OM.sym( 'Rule', 'Lurch' ),
                    ( p.copy() for p in prems )...,
                    concl.copy()
                )
            getRuleForm = ( index ) ->
                if index < ruleConclusions.length
                    prems = rulePremises
                    concl = ruleConclusions[index]
                else
                    prems = ruleConclusions
                    concl = rulePremises[index-ruleConclusions.length]
                result = buildRuleForm prems, concl
                vars = result.descendantsSatisfying ( d ) -> d.type is 'v'
                FOM.setMetavariable v for v in vars
                result

Unite the step and its cited premises into the same structure, so that we
might compare them.

            if step not instanceof OutputExpression
                step.feedback
                    type : 'validation result'
                    validity : 'invalid'
                    message : 'Conclusion is not an expression'
            premises = [ ]
            for type in [ 'connections', 'labels' ]
                for citation in step.lastCitationLookup.premises[type]
                    premise = Structure.instanceWithID citation.cited
                    if premise not instanceof OutputExpression
                        step.feedback
                            type : 'validation result'
                            validity : 'invalid'
                            message : 'Cited premise is not an expression'
                            id : citation.cited
                        return callback()
                    premises.push premise.toOpenMath yes
            instance = buildRuleForm premises, step.toOpenMath yes

From here on out, we need to know whether we're doing string-based pattern
matching or tree-based pattern matching, so we compute that here.

            ruleType = if @getAttribute( 'matching type' ) is 'string' \
                then 'string' else 'tree'

See if any of the forms of this rule matches the instance as claimed.  We do
this asynchronously in background threads, but begin by installing the
necessary script and step data into the worker we've been given.

            stepToInstall = if ruleType is 'tree' then instance.encode() \
                else ( x.value for x in instance.children[1..] )
            @setupWorker worker, { step : stepToInstall }, callback, =>
                index = 0
                do processNext = =>

First, if we've tried all the forms, then they've all failed, so we report
that the rule does not justify the step.

                    if index is numRuleForms
                        step.feedback
                            type : 'validation result'
                            validity : 'invalid'
                            message : 'Cited rule does not justify the
                                step'
                        return callback()

Otherwise, we have another form to try, so let's queue it up for checking in
the background worker.

                    validator =
                        TemplateRule["#{ruleType}BasedPatternMatching"]
                    ruleToInstall = if ruleType is 'tree'
                        getRuleForm( index ).encode()
                    else
                        for child in getRuleForm( index ).children[1..]
                            child.toOutputExpression( yes )
                                 .getAttribute 'string pattern'
                    @setupWorker worker, { rule : ruleToInstall },
                    callback, ->
                        worker.run validator, ( response ) ->
                            if response.error?
                                step.feedback
                                    type : 'validation result'
                                    validity : 'invalid'
                                    message : 'Internal error in pattern
                                        matching'
                                    details : response.error
                                return callback()

Here we've gotten past all the error checks, so we either have a match,
which means the step is valid, or we have a non-match, which means we should
move on to try the next form of the rule, with a recursive call to
`processNext()`.

                            if response.result?
                                step.feedback
                                    type : 'validation result'
                                    validity : 'valid'
                                return callback()
                            index++
                            processNext()

### Utility functions for `TemplateRule`s

The following utility function is used by `validateStep()` to set up a
worker for use in matching.  It ensures that the Matching Package has been
loaded (exactly once) in that worker, and ensures that all the given global
data has been installed as well.  If an error occurs at any point, it calls
the error callback after first sending negative validation feedback about an
internal error.  If no error occurs, it calls the success callback.

        setupWorker : ( worker, data, error, success ) ->

Define a helper function for expressing internal errors, to simplify code
below.

            ie = ( message, details ) =>
                feedbackObj =
                    type : 'validation result'
                    validity : 'invalid'
                    message : "Internal error setting up validation worker:
                        could not #{message}"
                if details? then feedbackObj.details = details
                @feedback feedbackObj
                return error()

Create the list of keys in `data` that we need to install in the worker.

            toInstall = ( k for own k, v of data )

Create an asynchronous recursive function to install all those keys.

            do nextStep = =>
                if toInstall.length > 0
                    key = toInstall.shift()
                    worker.installData key, data[key], ( response ) =>
                        if response.error? then return ie "install #{key}"
                        nextStep()

When they're all installed, the last step is to install the matching
package if and only if it's needed, then call the `success` callback.

                else if @getAttribute( 'matching type' ) is 'string'
                    worker.run ( -> typeof stringMatches ), ( response ) =>
                        if response.error?
                            return ie 'check string matching installation',
                                response.error
                        if response.result is 'undefined'
                            worker.installFunction 'stringMatches',
                            TemplateRule.stringMatches, ( response ) =>
                                if response.error?
                                    return ie 'install string matcher',
                                        response.error
                                worker.installFunction 'stringListMatches',
                                TemplateRule.stringListMatches,
                                ( response ) =>
                                    if response.error?
                                        return ie 'install string list
                                            matcher', response.error
                                    success()
                        else
                            success()
                else
                    worker.run ( -> typeof isMetavariable ), ( response ) =>
                        if response.error?
                            return ie 'check package status',
                                response.error
                        if response.result is 'undefined'
                            path = 'first-order-matching.js'
                            if require? then path = "release/#{path}"
                            worker.installScript path, ( response ) =>
                                if response.error?
                                    return ie 'install matching package',
                                        response.error
                                success()
                        else
                            success()

We also need a function that will do string-based pattern matching so that
the LDE can support
[string-rewriting systems](https://en.wikipedia.org/wiki/Semi-Thue_system)
such as [Hofstadter's MU puzzle](https://en.wikipedia.org/wiki/MU_puzzle)
rather than just the standard interpretation of syntax as representing
trees of meaning.  The following function is that pattern-matcher.  We
define it as a class method so that it can be easily installed in workers.

It expects the first parameter to be a list of objects, each of which has
either `type : "string"` or `type : "metavariable"` and has the contents of
the string (or the name of the metavariable) as its `text` field.  The
second parameter should be the string against which to attempt to find
matches, and the third parameter should be omitted; it is for internal use.

This is an inefficient implementation that could be improved later if
needed.

        @stringMatches = ( patterns, string, soFar ) ->

Must initialize default parameter values inside, so that this function can
be converted to a list of arguments and a body correctly when being sent to
a worker for use in a `Function` constructor.

            soFar ?= { }

Base case: If we've consumed all patterns, then there exists a solution iff
we've also consumed the entire string.

            if patterns.length is 0
                return if string.length is 0
                    [ JSON.parse JSON.stringify soFar ] # deep copy
                else
                    [ ]

Inductive step: Pop one pattern off and consider it next.  If it is a string
literal, then it must match the beginning of the string exactly.

            pattern = patterns[0]
            t = pattern.text
            if pattern.type is 'string'
                return if string[...t.length] is t
                    stringMatches patterns[1..], string[t.length..], soFar
                else
                    [ ]

Since it is not a string literal, it must be a metavariable.  If we've seen
it already, then its meaning is treated like a string literal.

            if soFar.hasOwnProperty t
                return if string[...soFar[t].length] is soFar[t]
                    stringMatches patterns[1..], string[soFar[t].length..],
                        soFar
                else
                    [ ]

Otherwise it is a metavariable we must consider how to instantiate.  Here is
where the inefficient part of this implementation comes in:  We just
consider each of the possibilities it could be, from the first character of
the string alone up through the entire rest of the string, and check each
one by instantiating it that way and then recurring.  Unite all solutions
into one big array and return them.

            results = [ ]
            for i in [1..string.length]
                soFar[t] = string[...i]
                results = results.concat stringMatches patterns[1..],
                    string[i..], soFar
            delete soFar[t] # clean the object up before we un-recur
            results

We also define a function that applies the string matching function to two
lists, one of patterns and one of strings, which typically represent a rule
and a purported use of the rule.  It returns the set of matches that work
for the entire list of (pattern,string) pairs that can be formed from
corresponding elements of those lists.

See documentation in `stringMatches()`, above, for why we initialize `soFar`
inside the function body.

        @stringListMatches = ( patterns, strings, soFar ) ->
            soFar ?= { }
            if patterns.length is 0
                return if strings.length is 0 then [ soFar ] else [ ]
            if strings.length is 0 then return [ ]
            results = [ ]
            for next in stringMatches patterns[0], strings[0], soFar
                for result in stringListMatches patterns[1..], \
                                                strings[1..], next
                    results.push result
            results

The following utility function will be installed in workers, and extracts
rule and step data from the `globalData` object, calls the matching package
on it, and returns the results.

        @treeBasedPatternMatching = ->
            rule = OM.decode globalData.rule
            step = OM.decode globalData.step
            myMatch = nextMatch new Constraint rule, step
            if contents = myMatch?[0]?.contents
                for { pattern, expression } in contents
                    pattern : pattern.encode()
                    expression : expression.encode()
            else
                null

The following utility function is just like the previous, but does
string-based pattern matching instead.

        @stringBasedPatternMatching = ->
            myMatch = stringListMatches globalData.rule, globalData.step
            if myMatch.length then myMatch[0] else null

## Exports

Now if this is being used in a Node.js context, export the class we defined.

    if exports?
        exports.OutputStructure = OutputStructure
        exports.OutputExpression = OutputExpression
        exports.OutputRule = OutputRule
        exports.TemplateRule = TemplateRule
        exports.OM = exports.OMNode = OM
