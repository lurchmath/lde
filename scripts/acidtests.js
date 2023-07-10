////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading the acid tests ...\n\n`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

const biglib = ['Prop','PropThm','Pred','PredThm','Peano','Number Theory']
// Load Acid Tests
acid=[1,4,5,6,7,8,9,10,'11a','11b','11c','11d','11e'].map( (ex,k) => 
     load(`acid tests/acid ${k} Example ${ex}.lurch`,`Acid Tests`))
// Load Math 299 tests
acid.push(load('math-299-prop','Prop'))
acid.push(load('math-299-pred',['Prop','Pred']))
acid.push(load('math-299-peano',biglib))
// Load user theorem tests
acid.push(load('thm',biglib))
acid.push(load('thm2',biglib))

let passed = 0
let failed = 0
acid.forEach( (T,k) => {
  T.descendantsSatisfying( x => x.expectedResult ).forEach( (s,i) => {
    if (Validation.result(s) && Validation.result(s).result==s.expectedResult) {
      console.log(`Test ${k}.${i} → ok`)
      passed++
    } else {
      console.log(`\nTest ${k}.${i} → FAIL!!\n`)
      failed++
    }
  })
})

const pen = (!failed) ? chalk.ansi256(40) : chalk.ansi256(9)
console.log(pen(`\n${passed} tests passed - ${failed} tests failed\n`))
console.log(`Test result stored in the array 'acid'\n`)

// acid.forEach((x,k)=>{console.log('\nTest #'+k+'\n');x.report(user)})

///////////////////////////////////////////////////////////
// closing    
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////