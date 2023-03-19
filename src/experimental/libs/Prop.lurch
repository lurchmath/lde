////////////////////////////////////////////////////////////////////////////
//
// Propositional Logic Lib
//

{ 
  
  // Global Constants - we don't want any of these to be metavariables
  :[ and or ⇒ ⇔ ¬ →← ]
  
  ////////////////////////////////
  // ND Propositional Logic Axioms
  ////////////////////////////////
  :{ {W V} ≡ (and W V) }                // and+
  :{ {:W V} ≡ (⇒ W V) }                 // ⇒
  :{ { {:W V} {:V W} } ≡ (⇔ W V) }      // ⇔
  :{ :W (or W V) (or V W) }             // or+ 
  :{ :(or W V) :{:W U} :{:V U}  U }     // or-
  :{ :{:W →←}  (¬ W) }                  // ¬+
  :{ :{:(¬ W) →←}  W }                  // ¬-
  :{ :W :(¬ W) →← }                     // →←+

}