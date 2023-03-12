////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 11a Redux from END")
{
    (<<< "Trying to cheat the subset plus rule.")
    (<<< "Note this DOES validate if we define ⊆+ using a Let with no body.")
    (<<< "But not if we do!")
    // Thm/Pf attempt 
    { :(∈ x T)
      (⊆ S T)
    }
}