/*
front-end to the compiler
*/

var IR = (require('./IR'))( process.argv[2]);
var meowcc = (require("./meow"))();

console.log(IR);

meowcc.addScript([
		"sqrt", 9
	]);
console.log(JSON.stringify(meowcc.serialize()));