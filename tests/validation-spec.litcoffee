
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
            OS1.validate = ( callback ) -> callback()
            OS2 = new LDE.OutputStructure().attr id : 2
            OS2.validate = ( callback ) -> callback()
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

        it 'lets us clear out the queue manually during testing', ->
            expect( LDE.ValidationQueue.length ).toBeGreaterThan 0
            while LDE.ValidationQueue.length > 0
                expect( -> LDE.ValidationQueue.pop() ).not.toThrow()
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
                os.validate = ( callback ) -> callback()

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

        it 'lets us clear out the queue manually when cleaning up', ->
            expect( LDE.ValidationQueue.length ).toBeGreaterThan 0
            while LDE.ValidationQueue.length > 0
                expect( -> LDE.ValidationQueue.pop() ).not.toThrow()
            expect( LDE.ValidationQueue.length ).toBe 0

When we're done, put all the workers back.

        it 'lets us put all workers back when done testing', ->
            for worker in LDE.WorkerPool
                expect( -> LDE.WorkerPool.giveWorkerBack worker )
                    .not.toThrow()
            expect( LDE.WorkerPool.numberAvailable() )
                .toBe LDE.WorkerPool.length

Tests that remain:

 * Resetting the LDE clears the queue without validating anything
   (This has not yet been implemented, so build that first.)
 * That same reset also makes all workers available again

## Dequeueing tests

These tests have not yet been written.  They should include:

 * When workers are available, dequeue is called the instant something is
   enqueued
 * Dequeue happens from the high-priority end of the queue
 * Dequeue does nothing if the queue is empty
 * Dequeue does nothing if in the Modification/Interpretation phase
 * Dequeue does nothing if it can't get an available worker
 * Dequeue starts a worker validating the dequeued thing
