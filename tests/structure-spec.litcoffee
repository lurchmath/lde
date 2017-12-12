
# Tests of the Structure class

Here we import the module we're about to test.

    { Structure } = require '../src/structure'

## Global objects

Verify that the globals exposed by the Structure module are visible.

    describe 'Structure module globals', ->
        it 'should be defined', ->
            expect( Structure ).toBeTruthy()

## Structure trees

    describe 'Structure trees', ->

Structure objects can be formed into hierarchies.

The first set of tests is whether we can form structure hierarchies with
nested calls to constructors, and have them create the parent/child pointers
we expect.

        it 'should be assemblable with constructors', ->

Make a small structure hierarchy, naming each node, and verify that no error
occurs.

            root = new Structure(
                A = new Structure(
                    AA = new Structure
                    AB = new Structure
                )
                B = new Structure
            )

Ensure that all parent pointers were correctly established in the forming of
the hierarchy.

            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBe root

Ensure that all child arrays are equivalent in structure to what's expected
based on the construction code above.

            expect( root.children() ).toEqual [ A, B ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]

Ensure that previous and next sibling functions work as expected.

            expect( root.previousSibling() ).toBeUndefined()
            expect( root.nextSibling() ).toBeUndefined()
            expect( A.previousSibling() ).toBeUndefined()
            expect( A.nextSibling() ).toBe B
            expect( AA.previousSibling() ).toBeUndefined()
            expect( AA.nextSibling() ).toBe AB
            expect( AB.previousSibling() ).toBe AA
            expect( AB.nextSibling() ).toBeUndefined()
            expect( B.previousSibling() ).toBe A
            expect( B.nextSibling() ).toBeUndefined()

The next test verifies that the constructor ignores non-Structures when
building hierarchies.

        it 'should drop invalid content from hierarchies', ->

Make a similar small structure hierarchy to the one in the previous test,
but add a few erroneous items.

            root = new Structure(
                7
                A = new Structure(
                    AA = new Structure
                    AB = new Structure
                    'This is not a Structure'
                )
                /regular expression/
                B = new Structure
            )

Ensure that parent pointers and child arrays are exactly as they were in
the previous test, because the erroneous new stuff has been ignored.

            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBe root
            expect( root.children() ).toEqual [ A, B ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]

The next test ensures that you cannot create a cyclic structure by inserting
an ancestor as a child.

        it 'should prevent cyclic hierarchies', ->

Create a single node and try to make it a child of itself.  This should
fail, leaving the node in its original state.

            A = new Structure
            A.insertChild A
            expect( A.parent() ).toBeNull()
            expect( A.children() ).toEqual [ ]

Create another node B and insert it as a child of A.  Then try to insert A
as a child of B.  This should succeed, but should have removed B from being
a child of A, so that the structure remains acyclic.

            B = new Structure
            A.insertChild B
            expect( A.parent() ).toBeNull()
            expect( A.children() ).toEqual [ B ]
            expect( B.parent() ).toBe A
            expect( B.children() ).toEqual [ ]
            B.insertChild A
            expect( A.parent() ).toBe B
            expect( A.children() ).toEqual [ ]
            expect( B.parent() ).toBeNull()
            expect( B.children() ).toEqual [ A ]

The same test should succeed if we do it with a structure with several nodes
rather than just two.

            A = new Structure(
                B = new Structure
                C = new Structure(
                    D = new Structure
                )
            )
            D.insertChild A
            expect( A.parent() ).toBe D
            expect( B.parent() ).toBe A
            expect( C.parent() ).toBe A
            expect( D.parent() ).toBeNull()
            expect( A.children() ).toEqual [ B, C ]
            expect( B.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( D.children() ).toEqual [ A ]

The next test is whether children correctly compute their index in their
parent structure.

        it 'should correctly compute indices in parent nodes', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure
                    AB = new Structure
                )
                B = new Structure
            )

Check the index in parent of each node.

            expect( root.indexInParent() ).toBeUndefined()
            expect( A.indexInParent() ).toBe 0
            expect( AA.indexInParent() ).toBe 0
            expect( AB.indexInParent() ).toBe 1
            expect( B.indexInParent() ).toBe 1

The next test is whether we can remove structures from an existing hierarchy
and retain the integrity and correct structure of the hierarchy.

        it 'should support removing structures', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure
                    AB = new Structure
                )
                B = new Structure
            )

Remove a child of the root and verify that the structure is as expected.

            B.removeFromParent()
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

Remove a grandchild of the root and verify that the structure is as
expected.

            AA.removeFromParent()
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

Remove something that has already been removed, and verify that nothing
changes or causes an error.

            AA.removeFromParent()
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

The next test is whether we can remove children from an existing hierarchy
and retain the integrity and correct structure of the hierarchy.

        it 'should support removing children', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure
                    AB = new Structure
                )
                B = new Structure
            )

Remove a child of the root and verify that the structure is as expected.

            root.removeChild 1
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

Remove a grandchild of the root and verify that the structure is as
expected.

            A.removeChild 0
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

Remove an invalid index, and verify that nothing changes or causes an error.

            A.removeChild 1
            expect( root.children() ).toEqual [ A ]
            expect( A.children() ).toEqual [ AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( B.parent() ).toBeNull()

The next test is whether we can insert structures into an existing hierarchy
and retain the integrity and correct structure of the hierarchy.

        it 'should support inserting structures', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure
                    AB = new Structure
                )
                B = new Structure
            )

