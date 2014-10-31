scratch-llvm
============

Cross-compiling LLVM into MIT Scratch, because it's interesting.

Testing
============

First, to compile a sample use:

clang -S -emit-llvm tests/[sample-name].c

To compile and dump the JSON to stdout,

node meowcc.js [sample-name].s

To compile and upload directly to the Scratch website,

node meowcc.js [sample-name].s [project id] [csrf token] [session id]

Eventually, I'll make CSRF token and session id extraction trivial (hopefully), but that'll be for later.

Working Samples:
-a.c
-for.c
-goto.c
-if.c
-recursinoo.c