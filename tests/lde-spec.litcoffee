
# Tests of the main module

Here we import the module we're about to test.

    LDE = require '../src/lde.litcoffee'
    Structure = LDE.Structure

## LDE members

The LDE module is a wrapper that collects the functionality built
throughout this repository into a single API endpoint, and exposes it.
Here we just test to be sure that it exposes all the things it's supposed
to.

    describe 'LDE global object members', ->

Verfiy that all the API endpoints that should be exported by the module are
indeed exported.

        it 'should be defined', ->
            expect( LDE.Structure ).toBeTruthy()
            expect( LDE.getDocument ).toBeTruthy()
            expect( LDE.insert ).toBeTruthy()
            expect( LDE.delete ).toBeTruthy()
            expect( LDE.replace ).toBeTruthy()
            expect( LDE.setAttribute ).toBeTruthy()

## Document Editing API

The LDE provides a global document object that we can edit with the four
functions in the API (`insert`, `delete`, `replace`, and `setAttribute`).
We use those functions here to create and modify the document in several
ways, each time comparing the results to JSON structures of what they
should be.

    describe 'LDE Document editing API', ->

All of the tests below are going to modify the LDE Document.  We want to
ensure that after each such tests, we clear out all the changes it made, so
that tests that follow it start from a pristine state (an LDE Document with
a root only, no children).

        afterEach ->
            while LDE.getDocument().children().length > 0
                LDE.delete LDE.getDocument().children()[0].ID

The LDE should begin life with an empty LDE Document, that is, a root with
no attributes and no children, and an instance of the base Structure class.

        it 'should begin with an empty document', ->
            serialized = LDE.getDocument().toJSON()
            expect( serialized.className ).toBe 'Structure'
            expect( serialized.children ).toEqual [ ]
            expect( serialized.externalAttributes ).toEqual { }
            expect( serialized.computedAttributes ).toEqual { }

In order for us to work with the LDE Document, we will need the root to have
an ID that we can pass to various editing functions.  Let's verify that it
has one.

        it 'should give the document root an ID', ->
            expect( LDE.getDocument().ID ).not.toBeUndefined()

The first piece of the LDE API we test is that for inserting new children of
the root, or various descendants of that root.

        it 'should permit inserting serialized structures', ->

Define some structures that we will want to insert.

            A = new Structure().attr text : 'some text'
            B = new Structure().attr reference : yes
            C = new Structure().attr name : 'C'

Insert one and verify that it has been added and has been given an ID.

            expect( A.ID ).toBeUndefined()
            rootID = LDE.getDocument().ID
            expect( -> LDE.insert A.toJSON(), rootID, 0 ).not.toThrow()
            expect( LDE.getDocument().children().length ).toBe 1
            insertedA = LDE.getDocument().children()[0]
            expect( insertedA ).not.toBeUndefined()
            expect( insertedA.className ).toBe 'Structure'
            expect( insertedA.text() ).toBe 'some text'
            expect( insertedA.ID ).not.toBeUndefined()
            expect( insertedA.parent() ).toBe LDE.getDocument()

Insert another as its sibling and do the same verifications.

            expect( B.ID ).toBeUndefined()
            expect( -> LDE.insert B.toJSON(), rootID, 1 ).not.toThrow()
            expect( LDE.getDocument().children().length ).toBe 2
            insertedB = LDE.getDocument().children()[1]
            expect( insertedB ).not.toBeUndefined()
            expect( insertedB.className ).toBe 'Structure'
            expect( insertedB.isAReference() ).toBeTruthy()
            expect( insertedB.ID ).not.toBeUndefined()
            expect( insertedB.parent() ).toBe LDE.getDocument()
            expect( insertedA.nextSibling() ).toBe insertedB
            expect( insertedB.previousSibling() ).toBe insertedA

Insert a grandchild and do similar verifications, but one level lower.

            expect( C.ID ).toBeUndefined()
            expect( -> LDE.insert C.toJSON(), insertedA.ID, 0 )
                .not.toThrow()
            expect( LDE.getDocument().children().length ).toBe 2
            expect( insertedA.children().length ).toBe 1
            insertedC = insertedA.children()[0]
            expect( insertedC ).not.toBeUndefined()
            expect( insertedC.className ).toBe 'Structure'
            expect( insertedC.getExternalAttribute 'name' ).toBe 'C'
            expect( insertedC.ID ).not.toBeUndefined()
            expect( insertedC.parent() ).toBe insertedA

Now we just verify that our process of clearing out the children of the LDE
Document after each test is working correctly.  This is just a repeat of the
test we did earlier to verify that the document starts out in a pristine
state.

        it 'should erase all LDE Document content after each test', ->
            serialized = LDE.getDocument().toJSON()
            expect( serialized.className ).toBe 'Structure'
            expect( serialized.children ).toEqual [ ]
            expect( serialized.externalAttributes ).toEqual { }
            expect( serialized.computedAttributes ).toEqual { }

Next we test the `delete` member of the API.  We re-populate the document
and then slowly delete pieces.

        it 'should permit deleting structures', ->

