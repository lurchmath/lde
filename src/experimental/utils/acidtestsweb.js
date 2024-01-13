////////////////////////////////////////////////////////////////////////////
//  Acid Tests
//
// This exports a function to run our acid tests.
//

export const test = async (exppath = 'lde/src/experimental') => {

  const defaultCSS = 'color: #00CCFF; font-family: "Andale Mono 18", monospace;'
  const successCSS = 'color: #00CC00;'
  const failCSS = 'color: #FF0000;'
  const itemCSS = 'color: #ff9900;'
  const stringCSS = 'color: #008000;'
  const checkCSS = 'color: #00FF00;'
  
  console.log(`%cLoading the acid tests ...\n\n`,defaultCSS)
  let start = Date.now()
  ////////////////////////////////////////////////////////////////////////////
  
  // Load Acid Tests
  // Array.seq(k=>k,0,13).map( k => loadDoc(`proofs/acid tests/acid ${k}`))
  let acid = await Promise.all(Array.seq(k=>k,0,13).map( 
      (k) => loadDoc(`proofs/acid tests/acid ${k}`,exppath)))
  // Load other tests in the acid tests folder
  acid.push(await loadDoc('proofs/acid tests/Transitive Chains',exppath))
  acid.push(await loadDoc('proofs/acid tests/Cases',exppath))
  acid.push(await loadDoc('proofs/acid tests/BIH Cases',exppath))
  acid.push(await loadDoc('proofs/acid tests/user-thms',exppath))
  // Load Math 299 tests
  acid.push(await loadDoc('proofs/math299/prop',exppath))
  acid.push(await loadDoc('proofs/math299/pred',exppath))
  acid.push(await loadDoc('proofs/math299/peanoBIH',exppath)) 
  acid.push(await loadDoc('proofs/math299/peano',exppath)) 
  acid.push(await loadDoc('proofs/math299/midterm',exppath))
  acid.push(await loadDoc('proofs/math299/recursion',exppath))
  acid.push(await loadDoc('proofs/math299/reals',exppath))
  
  // run the tests
  let passed = 0
  let failed = 0
  let numchecks = 0
  let numreds = 0
  
  // test the asciimath Peggy parser by itself
  try { 
    const str = await loadDocStr('parsers/LurchParserTests',exppath)
    const s = lc(parse(str))
    passed++
    console.log(`%cParser Test:' → ok`,itemCSS)
  } catch (e) { 
    failed++
    console.log(`%cERROR: LurchMath peggy parser test failed.`,failCSS) 
  }
  
  acid.forEach( (T,k) => {
    // for each test, find the first comment if any and use that as the
    // description of the test file
    const desc = T.find(x=>x.isAComment())?.child(1)
    console.log(`Test ${k}: %c${desc}`,stringCSS)
  
    T.descendantsSatisfying( x => x.hasAttribute('ExpectedResult') ).forEach( (s,i) => {
      if (Validation.result(s) && 
          Validation.result(s).result==s.getAttribute('ExpectedResult')) {
        console.log(`  Test ${k}.${i} → ok`)
        passed++
      } else {
        console.log(`\n%c  Test ${k}.${i} → FAIL!!\n`,failCSS)
        failed++
      }
    })
  
    T.descendantsSatisfying( x => {
      const result = x.getAttribute('validation result')?.result
      if (result==='valid') ++numchecks  
      if ( result==='indeterminate' || result==='invalid' ) ++numreds
    })
  })
  
  const pen = (!failed) ? successCSS : failCSS
  console.log(`\n%c${passed} tests passed - ${failed} tests failed\n`,pen)
  console.log(
    `%c${numchecks}%c green checks\n%c${numreds}%c red marks`,
    checkCSS,'',checkCSS,'')
  console.log(`%cTest result stored in the array 'acid'\n`,defaultCSS)
  
  // acid.forEach((x,k)=>{console.log('\nTest #'+k+'\n');x.report(user)})
  
  ///////////////////////////////////////////////////////////
  // closing    
  console.log(`%cdone! (${(Date.now()-start)} ms)`,defaultCSS)
// don't echo anything
}
///////////////////////////////////////////////////////////