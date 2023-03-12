////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 7 from END")
{
  (<<< "Beginner's mistake")
  { :(∀ x , (∃ y , (P x y)))
    {:[ z , (∀ x , (P x c)) ]
      (∃ y , (P z y))
      [ c , (P z c) ]
    }
    (<<< "Expect incorrect:")
    (∀ x , (P x c))          
    (∃ y , (∀ x , (P z c)))     
  }
      
}