////////////////////////////////////////////////////////////////////
// Math 299 Proofs
// Propositional Logic
//

// 4.1 P⇒P
{ (⇒ P P) }  // validates automatically!

// Assignment #4 - Spring 2023

// (a) P and Q ⇒ Q and P
{ :(and P Q) (and Q P) }

// (b) Q ⇒ Q or P
{ { :Q (or Q P) } (⇒ Q (or Q P)) } 

// (c) Q ⇒ (P ⇒ Q)
{ { :Q (⇒ P Q) } (⇒ Q (⇒ P Q)) }

// (d) P ⇔ ¬¬P
{ { :P { :(¬ P) →← } (¬ (¬ P)) } 
  { :(¬ (¬ P)) { :(¬ P) →← } P }   
  (⇔ P (¬ (¬ P)))
}

// (e) →← ⇒ P
// note this can validate now because the relevant instantiations have already
// been found because of the previous proofs
{ (⇒ →← P) }

// (f) ¬(P and ¬P)
{ { :(and P (¬ P)) →← } (¬ (and P (¬ P))) }

// Assignment #5 - Spring 2023

// (a) R ⇒ (Q ⇒ P or Q)
{ {:Q (or P Q) } (⇒ Q (or P Q)) (⇒ R (⇒ Q (or P Q))) }

// (b) ¬P or Q ⇒ (P ⇒ Q)
{ { :(or (¬ P) Q) :{ :(¬ P) (⇒ P Q) } :{ :Q (⇒ P Q) } (⇒ P Q) } <<  // BIH needed
  { :(or (¬ P) Q)
    { :(¬ P) 
      { :P { :(¬ Q) →← } Q } 
      (⇒ P Q)
    }
    { :Q
      {:P Q}
      (⇒ P Q)
    } 
    (⇒ P Q)
  }
  (⇒ (or (¬ P) Q) (⇒ P Q))
}

// (c) (P or Q) or R ⇒ P or (Q or R)
{ // the or- rule (proof by cases) always need a BIH
  { :(or (or P Q) R)  
    :{ :(or P Q) (or P (or Q R) ) }
    :{ :R (or P (or Q R) ) }
    (or P (or Q R) )
  } <<
  { :(or P Q)
    :{ :P (or P (or Q R) ) }
    :{ :Q (or P (or Q R) ) } 
    (or P (or Q R) )
  } <<
  { :(or (or P Q) R)
    { :(or P Q)
      { :P (or P (or Q R) ) }
      { :Q (or Q R) (or P (or Q R) ) } 
      (or P (or Q R) )
    }
    { :R 
      (or Q R)
      (or P (or Q R) ) 
    }
    (or P (or Q R) )
  }
  (⇒ (or (or P Q) R) (or P (or Q R) ) )
}

// (d) ¬(P and Q) ⇒ ¬P or ¬Q
{
  { :(¬ (and P Q) )
    { :(¬ (or (¬ P) (¬ Q) ) )
      { :(¬ P)
        (or (¬ P) (¬ Q) )
        →←
      }
      P
      { :(¬ Q)
        (or (¬ P) (¬ Q) )
        →←
      }
      Q
      (and P Q)
      →←
    }
    (or (¬ P) (¬ Q) ) 
  }
  (⇒ (¬ (and P Q) ) (or (¬ P) (¬ Q) ))
}

// Assignment #6
// (a)  P and Q ⇔ Q and P
{
  { :(and P Q) P Q (and Q P) }
  { :(and Q P) P Q (and P Q) }
  (⇔ (and P Q) (and Q P) )
}

// (b)  P and ¬Q ⇒ ¬(P⇒Q)
{
  { :(and P (¬ Q)) 
    { :(⇒ P Q) P (¬ Q) Q →← }
    (¬ (⇒ P Q))
  }
  (⇒ (and P (¬ Q)) (¬ (⇒ P Q)) )
}

// (c) P or ¬P
{
  { :(¬ (or P (¬ P)))
    { :P
      (or P (¬ P))
      →← 
    }
    (¬ P)
    (or P (¬ P))
    →←
  }
  (or P (¬ P))
}

// (d) (P⇒Q)⇒¬P or Q
// uh... I already got this for free somehow. Probably from the reverse direction
{
  (⇒ (⇒ P Q) (or (¬ P) Q))  
}

// (e) P or (Q and R) ⇔ (P or Q) and (P or R)
{ { :(or P (and Q R)) 
    :{ :P (and (or P Q) (or P R)) } 
    :{ :(and Q R) (and (or P Q) (or P R))} 
    (and (or P Q) (or P R)) 
  } <<
  { :(or P Q) 
    :{ :P (or P (and Q R)) } 
    :{ :Q (or P (and Q R)) } 
    (or P (and Q R))
  } <<  
  { :(or P R) 
    :{ :P (or P (and Q R)) } 
    :{ :R (or P (and Q R)) } 
    (or P (and Q R))
  } <<  
    
  { :(or P (and Q R))
    { :P (or P Q) (or P R) (and (or P Q) (or P R)) }
    { :(and Q R) Q R (or P Q) (or P R) (and (or P Q) (or P R)) } 
    (and (or P Q) (or P R))
  }
  { :(and (or P Q) (or P R)) (or P Q) (or P R) 
    { :P (or P (and Q R)) }
    { :Q { :P (or P (and Q R)) } { :R (and Q R) (or P (and Q R)) }
      (or P (and Q R))}
    (or P (and Q R))}
  (⇔ (or P (and Q R)) (and (or P Q) (or P R)) )
}

// (f) (P or Q) and ¬Q ⇒ P
{ { :(or P Q) :{ :P P } :{ :Q P } P } <<
  { :(and (or P Q) (¬ Q)) (or P Q) (¬ Q) 
    { :Q { :(¬ P) →← } P }
    P
  }
  (⇒ (and (or P Q) (¬ Q)) P)
} 


{
  // Assignment #10.4
  (<<< 'Assignment #10.4')
  (<<< ' ')
  (<<< 'Theorem:')
  { :(or (or (¬ (⇒ P Q)) (¬ P)) Q) }
  (<<< 'Proof:')
  { :(¬ (or (or (¬ (⇒ P Q)) (¬ P)) Q ) )
    { :(¬ (or (¬ (⇒ P Q)) (¬ P)))
      { :Q
        (or (or (¬ (⇒ P Q)) (¬ P)) Q )
        →←
      }
      (¬ Q)
      { :P 
        { :(⇒ P Q)
          Q
          →←
        }
        (¬ (⇒ P Q))
        (or (¬ (⇒ P Q)) (¬ P))
        →←
      }
      (¬ P)
      (or (¬ (⇒ P Q)) (¬ P))
      →←
    }
    (or (¬ (⇒ P Q)) (¬ P))
    →←
  }
  (or (or (¬ (⇒ P Q)) (¬ P)) Q)
}