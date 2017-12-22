
We have designed the work on the Lurch Deductive Engine (LDE) to progress in
phases.  The idea is that each phase ends with a completed whole that can be
tested in that state, and that provides more features than the previous
state did.  By the time the final phase is complete, the LDE will be a
robust and useful product.

# LDE Design Phase 9: Parsing

This document is not yet complete.  Its content will eventually specify:

 * Rules for defining parsing
 * Constant declarations may be implemented under the hood as special cases
   of language rules.
    * This does not mean they must parse into OpenMath symbols.  It is
      acceptable to parse them into, for example, OpenMath strings, with a
      special attribute Constant=True, or any equally unique/recognizable
      expression.
    * Also, this does not mean that constant declarations must feel to the
      user like language rule declarations feel.  We can let users think of
      them and express them as constant declarations, but under the hood it
      may be implemented as if it had been a language rule.
 * This enables: propositional logic in its usual notation, and other
   related simple systems
