
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 8: Expressions and Rules

## Content

In this phase, we define mathematical expressions and rules of inference.

## Goal

The LDE will be able to validate much of the mathematics we expect to use it
for, without yet permitting customizable mathematical notation.

## Status

This has not been implemented.  See the tasks below.

## Expressions

 * [x] Create a subclass of `OutputStructure`, in the `OutputStructure`
   module, called `OutputExpression`.
 * [x] Add documentation explaining what it is and will do.
 * [x] Ensure that the `OutputExpression` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'OutputExpression', OutputExpression`
   in the `OutputExpression` class code.)
 * [x] Add a constructor that takes three fields: OpenMath type (`OMS`,
   `OMI`, etc.), atomic content (if any), and indices of bound variables (if
   any).
 * [x] Add an instance method `toOpenMath()` that converts instances of
   the class to OpenMath expressions, using
   [the OpenMath package](https://github.com/lurchmath/openmath-js).
 * [x] Add a class method `fromOpenMath()` that converts instances of
   OpenMath expressions into `OutputExpression` trees.
 * [x] Extend the OpenMath class with a `toOutputExpression()` function that
   just defers the task to `fromOpenMath()` in the `OutputExpression` class.
 * [x] Write and document unit tests.

## Common types of interpretation

 * [ ] Extend the default implementation of `interpret()` so that, if the
   instance has a property called `correspondingClass`, then that property
   is used to instantiate an `OutputStructure` instance rather than using
   the base `OutputStructure` class.  This should be sufficient to implement
   corresponding input and output expressions.
 * [ ] Extend the unit tests for interpretation to verify that this can be
   used to create arbitrary-sized trees that are nested combinations of the
   correct subclasses of `OutputStructure`.  This will require creating some
   dummy subclasses for testing purposes.
 * [ ] Create a subclass `ParsableExpression` of `InputExpression` that has
   a property `parse` that maps strings to `OutputStructure` instances.  The
   `interpret()` routine in the `ParsableExpression` class should call the
   parser on the "text" attribute of the `InputExpression`, returning the
   result.
 * [ ] Add documentation for that new subclass.
 * [ ] Ensure that the `ParsableExpression` subclass registers itself with
   the serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'ParsableExpression', ParsableExpression`
   in the `ParsableExpression` class code.)
 * [ ] Define a global function in the LDE that uses the simple notation in
   the OpenMath package (e.g., `f(x,y,2)`) to create OpenMath instances and
   then converts them to `OutputExpression` trees.
 * [ ] Write unit tests that interpretation of `ParseableExpression`
   instances can use this global function as their `parse` method.
 * [ ] Repeat the previous two steps for OpenMath XML as well.
 * [ ] Extend the unit tests for interpretation to verify that parsable
   nodes can exist on their own or within corresponding nodes in the Input
   Tree, and the correct hierarchies will be produced in any case.
 * [ ] Once the unit tests pass, build everything and commit.

## Rules of inference

 * [ ] Create a subclass `OutputRule` of `OutputStructure` that has
   a member `validateStep(step,worker,callback)` that can validate other
   `OutputStructure` instances.  The default implementation just calls the
   callback object with a feedback object expressing that it didn't
   actually validate anything.
 * [ ] Add documentation for that new subclass.
 * [ ] Ensure that the `OutputRule` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'OutputRule', OutputRule` in the
   `OutputRule` class code.)
 * [ ] Define in the LDE a `basicValidate(worker,callback)` function that
   can be installed in `OutputStructure` instances as their `validate`
   field, and that finds the rule of inference cited by the
   `OutputStructure` instance and defers validation to that rule's
   `validateStep()` routine, passing both parameters along.  It is not
   intended that this routine should be the property of any specific
   subclass.  Rather, it is more like an interface (in the Java sense),
   which can be installed (by a single assignment statement) into any
   instance that needs it.
 * [ ] Test that `OutputStructures` can cite rules that will do the
   validation for the structure.  Ensure that validation continues to work
   even when delegated (athough so far all feedback will say no work was
   done).
 * [ ] Create a subclass `TemplateRule` of `OutputRule`.
 * [ ] Ensure that the `TemplateRule` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'TemplateRule', TemplateRule` in the
   `TemplateRule` class code.)
 * [ ] In `TemplateRule`, override `validateStep()` so that it reads the
   appropriate attributes and children of the rule object to determine how
   to do validation.  For now, assume tree-based matching and if-style
   inference.  You will need to use
   [the Matching Package](https://github.com/lurchmath/first-order-matching),
   probably loaded into background workers.  Add this as an `npm`
   dependency, but when you create a single `.js` file that can import the
   entire LDE, you will need to include both the OpenMath package and the
   Matching package in that file.  To do so, create a `gulp` task that
   imports the latest matching package script into a location where the
   workers can load it; see the following two resources.
    1. [gulp task to download a file](https://github.com/gulpjs/plugins/issues/88#issuecomment-42171336)
    1. [checking last modified date of an URL](https://stackoverflow.com/questions/5922842/getting-http-headers-with-node-js)
 * [ ] Add documentation for that new subclass.
 * [ ] Test that `OutputStructures` can cite rules that will do the
   template-based validation, which is a huge step!
 * [ ] Extend `TemplateRule` with the option to be iff rather than just if.
 * [ ] Add unit tests for this new feature.
 * [ ] Extend `TemplateRule` with the option to use string-based matching
   rather than just tree-based matching.  String-based matching will use an
   algorithm like the following.
```
matchPlus = ( match, key, value ) ->
    result = { }
    for own k, v of match then result[k] = v
    result[key] = value
    result
matches = ( patterns, string, soFar = { } ) ->
    if patterns.length is 0
        return if string.length is 0 then [ { } ] else [ ]
    pattern = patterns[0]
    if pattern.type is 'string'
        t = pattern.text
        return if string[...t.length] is t
            matches patterns[1..], string[t.length..]
        else
            [ ]
    if soFar.hasOwnProperty t
        return if string[...soFar[t].length] is t
            matches patterns[1..], sting[soFar[t].length..]
        else
            [ ]
    results = [ ]
    for i in [1..string.length]
        results = results.concat matches patterns[1..], string[i+1..],
            matchPlus soFar, t, string[..i]
    results
```
 * [ ] Add unit tests for this new feature.
 * [ ] Create a subclass `InputRule` of `InputStructure`.
 * [ ] Ensure that the `InputRule` subclass registers itself with the
   serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'InputRule', InputRule` in the
   `InputRule` class code.)
 * [ ] Override `interpret()` in `InputRule` to create generic `OutputRule`
   instances if a generic validation procedure is present, or specifically
   `TemplateRule` instances if that kind of data is present.
 * [ ] Add unit tests to show that the LDE can validate conclusions based on
   rules defined earlier in the same document.

## API Documentation

 * [ ] Extend the `OutputStructure` page of the API Documentation to include
   the `OutputExpression` class.
 * [ ] Extend the processing phases page of the API Documentation to include
   the enhancements to interpretation and validation accomplished in this
   phase.
 * [ ] Rebuild docs and commit.