We can re-use the same structures (and insertion pattern) from an earlier
test.

            A = new Structure().attr text : 'some text'
            B = new Structure().attr reference : yes
            C = new Structure().attr name : 'C'
            rootID = LDE.getDocument().ID
            expect( -> LDE.insert A.toJSON(), rootID, 0 ).not.toThrow()
            insertedA = LDE.getDocument().children()[0]
            expect( -> LDE.insert B.toJSON(), rootID, 1 ).not.toThrow()
            insertedB = LDE.getDocument().children()[1]
            expect( -> LDE.insert C.toJSON(), insertedA.ID, 0 )
                .not.toThrow()
            insertedC = insertedA.children()[0]

First, let's delete them from the leaves up, to be sure we can do multiple
deletions, one after another.  After each call to the `delete` function, we
verify that the children and parent pointers are as expected, and the
various attributes as well.

First delete C.

            expect( -> LDE.delete insertedC.ID ).not.toThrow()
            doc = LDE.getDocument()
            expect( doc.children().length ).toBe 2
            expect( doc.children()[0].parent() ).toBe doc
            expect( doc.children()[0].children().length ).toBe 0
            expect( doc.children()[0].text() ).toBe 'some text'
            expect( doc.children()[1].parent() ).toBe doc
            expect( doc.children()[1].children().length ).toBe 0
            expect( doc.children()[1].isAReference() ).toBeTruthy()

Was its ID also released?

            expect( insertedC.ID ).toBeUndefined()

Next delete A.

            expect( -> LDE.delete insertedA.ID ).not.toThrow()
            expect( doc.children().length ).toBe 1
            expect( doc.children()[0].parent() ).toBe doc
            expect( doc.children()[0].children().length ).toBe 0
            expect( doc.children()[0].isAReference() ).toBeTruthy()
            expect( insertedA.ID ).toBeUndefined()

Finally, delete B.

            expect( -> LDE.delete insertedB.ID ).not.toThrow()
            expect( doc.children().length ).toBe 0
            expect( insertedB.ID ).toBeUndefined()

Next, let's re-add the same structures, but then delete them in a different
order, this time including a deletion of a nonatomic subtree.

            A = new Structure().attr text : 'some text'
            B = new Structure().attr reference : yes
            C = new Structure().attr name : 'C'
            rootID = LDE.getDocument().ID
            expect( -> LDE.insert A.toJSON(), rootID, 0 ).not.toThrow()
            insertedA = LDE.getDocument().children()[0]
            expect( -> LDE.insert B.toJSON(), rootID, 1 ).not.toThrow()
            insertedB = LDE.getDocument().children()[1]
            expect( -> LDE.insert C.toJSON(), insertedA.ID, 0 )
                .not.toThrow()
            insertedC = insertedA.children()[0]

First delete B.

            expect( -> LDE.delete insertedB.ID ).not.toThrow()
            doc = LDE.getDocument()
            expect( doc.children().length ).toBe 1
            insertedA = doc.children()[0]
            expect( insertedA.parent() ).toBe doc
            expect( insertedA.children().length ).toBe 1
            expect( insertedA.text() ).toBe 'some text'
            insertedC = insertedA.children()[0]
            expect( insertedC.parent() ).toBe insertedA
            expect( insertedC.children().length ).toBe 0
            expect( insertedC.getExternalAttribute 'name' ).toBe 'C'
            expect( insertedB.ID ).toBeUndefined()

Then delete A, which also deletes C.

            expect( -> LDE.delete insertedA.ID ).not.toThrow()
            expect( doc.children().length ).toBe 0
            expect( insertedA.ID ).toBeUndefined()
            expect( insertedC.ID ).toBeUndefined()

Next we test the `replace` member of the API.  We re-populate the document
and then replace some substructures with new ones.

        it 'should permit replacing structures', ->

We begin with the same structures (and insertion pattern) from an earlier
test.

            A = new Structure().attr text : 'some text'
            B = new Structure().attr reference : yes
            C = new Structure().attr name : 'C'
            rootID = LDE.getDocument().ID
            expect( -> LDE.insert A.toJSON(), rootID, 0 ).not.toThrow()
            insertedA = LDE.getDocument().children()[0]
            expect( -> LDE.insert B.toJSON(), rootID, 1 ).not.toThrow()
            insertedB = LDE.getDocument().children()[1]
            expect( -> LDE.insert C.toJSON(), insertedA.ID, 0 )
                .not.toThrow()
            insertedC = insertedA.children()[0]

Verify that it has the expected structure before we begin manipulating it.

            expect( insertedA.className ).toBe 'Structure'
            expect( insertedA.text() ).toBe 'some text'
            expect( insertedA.ID ).not.toBeUndefined()
            expect( insertedA.parent() ).toBe LDE.getDocument()
            expect( insertedB.className ).toBe 'Structure'
            expect( insertedB.isAReference() ).toBeTruthy()
            expect( insertedB.ID ).not.toBeUndefined()
            expect( insertedB.parent() ).toBe LDE.getDocument()
            expect( insertedA.nextSibling() ).toBe insertedB
            expect( insertedB.previousSibling() ).toBe insertedA
            expect( insertedC.className ).toBe 'Structure'
            expect( insertedC.getExternalAttribute 'name' ).toBe 'C'
            expect( insertedC.ID ).not.toBeUndefined()
            expect( insertedC.parent() ).toBe insertedA

