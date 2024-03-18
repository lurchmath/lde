////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading proofs ...\n`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

// casesdoc = $(
// `
// {
//   Declare or ⇒
//   Rules:
//   { 
//     cases>
//     :{ :W or V  :{ :W U } :{ :V U }  U }  
//     :{ :W   W or V   V or W } 
//   }   
//   { :P or Q
//     { :P  Q or P}
//     { :Q  Q or P}
//     Q or P by cases
//   } 
// }
// `)
// interpret(casesdoc)
// validate(casesdoc)

// nocasesdoc = $(
//   `
//   {
//     Declare or ⇒
//     Rules:
//     { 
//       :{ :W or V  :W⇒U  :V⇒U  U }  
//       :{ :W   W or V   V or W } 
//       :{ :{ :W V } W⇒V }
//     }   
//     { :P or Q
//       { :P  Q or P}
//       { :Q  Q or P}
//       Q or P
//     } 
//   }
//   `)
//   interpret(nocasesdoc)
//   validate(nocasesdoc)
  
// casesdoc = $(
// `
// {
//   Declare or
//   Rules:
//   { 
//     cases> :{ :W or V  :{:W U}  :{:V U}  U }  
//     :{ :W   W or V   V or W } 
//   }   
//   { :P or Q
//     { :P  Q or P}
//     { :Q  Q or P}
//     Q or P by cases
//   } 
// }
// `)
// interpret(casesdoc)
// validate(casesdoc)

// bih = $(
//     `
//     {
//       Declare or
//       Rules:
//       { 
//         :{ :W or V  :{:W U}  :{:V U}  U }  
//         :{ :W   W or V   V or W } 
//       } 
//       Recall
//       { :P or Q
//         :{ :P  Q or P}
//         :{ :Q  Q or P}
//         Q or P 
//       } 
//       { :P or Q
//         { :P  Q or P}
//         { :Q  Q or P}
//         Q or P 
//       }
//     }
//     `)
// interpret(bih)
// validate(bih)
    
// Disable forbiddenWeenies before using this.
// nobih = $(
//     `
//     {
//       Declare or
//       Rules:
//       { 
//         :{ :W or V  :{:W U}  :{:V U}  U }  
//         :{ :W   W or V   V or W } 
//       } 
//       { :P or Q
//         { :P  Q or P}
//         { :Q  Q or P}
//         Q or P 
//       }
//     }
//     `)
// nobih = interpret(nobih)
// validate(nobih)
    
// doc = $(
//   `
//   {
//     Declare 1 = +
//     Rules:
//     { 
//       :{ :EquationsRule }
//     }   
//     { 
//       :a=b
//       :f(a,a+1)=f(a,a+1)
//       f(a,a+1)=f(a,b+1)
//     } 
//   }
//   `)
// doc = interpret(doc)
// validate(doc)

// doc = $(
//   `
//   {
//     Declare 1 = +
//     Rules:
//     { 
//       :{ :EquationsRule }
//     }   
//     { 
//       :a=b
//       f(a,b+1)=f(a,a+1)
//     } 
//   }
//   `)
// interpret(doc)
// validate(doc)

// trans = loadDoc('proofs/TransChain')

// doc = loadDoc('proofs/math299/peano')
// write(doc.lastChild())

// doc = loadDoc('proofs/test')
// validate(doc)

// doc1 = `
// { 
//   Declare Socrates mortal man is ⇒

//   Assume forall x. x is a man ⇒ x is mortal
//   Assume Socrates is a man
//   Socrates is mortal
// }`

// doc2 = `
// { 
//   Declare Socrates mortal man is ⇒

//   Rules:
//   {
//     :{ :W⇒V :W V }
//     :{ :(∀y.𝜆P(y)) 𝜆P(z) }
//   }
//   Assume forall x. x is a man ⇒ x is mortal
//   Assume Socrates is a man
//   Socrates is mortal
// }
// `

// doc3 = `
// { 
//   Declare Socrates mortal man is ⇒ ∀

//   Rules:
//   {
//     :{ :W⇒V :W V }
//     :{ :(∀y.𝜆P(y)) 𝜆P(z) }
//   }
  
//   ➤ 
//   ➤ "All men are mortal."
//   ➤ "Socrates is a man."
//   ➤ "Socrates is mortal."
//   ➤ 
  
//   Assume forall x. x is a man ⇒ x is mortal
//   Assume Socrates is a man
  
//   Socrates is a man ⇒ Socrates is mortal
  
//   Socrates is mortal
// }
// `

