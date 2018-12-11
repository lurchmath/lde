
# API Documentation for the LDE's Phases

The LDE processes the Input Tree into the Output Tree and also does some
processing of the Output Tree as well.  This all happens in several phases
that proceed in sequence, each working with the output of the previous. We
document those phases below.

This documentation is not yet complete, because the phases have not yet all
been implemented.

## Modification

The modification phase is the briefest.  It is implemented in the LDE's
`runModification()` phase in its API, documented [here](https://github.com/lurchmath/lde/blob/master/src/lde.litcoffee#the-modification-phase).

That function loops through all `InputModifier` instances in the Input Tree
and calls the `updateConnections()` routine in each.  Each modifier should
take that opportunity to connect itself to the correct modification targets.
The reason for this is because those connections will govern, in the
subsequent interpretation phase, which expressions ask which modifiers to
embed data in the expressions.  In order for the expressions to make those
requests correctly, the modifiers need to decide in the modification phase
which expressions they should target.

## Interpretation

The interpretatin phase follows immediately after the modification phase;
indeed, the modification phase terminates by passing control directly to the
interpretation phase.

In this phase, the contents of the Input Tree (which can be thought of as a
generalized kind of syntax, representing anything the user wrote in the
client and the client passed on to the LDE) are *interpreted* into the
Output Tree (which can be thought of as the usable mathematical meaning of
the user's content).  Thus this phase is like a compiler in computer
science, or an interpretation function in model theory; it maps syntax to
(actionable) semantics.

It is implemented in the `runInterpretation()` method of the LDE's API,
documented [here](https://github.com/lurchmath/lde/blob/master/src/lde.litcoffee#the-modification-phase).

That function runs `recursiveInterpret()` on the root of the Input Tree, a
function implemented in [the InputStructure class](https://github.com/lurchmath/lde/blob/master/src/input-structure.litcoffee).
That function recursively traverses the Input Tree, runs the `interpret()`
function at each node, and assembles their results into the new Output Tree.

Some types of policing are done to ensure that `recursiveInterpret()` and
`interpret()` behave as they ought to, even if they are redefined in
subclasses not yet written.  For more information, see the errors that may
be generated as feedback, [documented here](api-lde.md#types-of-feedback).

## Validation

The validation phase follows immediately after the interpretation phase;
indeed, the interpretation phase terminates by calling its callback and then
enqueueing for validation any `OutputStructure` that it detects needs to be
validated.

This uses a validation priority queue built into the LDE, which leverages a
pool of workers in background threads to do the validation in parallel,
using as many simultaneously as possible (at least one worker, but no more
than the number of cores on the machine minus one, to leave one thread free
for the user interface).

 * For details on the pool of workers, see
   [this section of the source code](https://github.com/lurchmath/lde/blob/master/src/lde.litcoffee#validation-workers).
 * For details on each individual worker in the pool, see
   [the source for the `LDEWorker` class](https://github.com/lurchmath/lde/blob/master/src/worker.litcoffee)
   or
   [the source code run in each worker](https://github.com/lurchmath/lde/blob/master/src/worker-internal.litcoffee),
   which work hand-in-hand.
 * For details on the priority queue, see
   [this section of the source code](https://github.com/lurchmath/lde/blob/master/src/lde.litcoffee#validation-priority-queue).

When the last `OutputStructure` that needed validation finishes it, feedback
of type "validation complete" is emitted by the LDE.
[More details on types of feedback appear here.](api-lde.md#types-of-feedback)

### Default validation

An `OutputStructure` `S` is validated by calling
`S.validate(worker,callback)`, with the first parameter being an `LDEWorker`
instance available for use (see documentation link above) and the second
parameter being the function to call when the work is complete (passing no
parameters).  That validation function should generate feedback about `S`
but does not need to mark `S` clean nor actively return its worker to the
queue; those things happen automatically. It can feel free to use the entire
API for the `LDEWorker` class, including installing scripts, functions, or
data as needed.

But this setup is hardly convenient, because it requires each step of work
to include its own validation routine.  They would most often rather
delegate their validation to the rules they cite.  Thus we provide a
`basicValidate()` function in the `OutputRule` class that can be installed
in any step of work to do exactly that, find the cited reason(s) and
delegate the validation to their `validateStep()` routines.

### Rule-based validation

Based on what was just said in the previous section, rules will need to
provide `validateStep()` routines, and the default `OutputRule` class does
so, but it is a validation routine that does nothing and reports that it has
done nothing.  Thus it is essential to override this in subclasses.

The most prominent such subclass is `TemplateRule`, which creates a
`validateStep()` routine on your behalf if you provide it a list of children
with some subset marked with the attribute "premise" set to true, and at
least one without that attribute (that is, at least one conclusion).

The default type of pattern matching for `TemplateRule`s is tree-based,
using
[the matching package](https://github.com/lurchmath/first-order-matching).
In such a situation, the children should be `OutputExpression` instances so
that they can be converted to OpenMath expressions.  All variables in them
are considered metavariables.

You can set the pattern matching to be string-based by setting the rule's
attribute "matching type" to the string "string".  In such a situation, the
children should each have an attribute with key "string pattern" whose
value is an array of objects of one of the following two forms.

 * For string constants:
   `{ type : 'string', text : 'the string literal here' }`
 * For metavariables:
   `{ type : 'metavariable', text : 'the variable name here'}`

For instance, if you want to match Hofstadter's pattern `xUUUy`, use this
array of metavariables and strings.

```javascript
[ { type : 'metavariable', text : 'x' },
  { type : 'string', text : 'UUU' },
  { type : 'metavariable', text : 'y' } ]
```

`TemplateRule`s can be one-way (if-then), which is the default, or two-way
(if and only if), by setting their "iff" attribute to true.

When a rule has multiple conclusions, if the step matches any of them, it is
considered valid.
