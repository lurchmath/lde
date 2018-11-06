
# Tests of the `Structure` class

Here we import the module we're about to test.

    { Structure } = require '../src/structure'

## Global objects

Verify that the globals exposed by the `Structure` module are visible.

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

The next test verifies that the constructor ignores non-`Structure`s when
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

The next test is whether we can make a deep copy of a `Structure`.

        it 'should support deep copying structures', ->

Make a tiny `Structure` for testing.

            tiny = new Structure
            tiny.setAttribute 5, 6

Make a copy of root and test that it copied correctly and did not mess up
the original.

            C = tiny.copy()
            expect( C ).not.toBe tiny
            expect( C.parent() ).toBeFalsy()
            expect( C.children() ).toEqual [ ]
            expect( C.getAttribute 5 ).toBe 6
            expect( C.getAttribute 6 ).toBeUndefined()
            expect( tiny.parent() ).toBeFalsy()
            expect( tiny.children() ).toEqual [ ]
            expect( tiny.getAttribute 5 ).toBe 6
            expect( tiny.getAttribute 6 ).toBeUndefined()

Ensure that changing data within the original doesn't change the copy.

            tiny.setAttribute 5, 10
            expect( tiny.getAttribute 5 ).toBe 10
            expect( C.getAttribute 5 ).toBe 6

Make a more complex `Structure` for testing.

            tween = new Structure(
                A = new Structure(
                    AA = new Structure
                    AB = new Structure
                    AC = new Structure
                )
                B = new Structure
            )
            AB.setAttribute 2, 7

Make a copy of tween and test that it copied correctly and did not mess up
the original.

            D = tween.copy()
            expect( D ).not.toBe tween
            expect( D.children().length ).toEqual 2
            DA = D.children()[0]
            expect( D.parent() ).toBeFalsy()
            expect( A.parent() ).not.toBe( D )
            expect( B.parent() ).not.toBe( D )
            expect( A.parent() ).toBe( tween )
            expect( B.parent() ).toBe( tween )
            expect( DA.parent() ).toBe( D )
            expect( DA.children().length ).toEqual 3
            DAB = DA.children()[1]
            expect( DAB ).not.toBe( AB )
            expect( DAB.getAttribute 2 ).toEqual 7
            DB = D.children()[1]
            expect( DB.attributes ).toEqual { }

Ensure that changing data within the original doesn't change the copy.

            tween.setAttribute 3, 8
            expect( tween.getAttribute 3 ).toEqual 8
            expect( D.attributes ).toEqual { }
            AB.setAttribute 2, 9
            expect( AB.getAttribute 2 ).toEqual 9
            expect( DAB.getAttribute 2 ).toEqual 7

The next section tests the tree ordering relation defined in the `Structure`
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
            expect( json.attributes ).toEqual { }
            expect( json.children ).toEqual [ ]

Deserialize a copy from it and verify that it is correctly structured.

            copy = Structure.fromJSON json
            expect( copy instanceof Structure ).toBeTruthy()
            expect( copy.attributes ).toEqual { }
            expect( copy.attributes ).not.toBe json.attributes
            expect( copy.attributes ).not.toBe loner.attributes
            expect( copy.children() ).toEqual [ ]
            expect( copy.parent() ).toBeNull()
            expect( copy ).not.toBe json
            expect( copy ).not.toBe loner

Now do another one-node example, but this one with some attributes of each
type.

            atty = new Structure()
            atty.setAttribute 1, 2
            atty.setAttribute 'three', [ 'four', { } ]
            json = atty.toJSON()
            expect( json instanceof Structure ).toBeFalsy()
            expect( json ).not.toBe atty
            expect( json.className ).toBe 'Structure'
            expect( json.attributes ).toEqual
                1 : 2
                'three' : [ 'four', { } ]
            expect( json.children ).toEqual [ ]

