
# Lurch Deductive Engine (LDE) Main File

This file imports all the other modules in this repository and exposes them
through its `exports` member, so that clients can import just this one file
and have access to all the functionality from all the source files in this
repository.

Imports:

    { Structure } = require './structure'

Exports:

    exports.Structure = Structure
