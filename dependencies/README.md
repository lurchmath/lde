
# Where did these come from?

## LSAT.js

A simple JavaScript SAT solver, see http://www.comp.nus.edu.sg/~gregory/sat/ for a live demo & more information.

## algebrite.js

A js CAS, see http://algebrite.org for a live demo and documentation.

We made the following modifications when importing Algebrite into this repository.

 - Recompiled it with the command 
   ```
   cat runtime/defs.coffee \
       sources/*.coffee \
       runtime/alloc.coffee \
       runtime/find.coffee \
       runtime/init.coffee \
       runtime/mcmp.coffee \
       runtime/otherCFunctions.coffee \
       runtime/count.coffee \
       runtime/run.coffee \
       runtime/stack.coffee \
       runtime/symbol.coffee \
       runtime/zombocom.coffee \
       runtime/freeze.coffee | \
       ../coffeescript/bin/coffee -sc --bare > \
       ../../dependencies/algebrite.js
   ```
   to create a bare version.
 - Added 
   ```
   const exports = { }
   ``` 
   to the top of the file to allow importing it.
 - Commented out the declaration of the variable, `bigInt`,
   since it's now imported instead of required.
 - Changed 
   ```
   bigInt = require('big-integer');
   ```
   to 
   ```
   import bigInt from './BigInteger.js'
   ```
 - Added 
   ```
   export default exports
   ``` 
   to the bottom of the file.
 - Note that there is no need to do any of this if you use the version that
   is in this folder, which has all these modifications included.
 
## BigInteger.js

Algebrite depends on the module `big-integer`, for arbitrary precision integers.
See https://www.npmjs.com/package/big-integer for details.

We made the following modifications when importing `big-integer` into this repository.

 - Added 
   ```
   export default bigInt
   ```
   to the bottom of the file so it can be imported by our modified Algebrite.
