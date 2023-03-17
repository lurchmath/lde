////////////////////////////////////////////////////////////////////
// Peano Test Proofs
// 

(<<< "Testing User Theorems")

{
  (<<< "Theorem 7.5: Associativity of Addition")
  { (= (+ (+ m n) p) (+ m (+ n p)) ) } <<thm

  (<<< "Proof: (by induction on p for arbitrary m,n")
  { 
    (<<< "Base case:")
    { :(= (+ n 0) n) 
      :(= (+ (+ m n) 0) (+ m n))
      (= (+ (+ m n) 0) (+ m (+ n 0))) 
    } <<
    (<<< "Inductive step:")
    { :[k]
      :(= (+ (+ m n) k) (+ m (+ n k)) )
      { :(= (+ (+ m n) k) (+ m (+ n k)) )
        :(= (+ (+ m n) (𝜎 k)) (𝜎 (+ (+ m n) k)))
        (= (+ (+ m n) (𝜎 k)) (𝜎 (+ m (+ n k))))
      } <<
      { :(= (+ m (𝜎 (+ n k))) (𝜎 (+ m (+ n k))))
        :(= (+ (+ m n) (𝜎 k)) (𝜎 (+ m (+ n k))))
        (= (+ (+ m n) (𝜎 k)) (+ m (𝜎 (+ n k))))
      } <<
      { :(= (+ n (𝜎 k)) (𝜎 (+ n k)))
        :(= (+ (+ m n) (𝜎 k)) (+ m (𝜎 (+ n k))))
        (= (+ (+ m n) (𝜎 k)) (+ m (+ n (𝜎 k))))
      } <<
    }
    (<<< "Therefore, by induction")
    (∀ p, (= (+ (+ m n) p) (+ m (+ n p)) ))
    (= (+ (+ m n) p) (+ m (+ n p)) )
  }
  
  (<<< "Corollary")
  (= (+ (+ 2 1) 3) (+ 2 (+ 1 3)) )
}
