
# Tests of the `InputStructure` class

Here we import the module we're about to test.  We also need to import the
`OutputStructure` module, in order to test the default interpretation
function.

    { InputStructure } = require '../src/input-structure'
    { OutputStructure } = require '../src/output-structure'

This file does not test every component of that module.  It tests the
`InputStructure` class, and other classes defined in the same module are
tested in other files (for example, see
[the tests for `InputExpression`s](input-expression-spec.md) and
[the tests for `InputModifier`s](input-modifier-spec.md)).

## Global objects

Verify that the relevant globals exposed by the `InputStructure` module are
visible.

    describe 'InputStructure module globals', ->
        it 'expose the InputStructure class', ->
            expect( InputStructure ).toBeTruthy()

## Constructing instances

    describe 'InputStructure class', ->

Just do a simple verification that the constructor behaves as expected; it
can make instances of this class.

        it 'should have a functioning constructor', ->
            myIS = null
            expect( -> myIS = new InputStructure() ).not.toThrow()
            expect( myIS instanceof InputStructure ).toBeTruthy()
            expect( myIS.className ).toBe 'InputStructure'

## Propagating dirty status

If an `InputStructure` instance is marked dirty, this status is supposed to
propagate upward to its parent, and so on recursively.  We test that here.

        it 'should propagate dirty status to ancestors', ->
            A = new InputStructure(
                B = new InputStructure().attr name : 'B'
                C = new InputStructure(
                    D = new InputStructure().attr name : 'D'
                ).attr name : 'C'
            ).attr name : 'A'

Ensure that all are clean to start.

            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

Mark just the root dirty, and verify that it is dirty, but nothing else is.

            A.markDirty()
            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

Clean the root and verify that it worked.

            A.markDirty no
            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

Mark the lowest node dirty, and verify that it and all its ancestors are
dirty, but its uncle (B) is not.

            D.markDirty()
            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeTruthy()
            expect( D.isDirty() ).toBeTruthy()

Clean the lowest node, and verify that cleanness did not propagate upward.

            D.markDirty no
            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeTruthy()
            expect( D.isDirty() ).toBeFalsy()

Repeat the previous test one step higher in the tree.

            C.markDirty no
            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

And clean the root once more.

            A.markDirty no
            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

## Interpretation

