
# Tests of the `OutputStructure` class

Here we import the module we're about to test.

    { OutputStructure, OutputExpression, OM, OMNode } = \
        require '../src/output-structure'

## Global objects

Verify that the globals exposed by the `OutputStructure` module are visible.

    describe 'OutputStructure module globals', ->
        it 'should be defined', ->
            expect( OutputStructure ).toBeTruthy()
            expect( OutputExpression ).toBeTruthy()
            expect( OM ).toBeTruthy()
            expect( OMNode ).toBeTruthy()

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

## The `OutputExpression` class

    describe 'OutputExpression class', ->

Just do a simple verification that the constructor behaves as expected; it
can make instances of this class.

        it 'should have a functioning constructor', ->
            myOE = null
            expect( -> myOE = new OutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'

Now verify that you can make one of each OpenMath type, and that you can
later extract from them their children and other properties.

        it 'should correctly construct and store each OpenMath type', ->

Small integers:

            myOE = null
            expect( -> myOE = new OutputExpression 'int', 5 ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'int'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 5
            expect( myOE.children() ).toEqual [ ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()

Big integers:

            huge = '48376209345743985469437253490854309'
            expect( -> myOE = new OutputExpression 'int', huge )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'int'
            expect( myOE.getAttribute 'OM atomic value' ).toBe huge
            expect( myOE.children() ).toEqual [ ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()

Floats:

            expect( -> myOE = new OutputExpression 'flo', 3.14159 )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'flo'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 3.14159
            expect( myOE.children() ).toEqual [ ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()

Strings:

            expect( -> myOE = new OutputExpression 'str', 'Hello, world!' )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'str'
            expect( myOE.getAttribute 'OM atomic value' )
                .toBe 'Hello, world!'
            expect( myOE.children() ).toEqual [ ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()

Byte arrays:

            expect( -> myOE = new OutputExpression 'byt',
                new Uint8Array [ 3, 1, 4, 1, 5, 9 ] ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'byt'
            expect( myOE.getAttribute 'OM atomic value' )
                .toEqual new Uint8Array [ 3, 1, 4, 1, 5, 9 ]
            expect( myOE.children() ).toEqual [ ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()

Variables:

            expect( -> myOE = new OutputExpression 'var', 'x' )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'var'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 'x'
            expect( myOE.children() ).toEqual [ ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()

Symbols:

            expect( -> myOE = new OutputExpression 'sym',
                'plus', 'arith1' ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'sym'
            expect( myOE.getAttribute 'OM atomic value' )
                .toEqual [ 'plus', 'arith1' ]
            expect( myOE.children() ).toEqual [ ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()

Applications:

            expect( ->
                myOE = new OutputExpression(
                    'app',
                    new OutputExpression( 'var', 'P' ),
                    new OutputExpression( 'var', 'x' )
                )
            ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'app'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children().length ).toBe 2
            expect( myOE.children()[0].getAttribute 'OM type' ).toBe 'var'
            expect( myOE.children()[0].getAttribute 'OM atomic value' )
                .toBe 'P'
            expect(
                myOE.children()[0].getAttribute 'OM bound indices'
            ).toBeUndefined()
            expect( myOE.children()[0].children() ).toEqual [ ]
            expect( myOE.children()[1].getAttribute 'OM type' ).toBe 'var'
            expect( myOE.children()[1].getAttribute 'OM atomic value' )
                .toBe 'x'
            expect(
                myOE.children()[1].getAttribute 'OM bound indices'
            ).toBeUndefined()
            expect( myOE.children()[1].children() ).toEqual [ ]

Bindings:

            expect( ->
                myOE = new OutputExpression(
                    'bin',
                    [ 1 ],
                    new OutputExpression( 'sym', 'forall', 'logic' ),
                    new OutputExpression( 'var', 'x' ),
                    new OutputExpression(
                        'app',
                        new OutputExpression( 'var', 'P' ),
                        new OutputExpression( 'var', 'x' )
                    )
                )
            ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'bin'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toEqual [ 1 ]
            expect( myOE.children().length ).toBe 3
            expect( myOE.children()[0].getAttribute 'OM type' ).toBe 'sym'
            expect( myOE.children()[0].getAttribute 'OM atomic value' )
                .toEqual [ 'forall', 'logic' ]
            expect( myOE.children()[1].getAttribute 'OM type' ).toBe 'var'
            expect( myOE.children()[1].getAttribute 'OM atomic value' )
                .toBe 'x'
            expect( myOE.children()[2].getAttribute 'OM type' ).toBe 'app'
            expect( myOE.children()[2].children().length ).toBe 2
            expect(
                myOE.children()[2].children()[0].getAttribute 'OM type'
            ).toBe 'var'
            expect(
                myOE.children()[2].children()[0]
                    .getAttribute 'OM atomic value'
            ).toBe 'P'
            expect(
                myOE.children()[2].children()[1].getAttribute 'OM type'
            ).toBe 'var'
            expect(
                myOE.children()[2].children()[1]
                    .getAttribute 'OM atomic value'
            ).toBe 'x'

Error objects created intentionally:

            expect( ->
                myOE = new OutputExpression(
                    'err',
                    new OutputExpression( 'sym', 'Example', 'Lurch' )
                )
            ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'err'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children().length ).toBe 1
            expect( myOE.children()[0].getAttribute 'OM type' ).toBe 'sym'
            expect( myOE.children()[0].getAttribute 'OM atomic value' )
                .toEqual [ 'Example', 'Lurch' ]
            expect( myOE.children()[0].getAttribute 'OM bound indices' )
                .toBeUndefined()
            expect( myOE.children()[0].children() ).toEqual [ ]

Error objects created by passing invalid types to the constructor:

            expect( ->
                myOE = new OutputExpression 'one', 'two'
            ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.className ).toBe 'OutputExpression'
            expect( myOE.getAttribute 'OM type' ).toBe 'err'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

For each type we can create, verify that we can convert it to an OpenMath
object correctly.

        it 'should correctly convert instances to OpenMath objects', ->

Small integers:

            myOE = null
            converted = null
            expect( -> myOE = new OutputExpression 'int', 5 ).not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'i'
            expect( converted.value ).toBe 5
            expect( converted.equals OM.simple '5' ).toBeTruthy()

Big integers:

            huge = '48376209345743985469437253490854309'
            expect( -> myOE = new OutputExpression 'int', huge )
                .not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'i'
            expect( converted.value ).toBe huge
            expect( converted.equals OM.simple huge ).toBeTruthy()

Floats:

            expect( -> myOE = new OutputExpression 'flo', 3.14159 )
                .not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'f'
            expect( converted.value ).toBe 3.14159
            expect( converted.equals OM.simple '3.14159' ).toBeTruthy()

Strings:

            expect( -> myOE = new OutputExpression 'str', 'Hello, world!' )
                .not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'st'
            expect( converted.value ).toBe 'Hello, world!'
            expect( converted.equals OM.simple '"Hello, world!"' )
                .toBeTruthy()

Byte arrays:

            expect( -> myOE = new OutputExpression 'byt',
                new Uint8Array [ 3, 1, 4, 1, 5, 9 ] ).not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'ba'
            expect( converted.value )
                .toEqual new Uint8Array [ 3, 1, 4, 1, 5, 9 ]

Variables:

            expect( -> myOE = new OutputExpression 'var', 'x' )
                .not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'v'
            expect( converted.name ).toBe 'x'
            expect( converted.equals OM.simple 'x' ).toBeTruthy()

Symbols:

            expect( -> myOE = new OutputExpression 'sym',
                'plus', 'arith1' ).not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'sy'
            expect( converted.name ).toBe 'plus'
            expect( converted.cd ).toBe 'arith1'
            expect( converted.equals OM.simple 'arith1.plus' ).toBeTruthy()

Applications:

            expect( ->
                myOE = new OutputExpression(
                    'app',
                    new OutputExpression( 'var', 'P' ),
                    new OutputExpression( 'var', 'x' )
                )
            ).not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'a'
            expect( converted.equals OM.simple 'P(x)' ).toBeTruthy()

Bindings:

            expect( ->
                myOE = new OutputExpression(
                    'bin',
                    [ 1 ],
                    new OutputExpression( 'sym', 'forall', 'logic' ),
                    new OutputExpression( 'var', 'x' ),
                    new OutputExpression(
                        'app',
                        new OutputExpression( 'var', 'P' ),
                        new OutputExpression( 'var', 'x' )
                    )
                )
            ).not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'bi'
            expect( converted.equals OM.simple 'logic.forall[x,P(x)]' )
                .toBeTruthy()

Error objects:

            expect( ->
                myOE = new OutputExpression(
                    'err',
                    new OutputExpression( 'sym', 'Message', 'Lurch' )
                )
            ).not.toThrow()
            expect( -> converted = myOE.toOpenMath() ).not.toThrow()
            expect( converted instanceof OM ).toBeTruthy()
            expect( converted.type ).toBe 'e'
            expect( converted.children.length ).toBe 0
            expect( converted.symbol.equals OM.simple 'Lurch.Message' )
                .toBeTruthy()

For each type of OpenMath object we can create, verify that we can convert
it to an `OutputExpression` correctly.

        it 'should correctly convert from instances of OpenMath objects', ->

Small integers:

            myOE = null
            myOM = null
            expect( -> myOM = OM.simple '5' ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'int'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 5
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Big integers:

            huge = '48376209345743985469437253490854309'
            expect( -> myOM = OM.simple huge ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'int'
            expect( myOE.getAttribute 'OM atomic value' ).toBe huge
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Floats:

            expect( -> myOM = OM.simple '1.5' ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'flo'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 1.5
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Strings:

            expect( -> myOM = OM.simple '"whoa"' ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'str'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 'whoa'
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Byte arrays:

            expect( ->
                myOM = OM.bytearray new Uint8Array [ 3, 1, 4, 1, 5, 9 ]
            ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'byt'
            expect( myOE.getAttribute 'OM atomic value' )
                .toEqual new Uint8Array [ 3, 1, 4, 1, 5, 9 ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Variables:

            expect( -> myOM = OM.simple 'x' ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'var'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 'x'
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Symbols:

            expect( -> myOM = OM.simple 'foo.bar' ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'sym'
            expect( myOE.getAttribute 'OM atomic value' )
                .toEqual [ 'bar', 'foo', undefined ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Applications:

            expect( -> myOM = OM.simple 'f(x,y,"str",2)' ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'app'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children().length ).toBe 5
            expect( myOE.children()[0].toOpenMath().equals OM.simple 'f' )
                .toBeTruthy()
            expect( myOE.children()[1].toOpenMath().equals OM.simple 'x' )
                .toBeTruthy()
            expect( myOE.children()[2].toOpenMath().equals OM.simple 'y' )
                .toBeTruthy()
            expect( myOE.children()[3].toOpenMath()
                .equals OM.simple '"str"' ).toBeTruthy()
            expect( myOE.children()[4].toOpenMath().equals OM.simple '2' )
                .toBeTruthy()

Bindings:

            expect( -> myOM = OM.simple 'a.b[x,y(x)]' ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'bin'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toEqual [ 1 ]
            expect( myOE.children().length ).toBe 3
            expect( myOE.children()[0].toOpenMath().equals OM.simple 'a.b' )
                .toBeTruthy()
            expect( myOE.children()[1].toOpenMath().equals OM.simple 'x' )
                .toBeTruthy()
            expect( myOE.children()[2].toOpenMath()
                .equals OM.simple 'y(x)' ).toBeTruthy()

Error objects:

            expect( ->
                myOM = new OM.error OM.simple( 'x.y' ), OM.str 'msg'
            ).not.toThrow()
            expect( -> myOE = OutputExpression.fromOpenMath myOM )
                .not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'err'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children().length ).toBe 2
            expect( myOE.children()[0].toOpenMath().equals OM.simple 'x.y' )
                .toBeTruthy()
            expect( myOE.children()[1].toOpenMath()
                .equals OM.simple '"msg"' ).toBeTruthy()

Repeat the previous test, but this time calling `toOutputExpression` in the
OpenMath object, verifying that it does the same thing.

        it 'should correctly convert OM instances to OutputExpressions', ->

Small integers:

            myOE = null
            myOM = null
            expect( -> myOM = OM.simple '5' ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'int'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 5
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Big integers:

            huge = '48376209345743985469437253490854309'
            expect( -> myOM = OM.simple huge ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'int'
            expect( myOE.getAttribute 'OM atomic value' ).toBe huge
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Floats:

            expect( -> myOM = OM.simple '1.5' ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'flo'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 1.5
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Strings:

            expect( -> myOM = OM.simple '"whoa"' ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'str'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 'whoa'
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Byte arrays:

            expect( ->
                myOM = OM.bytearray new Uint8Array [ 3, 1, 4, 1, 5, 9 ]
            ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'byt'
            expect( myOE.getAttribute 'OM atomic value' )
                .toEqual new Uint8Array [ 3, 1, 4, 1, 5, 9 ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Variables:

            expect( -> myOM = OM.simple 'x' ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'var'
            expect( myOE.getAttribute 'OM atomic value' ).toBe 'x'
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Symbols:

            expect( -> myOM = OM.simple 'foo.bar' ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'sym'
            expect( myOE.getAttribute 'OM atomic value' )
                .toEqual [ 'bar', 'foo', undefined ]
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children() ).toEqual [ ]

Applications:

            expect( -> myOM = OM.simple 'f(x,y,"str",2)' ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'app'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children().length ).toBe 5
            expect( myOE.children()[0].toOpenMath().equals OM.simple 'f' )
                .toBeTruthy()
            expect( myOE.children()[1].toOpenMath().equals OM.simple 'x' )
                .toBeTruthy()
            expect( myOE.children()[2].toOpenMath().equals OM.simple 'y' )
                .toBeTruthy()
            expect( myOE.children()[3].toOpenMath()
                .equals OM.simple '"str"' ).toBeTruthy()
            expect( myOE.children()[4].toOpenMath().equals OM.simple '2' )
                .toBeTruthy()

Bindings:

            expect( -> myOM = OM.simple 'a.b[x,y(x)]' ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'bin'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toEqual [ 1 ]
            expect( myOE.children().length ).toBe 3
            expect( myOE.children()[0].toOpenMath().equals OM.simple 'a.b' )
                .toBeTruthy()
            expect( myOE.children()[1].toOpenMath().equals OM.simple 'x' )
                .toBeTruthy()
            expect( myOE.children()[2].toOpenMath()
                .equals OM.simple 'y(x)' ).toBeTruthy()

Error objects:

            expect( ->
                myOM = new OM.error OM.simple( 'x.y' ), OM.str 'msg'
            ).not.toThrow()
            expect( -> myOE = myOM.toOutputExpression() ).not.toThrow()
            expect( myOE instanceof OutputExpression ).toBeTruthy()
            expect( myOE.getAttribute 'OM type' ).toBe 'err'
            expect( myOE.getAttribute 'OM atomic value' ).toBeUndefined()
            expect( myOE.getAttribute 'OM bound indices' ).toBeUndefined()
            expect( myOE.children().length ).toBe 2
            expect( myOE.children()[0].toOpenMath().equals OM.simple 'x.y' )
                .toBeTruthy()
            expect( myOE.children()[1].toOpenMath()
                .equals OM.simple '"msg"' ).toBeTruthy()

## Sending feedback

Each `OutputExpression` is supposed to delegate its feedback to its origin
`InputExpression`.  But it is possible to pause and resume the emission of
feedback, and resuming can be with or without the emission of the queued
(not emitted during the pause) feedback objects.

We ensure in the following tests that all these features work.

    describe 'Feedback from OutputStructures', ->

Do `OutputStructure`s send feedback to their origin `InputStructure`s?
We create fake `InputStructure` instances here that just verify that they
hear the feedback message, but don't do anything with it.

        it 'should delegate the work to the OS\'s origin', ->
            fakeIS = jasmine.createSpyObj 'feedback', [ 'feedback' ]
            myOS = new OutputStructure()
            myOS.origin = fakeIS
            expect( fakeIS.feedback.calls.length ).toBe 0
            feedbackObj = type : 'test', value : 'bleh'
            myOS.feedback feedbackObj
            expect( fakeIS.feedback.calls.length ).toBe 1
            expect( fakeIS.feedback.calls[0].args[0] ).toBe feedbackObj

Can we pause the feedback and then later unpause, seeing all the objects
that were sent while things were paused?  Furthermore, while they're paused,
can we inspect the queue and verify that the right objects are being added
to it?

        it 'can disable feedback but send all when restarting', ->
            fakeIS = jasmine.createSpyObj 'feedback', [ 'feedback' ]
            myOS = new OutputStructure()
            myOS.origin = fakeIS
            expect( fakeIS.feedback.calls.length ).toBe 0
            feedback1 = type : 'test', value : 'bleh'
            feedback2 = type : 'large', value : '42'
            myOS.enableFeedback no
            myOS.feedback feedback1
            myOS.feedback feedback2
            expect( fakeIS.feedback.calls.length ).toBe 0
            expect( myOS.feedbackStore[0] ).toBe feedback1
            expect( myOS.feedbackStore[1] ).toBe feedback2
            myOS.enableFeedback yes, yes
            expect( fakeIS.feedback.calls.length ).toBe 2
            expect( fakeIS.feedback.calls[0].args[0] ).toBe feedback1
            expect( fakeIS.feedback.calls[1].args[0] ).toBe feedback2

Can we pause the feedback and then later unpause, but ask not to see all the
objects that were sent while things were paused?  Furthermore, while they're
paused, can we inspect the queue and verify that the right objects are being
added to it?

        it 'can disable feedback and ignore all when restarting', ->
            fakeIS = jasmine.createSpyObj 'feedback', [ 'feedback' ]
            myOS = new OutputStructure()
            myOS.origin = fakeIS
            expect( fakeIS.feedback.calls.length ).toBe 0
            feedback1 = type : 'test', value : 'bleh'
            feedback2 = type : 'large', value : '42'
            myOS.enableFeedback no
            myOS.feedback feedback1
            myOS.feedback feedback2
            expect( fakeIS.feedback.calls.length ).toBe 0
            expect( myOS.feedbackStore[0] ).toBe feedback1
            expect( myOS.feedbackStore[1] ).toBe feedback2
            myOS.enableFeedback yes, no
            expect( fakeIS.feedback.calls.length ).toBe 0
