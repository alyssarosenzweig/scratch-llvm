/*
front-end to the compiler
*/

var IR = (require('./IR'))( process.argv[2]);
var meow = (require("./meow"))();
var backend = require("./backend");

for(var i = 0; i < IR.functions.length; ++i) {
	meow.addScript(backend.compileFunction(IR.functions[i]));
}

console.log(JSON.stringify(meow.serialize()));