/*
front-end to the compiler
*/

var IR = (require('./IR'))( process.argv[2]);
var meow = (require("./meow"))();
var backend = require("./backend");

for(var i = 0; i < IR.functions.length; ++i) {
	meow.addScript(backend.compileFunction(IR.functions[i]));
}

meow.upload(process.argv[3], 'v426', process.argv[4], process.argv[5]);