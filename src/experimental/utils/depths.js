////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading just the Math 299 proofs ...\n\n`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

// Load Proof Documents
proofdocs = ['prop','pred','peano','midterm'].map( name => 
     loadDoc(`proofs/math299/${name}`))

// for each document, get the array of proofs and combine them into one array
allproofs = proofdocs.reduce((acc, doc) => {
  const proofs = doc.descendantsSatisfying( x => x.isA('Proof') ).map(
    pf => pf.copy()
  )
  return [...acc, ...proofs]
}, [])

const pen = chalk.ansi256(40)
console.log(pen(`${allproofs.length} proofs found\n`))

const depthPicture = LC =>  LC instanceof Environment ?
    '(' + LC.children().map(depthPicture).join('') + ')' :
    '' + LC.address().length 

write(allproofs.map( proof => depthPicture( proof ) ))

///////////////////////////////////////////////////////////
// closing    
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////