Deserialize a copy from it and verify that it is correctly structured.

            copy = Structure.fromJSON json
            expect( copy instanceof Structure ).toBeTruthy()
            expect( copy.attributes ).toEqual
                1 : 2
                'three' : [ 'four', { } ]
            expect( copy.attributes ).not.toBe json.attributes
            expect( copy.attributes ).not.toBe atty.attributes
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
                exampleMethod2 : -> @getAttribute 'test'

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
            expect( json.attributes ).toEqual { }
            expect( json.children.length ).toBe 2
            child = json.children[0]
            expect( child instanceof Structure ).toBeFalsy()
            expect( child instanceof Sub1 ).toBeFalsy()
            expect( child.className ).toBe 'Sub1'
            expect( child.attributes ).toEqual { 10 : 100 }
            expect( child.children ).toEqual [ ]
            expect( child.exampleMethod1 ).toBeUndefined()
            child = json.children[1]
            expect( child instanceof Structure ).toBeFalsy()
            expect( child instanceof Sub2 ).toBeFalsy()
            expect( child.className ).toBe 'Sub2'
            expect( child.attributes ).toEqual { 'test' : 'ing' }
            expect( child.children ).toEqual [ ]
            expect( child.exampleMethod2 ).toBeUndefined()

Deserialize and verify that each node is the same class as in the original
hierarchy, as well as all the same tests we did for the earlier cases.

            copy = Structure.fromJSON json
            expect( copy instanceof Structure ).toBeTruthy()
            expect( copy.attributes ).toEqual { }
            expect( copy.attributes ).not.toBe json.attributes
            expect( copy.attributes ).not.toBe bigger.attributes
            expect( copy.id() ).toBeUndefined()
            expect( copy.parent() ).toBeNull()
            expect( copy ).not.toBe json
            expect( copy ).not.toBe bigger
            expect( copy.children().length ).toBe 2
            child = copy.children()[0]
            expect( child instanceof Sub1 ).toBeTruthy()
            expect( child.attributes ).toEqual { 10 : 100 }
            expect( child.attributes ).not.toBe json.attributes
            expect( child.attributes ).not.toBe child1.attributes
            expect( child.id() ).toBeUndefined()
            expect( child.parent() ).toBe copy
            expect( child ).not.toBe json.children[0]
            expect( child ).not.toBe child1
            expect( child.children() ).toEqual [ ]
            child = copy.children()[1]
            expect( child instanceof Sub2 ).toBeTruthy()
            expect( child.attributes ).toEqual { 'test' : 'ing' }
            expect( child.attributes ).not.toBe json.ttributes
            expect( child.attributes ).not.toBe child2.attributes
            expect( child.id() ).toBeUndefined()
            expect( child.parent() ).toBe copy
            expect( child ).not.toBe json.children[1]
            expect( child ).not.toBe child2
            expect( child.children() ).toEqual [ ]

Verify that `toJSON` respects its optional argument by creating a small
hierarchy with some IDs, and applying `toJSON` to it twice, once with a true
argument and once with a false argument.

            small = new Structure(
                new Structure().attr id : 'X', other : 'things'
            ).attr id : 'Y', other : 'stuff'
            expect( small.toJSON() ).toEqual {
                className : 'Structure'
                attributes : id : 'Y', other : 'stuff'
                children : [
                    className : 'Structure'
                    attributes : id : 'X', other : 'things'
                    children : [ ]
                ]
            }
            expect( small.toJSON no ).toEqual {
                className : 'Structure'
                attributes : other : 'stuff'
                children : [
                    className : 'Structure'
                    attributes : other : 'things'
                    children : [ ]
                ]
            }

## Attributes

    describe 'Attributes', ->

`Structure` objects provide an attributes dictionary, which should function
as any other Javascript object, storing key-value pairs.  Because the
implementation of this is very straightforward, we do only a few short
tests.

        it 'should function as a key-value dictionary', ->

Make a few new structures.

            S1 = new Structure
            S2 = new Structure

There shouldn't be any values stored at first in either of them.

            expect( S1.getAttribute 'alpha' ).toBeUndefined()
            expect( S2.getAttribute 'alpha' ).toBeUndefined()
            expect( S1.getAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getAttribute 'b e t a' ).toBeUndefined()

