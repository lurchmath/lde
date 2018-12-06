
# Tests of the `InputStructure` class

Here we import the module we're about to test.  We also need to import the
`OutputStructure` module, in order to test the default interpretation
function.

    { Structure } = require '../src/structure'
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

Verify that labels are not assigned to the outputs of `interpret()`, because
that is a job for `recursiveInterpret()`, below.

        it 'does not add labels to its outputs', ->
            IS = new InputStructure().attr
                'label regex' : '^modus ponens$'
                'label regex flags' : 'i'
            result = IS.interpret [ ], [ ], [ ]
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            expect( result[0] instanceof OutputStructure ).toBeTruthy()
            expect( result[0].children() ).toEqual [ ]
            expect( result[0].hasOwnProperty 'hasLabel' ).toBeFalsy()
            expect( result[0].hasLabel ).toBe OutputStructure::hasLabel

Verify that citations are not copied to the outputs of `interpret()`,
because that is a job for `recursiveInterpret()`, below.

        it 'does not copy citations to its outputs', ->
            IS1 = new InputStructure().attr
                id : 1
                'premise citations' : [ 'foo', 'bar' ]
                'reason citations' : 'some rule'
            IS2 = new InputStructure().attr id : 2
            IS1.trackIDs()
            IS2.trackIDs()
            IS2.connectTo IS1, id : 'C1', type : 'premise citation'
            IS1.connectTo IS2, id : 'C2', type : 'reason citation'
            result1 = IS1.interpret [ ], [ ], [ ]
            result2 = IS2.interpret [ ], [ ], [ ]
            expect( result1 instanceof Array ).toBeTruthy()
            expect( result2 instanceof Array ).toBeTruthy()
            expect( result1.length ).toBe 1
            expect( result2.length ).toBe 1
            expect( result1[0] instanceof OutputStructure ).toBeTruthy()
            expect( result2[0] instanceof OutputStructure ).toBeTruthy()
            expect( result1[0].getAttribute 'premise citations' )
                .toBeUndefined()
            expect( result1[0].getAttribute 'reason citations' )
                .toBeUndefined()
            expect( result2[0].getAttribute 'premise citations' )
                .toBeUndefined()
            expect( result2[0].getAttribute 'reason citations' )
                .toBeUndefined()
            expect( result1[0].getAllConnections() ).toEqual [ ]
            expect( result2[0].getAllConnections() ).toEqual [ ]
            IS1.untrackIDs()
            IS2.untrackIDs()

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
test.  It also avoids assigning IDs to its outputs, to keep things simple.

            sequenceOfCalls = [ ]
            class ISRecorder extends InputStructure
                interpret : ( accessibles, childResults, scope ) ->
                    sequenceOfCalls.push @
                    @recorded =
                        accessibles : accessibles[...]
                        childResults : childResults[...]
                        scope : scope[...]
                        stack : \
                            InputStructure::instancesBeingInterpreted[...]
                    @interpretation = super accessibles, childResults, scope
                assignCorrespondingIDs : ->

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

Before we inspect all the recorded data, was the interpreted result the
correct OutputStructure?

            correctOT = new OutputStructure(
                OTchild1 = new OutputStructure(
                    OTgrandchild1 = new OutputStructure(
                        OTgreatgrandchild1 = new OutputStructure()
                        OTgreatgrandchild2 = new OutputStructure()
                    )
                )
                OTchild2 = new OutputStructure(
                    OTgrandchild2 = new OutputStructure()
                    OTgrandchild3 = new OutputStructure()
                )
            )
            expect( resultTree.equals correctOT ).toBeTruthy()
            expect( tree.interpretation.length ).toBe 1
            expect( tree.interpretation[0].equals correctOT )
                .toBeTruthy()
            expect( child1.interpretation.length ).toBe 1
            expect( child1.interpretation[0].equals OTchild1 ).toBeTruthy()
            expect( child2.interpretation.length ).toBe 1
            expect( child2.interpretation[0].equals OTchild2 ).toBeTruthy()
            expect( grandchild1.interpretation.length ).toBe 1
            expect( grandchild1.interpretation[0].equals OTgrandchild1 )
                .toBeTruthy()
            expect( grandchild2.interpretation.length ).toBe 1
            expect( grandchild2.interpretation[0].equals OTgrandchild2 )
                .toBeTruthy()
            expect( grandchild3.interpretation.length ).toBe 1
            expect( grandchild3.interpretation[0].equals OTgrandchild3 )
                .toBeTruthy()
            expect( greatgrandchild1.interpretation.length ).toBe 1
            expect( greatgrandchild1.interpretation[0]
                .equals OTgreatgrandchild1 ).toBeTruthy()
            expect( greatgrandchild2.interpretation.length ).toBe 1
            expect( greatgrandchild2.interpretation[0]
                .equals OTgreatgrandchild2 ).toBeTruthy()

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

