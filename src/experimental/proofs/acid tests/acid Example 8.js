////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 8 from END (generalizing a constant expression)")
{
  (<<< "Thm: 1<1")
  { 
    {:[ z ]
     :(< 1 1) 
      (< 1 1)                 
    }
    (∀ x , (< 1 1))         // ∀+
    (< 1 1)                 // ∀-
  }
      
}