We can set any type of data in them without error.

            value1 = 55555
            value2 = { example : 'JSON' }
            S1.setAttribute 'alpha', value1
            S2.setAttribute 'b e t a', value2

We can then retrieve that exact data again.

            expect( S1.getAttribute 'alpha' ).toBe value1
            expect( S2.getAttribute 'b e t a' ).toBe value2

Things added to S1 did not impact S2, and vice versa.

            expect( S2.getAttribute 'alpha' ).toBeUndefined()
            expect( S1.getAttribute 'b e t a' ).toBeUndefined()

We can remove things from the dictionaries without error, even asking to
remove things that weren't there in the first place.

            S1.clearAttributes 'alpha', 'b e t a'
            S2.clearAttributes 'alpha', 'b e t a'

Now there's nothing in the dictionaries again.

            expect( S1.getAttribute 'alpha' ).toBeUndefined()
            expect( S2.getAttribute 'alpha' ).toBeUndefined()
            expect( S1.getAttribute 'b e t a' ).toBeUndefined()
            expect( S2.getAttribute 'b e t a' ).toBeUndefined()

Try again with attributes that begin with an underscore.  There is a policy
in the LDE that its API will not permit attributes with such keys, but we
must be able to use them if we directly call functions in the `Structure`s
themselves.  Thus this test verifies that the LDE's restriction does not
apply to the underlying `Structure` objects alone.

            S1.setAttribute '_A', value1
            S2.setAttribute '_B', value2
            expect( S1.getAttribute '_A' ).toBe value1
            expect( S1.getAttribute '_B' ).toBeUndefined()
            expect( S2.getAttribute '_A' ).toBeUndefined()
            expect( S2.getAttribute '_B' ).toBe value2
            S1.clearAttributes '_A', '_B'
            S2.clearAttributes '_A', '_B'
            expect( S1.getAttribute '_A' ).toBeUndefined()
            expect( S2.getAttribute '_A' ).toBeUndefined()
            expect( S1.getAttribute '_B' ).toBeUndefined()
            expect( S2.getAttribute '_B' ).toBeUndefined()

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
            A.willBeInserted = jasmine.createSpy 'willBeInserted'
            A.willBeRemoved = jasmine.createSpy 'willBeRemoved'
            A.willBeChanged = jasmine.createSpy 'willBeChanged'
            B = new Structure
            B.wasInserted = jasmine.createSpy 'wasInserted'
            B.wasRemoved = jasmine.createSpy 'wasRemoved'
            B.wasChanged = jasmine.createSpy 'wasChanged'
            B.willBeInserted = jasmine.createSpy 'willBeInserted'
            B.willBeRemoved = jasmine.createSpy 'willBeRemoved'
            B.willBeChanged = jasmine.createSpy 'willBeChanged'

