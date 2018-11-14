
# Tests of the `InputExpression` class

Here we import the module we're about to test.  `InputExpression`s are
defined in the same module as `InputStructure`s.

    { InputStructure, InputExpression, InputModifier, Dependency } = \
        require '../src/input-structure'
    { OutputStructure } = require '../src/output-structure'

This file does not test every component of that module.  It tests the
`InputExpression` class, and other classes defined in the same module are
tested in other files (for example, see
[the tests for `InputStructure`s](input-structure-spec.md) and
[the tests for `InputModifier`s](input-modifier-spec.md)).

## Global objects

Verify that the relevant globals exposed by the `InputStructure` module are
visible.

    describe 'InputStructure module globals', ->
        it 'expose the InputExpression class', ->
            expect( InputExpression ).toBeTruthy()

## Constructing instances

    describe 'InputExpression class', ->

Just do a simple verification that the constructor behaves as expected; it
can make instances of this class.

        it 'should have a functioning constructor', ->
            myIE = null
            expect( -> myIE = new InputExpression() ).not.toThrow()
            expect( myIE instanceof InputExpression ).toBeTruthy()
            expect( myIE.className ).toBe 'InputExpression'

And we should be able to create hierarchies that mix plain `InputStructure`
instances with `InputExpression` instances, each inside the other.

        it 'should be able to exist in trees with InputStructures', ->
            A = new InputStructure(
                B = new InputExpression(
                    C = new InputExpression().attr id : 'C'
                    D = new InputStructure().attr id : 'D'
                ).attr id : 'B'
            ).attr id : 'A'
            expect( A.className ).toBe 'InputStructure'
            expect( B.className ).toBe 'InputExpression'
            expect( C.className ).toBe 'InputExpression'
            expect( D.className ).toBe 'InputStructure'
            expect( A.parentNode ).toBeNull()
            expect( B.parentNode ).toBe A
            expect( C.parentNode ).toBe B
            expect( D.parentNode ).toBe B

## Getting data from modifiers

Expressions may be modified by `InputModifier` instances and their
`updateData()` function is supposed to take all actions required by such
modifiers.  We construct some test examples of this phenomenon here and
verify that the embedding functions as documented, and as described below.

    describe 'Emedding data in InputExpressions', ->

The function should be defined, and by default, should do nothing.

        it 'should do nothing on a plain vanilla InputExpression', ->
            myIE = new InputExpression()
            originalState = myIE.toJSON()
            expect( -> myIE.updateData() ).not.toThrow()
            expect( myIE.toJSON() ).toEqual originalState

If we define a single modifier to write a single attribute into its target,
then `updateData()` should bring that about.

        it 'should import a single attribute from a modifier', ->
            myIE = new InputExpression().attr id : 'IE'
            myIM = new InputModifier().attr id : 'IM'
            myIM.updateDataIn = ( target ) -> target.setAttribute 1, 2
            myIE.trackIDs()
            myIM.trackIDs()

The expression and modifier should not have the new attribute yet.

            expect( myIE.getAttribute 1 ).toBeUndefined()
            expect( myIM.getAttribute 1 ).toBeUndefined()

Even if we connect them, still, the attribute has not been transferred.

            myIM.connectTo myIE, id : 'conn'
            expect( myIE.getAttribute 1 ).toBeUndefined()
            expect( myIM.getAttribute 1 ).toBeUndefined()

But now if we run `updateData()` in the expression, then it should embed the
data.  Still, the modifier should *not* have the attribute.

            myIE.updateData()
            expect( myIE.getAttribute 1 ).toBe 2
            expect( myIM.getAttribute 1 ).toBeUndefined()
            myIE.untrackIDs()
            myIM.untrackIDs()

Repeat the previous test, but this time connect an expression to an
expression, and verify that this does not actually tranfer the attribute,
becauase `updateData()` only queries connected modifiers, not expressions.

        it 'should not import any attributes from an expression', ->
            myIE1 = new InputExpression().attr id : 'IE'
            myIE2 = new InputExpression().attr id : 'fakeIM'
            myIE1.trackIDs()
            myIE2.trackIDs()
            myIE2.updateDataIn = ( target ) -> target.setAttribute 1, 2
            expect( myIE1.getAttribute 1 ).toBeUndefined()
            expect( myIE2.getAttribute 1 ).toBeUndefined()
            myIE2.connectTo myIE1, id : 'conn'
            expect( myIE1.getAttribute 1 ).toBeUndefined()
            expect( myIE2.getAttribute 1 ).toBeUndefined()
            myIE1.updateData()
            expect( myIE1.getAttribute 1 ).toBeUndefined()
            expect( myIE2.getAttribute 1 ).toBeUndefined()
            myIE1.untrackIDs()
            myIE2.untrackIDs()

