////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 4 from END")
{
  // Thm 4: If ∃x,∀y,Q(x,y) then ∀y,∃x,Q(x,y)
  (<<< "Thm 4: If ∃x,∀y,Q(x,y) then ∀y,∃x,Q(x,y)")
  { :(∃ x , (∀ y , (Q x y))) (∀ y , (∃ x , (Q x y))) }
  
  // Proof:
  { :(∃ x , (∀ y , (Q x y)))
     {:[z,(∀ y , (∃ x , (Q x y)))]
       [c , (∀ y , (Q c y)) ] 
       (Q c z)
       (∃ x , (Q x z))
     }
     (∀ y , (∃ x , (Q x y)))
  }  
} ✔︎