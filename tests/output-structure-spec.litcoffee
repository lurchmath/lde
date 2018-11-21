
# Tests of the `OutputStructure` class

Here we import the module we're about to test.

    { OutputStructure } = require '../src/output-structure'

## Global objects

Verify that the globals exposed by the `OutputStructure` module are visible.

    describe 'OutputStructure module globals', ->
        it 'should be defined', ->
            expect( OutputStructure ).toBeTruthy()

## Structure trees

    describe 'OutputStructure class', ->

Just do a simple verification that the constructor behaves as expected; it
can make instances of this class.

        it 'should have a functioning constructor', ->
            myOS = null
            expect( -> myOS = new OutputStructure() ).not.toThrow()
            expect( myOS instanceof OutputStructure ).toBeTruthy()
            expect( myOS.className ).toBe 'OutputStructure'

## Setting dirty status (not propagating)

If an `OutputStructure` instance is marked dirty, this status is for itself
alone.  Unlike with `InputStructure` instances, it does not propagate that
status upward to its parent.  We test that here.

        it 'should not propagate dirty status to ancestors', ->
            A = new OutputStructure(
                B = new OutputStructure().attr name : 'B'
                C = new OutputStructure(
                    D = new OutputStructure().attr name : 'D'
                ).attr name : 'C'
            ).attr name : 'A'

Ensure that all are dirty to start.

            expect( A.isDirty() ).toBeTruthy()
            expect( B.isDirty() ).toBeTruthy()
            expect( C.isDirty() ).toBeTruthy()
            expect( D.isDirty() ).toBeTruthy()

Then clean them all to prepare for further testing, and verify that it
worked.

            A.markDirty no
            B.markDirty no
            C.markDirty no
            D.markDirty no
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

Mark the lowest node dirty, and verify that only it is dirty, none of its
ancestors are, nor is its uncle, B.

            D.markDirty()
            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeTruthy()

Clean the lowest node, and verify that all are clean.

            D.markDirty no
            expect( A.isDirty() ).toBeFalsy()
            expect( B.isDirty() ).toBeFalsy()
            expect( C.isDirty() ).toBeFalsy()
            expect( D.isDirty() ).toBeFalsy()

## Looking up citations

The `OutputStructure` class provides four functions for looking up
structures by citations, which use both labels and connections: `lookUp`,
`lookUpAll`, `lookUpIn`, and `lookUpAllCitations`.  We test each of these
here.

    describe 'Citation lookup functions of the OutputStructure class', ->

Test the generic `lookUpIn` function that focuses on labels only and that
takes an array of accessibles through which to look.

        it 'should find labeled structures in a given array', ->

Create an array of pretend accessibles through which we will search.

            accessibles = [
                LooseFred = new OutputStructure().attr id : 'LooseFred'
                StrictFred = new OutputStructure().attr id : 'StrictFred'
                Zeke = new OutputStructure().attr id : 'Zeke'
                Mara = new OutputStructure().attr id : 'Mara'
            ]
            LooseFred.hasLabel = ( text ) -> /Fred/i.test text
            StrictFred.hasLabel = ( text ) -> 'Fred' is text
            Mara.hasLabel = ( text ) -> /^\s*Mara\s*$/i.test text

Now look up several different labels in that array.  Each returns a single
result, the latest one in the accessibles array that has the given label.

            check = ( x ) -> OutputStructure.lookUpIn x, accessibles
            expect( check 'Fred' ).toBe StrictFred
            expect( check 'freddy' ).toBe LooseFred
            expect( check '' ).toBeUndefined()
            expect( check 'zeke' ).toBeUndefined()
            expect( check ' Mara ' ).toBe Mara

Test the instance method `lookUp` similarly to the previous.

        it 'should find label structures within a tree context', ->

Create the same accessibles as before, but this time within a tree context,
followed by a structure from which we will do the querying.  Also add in
some inaccessible structures that would respond to queries if they were
accessible, so that we can verify that this error does not occur.

            tree = new OutputStructure(
                LooseFred = new OutputStructure().attr id : 'LooseFred'
                StrictFred = new OutputStructure().attr id : 'StrictFred'
                Zeke = new OutputStructure(
                    Hiding = new OutputStructure().attr id : 'Hiding'
                ).attr id : 'Zeke'
                Mara = new OutputStructure().attr id : 'Mara'
                SearchFromHere = new OutputStructure().attr id : 'SFH'
            ).attr id : 'tree'
            LooseFred.hasLabel = ( text ) -> /Fred/i.test text
            StrictFred.hasLabel = ( text ) -> 'Fred' is text
            Hiding.hasLabel = LooseFred.hasLabel
            Mara.hasLabel = ( text ) -> /^\s*Mara\s*$/i.test text

Run the exact same tests as before, with the exception that now we're also
testing the tree's accessibility traversal routine at the same time.

            check = ( x ) -> SearchFromHere.lookUp x
            expect( check 'Fred' ).toBe StrictFred
            expect( check 'freddy' ).toBe LooseFred
            expect( check '' ).toBeUndefined()
            expect( check 'zeke' ).toBeUndefined()
            expect( check ' Mara ' ).toBe Mara

