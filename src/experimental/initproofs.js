////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not exported to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading proofs ...\n`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

doc = $(
`
{
  Declare or
  Rules:
  { 
    cases> :{ :W or V  :{:W U}  :{:V U}  U }  
    :{ :W   W or V   V or W } 
  }   
  { :P or Q
    { :P  Q or P}
    { :Q  Q or P}
    Q or P by cases
  } 
}
`)
doc = interpret(doc)
validate(doc)

bih = $(
    `
    {
      Declare or
      Rules:
      { 
        :{ :W or V  :{:W U}  :{:V U}  U }  
        :{ :W   W or V   V or W } 
      } 
      Recall
      { :P or Q
        :{ :P  Q or P}
        :{ :Q  Q or P}
        Q or P 
      } 
      { :P or Q
        { :P  Q or P}
        { :Q  Q or P}
        Q or P 
      }
    }
    `)
bih = interpret(bih)
validate(bih)
    

// Accumulator = { totaltime:0, numcalls:0, numsolns:0, numlines: 0}
///////////////////////////////////////////////////////////
// closing
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////