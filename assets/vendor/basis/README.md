# Basis Universal transcoder

`transcoder.js` and `transcoder.wasm` are the matching browser transcoder pair
distributed with three.js r180, used by PlayCanvas's built-in Basis worker:

- https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/jsm/libs/basis/basis_transcoder.js
- https://raw.githubusercontent.com/mrdoob/three.js/r180/examples/jsm/libs/basis/basis_transcoder.wasm

Basis Universal is Copyright Binomial LLC, Apache 2.0. Included `LICENSE`
comes from https://github.com/BinomialLLC/basis_universal/blob/master/LICENSE.
Files are served locally; the game does not download a decoder from three.js.
Only the opt-in urban pilot initializes this worker.
