////////////////////////////////////////////////////////////////////////////
//  Acid Tests
//
// This exports a function to run our acid tests.
//

export const test = async () => {

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
  let acid = await Promise.all([1,4,5,6,7,8,9,10,'11a','11b','11c','11d','11e','Induction'].map( 
      (ex,k) => loadDoc(`../proofs/acid tests/acid ${k} Example ${ex}`)))
  // Load other tests in the acid tests folder
  acid.push(await loadDoc('../proofs/acid tests/Transitive Chains'))
  acid.push(await loadDoc('../proofs/acid tests/Cases'))
  acid.push(await loadDoc('../proofs/acid tests/BIH Cases'))
  acid.push(await loadDoc('../proofs/acid tests/user-thms'))
  // Load Math 299 tests
  acid.push(await loadDoc('../proofs/math299/prop'))
  acid.push(await loadDoc('../proofs/math299/pred'))
  acid.push(await loadDoc('../proofs/math299/peanoBIH')) 
  acid.push(await loadDoc('../proofs/math299/peano')) 
  acid.push(await loadDoc('../proofs/math299/midterm'))
  
  // run the tests
  let passed = 0
  let failed = 0
  let numchecks = 0
  let numreds = 0
  
  // test the asciimath Peggy parser by itself
  try { 
    const str = await loadDocStr('./parsers/asciiParserTests')
    const s = lc(parse(str))
    passed++
    console.log(`%cParser Test:' → ok`,itemCSS)
  } catch (e) { 
    failed++
    console.log(`%cERROR: asciimath peggy parser test failed.`,failCSS) 
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