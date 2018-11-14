
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 5: Interpretation

## Content

In this phase, we implement the Interpretation Phase of the LDE.

## Goal

The LDE will be able to interpret the Input Tree, creating an Output Tree
from it.

## Status

All essential work on this phase is complete.  What remains are a more
robust set of tests for interpretation and some optional efficiency
improvements, both of which are documented below.

## More robust unit tests for interpretation

 * [ ] Add to the `InputExpression` test file more unit tests that create
   and register dummy subclasses of `InputStructure` that have additional
   custom `interpret` routines (besides those types already tested).  Verify
   that those routines get called and do exactly what's expected in the
   creation of their portion of the Output Tree.  Ensure you test a variety
   of different kinds of `interpret` routines, including ones that copy or
   create attributes, delete children, don't include the default wrapper,
   etc.
 * [ ] Add documentation in that test file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.

## Efficiency improvements

These optional efficiency improvements were not implemented at first because
it is not clear that they are necessary, and it would be a waste of
development time for no clear benefit.  But if later performance bottlenecks
arise that could be solved by any of the ideas expressed below, the plans
are written here for execution.

### Caching interpretation results

 * [ ] Extend the `InputStructure` class with a field called
   `lastInterpretation`, which is initialized to undefined in the
   constructor.  This field does not need to be part of any serialization
   or deserialization of instances.
 * [ ] Create an `getLastInterpretation()` method that returns the value of
   that member variable.
 * [ ] Create a `saveInterpretation(I)` method in the `InputStructure` class
   that stores the array `I` (of zero or more Output Structures) in the
   `lastInterpretation` field.  If no parameter is passed, clear the cached
   value.
 * [ ] At the end of the `recursiveInterpret()` routine, just before
   returning the result, call `saveInterpretation()` on it.
 * [ ] At the start of the `recursiveInterpret()` routine, if the structure
   is not marked dirty and there is a `lastInterpretation` defined, just
   return that immediately.
 * [ ] Update all documentation in that file to reflect the changes just
   made.
 * [ ] Add to the unit tests for `InputStructure`s a few simple tests for
   these new routines.
 * [ ] Add documentation in that file describing the changes just made.
 * [ ] Once the unit tests pass, build everything and commit.

### Miscellaneous

 * [ ] Create a `setChildrenList(newChildren)` function in the `Structure`
   base class.  It should change as little as possible (maybe nothing) to
   make the structure's children array equal to the given one.  This lets
   `interpret()` routines reuse old Output Structures from cache, just
   adjusting their children lists, rather than constructing new ones, even
   if their children list changed.  Many `interpret()` routines may
   therefore be simply `lastInterpretation.setChildrenList(childResults)`
   followed by returning the last interpretation again.  This will often
   just verify that the children list is already correct, change nothing,
   and move on.
 * [ ] Add to the unit tests for this new routine.
 * [ ] Add documentation in the `Structure` module describing the new
   routine.
 * [ ] Once the unit tests pass, build everything and commit.

### Recursive interpretation

 * [ ] Create a subclass of `OutputStructure`, in the `OutputStructure`
   module, called `InterpretationDirective`.
 * [ ] Add documentation explaining what it is and will do (though that
   documentation can grow with time).
 * [ ] Ensure that the `InterpretationDirective` subclass registers itself
   with the serialization code, as
   [the documentation here](https://github.com/lurchmath/lde/blob/master/src/structure.litcoffee#registering-class-names)
   describes.  (That is, use a line like
   `className : Structure.addSubclass 'InterpretationDirective', InterpretationDirective` in
   the `InterpretationDirective` class code.)
 * [ ] Create a new unit test file for `InterpretationDirective`s that is
   extremely basic, just testing to be sure that the symbol
   `InterpretationDirective` is defined at the global scope and creates
   things that are instances of the `InterpretationDirective` class.
 * [ ] Add documentation for that unit test file, following the pattern
   established in the documentation of other unit test files in this
   repository.
 * [ ] Create a subclass `FilterableArray` of `Array` that, at construction
   time, is given a predicate.  It stores, internally, a filtered version of
   itself, which is initialized to the empty array.  It guarantees to keep
   this filtered version correct iff it is manipulated only through calls to
   its `push()` and `pop()` routines, which we override below.
 * [ ] Override `FilterableArray::push()` to do an ordinary `Array::push()`
   and then also a push on the internal filtered version iff the predicate
   holds of the new item.
 * [ ] Override `FilterableArray::pop()` to do an ordinary `Array::pop()`
   and then also a pop on the internal filtered version iff the object
   popped was also on the end of that array.
 * [ ] Add a new method `FilterableArray::filtered()` that returns the
   filtered version.
 * [ ] Update the default version of `recursiveInterpret()` to create the
   `accessibles` array as an instance of `FilterableArray`, with the
   predicate being whether the Structure is an instance of the
   `InterpretationDirective` class.  Ensure that adding items to the array
   and removing them from it are done with calls to `push()` and `pop()`.
 * [ ] Document this so that later implementations of `interpret()` can be
   faster by leveraging `accessibles.filtered()` rather than the entire
   `accessibles` array.
 * [ ] Ensure all the unit tests still pass.
 * [ ] Add new unit tests for the `FilterableArray` class independently of
   the rest of the LDE.
 * [ ] Add some new unit tests that verify that `accessibles.filtered()` is
   exactly what it should be (i.e., the Interpretation Directive predicate
   is being used correctly).
 * [ ] Once the unit tests pass, build everything and commit.
