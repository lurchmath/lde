
# API Documentation for the LDE's Phases

The LDE processes the Input Tree into the Output Tree and also does some
processing of the Output Tree as well.  This all happens in several phases
that proceed in sequence, each working with the output of the previous. We
document those phases below.

This documentation is not yet complete, because the phases have not yet all
been implemented.

## Modification

The modification phase is the briefest.  It is implemented in the LDE's
`runModification()` phase in its API, documented [here](https://github.com/lurchmath/lde/blob/master/src/lde.litcoffee#the-modification-phase).

That function loops through all `InputModifier` instances in the Input Tree
and calls the `updateConnections()` routine in each.  Each modifier should
take that opportunity to connect itself to the correct modification targets.
The reason for this is because those connections will govern, in the
subsequent interpretation phase, which expressions ask which modifiers to
embed data in the expressions.  In order for the expressions to make those
requests correctly, the modifiers need to decide in the modification phase
which expressions they should target.

## Interpretation

This phase is not yet implemented nor documented.

## Validation

This phase is not yet implemented nor documented.
