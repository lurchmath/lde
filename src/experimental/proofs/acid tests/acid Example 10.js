////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 10 from END")
{
    (<<< "Lets now have a specific meaning, so this should not work.")
    :{ :[x] B }  // given
    {
      B            // this should trivially validate, 
    }              // even if B contains x
}