Then we create some structures to use to replace those.

            D = new Structure().attr name : 'D'
            E = new Structure().attr name : 'E'

Replace a grandchild of the root, then verify that all structures are
positioned as expected with respect to one another.  This is the same test
as above, except that C has been replaced by D.

            expect( -> LDE.replace insertedC.ID, D.toJSON() ).not.toThrow()
            expect( insertedA.className ).toBe 'Structure'
            expect( insertedA.text() ).toBe 'some text'
            expect( insertedA.ID ).not.toBeUndefined()
            expect( insertedA.parent() ).toBe LDE.getDocument()
            expect( insertedB.className ).toBe 'Structure'
            expect( insertedB.isAReference() ).toBeTruthy()
            expect( insertedB.ID ).not.toBeUndefined()
            expect( insertedB.parent() ).toBe LDE.getDocument()
            expect( insertedA.nextSibling() ).toBe insertedB
            expect( insertedB.previousSibling() ).toBe insertedA
            shouldBeD = insertedA.children()[0]
            expect( shouldBeD ).not.toBe insertedC
            expect( shouldBeD.className ).toBe 'Structure'
            expect( shouldBeD.getExternalAttribute 'name' ).toBe 'D'
            expect( shouldBeD.ID ).not.toBeUndefined()
            expect( shouldBeD.parent() ).toBe insertedA

Verify that C is no longer in the hierarchy, and that its ID has been
released.

            expect( insertedC.parent() ).toBeNull()
            expect( insertedC.ID ).toBeUndefined()

Now replace a nonatomic subtree with an atomic subtree, then do the same
type of tests to verify the structure.

            expect( -> LDE.replace insertedA.ID, E.toJSON() ).not.toThrow()
            shouldBeE = LDE.getDocument().children()[0]
            expect( shouldBeE ).not.toBe insertedA
            expect( shouldBeE.className ).toBe 'Structure'
            expect( shouldBeE.getExternalAttribute 'name' ).toBe 'E'
            expect( shouldBeE.ID ).not.toBeUndefined()
            expect( shouldBeE.parent() ).toBe LDE.getDocument()
            expect( insertedB.className ).toBe 'Structure'
            expect( insertedB.isAReference() ).toBeTruthy()
            expect( insertedB.ID ).not.toBeUndefined()
            expect( insertedB.parent() ).toBe LDE.getDocument()
            expect( shouldBeE.nextSibling() ).toBe insertedB
            expect( insertedB.previousSibling() ).toBe shouldBeE
            expect( insertedA.parent() ).toBeNull()
            expect( shouldBeD.parent() ).toBe insertedA
            expect( insertedA.ID ).toBeUndefined()
            expect( shouldBeD.ID ).toBeUndefined()

Finally we test the `setAttribute` member of the API.  We re-populate the
document and then replace some substructures with new ones.

        it 'should permit altering attributes', ->

We begin with the same structures (and insertion pattern) from an earlier
test.

            A = new Structure().attr text : 'some text'
            B = new Structure().attr reference : yes
            C = new Structure().attr name : 'C'
            rootID = LDE.getDocument().ID
            expect( -> LDE.insert A.toJSON(), rootID, 0 ).not.toThrow()
            insertedA = LDE.getDocument().children()[0]
            expect( -> LDE.insert B.toJSON(), rootID, 1 ).not.toThrow()
            insertedB = LDE.getDocument().children()[1]
            expect( -> LDE.insert C.toJSON(), insertedA.ID, 0 )
                .not.toThrow()
            insertedC = insertedA.children()[0]

We do not at this point test whether the structure looks the way we expect,
because we are re-using code from the previous test, which already checked
to be sure that it creates the structure as expected.

Let us add an attribute to each of the nodes, including the root, and verify
that they were successfully added.

            expect( -> LDE.setAttribute rootID,
                'test key 1', 'test value 1' ).not.toThrow()
            expect( -> LDE.setAttribute insertedA.ID,
                'test key 2', 'test value 2' ).not.toThrow()
            expect( -> LDE.setAttribute insertedB.ID,
                'test key 3', 'test value 3' ).not.toThrow()
            expect( -> LDE.setAttribute insertedC.ID,
                'test key 4', 'test value 4' ).not.toThrow()
            expect( LDE.getDocument().getExternalAttribute 'test key 1' )
                .toBe 'test value 1'
            expect( insertedA.getExternalAttribute 'test key 2' )
                .toBe 'test value 2'
            expect( insertedB.getExternalAttribute 'test key 3' )
                .toBe 'test value 3'
            expect( insertedC.getExternalAttribute 'test key 4' )
                .toBe 'test value 4'

Then we call `setAttribute` with no value, and ensure that this removes
attributes.

            expect( -> LDE.setAttribute rootID, 'test key 1' ).not.toThrow()
            expect( LDE.getDocument().getExternalAttribute 'test key 1' )
                .toBeUndefined()
