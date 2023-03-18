////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 5 from END")
{
  // Thm: Equality is symmetric and transitive.
  (<<< "Thm: Equality is symmetric and transitive.")
  { :(= x y) :(= y z) (= y x) (= x z) }
  
  // Proof:
  { :(= x y) :(= y z)
     (= x x) 
     (= y x) { :(= x y) :(= x x) (= y x) } <<
     (= x z) { :(= y z) :(= x y) (= x z) } <<
  }  
} ✔︎