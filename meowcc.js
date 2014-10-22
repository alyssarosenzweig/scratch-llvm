/*
front-end to the compiler
*/

var IR = (require('./IR'))( process.argv[2]);
var meowcc = (require("./meow"))();

console.log(IR);

console.log(meowcc.serialize());