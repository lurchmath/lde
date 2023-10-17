////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading proofs ...\n`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

// comm = load($(Document.loadPegStr('math-299-peano')),['Prop','PropThm','Pred','PredThm','Peano2','Number Theory'])
// ken = load($(Document.loadPegStr('ken')),['Prop','PropThm','Pred','PredThm','Peano2','Number Theory'])
// write(ken.lastChild())
// const trix = fs.readFileSync('../src/experimental/trix.js', 'utf8');
// eval(trix)

// check = n => { acid[n].validateall(undefined,true); return acid[n] }
// N = load('preddoc',['Prop','Pred'])

// preemie = load('preemie','Preemie')
// Q = preemie.lastChild().child(1,1,0,1)
// badguy = preemie.lastChild().child(1,0,0,3)
// // goodguy = preemie.lastChild().child(1,1,1,1)
// ghost = preemie.lastChild().child(1,0,0,0)

// peano = load('math-299-peano-thm',['Prop','Pred','Peano'])
// badconc = peano.child(51,2,2,1,1,2)
// // say(stringPen(CNFProp.fromLC(peano,undefined,badconc,true).toNice(peano.cat)))

// T=$(`{ :{ :{ :A B } C } :{ :D :{ :A :B E } C } :{ :C F } :D { F } }`)
// T.cat=T.catalog()
// T.validate()
// T

// initialize('acidtests')
// // TODO: upgrade this as a utility
// A=acid[13]
// kids=A.children().filter(x=>x.isA('Inst')).map(x=>x.address()).flat()
// write(kids)
// C=A.lastChild().child(0,2,1,4,2)
// write(C)
// newkids = [...kids]
// kids.forEach( n => {
//   Validation.setResult(C , { result:'valid' , reason: 'n-compact' })
//   let kid=A.child(n)
//   kid.ignore=true
//   if (A.validate(C , true)) { 
//     newkids.splice(newkids.indexOf(n),1)
//   } else {
//     kid.ignore = false
//   } 
// })
// A.toNice(C,true)
// write(newkids)

// bug = load('math-299-pred',['Prop','Pred'])
// bug.validateall(bug,true)
// tar = bug.child(545,0,4,1,0,3,3)

// falseCNFProp = CNFProp.fromLC(bug,bug.cat,tar,false)
// trueCNFProp = CNFProp.fromLC(bug,bug.cat,tar,true)

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

// testparsers = loadParser('toy')
// test = testparsers[0]
// ttest = testparsers[1]

// asciiparsers = loadParser('asciimath')
// ascii = asciiparsers[0]
// asciitrace = asciiparsers[1]

// PeggyTests = loadProofStr('PeggyTests')

// write(lc(parse(PeggyTests)))

// doc=$(`{ a=1
//          b=2 
//          { c=3
//            d=4 
//            :Let n be such that n>0
//            k>0 for some k 
//            e=5
//            f=6
//          }
//          g=7
//          h=8
//        }`)

// Load
system = lc(`:[ 'LDE EFA' '---' ]`).asA('Declare')
A=loadLibStr('Acid Tests')
B=loadProofStr('acid tests/acid 1 Example 4')
doc=$(
`{ Rules: «${A}» 
   «${B}»
   Notice { :2=3 3=3 }
   Notice { 2=2 }
 }`
)
doc.unshiftChild(system)
doc.child(2,0).makeIntoA('Declare')

// Prep
interpret(doc)

// validate
validate(doc)

doc.report(everything)

// Accumulator = { totaltime:0, numcalls:0, numsolns:0, numlines: 0}

///////////////////////////////////////////////////////////
// closing
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////