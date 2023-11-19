## Acid Tests

The examples in this folder are from the END HackMD document.  Some are meant to be valid and others counterexamples that try to break rule restrictions.

In particular, 11a and 11b come in two forms.  One that shows the error with ∀+ when Let-bodies are not used, and one that shows it is fixed when Let-bodies are fixed.  To load 11a without Let-bodies you could do:

```js
▶︎ doc1=load('acid tests/acid Example 11a','Acid Tests')
```

but to load it with Let-bodies you could do

```js
▶︎ doc2=load('acid tests/acid Redux 11a','Acid Tests Let-Body')
```

at the Lode prompt.  Similarly for 11b.