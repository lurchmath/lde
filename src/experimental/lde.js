/*
 *        Global n-compact validation in the Browser or Node
 *
 * To import n-compact validation in a web page, just load this file.
 * e.g. 
 * 
 *  <script type='module' src="../lde.js"></script>
 *  
 * and adjust the path to src accordingly.
 */
import LDE from './global-validation.js'

self.validate = LDE.validate
self.lc = x => LDE.LogicConcept.fromPutdown(x)[0]