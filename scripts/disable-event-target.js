//////////////////////////////////////////////////////////////////////////////
//
// disable-event-target
//
// Description: This allows us to load a version of MathConcept that does not
//              extend the EventTarget class for clients that don't edit
//              LCs in real time, like node or a LaTeX package.
//
// Syntax: Importing this module BEFORE importing the math-concept.js module
//         will cause MathConcept to not be a subclass of EventTarget.  This 
//         module assumes that 'global' is defined, so you should not try 
//         to import this module in a browser.
//
///////////////////////////////////////////////////////////////////////////////
global.disableEventTarget = true