
// This is just a file containing functions that are useful during testing.
// These functions are not part of the actual library we're building.
// They're used in the test suite only.


// I'm rolling my own spy functions, because chai's are annoying to use in
// the browser.  Use like so:
// 
// f = makeSpy()
// f.callRecord will be [ ]
// someFunction( arg1, arg2, f ) // callback = f
// Once the callback has been called, f.callRecord will be [ A ],
// where A is an array of the args with which it was calleed.
// If it is called again, then you will have [ A1, A2 ], and so on.
// Note that this creates nested arrays.  A single call to f with a
// single argument generates [ [ arg ] ], not [ arg ].
export const makeSpy = () => {
    const result = ( ...args ) => result.callRecord.push( args )
    result.callRecord = [ ]
    return result
}
