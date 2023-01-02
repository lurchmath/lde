
# Where did these come from?

## LSAT.js

A simple JavaScript SAT solver, see http://www.comp.nus.edu.sg/~gregory/sat/ for a live demo & more information.

## algebrite.js

A js CAS, see http://algebrite.org for a live demo and documentation.

*Lurch modifications*

 - recompiled algebrite with the command 
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
   script to create a --bare version of algebrite.js in the dependencies folder.
 - added 
   ```
   const exports = { }
   ``` 
   to the top of the file to allow importing it
 - commented out the declaration of the variable, `bigInt`,
   (since it's now imported instead of required)
 - changed 
    ```
    bigInt = require('big-integer');
    ```
    to 
    ```
    import bigInt from './BigInteger.js'
    ```
 - added 
   ```
   export default exports
   ``` 
   to the bottom of the file
 - note that there is no need to do any of this if you just 
   use the version that is in the `dependencies` folder of 
   the git repo.
 
## BigInteger.js

Algebrite depends on the node module `big-integer`, for 
arbitrary precision integers. 
See https://www.npmjs.com/package/big-integer for details.

*Lurch modifications*

 - added 
   ```
   export default bigInt
   ```
   to the bottom of the file so it can be imported by our
   modified Algebrite.
