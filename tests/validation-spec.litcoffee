
# Tests of the Validation process

Here we import the LDE module, because we require all of it in order to test
validation.

    LDE = require '../src/lde.litcoffee'
    { OM } = require 'openmath-js'

## Validation functions

We begin by verifying that validation-related functions  and classes are
exposed by the LDE as a sanity check before the "real" testing begins.

    describe 'Validation-related functions and classes', ->

Verfiy that all the components of the LDE relevant to validation are
exported by the LDE.

        it 'should be defined', ->
            expect( LDE ).toBeTruthy()
            expect( LDE.InputStructure ).toBeTruthy()
            expect( LDE.OutputStructure ).toBeTruthy()
            expect( LDE.WorkerPool ).toBeTruthy()
            expect( LDE.ValidationQueue ).toBeTruthy()
            expect( LDE.ValidationQueue.enqueue ).toBeTruthy()
            expect( LDE.ValidationQueue.dequeue ).toBeTruthy()
            expect( LDE.Worker ).toBeTruthy()

## Enqueueing tests

This section tests the validation queue from the point of view of adding
elements to it.  Each such element must be an `OutputStructure`.

    describe 'Enqueueing OutputStructure instances for validation', ->

We must begin by claiming all LDE workers so that none are available,
because available workers would automatically dequeue anything we enqueued
in this way.  That would not be helpful for our testing purposes.

        it 'lets us take all workers away for testing purposes', ->
            expect( LDE.WorkerPool.length ).toBeGreaterThan 0
            while LDE.WorkerPool.numberAvailable() > 0
                expect( LDE.WorkerPool.getAvailableWorker() ).toBeTruthy()
            expect( LDE.WorkerPool.numberAvailable() ).toBe 0
            expect( LDE.WorkerPool.getAvailableWorker() ).toBeUndefined()

Enqueue is supposed to accept only `OutputStructure` instances.  Try
enqueueing a variety of things and verifying that the only ones that are
actually added to the queue are the `OutputStructure` instances.  We give
each a `validate` routine, or they wouldn't be accepted.

        it 'accepts only OutputStructures with validate routines', ->
            OS1 = new LDE.OutputStructure().attr id : 1
            OS1.validate = ( worker, callback ) -> callback()
            OS2 = new LDE.OutputStructure().attr id : 2
            OS2.validate = ( worker, callback ) -> callback()
            OS3 = new LDE.OutputStructure().attr id : 3
            nonOS1 = 5
            nonOS2 = 'five'
            nonOS3 = { fi : 've' }
            nonOS4 = new LDE.InputStructure().attr id : 5
            nonOS5 = /cinco/

