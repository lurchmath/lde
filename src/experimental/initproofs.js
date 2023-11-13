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
//       :{ Equations_Rule }
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
//       :{ Equations_Rule }
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

doc1 = `
{ 
  Declare Socrates mortal man is ⇒

  Assume forall x. x is a man ⇒ x is mortal
  Assume Socrates is a man
  Socrates is mortal
}`

doc2 = `
{ 
  Declare Socrates mortal man is ⇒

  Rules:
  {
    :{ :W⇒V :W V }
    :{ :(∀y.𝜆P(y)) 𝜆P(z) }
  }
  Assume forall x. x is a man ⇒ x is mortal
  Assume Socrates is a man
  Socrates is mortal
}
`

doc3 = `
{ 
  Declare Socrates mortal man is ⇒

  Rules:
  {
    :{ :W⇒V :W V }
    :{ :(∀y.𝜆P(y)) 𝜆P(z) }
  }
  
  ➤ 
  ➤ "All men are mortal."
  ➤ "Socrates is a man."
  ➤ "Socrates is mortal."
  ➤ 
  
  Assume forall x. x is a man ⇒ x is mortal
  Assume Socrates is a man
  
  Socrates is a man ⇒ Socrates is mortal
  
  Socrates is mortal
}
`

doc4 =
`{ 
  Declare Socrates mortal man is

  Rule:  :{ :W is man W is a mortal }
  
  Assume Socrates is a man
  
  Socrates is mortal
}
`



// Accumulator = { totaltime:0, numcalls:0, numsolns:0, numlines: 0}
///////////////////////////////////////////////////////////
// closing
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////