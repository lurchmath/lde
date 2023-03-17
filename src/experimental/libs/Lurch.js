////////////////////////////////////////////////////////////////////////////
// Lurch Lib
//
// This file contains most of the rules (definitions, axioms, and theorems) 
// from the Lurch desktop library as formulas.  Unlike AllofLurch, or 
// EvenMoreLurch, we do not encode instantiations of these formulas by hand
// but rather let the validation algorithms for dealing with formulas find
// the correct instantiations and insert them as needed.
//
// As such, this can be thought of as an actual Lurch library that a user
// might include as a dependency.  We intend to add utilities to do just that
// in Lode.
//

{ // Global Constants - we don't want any of these to be metavariables
  :[ and or ⇒ ⇔ ¬ →← ∀ ∃ = @ Set ∈ ⊆ ℘ - → Domain Codomain Range id ∘ injective ]
  
  ////////////////////////////////
  // ND Propositional Logic Axioms
  ////////////////////////////////
  :{ :W :V  (and W V) }                 // and+ 
  :{ :(and W V) W V }                   // and- 
  :{ :W  (or W V) (or V W) }            // or+ 
  :{ :(or W V) :{:W U} :{:V U}  U }     // or-
  :{ :{:W V}  (⇒ W V) }                 // ⇒+
  :{ :W :(⇒ W V)  V }                   // ⇒-
  :{ :{:W V} :{:V W}  (⇔ W V) }         // ⇔+
  :{ :(⇔ W V)  {:W V} {:V W} }          // ⇔-
  :{ :{:W →←}  (¬ W) }                  // ¬+
  :{ :{:(¬ W) →←}  W }                  // ¬-
  :{ :W :(¬ W) →← }                     // →←+

  ////////////////////////////////
  // ND Predicate Logic Axioms
  ////////////////////////////////
  :{ :(∀ x,(@ P x)) (@ P t) }           // ∀-
  :{ :{ :[x] (@ P x) }  (∀ y,(@ P y)) } // ∀+
  :{ :(∃ x,(@ P x)) [c,(@ P c)] }       // ∃-
  :{ :(@ P t) (∃ x,(@ P x)) }           // ∃+
  :{ :(= x y) :(@ P x) (@ P y) }        // substitution
  :{ (= W W) }                          // reflexive =
  :{ (∃! x, (@ P x)) ≡                  // ∃!
     { (∃ x , (and (@ P x) (∀ y, (⇒ (@ P y) (= y x))))) } 
   }   
  ////////////////////////////////////////
  // Set Theory Definitions and Axioms
  ////////////////////////////////////////
  // finite set notation
  :{ :(∈ x (Set a)) (= x a) }
  :{ :(= x a) (∈ x (Set a)) }
  :{ :(∈ x (Set a b)) (or (= x a) (= x b)) }
  :{ :(or (= x a) (= x b)) (∈ x (Set a b)) }
  :{ :(∈ x (Set a b c)) (or (= x a) (= x b) (= x b)) }
  :{ :(or (= x a) (= x b) (= x b)) (∈ x (Set a b c)) }
  
  :{ :(∈ x (Set t, (@ P t)))  (@ P x) }     // set builder
  :{ :(@ P x)  (∈ x (Set t, (@ P t))) }     // set builder
 
  :{ :(⊆ A B) :(∈ x A) (∈ x B) }            // subset-
  :{ :{:[x] :(∈ x A) (∈ x B)} (⊆ A B) }     // subset+
 
  :{ :{:[a] :(∈ a A) (∈ a B)}
     :{:[b] :(∈ b B) (∈ b A)} (= A B) }     // set =
  
  :{ :(∈ A (℘ B)) (⊆ A B) }                 // power set
  :{ :(⊆ A B) (∈ A (℘ B)) }                 // power set
  
  :{ :(∈ x (∩ A B)) (∈ x A) (∈ x B)  }      // ∩-    
  :{ :(∈ x A) :(∈ x B) (∈ x (∩ A B)) }      // ∩+
  
  :{ :(∈ x (∪ A B)) (or (∈ x A) (∈ x B)) }  // ∪-
  :{ :(or (∈ x A) (∈ x B)) (∈ x (∪ A B)) }  // ∪+
  
  :{ :(∈ x (- A B)) (∈ x A) (¬ (∈ x B))  }  // set difference- 
  :{ :(∈ x A) :(¬ (∈ x B)) (∈ x (- A B)) }  // set difference+
  
  :{ :(∈ x (- B)) (∈ x B) }                 // complement -
  :{ :(∈ x B) (∈ x (- B)) }                 // complement +
  
  :{ :(= (× a b) (× x y)) (= a x) (= b y)  } // ordered pair-
  :{ :(= a x) :(= b y) (= (× a b) (× x y)) } // ordered pair+
  
  :{ :(= (× a b c) (× x y z)) (= a x) (= b y) (= c z) }    // ordered triple-
  :{ :(= a x) :(= b y) :(= c z) (= (× a b c) (× x y z)) }  // ordered triple+
  
  :{ :(∈ x (× A B)) [ a b , { (∈ a A) (∈ b B) (= x (× a b)) } ] } //Cartesian product
  :{ :(∈ a A) :(∈ b B) (∈ (× a b) (× A B)) }  // Cartesian product

  ////////////////////////////////////////
  // Function Definitions and Axioms
  ////////////////////////////////////////
  :{ :(→ f A B) (∈ x A) (∈ (f x) B) }                            // function-
  :{ :{:[x] :(∈ x A) (∈ (f x) B) }  (→ f A B) }                  // function+
  
  :{  :(= (Domain f) A) (→ f A B) }                              // Domain-
  :{  :(→ f A B) (= (Domain f) A) }                              // Domain+
  
  :{  :(= (Codomain f) B) (→ f A B) }                            // Codomain-
  :{  :(→ f A B) (= (Codomain f) B) }                            // Codomain+
  
  :{ :(⊆ S (Domain f)) :(y ∈ f(S)) [ x , {(∈ x S) (= y (f x))} ] } // image-
  :{ :(⊆ S (Domain f)) :(∈ x S) (x ∈ (f S)) }                    // image+
  
  :{ (= (Range f) (f (Domain f))) }                              // Range
  
  :{ (→ (id A) A A) :(∈ x A) (= ((id A) x) x) }                  // identity map
  :{ :(→ f A B) :(→ g B C) 
      (→ (∘ g f) A C) (= ((∘ g f) x) (g (f x))) }                // composition
  :{ (= ((∘ g f) x) (g (f x))) }                                 // simple ∘
  
  :{ :{:[x] {:[y] :(= (f x) (f y)) (= x y)}} (injective f) }     // injective+
  :{ :(injective f) :(= (f x) (f y)) (= x y) }                   // injective-
}  
     // //  _ surjective (onto) _____________________________________
     // :⇔(surjective(f),∀(y,⇒(∈(y,Codomain(f)),∃(x,=(f(x),y)))))
     // //  _ bijective _____________________________________________
     // :⇔(bijective(f),and(injective(f),surjective(f)))
     // //  _ inverse function (inverse) ____________________________
     // :⇔(maps(inverse(f),B,A),and(maps(f,A,B),=(∘(f,inverse(f)),id(B)),=(∘(inverse(f),f),id(A))))
     // 
     //  _ inverse image _________________________________________
  //    :⇒(and(maps(f,A,B),⊆(S,B)),=(inverseimage(f,S),setbuilder(x,∈(f(x),S))))
  // 
  //    //  Inequality Axioms
  //    //  _ trichotomy ________________________________________________________
  //    :or(=(x,0),<(x,0),<(0,x))
  //    //  -------------------------------------------------------------------
  //    :⇒(=(x,0),and(¬(<(x,0)),¬(<(0,x))))
  //    :⇒(<(x,0),and(¬(=(x,0)),¬(<(0,x))))
  //    :⇒(<(0,x),and(¬(=(x,0)),¬(<(x,0))))
  //    //  _ transitive __(transitivity)________________________________________
  //    :⇒(and(<(x,y),<(y,z)),<(x,z))
  //    //  _ addition __________________________________________________________
  //    :⇒(<(x,y),<(+(x,z),+(y,z)))
  //    //  _ multiplication ____________________________________________________
  //    :⇒(and(<(0,z),<(x,y)),<(⋅(z,x),⋅(z,y)))
  // 
  //    //  Inequality Definitions
  //    //  _ > __(greater than)_________________________________________________
  //    :⇔(>(x,y),<(y,x))
  //    //  _ ≤ _________________________________________________________________
  //    :⇔(≤(x,y),or(<(x,y),=(x,y)))
  //    //  _ ≥ _________________________________________________________________
  //    :⇔(≥(x,y),≤(y,x))
  //    //  _ positive __________________________________________________________
  //    :⇔(positive(x),<(0,x))
  //    //  _ negative __________________________________________________________
  //    :⇔(negative(x),<(x,0))
  //    //  _ nonegative ________________________________________________________
  //    :⇔(nonnegative(x),≤(0,x))
  // 
  //    //  Algebra Definitions and Axioms (Equations)
  //    //  _ identity ________________________________________________________
  //    :and(=(+(x,0),x),=(+(0,x),x))
  //    //  -------------------------------------------------------------------
  //    :and(=(⋅(1,x),x),=(⋅(x,1),x))
  //    //  _ commutative __(commutativity)____________________________________
  //    :=(+(x,y),+(y,x))
  //    //  -------------------------------------------------------------------
  //    :=(⋅(x,y),⋅(y,x))
  //    //  _ associative __(associativity)____________________________________
  //    :=(+(+(x,y),z),+(x,+(y,z)))
  //    //  -------------------------------------------------------------------
  //    :=(⋅(⋅(x,y),z),⋅(x,⋅(y,z)))
  //    //  _ distributive __(distributivity)__________________________________
  //    :and(=(⋅(x,+(y,z)),+(⋅(x,y),⋅(x,z))),=(⋅(+(y,z),x),+(⋅(y,x),⋅(z,x))))
  //    //  _ inverse _________________________________________________________
  //    :and(=(+(x,-(x)),0),=(+(-(x),x),0))
  //    //  -------------------------------------------------------------------
  //    :⇒(invertible(x),and(=(⋅(x,frac(1,x)),1),=(⋅(frac(1,x),x),1)))
  //    //  _ subtraction _____________________________________________________
  //    :=(-(x,y),+(x,-(y)))
  //    //  _ division _____________________________________________________
  //    :⇒(invertible(y),=(frac(x,y),⋅(x,frac(1,y))))
  //    //  _ zero __(arithmetic)______________________________________________________
  //    :and(=(⋅(0,x),0),=(⋅(x,0),0))
  // 
  //    // Number Theory Definitions and Axioms
  //    // _ induction ________________________________________________________
  //    // If P[n=0] and ∀k,P[n=k]⇒P[n=k+1] then ∀n,P
  //    // --------------------------------------------------------------------
  //    // If P[n=0] and ∀k,(∀j,j≤k⇒P[n=j])⇒P[n=k+1] then ∀n,P
  //    // --------------------------------------------------------------------
  //    // If P[n=a] and ∀k,(a≤k and P[n=k])⇒P[n=k+1] then ∀n,a≤n⇒P
  //    // --------------------------------------------------------------------
  //    // If P[n=a] and ∀k,( ∀j,(a≤j and j≤k)⇒P[n=j] )⇒P[n=k+1] then ∀n,P
  //    // _ Division Algorithm _______________________________________________
  //    :⇒(¬(=(b,0)),∃!(q,∃!(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))))))
  //    // --------------------------------------------------------------------
  //    // (Note: These two show existence.)
  //    :⇒(¬(=(b,0)),∃(q,∃(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))))))
  //    :⇒(<(0,b),∃(q,∃(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,b)))))
  //    // (Note: These two show uniqueness and can also be thought of as mod+
  //    //and quo+ rules.)
  //    :⇒(and(¬(=(b,0)),=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))),and(=(q,quo(a,b)),=(r,mod(a,b))))
  //    :⇒(and(<(0,b),=(a,+(⋅(q,b),r)),≤(0,r),<(r,b)),and(=(q,quo(a,b)),=(r,mod(a,b))))
  //    // _ quotient (quo) ___________________________________________________
  //    :⇒(=(q,quo(a,b)),and(¬(=(b,0)),≤(0,-(a,⋅(q,b))),<(-(a,⋅(q,b)),abs(b))))
  //    :⇒(and(=(q,quo(a,b)),<(b,0)),and(≤(0,-(a,⋅(q,b))),<(-(a,⋅(q,b)),b)))
  //    // _ remainder (mod) __________________________________________________
  //    :⇒(=(r,mod(a,b)),and(≤(0,r),<(r,abs(b)),div(b,-(a,r))))
  //    :⇒(and(=(r,mod(a,b)),<(0,b)),and(≤(0,r),<(r,b),div(b,-(a,r))))
  //    // _ prime ____________________________________________________________
  //    :⇒(and(prime(p),div(a,p)),and(<(0,p),or(=(a,1),=(a,p))))
  //    :⇒(and(<(1,p),∀(a,⇒(and(<(0,a),div(a,p))),or(=(a,1),=(a,p)))),prime(p))
  //    // _ composite ________________________________________________________
  //    :⇒(and(<(0,n),div(a,n),<(1,a),<(a,n)),composite(n))
  //    :⇒(composite(n),and(¬(=(n,0)),∃(a,and(<(1,a),<(a,n),div(a,n)))))
  //    // _ congruent ________________________________________________________
  //    :⇔(cong(a,b,m),div(m,-(a,b)))
  //    // _ gcd ______________________________________________________________
  //    :⇔(=(d,gcd(a,b)),and(<(0,d),div(d,a),div(d,b),∀(c,⇒(and(div(c,a),div(c,b)),≤(c,d)))))
  //    :⇒(and(<(0,d),div(d,a),div(d,b),∀(c, ⇒(and(div(c,a),div(c,b)), ≤(c,d)))),=(d,gcd(a,b)))
  //    // _ lcm ______________________________________________________________
  //    :⇔(=(d,lcm(a,b)),and(<(0,d),div(a,d),div(b,d),∀(c,⇒(<(0,c),div(a,c),div(b,c)),≤(d,c))))
  //    :⇒(and(<(0,d),div(a,d),div(b,d),∀(c,and(<(0,c),div(a,c),div(b,c)),≤(d,c))),=(d,lcm(a,b)))
  //    // _ coprime __________________________________________________________
  //    :⇔(coprime(a,b),=(gcd(a,b),1))





