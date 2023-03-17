////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading the acid tests ...`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

const biglib = ['Prop','PropThm','PredThm','Peano','Number Theory']
// Load Acid Tests
acid=[1,4,5,6,7,8,9,10,'11a','11b','11c','11d','11e'].map( n => load('acid tests/acid Example '+n,'Acid Tests'))
// Load Math 299 tests
acid.push(load('math-299-prop','Prop'))
acid.push(load('math-299-pred',['Prop','Pred']))
acid.push(load('math-299-peano',biglib))
// Load user theorem tests
acid.push(load('thm',biglib))
acid.push(load('thm2',biglib))

console.log(`\nTest result stored in the array 'acid'`)

///////////////////////////////////////////////////////////
// closing    
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////