// doc4 =
// `{ 
//   Declare Socrates mortal man is

//   Rule:  :{ :W is man   W is a mortal }
  
//   Assume Socrates is a man
  
//   Socrates is mortal
// }
// `

// matchMaker = (decl,pstr,estr) => {
//   let doc = $(`{
//     Declare ${decl}
//     Rule: :{ ${pstr} }
//     ${estr}
//   }`)
//   interpret(doc)
//   doc.report(all)
//   const p = doc.child(2,0)
//   const e = doc.child(3)
//   const ans = matchPropositions(p,e)
//   return ans.toString().split(/(?<=}),(?={)/)
//             .map( s=>s.slice(1,-1) )
//             .map( s=>s.split(/(?<=\)),(?=\()/) )
//             .map( s=>s.map( x=>x.replace(/__/g,'') ) )
//             .map( s=>s.map( x=>x.replace(/\(([^,]+),(.+)\)$/g,'$1=$2') ) )
// }

// doc=loadDoc('proofs/math299/reals')

// test = `
// {
//   Declare or 
  
//   Rule: :{ :W or V :W⇒U :V⇒U U }
//   Rule: :{ :{ :W V } W⇒V }  
  
//   Theorem: { :{ :P Q } :P or Q  Q }
  
//   ➤ "Proof:"
//   { :{ :P Q }
//     :P or Q
//     P⇒Q
//     Q⇒Q
//     Q
//   }
// }
// `
// t=$(test)
// validate(t)
// docstr=`{ :{ a ≡ b c ≡ d ≡ e f }  :{ h i ≡ j } :{ {k l} ≡ m } p q}`
// console.log(docstr)
// doc=$(docstr)
// interpret(doc)
// write(doc)

// nice=loadDoc('proofs/aim/nicepeano')
// write(nice)

// hello=loadDoc('proofs/aim/hello')
// write(hello)
// one=loadDoc('proofs/aim/oneplusone')
// write(one)
// oscar=loadDoc('proofs/oscar/dm')
// write(oscar)
// injective=loadDoc('proofs/aim/injective')
// write(injective)
// induction=loadDoc('proofs/aim/induction')
// write(induction)
// use=loadDoc('proofs/aim/use')
// write(use)
// propex=loadDoc('proofs/math299/propEx')
// write(propex)

// doc = $(
//   `{   
//     Declare prime or is 
//     23 is prime by CAS("isprime(23)")
//     91 is prime by CAS("isprime(91)")
//     23 is prime by CAS
//     91 is prime by CAS
//   }`)
// validate(doc)
// doc.report(nice)

// doc = loadDoc('proofs/math299/functions')
// validate(doc)
// write(doc)
// const mj = require('mathjax-node')

// // Initialize MathJax
// mj.start()

// // Your LaTeX string
// const latexString = 'P\\Rightarrow Q\\text{ and }\\left(R\\text{ or }Q\\right)\\Leftrightarrow \\neg R'

// // Options for MathJax
// const options = {
//   format: 'TeX',
//   math: latexString,
//   html: true,
//   css: true,
//   fontURL: 'node_modules/mathjax/fonts/HTML-CSS'
// }

// // Typeset the LaTeX string
// mj.typeset(options, (data) => {
//   if (!data.errors) {
//     // Access the resulting SVG
//     const out = data.html
//     console.log(out)
//   } else {
//     console.error(data.errors)
//   }
// })

// LurchOpti91spdateFreq = 1
// LurchOptions.updateProgress =(pass, tot, percent ) => g(`Pass ${pass} has ${tot}`)
// }
// Accumulator = { totaltime:0, numcalls:0, numsolns:0, numlines: 0}

// S= ()=>{
//   console.log("hello")
//   let S = setTimeout(() => {
//     console.log( 'five seconds passed')
//   }, 5000)
//   console.log("bye")  
// }

// async function parallel(arr, fn, threads = 2) {
//   const result = [];
//   while (arr.length) {
//     const res = await Promise.all(arr.splice(0, threads).map(x => fn(x)));
//     result.push(res);
//   }
//   return result.flat();
// }

// test=loadDoc('proofs/test')
// write(test)
// console.log(`tex('Declare ∀ ∃ ∃! ='`)
// write(tex('Declare ∀ ∃ ∃! ='))

// fname='lurch-parser-docs-template'

parsers = loadParser('lurch-to-tex')
p = (s,o) => parsers.parse(s,o)
t = parsers.trace
r = parsers.raw

doc=loadDocStr('libs/Sets')

//////////////////////////////////////////////////////////
// closing
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////