//     :(or P (not P))
//     :(iff (not (not P)) P)
//     :(iff (and P P) P)
//     :(iff (or P P) P)
//     :(iff (and P Q) (and Q P))
//     :(iff (or P Q) (or Q P))
//     :(iff (iff P Q) (iff Q P))
//     :(iff (and (and P Q) R) (and P (and Q R)))
//     :(iff (or (or P Q) R) (or P (or Q R)))
//     :(iff (iff (iff P Q) R) (iff P (iff Q R)))
//     :(iff (and P (or Q R)) (or (and P Q) (and P R)))
//     :(iff (or P (and Q R)) (and (or P Q) (or P R)))
//     :(implies (and (implies P Q) (implies Q R)) (implies P R))
//     :(iff (and (iff P Q) (iff Q R)) (iff P R))
//     :(iff (implies P Q) (or (not P) Q))
//     :(implies (and (or P Q) (not P)) Q)
//     :(implies (and (or P Q) (not Q)) P)
//     :(iff (not (implies P Q)) (and P (not Q)))
//     :(iff (implies P Q) (implies (not Q) (not P)))
//     :(iff (and (not P Q)) (or (not P) (not Q)))
//     :(iff (or (not P Q)) (and (not P) (not Q)))
//     :(equal x x)
//     :(iff (notequal x y) (not (equal x y)))
//     :(iff (member x (set a)) (equal x a))
//     :(iff (member x (set a b)) (or (equal x a) (equal x b)))
//     :(iff (member x (set a b c)) (or (equal x a) (equal x b) (equal x c)))
//     :(iff (member x (set a b c d)) (or (equal x a) (equal x b) (equal x c) (equal x d)))
//     :(iff (subseteq A B) (forall x (implies (member x A) (member x B))))
//     :(iff (equal A B) (and (subseteq A B) (subseteq B A)))
//     :(iff (notmember x A) (not (member x A)))
//     :(notmember x emptyset)
//     :(iff (member A (powerset B)) (subseteq A B))
//     :(iff (member x (intersect A B)) (and (member x A) (member x B)))
//     :(iff (member x (union A B)) (or (member x A) (member x B)))
//     :(iff (member x (difference A B)) (and (member x A) (notmember x B)))
//     :(iff (member x (difference B)) (notmember x B))
//     :(iff (equal (tuple a) (tuple x)) (equal a x))
//     :(iff (equal (tuple a b) (tuple x y)) (and (equal a x) (equal b y)))
//     :(iff (equal (tuple a b c) (tuple x y z)) (and (equal a x) (equal b y) (equal c z)))
//     :(iff (member x (cross A B)) (exists a (exists b (and (member a A) (member b B) (equal x (tuple a b))))))
//     :(iff (member x (cross A B C)) (exists a (exists b (exists c (and (member a A) (member b B) (member c C) (equal x (tuple a b c)))))))
//     :(implies (and (subseteq A B) (member x A)) (member x B))
//     :(implies (and (notmember x A) (member x A)) W)
//     :(implies (member x A) (and (member x (union A B)) (member x (union B A))))
//     :(iff (member x (difference A)) (not (member x A)))
//     :(iff (and (member a A) (member b B)) (member (tuple a b) (cross A B)))
//     :(iff (and (member a A) (member b B) (member c C)) (member (tuple a b c) (cross A B C)))
//     :(member x (union A (difference A)))
//     :(equal (intersect A (difference A)) emptyset)
//     :(equal (difference (difference A)) A)
//     :(equal (difference B (difference A B)) B)
//     :(equal (intersect A A) A)
//     :(equal (union A A) A)
//     :(equal (intersect A B) (intersect B A))
//     :(equal (union A B) (union B A))
//     :(equal (intersect A (intersect B C)) (intersect (intersect A B) C))
//     :(equal (union A (union B C)) (union (union A B) C))
//     :(equal (intersect A (union B C)) (union (intersect A B) (intersect A C)))
//     :(equal (union A (intersect B C)) (intersect (union A B) (union A C)))
//     :(implies (and (subseteq A B) (subseteq B C)) (subseteq A C))
//     :(iff (subseteq A B) (forall x (member x (union (difference A) B))))
//     :(implies (subseteq A B) (member x (union (difference A) B)))
//     :(implies (subseteq A B) (or (notmember x A) (member x B)))
//     :(implies (subseteq A B) (or (not (member x A)) (member x B)))
//     :(implies (and (member x (union A B)) (not (member x A))) (member x B))
//     :(implies (and (member x (union A B)) (not (member x B))) (member x A))
//     :(implies (and (member x (union A B)) (notmember x A)) (member x B))
//     :(implies (and (member x (union A B)) (notmember x B)) (member x A))
//     :(iff (not (subseteq A B)) (exists x (member x (intersect A (difference B)))))
//     :(implies (member x (intersect A (difference B))) (not (subseteq A B)))
//     :(iff (subseteq A B) (subseteq (difference B) (difference A)))
//     :(equal (difference (intersect A B)) (union (difference A) (difference B)))
//     :(equal (difference (union A B)) (intersect (difference A) (difference B)))
//     :(iff (maps f A B) (and (subseteq f (cross A B)) (forall x (existsunique y (member (tuple x y) f)))))
//     :(iff (equal (f x) y) (and (maps f A B) (member (tuple x y) f)))
//     :(iff (equal (Domain f) A) (maps f A B))
//     :(iff (equal (Codomain f) B) (maps f A B))
//     :(implies (subseteq S (Domain f)) (equal (f S) (setbuilder x (exists y (and (member y S) (equal x (f y)))))))
//     :(equal (Range f) (f (Domain f)))
//     :(and (maps (id A) A A) (forall x (implies (member x A) (equal (id x A) x))))
//     :(implies (and (maps f A B) (maps g B C)) (and (maps (compose g f) A C) (forall (x (equal x (compose g f)) (g (f x))))))
//     :(iff (injective f) (forall x (forall y (implies (equal (f x) (f y)) (equal x y)))))
//     :(iff (surjective f) (forall y (implies (member y (Codomain f)) (exists x (equal (f x) y)))))
//     :(iff (bijective f) (and (injective f) (surjective f)))
//     :(iff (maps (inverse f) B A) (and (maps f A B) (equal (compose f (inverse f)) (id B)) (equal (compose (inverse f) f) (id A))))
//     :(implies (and (maps f A B) (subseteq S B)) (equal (inverseimage f S) (setbuilder x (member (f x) S))))
//     :(or (equal x zero) (lessthan x zero) (lessthan zero x))
//     :(implies (equal x zero) (and (not (lessthan x zero)) (not (lessthan zero x))))
//     :(implies (lessthan x zero) (and (not (equal x zero)) (not (lessthan zero x))))
//     :(implies (lessthan zero x) (and (not (equal x zero)) (not (lessthan x zero))))
//     :(implies (and (lessthan x y) (lessthan y z)) (lessthan x z))
//     :(implies (lessthan x y) (lessthan (plus x z) (plus y z)))
//     :(implies (and (lessthan zero z) (lessthan x y)) (lessthan (cdot z x) (cdot z y)))
//     :(iff (greaterthan x y) (lessthan y x))
//     :(iff (leq x y) (or (lessthan x y) (equal x y)))
//     :(iff (geq x y) (leq y x))
//     :(iff (positive x) (lessthan zero x))
//     :(iff (negative x) (lessthan x zero))
//     :(iff (nonnegative x) (leq zero x))
//     :(and (equal (plus x zero) x) (equal (plus zero x) x))
//     :(and (equal (cdot one x) x) (equal (cdot x one) x))
//     :(equal (plus x y) (plus y x))
//     :(equal (cdot x y) (cdot y x))
//     :(equal (plus (plus x y) z) (plus x (plus y z)))
//     :(equal (cdot (cdot x y) z) (cdot x (cdot y z)))
//     :(and (equal (cdot x (plus y z)) (plus (cdot x y) (cdot x z))) (equal (cdot (plus y z) x) (plus (cdot y x) (cdot z x))))
//     :(and (equal (plus x (difference x)) zero) (equal (plus (difference x) x) zero))
//     :(implies (invertible x) (and (equal (cdot x (frac one x)) one) (equal (cdot (frac one x) x) one)))
//     :(equal (difference x y) (plus x (difference y)))
//     :(implies (invertible y) (equal (frac x y) (cdot x (frac one y))))
//     :(and (equal (cdot zero x) zero) (equal (cdot x zero) zero))
//     :(implies (not (equal b zero)) (existsunique q (existsunique r (and (equal a (plus (cdot q b) r)) (leq zero r) (lessthan r (abs b))))))
//     :(implies (not (equal b zero)) (exists q (exists r (and (equal a (plus (cdot q b) r)) (leq zero r) (lessthan r (abs b))))))
//     :(implies (lessthan zero b) (exists q (exists r (and (equal a (plus (cdot q b) r)) (leq zero r) (lessthan r b)))))
//     :(implies (and (not (equal b zero)) (equal a (plus (cdot q b) r)) (leq zero r) (lessthan r (abs b))) (and (equal q (quo a b)) (equal r (mod a b))))
//     :(implies (and (lessthan zero b) (equal a (plus (cdot q b) r)) (leq zero r) (lessthan r b)) (and (equal q (quo a b)) (equal r (mod a b))))
//     :(implies (equal q (quo a b)) (and (not (equal b zero)) (leq zero (difference a (cdot q b))) (lessthan (difference a (cdot q b)) (abs b))))
//     :(implies (and (equal q (quo a b)) (lessthan b zero)) (and (leq zero (difference a (cdot q b))) (lessthan (difference a (cdot q b)) b)))
//     :(implies (equal r (mod a b)) (and (leq zero r) (lessthan r (abs b)) (div b (difference a r))))
//     :(implies (and (equal r (mod a b)) (lessthan zero b)) (and (leq zero r) (lessthan r b) (div b (difference a r))))
//     :(implies (and (prime p) (div a p)) (and (lessthan zero p) (or (equal a one) (equal a p))))
//     :(implies (and (lessthan one p) (forall a (implies (and (lessthan zero a) (div a p))) (or (equal a one) (equal a p)))) (prime p))
//     :(implies (and (lessthan zero n) (div a n) (lessthan one a) (lessthan a n)) (composite n))
//     :(implies (composite n) (and (not (equal n zero)) (exists a (and (lessthan one a) (lessthan a n) (div a n)))))
//     :(iff (cong a b m) (div m (difference a b)))
//     :(iff (equal d (gcd a b)) (and (lessthan zero d) (div d a) (div d b) (forall c (implies (and (div c a) (div c b)) (leq c d)))))
//     :(implies (and (lessthan zero d) (div d a) (div d b) (forall c (implies (and (div c a) (div c b)) (leq c d)))) (equal d (gcd a b)))
//     :(iff (equal d (lcm a b)) (and (lessthan zero d) (div a d) (div b d) (forall c (implies (lessthan zero c) (div a c) (div b c)) (leq d c))))
//     :(implies (and (lessthan zero d) (div a d) (div b d) (forall c (and (lessthan zero c) (div a c) (div b c)) (leq d c))) (equal d (lcm a b)))
//     :(iff (coprime a b) (equal (gcd a b) one))
//     :{
//         :(not P)
//         (or P (not P))
//     }
//     :{
//         :P
//         (or P (not P))
//     }
//     :{
//         :P
//         (or P Q)
//     }
//     :{
//         :Q
//         (or P Q)
//     }
//     :{
//         :(or P Q)
//         (or (or P Q) R)
//     }
//     :{
//         :R
//         (or (or P Q) R)
//     }
//     :{
//         :P
//         (or P (and (not P) P))
//     }
//     :{
//         :(not P)
//         (or (not P) (not Q))
//     }
//     :{
//         :(not Q)
//         (or (not P) (not Q))
//     }
//     :{
//         :(or Q R)
//         :{
//             :Q
//             (or (or P Q) R)
//         }
//         :{
//             :R
//             (or (or P Q) R)
//         }
//         (or (or P Q) R)
//     }
//     :{
//         :(or P (or Q R))
//         :{
//             :P
//             (or (or P Q) R)
//         }
//         :{
//             :(or Q R)
//             (or (or P Q) R)
//         }
//         (or (or P Q) R)
//     }
//     :{
//         :(or (not P) (not Q))
//         :{
//             :(not P)
//             contradiction
//         }
//         :{
//             :(not Q)
//             contradiction
//         }
//         contradiction
//     }
//     :{
//         :(or P (not P))
//         :(not (or P (not P)))
//         contradiction
//     }
//     :{
//         :(not (or (not P) (not Q)))
//         :(or (not P) (not Q))
//         contradiction
//     }
//     :{
//         :(not (and P Q))
//         :(and P Q)
//         contradiction
//     }
//     :{
//         :(not P)
//         :P
//         contradiction
//     }
//     :{
//         :(not Q)
//         :Q
//         contradiction
//     }
//     :{
//         :{
//             :(not P)
//             contradiction
//         }
//         P
//     }
//     :{
//         :{
//             :(not Q)
//             contradiction
//         }
//         Q
//     }
//     :{
//         :{
//             :(not (or P (not P)))
//             contradiction
//         }
//         (or P (not P))
//     }
//     :{
//         :{
//             :(not (or (not P) (not Q)))
//             contradiction
//         }
//         (or (not P) (not Q))
//     }
//     :{
//         :{
//             :(and P Q)
//             contradiction
//         }
//         (not (and P Q))
//     }
//     :{
//         :{
//             :contradiction
//             P
//         }
//         (implies contradiction P)
//     }
//     :{
//         :{
//             :(or P (or Q R))
//             (or (or P Q) R)
//         }
//         (implies (or P (or Q R)) (or (or P Q) R))
//     }
//     :{
//         :{
//             :P
//             (or P (and (not P) P))
//         }
//         (implies P (or P (and (not P) P)))
//     }
//     :{
//         :{
//             :(or P (and (not P) P))
//             P
//         }
//         (implies (or P (and (not P) P)) P)
//     }
//     :{
//         :{
//             :P
//             (iff P (or P (and (not P) P)))
//         }
//         (implies P (iff P (or P (and (not P) P))))
//     }
//     :{
//         :{
//             :(not (and P Q))
//             (or (not P) (not Q))
//         }
//         (implies (not (and P Q)) (or (not P) (not Q)))
//     }
//     :{
//         :{
//             :(or (not P) (not Q))
//             (not (and P Q))
//         }
//         (implies (or (not P) (not Q)) (not (and P Q)))
//     }
//     :{
//         :(implies P (or P (and (not P) P)))
//         :(implies (or P (and (not P) P)) P)
//         (iff P (or P (and (not P) P)))
//     }
//     :{
//         :(implies (not (and P Q)) (or (not P) (not Q)))
//         :(implies (or (not P) (not Q)) (not (and P Q)))
//         (iff (not (and P Q)) (or (not P) (not Q)))
//     }
//     :{
//         :P
//         :Q
//         (and P Q)
//     }
//     :{
//         :P
//         :Q
//         (and P Q)
//     }
//     :{
//         :(and P Q)
//         P
//         Q
//     }
//     {
//         :(not (or P (not P)))
//         {
//             :(not P)
//             (or P (not P))
//             contradiction
//         }
//         P
//         (or P (not P))
//         contradiction
//     }
//     (or P (not P))
//     {
//         :contradiction
//         {
//             :(not P)
//             contradiction
//         }
//         P
//     }
//     (implies contradiction P)
//     {
//         :(or P (or Q R))
//         {
//             :P
//             (or P Q)
//             (or (or P Q) R)
//         }
//         {
//             :(or Q R)
//             {
//                 :Q
//                 (or P Q)
//                 (or (or P Q) R)
//             }
//             {
//                 :R
//                 (or (or P Q) R)
//             }
//             (or (or P Q) R)
//         }
//         (or (or P Q) R)
//     }
//     (implies (or P (or Q R)) (or (or P Q) R))
//     {
//         :P
//         {
//             :P
//             (or P (and (not P) P))
//         }
//         (implies P (or P (and (not P) P)))
//         {
//             :(or P (and (not P) P))
//             P
//         }
//         (implies (or P (and (not P) P)) P)
//         (iff P (or P (and (not P) P)))
//     }
//     (implies P (iff P (or P (and (not P) P))))
//     {
//         :(not (and P Q))
//         {
//             :(not (or (not P) (not Q)))
//             {
//                 :(not P)
//                 (or (not P) (not Q))
//                 contradiction
//             }
//             P
//             {
//                 :(not Q)
//                 (or (not P) (not Q))
//                 contradiction
//             }
//             Q
//             (and P Q)
//             contradiction
//         }
//         (or (not P) (not Q))
//     }
//     (implies (not (and P Q)) (or (not P) (not Q)))
//     {
//         :(or (not P) (not Q))
//         {
//             :(and P Q)
//             P
//             Q
//             {
//                 :(not P)
//                 contradiction
//             }
//             {
//                 :(not Q)
//                 contradiction
//             }
//             contradiction
//         }
//         (not (and P Q))
//     }
//     (implies (or (not P) (not Q)) (not (and P Q)))
//     (iff (not (and P Q)) (or (not P) (not Q)))
// }

