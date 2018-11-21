
# Tests of the Validation process

Here we import the LDE module, because we require all of it in order to test
validation.

    LDE = require '../src/lde.litcoffee'

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