Was each call passed the correct `childResults` array?

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

Did each call happen with the correct stack of instances being interpreted?

            expect( tree.recorded.stack ).toEqual [ tree ]
            expect( child1.recorded.stack ).toEqual [ child1 ]
            expect( grandchild1.recorded.stack ).toEqual [ grandchild1 ]
            expect( greatgrandchild1.recorded.stack )
                .toEqual [ greatgrandchild1 ]
            expect( greatgrandchild2.recorded.stack )
                .toEqual [ greatgrandchild2 ]
            expect( child2.recorded.stack ).toEqual [ child2 ]
            expect( grandchild2.recorded.stack ).toEqual [ grandchild2 ]
            expect( grandchild3.recorded.stack ).toEqual [ grandchild3 ]

Were `OutputStructure`s marked with the correct origin properties?

            expect( tree.interpretation[0].origin ).toBe tree
            expect( child1.interpretation[0].origin ).toBe child1
            expect( grandchild1.interpretation[0].origin ).toBe grandchild1
            expect( greatgrandchild1.interpretation[0].origin )
                .toBe greatgrandchild1
            expect( greatgrandchild2.interpretation[0].origin )
                .toBe greatgrandchild2
            expect( child2.interpretation[0].origin ).toBe child2
            expect( grandchild2.interpretation[0].origin ).toBe grandchild2
            expect( grandchild3.interpretation[0].origin ).toBe grandchild3
            resultTree.untrackIDs()

Now we repeat the previous test, but with a simpler hierarchy, but some of
the nodes are more complex because they return more than one
`OutputStructure` as their interpretation.

        it 'should do just as well with multiple interpretation nodes', ->

Set things up just like in the last test, but with a custom interpretation
routine that adds one or more bonus `OutputStructure` nodes, just for
testing.  It also avoids assigning IDs to its outputs, to keep things
simple.

            sequenceOfCalls = [ ]
            class ISMultiplier extends InputStructure
                interpret : ( accessibles, childResults, scope ) ->
                    sequenceOfCalls.push @
                    @recorded =
                        accessibles : accessibles[...]
                        childResults : childResults[...]
                        scope : scope[...]
                        stack : \
                            InputStructure::instancesBeingInterpreted[...]
                    @interpretation = super accessibles, childResults, scope
                    numToAdd = ( @getAttribute 'howManyToAdd' ) ? 0
                    for counter in [0...numToAdd]
                        @interpretation.push \
                            new OutputStructure().attr idx : counter
                    @interpretation
                assignCorrespondingIDs : ->

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

Before we inspect all the recorded data, was the interpreted result the
correct OutputStructure?

            correctOT = new OutputStructure(
                OTchild1 = new OutputStructure(
                    OTgrandchild1 = new OutputStructure()
                    OTextra1 = new OutputStructure().attr idx : 0
                    OTextra2 = new OutputStructure().attr idx : 1
                )
                OTextra3 = new OutputStructure().attr idx : 0
                OTchild2 = new OutputStructure()
            )
            expect( resultTree.equals correctOT ).toBeTruthy()
            expect( tree.interpretation.length ).toBe 1
            expect( tree.interpretation[0].equals correctOT ).toBeTruthy()
            expect( child1.interpretation.length ).toBe 2
            expect( child1.interpretation[0].equals OTchild1 ).toBeTruthy()
            expect( child1.interpretation[1].equals OTextra3 ).toBeTruthy()
            expect( child2.interpretation.length ).toBe 1
            expect( child2.interpretation[0].equals OTchild2 ).toBeTruthy()
            expect( grandchild1.interpretation.length ).toBe 3
            expect( grandchild1.interpretation[0].equals OTgrandchild1 )
                .toBeTruthy()
            expect( grandchild1.interpretation[1].equals OTextra1 )
                .toBeTruthy()
            expect( grandchild1.interpretation[2].equals OTextra2 )
                .toBeTruthy()

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

