////////////////////////////////
// ND Predicate Logic Theorems
////////////////////////////////

// Notes: 
// * symmetry and transitivity of equality is inefficient and mainly useful for
//   the alternate substitutions rule, and they aren't needed because you
//   basically get both for free between the substitution and alternate 
//   substitution rules
// * commutative of ∀ and ∃ rules are probably more efficiently handled with
//   something like (∀ x y, (@ P x y)) vs (∀ y x, (@ P x y)) but it's not clear
//   the best way to do that in practice yet

{ 
  // :{ :(= x y) (= y x) }            // symmetry of equality
  // :{ :(= x y) :(= y z) (= x z) }      // transitivity of equality
  :{ :(= x y) :(@ P y) (@ P x) }     // alternate substutition
  // :( :(∀ x, (∀ y, (@ P x y))) (∀ y, (∀ x, (@ P x y))) } // commutativity
  // :( :(∃ x, (∃ y, (@ P x y))) (∃ y, (∃ x, (@ P x y))) } // commutativity
  :{ { (∀ x, (@ P x)) (∀ y, (@ Q y)) } ≡ 
     (∀ x, (and (@ P x) (@ Q x))) }   // distributivity
  :{ { (∃ x, (@ P x)) (∃ y, (@ Q y)) } ≡ 
     (∃ x, (or (@ P x) (@ Q x))) }    // distributivity
  :{ (∃! x, (@ W x)) ≡ (∃ c, (∀ z, (⇔ (@ W z) (= z c)))) } // alternate def of ∃!
} 