Run a simple test to verify that the Jasmine event handler spies are working
as expected; they have not yet been called.

        it 'should begin with no event handlers called', ->
            expect( A.wasInserted ).not.toHaveBeenCalled()
            expect( A.wasRemoved ).not.toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( A.willBeInserted ).not.toHaveBeenCalled()
            expect( A.willBeRemoved ).not.toHaveBeenCalled()
            expect( A.willBeChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            expect( B.willBeInserted ).not.toHaveBeenCalled()
            expect( B.willBeRemoved ).not.toHaveBeenCalled()
            expect( B.willBeChanged ).not.toHaveBeenCalled()

Now test whether insertion and removal handlers work.

        it 'should send insertion and removal events', ->

Insert A into B and verify that only the insertion events from A were
called.

            B.insertChild A
            expect( A.willBeInserted ).toHaveBeenCalled()
            expect( A.wasInserted ).toHaveBeenCalled()
            expect( A.wasRemoved ).not.toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( A.willBeRemoved ).not.toHaveBeenCalled()
            expect( A.willBeChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            expect( B.willBeInserted ).not.toHaveBeenCalled()
            expect( B.willBeRemoved ).not.toHaveBeenCalled()
            expect( B.willBeChanged ).not.toHaveBeenCalled()

Reset the insertion events for A as if they had not been called, cleaning up
for future tests.

            A.wasInserted = jasmine.createSpy 'wasInserted'
            A.willBeInserted = jasmine.createSpy 'wasInserted'
            expect( A.wasInserted ).not.toHaveBeenCalled()
            expect( A.willBeInserted ).not.toHaveBeenCalled()

Remove A from B and verify that only the removal events from A were called.

            A.removeFromParent()
            expect( A.wasInserted ).not.toHaveBeenCalled()
            expect( A.willBeInserted ).not.toHaveBeenCalled()
            expect( A.wasRemoved ).toHaveBeenCalled()
            expect( A.willBeRemoved ).toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( A.willBeChanged ).not.toHaveBeenCalled()
            expect( B.wasInserted ).not.toHaveBeenCalled()
            expect( B.wasRemoved ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            expect( B.willBeInserted ).not.toHaveBeenCalled()
            expect( B.willBeRemoved ).not.toHaveBeenCalled()
            expect( B.willBeChanged ).not.toHaveBeenCalled()

Now test whether change handlers work.

        it 'should send change events', ->

Add attributes to each of A and B and ensure that the correct event handlers
were called in each case.

            A.setAttribute 'a', 'b'
            expect( A.wasChanged ).toHaveBeenCalled()
            expect( A.willBeChanged ).toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            expect( B.willBeChanged ).not.toHaveBeenCalled()

Reset the change events for A and B as if they had not been called, cleaning
up for future tests.

            A.wasChanged = jasmine.createSpy 'wasChanged'
            A.willBeChanged = jasmine.createSpy 'willBeChanged'
            B.wasChanged = jasmine.createSpy 'wasChanged'
            B.willBeChanged = jasmine.createSpy 'willBeChanged'
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( A.willBeChanged ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            expect( B.willBeChanged ).not.toHaveBeenCalled()

Modify the attributes already added to A and B and verify that the change
event handlers are called again.

            B.setAttribute 5, { } # different object!
            expect( B.wasChanged ).toHaveBeenCalled()
            expect( B.willBeChanged ).toHaveBeenCalled()
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( A.willBeChanged ).not.toHaveBeenCalled()

Reset the change events for A and B as if they had not been called, cleaning
up for future tests.

            A.wasChanged = jasmine.createSpy 'wasChanged'
            A.willBeChanged = jasmine.createSpy 'willBeChanged'
            B.wasChanged = jasmine.createSpy 'wasChanged'
            B.willBeChanged = jasmine.createSpy 'willBeChanged'
            expect( A.wasChanged ).not.toHaveBeenCalled()
            expect( A.willBeChanged ).not.toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            expect( B.willBeChanged ).not.toHaveBeenCalled()

Remove attributes from A and B and verify that this, too, calls change event
handlers.

            A.clearAttributes 'a'
            expect( A.wasChanged ).toHaveBeenCalled()
            expect( A.willBeChanged ).toHaveBeenCalled()
            expect( B.wasChanged ).not.toHaveBeenCalled()
            expect( B.willBeChanged ).not.toHaveBeenCalled()

Now we test to be sure that "will-be" event handlers are called before "was"
event handlers get called.

        it 'should call event handlers in the correct order', ->

We keep a variable called count, and we increment it during each event
handler, and remember the values, so that we can tell the order in which
they were called.

            count = 0
            countBeforeInsertion = countAfterInsertion = -1

We also track whether node `A` had a parent node or not, during each event
handler, so that we can tell which (if either) comes before the insertion
event.

            parentBeforeInsertion = parentAfterInsertion = null
            A.willBeInserted = ->
                countBeforeInsertion = count++
                parentBeforeInsertion = A.parent()
            A.wasInserted = ->
                countAfterInsertion = count++
                parentAfterInsertion = A.parent()

Ensure that `willBeInserted` comes before the insertion, which comes before
`wasInserted`.

            B.insertChild A
            expect( countBeforeInsertion ).toBe 0
            expect( countAfterInsertion ).toBe 1
            expect( count ).toBe 2
            expect( parentBeforeInsertion ).toBe null
            expect( parentAfterInsertion ).toBe B

Ensure that `willBeRemoved` comes before the removal, which comes before
`wasRemoved`.

            count = 0
            countBeforeRemoval = countAfterRemoval = -1
            parentBeforeRemoval = parentAfterRemoval = null
            A.willBeRemoved = ->
                countBeforeRemoval = count++
                parentBeforeRemoval = A.parent()
            A.wasRemoved = ->
                countAfterRemoval = count++
                parentAfterRemoval = A.parent()
            A.removeFromParent()
            expect( countBeforeRemoval ).toBe 0
            expect( countAfterRemoval ).toBe 1
            expect( count ).toBe 2
            expect( parentBeforeRemoval ).toBe B
            expect( parentAfterRemoval ).toBe null

Ensure that `willBeChanged` comes before the change, which comes before
`wasChanged`.

            count = 0
            countBeforeChange = countAfterChange = -1
            valueBeforeChange = valueAfterChange = null
            A.willBeChanged = ->
                countBeforeChange = count++
                valueBeforeChange = A.getAttribute 'test'
            A.wasChanged = ->
                countAfterChange = count++
                valueAfterChange = A.getAttribute 'test'
            A.setAttribute 'test', 100
            expect( countBeforeChange ).toBe 0
            expect( countAfterChange ).toBe 1
            expect( count ).toBe 2
            expect( valueBeforeChange ).toBeUndefined()
            expect( valueAfterChange ).toBe 100
            A.setAttribute 'test', null
            expect( countBeforeChange ).toBe 2
            expect( countAfterChange ).toBe 3
            expect( count ).toBe 4
            expect( valueBeforeChange ).toBe 100
            expect( valueAfterChange ).toBeNull()

## Unique IDs

    describe 'Unique IDs for Structure instances', ->

Build some structures for use in all the tests below.

        A = new Structure().attr 'id' : 'one'
        B = new Structure(
            C = new Structure().attr 'id' : 2
        ).attr 'id' : 'THREE'

The convenience function for querying IDs should work.

        it 'query IDs that have been assigned', ->
            expect( A.id() ).toBe 'one'
            expect( B.id() ).toBe 'THREE'
            expect( C.id() ).toBe 2

The previous test's claim should hold true even with structures that have
not been assigned an ID, which therefore have `undefined` as their ID.

        it 'yield undefined IDs for structures with no assigned ID', ->
            expect( ( new Structure ).id() ).toBeUndefined()

The class doesn't track IDs for structures unless you ask it to.  So by
default, there shouldn't be any instances we can look up by their ID.

        it 'does not track IDs unless asked', ->
            expect( Structure.instanceWithID 'one' ).toBeUndefined()
            expect( Structure.instanceWithID 2 ).toBeUndefined()
            expect( Structure.instanceWithID 'THREE' ).toBeUndefined()

But if you do ask it to track IDs, it does so correctly.

        it 'does track IDs once asked', ->
            A.trackIDs()
            B.trackIDs()
            expect( Structure.instanceWithID 'one' ).toBe A
            expect( Structure.instanceWithID 2 ).toBe C
            expect( Structure.instanceWithID 'THREE' ).toBe B

And if you ask it to stop, it does that, too.

        it 'stops tracking IDs once asked', ->
            A.untrackIDs()
            B.untrackIDs()
            expect( Structure.instanceWithID 'one' ).toBeUndefined()
            expect( Structure.instanceWithID 2 ).toBeUndefined()
            expect( Structure.instanceWithID 'THREE' ).toBeUndefined()

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
                B = new Structure().attr id : 'B'
                C = new Structure().attr id : 'C'
            ).attr id : 'A'
            A.trackIDs()

We now connect A to B, but only note it within A.
And we connect B to C, but only note it within C.
These are the two inconsistencies we will test here.

            A.setAttribute 'connectionsOut', [ [ 'B', 'foo' ] ]
            C.setAttribute 'connectionsIn', [ [ 'B', 'bar' ] ]

Make the connections consistent.

            A.fillOutConnections()

Verify that no old connections were removed.

            expect( A.getAttribute 'connectionsOut' )
                .toEqual [ [ 'B', 'foo' ] ]
            expect( C.getAttribute 'connectionsIn' )
                .toEqual [ [ 'B', 'bar' ] ]

Verify that all the appropriate new connections were added.

            expect( B.getAttribute 'connectionsIn' )
                .toEqual [ [ 'A', 'foo' ] ]
            expect( B.getAttribute 'connectionsOut' )
                .toEqual [ [ 'C', 'bar' ] ]

Verify that no other connections were created.

            expect( C.getAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( A.getAttribute 'connectionsIn' )
                .toBeUndefined()
            A.untrackIDs()

Structure 2:

This is much more complex than structure 1, including multiple connections
between the same two structures, connections both ways between the same two
structures, some already-filled-out connections, connections from a node to
itself, and so on.

            root = new Structure(
                A = new Structure(
                    B = new Structure().attr id : 'B'
                    C = new Structure().attr id : 'C'
                ).attr id : 'A'
                D = new Structure(
                    E = new Structure().attr id : 'E'
                ).attr id : 'D'
            ).attr id : 'root'
            root.trackIDs()
            A.setAttribute 'connectionsOut',
                [ [ 'B', '1' ], [ 'E', '2' ] ]
            B.setAttribute 'connectionsIn',
                [ [ 'A', '1' ], [ 'A', '1' ], [ 'A', '1' ],
                  [ 'A', '2' ] ]
            B.setAttribute 'connectionsOut', [ [ 'C', '1' ] ]
            C.setAttribute 'connectionsIn', [ [ 'D', '3' ] ]
            C.setAttribute 'connectionsOut', [ [ 'D', '3' ] ]
            D.setAttribute 'connectionsIn', [ [ 'C', '3' ] ]
            E.setAttribute 'connectionsIn',
                [ [ 'A', '2' ], [ 'A', '2' ], [ 'E', '4' ], [ 'E', '4' ] ]
            E.setAttribute 'connectionsOut',
                [ [ 'C', '3' ], [ 'E', '4' ], [ 'E', '5' ] ]

Make the connections consistent.

            root.fillOutConnections()

Check the connections of each of the six nodes.

Root:

            expect( root.getAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( root.getAttribute 'connectionsOut' )
                .toBeUndefined()

A:

            expect( A.getAttribute 'connectionsIn' )
                .toBeUndefined()
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', '1' ] ).toBe 3
            expect( pairCount toTest, [ 'B', '2' ] ).toBe 1
            expect( pairCount toTest, [ 'E', '2' ] ).toBe 2
            expect( toTest.length ).toBe 6

B:

            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', '1' ] ).toBe 3
            expect( pairCount toTest, [ 'A', '2' ] ).toBe 1
            expect( toTest.length ).toBe 4
            toTest = B.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', '1' ] ).toBe 1
            expect( toTest.length ).toBe 1

C:

            toTest = C.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'B', '1' ] ).toBe 1
            expect( pairCount toTest, [ 'D', '3' ] ).toBe 1
            expect( pairCount toTest, [ 'E', '3' ] ).toBe 1
            expect( toTest.length ).toBe 3
            toTest = C.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'D', '3' ] ).toBe 1
            expect( toTest.length ).toBe 1

D:

            toTest = D.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'C', '3' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = D.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', '3' ] ).toBe 1
            expect( toTest.length ).toBe 1

E:

            toTest = E.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', '2' ] ).toBe 2
            expect( pairCount toTest, [ 'E', '4' ] ).toBe 2
            expect( pairCount toTest, [ 'E', '5' ] ).toBe 1
            expect( toTest.length ).toBe 5
            toTest = E.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', '3' ] ).toBe 1
            expect( pairCount toTest, [ 'E', '4' ] ).toBe 2
            expect( pairCount toTest, [ 'E', '5' ] ).toBe 1
            expect( toTest.length ).toBe 4
            root.untrackIDs()

That completes the tests of `fillOutConnections()`.

The following section tests the function `connectTo()`.

        it 'should make consistent connections when asked', ->

Make a simple structure to use for testing.  Give all structures in it IDs,
and verify that they have no connections to start with.

            A = new Structure(
                B = new Structure().attr id : 'B'
                C = new Structure().attr id : 'C'
            ).attr id : 'A'
            A.trackIDs()
            expect( A.getAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( A.getAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( B.getAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( B.getAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( C.getAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getAttribute 'connectionsOut' )
                .toBeUndefined()

Make four connections of various types, and ensure that the connection sets
are created correctly in each case.  Furthermore, in each case, ensure that
the attempt to make a connection succeeds.

First, a simple connection.

            expect( A.connectTo B, 'example' ).toBeTruthy()
            expect( A.getAttribute 'connectionsIn' )
                .toBeUndefined()
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getAttribute 'connectionsOut' )
                .toBeUndefined()
            expect( C.getAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getAttribute 'connectionsOut' )
                .toBeUndefined()

Second, a connection going the other way, and of the same type.

            expect( B.connectTo A, 'example' ).toBeTruthy()
            toTest = A.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( C.getAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getAttribute 'connectionsOut' )
                .toBeUndefined()

Third, repeat the previous connection and ensure that there are now two.

            expect( B.connectTo A, 'example' ).toBeTruthy()
            toTest = A.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 2
            expect( toTest.length ).toBe 2
            expect( C.getAttribute 'connectionsIn' )
                .toBeUndefined()
            expect( C.getAttribute 'connectionsOut' )
                .toBeUndefined()

Fourth, connect C to itself three times and ensure they all appear.

            expect( C.connectTo C, 'other' ).toBeTruthy()
            expect( C.connectTo C, 'other' ).toBeTruthy()
            expect( C.connectTo C, 'other' ).toBeTruthy()
            toTest = A.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = C.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 3
            expect( toTest.length ).toBe 3
            A.untrackIDs()

The following section tests the function `disconnectFrom()`; it is the
companion to the previous section.

        it 'should break connections consistently when asked', ->

Build the same structure as in the previous section, and make the same
connections within it.

            A = new Structure(
                B = new Structure().attr id : 'B'
                C = new Structure().attr id : 'C'
            ).attr id : 'A'
            A.trackIDs()
            expect( A.connectTo B, 'example' ).toBeTruthy()
            expect( B.connectTo A, 'example' ).toBeTruthy()
            expect( B.connectTo A, 'example' ).toBeTruthy()
            expect( C.connectTo C, 'other' ).toBeTruthy()
            expect( C.connectTo C, 'other' ).toBeTruthy()
            expect( C.connectTo C, 'other' ).toBeTruthy()

Verify that the currenct connection setup is, as expected, what it was at
the end of the last section.

            toTest = A.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 2
            expect( toTest.length ).toBe 2
            toTest = C.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 3
            expect( toTest.length ).toBe 3

Remove a few connections one at a time and ensure that at each point all
connections are as they should be.

            expect( B.disconnectFrom A, 'example' ).toBeTruthy()
            toTest = A.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = C.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 3
            expect( toTest.length ).toBe 3

            expect( B.disconnectFrom A, 'example' ).toBeTruthy()
            expect( A.getAttribute 'connectionsIn' )
                .toEqual [ ]
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getAttribute 'connectionsOut' )
                .toEqual [ ]
            toTest = C.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 3
            expect( toTest.length ).toBe 3
            toTest = C.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 3
            expect( toTest.length ).toBe 3

            expect( C.disconnectFrom C, 'other' ).toBeTruthy()
            expect( C.disconnectFrom C, 'other' ).toBeTruthy()
            expect( A.getAttribute 'connectionsIn' )
                .toEqual [ ]
            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'A', 'example' ] ).toBe 1
            expect( toTest.length ).toBe 1
            expect( B.getAttribute 'connectionsOut' )
                .toEqual [ ]
            toTest = C.getAttribute 'connectionsIn'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = C.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', 'other' ] ).toBe 1
            expect( toTest.length ).toBe 1
            A.untrackIDs()

Since connections depend upon IDs (and you can't even create connections
without IDs in the structures to be connected), if we clear IDs or stop
tracking them from a subtree, then we should also disconnect any connections
that depend upon those IDs.  Here we test to be sure that this happens.

        it 'should break connections when necessitated by ID removal', ->

Build a similar structure to the one from the previous section, but a bit
simpler.

            A = new Structure(
                B = new Structure().attr id : 'B'
                C = new Structure().attr id : 'C'
            ).attr id : 'A'
            A.trackIDs()
            expect( A.connectTo B, 'foo' ).toBeTruthy()
            expect( B.connectTo A, 'bar' ).toBeTruthy()
            expect( C.connectTo C, 'baz' ).toBeTruthy()
            expect( C.connectTo B, 'bax' ).toBeTruthy()

Verify that connections exist.

            toTest = A.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'B', 'foo' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = B.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'A', 'bar' ] ).toBe 1
            expect( toTest.length ).toBe 1
            toTest = C.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', 'baz' ] ).toBe 1
            expect( pairCount toTest, [ 'B', 'bax' ] ).toBe 1
            expect( toTest.length ).toBe 2