Add a new child of the root and verify that the structure is as expected.

            C = new Structure
            expect( C.parent() ).toBeNull()
            expect( C.children() ).toEqual [ ]
            root.insertChild C, 1
            expect( root.children() ).toEqual [ A, C, B ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe root

Append a child to the end of the list of children of a child of the root and
verify that the structure is as expected.

            D = new Structure
            expect( D.parent() ).toBeNull()
            expect( D.children() ).toEqual [ ]
            A.insertChild D, 2
            expect( root.children() ).toEqual [ A, C, B ]
            expect( A.children() ).toEqual [ AA, AB, D ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( D.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( D.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe root

Insert as the first child of the root a child from elsewhere in the
hierarchy, and verify that it is removed from one place and inserted in the
other.

            root.insertChild AA, 0
            expect( root.children() ).toEqual [ AA, A, C, B ]
            expect( A.children() ).toEqual [ AB, D ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( D.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe root
            expect( AB.parent() ).toBe A
            expect( D.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe root

Do the same test again, but this time just moving something to be a later
sibling within the same parent.

            root.insertChild A, 2
            expect( root.children() ).toEqual [ AA, C, A, B ]
            expect( A.children() ).toEqual [ AB, D ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( D.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe root
            expect( AB.parent() ).toBe A
            expect( D.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe root


Now we test whether we can replace structures in an existing hierarchy with
new structures, and retain the integrity and correct structure of the
hierarchy.

        it 'should support replacing structures', ->

Make the same small structure hierarchy as in the previous test.

            root = new Structure(
                A = new Structure(
                    AA = new Structure
                    AB = new Structure
                )
                B = new Structure
            )

Replace one child of the root with a new structure and verify that all comes
out as expected.

            C = new Structure
            expect( C.parent() ).toBeNull()
            expect( C.children() ).toEqual [ ]
            B.replaceWith C
            expect( root.children() ).toEqual [ A, C ]
            expect( A.children() ).toEqual [ AA, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBe A
            expect( AB.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBeNull()

Replace one grandchild of the root with the former child of the root, and
verify that all comes out as expected.

            AA.replaceWith B
            expect( root.children() ).toEqual [ A, C ]
            expect( A.children() ).toEqual [ B, AB ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBe root
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe A
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe A

Replace A with one of its own children, as a corner case test.

            A.replaceWith AB
            expect( root.children() ).toEqual [ AB, C ]
            expect( A.children() ).toEqual [ B ]
            expect( AA.children() ).toEqual [ ]
            expect( AB.children() ).toEqual [ ]
            expect( C.children() ).toEqual [ ]
            expect( B.children() ).toEqual [ ]
            expect( root.parent() ).toBeNull()
            expect( A.parent() ).toBeNull()
            expect( AA.parent() ).toBeNull()
            expect( AB.parent() ).toBe root
            expect( C.parent() ).toBe root
            expect( B.parent() ).toBe A

============================

The next test is whether we can make a deep copy of a Structure.

        it 'should support deep copying structures', ->

Make a tiny Structure for testing.

            tiny = new Structure
            tiny.setExternalAttribute 5, 6

Make a copy of root and test that it copied correctly and did not mess up
the original.

            C = tiny.copy()
            expect( C ).not.toBe tiny
            expect( C.parent() ).toBeFalsy()
            expect( C.children() ).toEqual [ ]
            expect( C.getExternalAttribute 5 ).toBe 6
            expect( C.getExternalAttribute 6 ).toBeUndefined()
            expect( C.getComputedAttribute 5 ).toBeUndefined()
            expect( tiny.parent() ).toBeFalsy()
            expect( tiny.children() ).toEqual [ ]
            expect( tiny.getExternalAttribute 5 ).toBe 6
            expect( tiny.getExternalAttribute 6 ).toBeUndefined()
            expect( tiny.getComputedAttribute 5 ).toBeUndefined()

Ensure that changing data within the original doesn't change the copy.

            tiny.setExternalAttribute 5, 10
            expect( tiny.getExternalAttribute 5 ).toBe 10
            expect( C.getExternalAttribute 5 ).toBe 6

============================

The next section tests the tree ordering relation defined in the Structure
class, `isEarlierThan()`.

        it 'correctly judges which subtrees are earlier', ->

Define a structre on which we will test the ordering relation.  Then define
a separate structure that's not connected to it, for comparing across the
two structures.

            root = new Structure(
                A = new Structure(
                    AA = new Structure
                    AB = new Structure(
                        ABA = new Structure
                    )
                )
                B = new Structure
            )
            disconnected = new Structure(
                dA = new Structure
            )

Check all possible pairs of subtrees of the root and verify that the order
relation is correct for them.

            expect( root.isEarlierThan root ).toBeFalsy()
            expect( root.isEarlierThan A ).toBeTruthy()
            expect( root.isEarlierThan AA ).toBeTruthy()
            expect( root.isEarlierThan AB ).toBeTruthy()
            expect( root.isEarlierThan ABA ).toBeTruthy()
            expect( root.isEarlierThan B ).toBeTruthy()
            expect( A.isEarlierThan root ).toBeFalsy()
            expect( A.isEarlierThan A ).toBeFalsy()
            expect( A.isEarlierThan AA ).toBeTruthy()
            expect( A.isEarlierThan AB ).toBeTruthy()
            expect( A.isEarlierThan ABA ).toBeTruthy()
            expect( A.isEarlierThan B ).toBeTruthy()
            expect( AA.isEarlierThan root ).toBeFalsy()
            expect( AA.isEarlierThan A ).toBeFalsy()
            expect( AA.isEarlierThan AA ).toBeFalsy()
            expect( AA.isEarlierThan AB ).toBeTruthy()
            expect( AA.isEarlierThan ABA ).toBeTruthy()
            expect( AA.isEarlierThan B ).toBeTruthy()
            expect( AB.isEarlierThan root ).toBeFalsy()
            expect( AB.isEarlierThan A ).toBeFalsy()
            expect( AB.isEarlierThan AA ).toBeFalsy()
            expect( AB.isEarlierThan AB ).toBeFalsy()
            expect( AB.isEarlierThan ABA ).toBeTruthy()
            expect( AB.isEarlierThan B ).toBeTruthy()
            expect( ABA.isEarlierThan root ).toBeFalsy()
            expect( ABA.isEarlierThan A ).toBeFalsy()
            expect( ABA.isEarlierThan AA ).toBeFalsy()
            expect( ABA.isEarlierThan AB ).toBeFalsy()
            expect( ABA.isEarlierThan ABA ).toBeFalsy()
            expect( ABA.isEarlierThan B ).toBeTruthy()
            expect( B.isEarlierThan root ).toBeFalsy()
            expect( B.isEarlierThan A ).toBeFalsy()
            expect( B.isEarlierThan AA ).toBeFalsy()
            expect( B.isEarlierThan AB ).toBeFalsy()
            expect( B.isEarlierThan ABA ).toBeFalsy()
            expect( B.isEarlierThan B ).toBeFalsy()

Repeat the exercise for the disconnected tree.

            expect( disconnected.isEarlierThan disconnected ).toBeFalsy()
            expect( disconnected.isEarlierThan dA ).toBeTruthy()
            expect( dA.isEarlierThan disconnected ).toBeFalsy()
            expect( dA.isEarlierThan dA ).toBeFalsy()

Verify that across trees, the answer is always undefined.

            expect( root.isEarlierThan disconnected ).toBeUndefined()
            expect( A.isEarlierThan disconnected ).toBeUndefined()
            expect( AA.isEarlierThan disconnected ).toBeUndefined()
            expect( AB.isEarlierThan disconnected ).toBeUndefined()
            expect( ABA.isEarlierThan disconnected ).toBeUndefined()
            expect( B.isEarlierThan disconnected ).toBeUndefined()
            expect( root.isEarlierThan dA ).toBeUndefined()
            expect( A.isEarlierThan dA ).toBeUndefined()
            expect( AA.isEarlierThan dA ).toBeUndefined()
            expect( AB.isEarlierThan dA ).toBeUndefined()
            expect( ABA.isEarlierThan dA ).toBeUndefined()
            expect( B.isEarlierThan dA ).toBeUndefined()
            expect( disconnected.isEarlierThan root ).toBeFalsy()
            expect( disconnected.isEarlierThan A ).toBeFalsy()
            expect( disconnected.isEarlierThan AA ).toBeFalsy()
            expect( disconnected.isEarlierThan AB ).toBeFalsy()
            expect( disconnected.isEarlierThan ABA ).toBeFalsy()
            expect( disconnected.isEarlierThan B ).toBeFalsy()
            expect( dA.isEarlierThan root ).toBeFalsy()
            expect( dA.isEarlierThan A ).toBeFalsy()
            expect( dA.isEarlierThan AA ).toBeFalsy()
            expect( dA.isEarlierThan AB ).toBeFalsy()
            expect( dA.isEarlierThan ABA ).toBeFalsy()
            expect( dA.isEarlierThan B ).toBeFalsy()

The following tests serialize and deserialize structures (including some
subclasses) and verify that the results are faithful copies of the
originals.

        it 'should serialize and deserialize hierarchies correctly', ->

Begin with a trivial example, a single node hierarchy with no attributes.

            loner = new Structure
            json = loner.toJSON()
            expect( json instanceof Structure ).toBeFalsy()
            expect( json ).not.toBe loner
            expect( json.className ).toBe 'Structure'
            expect( json.computedAttributes ).toEqual { }
            expect( json.externalAttributes ).toEqual { }
            expect( json.children ).toEqual [ ]

Deserialize a copy from it and verify that it is correctly structured.

            copy = Structure.fromJSON json
            expect( copy instanceof Structure ).toBeTruthy()
            expect( copy.computedAttributes ).toEqual { }
            expect( copy.externalAttributes ).toEqual { }
            expect( copy.computedAttributes ).not.toBe \
                json.computedAttributes
            expect( copy.externalAttributes ).not.toBe \
                json.externalAttributes
            expect( copy.computedAttributes ).not.toBe \
                loner.computedAttributes
            expect( copy.externalAttributes ).not.toBe \
                loner.externalAttributes
            expect( copy.children() ).toEqual [ ]
            expect( copy.parent() ).toBeNull()
            expect( copy ).not.toBe json
            expect( copy ).not.toBe loner

Now do another one-node example, but this one with some attributes of each
type.

            atty = new Structure()
            atty.setExternalAttribute 1, 2
            atty.setExternalAttribute 'three', [ 'four', { } ]
            atty.setComputedAttribute 'five', 666666
            atty.setComputedAttribute '7', { 8 : [ [ ] ] }
            json = atty.toJSON()
            expect( json instanceof Structure ).toBeFalsy()
            expect( json ).not.toBe atty
            expect( json.className ).toBe 'Structure'
            expect( json.computedAttributes ).toEqual
                'five' : 666666
                '7' : { 8 : [ [ ] ] }
            expect( json.externalAttributes ).toEqual
                1 : 2
                'three' : [ 'four', { } ]
            expect( json.children ).toEqual [ ]

Deserialize a copy from it and verify that it is correctly structured.

            copy = Structure.fromJSON json
            expect( copy instanceof Structure ).toBeTruthy()
            expect( copy.computedAttributes ).toEqual
                'five' : 666666
                '7' : { 8 : [ [ ] ] }
            expect( copy.externalAttributes ).toEqual
                1 : 2
                'three' : [ 'four', { } ]
            expect( copy.computedAttributes ).not.toBe \
                json.computedAttributes
            expect( copy.externalAttributes ).not.toBe \
                json.externalAttributes
            expect( copy.computedAttributes ).not.toBe \
                atty.computedAttributes
            expect( copy.externalAttributes ).not.toBe \
                atty.externalAttributes
            expect( copy.children() ).toEqual [ ]
            expect( copy.parent() ).toBeNull()
            expect( copy ).not.toBe json
            expect( copy ).not.toBe atty

Now define two silly little subclasses of `Structure` for use in just the
next test.

            class Sub1 extends Structure
                className : Structure.addSubclass 'Sub1', Sub1
                exampleMethod1 : -> 5
            class Sub2 extends Structure
                className : Structure.addSubclass 'Sub2', Sub2
                exampleMethod2 : -> @getExternalAttribute 'test'

Now create a hierarchy with three `Structure`s in it, one of each of the
three classes `Structure`, `Sub1`, and `Sub2`.  Also give every node in the
hierarchy a unique ID.

            bigger = new Structure(
                child1 = new Sub1().attr 10 : 100
                child2 = new Sub2().attr 'test' : 'ing'
            ).setup()

Verify that the children are of the expected classes.

            expect( child1 instanceof Sub1 ).toBeTruthy()
            expect( child1.exampleMethod1 ).not.toBeUndefined()
            expect( child2 instanceof Sub2 ).toBeTruthy()
            expect( child2.exampleMethod2 ).not.toBeUndefined()

Serialize and verify that it came out correctly.

            json = bigger.toJSON()
            expect( json instanceof Structure ).toBeFalsy()
            expect( json ).not.toBe bigger
            expect( json.className ).toBe 'Structure'
            expect( json.computedAttributes ).toEqual { }
            expect( json.externalAttributes ).toEqual { }
            expect( json.children.length ).toBe 2
            child = json.children[0]
            expect( child instanceof Structure ).toBeFalsy()
            expect( child instanceof Sub1 ).toBeFalsy()
            expect( child.className ).toBe 'Sub1'
            expect( child.computedAttributes ).toEqual { }
            expect( child.externalAttributes ).toEqual { 10 : 100 }
            expect( child.children ).toEqual [ ]
            expect( child.exampleMethod1 ).toBeUndefined()
            child = json.children[1]
            expect( child instanceof Structure ).toBeFalsy()
            expect( child instanceof Sub2 ).toBeFalsy()
            expect( child.className ).toBe 'Sub2'
            expect( child.computedAttributes ).toEqual { }
            expect( child.externalAttributes ).toEqual { 'test' : 'ing' }
            expect( child.children ).toEqual [ ]
            expect( child.exampleMethod2 ).toBeUndefined()

Deserialize and verify that each node is the same class as in the original
hierarchy, as well as all the same tests we did for the earlier cases.

            copy = Structure.fromJSON json
            expect( copy instanceof Structure ).toBeTruthy()
            expect( copy.computedAttributes ).toEqual { }
            expect( copy.externalAttributes ).toEqual { }
            expect( copy.computedAttributes ).not.toBe \
                json.computedAttributes
            expect( copy.externalAttributes ).not.toBe \
                json.externalAttributes
            expect( copy.computedAttributes ).not.toBe \
                bigger.computedAttributes
            expect( copy.externalAttributes ).not.toBe \
                bigger.externalAttributes
            expect( copy.ID ).toBeUndefined()
            expect( copy.parent() ).toBeNull()
            expect( copy ).not.toBe json
            expect( copy ).not.toBe bigger
            expect( copy.children().length ).toBe 2
            child = copy.children()[0]
            expect( child instanceof Sub1 ).toBeTruthy()
            expect( child.computedAttributes ).toEqual { }
            expect( child.externalAttributes ).toEqual { 10 : 100 }
            expect( child.computedAttributes ).not.toBe \
                json.computedAttributes
            expect( child.externalAttributes ).not.toBe \
                json.externalAttributes
            expect( child.computedAttributes ).not.toBe \
                child1.computedAttributes
            expect( child.externalAttributes ).not.toBe \
                child1.externalAttributes
            expect( child.ID ).toBeUndefined()
            expect( child.parent() ).toBe copy
            expect( child ).not.toBe json.children[0]
            expect( child ).not.toBe child1
            expect( child.children() ).toEqual [ ]
            child = copy.children()[1]
            expect( child instanceof Sub2 ).toBeTruthy()
            expect( child.computedAttributes ).toEqual { }
            expect( child.externalAttributes ).toEqual { 'test' : 'ing' }
            expect( child.computedAttributes ).not.toBe \
                json.computedAttributes
            expect( child.externalAttributes ).not.toBe \
                json.externalAttributes
            expect( child.computedAttributes ).not.toBe \
                child2.computedAttributes
            expect( child.externalAttributes ).not.toBe \
                child2.externalAttributes
            expect( child.ID ).toBeUndefined()
            expect( child.parent() ).toBe copy
            expect( child ).not.toBe json.children[1]
            expect( child ).not.toBe child2
            expect( child.children() ).toEqual [ ]

Release all IDs assigned in this test, so that we do not mess up tests of
IDs later in the file, which expect that none have yet been assigned.

            instance.releaseID() for instance in Structure::IDs
            expect( Structure::IDs.length ).toBe 0

## Computed attributes

    describe 'Computed attributes', ->

Structure objects provide a computed attributes dictionary, which should
function as any other Javascript object, storing key-value pairs.  Because
the implementation of this is very straightforward, we do only a few short
tests.

        it 'should function as a key-value dictionary', ->

Make a few new structures.

            S1 = new Structure
            S2 = new Structure

There shouldn't be any values stored at first in either of them.

            expect( S1.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S2.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S1.getComputedAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getComputedAttribute 'b e t a' ).toBeUndefined()

We can set any type of data in them without error.

            value1 = 55555
            value2 = { example : 'JSON' }
            S1.setComputedAttribute 'alpha', value1
            S2.setComputedAttribute 'b e t a', value2

We can then retrieve that exact data again.

            expect( S1.getComputedAttribute 'alpha' ).toBe value1
            expect( S2.getComputedAttribute 'b e t a' ).toBe value2

Things added to S1 did not impact S2, and vice versa.

            expect( S2.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S1.getComputedAttribute 'b e t a' ).toBeUndefined()

We can remove things from the dictionaries without error, even asking to
remove things that weren't there in the first place.

            S1.clearComputedAttributes 'alpha', 'b e t a'
            S2.clearComputedAttributes 'alpha', 'b e t a'

Now there's nothing in the dictionaries again.

            expect( S1.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S2.getComputedAttribute 'alpha' ).toBeUndefined()
            expect( S1.getComputedAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getComputedAttribute 'b e t a' ).toBeUndefined()

The `compute` function runs member functions within the Structure instance
and stores the values.  See
[the documentation](../src/structure.litcoffee#computed-attributes)
for details.

        it 'should compute and store attributes as requested', ->

Create a structure instance.

            S = new Structure

Give it two member functions that do simple example computations.

            counter = 0
            S.count = -> counter++
            S.add = ( a, b ) -> a + b

Call `compute()` an then inspect the stored computed attributes to verify
that compute calls `count` or `add` and stores the results appropriately.

First, the zero-argument case.

            S.compute 'count'
            expect( S.getComputedAttribute 'count' ).toBe 0
            S.compute 'count'
            expect( S.getComputedAttribute 'count' ).toBe 1
            S.compute 'count'
            expect( S.getComputedAttribute 'count' ).toBe 2

Next, the two-argument case.

            S.compute [ 'add', 5, 6 ]
            expect( S.getComputedAttribute 'add' ).toBe 11
            S.compute [ 'add', 100, -200 ]
            expect( S.getComputedAttribute 'add' ).toBe -100

Finally, the many-calls case.

            S.compute 'count', [ 'add', 1, 2 ], 'count'
            expect( S.getComputedAttribute 'count' ).toBe 4
            expect( S.getComputedAttribute 'add' ).toBe 3

## External attributes

    describe 'External attributes', ->

Same first set of tests as for computed attributes, because that's the set
of tests in which they behave the same.

        it 'should function as a key-value dictionary', ->

Make a few new structures.

            S1 = new Structure
            S2 = new Structure

There shouldn't be any values stored at first in either of them.

            expect( S1.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S2.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S1.getExternalAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getExternalAttribute 'b e t a' ).toBeUndefined()

We can set any type of data in them without error.

            value1 = 55555
            value2 = { example : 'JSON' }
            S1.setExternalAttribute 'alpha', value1
            S2.setExternalAttribute 'b e t a', value2

We can then retrieve that exact data again.

            expect( S1.getExternalAttribute 'alpha' ).toBe value1
            expect( S2.getExternalAttribute 'b e t a' ).toBe value2

Things added to S1 did not impact S2, and vice versa.

            expect( S2.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S1.getExternalAttribute 'b e t a' ).toBeUndefined()

We can remove things from the dictionaries without error, even asking to
remove things that weren't there in the first place.

            S1.clearExternalAttributes 'alpha', 'b e t a'
            S2.clearExternalAttributes 'alpha', 'b e t a'

Now there's nothing in the dictionaries again.

            expect( S1.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S2.getExternalAttribute 'alpha' ).toBeUndefined()
            expect( S1.getExternalAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getExternalAttribute 'b e t a' ).toBeUndefined()

## Event handling

    describe 'Event handling', ->

Changes to a structure hierarchy should result in event handlers being
called in the various structures in the hierarchy.  See [this
documentation](https://lurchmath.github.io/lde/site/phase0-structures/#event-handling-in-the-structure-hierarchy)
for details about the events.

        A = B = null
        beforeEach ->

Create two structres and install utilities to spy on when their event
handlers have been called.

            A = new Structure
            A.wasInserted = jasmine.createSpy 'wasInserted'
            A.wasRemoved = jasmine.createSpy 'wasRemoved'
            A.wasChanged = jasmine.createSpy 'wasChanged'
            B = new Structure
            B.wasInserted = jasmine.createSpy 'wasInserted'
            B.wasRemoved = jasmine.createSpy 'wasRemoved'
            B.wasChanged = jasmine.createSpy 'wasChanged'

Run a simple test to verify that the Jasmine event handler spies are working
as expected; they have not yet been called.

        it 'should begin with no event handlers called', ->
            expect( A.wasInserted ).not.toHaveBeenCalled()
            expect( A.wasRemoved ).not.toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Now test whether insertion and removal handlers work.

        it 'should send insertion and removal events', ->

Insert A into B and verify that only the insertion event from A was called.

            B.insertChild A
            expect( A.wasInserted ).toHaveBeenCalled()
            expect( A.wasRemoved ).not.toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Reset the insertion event for A as if it had not been called, cleaning up
for future tests.

            A.wasInserted = jasmine.createSpy 'wasInserted'
            expect( A.wasInserted ).not.toHaveBeenCalled()

Remove A from B and verify that only the removal event from A was called.

            A.removeFromParent()
            expect( A.wasInserted ).not.toHaveBeenCalled()
            expect( A.wasRemoved ).toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Now test whether change handlers work.

        it 'should send change events', ->

Add external and/or computed attributes to each of A and B and ensure that
the correct event handlers were called in each case.

            A.setExternalAttribute 'a', 'b'
            expect( A.wasChanged ).toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            B.setComputedAttribute 5, { }
            expect( B.wasChanged ).toHaveBeenCalled()

Reset the change events for A and B as if they had not been called, cleaning
up for future tests.

            A.wasChanged = jasmine.createSpy 'wasChanged'
            B.wasChanged = jasmine.createSpy 'wasChanged'
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Modify the attributes already added to A and B and verify that the change
event handlers are called again.

            B.setExternalAttribute 5, { } # different object!
            expect( B.wasChanged ).toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            A.setComputedAttribute 'a', 'c'
            expect( A.wasChanged ).toHaveBeenCalled()

Reset the change events for A and B as if they had not been called, cleaning
up for future tests.

            A.wasChanged = jasmine.createSpy 'wasChanged'
            B.wasChanged = jasmine.createSpy 'wasChanged'
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()

Remove attributes from A and B and verify that this, too, calls change
event handlers.

            A.clearExternalAttributes 'a'
            expect( A.wasChanged ).toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            B.clearComputedAttributes 5
            expect( B.wasChanged ).toHaveBeenCalled()

## Unique IDs

    describe 'Unique IDs for Structure instances', ->

Build some structures for use in all the tests below.

        A = new Structure
        B = new Structure(
            C = new Structure
        )

By default, structure instances don't have any IDs.

        it 'should not be assigned by default', ->
            expect( A.ID ).toBeUndefined()
            expect( B.ID ).toBeUndefined()
            expect( C.ID ).toBeUndefined()

When you request an ID for a structure, it gets a nonnegative integer ID.

        it 'should assign nonnegative integers when asked', ->
            A.getID()
            expect( typeof A.ID ).toBe 'number'
            expect( A.ID ).not.toBeLessThan 0
            B.getID()
            expect( typeof B.ID ).toBe 'number'
            expect( B.ID ).not.toBeLessThan 0
            C.getID()
            expect( typeof C.ID ).toBe 'number'
            expect( C.ID ).not.toBeLessThan 0

Requesting an ID again for a structure that already has one does nothing to
the structure's ID.

        it 'should not reassign IDs when they are already present', ->
            old = A.ID
            A.getID()
            expect( A.ID ).toBe old
            old = B.ID
            B.getID()
            expect( B.ID ).toBe old
            old = C.ID
            C.getID()
            expect( C.ID ).toBe old

Releasing an ID should mean that the structure doesn't have one any longer.
But requesting an ID immediately thereafter should get the old one back,
because in this simple test case, only one ID is released at a time, making
it the next one waiting to be assigned.

        it 'should release and reassign IDs correctly', ->
            expect( A.ID ).not.toBeUndefined()
            old = A.ID
            A.releaseID()
            expect( A.ID ).toBeUndefined()
            A.getID()
            expect( A.ID ).not.toBeUndefined()
            expect( A.ID ).toBe old
            expect( A.ID ).not.toBeUndefined()
            old = B.ID
            B.releaseID()
            expect( B.ID ).toBeUndefined()
            B.getID()
            expect( B.ID ).not.toBeUndefined()
            expect( B.ID ).toBe old
            expect( B.ID ).not.toBeUndefined()
            old = C.ID
            C.releaseID()
            expect( C.ID ).toBeUndefined()
            C.getID()
            expect( C.ID ).not.toBeUndefined()
            expect( C.ID ).toBe old

Through all of the above changes, the list of IDs should never get above 3,
because releasing and reassigning IDs should reuse old ones.

        it 'should assign IDs economically', ->
            expect( Structure::IDs.length ).toBe 3

Looking up a structure from its ID yields the structure itself.  That is,
the lookup function works correctly.

        it 'should look structures up by ID correctly', ->
            expect( Structure.instanceWithID A.ID ).toBe A
            expect( Structure.instanceWithID B.ID ).toBe B
            expect( Structure.instanceWithID C.ID ).toBe C

## Connections

    describe 'Connections among structures', ->

Connections are documented
[here](https://lurchmath.github.io/lde/site/phase0-structures/#connections).
The following unit tests are for all functions related to them.

We will be comparing things as multisets, and some utility functions help.

        samePair = ( a, b ) -> a[0] is b[0] and a[1] is b[1]
        pairCount = ( array, pair ) ->
            ( a for a in array when samePair a, pair ).length

        it 'should be made consistent by fillOutConnections()', ->

We begin with the `fillOutConnections()` function, which is supposed to make
connections consistent, in the sense that outgoing connections lists to
various targets match the incoming connections lists at those targets.  We
thus create two structure hierarchies with inconsistent connection lists,
call `fillOutConnections()`, and ensure that the inconsistencies are fixed.

Structure 1:

            A = new Structure(
                B = new Structure,
                C = new Structure
            )

In order to make connections, each structure will need an ID.

            A.getID()
            B.getID()
            C.getID()

We now connect A to B, but only note it within A.
And we connect B to C, but only note it within C.
These are the two inconsistencies we will test here.

            A.setExternalAttribute 'connectionsOut', [ [ B.ID, 'foo' ] ]
            C.setExternalAttribute 'connectionsIn', [ [ B.ID, 'bar' ] ]

Make the connections consistent.

            A.fillOutConnections()

Verify that no old connections were removed.

            expect( A.getExternalAttribute 'connectionsOut' )
                .toEqual [ [ B.ID, 'foo' ] ]
            expect( C.getExternalAttribute 'connectionsIn' )
                .toEqual [ [ B.ID, 'bar' ] ]

Verify that all the appropriate new connections were added.

            expect( B.getExternalAttribute 'connectionsIn' )
                .toEqual [ [ A.ID, 'foo' ] ]
            expect( B.getExternalAttribute 'connectionsOut' )
                .toEqual [ [ C.ID, 'bar' ] ]

Verify that no other connections were created.

            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()

Structure 2:

This is much more complex than structure 1, including multiple connections
between the same two structures, connections both ways between the same two
structures, some already-filled-out connections, connections from a node to
itself, and so on.

            root = new Structure(
                A = new Structure(
                    B = new Structure
                    C = new Structure
                )
                D = new Structure(
                    E = new Structure
                )
            )
            A.getID()
            B.getID()
            C.getID()
            D.getID()
            E.getID()
            A.setExternalAttribute 'connectionsOut',
                [ [ B.ID, '1' ], [ E.ID, '2' ] ]
            B.setExternalAttribute 'connectionsIn',
                [ [ A.ID, '1' ], [ A.ID, '1' ], [ A.ID, '1' ],
                  [ A.ID, '2' ] ]
            B.setExternalAttribute 'connectionsOut', [ [ C.ID, '1' ] ]
            C.setExternalAttribute 'connectionsIn', [ [ D.ID, '3' ] ]
            C.setExternalAttribute 'connectionsOut', [ [ D.ID, '3' ] ]
            D.setExternalAttribute 'connectionsIn', [ [ C.ID, '3' ] ]
            E.setExternalAttribute 'connectionsIn',
                [ [ A.ID, '2' ], [ A.ID, '2' ],
                  [ E.ID, '4' ], [ E.ID, '4' ] ]
            E.setExternalAttribute 'connectionsOut',
                [ [ C.ID, '3' ], [ E.ID, '4' ], [ E.ID, '5' ] ]

Make the connections consistent.

            root.fillOutConnections()

Check the connections of each of the six nodes.

Root:

            expect( root.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( root.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

A:

            expect( A.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, '1' ] ).toBe 3
            expect( pairCount toTest, [ B.ID, '2' ] ).toBe 1
            expect( pairCount toTest, [ E.ID, '2' ] ).toBe 2
            expect( toTest.length ).toBe 6

B:

            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, '1' ] ).toBe 3
            expect( pairCount toTest, [ A.ID, '2' ] ).toBe 1
            expect( toTest.length ).toBe 4
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, '1' ] ).toBe 1
            expect( toTest.length ).toBe 1

C:

            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, '1' ] ).toBe 1
            expect( pairCount toTest, [ D.ID, '3' ] ).toBe 1
            expect( pairCount toTest, [ E.ID, '3' ] ).toBe 1
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ D.ID, '3' ] ).toBe 1
            expect( toTest.length ).toBe 1

D:

            toTest = D.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, '3' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = D.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, '3' ] ).toBe 1
            expect( toTest.length ).toBe 1

E:

            toTest = E.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, '2' ] ).toBe 2
            expect( pairCount toTest, [ E.ID, '4' ] ).toBe 2
            expect( pairCount toTest, [ E.ID, '5' ] ).toBe 1
            expect( toTest.length ).toBe 5
            toTest = E.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, '3' ] ).toBe 1
            expect( pairCount toTest, [ E.ID, '4' ] ).toBe 2
            expect( pairCount toTest, [ E.ID, '5' ] ).toBe 1
            expect( toTest.length ).toBe 4

That completes the tests of `fillOutConnections()`.

The following section tests the function `connectTo()`.

        it 'should make consistent connections when asked', ->

Make a simple structure to use for testing.  Give all structures in it IDs,
and verify that they have no connections to start with.

            A = new Structure(
                B = new Structure,
                C = new Structure
            )
            A.getID()
            B.getID()
            C.getID()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( A.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( B.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( B.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

Make four connections of various types, and ensure that the connection sets
are created correctly in each case.  Furthermore, in each case, ensure that
the attempt to make a connection succeeds.

First, a simple connection.

            expect( A.connectTo B, 'reason' ).toBeTruthy()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

Second, a conncetion going the other way, and of the same type.

            expect( B.connectTo A, 'reason' ).toBeTruthy()
            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( C.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

Third, repeat the previous connection and ensure that there are now two.

            expect( B.connectTo A, 'reason' ).toBeTruthy()
            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            expect( C.getExternalAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getExternalAttribute 'connectionsOut' )
                .toBeUndefined()

Fourth, connect C to itself three times and ensure they all appear.

            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3

The following section tests the function `disconnectFrom()`; it is the
companion to the previous section.

        it 'should break connections consistently when asked', ->

Build the same structure as in the previous section, and make the same
connections within it.

            A = new Structure(
                B = new Structure
                C = new Structure
            )
            A.getID()
            B.getID()
            C.getID()
            expect( A.connectTo B, 'reason' ).toBeTruthy()
            expect( B.connectTo A, 'reason' ).toBeTruthy()
            expect( B.connectTo A, 'reason' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()

Verify that the currenct connection setup is, as expected, what it was at
the end of the last section.

            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3

Remove a few connections one at a time and ensure that at each point all
connections are as they should be.

            expect( B.disconnectFrom A, 'reason' ).toBeTruthy()
            toTest = A.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3

            expect( B.disconnectFrom A, 'reason' ).toBeTruthy()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toEqual [ ]
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getExternalAttribute 'connectionsOut' )
                .toEqual [ ]
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 3
            expect( toTest.length ).toBe 3

            expect( C.disconnectFrom C, 'premise' ).toBeTruthy()
            expect( C.disconnectFrom C, 'premise' ).toBeTruthy()
            expect( A.getExternalAttribute 'connectionsIn' )
                .toEqual [ ]
            toTest = A.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ B.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ A.ID, 'reason' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getExternalAttribute 'connectionsOut' )
                .toEqual [ ]
            toTest = C.getExternalAttribute 'connectionsIn'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = C.getExternalAttribute 'connectionsOut'
            expect( pairCount toTest, [ C.ID, 'premise' ] ).toBe 1
            expect( toTest.length ).toBe 1

The following section tests the three querying utilities for connections.

        it 'should give correct results from connection queries', ->

Build the same structure as in the previous section, and make the same
connections within it.

            A = new Structure(
                B = new Structure
                C = new Structure
            )
            A.getID()
            B.getID()
            C.getID()
            expect( A.connectTo B, 'reason' ).toBeTruthy()
            expect( B.connectTo A, 'reason' ).toBeTruthy()
            expect( B.connectTo A, 'reason' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()
            expect( C.connectTo C, 'premise' ).toBeTruthy()

Verify that all connection queries yield correct results.

First, connections in and out of A:

            expect( A.allConnectionsIn 'reason' ).toEqual [ B.ID, B.ID ]
            expect( A.allConnectionsIn 'premise' ).toEqual [ ]
            expect( A.allConnectionsIn() )
                .toEqual [ [ B.ID, 'reason' ], [ B.ID, 'reason' ] ]
            expect( A.allConnectionsOut 'reason' ).toEqual [ B.ID ]
            expect( A.allConnectionsOut 'premise' ).toEqual [ ]
            expect( A.allConnectionsOut() ).toEqual [ [ B.ID, 'reason' ] ]

Next, connections in and out of B:

            expect( B.allConnectionsIn 'reason' ).toEqual [ A.ID ]
            expect( B.allConnectionsIn 'premise' ).toEqual [ ]
            expect( B.allConnectionsIn() ).toEqual [ [ A.ID, 'reason' ] ]
            expect( B.allConnectionsOut 'reason' ).toEqual [ A.ID, A.ID ]
            expect( B.allConnectionsOut 'premise' ).toEqual [ ]
            expect( B.allConnectionsOut() )
                .toEqual [ [ A.ID, 'reason' ], [ A.ID, 'reason' ] ]

Next, connections in and out of C:

            expect( C.allConnectionsIn 'reason' ).toEqual [ ]
            expect( C.allConnectionsIn 'premise' )
                .toEqual [ C.ID, C.ID, C.ID ]
            expect( C.allConnectionsIn() ).toEqual [
                [ C.ID, 'premise' ], [ C.ID, 'premise' ],
                [ C.ID, 'premise' ]
            ]
            expect( C.allConnectionsOut 'reason' ).toEqual [ ]
            expect( C.allConnectionsOut 'premise' )
                .toEqual [ C.ID, C.ID, C.ID ]
            expect( C.allConnectionsOut() ).toEqual [
                [ C.ID, 'premise' ], [ C.ID, 'premise' ],
                [ C.ID, 'premise' ]
            ]

Next, connections between specific pairs:

            expect( A.allConnectionsTo A ).toEqual [ ]
            expect( A.allConnectionsTo B ).toEqual [ 'reason' ]
            expect( A.allConnectionsTo C ).toEqual [ ]
            expect( B.allConnectionsTo A ).toEqual [ 'reason', 'reason' ]
            expect( B.allConnectionsTo B ).toEqual [ ]
            expect( B.allConnectionsTo C ).toEqual [ ]
            expect( C.allConnectionsTo A ).toEqual [ ]
            expect( C.allConnectionsTo B ).toEqual [ ]
            expect( C.allConnectionsTo C )
                .toEqual [ 'premise', 'premise', 'premise' ]

Finally, incoming connections reported as property lists:

            props = A.properties()
            expect( Object.keys props ).toEqual [ 'reason' ]
            expect( props['reason'] instanceof Array ).toBeTruthy()
            expect( props['reason'].length ).toBe 2
            expect( props['reason'][0] ).toBe B
            expect( props['reason'][1] ).toBe B
            props = B.properties()
            expect( Object.keys props ).toEqual [ 'reason' ]
            expect( props['reason'] instanceof Array ).toBeTruthy()
            expect( props['reason'].length ).toBe 1
            expect( props['reason'][0] ).toBe A
            props = C.properties()
            expect( Object.keys props ).toEqual [ 'premise' ]
            expect( props['premise'] instanceof Array ).toBeTruthy()
            expect( props['premise'].length ).toBe 3
            expect( props['premise'][0] ).toBe C
            expect( props['premise'][1] ).toBe C
            expect( props['premise'][2] ).toBe C

## Convenience constructions

There are two member functions, `attr` and `setup`, that are mostly just
used within this unit testing framework, for easily constructing Structure
hierarchies.  We use them here, then verify that they have created the
hierarchies we expect, so that we can use them hereafter in testing.

    describe 'Convenience constructions', ->

First, check to be sure `attr` works.  This is a short test because that
function is straightforward.

        it 'build things correctly with attr', ->
            A = new Structure(
                B = new Structure().attr { example : 'text' }
            ).attr { one : 1, two : 2 }
            expect( A.getExternalAttribute 'one' ).toBe 1
            expect( A.getExternalAttribute 'two' ).toBe 2
            expect( B.getExternalAttribute 'example' ).toBe 'text'

Next, verify that `setup` gives unique IDs to all children in the hierarchy.

        it 'give unique IDs to everybody with setup', ->
            A = new Structure(
                B = new Structure
                C = new Structure
            ).setup()
            expect( typeof A.ID ).toBe 'number'
            expect( typeof B.ID ).toBe 'number'
            expect( typeof C.ID ).toBe 'number'
            expect( A.ID ).not.toBe B.ID
            expect( A.ID ).not.toBe C.ID
            expect( B.ID ).not.toBe C.ID

Finally, verify that `setup` makes connections as requested by entries in
the `attr` objects, and deletes those attributes afterwards.

        it 'makes connections with setup and attr together', ->
            A = new Structure(
                B = new Structure().attr { id : 1 }
                C = new Structure().attr { 'reason for': 'previous' }
            ).attr { 'label for' : 1 }
            .setup()
            expect( A.allConnectionsIn() ).toEqual [ ]
            expect( A.allConnectionsOut() ).toEqual [ [ B.ID, 'label' ] ]
            expect( B.allConnectionsIn() )
                .toEqual [ [ A.ID, 'label' ], [ C.ID, 'reason' ] ]
            expect( B.allConnectionsOut() ).toEqual [ ]
            expect( C.allConnectionsIn() ).toEqual [ ]
            expect( C.allConnectionsOut() ).toEqual [ [ B.ID, 'reason' ] ]
            expect( A.getExternalAttribute 'label for' ).toBeUndefined()
            expect( B.getExternalAttribute 'id' ).toBeUndefined()
            expect( C.getExternalAttribute 'reason for' ).toBeUndefined()

## Accessibility

The accessibility relation is documented in [the source code for the
Structure class](../src/structure.litcoffee#accessibility).  The first test
in this section just tests the two functions implementing that relation:
the forward direction in `isAccessibleTo` and the reverse direction in
`isInTheScopeOf`.

    describe 'Accessibility relations', ->

Define a large-ish structure we will use throughout all tests in this
section.

        A = new Structure(
            B = new Structure(
                C = new Structure
                D = new Structure
            )
            E = new Structure(
                F = new Structure(
                    G = new Structure
                )
                H = new Structure(
                    I = new Structure
                    J = new Structure
                )
                K = new Structure
            )
        )

Verify that the forward direction of the relation works, that is, the
version implemented in `isAccessibleTo`.

        it 'should work forwards', ->

Here are all the pairs of nodes in the above structure for which the
relation should return true.

            expect( B.isAccessibleTo E ).toBeTruthy()
            expect( B.isAccessibleTo F ).toBeTruthy()
            expect( B.isAccessibleTo G ).toBeTruthy()
            expect( B.isAccessibleTo H ).toBeTruthy()
            expect( B.isAccessibleTo I ).toBeTruthy()
            expect( B.isAccessibleTo J ).toBeTruthy()
            expect( B.isAccessibleTo K ).toBeTruthy()
            expect( C.isAccessibleTo D ).toBeTruthy()
            expect( F.isAccessibleTo H ).toBeTruthy()
            expect( F.isAccessibleTo I ).toBeTruthy()
            expect( F.isAccessibleTo J ).toBeTruthy()
            expect( F.isAccessibleTo K ).toBeTruthy()
            expect( H.isAccessibleTo K ).toBeTruthy()
            expect( I.isAccessibleTo J ).toBeTruthy()

Here is a sample of the many pairs of nodes for which it should return
false, despite the fact that the left-hand argument appears earlier in the
hierarchy than the right-hand one.

            expect( A.isAccessibleTo B ).toBeFalsy()
            expect( A.isAccessibleTo E ).toBeFalsy()
            expect( A.isAccessibleTo C ).toBeFalsy()
            expect( A.isAccessibleTo K ).toBeFalsy()
            expect( F.isAccessibleTo G ).toBeFalsy()
            expect( C.isAccessibleTo E ).toBeFalsy()
            expect( G.isAccessibleTo J ).toBeFalsy()
            expect( G.isAccessibleTo K ).toBeFalsy()

Here is a sample of the many pairs of nodes for which it should return
false, mostly because the left-hand argument appears later in the hierarchy
than the right-hand one, so regardless of the structure between them, the
accessibility relation could never hold.

            expect( D.isAccessibleTo B ).toBeFalsy()
            expect( G.isAccessibleTo E ).toBeFalsy()
            expect( G.isAccessibleTo F ).toBeFalsy()
            expect( H.isAccessibleTo G ).toBeFalsy()
            expect( H.isAccessibleTo H ).toBeFalsy()
            expect( B.isAccessibleTo B ).toBeFalsy()
            expect( A.isAccessibleTo A ).toBeFalsy()
            expect( K.isAccessibleTo B ).toBeFalsy()
            expect( J.isAccessibleTo E ).toBeFalsy()
            expect( H.isAccessibleTo F ).toBeFalsy()

        it 'should work backwards', ->

Now we repeat all the exact same tests as in the previous test function, but
we swap the order of the arguments and we change `isAccessibleTo` into
`isInTheScopeOf`.  Thus the results should all be the same.

            expect( E.isInTheScopeOf B ).toBeTruthy()
            expect( F.isInTheScopeOf B ).toBeTruthy()
            expect( G.isInTheScopeOf B ).toBeTruthy()
            expect( H.isInTheScopeOf B ).toBeTruthy()
            expect( I.isInTheScopeOf B ).toBeTruthy()
            expect( J.isInTheScopeOf B ).toBeTruthy()
            expect( K.isInTheScopeOf B ).toBeTruthy()
            expect( D.isInTheScopeOf C ).toBeTruthy()
            expect( H.isInTheScopeOf F ).toBeTruthy()
            expect( I.isInTheScopeOf F ).toBeTruthy()
            expect( J.isInTheScopeOf F ).toBeTruthy()
            expect( K.isInTheScopeOf F ).toBeTruthy()
            expect( K.isInTheScopeOf H ).toBeTruthy()
            expect( J.isInTheScopeOf I ).toBeTruthy()
            expect( B.isInTheScopeOf A ).toBeFalsy()
            expect( E.isInTheScopeOf A ).toBeFalsy()
            expect( C.isInTheScopeOf A ).toBeFalsy()
            expect( K.isInTheScopeOf A ).toBeFalsy()
            expect( G.isInTheScopeOf F ).toBeFalsy()
            expect( E.isInTheScopeOf C ).toBeFalsy()
            expect( J.isInTheScopeOf G ).toBeFalsy()
            expect( K.isInTheScopeOf G ).toBeFalsy()
            expect( B.isInTheScopeOf D ).toBeFalsy()
            expect( E.isInTheScopeOf G ).toBeFalsy()
            expect( F.isInTheScopeOf G ).toBeFalsy()
            expect( G.isInTheScopeOf H ).toBeFalsy()
            expect( H.isInTheScopeOf H ).toBeFalsy()
            expect( B.isInTheScopeOf B ).toBeFalsy()
            expect( A.isInTheScopeOf A ).toBeFalsy()
            expect( B.isInTheScopeOf K ).toBeFalsy()
            expect( E.isInTheScopeOf J ).toBeFalsy()
            expect( F.isInTheScopeOf H ).toBeFalsy()

We now test the two iterator functions, one that iterates over structures
accessible to the given one, and one that iterates over the scope of the
given structure.

    describe 'Accessibility iterator', ->

We re-use the same structure hierarchy for this test as in the last one.

        A = new Structure(
            B = new Structure(
                C = new Structure
                D = new Structure
            )
            E = new Structure(
                F = new Structure(
                    G = new Structure
                )
                H = new Structure(
                    I = new Structure
                    J = new Structure
                )
                K = new Structure
            )
        )

Compute the `iteratorOverAccessibles` object for five sample nodes in the
hierarchy, and verify that successive calls to `next()` in that object yield
the correct structures in the correct order.

        it 'should yield accessible structures in the correct order', ->

For the first few, there are no accessible structures, so the iterator
yields null immediately.  We evaluate it twice more regardless, to verify
that it does not cause any errors to do so.

            it = A.iteratorOverAccessibles()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            it = B.iteratorOverAccessibles()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            it = C.iteratorOverAccessibles()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()

In the last two examples, there are some accessible structures over which to
iterate.

            it = F.iteratorOverAccessibles()
            expect( it.next() ).toBe B
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            it = J.iteratorOverAccessibles()
            expect( it.next() ).toBe I
            expect( it.next() ).toBe F
            expect( it.next() ).toBe B
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()

In the following function, we test the same five nodes in the hierarchy, but
now iterating over their scopes instead of the structures accessible to
them.  Note that for B in particular, the order of the values returned is
not the order in which they're written in the code above that constructs the
hierarchy, but rather in the order of a postorder tree traversal, as the
specification (in the source code documentation linked to above) requires.

        it 'should yield structures in scope in the correct order', ->
            it = A.iteratorOverScope()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            it = B.iteratorOverScope()
            expect( it.next() ).toBe G
            expect( it.next() ).toBe F
            expect( it.next() ).toBe I
            expect( it.next() ).toBe J
            expect( it.next() ).toBe H
            expect( it.next() ).toBe K
            expect( it.next() ).toBe E
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            it = C.iteratorOverScope()
            expect( it.next() ).toBe D
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            it = F.iteratorOverScope()
            expect( it.next() ).toBe I
            expect( it.next() ).toBe J
            expect( it.next() ).toBe H
            expect( it.next() ).toBe K
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            it = J.iteratorOverScope()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()
            expect( it.next() ).toBeNull()

Finally, we test the functions that can search through the iterators for
single or multiple values.

    describe 'Accessibility searches', ->

We re-use the same structure hierarchy for this test as in the last one.

        A = new Structure(
            B = new Structure(
                C = new Structure
                D = new Structure
            )
            E = new Structure(
                F = new Structure(
                    G = new Structure
                )
                H = new Structure(
                    I = new Structure
                    J = new Structure
                )
                K = new Structure
            )
        )

We define two simple predicates for use as testing predicates below.  Each
is a one-place predicate that operates on structures; the first says whether
the structure has a child (one or more) and the second says whether it has
a grandchild (one or more).

        hasChild = ( x ) -> x.children().length > 0
        hasGrandchild = ( x ) ->
            for child in x.children()
                if hasChild child then return yes
            no

First we test the search functions for nodes accessible to the given one.

        it 'should find accessible structure(s) satisfying predicates', ->

The first node accessible from J is I, but the first one with children is F.

            expect( J.firstAccessible() ).toBe I
            expect( J.firstAccessible hasChild ).toBe F

There is no node accessible from J with grandchildren.

            expect( J.firstAccessible hasGrandchild ).toBeUndefined()

The nodes accessible from J are, in order, I, F, B.

            result = J.allAccessibles()
            expect( result.length ).toBe 3
            expect( result[0] ).toBe I
            expect( result[1] ).toBe F
            expect( result[2] ).toBe B

If we limit it to those with children, we get only F and B, in that order.

            result = J.allAccessibles hasChild
            expect( result.length ).toBe 2
            expect( result[0] ).toBe F
            expect( result[1] ).toBe B

All nodes accessible to F are just B only.

            result = F.allAccessibles()
            expect( result.length ).toBe 1
            expect( result[0] ).toBe B

If we limit that search to those with grandchildren, there is nothing on the
resulting list.

            result = F.allAccessibles hasGrandchild
            expect( result.length ).toBe 0

The set of nodes accessible from C is empty.

            result = C.allAccessibles()
            expect( result.length ).toBe 0

Second we test the search functions for nodes in the scope of the given one.

        it 'should find structure(s) in scope satisfying predicates', ->

The first node in the scope of B is G.
The first node in the scope of C is D.

            expect( B.firstInScope() ).toBe G
            expect( C.firstInScope() ).toBe D

If we limit those searches to nodes with children, then for B we get F,
and for C we find there is no such node.

            expect( B.firstInScope hasChild ).toBe F
            expect( C.firstInScope hasChild ).toBeUndefined()

The complete set of nodes in the scope of B are, in order, G, F, I, J, H, K,
E.

            result = B.allInScope()
            expect( result.length ).toBe 7
            expect( result[0] ).toBe G
            expect( result[1] ).toBe F
            expect( result[2] ).toBe I
            expect( result[3] ).toBe J
            expect( result[4] ).toBe H
            expect( result[5] ).toBe K
            expect( result[6] ).toBe E

Limiting that search to nodes with grandparents yields everything but E.

            result = B.allInScope ( x ) -> x.parent()?.parent()?
            expect( result.length ).toBe 6
            expect( result[0] ).toBe G
            expect( result[1] ).toBe F
            expect( result[2] ).toBe I
            expect( result[3] ).toBe J
            expect( result[4] ).toBe H
            expect( result[5] ).toBe K

The same search from C yields just one node, D.

            result = C.allInScope()
            expect( result.length ).toBe 1
            expect( result[0] ).toBe D

The same search from K yields an empty list.

            result = K.allInScope()
            expect( result.length ).toBe 0

## Attribute conventions

Attribute conventions are documented in the code
[here](../src/structure.litcoffee#attribute-conventions).  This section
tests each function (and thus each related concept) defined there.

    describe 'Attribute conventions', ->

The `text()` function is very straightforward, so we have minimal testing of
it.

        it 'should correctly fetch the text attribute', ->

Construct a Structure with no attributes, and verify that its text is
undefined.

            A = new Structure
            expect( A.text() ).toBeUndefined()

Give it a text attribute and verify that we can query it with `text()`.

            A.attr text : 'example'
            expect( A.text() ).toBe 'example'

Change it and verify that the change took.

            A.attr text : 'other'
            expect( A.text() ).toBe 'other'

Make a copy of A and verify that the copy also has the same text.

            B = A.copy()
            expect( B.text() ).toBe 'other'

The `isAReference()` function is very straightforward, so we have minimal
testing of it.

        it 'should correctly identify references', ->

Construct a Structure with no attributes, and verify that it is not a
reference.

            A = new Structure
            expect( A.isAReference() ).toBe no

Give it a true reference attribute and verify that it now counts as a
reference.

            A.attr reference : yes
            expect( A.isAReference() ).toBe yes

Give it a false reference attribute and verify that it no longer counts as a
reference.

            A.attr reference : no
            expect( A.isAReference() ).toBe no

Give it any truthy reference attribute and verify that it is a reference.

            A.attr reference : 100
            expect( A.isAReference() ).toBe yes

Make a copy of A and verify that the copy is also a reference.

            B = A.copy()
            expect( B.isAReference() ).toBe yes

The next set of tests verifies that the `labels()` function correctly
computes lists of labels for a structure based on the three possible
sources for such labels (external attributes, computed attributes, and
connections).  The trivial sidekick function `hasLabel()` is also tested.

        it 'should correctly compute label lists and membership', ->

Define a structure with several connections, labels, and one text attribute.

            A = new Structure(
                B = new Structure().attr name : 'B'
                C = new Structure().attr name : 'C'
            ).attr name : 'A'
            A.setup()
            A.setExternalAttribute 'labels', [ 'one' ]
            B.setComputedAttribute 'labels', [ 'two', 'three' ]
            B.setExternalAttribute 'labels', [ 'two' ]
            expect( C.connectTo B, 'label' ).toBeTruthy()
            expect( A.connectTo C, 'label' ).toBeTruthy()
            C.setExternalAttribute 'text', 'four'

The labels for A include only the one specified in its external attribute
"labels," because it has no computed attributes nor any incoming
connections.

            expect( A.labels() ).toEqual [ 'one' ]

The labels for B include "two" and "three" from its computed attributes,
nothing *new* from its external attributes, and "four" from the connection
from C to B (in which C has the text "four" and is connceted as a label).

            toTest = B.labels()
            expect( toTest.length ).toBe 3
            expect( 'two' in toTest ).toBeTruthy()
            expect( 'three' in toTest ).toBeTruthy()
            expect( 'four' in toTest ).toBeTruthy()

The labels for C include nothing at all, because it has no labels defined in
its external or internal attributes, and while A claims to label C, it has
no text content to serve as the label.

            expect( C.labels() ).toEqual [ ]

Now repeat all the above tests, phrased in terms of `hasLabel()` rather than
just `labels()`.

            expect( A.hasLabel 'one' ).toBeTruthy()
            expect( A.hasLabel 'two' ).toBeFalsy()
            expect( A.hasLabel 'three' ).toBeFalsy()
            expect( A.hasLabel 'four' ).toBeFalsy()
            expect( B.hasLabel 'one' ).toBeFalsy()
            expect( B.hasLabel 'two' ).toBeTruthy()
            expect( B.hasLabel 'three' ).toBeTruthy()
            expect( B.hasLabel 'four' ).toBeTruthy()
            expect( C.hasLabel 'one' ).toBeFalsy()
            expect( C.hasLabel 'two' ).toBeFalsy()
            expect( C.hasLabel 'three' ).toBeFalsy()
            expect( C.hasLabel 'four' ).toBeFalsy()

The next set of tests verifies that the `reasons()` and `premises()`
functions correctly compute lists of reasons/premises for a structure based
on the four possible sources for such labels (external attributes, computed
attributes, and connections of two types).

        it 'should correctly compute reason and premise lists', ->

Define a structure with several connections, reasons, and one text
attribute.  We re-use a similar structure from the earlier test for labels.

            A = new Structure(
                B = new Structure().attr name : 'B'
                C = new Structure().attr name : 'C'
            ).attr name : 'A'
            A.setup()
            A.setExternalAttribute 'reasons', [ 'one' ]
            B.setComputedAttribute 'reasons', [ 'two', 'three' ]
            B.setExternalAttribute 'reasons', [ 'two' ]
            expect( C.connectTo B, 'reason' ).toBeTruthy()
            expect( A.connectTo C, 'reason' ).toBeTruthy()
            C.setExternalAttribute 'text', 'four'
            C.setExternalAttribute 'reference', yes

The reasons for A include only the one specified in its external attribute
"reasons," because it has no computed attributes nor any incoming
connections.

            expect( A.reasons() ).toEqual [ 'one' ]

The reasons for B include "two" and "three" from its computed attributes,
"two" again from its external attributes, and C from the connection from C
to B.

            toTest = B.reasons()
            expect( toTest.length ).toBe 4
            numTwos = ( x for x in toTest when x is 'two' ).length
            expect( numTwos ).toBe 2
            expect( 'three' in toTest ).toBeTruthy()
            expect( C in toTest ).toBeTruthy()

The reasons for C include just A, because it has no reasons defined in
its external or internal attributes, but A connects to C as a reason and is
not marked as a reference, so it must itself be the reason structure.

            expect( C.reasons() ).toEqual [ A ]

Redo everything we just did, but for premises instead of reasons.

            A = new Structure(
                B = new Structure().attr name : 'B'
                C = new Structure().attr name : 'C'
            ).attr name : 'A'
            A.setup()
            A.setExternalAttribute 'premises', [ 'one' ]
            B.setComputedAttribute 'premises', [ 'two', 'three' ]
            B.setExternalAttribute 'premises', [ 'two' ]
            expect( C.connectTo B, 'premise' ).toBeTruthy()
            expect( A.connectTo C, 'premise' ).toBeTruthy()
            C.setExternalAttribute 'text', 'four'
            C.setExternalAttribute 'reference', yes

            expect( A.premises() ).toEqual [ 'one' ]

            toTest = B.premises()
            expect( toTest.length ).toBe 4
            numTwos = ( x for x in toTest when x is 'two' ).length
            expect( numTwos ).toBe 2
            expect( 'three' in toTest ).toBeTruthy()
            expect( C in toTest ).toBeTruthy()

            expect( C.premises() ).toEqual [ A ]


The following test gives labels to several structures throughout a complex
hierarchy, and then does many lookups to verify that all the results are
correct.  These include various types of challenges to the lookup function,
described in the individual tests below.

        it 'should correctly look up labeled structures', ->

The complex hierarchy:

            A = new Structure(
                B = new Structure(
                    C = new Structure().attr labels : [ 'L1', 'L2' ]
                    D = new Structure().attr labels : [ 'L3' ]
                ).attr labels : [ 'L4', 'L6' ]
                E = new Structure(
                    F = new Structure().attr labels : [ 'L1', 'L6' ]
                    G = new Structure().attr labels : [ 'L4', 'L5' ]
                )
            ).setup()

From A, B, or C, one can find nothing via lookup using any label.

            expect( A.lookup 'L1' ).toBeUndefined()
            expect( A.lookup 'L2' ).toBeUndefined()
            expect( A.lookup 'L3' ).toBeUndefined()
            expect( A.lookup 'L4' ).toBeUndefined()
            expect( A.lookup 'L5' ).toBeUndefined()
            expect( A.lookup 'L6' ).toBeUndefined()
            expect( B.lookup 'L1' ).toBeUndefined()
            expect( B.lookup 'L2' ).toBeUndefined()
            expect( B.lookup 'L3' ).toBeUndefined()
            expect( B.lookup 'L4' ).toBeUndefined()
            expect( B.lookup 'L5' ).toBeUndefined()
            expect( B.lookup 'L6' ).toBeUndefined()
            expect( C.lookup 'L1' ).toBeUndefined()
            expect( C.lookup 'L2' ).toBeUndefined()
            expect( C.lookup 'L3' ).toBeUndefined()
            expect( C.lookup 'L4' ).toBeUndefined()
            expect( C.lookup 'L5' ).toBeUndefined()
            expect( C.lookup 'L6' ).toBeUndefined()

From D, one can find C by looking up L1 or L2, but nothing else.

            expect( D.lookup 'L1' ).toBe C
            expect( D.lookup 'L2' ).toBe C
            expect( D.lookup 'L3' ).toBeUndefined()
            expect( D.lookup 'L4' ).toBeUndefined()
            expect( D.lookup 'L5' ).toBeUndefined()
            expect( D.lookup 'L6' ).toBeUndefined()

From E, one can find B by looking up L4 or L6, but nothing else.  This tests
that lookup follows accessibility rules, ignoring the structures inside B.

            expect( E.lookup 'L1' ).toBeUndefined()
            expect( E.lookup 'L2' ).toBeUndefined()
            expect( E.lookup 'L3' ).toBeUndefined()
            expect( E.lookup 'L4' ).toBe B
            expect( E.lookup 'L5' ).toBeUndefined()
            expect( E.lookup 'L6' ).toBe B

From F, one can find B by looking up L4 or L6, but nothing else.  This test
is similar to the previous, but verifying that accessibility can step up to
include the parent's previous siblings.

            expect( F.lookup 'L1' ).toBeUndefined()
            expect( F.lookup 'L2' ).toBeUndefined()
            expect( F.lookup 'L3' ).toBeUndefined()
            expect( F.lookup 'L4' ).toBe B
            expect( F.lookup 'L5' ).toBeUndefined()
            expect( F.lookup 'L6' ).toBe B

From G, one can find B by looking up L4, but F by looking up L1 or L6.  This
test verifies that the label L6 on F successfully eclipses the same label on
B.

            expect( G.lookup 'L1' ).toBe F
            expect( G.lookup 'L2' ).toBeUndefined()
            expect( G.lookup 'L3' ).toBeUndefined()
            expect( G.lookup 'L4' ).toBe B
            expect( G.lookup 'L5' ).toBeUndefined()
            expect( G.lookup 'L6' ).toBe F

We now test the `cites()` function and the `whatCitesMe()` function, which
together form the final functions in the `Structure` class.

        it 'should know which structures cite which other structures', ->

We begin by creating a hierarchy with several labels, reasons, and premises.
We keep it flat here, because there are many tests we want to do, and
splitting it into subtrees would make it impossible to do thorough tests
without a huge structure.  We assume that the above tests have sufficiently
verified that the accessibility/scope relations behave correctly for
non-flat structures.

            root = new Structure(
                A = new Structure().attr id : 1
                B = new Structure().attr id : 2
                C = new Structure().attr id : 3
                D = new Structure().attr id : 4
                E = new Structure().attr id : 5
                F = new Structure().attr id : 6
            ).setup()
            A.setExternalAttribute 'text', 'Theorem 1'
            A.connectTo B, 'label'
            B.connectTo D, 'reason'
            C.setExternalAttribute 'labels', [ 'C' ]
            D.setExternalAttribute 'premises', [ 'C' ]
            D.connectTo F, 'premise'
            E.connectTo F, 'premise'
            F.setExternalAttribute 'reasons', [ 'Theorem 1' ]

To summarize:

 * B is labeled "Theorem 1" by A.
 * C is a premise for D, which cites Theorem 1 as reason.
 * D and E are both premises for F, which also cites Theorem 1 as reason.

We now check all (x,y) pairs under the `cites` relation and verify that all
answers are correct.

The only citations (as per the above bulleted list) are that D cites both
B and C, and F cites B, D, and E.

            expect( A.cites A ).toBeFalsy()
            expect( A.cites B ).toBeFalsy()
            expect( A.cites C ).toBeFalsy()
            expect( A.cites D ).toBeFalsy()
            expect( A.cites E ).toBeFalsy()
            expect( A.cites F ).toBeFalsy()
            expect( B.cites A ).toBeFalsy()
            expect( B.cites B ).toBeFalsy()
            expect( B.cites C ).toBeFalsy()
            expect( B.cites D ).toBeFalsy()
            expect( B.cites E ).toBeFalsy()
            expect( B.cites F ).toBeFalsy()
            expect( C.cites A ).toBeFalsy()
            expect( C.cites B ).toBeFalsy()
            expect( C.cites C ).toBeFalsy()
            expect( C.cites D ).toBeFalsy()
            expect( C.cites E ).toBeFalsy()
            expect( C.cites F ).toBeFalsy()
            expect( D.cites A ).toBeFalsy()
            expect( D.cites B ).toBeTruthy()
            expect( D.cites C ).toBeTruthy()
            expect( D.cites D ).toBeFalsy()
            expect( D.cites E ).toBeFalsy()
            expect( D.cites F ).toBeFalsy()
            expect( E.cites A ).toBeFalsy()
            expect( E.cites B ).toBeFalsy()
            expect( E.cites C ).toBeFalsy()
            expect( E.cites D ).toBeFalsy()
            expect( E.cites E ).toBeFalsy()
            expect( E.cites F ).toBeFalsy()
            expect( F.cites A ).toBeFalsy()
            expect( F.cites B ).toBeTruthy()
            expect( F.cites C ).toBeFalsy()
            expect( F.cites D ).toBeTruthy()
            expect( F.cites E ).toBeTruthy()
            expect( F.cites F ).toBeFalsy()

We then ask "what cites me?" for each of the six children of the root.  To
turn around the tests just given, we report our expectations as follows:
B is cited by D and F, C is cited by D, and D and E are cited by F.

            expect( A.whatCitesMe() ).toEqual [ ]
            expect( B.whatCitesMe() ).toEqual [ D, F ]
            expect( C.whatCitesMe() ).toEqual [ D ]
            expect( D.whatCitesMe() ).toEqual [ F ]
            expect( E.whatCitesMe() ).toEqual [ F ]
            expect( F.whatCitesMe() ).toEqual [ ]