Repeat the first test, but this time connect two modifiers.  Place them all
into a single tree together, and verify that they can add multiple
attributes, and that later ones overwrite earlier ones.

        it 'should import multiple attributes from modifiers', ->
            root = new InputStructure(
                target = new InputExpression().attr id : 'target'
                modifier1 = new InputModifier().attr id : 'm1'
                modifier2 = new InputModifier().attr id : 'm2'
            )
            root.trackIDs()
            modifier1.updateDataIn = ( target ) ->
                target.setAttribute 'attr1', 'm1 wrote this'
                target.setAttribute 'attr2', 'm1 wrote this'
            modifier2.updateDataIn = ( target ) ->
                target.setAttribute 'attr2', 'm2 wrote this'
                target.setAttribute 'attr3', 'm2 wrote this'
            expect( target.getAttribute 'attr1' ).toBeUndefined()
            expect( target.getAttribute 'attr2' ).toBeUndefined()
            expect( target.getAttribute 'attr3' ).toBeUndefined()
            modifier1.connectTo target, id : 'conn1'
            modifier2.connectTo target, id : 'conn2'
            expect( target.getAttribute 'attr1' ).toBeUndefined()
            expect( target.getAttribute 'attr2' ).toBeUndefined()
            expect( target.getAttribute 'attr3' ).toBeUndefined()
            target.updateData()
            expect( target.getAttribute 'attr1' ).toBe 'm1 wrote this'
            expect( target.getAttribute 'attr2' ).toBe 'm2 wrote this'
            expect( target.getAttribute 'attr3' ).toBe 'm2 wrote this'
            root.untrackIDs()

Repeat the previous test, changing *only* the order in which the modifiers
exist in the tree, *not* the order of any other calls in the test.  Then
verify that the results are different, because now `modifier2` gets to
update the data in the target before `modifier1`.

        it 'should import multiple attributes from modifiers, reversed', ->
            root = new InputStructure(
                target = new InputExpression().attr id : 'target'
                modifier2 = new InputModifier().attr id : 'm2'
                modifier1 = new InputModifier().attr id : 'm1'
            )
            root.trackIDs()
            modifier1.updateDataIn = ( target ) ->
                target.setAttribute 'attr1', 'm1 wrote this'
                target.setAttribute 'attr2', 'm1 wrote this'
            modifier2.updateDataIn = ( target ) ->
                target.setAttribute 'attr2', 'm2 wrote this'
                target.setAttribute 'attr3', 'm2 wrote this'
            expect( target.getAttribute 'attr1' ).toBeUndefined()
            expect( target.getAttribute 'attr2' ).toBeUndefined()
            expect( target.getAttribute 'attr3' ).toBeUndefined()
            modifier1.connectTo target, id : 'conn1'
            modifier2.connectTo target, id : 'conn2'
            expect( target.getAttribute 'attr1' ).toBeUndefined()
            expect( target.getAttribute 'attr2' ).toBeUndefined()
            expect( target.getAttribute 'attr3' ).toBeUndefined()
            target.updateData()
            expect( target.getAttribute 'attr1' ).toBe 'm1 wrote this'
            expect( target.getAttribute 'attr2' ).toBe 'm1 wrote this'
            expect( target.getAttribute 'attr3' ).toBe 'm2 wrote this'
            root.untrackIDs()

## Tracking which data came from modifiers

The `InputExpression` class provides two functions for marking attributes
with the metadata of whether they were set by `InputModifier`s.  They are
then used by several supporting functions.  We test all of these below.

    describe 'Convenience functions for use by InputModifiers', ->