Clear the IDs from B and verify that all connections to or from it were
broken, but the other connections remained.

            B.clearIDs()
            toTest = A.getAttribute 'connectionsOut'
            expect( toTest.length ).toBe 0
            toTest = B.getAttribute 'connectionsOut'
            expect( toTest.length ).toBe 0
            toTest = C.getAttribute 'connectionsOut'
            expect( pairCount toTest, [ 'C', 'baz' ] ).toBe 1
            expect( toTest.length ).toBe 1

Untrack IDs from A on down and verify that all connections were broken.

            A.untrackIDs()
            toTest = A.getAttribute 'connectionsOut'
            expect( toTest.length ).toBe 0
            toTest = B.getAttribute 'connectionsOut'
            expect( toTest.length ).toBe 0
            toTest = C.getAttribute 'connectionsOut'
            expect( toTest.length ).toBe 0

## Convenience constructions

There are two member functions, `attr` and `setup`, that are mostly just
used within this unit testing framework, for easily constructing `Structure`
hierarchies.  We use them here, then verify that they have created the
hierarchies we expect, so that we can use them hereafter in testing.

    describe 'Convenience constructions', ->

First, check to be sure `attr` works.  This is a short test because that
function is straightforward.

        it 'build things correctly with attr', ->
            A = new Structure(
                B = new Structure().attr { example : 'text' }
            ).attr { one : 1, two : 2 }
            expect( A.getAttribute 'one' ).toBe 1
            expect( A.getAttribute 'two' ).toBe 2
            expect( B.getAttribute 'example' ).toBe 'text'

