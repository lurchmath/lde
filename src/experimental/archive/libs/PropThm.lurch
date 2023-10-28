//////////////////////////////////
// ND Propositional Logic Theorems
//////////////////////////////////

// We comment out some of these for efficiency, since 'and' and '⇒' and to an 
// extent ⇔ are all 'built-in' to the notation of an LC, and thus rules 
// involving their formal properties are not as useful in this new setting.

{ 
  :{ (or W (¬ W)) }                                 // exclusive middle
  :{ (¬ (¬ W)) ≡ W }                                // double negative
  // :{ (and W W) ≡ W }                                // idempotency of and
  :{ (or W W) ≡ W }                                 // idempotency of or
  // :{ :(and W V) (and V W) }                         // commutativity of and
  :{ :(or W V) (or V W) }                           // commutativity of or
  // :{ :(⇔ W V) (⇔ V W) }                             // commutativity of ⇔
  // :{ (and (and W V) U) ≡ (and W (and V U)) }        // associativity of and
  :{ (or (or W V) U) ≡ (or W (or V U)) }            // associativity of or
  // :{ (⇔ (⇔ W V) U) ≡ (⇔ W (⇔ V U)) }                // associativity of ⇔
  :{ { W (or V U) } ≡ (or (and W V) (and W U)) }  // distributivity of and/or
  :{ (or W (and V U)) ≡ { (or W V) (or W U) } }   // distributivity of or/and
  :{ :(⇒ W V) :(⇒ V U) (⇒ W U) }                    // transitivity of ⇒
  :{ :(⇔ W V) :(⇔ V U) (⇔ W U) }                    // transitivity of ⇔
  :{ (⇒ W V) ≡ (or (¬ W) V) }                       // alternate def of ⇒
  :{ :(or W V) :(¬ W) V }                           // alternate or-  
  :{ :(or W V) :(¬ V) W }                           // alternate or-
  :{ (¬ (⇒ W V)) ≡ { W (¬ V) } }                    // negated implication
  :{ (⇒ W V) ≡ (⇒ (¬ V) (¬ W)) }                    // contrapositive
  :{ (¬ (and W V)) ≡ (or (¬ W) (¬ V)) }             // DeMorgan
  :{ (¬ (or W V)) ≡ { (¬ W) (¬ V) } }               // DeMorgan
  :{ :→← W }                                        // contradiction-
}