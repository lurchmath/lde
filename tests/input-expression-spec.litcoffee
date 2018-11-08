
# Tests of the `InputExpression` class

Here we import the module we're about to test.  `InputExpression`s are
defined in the same module as `InputStructure`s.

    { InputStructure, InputExpression, InputModifier } = \
        require '../src/input-structure'

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

        it 'should import a single attribute from a modifier', ->
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

        it 'should import a single attribute from a modifier', ->
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
