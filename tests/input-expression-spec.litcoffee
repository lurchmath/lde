
# Tests of the `InputExpression` class

Here we import the module we're about to test.  `InputExpression`s are
defined in the same module as `InputStructure`s.

    { InputStructure, InputExpression } = require '../src/input-structure'

This file does not test every component of that module.  It tests the
`InputExpression` class, and other classes defined in the same module are
tested in other files (for example, see
[the tests for `InputStructure`s](input-structure-spec.md)).

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
