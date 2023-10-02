////////////////////////////////////////////////////////////////////////////
// WARNING: putting let or const in front of a definition will cause it to 
// be local to the init file and not expored to the Lode global.  Don't use
// const or let for things you want to export.
////////////////////////////////////////////////////////////////////////////
// opening
process.stdout.write(defaultPen(`Loading Ken's init file...`))
let start = Date.now()
////////////////////////////////////////////////////////////////////////////

// small example lcs
Pierce = lc(`{ :{ :{ :P Q } P } P }`)
BadLC = lc(`:{ :{ :W :V U V } :W :V U }`)
SimpleSwitch = lc('{:{:{:A B} {:A C}} {:{:B C} C}}')
Shunting = lc('{ :{ :G { :A B } } { :G :A B } }')
Contrapositive = lc(`
    {
      :{:{:A B} C}
      :{:{:D E} B}
      :{:{:F G} E}
      :{:D :H G}
      :{:A :F H}
      {:A {:D {:F H G} E} B}
      C
    }`)
    
// A tiny Lib
tinyLib=lc(`
{ :[∀ ∃ ⇒ P]
  :{ :{ :W V } (⇒ W V) }
  :{ :(⇒ W V) :W V }
  :{ :{ :[x] (@ W x)} (∀ y , (@ W y)) }
  :{ :(∀ y , (@ W y)) (@ W t) }
  :{ :(∃ y , (@ W y)) [ c , (@ W c) ] }
  :{ :(@ W t) (∃ y , (@ W y))}
}`)

// A tiny doc
tinyDoc=lc(`
{ 
  { :(∃ x , (∀ y, (P x y)))
    [ c, (∀ y , (P c y)) ]
  }  
}`)
// tinydoc
tiny = makeDoc(tinyLib,tinyDoc)
newtiny = processDoc(tiny)
 
theEndLib = lc(`
{ :{ :{ :L P } :E A }
  :{ :{ :L P } E }
}`)

theEndDoc = lc(`
{ { :L :P A }
}`)
 
theEnd = makeDoc(theEndLib,theEndDoc)
newEnd = processDoc(theEnd)

// minimal working example    
doc = lc( `{:[∃ 'LDE EFA'] { :(∃ y, ('LDE EFA' W y)) anything } }`)
f = Formula.from(doc.child(1),true)
p = f.child(0)
e = lc(`(∃ x , (∀ y , (P x y)))`)
soln = [...new Problem(p,e).solutions()][0];soln.toString()
inst = Formula.instantiate(p,soln)    
 
// debugging validateall()
mini=lc(`{ :P R P }`)
mini.validateall()
target=mini.child(2) 

const test = putdown => {
    const LC = LogicConcept.fromPutdown( putdown )[0]
    console.log()
    showall(LC)
    toCanonicalBindings( LC )
    showall(LC)
    console.log()
}

test1 = lc( '(forall x , (exists y , (P x y)))' )
test2 = lc( '(forall x , (exists x , (P x x)))' )
test3 = lc( '(forall x , (and (exists x , (P x 3)) (exists z , (x y z))))' )

badLib = lc(`
{ :[ ∀ ]
  :{ :{:[x] (@ P x)} (∀ z , (@ P z)) }
}`)

badDoc = lc(`
{ 
  :[n] :(≤ 0 n)   
  (∀ n , (≤ 0 n))
}`)
 
bad = makeDoc(badLib,badDoc)
newbad = processDoc(bad)

transEq = lc(`
 {
   { :(= y z) :(= x y) (= x z) } <<
 }  
`) 
trans=makeDoc(LurchLib,transEq)
trans=processDoc(trans)
instantiate(trans)
trans.validateall()

exMid=lc(`
  {
    { :(¬ (or P (¬ P)))
      { :P
        (or P (¬ P))
        →← 
      }
      (¬ P)
      (or P (¬ P))
      →←
    }
    (or P (¬ P))
  }
`)
exclmid=makeDoc(exMid)
exclmid=processDoc(exclmid)
instantiate(exclmid,4)
exclmid.validateall()

compInjDoc = lc(`
  { // substitution needs BIH's currently
    { :(= ((∘ g f) x) (g (f x)) ) 
      :(= ((∘ g f) x) ((∘ g f) y))
      (= (g (f x)) ((∘ g f) y)) 
    } <<
    { :(= ((∘ g f) y) (g (f y)) ) 
      :(= (g (f x)) ((∘ g f) y))
      (= (g (f x)) (g (f y))) 
    } <<
    // the 'actual' proof 
    :(injective f) :(injective g)
    {:[x] 
      {:[y] 
       :(= ((∘ g f) x) ((∘ g f) y))
        (= ((∘ g f) x) (g (f x)) )
        (= ((∘ g f) y) (g (f y)))
        (= (g (f x)) ((∘ g f) y))
        (= (g (f x)) (g (f y))) 
        (= (f x) (f y))
        (= x y)
      } 
    }
    (injective (∘ g f))
  }
`)
inj=makeDoc(compInjDoc)
inj=processDoc(inj)
instantiate(inj,4)
inj.validateall()

// let ShortContra = lc(`
//         {
//           :{:{:A B} C}
//           :{:{:D E} B}
//           :{:{:F G} E}
//           :{:D :H G}
//           :{:A :F H}
//           C
//         }`)
// let commAnd = lc(`
//   { :{ :{ :(and W V) (and V W) } (⇒ and(W,V) and(V,W)) }
//     :{ :W :V (and W V) (and V W) }
//     :{ :(and W V) W V }
//        { :(and W V)
//          W
//          V
//          (and V W)
//        }
//     (⇒ (and W V) (and V W))
//   }`)
// let shortCommAnd = lc(`
//     { :{ :{ :(and A B) (and B A) } (⇒ (and A B) (and B A)) }
//       :{ :A :B (and A B) (and B A) }
//       :{ :(and A B) A B }
//          { :(and A B)
//            (and B A)
//          }
//       (⇒ (and A B) (and B A))
//     }`)
// 
// let test=lc(`{ :[c] (c D) E }`)
// Scoping.validate(test)
// test.children().forEach(L=>setDeclarationContext(L,computeDeclarationContext(L)))
// 
// let F = lc(`{ :[c] { :W (c Z) } }`)
// markDeclaredSymbols(F)
// let formula = Formula.from(F.child(1))
// let f1=formula.child(0)
// let f2=formula.child(1)
// 
// let e1 = test.child(1)
// let e2 = test.child(2)
// 
// let solns1 = [ ...new Problem(f1,e1).solutions() ]
// let s1=solns1[0]
// let inst1 = Formula.instantiate(formula,s1)
// 
// let solns2 = [ ...new Problem(f2,e1).solutions() ]
// let s2=solns2[0]
// let inst2 = Formula.instantiate(formula,s2)
// 
// let solns3 = [ ...new Problem(f1,e2).solutions() ]
// let s3=solns3[0]
// let inst3 = Formula.instantiate(formula,s3)

// let L = lc(`{ :[B] << :{ :A (B C) } { { :x (B y) } << {:P P} } }`)
// markDeclaredSymbols(L)
// markFormulas(L)
// 
// w=lc(`{ :[x] [ y x a, (a x y) ] }`)
// c=doc.lastChild().child(1,1,2,1)

///////////////////////////////////////////////////////////
// closing    
console.log(defaultPen(`done! (${(Date.now()-start)} ms)`))
// don't echo anything
undefined
///////////////////////////////////////////////////////////