Was each call passed the correct `childResults` array?

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

Did each call happen with the correct stack of instances being interpreted?

            expect( tree.recorded.stack ).toEqual [ tree ]
            expect( child1.recorded.stack ).toEqual [ child1 ]
            expect( grandchild1.recorded.stack ).toEqual [ grandchild1 ]
            expect( child2.recorded.stack ).toEqual [ child2 ]

Were `OutputStructure`s marked with the correct origin properties?

            expect( tree.interpretation[0].origin ).toBe tree
            expect( child1.interpretation[0].origin ).toBe child1
            expect( child1.interpretation[1].origin ).toBe child1
            expect( child2.interpretation[0].origin ).toBe child2
            expect( grandchild1.interpretation[0].origin ).toBe grandchild1
            expect( grandchild1.interpretation[1].origin ).toBe grandchild1
            expect( grandchild1.interpretation[2].origin ).toBe grandchild1
            resultTree.untrackIDs()

Now we do a much simpler hierarchy, just to be sure that origins are also
tracked for connections.  This hierarchy just makes a few nodes and
connections among them.

        it 'should mark origins of connections as well', ->

The custom interpretation routine here produces as many children as you
want, and connects them in pairs (one to two, three to four, etc.).

            sequenceOfCalls = [ ]
            class ISConnector extends InputStructure
                interpret : ( accessibles, childResults, scope ) ->
                    sequenceOfCalls.push @
                    @recorded =
                        accessibles : accessibles[...]
                        childResults : childResults[...]
                        scope : scope[...]
                        stack : \
                            InputStructure::instancesBeingInterpreted[...]
                    @interpretation = new OutputStructure()
                    numChildren = ( @getAttribute 'numChildren' ) ? 0
                    for counter in [0...numChildren]
                        child = new OutputStructure().attr id : counter
                        child.trackIDs()
                        @interpretation.insertChild child, counter
                        if counter % 2
                            last = @interpretation.children()[counter-1]
                            curr = @interpretation.children()[counter]
                            last.connectTo curr, id : "conn#{(counter-1)/2}"
                    [ @interpretation ]

Now build the hierarchy.

            tree = new InputStructure(
                child = new ISConnector().attr id : 'child', numChildren : 5
            ).attr id : 'tree'

Ensure the data we expect to find later is completely empty before the test
begins.

            expect( sequenceOfCalls ).toEqual [ ]
            expect( tree.recorded ).toBeUndefined()
            expect( child.recorded ).toBeUndefined()

Now run the recursive interpretation routine and verify that we get from it
just one big tree.

            result = tree.recursiveInterpret()
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            resultTree = result[0]