The default `interpret()` function makes `InputStructure`s function like
plain vanilla wrapper nodes.  We verify here that it works, given various
inputs.  Recall that its three required parameters are `accessibles`,
`childResults`, and `scope`, documented in [the source
code](../src/input-structure.litcoffee#interpretation).

    describe 'The default interpret() implementation', ->

Verify that it produces an empty `OutputStructure` wrapper if passed empty
arrays as all of its arguments.

        it 'produces one empty result when given empty arguments', ->
            IS = new InputStructure()
            result = IS.interpret [ ], [ ], [ ]
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            expect( result[0] instanceof OutputStructure ).toBeTruthy()
            expect( result[0].children() ).toEqual [ ]
            expect( result[0].className ).toBe 'OutputStructure'
            expect( result[0].parentNode ).toBeNull()

Verify that it ignores both the `accessibles` array and the `scope` array.
We pass nonsense into those arrays (that is, they do not contain any
`Structure` instances, but random other data) and note that it doesn't
matter; the same result is produced because it does not depend in any way on
those parameters.

        it 'ignores the accessibles and scope parameters', ->
            IS = new InputStructure()
            result = IS.interpret [ 1, '2', /3/ ], [ ], [ { }, '!!!' ]
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            expect( result[0] instanceof OutputStructure ).toBeTruthy()
            expect( result[0].children() ).toEqual [ ]
            expect( result[0].className ).toBe 'OutputStructure'
            expect( result[0].parentNode ).toBeNull()

Verify that all child results provided in the second parameter are used in
the output as children of the single node produced.  Note that such child
results are provided in arrays (because each child produces zero or more
`OutputStructure` instances from its own interpretation) and must be lifted
out of them.

        it 'flattens child results into a wrapper node in the output', ->
            IS = new InputStructure()
            OS1 = new OutputStructure().attr id : 1
            OS2 = new OutputStructure().attr id : 2, direction : 'west'
            OS3 = new OutputStructure(
                OS4 = new OutputStructure().attr id : 4, title : 'Mrs.'
            ).attr id : 3
            result = IS.interpret [ ], [ [ OS1, OS2 ], [ OS3 ] ], [ ]
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            expect( result[0] instanceof OutputStructure ).toBeTruthy()
            expect( result[0].children() ).toEqual [ OS1, OS2, OS3 ]
            expect( result[0].className ).toBe 'OutputStructure'
            expect( result[0].parentNode ).toBeNull()
            expect( OS1.parentNode ).toBe result[0]
            expect( OS2.parentNode ).toBe result[0]
            expect( OS3.parentNode ).toBe result[0]
            expect( OS4.parentNode ).toBe OS3

We now turn to tests of recursive interpretation, the framework that places
calls to `interpret()` in individual nodes.

    describe 'The recursiveInterpret() framework', ->

First, we verify that it calls all the correct `interpret()` routines in the
correct order, passing them the correct parameters.  We do so by creating
`interpret()` routines that just record in the object the parameters they
were passed, and the order of their invocation, so we can test it after the
fact.

        it 'should make calls with the right sequence and arguments', ->

This subclass records the sequence of calls and the arguments passed to
them.  We will then make a hierarchy of such instances in order to run our
test.

            sequenceOfCalls = [ ]
            class ISRecorder extends InputStructure
                interpret : ( accessibles, childResults, scope ) ->
                    sequenceOfCalls.push @
                    @recorded =
                        accessibles : accessibles[...]
                        childResults : childResults[...]
                        scope : scope[...]
                    @interpretation = super accessibles, childResults, scope

Now build the hierarchy.

            tree = new ISRecorder(
                child1 = new ISRecorder(
                    grandchild1 = new ISRecorder(
                        greatgrandchild1 = new ISRecorder(
                        ).attr id : 'greatgrandchild1'
                        greatgrandchild2 = new ISRecorder(
                        ).attr id : 'greatgrandchild2'
                    ).attr id : 'grandchild1'
                ).attr id : 'child1'
                child2 = new ISRecorder(
                    grandchild2 = new ISRecorder(
                    ).attr id : 'grandchild2'
                    grandchild3 = new ISRecorder(
                    ).attr id : 'grandchild3'
                ).attr id : 'child2'
            ).attr id : 'tree'

Ensure the data we expect to find later is completely empty before the test
begins.

            expect( sequenceOfCalls ).toEqual [ ]
            expect( tree.recorded ).toBeUndefined()
            expect( child1.recorded ).toBeUndefined()
            expect( child2.recorded ).toBeUndefined()
            expect( grandchild1.recorded ).toBeUndefined()
            expect( grandchild2.recorded ).toBeUndefined()
            expect( grandchild3.recorded ).toBeUndefined()
            expect( greatgrandchild1.recorded ).toBeUndefined()
            expect( greatgrandchild2.recorded ).toBeUndefined()

Now run the recursive interpretation routine and verify that we get from it
just one big tree.

            result = tree.recursiveInterpret()
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            resultTree = result[0]

Were the calls made in the correct order?  Note that this is *not* the same
as the order the nodes are read in the nested code that constructs the tree.
The leaves are interpreted first, and then on up to the root last.

            expect( sequenceOfCalls ).toEqual [
                greatgrandchild1
                greatgrandchild2
                grandchild1
                child1
                grandchild2
                grandchild3
                child2
                tree
            ]

Was each call passed the correct accessibles array?

            expect( tree.recorded.accessibles ).toEqual [ ]
            expect( child1.recorded.accessibles ).toEqual [ ]
            expect( grandchild1.recorded.accessibles ).toEqual [ ]
            expect( greatgrandchild1.recorded.accessibles ).toEqual [ ]
            expect( greatgrandchild2.recorded.accessibles )
                .toEqual greatgrandchild1.interpretation
            expect( greatgrandchild2.recorded.accessibles )
                .toEqual greatgrandchild1.interpretation
            expect( child2.recorded.accessibles )
                .toEqual child1.interpretation
            expect( grandchild2.recorded.accessibles )
                .toEqual child1.interpretation
            expect( grandchild3.recorded.accessibles ).toEqual [
                child1.interpretation...
                grandchild2.interpretation...
            ]

Was each call passed the correct scope array?

            expect( tree.recorded.scope ).toEqual [ ]
            expect( child1.recorded.scope ).toEqual [ child2 ]
            expect( grandchild1.recorded.scope ).toEqual [ ]
            expect( greatgrandchild1.recorded.scope )
                .toEqual [ greatgrandchild2 ]
            expect( greatgrandchild2.recorded.scope ).toEqual [ ]
            expect( child2.recorded.scope ).toEqual [ ]
            expect( grandchild2.recorded.scope )
                .toEqual [ grandchild3 ]
            expect( grandchild3.recorded.scope ).toEqual [ ]

Finally, was each call passed the correct `childResults` array?

            expect( tree.recorded.childResults ).toEqual [
                [ resultTree.children()[0] ]
                [ resultTree.children()[1] ]
            ]
            expect( child1.recorded.childResults ).toEqual [
                [ resultTree.children()[0].children()[0] ]
            ]
            expect( grandchild1.recorded.childResults ).toEqual [
                [ resultTree.children()[0].children()[0].children()[0] ]
                [ resultTree.children()[0].children()[0].children()[1] ]
            ]
            expect( greatgrandchild1.recorded.childResults ).toEqual [ ]
            expect( child2.recorded.childResults ).toEqual [
                [ resultTree.children()[1].children()[0] ]
                [ resultTree.children()[1].children()[1] ]
            ]
            expect( grandchild2.recorded.childResults ).toEqual [ ]
            expect( grandchild3.recorded.childResults ).toEqual [ ]

Now we repeat the previous test, but with a simpler hierarchy, but some of
the nodes are more complex because they return more than one
`OutputStructure` as their interpretation.

        it 'should do just as well with multiple interpretation nodes', ->

Set things up just like in the last test, but with a custom interpretation
routine that adds one or more bonus `OutputStructure` nodes, just for
testing.

            sequenceOfCalls = [ ]
            class ISMultiplier extends InputStructure
                interpret : ( accessibles, childResults, scope ) ->
                    sequenceOfCalls.push @
                    @recorded =
                        accessibles : accessibles[...]
                        childResults : childResults[...]
                        scope : scope[...]
                    @interpretation = super accessibles, childResults, scope
                    numToAdd = ( @getAttribute 'howManyToAdd' ) ? 0
                    for counter in [0...numToAdd]
                        @interpretation.push \
                            new OutputStructure().attr idx : counter
                    @interpretation

Now build the hierarchy.

            tree = new ISMultiplier(
                child1 = new ISMultiplier(
                    grandchild1 = new ISMultiplier(
                    ).attr id : 'grandchild1', howManyToAdd : 2
                ).attr id : 'child1', howManyToAdd : 1
                child2 = new ISMultiplier(
                ).attr id : 'child2'
            ).attr id : 'tree'

Ensure the data we expect to find later is completely empty before the test
begins.

            expect( sequenceOfCalls ).toEqual [ ]
            expect( tree.recorded ).toBeUndefined()
            expect( child1.recorded ).toBeUndefined()
            expect( child2.recorded ).toBeUndefined()
            expect( grandchild1.recorded ).toBeUndefined()

Now run the recursive interpretation routine and verify that we get from it
just one big tree.

            result = tree.recursiveInterpret()
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            resultTree = result[0]

Were the calls made in the correct order?  Note that this is *not* the same
as the order the nodes are read in the nested code that constructs the tree.
The leaves are interpreted first, and then on up to the root last.

            expect( sequenceOfCalls ).toEqual [
                grandchild1
                child1
                child2
                tree
            ]

Was each call passed the correct accessibles array?

            expect( tree.recorded.accessibles ).toEqual [ ]
            expect( child1.recorded.accessibles ).toEqual [ ]
            expect( grandchild1.recorded.accessibles ).toEqual [ ]
            expect( child2.recorded.accessibles )
                .toEqual child1.interpretation

Was each call passed the correct scope array?

            expect( tree.recorded.scope ).toEqual [ ]
            expect( child1.recorded.scope ).toEqual [ child2 ]
            expect( grandchild1.recorded.scope ).toEqual [ ]
            expect( child2.recorded.scope ).toEqual [ ]

Finally, was each call passed the correct `childResults` array?

            expect( tree.recorded.childResults ).toEqual [
                [
                    resultTree.children()[0]
                    resultTree.children()[1]
                ]
                [
                    resultTree.children()[2]
                ]
            ]
            expect( child1.recorded.childResults )
                .toEqual [ resultTree.children()[0].children() ]
            expect( grandchild1.recorded.childResults ).toEqual [ ]
            expect( child2.recorded.childResults ).toEqual [ ]
