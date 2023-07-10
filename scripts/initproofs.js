////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading proofs ...\n`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

// const trix = fs.readFileSync('../src/experimental/trix.js', 'utf8');
// eval(trix)

N = load('preddoc',['Prop','Pred'])

preemie = load('preemie','Preemie')
Q = preemie.lastChild().child(1,1,0,1)
badguy = preemie.lastChild().child(1,0,0,3)
// goodguy = preemie.lastChild().child(1,1,1,1)
ghost = preemie.lastChild().child(1,0,0,0)

peano = load('math-299-peano-thm',
             ['Prop','PropThm','Pred','PredThm','Peano','Number Theory'])
badconc = peano.propositions()[257]

// i = peano.getAll('Inst')[2]
// console.log('\npeano loaded\n')
// peano.report(user)
// console.log('')
// badguy.investigate()
// doc = load('math-299-pred',['Prop','PropThm','Pred','PredThm','Number Theory'])

// M=$(`
// { { :Let x P(x) 
//     { :Let y Q(x,y) 
//       {  :Let z  R(x,y,z) } 
//       S(x,y,z) 
//       {  :Let w  U(x,y,z) }  
//       T(x,y,z)
//     } 
//   }
//   { :Let v
//     V(x,y,z,w,v)
//   } 
//   W(x,y,z,v,w)
// }`)
// markDeclaredSymbols(M)
// assignProperNames(M)
// P=M.child(0,1)
// Q=M.child(0,2,1)
// R=M.child(0,2,2,1)
// S=M.child(0,2,3)
// T=M.child(0,3)
// letx = M.child(0,0)
// lety = M.child(0,2,0)
// letz = M.child(0,2,2,0)
// letw = M.child(0,2,4,0)
// letv = M.child(1,0)

// parsers = loadParser('toy')
// $$ = parsers[0]
// trace = parsers[1]

// P = Document.loadProofStr('PeggyProofs')
// testparsers = loadParser('test')
// test = testparsers[0]
// ttest = testparsers[1]

///////////////////////////////////////////////////////////
// closing
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////