Before we inspect all the recorded data, was the interpreted result the
correct OutputStructure?  Here we cannot do as earlier tests have done,
building the expected output tree and comparing, because that would involve
re-using both structure IDs and connection IDs, which are supposed to be
globally unique.  So we do a more manual/painstaking test.

            expect( resultTree instanceof OutputStructure ).toBeTruthy()
            expect( resultTree.children().length ).toBe 1
            expect( resultTree.getAllConnections() ).toEqual [ ]
            OTchild = resultTree.children()[0]
            expect( OTchild instanceof OutputStructure ).toBeTruthy()
            expect( OTchild.children().length ).toBe 5
            expect( OTchild.getAllConnections() ).toEqual [ ]
            OTbaby0 = OTchild.children()[0]
            OTbaby1 = OTchild.children()[1]
            OTbaby2 = OTchild.children()[2]
            OTbaby3 = OTchild.children()[3]
            OTbaby4 = OTchild.children()[4]
            expect( OTbaby0 instanceof OutputStructure ).toBeTruthy()
            expect( OTbaby1 instanceof OutputStructure ).toBeTruthy()
            expect( OTbaby2 instanceof OutputStructure ).toBeTruthy()
            expect( OTbaby3 instanceof OutputStructure ).toBeTruthy()
            expect( OTbaby4 instanceof OutputStructure ).toBeTruthy()
            expect( OTbaby0.id() ).toBe 0
            expect( OTbaby1.id() ).toBe 1
            expect( OTbaby2.id() ).toBe 2
            expect( OTbaby3.id() ).toBe 3
            expect( OTbaby4.id() ).toBe 4
            expect( OTbaby0.getConnectionsOut() ).toEqual [ 'conn0' ]
            expect( OTbaby1.getConnectionsOut() ).toEqual [ ]
            expect( OTbaby2.getConnectionsOut() ).toEqual [ 'conn1' ]
            expect( OTbaby3.getConnectionsOut() ).toEqual [ ]
            expect( OTbaby4.getConnectionsOut() ).toEqual [ ]
            expect( OTbaby0.getConnectionsIn() ).toEqual [ ]
            expect( OTbaby1.getConnectionsIn() ).toEqual [ 'conn0' ]
            expect( OTbaby2.getConnectionsIn() ).toEqual [ ]
            expect( OTbaby3.getConnectionsIn() ).toEqual [ 'conn1' ]
            expect( OTbaby4.getConnectionsIn() ).toEqual [ ]

Were the calls made in the correct order?  Unlike in previous tests, here we
have only one instance of the subclass that records its calls in
`sequenceOfCalls`, so here we will verify that `ISConnector` instances
record their interpretations but plain `InputStructure` instances do not.

            expect( sequenceOfCalls ).toEqual [ child ]

Was each call passed the correct accessibles array?  (Keep in mind that,
again, nothing was recorded for `tree`.)

            expect( tree.recorded ).toBeUndefined()
            expect( child.recorded.accessibles ).toEqual [ ]

Was each call passed the correct scope array?

            expect( child.recorded.scope ).toEqual [ ]

Was each call passed the correct `childResults` array?

            expect( child.recorded.childResults ).toEqual [ ]

Did each call happen with the correct stack of instances being interpreted?

            expect( child.recorded.stack ).toEqual [ child ]

Were `OutputStructure`s marked with the correct origin properties?

            expect( resultTree.origin ).toBe tree
            expect( OTchild.origin ).toBe child
            expect( OTbaby0.origin ).toBe child
            expect( OTbaby1.origin ).toBe child
            expect( OTbaby2.origin ).toBe child
            expect( OTbaby3.origin ).toBe child
            expect( OTbaby4.origin ).toBe child

Were connections in the output tree marked with the correct origin
properties?

            expect( OTbaby0.getConnectionData( 'conn0' )._origin )
                .toBe child.id()
            expect( OTbaby2.getConnectionData( 'conn1' )._origin )
                .toBe child.id()

Do `OutputStructure`s with origins correctly delegate their feedback calls
to those origins?

            child.feedback = jasmine.createSpy 'childFeedback'
            expect( child.feedback ).not.toHaveBeenCalled()
            OTbaby0.feedback example : 'data'
            expect( child.feedback ).toHaveBeenCalled()

            resultTree.untrackIDs()

Verify that labels are assigned to the outputs of `recursiveInterpret()`,
because it should call `addLabels()` as part of its work.

        it 'also adds labels to its outputs', ->
            IS = new InputStructure().attr
                'label regex' : '^modus ponens$'
                'label regex flags' : 'i'
            result = IS.recursiveInterpret()
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            expect( result[0] instanceof OutputStructure ).toBeTruthy()
            expect( result[0].children() ).toEqual [ ]
            expect( result[0].hasOwnProperty 'hasLabel' ).toBeTruthy()
            expect( result[0].hasLabel ).not.toBe OutputStructure::hasLabel
            expect( result[0].hasLabel 'modus ponens' ).toBeTruthy()
            expect( result[0].hasLabel 'Modus Ponens' ).toBeTruthy()
            expect( result[0].hasLabel 'modusponens' ).toBeFalsy()
            expect( result[0].hasLabel ' modus ponens' ).toBeFalsy()
            result[0].untrackIDs()

