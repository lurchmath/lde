////////////////////////////////////////////////////////////////////
// Acid Test Proofs
// 
// These are the example and counterexample proofs from the END document

(<<< "Example 6 from END")
{
  // Thm: Fine's tests case
  (<<< "Thm: Fine's test case")
  { :(∃ x , (∃ y , (∀ u , (∀ v , (F x y u v)))))  
    (∃ y , (∀ v , (∃ u , (∃ x , (F x y u v)))))  
  }

  (<<< "Proof:")
  {
    :(∃ x , (∃ y , (∀ u , (∀ v , (F x y u v))))) 
    [ c , (∃ y , (∀ u , (∀ v , (F c y u v)))) ] 
    [ d , (∀ u , (∀ v , (F c d u v))) ] 
    { :[ z , (∀ v , (∃ u , (∃ x , (F x d u v)))) ]
       (∀ v , (F c d z v)) 
       (F c d z z) 
       (∃ x , (F x d z z)) 
       (∃ u , (∃ x , (F x d u z))) 
    }
    (∀ v , (∃ u , (∃ x , (F x d u v)))) 
    (∃ y , (∀ v , (∃ u , (∃ x , (F x y u v))))) 
  }    
}