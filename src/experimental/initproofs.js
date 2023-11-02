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

// doc2 = $(
//   `
//   {
//     Declare 1 = +
//     Rules:
//     { 
//       :{ Equations_Rule }
//     }   
//     { 
//       :a=b
//       f(a,a+1)=f(a,b+1)
//     } 
//   }
//   `)
// interpret(doc2)
// validate(doc2)

// trans = loadDoc('proofs/TransChain')

doc = loadDoc('proofs/math299/peanotranschain')


// Accumulator = { totaltime:0, numcalls:0, numsolns:0, numlines: 0}
///////////////////////////////////////////////////////////
// closing
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////