Verify that citations are copied to the outputs of `recursiveInterpret()`,
because it should call `copyCitations()` as part of its work.

        it 'also copies citations to its outputs', ->
            tree = new InputStructure(
                IS1 = new InputStructure().attr
                    id : 1
                    'premise citations' : [ 'foo', 'bar' ]
                    'reason citations' : 'some rule'
                IS2 = new InputStructure().attr id : 2
            ).attr id : 'tree'
            tree.trackIDs()
            IS2.connectTo IS1, id : 'C1', type : 'premise citation'
            IS1.connectTo IS2, id : 'C2', type : 'reason citation'
            Otree = tree.recursiveInterpret()
            expect( Otree instanceof Array ).toBeTruthy()
            expect( Otree.length ).toBe 1
            expect( Otree[0] instanceof OutputStructure ).toBeTruthy()
            expect( Otree[0].children().length ).toBe 2
            [ child1, child2 ] = Otree[0].children()
            expect( child1.getAttribute 'premise citations' )
                .toEqual [ 'foo', 'bar' ]
            expect( child1.getAttribute 'reason citations' )
                .toEqual [ 'some rule' ]
            expect( child2.getAttribute 'premise citations' )
                .toBeUndefined()
            expect( child2.getAttribute 'reason citations' ).toBeUndefined()
            expect( child1.getConnectionsIn() ).toEqual [ 'C1.0' ]
            expect( child2.getConnectionsOut() ).toEqual [ 'C1.0' ]
            expect( child1.getConnectionSource 'C1.0' ).toBe child2
            expect( child1.getConnectionTarget 'C1.0' ).toBe child1
            expect( child1.getConnectionData 'C1.0' ).toEqual
                id : 'C1.0'
                type : 'premise citation'
                _origin : 2 # the latter node always makes the connection
            expect( child1.getConnectionsOut() ).toEqual [ 'C2.0' ]
            expect( child2.getConnectionsIn() ).toEqual [ 'C2.0' ]
            expect( child1.getConnectionSource 'C2.0' ).toBe child1
            expect( child1.getConnectionTarget 'C2.0' ).toBe child2
            expect( child1.getConnectionData 'C2.0' ).toEqual
                id : 'C2.0'
                type : 'reason citation'
                _origin : 2 # the latter node always makes the connection
            tree.untrackIDs()
            ot.untrackIDs() for ot in Otree

Verify that the `class` attribute is respected.  To do so, we create two
dummy subclasses of `OutputExpression` so that we can nest instances of
various classes.

        it 'respects the class attribute of the IS', ->
            class DummyClass1 extends OutputStructure
                className : Structure.addSubclass 'DummyClass1', DummyClass1
            class DummyClass2 extends OutputStructure
                className : Structure.addSubclass 'DummyClass2', DummyClass2
            IS = new InputStructure(
                new InputStructure().attr class : 'DummyClass2'
                new InputStructure().attr class : 'OutputStructure'
            ).attr class : 'DummyClass1'
            result = IS.recursiveInterpret()
            expect( result instanceof Array ).toBeTruthy()
            expect( result.length ).toBe 1
            expect( result[0] instanceof DummyClass1 ).toBeTruthy()
            expect( result[0] instanceof DummyClass2 ).toBeFalsy()
            expect( result[0] instanceof OutputStructure ).toBeTruthy()
            expect( result[0].children().length ).toBe 2
            expect( result[0].children()[0] instanceof DummyClass1 )
                .toBeFalsy()
            expect( result[0].children()[0] instanceof DummyClass2 )
                .toBeTruthy()
            expect( result[0].children()[0] instanceof OutputStructure )
                .toBeTruthy()
            expect( result[0].children()[1] instanceof OutputStructure )
                .toBeTruthy()
            expect( result[0].children()[1] instanceof DummyClass1 )
                .toBeFalsy()
            expect( result[0].children()[1] instanceof DummyClass1 )
                .toBeFalsy()
