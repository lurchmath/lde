////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading proofs ...`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

// peano = load('math-299-peano',
//              ['Prop','PropThm','Pred','PredThm','Peano','Number Theory'])
// console.log('peano loaded')
// peano.lastChild().report(user)

ex=lc(`(∀ y , (⇒ (< 2 y)) (∀ x , (< 1 x)))`)
renameBindings(ex)

///////////////////////////////////////////////////////////
// closing    
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////