////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 11a from END")
{
    (<<< "Trying to cheat the subset plus rule.")
    (<<< "Note this DOES validate if we define ⊆+ using a Let with no body!")
    // Thm/Pf attempt 
    { :(∈ x T)
      (⊆ S T)
    }
} ✔︎