The foundation is made up of two very simple functions, for which we write
brief tests due to the functions' simplicity.

        it 'should provide a simple, working getter and setter', ->
            guineaPig = new InputExpression()
            expect( guineaPig.getCameFromModifier 'key' ).toBeFalsy()
            expect( -> guineaPig.setCameFromModifier 'key' ).not.toThrow()
            expect( guineaPig.getCameFromModifier 'key' ).toBeTruthy()
            expect( guineaPig.getCameFromModifier 'foo' ).toBeFalsy()
            expect( -> guineaPig.setCameFromModifier 'foo' ).not.toThrow()
            expect( guineaPig.getCameFromModifier 'foo' ).toBeTruthy()
            nonGuineaPig = new InputStructure()
            expect( nonGuineaPig.setCameFromModifier ).toBeUndefined()
            expect( nonGuineaPig.getCameFromModifier ).toBeUndefined()

The function `clearAttributesFromModifiers()` should remove all attributes
that were marked as set by modifiers, and should remove those metadata marks
as well.

        it 'should be able to clear out all attributes set by modifiers', ->
            guineaPig = new InputExpression()
            guineaPig.setAttribute 1, 2
            guineaPig.setAttribute 3, 4
            guineaPig.setCameFromModifier 3
            guineaPig.setAttribute 5, 6
            guineaPig.setAttribute 7, 8
            guineaPig.setCameFromModifier 7
            guineaPig.setAttribute 9, 10
            expect( guineaPig.getAttribute 1 ).toBe 2
            expect( guineaPig.getAttribute 3 ).toBe 4
            expect( guineaPig.getAttribute 5 ).toBe 6
            expect( guineaPig.getAttribute 7 ).toBe 8
            expect( guineaPig.getAttribute 9 ).toBe 10
            expect( guineaPig.getCameFromModifier 1 ).toBeFalsy()
            expect( guineaPig.getCameFromModifier 3 ).toBeTruthy()
            expect( guineaPig.getCameFromModifier 5 ).toBeFalsy()
            expect( guineaPig.getCameFromModifier 7 ).toBeTruthy()
            expect( guineaPig.getCameFromModifier 9 ).toBeFalsy()
            expect( -> guineaPig.clearAttributesFromModifiers() )
                .not.toThrow()
            expect( guineaPig.getAttribute 1 ).toBe 2
            expect( guineaPig.getAttribute 3 ).toBeUndefined()
            expect( guineaPig.getAttribute 5 ).toBe 6
            expect( guineaPig.getAttribute 7 ).toBeUndefined()
            expect( guineaPig.getAttribute 9 ).toBe 10
            expect( guineaPig.getCameFromModifier 1 ).toBeFalsy()
            expect( guineaPig.getCameFromModifier 3 ).toBeFalsy()
            expect( guineaPig.getCameFromModifier 5 ).toBeFalsy()
            expect( guineaPig.getCameFromModifier 7 ).toBeFalsy()
            expect( guineaPig.getCameFromModifier 9 ).toBeFalsy()

We call `clearAttributesFromModifiers()` at the start of `updateData()` so
that if some modifiers incrementally accumulate data in an attribute of
their target, it doesn't accumulate across runs of `updateData()`, but the
target expression starts in a pristine state each time.  In the following
test, we verify that this works as expected.

        it 'should help us make each run of updateData() start clean', ->

First, build a target expression and some modifiers that will accumulate
data in it.  Verify that if we just had them embed their data over and over,
it would indeed accumulate, which is not the goal.

            target = new InputExpression().attr id : 'target'
            mod1 = new InputModifier().attr id : 'mod1'
            mod1.updateDataIn = ( target ) ->
                last = ( target.getAttribute 'list' ) ? [ ]
                target.setAttribute 'list', last.concat [ 1 ]
                target.setCameFromModifier 'list'
            mod2 = new InputModifier().attr id : 'mod2'
            mod2.updateDataIn = ( target ) ->
                last = ( target.getAttribute 'list' ) ? [ ]
                target.setAttribute 'list', last.concat [ 2 ]
                target.setCameFromModifier 'list'
            sequence = new InputStructure target, mod1, mod2
            sequence.trackIDs()
            mod1.connectTo target, id : 'conn1'
            mod2.connectTo target, id : 'conn2'
            expect( target.getAttribute 'list' ).toBeUndefined()
            mod1.updateDataIn target
            expect( target.getAttribute 'list' ).toEqual [ 1 ]
            mod1.updateDataIn target
            expect( target.getAttribute 'list' ).toEqual [ 1, 1 ]
            mod2.updateDataIn target
            expect( target.getAttribute 'list' ).toEqual [ 1, 1, 2 ]
            mod2.updateDataIn target
            expect( target.getAttribute 'list' ).toEqual [ 1, 1, 2, 2 ]
            expect( target.getCameFromModifier 'list' ).toBeTruthy()