////// Original notation in old repo for this test:
// {
// 
//    ///////////////////////
//    // Proposotional Logic
//    ///////////////////////
//    // Propositional Logic Axioms
//    // and+
//    :{ :{ W V } and(W,V) and(V,W) }
//    // and-
//    :{ :and(W,V) W V }
//    // or+
//    :{ :W or(W,V) or(V,W) }
//    // or-
//    :{ :or(W,V) :{ :W R } :{ :W R } R }
//    // ⇒+
//    :{ :{ :W V } ⇒(W,V) }
//    // ⇒-
//    :{ :W :⇒(W,V) V }
//    // ⇔+
//    :{ :{ :W V } :{ :V W } ⇔(W,V) }
//    // ⇔-
//    :{ :⇔(W,V) { :V W } { :W V } }
//    // ¬+
//    :{ :{ :W →← } ¬(W) }
//    // ¬-
//    :{ :{ :¬(W) →← } W }
//    // →←+
//    :{ :W :¬(W) →← }
// 
//    // Propositional Logic Theorems
//    // Famous Tautologies
//    // __ excluded middle ______________________________
//    :or(P,¬(P))
//    // __ double negative ______________________________
//    :⇔(¬(¬(P)),P)
//    // __ idempotency __________________________________
//    :⇔(and(P,P),P)
//    :⇔(or(P,P),P)
//    // __ commutativity ________________________________
//    :⇔(and(P,Q),and(Q,P))
//    :⇔(or(P,Q),or(Q,P))
//    :⇔(⇔(P,Q),⇔(Q,P))
//    // __ associativity ________________________________
//    :⇔(and(and(P,Q),R),and(P,and(Q,R)))
//    :⇔(or(or(P,Q),R),or(P,or(Q,R)))
//    :⇔(⇔(⇔(P,Q),R),⇔(P,⇔(Q,R)))
//    // __ distributivity _______________________________
//    :⇔(and(P,or(Q,R)),or(and(P,Q),and(P,R)))
//    :⇔(or(P,and(Q,R)),and(or(P,Q),or(P,R)))
//    // __ transitivity _________________________________
//    :⇒(and(⇒(P,Q),⇒(Q,R)),⇒(P,R))
//    :⇔(and(⇔(P,Q),⇔(Q,R)),⇔(P,R))
//    // __ alternate implies _(⇒)________________________
//    :⇔(⇒(P,Q),or(¬(P),Q))
//    // __ alternate or- _(or, or-)______________________
//    :⇒(and(or(P,Q),¬(P)),Q)
//    :⇒(and(or(P,Q),¬(Q)),P)
//    // __ negation of an implication _(not ⇒)___________
//    :⇔(¬(⇒(P,Q)),and(P,¬(Q)))
//    // __ contrapositive _______________________________
//    :⇔(⇒(P,Q),⇒(¬(Q),¬(P)))
//    // __ DeMorgan _____________________________________
//    :⇔(and(¬(P,Q)),or(¬(P),¬(Q)))
//    :⇔(or(¬(P,Q)),and(¬(P),¬(Q)))
// 
//    // Predicate Logic Definitions and Axioms
//    // _ ∀+ (or UG or ∀) _____________________________
//    // Let x be arbitrary. If W then ∀z,W[x=z]. (Subject to the restriction that z cannot appear free in W if z is not equal to x. This is is checked by the built-in function free_to_replace(z,x,W))
//    // _ ∀- (or UI or ∀) _____________________________
//    // If ∀x,W then W[x=t]
//    // _ ∃+ (or EG or ∃) _____________________________
//    // If W[x=t] then ∃x,W
//    // _ ∃- (or EI or ∃) _____________________________
//    // If ∃x,W then for some constant c, W[x=c]
//    //
//    // Equality Definitions and Axioms
//    // _ reflexive ____________________________________
//    :=(x,x)
//    // _ substitution _________________________________
//    // If x=y and W then W[x~y]
//    // _ ∃! ___________________________________________
//    // ∃c,(W[x=c] and ∀z,W[x=z] ⇒ z=c) if and only if ∃!x,W
//    // _ ≠ ____________________________________________
//    :⇔(≠(x,y),¬(=(x,y)))
// 
//    // Predicate Logic with Equality Theorems
//    // _ substitution ________________________
//    // If x=y and W then W[y~x]
//    // _ ∃! ____________________________________
//    // ∃!x,P if and only if ∃c,∀z,P[x=z] ⇔ z=c
// 
//    // Set Theory Definitions and Axioms
//    // _ finite set ___________________________________________
//    :⇔(∈(x,set(a)),=(x,a))
//    :⇔(∈(x,set(a,b)),or(=(x,a),=(x,b)))
//    :⇔(∈(x,set(a,b,c)),or(=(x,a),=(x,b),=(x,c)))
//    :⇔(∈(x,set(a,b,c,d)),or(=(x,a),=(x,b),=(x,c),=(x,d)))
//    // _ set builder _________________________________________
//    //:⇔(x∈{z : P} , P[z=x])
//    // _ ⊆ (subset) __________________________________________
//    :⇔(⊆(A,B),∀(x,⇒(∈(x,A),∈(x,B))))
//    // _ set = (set equality) ________________________________
//    :⇔(=(A,B),and(⊆(A,B),⊆(B,A)))
//    // _ ∉ ____________________________________________________
//    :⇔(∉(x,A),¬(∈(x,A)))
//    // _ ∅ (empty set) ______________________________________
//    :∉(x,∅)
//    // _ ℘ (power set) _______________________________________
//    :⇔(∈(A,℘(B)),⊆(A,B))
//    // _ ∩ (intersection) ____________________________________
//    :⇔(∈(x,∩(A,B)),and(∈(x,A),∈(x,B)))
//    // _ ∪ (union) ___________________________________________
//    :⇔(∈(x,∪(A,B)),or(∈(x,A),∈(x,B)))
//    // _ − (relative complement) ___________________________
//    :⇔(∈(x,-(A,B)),and(∈(x,A),∉(x,B)))
//    // _ ' (complement) ____________________________________
//    :⇔(∈(x,-(B)),∉(x,B))
//    // _ ordered tuple (tuple)______________________________
//    :⇔(=(tuple(a),tuple(x)),=(a,x))
//    :⇔(=(tuple(a,b),tuple(x,y)),and(=(a,x),=(b,y)))
//    :⇔(=(tuple(a,b,c),tuple(x,y,z)),and(=(a,x),=(b,y),=(c,z)))
//    // _ Cartesian product __________________________________
//    :⇔(∈(x,×(A,B)),∃(a,∃(b,and(∈(a,A),∈(b,B),=(x,tuple(a,b))))))
//    :⇔(∈(x,×(A,B,C)),∃(a,∃(b,∃(c,and(∈(a,A),∈(b,B),∈(c,C),=(x,tuple(a,b,c)))))))
// 
//    // Set Theory Basic Theorems
//    // _ finite set _________________________________________
//    // We can conclude P if it is a valid expression of the form x∈A, ⊆(A,B), A⊂B, A=B, x∉A, or A≠B where A, B are finite sets in finite set notation (as checked by the built in function finite_set_valid(P))
//    // _ ⊆ (subset) _________________________________________
//    :⇒(and(⊆(A,B),∈(x,A)),∈(x,B))
//    //  Let x be arbitrary. If assuming x∈A we have x∈B, then A⊆B
//    // _ →← _(contradiction)_________________________________
//    :⇒(and(∉(x,A),∈(x,A)),W)
//    // _ ∅ (empty set) ______________________________________
//    // :=(∅,{})
//    // _ ∪ (union) __________________________________________
//    :⇒(∈(x,A),and(∈(x,∪(A,B)),∈(x,∪(B,A))))
//    // _ − (relative complement) ____________________________
//    //:⇔(∈(x,−(A,B)),and(∈(x,A),¬(∈(x,B))))
//    // _ ' (complement) _____________________________________
//    :⇔(∈(x,-(A)),¬(∈(x,A)))
//    // _ Cartesian product __________________________________
//    :⇔(and(∈(a,A),∈(b,B)),∈(tuple(a,b),×(A,B)))
//    :⇔(and(∈(a,A),∈(b,B),∈(c,C)),∈(tuple(a,b,c),×(A,B,C)))
// 
//    // Set Theory Theorems
//    // __ excluded middle ______________________________
//    :∈(x,∪(A,-(A)))
//    :=(∩(A,-(A)),∅)
//    // __ double negative ______________________________
//    :=(-(-(A)),A)
//    :=(-(B,-(A,B)),B)
//    // __ idempotency __________________________________
//    :=(∩(A,A),A)
//    :=(∪(A,A),A)
//    // __ commutativity ________________________________
//    :=(∩(A,B),∩(B,A))
//    :=(∪(A,B),∪(B,A))
//    // __ associativity ________________________________
//    :=(∩(A,∩(B,C)),∩(∩(A,B),C))
//    :=(∪(A,∪(B,C)),∪(∪(A,B),C))
//    // __ distributivity _______________________________
//    :=(∩(A,∪(B,C)),∪(∩(A,B),∩(A,C)))
//    :=(∪(A,∩(B,C)),∩(∪(A,B),∪(A,C)))
//    // __ transitivity _________________________________
//    :⇒(and(⊆(A,B),⊆(B,C)),⊆(A,C))
//    // __ subset _______________________________________
//    :⇔(⊆(A,B),∀(x,∈(x,∪(-(A),B))))
//    :⇒(⊆(A,B),∈(x,∪(-(A),B)))
//    :⇒(⊆(A,B),or(∉(x,A),∈(x,B)))
//    :⇒(⊆(A,B),or(¬(∈(x,A)),∈(x,B)))
//    // __ union ________________________________________
//    :⇒(and(∈(x,∪(A,B)),¬(∈(x,A))),∈(x,B))
//    :⇒(and(∈(x,∪(A,B)),¬(∈(x,B))),∈(x,A))
//    :⇒(and(∈(x,∪(A,B)),∉(x,A)),∈(x,B))
//    :⇒(and(∈(x,∪(A,B)),∉(x,B)),∈(x,A))
//    // __ negation of subset ___________________________
//    :⇔(¬(⊆(A,B)),∃(x,∈(x,∩(A,-(B)))))
//    :⇒(∈(x,∩(A,-(B))),¬(⊆(A,B)))
//    // __ contrapositive _______________________________
//    :⇔(⊆(A,B),⊆(-(B),-(A)))
//    // __ DeMorgan _____________________________________
//    :=(-(∩(A,B)),∪(-(A),-(B)))
//    :=(-(∪(A,B)),∩(-(A),-(B)))
// 
//    //  Function Definitions and Axioms
//    //  _ function ______________________________________________
//    :⇔(maps(f,A,B),and(⊆(f,×(A,B)),∀(x,∃!(y,∈(tuple(x,y),f)))))
//    //  _ function application (f(x)) ___________________________
//    :⇔(=(f(x),y),and(maps(f,A,B),∈(tuple(x,y),f)))
//    //  _ domain ________________________________________________
//    :⇔(=(Domain(f),A),maps(f,A,B))
//    //  _ codomain ______________________________________________
//    :⇔(=(Codomain(f),B),maps(f,A,B))
//    //  _ image _________________________________________________
//    :⇒(⊆(S,Domain(f)),=(f(S),setbuilder(x,∃(y,and(∈(y,S),=(x,f(y)))))))
//    //  _ range _________________________________________________
//    :=(Range(f),f(Domain(f)))
//    //  _ identity map (id) _____________________________________
//    :and(maps(id(A),A,A),∀(x,⇒(∈(x,A),=(id(A)(x),x))))
//    //  _ composition (∘) _______________________________________
//    :⇒(and(maps(f,A,B),maps(g,B,C)),and(maps(∘(g,f),A,C),∀(x,(=(∘(g,f))(x),g(f(x))))))
//    //  _ injective (one to one or 1-1) _________________________
//    :⇔(injective(f),∀(x,∀(y,⇒(=(f(x),f(y)),=(x,y)))))
//    //  _ surjective (onto) _____________________________________
//    :⇔(surjective(f),∀(y,⇒(∈(y,Codomain(f)),∃(x,=(f(x),y)))))
//    //  _ bijective _____________________________________________
//    :⇔(bijective(f),and(injective(f),surjective(f)))
//    //  _ inverse function (inverse) ____________________________
//    :⇔(maps(inverse(f),B,A),and(maps(f,A,B),=(∘(f,inverse(f)),id(B)),=(∘(inverse(f),f),id(A))))
//    //  _ inverse image _________________________________________
//    :⇒(and(maps(f,A,B),⊆(S,B)),=(inverseimage(f,S),setbuilder(x,∈(f(x),S))))
// 
//    //  Inequality Axioms
//    //  _ trichotomy ________________________________________________________
//    :or(=(x,0),<(x,0),<(0,x))
//    //  -------------------------------------------------------------------
//    :⇒(=(x,0),and(¬(<(x,0)),¬(<(0,x))))
//    :⇒(<(x,0),and(¬(=(x,0)),¬(<(0,x))))
//    :⇒(<(0,x),and(¬(=(x,0)),¬(<(x,0))))
//    //  _ transitive __(transitivity)________________________________________
//    :⇒(and(<(x,y),<(y,z)),<(x,z))
//    //  _ addition __________________________________________________________
//    :⇒(<(x,y),<(+(x,z),+(y,z)))
//    //  _ multiplication ____________________________________________________
//    :⇒(and(<(0,z),<(x,y)),<(⋅(z,x),⋅(z,y)))
// 
//    //  Inequality Definitions
//    //  _ > __(greater than)_________________________________________________
//    :⇔(>(x,y),<(y,x))
//    //  _ ≤ _________________________________________________________________
//    :⇔(≤(x,y),or(<(x,y),=(x,y)))
//    //  _ ≥ _________________________________________________________________
//    :⇔(≥(x,y),≤(y,x))
//    //  _ positive __________________________________________________________
//    :⇔(positive(x),<(0,x))
//    //  _ negative __________________________________________________________
//    :⇔(negative(x),<(x,0))
//    //  _ nonegative ________________________________________________________
//    :⇔(nonnegative(x),≤(0,x))
// 
//    //  Algebra Definitions and Axioms (Equations)
//    //  _ identity ________________________________________________________
//    :and(=(+(x,0),x),=(+(0,x),x))
//    //  -------------------------------------------------------------------
//    :and(=(⋅(1,x),x),=(⋅(x,1),x))
//    //  _ commutative __(commutativity)____________________________________
//    :=(+(x,y),+(y,x))
//    //  -------------------------------------------------------------------
//    :=(⋅(x,y),⋅(y,x))
//    //  _ associative __(associativity)____________________________________
//    :=(+(+(x,y),z),+(x,+(y,z)))
//    //  -------------------------------------------------------------------
//    :=(⋅(⋅(x,y),z),⋅(x,⋅(y,z)))
//    //  _ distributive __(distributivity)__________________________________
//    :and(=(⋅(x,+(y,z)),+(⋅(x,y),⋅(x,z))),=(⋅(+(y,z),x),+(⋅(y,x),⋅(z,x))))
//    //  _ inverse _________________________________________________________
//    :and(=(+(x,-(x)),0),=(+(-(x),x),0))
//    //  -------------------------------------------------------------------
//    :⇒(invertible(x),and(=(⋅(x,frac(1,x)),1),=(⋅(frac(1,x),x),1)))
//    //  _ subtraction _____________________________________________________
//    :=(-(x,y),+(x,-(y)))
//    //  _ division _____________________________________________________
//    :⇒(invertible(y),=(frac(x,y),⋅(x,frac(1,y))))
//    //  _ zero __(arithmetic)______________________________________________________
//    :and(=(⋅(0,x),0),=(⋅(x,0),0))
// 
//    // Number Theory Definitions and Axioms
//    // _ induction ________________________________________________________
//    // If P[n=0] and ∀k,P[n=k]⇒P[n=k+1] then ∀n,P
//    // --------------------------------------------------------------------
//    // If P[n=0] and ∀k,(∀j,j≤k⇒P[n=j])⇒P[n=k+1] then ∀n,P
//    // --------------------------------------------------------------------
//    // If P[n=a] and ∀k,(a≤k and P[n=k])⇒P[n=k+1] then ∀n,a≤n⇒P
//    // --------------------------------------------------------------------
//    // If P[n=a] and ∀k,( ∀j,(a≤j and j≤k)⇒P[n=j] )⇒P[n=k+1] then ∀n,P
//    // _ Division Algorithm _______________________________________________
//    :⇒(¬(=(b,0)),∃!(q,∃!(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))))))
//    // --------------------------------------------------------------------
//    // (Note: These two show existence.)
//    :⇒(¬(=(b,0)),∃(q,∃(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))))))
//    :⇒(<(0,b),∃(q,∃(r,and(=(a,+(⋅(q,b),r)),≤(0,r),<(r,b)))))
//    // (Note: These two show uniqueness and can also be thought of as mod+
//    //and quo+ rules.)
//    :⇒(and(¬(=(b,0)),=(a,+(⋅(q,b),r)),≤(0,r),<(r,abs(b))),and(=(q,quo(a,b)),=(r,mod(a,b))))
//    :⇒(and(<(0,b),=(a,+(⋅(q,b),r)),≤(0,r),<(r,b)),and(=(q,quo(a,b)),=(r,mod(a,b))))
//    // _ quotient (quo) ___________________________________________________
//    :⇒(=(q,quo(a,b)),and(¬(=(b,0)),≤(0,-(a,⋅(q,b))),<(-(a,⋅(q,b)),abs(b))))
//    :⇒(and(=(q,quo(a,b)),<(b,0)),and(≤(0,-(a,⋅(q,b))),<(-(a,⋅(q,b)),b)))
//    // _ remainder (mod) __________________________________________________
//    :⇒(=(r,mod(a,b)),and(≤(0,r),<(r,abs(b)),div(b,-(a,r))))
//    :⇒(and(=(r,mod(a,b)),<(0,b)),and(≤(0,r),<(r,b),div(b,-(a,r))))
//    // _ prime ____________________________________________________________
//    :⇒(and(prime(p),div(a,p)),and(<(0,p),or(=(a,1),=(a,p))))
//    :⇒(and(<(1,p),∀(a,⇒(and(<(0,a),div(a,p))),or(=(a,1),=(a,p)))),prime(p))
//    // _ composite ________________________________________________________
//    :⇒(and(<(0,n),div(a,n),<(1,a),<(a,n)),composite(n))
//    :⇒(composite(n),and(¬(=(n,0)),∃(a,and(<(1,a),<(a,n),div(a,n)))))
//    // _ congruent ________________________________________________________
//    :⇔(cong(a,b,m),div(m,-(a,b)))
//    // _ gcd ______________________________________________________________
//    :⇔(=(d,gcd(a,b)),and(<(0,d),div(d,a),div(d,b),∀(c,⇒(and(div(c,a),div(c,b)),≤(c,d)))))
//    :⇒(and(<(0,d),div(d,a),div(d,b),∀(c, ⇒(and(div(c,a),div(c,b)), ≤(c,d)))),=(d,gcd(a,b)))
//    // _ lcm ______________________________________________________________
//    :⇔(=(d,lcm(a,b)),and(<(0,d),div(a,d),div(b,d),∀(c,⇒(<(0,c),div(a,c),div(b,c)),≤(d,c))))
//    :⇒(and(<(0,d),div(a,d),div(b,d),∀(c,and(<(0,c),div(a,c),div(b,c)),≤(d,c))),=(d,lcm(a,b)))
//    // _ coprime __________________________________________________________
//    :⇔(coprime(a,b),=(gcd(a,b),1))
// 
//    // And now we do a bunch of proofs, instantiating the above theorems as needed
// 
//       ////////////////////
//       // INSTANTIATIONS //
//       ////////////////////
//       // or+
//       :{ :¬(P)
//          or(P,¬(P))
//        }
//       // or+
//       :{ :P
//          or(P,¬(P))
//        }
//       // or+
//       :{ :P
//          or(P,Q)
//        }
//       // or+
//       :{ :Q
//          or(P,Q)
//        }
//       // or+
//       :{ :or(P,Q)
//          or(or(P,Q),R)
//        }
//       // or+
//       :{ :R
//          or(or(P,Q),R)
//        }
//       // or+
//       :{ :P
//          or(P,and(¬(P),P))
//        }
//       // or+
//       :{ :¬(P)
//          or(¬(P),¬(Q))
//        }
//       // or+
//       :{ :¬(Q)
//          or(¬(P),¬(Q))
//        }
// 
//       // or-
//       :{ :or(Q,R)
//          :{ :Q or(or(P,Q),R) }
//          :{ :R or(or(P,Q),R) }
//          or(or(P,Q),R)
//        }
//       // or-
//       :{ :or(P,or(Q,R))
//          :{ :P or(or(P,Q),R) }
//          :{ :or(Q,R) or(or(P,Q),R) }
//          or(or(P,Q),R)
//        }
//       // or-
//       :{ :or(¬(P),¬(Q))
//          :{ :¬(P) →← }
//          :{ :¬(Q) →← }
//          →←
//        }
// 
//       // →←+
//       :{ :or(P,¬(P))
//          :¬(or(P,¬(P)))
//          →←
//        }
//       // →←+
//       :{ :¬(or(¬(P),¬(Q)))
//          :or(¬(P),¬(Q))
//          →←
//        }
//       // →←+
//       :{ :¬(and(P,Q))
//          :and(P,Q)
//          →←
//        }
//       // →←+
//       :{ :¬(P)
//          :P
//          →←
//        }
//       // →←+
//       :{ :¬(Q)
//          :Q
//          →←
//        }
// 
//       // not-
//       :{
//          :{ :¬(P) →← }
//          P
//        }
//       // not-
//       :{
//          :{ :¬(Q) →← }
//          Q
//        }
//       // not-
//       :{
//          :{ :¬(or(P,¬(P))) →← }
//          or(P,¬(P))
//        }
//       // not-
//       :{
//          :{ :¬(or(¬(P),¬(Q))) →← }
//          or(¬(P),¬(Q))
//        }
// 
//       // not+
//       :{
//          :{ :and(P,Q) →← }
//          ¬(and(P,Q))
//        }
// 
//       // ⇒+
//       :{
//          :{ :→← P }
//          ⇒(→←,P)
//        }
//       // ⇒+
//       :{
//          :{ :or(P,or(Q,R)) or(or(P,Q),R) }
//          ⇒(or(P,or(Q,R)),or(or(P,Q),R))
//         }
//       // ⇒+
//       :{
//          :{ :P or(P,and(¬(P),P)) }
//          ⇒(P,or(P,and(¬(P),P)))
//        }
//       // ⇒+
//       :{
//          :{ :or(P,and(¬(P),P)) P }
//          ⇒(or(P,and(¬(P),P)),P)
//        }
//       // ⇒+
//       :{
//          :{ :P ⇔(P,or(P,and(¬(P),P))) }
//          ⇒(P,⇔(P,or(P,and(¬(P),P))))
//         }
//       // ⇒+
//       :{
//          :{ :¬(and(P,Q)) or(¬(P),¬(Q)) }
//          ⇒(¬(and(P,Q)),or(¬(P),¬(Q)))
//         }
//       // ⇒+
//       :{
//          :{ :or(¬(P),¬(Q)) ¬(and(P,Q)) }
//          ⇒(or(¬(P),¬(Q)),¬(and(P,Q)))
//         }
// 
//       // ⇔+
//       :{
//          :⇒(P,or(P,and(¬(P),P)))
//          :⇒(or(P,and(¬(P),P)),P)
//          ⇔(P,or(P,and(¬(P),P)))
//        }
//       // ⇔+
//       :{
//          :⇒(¬(and(P,Q)),or(¬(P),¬(Q)))
//          :⇒(or(¬(P),¬(Q)),¬(and(P,Q)))
//          ⇔(¬(and(P,Q)),or(¬(P),¬(Q)))
//        }
// 
//       // and+
//       :{ :P :Q
//          and(P,Q)
//        }
//       // and+
//       :{ :P :Q
//          and(P,Q)
//        }
// 
//       // and-
//       :{ :and(P,Q)
//          P Q
//        }
// 
//      ////////////////////
// 
//   // Theorem 1 (excluded middle): P or not P
//   // Proof:
//     { :¬(or(P,¬(P)))
//       { :¬(P)
//       or(P,¬(P))     // by or+
//       →←            // by →←+
//       }
//     P              // by not-
//     or(P,¬(P))       // by or+
//     →←              // by →←+
//     }
//   or(P,¬(P))         // by not-
//   // ◼
// 
//   // Theorem (anything follows from →←): →←⇒P
//   // Proof:
//     { :→←
//       { :¬(P)
//       →←         // by copy
//       }
//       P          // by not-
//     }
//   ⇒(→←,P)        // by ⇒+
//   // ◼
// 
//   // Theorem (associativity of 'or'):  P or (Q or R) ⇒ (P or Q) or R
//   // Proof:
//   { :or(P,or(Q,R))
// 
//     { :P
//     or(P,Q)                  // by or+
//     or(or(P,Q),R)            // by or+
//     }
// 
//     { :or(Q,R)
// 
//       { :Q
//       or(P,Q)                // by or+
//       or(or(P,Q),R)          // by or+
//       }
// 
//       { :R
//       or(or(P,Q),R)          // by or+
//       }
// 
//     or(or(P,Q),R)            // by or-
//     }
//   or(or(P,Q),R)              // by or-
//   }
// 
//   ⇒(or(P,or(Q,R)),or(or(P,Q),R))  // by ⇒+
//   // ◼
// 
//   // Theorem (The Most Beautiful Tautology): P ⇒ (P ⇔ P or (¬(P) and P))
//   // Proof:
//     { :P
//       { :P
//       or(P,and(¬(P),P))           // by or+
//       }
//     ⇒(P,or(P,and(¬(P),P)))        // by ⇒+
//       { :or(P,and(¬(P),P))
//       P                         // by copy
//       }
//     ⇒(or(P,and(¬(P),P)),P)        // by ⇒+
//     ⇔(P,or(P,and(¬(P),P)))        // by ⇔+
//     }
//   ⇒(P,⇔(P,or(P,and(¬(P),P))))     // by ⇒+
//   // ◼
// 
//   // Theorem (DeMorgan's Law): ¬(P and Q) ⇔ ¬(P) or ¬(Q)
//   // Proof:
//     { :¬(and(P,Q))
//       { :¬(or(¬(P),¬(Q)))
//         { :¬(P)
//         or(¬(P),¬(Q))          // by or+
//         →←                  // by →←+
//         }
//       P                    // by not-
//         { :¬(Q)
//         or(¬(P),¬(Q))          // by or+
//         →←                  // by →←+
//         }
//       Q                    // by not-
//       and(P,Q)             // by and+
//       →←                    // by →←+
//       }
//     or(¬(P),¬(Q))              // by not-
//     }
//   ⇒(¬(and(P,Q)),or(¬(P),¬(Q)))   // by ⇒+
//     { :or(¬(P),¬(Q))
//       { :and(P,Q)
//       P                    // by and-
//       Q                    // by and-
//         { :¬(P)
//         →←                  // by →←+
//         }
//         { :¬(Q)
//         →←                  // by →←+
//         }
//       →←                    // by or-
//       }
//     ¬(and(P,Q))              // by not+
//     }
//   ⇒(or(¬(P),¬(Q)),¬(and(P,Q)))    // by ⇒+
//   ⇔(¬(and(P,Q)),or(¬(P),¬(Q)))    // by ⇔+
//   // ◼
// 
// }