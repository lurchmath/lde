/**
 * Lurch Options
 *
 * We just use a global for storing the current options. This avoids having to
 * pass it as an optional argument through the entire validation chain of
 * interpretations and validation tools. To set an option just do e.g.
 * `LurchOptions.avoidLoneMetavars = false`. Current validation options are:
 *
 *   * `validateall` - if true, validate all inferences.  If false, only
 *      validate the target.
 *   * `checkPreemies` - Check for preemies iff this is true
 *   * `processBIHs` - process BIHs iff this is true         
 *   * `avoidLoneMetavars` - if true don't try to instantiate lone
 *      metavariables, otherwise try to instantiate them with every user
 *      proposition.
 *   * `avoidLoneEFAs` - the same thing for lone EFAs        
 *   * `processEquations` - process equations iff this is true  
 *   * `processCases`- process the cases tool iff this is true 
 *   * `autoCases` - similar to avoidLoneMetavars=false. If true, then identify
 *      all Cases-like rules and try to instantiate their univar conclusion with
 *      every user's conclusion in the document.
 *   * `processCAS` - process CAS tool iff this is true
 *   * `processAlgebra` - use the CAS tool to validate equations followed by 'by
 *      algebra' iff this is true
 *   * `swapTheoremProofPairs` - move theorems after their next sibling if its a
 *      proof
 *   *  `updateProgress` - the function that gives progress updates while
 *       instantiating
 *   * `updateFreq` - how often to give a progress update during a pass
 *   * `badResultMsg` - what the feedback message should be internally to
 *     expressions which are not found to be propositionally valid 
 *
 */
export const LurchOptions = { 
  validateall: true ,    
  checkPreemies: true ,  
  processBIHs: true ,
  avoidLoneMetavars: true ,
  avoidLoneEFAs: true ,    
  processEquations: true ,    
  processCases: true ,    
  autoCases: false ,
  processCAS: true ,
  processAlgebra: true,
  swapTheoremProofPairs: true ,
  updateProgress: async () => { }  ,
  updateFreq: 100 ,
  badResultMsg: 'indeterminate' 
}

///////////////////////////////////////////////////////////////////////////////