Next, clear out all that data and verify that it's gone.

            target.clearAttributesFromModifiers()
            expect( target.getAttribute 'list' ).toBeUndefined()
            expect( target.getCameFromModifier 'list' ).toBeFalsy()

Now run the data embedding the way we're supposed to, with `updateData()` in
the target, which will call `clearAttributesFromModifiers()` before each
run.  This way, we can verify that duplicates do not appear, as they did
above.  This is the intended behavior.  (What is above was just a hack to
verify that the intended behavior doesn't happen unless we use the correct
routine, with build-in checks to guarantee it.)

            target.updateData()
            expect( target.getAttribute 'list' ).toEqual [ 1, 2 ]
            expect( target.getCameFromModifier 'list' ).toBeTruthy()
            target.updateData()
            expect( target.getAttribute 'list' ).toEqual [ 1, 2 ]
            expect( target.getCameFromModifier 'list' ).toBeTruthy()
            target.updateData()
            expect( target.getAttribute 'list' ).toEqual [ 1, 2 ]
            expect( target.getCameFromModifier 'list' ).toBeTruthy()
            sequence.untrackIDs()

The `setSingleValue()` function should write a value iff one is not yet
written.  It should mark that value as having come from a modifier.

        it 'should provide a working setSingleValue() function', ->

First we prepare the context for the test.

            context = new InputStructure(
                IM1 = new InputModifier().attr id : 'IM1'
                IM2 = new InputModifier().attr id : 'IM2'
                IE = new InputExpression().attr id : 'IE'
            )
            context.trackIDs()
            IM1.connectTo IE, id : 'conn1'
            IM1.updateDataIn = ( target ) -> target.setSingleValue 'A', 'B'
            IM2.connectTo IE, id : 'conn2'
            IM2.updateDataIn = ( target ) -> target.setSingleValue 'A', 'C'

Then we verify that no attributes have been written yet.

            expect( IE.getAttribute 'A' ).toBeUndefined()
            expect( IE.getCameFromModifier 'A' ).toBeFalsy()

Then we run the update procedure twice, and each time verify that only one
value is written to the attribute, and it's the value written by `IM1`,
which comes first in the `context` tree.

            expect( -> IE.updateData() ).not.toThrow()
            expect( IE.getAttribute 'A' ).toBe 'B'
            expect( IE.getCameFromModifier 'A' ).toBeTruthy()
            expect( -> IE.updateData() ).not.toThrow()
            expect( IE.getAttribute 'A' ).toBe 'B'
            expect( IE.getCameFromModifier 'A' ).toBeTruthy()
            context.untrackIDs()

The `addListItem()` function should append a value to a list and mark that
list as having come from a modifier.

        it 'should provide a working addListItem() function', ->

First we prepare the context for the test.

            context = new InputStructure(
                IM1 = new InputModifier().attr id : 'IM1'
                IM2 = new InputModifier().attr id : 'IM2'
                IM3 = new InputModifier().attr id : 'IM3'
                IE = new InputExpression().attr id : 'IE'
            )
            context.trackIDs()
            IM1.connectTo IE, id : 'conn1'
            IM1.updateDataIn = ( target ) -> target.addListItem 'A', 'B'
            IM2.connectTo IE, id : 'conn2'
            IM2.updateDataIn = ( target ) -> target.addListItem 'A', 'C'
            IM3.connectTo IE, id : 'conn3'
            IM3.updateDataIn = ( target ) -> target.addListItem 'A', 'B'

Then we verify that no attributes have been written yet.

            expect( IE.getAttribute 'A' ).toBeUndefined()
            expect( IE.getCameFromModifier 'A' ).toBeFalsy()

Then we run the update procedure twice, and each time verify that all three
values have been written to the attribute, forming an array with the value
written by `IM1` coming before the value written by `IM2`, which comes
before the value written by `IM3`, because that's the order those modifiers
appear in the context tree.

            expect( -> IE.updateData() ).not.toThrow()
            expect( IE.getAttribute 'A' ).toEqual [ 'B', 'C', 'B' ]
            expect( IE.getCameFromModifier 'A' ).toBeTruthy()
            expect( -> IE.updateData() ).not.toThrow()
            expect( IE.getAttribute 'A' ).toEqual [ 'B', 'C', 'B' ]
            expect( IE.getCameFromModifier 'A' ).toBeTruthy()
            context.untrackIDs()