We can add an `OutputStructure` with a validate routine.

            expect( LDE.ValidationQueue.length ).toBe 0
            expect( -> LDE.ValidationQueue.enqueue OS1 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 1
            expect( LDE.ValidationQueue[0].structure ).toBe OS1

We cannot add numbers or strings.

            expect( -> LDE.ValidationQueue.enqueue nonOS2 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 1
            expect( LDE.ValidationQueue[0].structure ).toBe OS1
            expect( -> LDE.ValidationQueue.enqueue nonOS3 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 1
            expect( LDE.ValidationQueue[0].structure ).toBe OS1

We can add another `OutputStructure` with a validate routine.

            expect( -> LDE.ValidationQueue.enqueue OS2 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 2
            expect( LDE.ValidationQueue[0].structure ).toBe OS2
            expect( LDE.ValidationQueue[1].structure ).toBe OS1

We cannot add other objects, not even `InputStructure`s.

            expect( -> LDE.ValidationQueue.enqueue nonOS4 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 2
            expect( LDE.ValidationQueue[0].structure ).toBe OS2
            expect( LDE.ValidationQueue[1].structure ).toBe OS1
            expect( -> LDE.ValidationQueue.enqueue nonOS5 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 2
            expect( LDE.ValidationQueue[0].structure ).toBe OS2
            expect( LDE.ValidationQueue[1].structure ).toBe OS1

We cannot add `OutputStructure`s that don't have `validate` routines.

            expect( -> LDE.ValidationQueue.enqueue OS3 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 2
            expect( LDE.ValidationQueue[0].structure ).toBe OS2
            expect( LDE.ValidationQueue[1].structure ).toBe OS1

Clear out the validation queue before the next tests.

        it 'can clear the validation queue with its reset function', ->
            expect( LDE.ValidationQueue.length ).toBeGreaterThan 0
            expect( -> LDE.ValidationQueue.reset() ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 0

Adding structures to the queue happens in priority order.  Here we create
OS1 through OS5 but add them with these priorities:
 * OS1 has priority 3
 * OS2 has priority 0
 * OS3 has priority unspecified (defaults to zero)
 * OS4 has priority -1
 * OS5 has priority 99

This should result in their being in the queue in this order:
OS4, OS3, OS2, OS1, OS5.

        it 'respects priorities', ->

Create the objects.

            OS1 = new LDE.OutputStructure().attr id : 1
            OS2 = new LDE.OutputStructure().attr id : 2
            OS3 = new LDE.OutputStructure().attr id : 3
            OS4 = new LDE.OutputStructure().attr id : 4
            OS5 = new LDE.OutputStructure().attr id : 5
            for os in [ OS1, OS2, OS3, OS4, OS5 ]
                os.validate = ( worker, callback ) -> callback()

Enqueue them and make sure the queue grows.

            expect( LDE.ValidationQueue.length ).toBe 0
            expect( -> LDE.ValidationQueue.enqueue OS1, 3 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 1
            expect( -> LDE.ValidationQueue.enqueue OS2, 0 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 2
            expect( -> LDE.ValidationQueue.enqueue OS3 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 3
            expect( -> LDE.ValidationQueue.enqueue OS4, -1 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 4
            expect( -> LDE.ValidationQueue.enqueue OS5, 99 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 5

Verify that they inhabit the queue in the order expected, retaining their
priorities.

            expect( LDE.ValidationQueue[0].structure ).toBe OS4
            expect( LDE.ValidationQueue[1].structure ).toBe OS3
            expect( LDE.ValidationQueue[2].structure ).toBe OS2
            expect( LDE.ValidationQueue[3].structure ).toBe OS1
            expect( LDE.ValidationQueue[4].structure ).toBe OS5
            expect( LDE.ValidationQueue[0].priority ).toBe -1
            expect( LDE.ValidationQueue[1].priority ).toBe 0
            expect( LDE.ValidationQueue[2].priority ).toBe 0
            expect( LDE.ValidationQueue[3].priority ).toBe 3
            expect( LDE.ValidationQueue[4].priority ).toBe 99

Clear out the validation queue before you start putting workers back, or
they will try to operate on the contents of the queue.

            LDE.ValidationQueue.reset()

Enqueueing is supposed to prevent the same structure from being enqueued
twice for validation.  (If it's already awaiting validation, and you ask for
it to be validated again, it doesn't move it out of its old place in line,
nor does it add it a second time.)

        it 'does not enqueue the same structure twice simultaneously', ->

Create some objects.

            OS1 = new LDE.OutputStructure().attr id : 1
            OS2 = new LDE.OutputStructure().attr id : 2
            OS1.validate = ( worker, callback ) -> callback()
            OS2.validate = ( worker, callback ) -> callback()

Enqueue both for validation.

            expect( LDE.ValidationQueue.length ).toBe 0
            expect( -> LDE.ValidationQueue.enqueue OS1 ).not.toThrow()
            expect( -> LDE.ValidationQueue.enqueue OS2 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 2
            expect( LDE.ValidationQueue[0].structure ).toBe OS2
            expect( LDE.ValidationQueue[1].structure ).toBe OS1
            expect( LDE.ValidationQueue[0].priority ).toBe 0
            expect( LDE.ValidationQueue[1].priority ).toBe 0

Try enqueueing each one again and ensure nothing changes.

            expect( -> LDE.ValidationQueue.enqueue OS1 ).not.toThrow()
            expect( -> LDE.ValidationQueue.enqueue OS2 ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 2
            expect( LDE.ValidationQueue[0].structure ).toBe OS2
            expect( LDE.ValidationQueue[1].structure ).toBe OS1
            expect( LDE.ValidationQueue[0].priority ).toBe 0
            expect( LDE.ValidationQueue[1].priority ).toBe 0
            LDE.ValidationQueue.reset()

When we're done, put all the workers back.

        it 'can clear the worker pool with its reset function', ->
            expect( LDE.WorkerPool.numberAvailable() ).toBe 0
            expect( -> LDE.WorkerPool.reset() ).not.toThrow()
            expect( LDE.WorkerPool.numberAvailable() )
                .toBe LDE.WorkerPool.length

If we try to enqueue for validation a structure that is currently being
validated (that is, it is not on the validation queue, but has been dequeued
and is in the process of being validated by a worker that has not yet
completed its work) then we should terminate that work (since it is no
longer relevant), return the worker to the worker pool, and then enqueue the
structure for validation.

The `CurrentPhase` member of the LDE is normally hidden and not for clients
to inspect or alter.  But we expose it for use in testing only, because
unless the phase is "validation" then no validation routine would ever get
run (as we will later test).

        it 'reboots workers if their structures are re-enqueued',
        ( done ) ->

Create a structure whose validation routine lasts forever (and thus it will
still be running when we go to reboot it).  Enqueue it.

            neverStops = new LDE.OutputStructure().attr id : '3.14159'
            whichWorkerDidIGet = null
            neverStops.validate = ( worker, callback ) ->
                whichWorkerDidIGet = worker
                "I just don't call the callback.  So depressing."
            expect( LDE.ValidationQueue.length ).toBe 0
            expect( whichWorkerDidIGet ).toBeNull()
            expect( -> LDE.ValidationQueue.enqueue neverStops )
                .not.toThrow()

The structure should not show up on the validation queue, because it was
immediately dequeued and assigned to an available worker.  That worker is
still working on it, because the callback hasn't been called to signify
completion.

            expect( LDE.ValidationQueue.length ).toBe 0
            expect( whichWorkerDidIGet ).not.toBeNull()
            expect( whichWorkerDidIGet.available ).toBeFalsy()

Before re-enqueueing it, let's give it a validate routine that does stop.

            newValidateRoutineGotCalled = no
            neverStops.validate = ( worker, callback ) ->
                "I've reformed my ways."
                newValidateRoutineGotCalled = yes
                callback()
                setTimeout done, 10

Now re-enqueueing the structure should reboot the old worker and put it back
in the pool before re-enqueueing the structure for validation.  That should
immediately dequeue it and assign it a worker (probably the same one it just
had), which should then complete right away because of the change we just
made.

            expect( -> LDE.ValidationQueue.enqueue neverStops )
                .not.toThrow()
            expect( newValidateRoutineGotCalled ).toBeTruthy()

We do not call `done()` here.  It will be called momentarily by the new
validate routine, above.  If not, this test will fail with a timeout error.

## Dequeueing tests

This section tests the validation queue from the point of view of removing
elements from it.  Each such element should be an `OutputStructure`.

    describe 'Dequeueing OutputStructure instances for validation', ->

Create a structure to be validated, enqueue it, and ensure that dequeue is
called on it immediately, executing its validate routine.

        it 'dequeues whenever something is enqueued if a worker is free',
        ( done ) ->

First, note that everything we've been doing with workers in the previous
tests probably leads to some of them still in the process of being rebooted.
So let's wait for the first worker in the pool (which is the one that will
be allocated in this test) to be ready before we proceed with the test.

(If we did not do this, we would need to be simultaneously testing a signal
that the LDE will send when all validation completes, and leveraging that.)

            LDE.WorkerPool[0].whenReady ->
                OS = new LDE.OutputStructure().attr id : 0
                wasCalled = no
                OS.validate = ( worker, callback ) ->
                    wasCalled = yes
                    callback()
                expect( LDE.WorkerPool.numberAvailable() )
                    .toBe LDE.WorkerPool.length
                expect( LDE.ValidationQueue.length ).toBe 0
                expect( wasCalled ).toBeFalsy()
                LDE.ValidationQueue.enqueue OS
                expect( wasCalled ).toBeTruthy()
                expect( LDE.ValidationQueue.length ).toBe 0
                expect( LDE.WorkerPool.numberAvailable() )
                    .toBe LDE.WorkerPool.length
                done()

Dequeue should do nothing if the queue is empty.  This is hard to test, but
here goes.

        it 'does nothing if the queue is empty', ->
            expect( LDE.ValidationQueue.length ).toBe 0
            expect( -> LDE.ValidationQueue.dequeue() ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 0

Dequeue does nothing if the modification or interpretation phase is running.
We track the phase with the `CurrentPhase` member of the LDE, which is
normally hidden and not for clients to inspect or alter.  But we expose it
for use in testing only, with the `setPhase` function of the LDE.

        it 'does nothing if modification/interpretation is running', ->
            expect( -> LDE.setPhase 'modification' ).not.toThrow()

We add two `OutputStructure`s to the Validation Queue.  An earlier test in
this section demonstrates that ordinarily they would be immediately dequeued
and processed by workers.  Instead we see here that they are not dequeued
nor are any workers assigned to them, because we have set the phase to be
"modification."

            OS1 = new LDE.OutputStructure().attr id : 1
            OS2 = new LDE.OutputStructure().attr id : 2
            OS1.validate = ( worker, callback ) -> callback()
            OS2.validate = ( worker, callback ) -> callback()
            expect( LDE.ValidationQueue.length ).toBe 0
            expect( LDE.WorkerPool.numberAvailable() )
                .toBe LDE.WorkerPool.length
            LDE.ValidationQueue.enqueue OS1
            LDE.ValidationQueue.enqueue OS2
            expect( LDE.ValidationQueue.length ).toBe 2
            expect( LDE.WorkerPool.numberAvailable() )
                .toBe LDE.WorkerPool.length

Clean up after ourselves.

            LDE.ValidationQueue.reset()
            LDE.setPhase null

Dequeue does nothing if it cannot get an available worker. We claim all
available workers, then add some structures to the queue, and see that they
are not dequeued.

        it 'does nothing if modification/interpretation is running', ->

Claim all available workers, making them unavailable.

            expect( LDE.WorkerPool.length ).toBeGreaterThan 0
            while LDE.WorkerPool.numberAvailable() > 0
                expect( LDE.WorkerPool.getAvailableWorker() ).toBeTruthy()
            expect( LDE.WorkerPool.numberAvailable() ).toBe 0
            expect( LDE.WorkerPool.getAvailableWorker() ).toBeUndefined()

Verify that adding structures to the queue does not process them.

            OS1 = new LDE.OutputStructure().attr id : 1
            OS2 = new LDE.OutputStructure().attr id : 2
            OS1.validate = ( worker, callback ) -> callback()
            OS2.validate = ( worker, callback ) -> callback()
            expect( LDE.ValidationQueue.length ).toBe 0
            LDE.ValidationQueue.enqueue OS1
            LDE.ValidationQueue.enqueue OS2
            expect( LDE.ValidationQueue.length ).toBe 2

Clean up after ourselves.

            LDE.ValidationQueue.reset()
            LDE.WorkerPool.reset()

Dequeue should take things from the high-priority end of the queue first.
We lie to the LDE, saying that it is in the modification phase, so that it
doesn't automatically dequeue things as we enqueue them.  Then we turn that
off and begin manually dequeueing and verify that the order is correct.

        it 'dequeues in order of highest priority first', ( done ) ->

Disable dequeueing by saying we're in the modification phase.

            expect( -> LDE.setPhase 'modification' ).not.toThrow()

Enqueue three structures not in priority order.  Give them a `validate()`
routine that will record the order in which they were processed.

            processedOrder = [ ]
            OS1 = new LDE.OutputStructure().attr id : 1
            OS2 = new LDE.OutputStructure().attr id : 2
            OS3 = new LDE.OutputStructure().attr id : 3
            OS1.validate = OS2.validate = OS3.validate =
            ( worker, callback ) ->
                processedOrder.push @id()
                callback()
            expect( LDE.ValidationQueue.length ).toBe 0
            LDE.ValidationQueue.enqueue OS1, 5
            LDE.ValidationQueue.enqueue OS2, 0
            LDE.ValidationQueue.enqueue OS3, 2
            expect( LDE.ValidationQueue.length ).toBe 3

Re-enable dequeueing by setting the LDE's phase to null, then manually
dequeue three times.

            expect( -> LDE.setPhase null ).not.toThrow()
            expect( -> LDE.ValidationQueue.dequeue() ).not.toThrow()
            expect( -> LDE.ValidationQueue.dequeue() ).not.toThrow()
            expect( -> LDE.ValidationQueue.dequeue() ).not.toThrow()

Verify that things were dequeued in the correct order, then call the test
callback.

            expect( processedOrder ).toEqual [ 1, 3, 2 ]
            expect( LDE.WorkerPool.numberAvailable() )
                .toBe LDE.WorkerPool.length
            done()

## Full sequence tests

### Small-size full-sequence test

This section tests whether validation is triggered at the end of the
interpretation phase and if it still works in that context.

    describe 'Running validation automatically after interpretation', ->

Create the simplest test of this pipeline: one `InputStructure` class and
instance, one `OutputStructure` class and instance.

        it 'happens and works for a simple example', ( done ) ->

Declare two classes we will use for this test.  First, an `OutputStructure`
subclass that, when validated, records that it was, so that we can confirm
later that validation actually happened.

            class TinyOSClass1 extends LDE.OutputStructure
                validate : ( worker, callback ) ->
                    @didValidation = yes
                    callback()
                className : LDE.Structure.addSubclass 'TinyOSClass1',
                    TinyOSClass1

Second, an `InputStructure` subclass that puts into the Output Tree a single
instance of the class just defined above.

            class TinyISClass1 extends LDE.InputStructure
                interpret : ( accessibles, childResults, scope ) ->
                    [ new TinyOSClass1() ]
                className : LDE.Structure.addSubclass 'TinyISClass1',
                    TinyISClass1

Ensure the LDE contains no Input Tree nor Output Tree.

            expect( -> LDE.reset() ).not.toThrow()
            expect( LDE.getInputTree().children() ).toEqual [ ]
            expect( LDE.getOutputTree().children() ).toEqual [ ]

Add one instance of the tiny `InputStructure` class to the Input Tree and
verify that it got there.

            toInsert = new TinyISClass1().attr id : 1
            expect( -> LDE.insertStructure toInsert, 'root', 0 )
                .not.toThrow()
            expect( LDE.getInputTree().children() ).not.toEqual [ ]

Start the whole LDE modification process and verify that this puts something
in the Output Tree and that the validation routine defined above gets run.
We do not stop the test until we hear from the LDE that it has completed the
validation phase, which also tests that we correctly receive that feedback
message.  (If we never do, this test will fail with a timeout error.)

            modificationFinished = no
            listener = ( event ) ->
                if event.subject is 'OT root' and \
                   event.type is 'validation complete'
                    expect( modificationFinished ).toBeTruthy()
                    expect( LDE.getOutputTree().children().length ).toBe 1
                    child = LDE.getOutputTree().children()[0]
                    expect( child.didValidation ).toBeTruthy()
                    LDE.reset()
                    LDE.Feedback.removeEventListener 'feedback', listener
                    done()
            LDE.Feedback.addEventListener 'feedback', listener
            LDE.runModification ->
                expect( LDE.getOutputTree().children() ).not.toEqual [ ]
                modificationFinished = yes

Repeat the previous test but don't even start validation manually.  Just
let it happen naturally because you modified the Input Tree.

        it 'happens automatically in response to IT changes', ( done ) ->

Reload the two classes from the last test.

            TinyISClass1 = LDE.Structure::subclasses.TinyISClass1
            TinyOSClass1 = LDE.Structure::subclasses.TinyOSClass1

Do all the same stuff as last time...

            expect( -> LDE.reset() ).not.toThrow()
            expect( LDE.getInputTree().children() ).toEqual [ ]
            expect( LDE.getOutputTree().children() ).toEqual [ ]
            toInsert = new TinyISClass1().attr id : 1
            expect( -> LDE.insertStructure toInsert, 'root', 0 )
                .not.toThrow()
            expect( LDE.getInputTree().children() ).not.toEqual [ ]

...except here things are different.  We now do not run the modification
phase ourselves, but just let it self-trigger because we modified the Input
Tree.

            listener = ( event ) ->
                if event.subject is 'OT root' and \
                   event.type is 'validation complete'
                    expect( LDE.getOutputTree().children().length ).toBe 1
                    child = LDE.getOutputTree().children()[0]
                    expect( child.didValidation ).toBeTruthy()
                    LDE.Feedback.removeEventListener 'feedback', listener
                    LDE.reset()
                    done()
            LDE.Feedback.addEventListener 'feedback', listener

### Full-sequence test with several subclasses

Now we'll test a situation in which we create several new subclasses of
`InputStructure` and `OutputStructure` and then place them, one at a time,
into a document, and verify that the LDE responds with correct validations
each time.

We do not clear out the Input or Output Tree after each test below, because
the tests form a sequence that are intended to happen one after the other.

    describe 'Lengthier full-sequence test with steps and reasons', ->

Before beginning any tests, define the subclasses in question.

A class to represent premises:

        class TestPrem extends LDE.OutputStructure
            className : LDE.Structure.addSubclass 'TestPrem', TestPrem

A class to represent rules:

        class TestRule extends LDE.OutputStructure
            className : LDE.Structure.addSubclass 'TestRule', TestRule

A class to represent a step of work that judges itself valid iff it cites
one reason, zero premises, and the reason's "number" attribute is less than
the step's "number" attribute:

        class LessStep extends LDE.OutputStructure
            validate : ( worker, callback ) ->
                prems = @lastCitationLookup.premises
                reass = @lastCitationLookup.reasons
                prems = prems.connections.concat prems.labels
                reass = reass.connections.concat reass.labels
                validity = 'invalid'
                message = undefined
                if prems.length > 0
                    message = 'Too many premises'
                else if reass.length isnt 1
                    message = 'Need exactly one reason'
                else if not \
                    ( reas = LDE.Structure.instanceWithID reass[0].cited )?
                    message = 'Could not find cited reason'
                else if reas not instanceof TestRule
                    message = "Cannot cite a #{reas.className} as a reason"
                else if not ( rn = reas.getAttribute 'n' )?
                    message = 'Reason had no attribute n'
                else if not ( n = @getAttribute 'n' )?
                    message = 'Step had no attribute n'
                else if rn < n
                    validity = 'valid'
                else
                    message = "Reason number #{rn} not less than #{n}"
                @feedback
                    type : 'validation result'
                    validity : validity
                    message : message
                callback()
            className : LDE.Structure.addSubclass 'LessStep', LessStep

A class to represent a step of work that judges itself valid iff it cites
one reason, any number of premises (including zero), and the sum of the
premises' "number" attributes minus the one reason's "number" attribute is
equal to the step's "number" attribute:

        class SumStep extends LDE.OutputStructure
            validate : ( worker, callback ) ->
                prems = @lastCitationLookup.premises
                reass = @lastCitationLookup.reasons
                prems = prems.connections.concat prems.labels
                reass = reass.connections.concat reass.labels
                validity = 'invalid'
                message = undefined
                if reass.length isnt 1
                    message = 'Need exactly one reason'
                else if not \
                    ( reas = LDE.Structure.instanceWithID reass[0].cited )?
                    message = 'Could not find cited reason'
                else if reas not instanceof TestRule
                    message = "Cannot cite a #{reas.className} as a reason"
                else if not ( rn = reas.getAttribute 'n' )?
                    message = 'Reason had no attribute n'
                else if not ( n = @getAttribute 'n' )?
                    message = 'Step had no attribute n'
                else
                    premTotal = 0
                    for prem in prems
                        if not ( obj = \
                                LDE.Structure.instanceWithID prem.cited )?
                            message = "Cannot find premise #{prem.cited}"
                            break
                        if obj not instanceof TestPrem
                            message = "Cannot cite a #{obj.className}
                                as a premise"
                            break
                        if not ( pn = obj.getAttribute 'n' )?
                            message = 'Premise had no attribute n'
                            break
                        premTotal += parseInt pn
                    if not message?
                        if premTotal - rn is n
                            validity = 'valid'
                        else
                            message = "#{premTotal} - #{rn} is not #{n}"
                @feedback
                    type : 'validation result'
                    validity : validity
                    message : message
                callback()
            className : LDE.Structure.addSubclass 'SumStep', SumStep

An `InputStructure` subclass that will construct any single
`OutputStructure`, as long as it is defined solely by its class and
attributes.  All attributes are copied from the `InputStructure` except the
"class" and "id" attributes.  The former is used to choose which class of
`OutputStructure` to create and the latter is ignored.

        class MakeAnything extends LDE.InputStructure
            interpret : ( accessibles, childResults, scope ) ->
                whichClass = @getAttribute 'class'
                whichClass = LDE.Structure::subclasses[whichClass]
                if not whichClass? then return [ ]
                result = new whichClass()
                for own key, value of @attributes
                    if key not in [ 'class', 'id' ] and key[0] isnt '_'
                        result.setAttribute key, value
                [ result ]
            className : LDE.Structure.addSubclass 'MakeAnything',
                MakeAnything

In order to listen for all kinds of feedback from the LDE, we use the
following tools for recording messages from the LDE.

        LDEmessages = [ ]
        completionCallback = null
        listener = ( event ) ->
            LDEmessages.push event
            if event.type is 'validation complete'
                completionCallback?()
        beforeEach ->
            LDE.Feedback.addEventListener 'feedback', listener
        afterEach ->
            LDE.Feedback.removeEventListener 'feedback', listener
            LDEmessages = [ ]
        setupThenTest = ( setup, test ) ->
            completionCallback = -> test() ; completionCallback = null
            setup()

Test 1:  The LDE should start out with both trees empty.

        it 'should start with IT and OT empty', ->
            expect( LDE.getInputTree().children() ).toEqual [ ]
            expect( LDE.getOutputTree().children() ).toEqual [ ]

Test 2: If we insert a premise, it should propagate correctly to the Output
Tree but not generate any validation feedback.

        it 'should permit premise insertion without validation feedback',
        ( done ) ->
            setupThenTest ->
                P = new MakeAnything()
                    .attr n : 5, id : 1, class : 'TestPrem'
                LDE.insertStructure P, 'root', 0
            , ->
                expect( m.type for m in LDEmessages )
                    .toEqual [ 'updated LDE state', 'validation complete' ]
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 1
                expect( OT.children()[0].className ).toBe 'TestPrem'
                expect( OT.children()[0].getAttribute 'n' ).toBe 5
                done()

Test 3: If we insert a `LessStep`, it should propagate correctly to the
Output Tree and generate validation feedback saying it must cite a reason.

        it 'should permit step insertion and send feedback', ( done ) ->
            setupThenTest ->
                SL = new MakeAnything()
                    .attr n : 4, id : 2, class : 'LessStep'
                LDE.insertStructure SL, 'root', 1
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'invalid'
                expect( LDEmessages[2].message )
                    .toMatch /Need exactly one reason/
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 2
                expect( OT.children()[1].className ).toBe 'LessStep'
                expect( OT.children()[1].getAttribute 'n' ).toBe 4
                done()

Test 4: If we connect the step to the premise as a reason, it should
propagate correctly to the Output Tree and generate validation feedback
saying it is treating a premise like a reason.

        it 'should permit connection insertion and send feedback',
        ( done ) ->
            setupThenTest ->
                LDE.insertConnection 2, 1,
                    id : 'c1', type : 'reason citation'
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'invalid'
                expect( LDEmessages[2].message )
                    .toMatch /Cannot cite a TestPrem as a reason/
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 2
                done()

Test 5: If we replace the premise with a reason, it should propagate
correctly to the Output Tree and generate validation feedback saying it is
invalid because 5 is not less than 4.

        it 'should permit premise replacement and send feedback',
        ( done ) ->
            setupThenTest ->
                R = new MakeAnything()
                    .attr id : 1, n : 5, class : 'TestRule'
                LDE.replaceStructure 1, R, yes
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'invalid'
                expect( LDEmessages[2].message )
                    .toMatch /Reason number 5 not less than 4/
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 2
                done()

Test 6: If we modify the reason's number to 3, it should propagate
correctly to the Output Tree and generate positive validation feedback.

        it 'should permit a rule attribute change and send feedback',
        ( done ) ->
            setupThenTest ->
                LDE.setStructureAttribute 1, 'n', 3
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'valid'
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 2
                done()

Test 7: If we replace insert a premise after the reason, it should propagate
correctly to the Output Tree and the validation feedback should not change.

        it 'should permit inserting unused premises and send feedback',
        ( done ) ->
            setupThenTest ->
                P = new MakeAnything()
                    .attr n : 2, id : 3, class : 'TestPrem'
                LDE.insertStructure P, 'root', 1
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'valid'
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 3
                done()

Test 8: If we cite the new premise as a premise of the `LessStep` instance,
it should give us an error because such steps are not supposed to cite any
premises.

        it 'should permit citing a premise and send negative feedback',
        ( done ) ->
            setupThenTest ->
                LDE.insertConnection 2, 3,
                    id : 'c2', type : 'premise citation'
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'invalid'
                expect( LDEmessages[2].message )
                    .toMatch /Too many premises/
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 3
                done()

Test 9: If we change the type of the step to `SumStep` instead, then the
error should change to say that -1 is not equal to 4.

        it 'should permit changing step type and update the feedback',
        ( done ) ->
            setupThenTest ->
                SS = new MakeAnything()
                    .attr id : 2, n : 4, class : 'SumStep'
                LDE.replaceStructure 2, SS, yes
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'invalid'
                expect( LDEmessages[2].message ).toMatch /2 - 3 is not 4/
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 3
                done()

Test 10: If we update the number of the sum step to -1, then it should
propagate to the Output Tree and update the feedback to positive.

        it 'should permit changing step number and switching the feedback',
        ( done ) ->
            setupThenTest ->
                LDE.setStructureAttribute 2, 'n', -1
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'valid'
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 3
                done()

Test 11: If we update the number of the reason to 8, then it should
propagate to the Output Tree and put the feedback back to negative, saying
that -6 is not -1.

        it 'should permit changing reason number with opposite results',
        ( done ) ->
            setupThenTest ->
                LDE.setStructureAttribute 1, 'n', 8
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'invalid'
                expect( LDEmessages[2].message ).toMatch /2 - 8 is not -1/
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 3
                done()

Test 12: If we update the number of the premise to 7, then it should
propagate to the Output Tree and put the feedback back to positive.

        it 'should let us change premise number w/feedback positive again',
        ( done ) ->
            setupThenTest ->
                LDE.setStructureAttribute 3, 'n', 7
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 2
                expect( LDEmessages[2].subject ).toBe 2
                expect( LDEmessages[2].validity ).toBe 'valid'
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 3
                done()

Test 13: If we change the ID of the step, this should trigger revalidation,
but the feedback will have changed only in that it is now reported about a
different `InputStructure`'s ID.

        it 'should let us change IDs and the feedback moves to the new ID',
        ( done ) ->
            setupThenTest ->
                LDE.setStructureAttribute 2, 'id', 4
            , ->
                expect( m.type for m in LDEmessages ).toEqual [
                    'updated LDE state'
                    'validation queueing'
                    'validation result'
                    'validation complete'
                ]
                expect( LDEmessages[1].subject ).toBe 4
                expect( LDEmessages[2].subject ).toBe 4
                expect( LDEmessages[2].validity ).toBe 'valid'
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 3
                done()

## The `basicValidate()` routine

The `basicValidate()` routine is defined as a class method of the
`OutputRule` class, with the intention that it is available for installation
in any step of work that wants to use it to defer validation to its cited
rule(s).  This test verifies that the `basicValidate()` function behaves
correctly when used in that way.

    describe 'The basicValidate() routine of the OutputStructure class', ->

We make a simple subclass of `OutputRule` that just verifies that the step's
"text" attribute matches the regular expression in the rule's "re"
attribute.

        class RegExpRule extends LDE.OutputRule
            className : LDE.Structure.addSubclass 'RegExpRule', RegExpRule
            validateStep : ( step, worker, callback ) ->
                return callback() unless step instanceof LDE.OutputStructure
                step.feedback if not ( text = step.getAttribute 'text' )?
                    type : 'validation result'
                    validity : 'invalid'
                    message : 'The step needs a text attribute.'
                else if not ( re = @getAttribute 're' )?
                    type : 'validation result'
                    validity : 'invalid'
                    message : 'The rule needs an re attribute.'
                else if RegExp( re ).test text
                    type : 'validation result'
                    validity : 'valid'
                else
                    type : 'validation result'
                    validity : 'invalid'
                    message : "#{text} does not match #{re}."
                callback()
            hasLabel : ( label ) ->
                ( labelPattern = @getAttribute 'lpat' )? and \
                RegExp( labelPattern ).test label

We make a simple subclass of `OutputStructure` that just defers validation
to cited rule(s) using the `basicValidate()` function, which is what we are
testing.

        class SimpleStep extends LDE.OutputStructure
            className : LDE.Structure.addSubclass 'SimpleStep', SimpleStep
            validate : LDE.OutputRule.basicValidate

Re-use the handy tool from a previous test.

        MakeAnything = LDE.Structure::subclasses.MakeAnything

Re-use the handy feedback event listening mechanism from a previous test.

        LDEmessages = [ ]
        completionCallback = null
        listener = ( event ) ->
            LDEmessages.push event
            if event.type is 'validation complete'
                completionCallback?()
        beforeEach ->
            LDE.Feedback.addEventListener 'feedback', listener
        afterEach ->
            LDE.Feedback.removeEventListener 'feedback', listener
            LDEmessages = [ ]
        setupThenTest = ( setup, test ) ->
            completionCallback = -> test() ; completionCallback = null
            setup()

Verify that the Input and Output Trees are successfully cleared before we
begin.

        it 'should start with IT and OT empty', ->
            LDE.reset()
            expect( LDE.getInputTree().children() ).toEqual [ ]
            expect( LDE.getOutputTree().children() ).toEqual [ ]

Insert two rules, be sure we received no "validation result" feedback, and
that the rules interpreted into the Output Tree successfully.

        it 'should permit rule setup without feedback', ( done ) ->
            setupThenTest ->
                R1 = new MakeAnything().attr
                    id : 1
                    class : 'RegExpRule'
                    re : '[0-9]+'
                    lpat : '[rR]1|ANY'
                LDE.insertStructure R1, 'root', 0
                R2 = new MakeAnything().attr
                    id : 2
                    class : 'RegExpRule'
                    re : '[abcABC]'
                    lpat : '[rR]2|ANY'
                LDE.insertStructure R2, 'root', 1
            , ->
                expect( m.type for m in LDEmessages )
                    .toEqual [ 'updated LDE state', 'validation complete' ]
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 2
                done()

Insert four steps citing those rules in various ways, and ensure that all
the correct "validation queueing" and "validation result" messages come out
of the LDE.

        it 'should give correct feedback if steps are inserted', ( done ) ->
            setupThenTest ->
                S1 = new MakeAnything().attr
                    id : 3
                    class : 'SimpleStep'
                    text : '5'
                    "reason citations": [ 'R1' ]
                LDE.insertStructure S1, 'root', 2
                S2 = new MakeAnything().attr
                    id : 4
                    class : 'SimpleStep'
                    text : 'c'
                    "reason citations": [ 'R2' ]
                LDE.insertStructure S2, 'root', 3
                S3 = new MakeAnything().attr
                    id : 5
                    class : 'SimpleStep'
                    text : 'c'
                    "reason citations": [ 'ANY' ]
                LDE.insertStructure S3, 'root', 4
                S4 = new MakeAnything().attr
                    id : 6
                    class : 'SimpleStep'
                    text : 'd'
                    "reason citations": [ 'ANY' ]
                LDE.insertStructure S4, 'root', 5
            , ->
                expect( LDEmessages ).toEqual [
                    type : 'updated LDE state'
                    subject : 'root'
                ,
                    type : 'validation queueing'
                    subject : 3
                ,
                    type : 'validation result'
                    validity : 'valid'
                    subject : 3
                ,
                    type : 'validation queueing'
                    subject : 4
                ,
                    type : 'validation result'
                    validity : 'valid'
                    subject : 4
                ,
                    type : 'validation queueing'
                    subject : 5
                ,
                    type : 'validation result'
                    validity : 'valid'
                    subject : 5
                ,
                    type : 'validation queueing'
                    subject : 6
                ,
                    type : 'validation result'
                    validity : 'invalid'
                    subject : 6
                    components : [
                        type : 'validation result'
                        validity : 'invalid'
                        message : 'd does not match [0-9]+.'
                    ,
                        type : 'validation result'
                        validity : 'invalid'
                        message : 'd does not match [abcABC].'
                    ]
                ,
                    type : 'validation complete'
                    subject : 'OT root'
                    details : 'The validation phase just completed.'
                ]
                OT = LDE.getOutputTree()
                expect( OT.children().length ).toBe 6
                done()

## Template-based rules

This test covers the `TemplateRule` subclass of `OutputRule`.

    describe 'The TemplateRule class', ->

Before running any tests, set up the same infrastructure we've used in all
the tests above.

        class MakeAnything2 extends LDE.Structure::subclasses.MakeAnything
            className : LDE.Structure.addSubclass 'MakeAnything2',
                MakeAnything2
            interpret : ( accessibles, childResults, scope ) ->
                result = LDE.Structure::subclasses
                    .MakeAnything::interpret.apply @,
                        [ accessibles, childResults, scope ]
                for childArray in childResults
                    for child in childArray
                        result[0].insertChild child,
                            result[0].children().length
                result[0].hasLabel = ( label ) ->
                    @id().indexOf( label ) > -1
                result
        LDEmessages = [ ]
        completionCallback = null
        listener = ( event ) ->
            LDEmessages.push event
            if event.type is 'validation complete'
                completionCallback?()
        beforeEach ->
            LDE.Feedback.addEventListener 'feedback', listener
        afterEach ->
            LDE.Feedback.removeEventListener 'feedback', listener
            LDEmessages = [ ]
        setupThenTest = ( setup, test ) ->
            completionCallback = -> test() ; completionCallback = null
            setup()

Make a class for creating OpenMath-based things in the Output Tree.

        class MakeOM extends LDE.InputExpression
            className : LDE.Structure.addSubclass 'MakeOM', MakeOM
            interpret : ( accessibles, childResults, scope ) ->
                if ( OMObj = OM.simple @getAttribute 'OM' )? and \
                   ( OE = OMObj.toOutputExpression() )?
                    for own key, value of @attributes
                        if not /^_|^OM$|^id$|^step$/.test key
                            OE.setAttribute key, value
                    OE.hasLabel = ( label ) -> @id().indexOf( label ) > -1
                    if @getAttribute 'step'
                        OE.validate = LDE.OutputRule.basicValidate
                    [ OE ]
                else [ ]

Be sure the slate is clean.

        it 'should start with IT and OT empty', ->
            LDE.reset()
            expect( LDE.getInputTree().children() ).toEqual [ ]
            expect( LDE.getOutputTree().children() ).toEqual [ ]

Now set up a template-based rule.

        it 'should permit rule setup without feedback', ( done ) ->
            setupThenTest ->
                MP = new MakeAnything2(
                    new MakeOM().attr
                        id : 'MP_1'
                        OM : 'logic.ifthen(P,Q)'
                        premise : yes
                    new MakeOM().attr
                        id : 'MP_2'
                        OM : 'P'
                        premise : yes
                    new MakeOM().attr
                        id : 'MP_3'
                        OM : 'Q'
                ).attr
                    id : 'MP'
                    class : 'TemplateRule'
                LDE.insertStructure MP, 'root', 0
            , ->
                expect( m.type for m in LDEmessages )
                    .toEqual [ 'updated LDE state', 'validation complete' ]
                OT = LDE.getOutputTree()
                expect( OT.children()[0].hasLabel 'MP' ).toBeTruthy()
                expect( OT.children().length ).toBe 1
                done()

Insert a step citing that rule correctly and ensure that the correct
"validation queueing" and "validation result" messages come out of the LDE.

        it 'should give correct feedback on correct steps', ( done ) ->
            setupThenTest ->
                P1 = new MakeOM().attr
                    id : 'P1'
                    OM : 'logic.ifthen(greater(5,2),greater(5,0))'
                P2 = new MakeOM().attr
                    id : 'P2'
                    OM : 'greater(5,2)'
                S1 = new MakeOM().attr
                    id : 'S1'
                    OM : 'greater(5,0)'
                    step : yes
                    "reason citations" : [ 'MP' ]
                    "premise citations" : [ 'P1', 'P2' ]
                LDE.insertStructure P1, 'root', 1
                LDE.insertStructure P2, 'root', 2
                LDE.insertStructure S1, 'root', 3
            , ->
                expect( LDEmessages ).toEqual [
                    type : 'updated LDE state'
                    subject : 'root'
                ,
                    type : 'validation queueing'
                    subject : 'S1'
                ,
                    type : 'validation result'
                    validity : 'valid'
                    subject : 'S1'
                ,
                    type : 'validation complete'
                    subject : 'OT root'
                    details : 'The validation phase just completed.'
                ]
                OT = LDE.getOutputTree()
                expect( OT.children()[0].hasLabel 'MP' ).toBeTruthy()
                expect( OT.children().length ).toBe 4
                done()

Insert a step citing that rule incorrectly and ensure that the correct
"validation queueing" and "validation result" messages come out of the LDE.

        it 'should give correct feedback on incorrect steps', ( done ) ->
            setupThenTest ->
                S2 = new MakeOM().attr
                    id : 'S2'
                    OM : 'greater(5,1)'
                    step : yes
                    "reason citations" : [ 'MP' ]
                    "premise citations" : [ 'P1', 'P2' ]
                LDE.insertStructure S2, 'root', 4
            , ->
                expect( LDEmessages ).toEqual [
                    type : 'updated LDE state'
                    subject : 'root'
                ,
                    type : 'validation queueing'
                    subject : 'S1'
                ,
                    type : 'validation queueing'
                    subject : 'S2'
                ,
                    type : 'validation result'
                    validity : 'valid'
                    subject : 'S1'
                ,
                    type : 'validation result'
                    validity : 'invalid'
                    subject : 'S2'
                    message : 'Cited rule does not justify the step'
                ,
                    type : 'validation complete'
                    subject : 'OT root'
                    details : 'The validation phase just completed.'
                ]
                OT = LDE.getOutputTree()
                expect( OT.children()[0].hasLabel 'MP' ).toBeTruthy()
                expect( OT.children().length ).toBe 5
                done()