We then run the exact same tests, but this time using `lookUpAll()`, which
returns arrays.  In one context, this will mean returning more than one
result.

            check = ( x ) -> SearchFromHere.lookUpAll x
            expect( check 'Fred' ).toEqual [ StrictFred, LooseFred ]
            expect( check 'freddy' ).toEqual [ LooseFred ]
            expect( check '' ).toEqual [ ]
            expect( check 'zeke' ).toEqual [ ]
            expect( check ' Mara ' ).toEqual [ Mara ]

To test the `lookUpAllCitations()` function, we need a much more complex
structure, defined below.  We will then call the `lookUpAllCitations()`
function on several different structures in the tree and verify that it
gives the correct results in all cases.

        it 'constructs correct lookup dictionaries', ->

We create a tree in which all of the following situations arise, but not
from the same lookup source.
 * More than one premise citation by label from the same node.
   (This will be the node "c3" in the tree defined below.)
 * More than one reason citation by connection from the same node.
   (This will be the node "c4" in the tree defined below.)
 * A premise citation and a reason citation from the same node to the same
   target, by label.
   (This will also be the node "c3".)
 * No label-based citations at all from some node.
   (This will also be the node "c4".)
 * Connection-based citations to inaccessible structures.
   (This will be from the node "c5" to the node "c1c1".)
 * Label-based citations that, due to accessibility, don't actually cite
   anything.
   (This will be from the node "c2" ostensibly to the node "c1c1".)
 * Label-based and connection-based citations from the same source.
   (This will also be node "c5".)

First, just the tree structure with labels:

            tree = new OutputStructure(
                c1 = new OutputStructure(
                    c1c1 = new OutputStructure().attr id : 'c1c1'
                ).attr id : 'c1'
                c2 = new OutputStructure().attr id : 'c2'
                c3 = new OutputStructure().attr id : 'c3'
                c4 = new OutputStructure().attr id : 'c4'
                c5 = new OutputStructure().attr id : 'c5'
            ).attr id : 'tree'
            tree.trackIDs()
            giveEveryoneLabels = ( node ) ->
                node.hasLabel = ( text ) -> @id().indexOf( text ) > -1
                giveEveryoneLabels child for child in node.children()
            giveEveryoneLabels tree

Verify that the setup routine indeed gave everyone labels correctly.

            expect( tree.hasLabel 'tree' ).toBeTruthy()
            expect( tree.hasLabel 'fern' ).toBeFalsy()
            expect( c2.hasLabel '2' ).toBeTruthy()
            expect( c2.hasLabel '1' ).toBeFalsy()
            expect( c1c1.hasLabel '1c1' ).toBeTruthy()
            expect( c1c1.hasLabel '1c1c' ).toBeFalsy()

Now create premise and reason citations promised in the bulleted list above.

            c3.setAttribute 'premise citations', [ '1', '2' ]
            c3.setAttribute 'reason citations', [ '2' ]
            c4.connectTo c2, id : 'con1', type : 'reason citation'
            c4.connectTo c3, id : 'con2', type : 'reason citation'
            c5.connectTo c1c1, id : 'con3', type : 'premise citation'
            c5.setAttribute 'premise citations', [ '3' ]
            c5.setAttribute 'reason citations', [ '4' ]
            c2.setAttribute 'reason citations', [ 'c1c1' ]

Now call `lookUpAllCitations()` on each node in the tree and verify that
the results are as the documentation for that routine promises.

            expect( tree.lookUpAllCitations() ).toEqual
                premises :
                    connections : [ ]
                    labels : [ ]
                reasons :
                    connections : [ ]
                    labels : [ ]
            expect( c1.lookUpAllCitations() ).toEqual
                premises :
                    connections : [ ]
                    labels : [ ]
                reasons :
                    connections : [ ]
                    labels : [ ]
            expect( c1c1.lookUpAllCitations() ).toEqual
                premises :
                    connections : [ ]
                    labels : [ ]
                reasons :
                    connections : [ ]
                    labels : [ ]
            expect( c2.lookUpAllCitations() ).toEqual
                premises :
                    connections : [ ]
                    labels : [ ]
                reasons :
                    connections : [ ]
                    labels : [ ]
            expect( c3.lookUpAllCitations() ).toEqual
                premises :
                    connections : [ ]
                    labels : [ # these show up in the order cited
                        cited : 'c1'
                        label : '1'
                    ,
                        cited : 'c2'
                        label : '2'
                    ]
                reasons :
                    connections : [ ]
                    labels : [
                        cited : 'c2'
                        label : '2'
                    ]
            expect( c4.lookUpAllCitations() ).toEqual
                premises :
                    connections : [ ]
                    labels : [ ]
                reasons :
                    connections : [
                        cited : 'c2'
                        id : 'con1'
                    ,
                        cited : 'c3'
                        id : 'con2'
                    ]
                    labels : [ ]
            expect( c5.lookUpAllCitations() ).toEqual
                premises :
                    connections : [
                        cited : 'c1c1'
                        id : 'con3'
                    ]
                    labels : [
                        cited : 'c3'
                        label : '3'
                    ]
                reasons :
                    connections : [ ]
                    labels : [
                        cited : 'c4'
                        label : '4'
                    ]

Clean up.

            tree.untrackIDs()