The `addListElement()` function should add a value to a set and mark that
set as having come from a modifier.

        it 'should provide a working addSetElement() function', ->

First we prepare the context for the test.

            context = new InputStructure(
                IM1 = new InputModifier().attr id : 'IM1'
                IM2 = new InputModifier().attr id : 'IM2'
                IM3 = new InputModifier().attr id : 'IM3'
                IE = new InputExpression().attr id : 'IE'
            )
            context.trackIDs()
            IM1.connectTo IE, id : 'conn1'
            IM1.updateDataIn = ( target ) -> target.addSetElement 'A', 'B'
            IM2.connectTo IE, id : 'conn2'
            IM2.updateDataIn = ( target ) -> target.addSetElement 'A', 'C'
            IM3.connectTo IE, id : 'conn3'
            IM3.updateDataIn = ( target ) -> target.addSetElement 'A', 'B'

Then we verify that no attributes have been written yet.

            expect( IE.getAttribute 'A' ).toBeUndefined()
            expect( IE.getCameFromModifier 'A' ).toBeFalsy()

Then we run the update procedure twice, and each time verify that two values
have been written to the attribute, because even though three were written,
they are a set, and thus only two matter.

            expect( -> IE.updateData() ).not.toThrow()
            expect( IE.getAttribute 'A' ).toEqual [ 'B', 'C' ]
            expect( IE.getCameFromModifier 'A' ).toBeTruthy()
            expect( -> IE.updateData() ).not.toThrow()
            expect( IE.getAttribute 'A' ).toEqual [ 'B', 'C' ]
            expect( IE.getCameFromModifier 'A' ).toBeTruthy()
            context.untrackIDs()

## Dependency subclass

The `Dependency` subclass of `InputExpression` takes a list of
`OutputStructure` instances as its arguments and can yield them if asked by
calling the appropriate getter or asking the instance to interpret itself.

    describe 'The Dependency subclass of InputExpression', ->

First verify that it is defined.

        it 'should be defined', ->
            expect( Dependency ).not.toBeUndefined()

Next verify that you can construct instances of it, and that doing so keeps
only the `OutputStructure` instances passed to the constructor, discarding
everything else.

        it 'should accept only OutputStructures as arguments', ->

Make some example `OutputStructure`s and some things that aren't.

            OS1 = new OutputStructure().attr id : 1
            OS2 = new OutputStructure().attr id : 2
            OS3 = new OutputStructure(
                new OutputStructure()
                new OutputStructure()
            ).attr id : 3
            nonOS1 = 5
            nonOS2 = 'FIVE'
            nonOS3 = { five : [ 5, 5, 5, 5, 5 ] }
            nonOS4 = /11111/

Use them in various ways in the constructor.

            dep1 = new Dependency OS1, OS2, OS3
            expect( dep1 instanceof Dependency ).toBeTruthy()
            expect( dep1.getContents() ).toEqual [ OS1, OS2, OS3 ]
            dep2 = new Dependency OS1, nonOS1, OS2, nonOS2
            expect( dep2 instanceof Dependency ).toBeTruthy()
            expect( dep2.getContents() ).toEqual [ OS1, OS2 ]
            dep3 = new Dependency nonOS3, OS3, nonOS4
            expect( dep3 instanceof Dependency ).toBeTruthy()
            expect( dep3.getContents() ).toEqual [ OS3 ]
            dep4 = new Dependency nonOS1, nonOS2, nonOS3, nonOS4
            expect( dep4 instanceof Dependency ).toBeTruthy()
            expect( dep4.getContents() ).toEqual [ ]
            dep5 = new Dependency()
            expect( dep5 instanceof Dependency ).toBeTruthy()
            expect( dep5.getContents() ).toEqual [ ]

Ensure that interpreting them yields the exact same results.

            expect( dep1.interpret [ ], [ ], [ ] ).toEqual [ OS1, OS2, OS3 ]
            expect( dep2.interpret [ ], [ ], [ ] ).toEqual [ OS1, OS2 ]
            expect( dep3.interpret [ ], [ ], [ ] ).toEqual [ OS3 ]
            expect( dep4.interpret [ ], [ ], [ ] ).toEqual [ ]
            expect( dep5.interpret [ ], [ ], [ ] ).toEqual [ ]
