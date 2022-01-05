
/**
 * This module simply gathers all the definitions from smaller modules in the
 * `/src/matching` folder and places them in a single namespace.  This makes it
 * convenient for the user to `import Matching from './matching.js'` and then
 * be able to refer to a `Matching.Constraint` or `Matching.Problem`, rather
 * than needing to import modules that are in subfolders, and pollute the global
 * namespace with generic terms like `Constraint` and `Problem`.
 * 
 * The full list of imported classes and modules is given below.  The members of
 * the {@link module:ExpressionFunctions ExpressionFunctions module} are each
 * imported directly, so that the client can refer to them as, for example,
 * `Matching.newEF`, rather than `Matching.ExpressionFunctions.newEF`, which
 * would be too cumbersome.
 * 
 * @see {@link NewSymbolStream NewSymbolStream class}
 * @see {@link Constraint Constraint class}
 * @see {@link CaptureConstraint CaptureConstraint class}
 * @see {@link CaptureConstraints CaptureConstraints class}
 * @see {@link module:ExpressionFunctions ExpressionFunctions module}
 * @see {@link Problem Problem class}
 * @see {@link Solution Solution class}
 *
 * @module Matching
 */

import { NewSymbolStream } from "./matching/new-symbol-stream.js"
import {
    metavariable, containsAMetavariable
} from "./matching/metavariables.js"
import { Constraint } from "./matching/constraint.js"
import { Substitution } from "./matching/substitution.js"
import {
    CaptureConstraint, CaptureConstraints
} from "./matching/capture-constraint.js"
import {
    newEF, isAnEF, arityOfEF, applyEF, constantEF, projectionEF, applicationEF,
    newEFA, isAnEFA, canBetaReduce, betaReduce, fullBetaReduce
} from '../src/matching/expression-functions.js'
import { Problem } from "./matching/problem.js"
import { Solution } from "./matching/solution.js"

export default {
    NewSymbolStream,
    Constraint, metavariable, containsAMetavariable, Substitution,
    CaptureConstraint, CaptureConstraints,
    newEF, isAnEF, arityOfEF, applyEF, constantEF, projectionEF, applicationEF,
    newEFA, isAnEFA, canBetaReduce, betaReduce, fullBetaReduce,
    Problem, Solution
}
