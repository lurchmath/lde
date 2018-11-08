
# Tests of the `InputModifier` class

Here we import the module we're about to test.  `InputModifier`s are
defined in the same module as `InputStructure`s.

    { InputStructure, InputExpression, InputModifier } = \
        require '../src/input-structure'

This file does not test every component of that module.  It tests the
`InputModifier` class, and other classes defined in the same module are
tested in other files (for example, see
[the tests for `InputStructure`s](input-structure-spec.md) and
[the tests for `InputExpression`s](input-expression-spec.md)).

## Global objects

Verify that the relevant globals exposed by the `InputStructure` module are
visible.

    describe 'InputStructure module globals', ->
        it 'expose the InputModifier class', ->
            expect( InputModifier ).toBeTruthy()

## Constructing instances

    describe 'InputModifier class', ->

Just do a simple verification that the constructor behaves as expected; it
can make instances of this class.

        it 'should have a functioning constructor', ->
            myIM = null
            expect( -> myIM = new InputModifier() ).not.toThrow()
            expect( myIM instanceof InputModifier ).toBeTruthy()
            expect( myIM.className ).toBe 'InputModifier'

But we can't construct them with children, nor add children later.

        it 'should not permit constructing one with children', ->
            myIM = new InputModifier(
                child = new InputStructure().attr id : 2
            ).attr id : 1
            expect( myIM instanceof InputModifier ).toBeTruthy()
            expect( myIM instanceof InputStructure ).toBeTruthy()
            expect( child instanceof InputModifier ).toBeFalsy()
            expect( child instanceof InputStructure ).toBeTruthy()
            expect( myIM.children() ).toEqual [ ]
            expect( child.parentNode ).toBeNull()

        it 'should not permit adding children after construction', ->
            myIM = new InputModifier().attr id : 1
            child = new InputStructure().attr id : 2
            expect( myIM instanceof InputModifier ).toBeTruthy()
            expect( myIM instanceof InputStructure ).toBeTruthy()
            expect( child instanceof InputModifier ).toBeFalsy()
            expect( child instanceof InputStructure ).toBeTruthy()
            expect( myIM.children() ).toEqual [ ]
            expect( child.parentNode ).toBeNull()
            myIM.insertChild child, 0
            expect( myIM.children() ).toEqual [ ]
            expect( child.parentNode ).toBeNull()

And we should be able to create hierarchies that mix plain `InputStructure`
instances with `InputExpression` and `InputModifier` instances, each inside
the other, except nothing inside `InputModifier`s, as just tested.

        it 'should be able to exist in trees with InputStructures', ->
            A = new InputStructure(
                B = new InputExpression(
                    C = new InputModifier().attr id : 'C'
                    D = new InputStructure().attr id : 'D'
                ).attr id : 'B'
                E = new InputModifier().attr id : 'E'
            ).attr id : 'A'
            expect( A.className ).toBe 'InputStructure'
            expect( B.className ).toBe 'InputExpression'
            expect( C.className ).toBe 'InputModifier'
            expect( D.className ).toBe 'InputStructure'
            expect( E.className ).toBe 'InputModifier'
            expect( A.parentNode ).toBeNull()
            expect( B.parentNode ).toBe A
            expect( C.parentNode ).toBe B
            expect( D.parentNode ).toBe B
            expect( E.parentNode ).toBe A

Ensure that the essential stub functions for the class are defined, but do
not appear to do anything.

        it 'should provide an empty implementation of updateConnections', ->
            myIM = new InputModifier()
            expect( myIM.updateConnections ).toBeTruthy()
            expect( -> myIM.updateConnections() ).not.toThrow()
            expect( myIM.updateConnections() ).toBeUndefined()

        it 'should provide an empty implementation of updateDataIn()', ->
            myIM = new InputModifier()
            target = new InputExpression()
            expect( myIM.updateDataIn ).toBeTruthy()
            expect( -> myIM.updateDataIn() ).not.toThrow()
            expect( myIM.updateDataIn() ).toBeUndefined()
            expect( -> myIM.updateDataIn target ).not.toThrow()
            expect( myIM.updateDataIn target ).toBeUndefined()