Next, verify that `setup` makes connections as requested by entries in
the `attr` objects, and deletes those attributes afterwards.

        it 'makes connections with setup and attr together', ->
            A = new Structure(
                B = new Structure().attr id : 2
                C = new Structure().attr id : 3, 'reason for': 'previous'
            ).attr id : 1, 'label for' : 2
            .setup()
            # expect( A.allConnectionsIn() ).toEqual [ ]
            # expect( A.allConnectionsOut() ).toEqual [ [ 2, 'label' ] ]
            # expect( B.allConnectionsIn() )
            #     .toEqual [ [ 1, 'label' ], [ 3, 'reason' ] ]
            # expect( B.allConnectionsOut() ).toEqual [ ]
            # expect( C.allConnectionsIn() ).toEqual [ ]
            # expect( C.allConnectionsOut() ).toEqual [ [ 2, 'reason' ] ]
            expect( A.getAttribute 'label for' ).toBeUndefined()
            expect( C.getAttribute 'reason for' ).toBeUndefined()

## Accessibility

The accessibility relation is documented in [the source code for the
`Structure` class](../src/structure.litcoffee#accessibility).  The first
test in this section just tests the two functions implementing that
relation: the forward direction in `isAccessibleTo` and the reverse
direction in `isInTheScopeOf`.

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
