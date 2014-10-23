/*
front-end to the compiler
*/

var IR = (require('./IR'))(
	{
		filename: process.argv[2],
		ffi: ["@putch"]
	}
);

var meow = (require("./meow"))();
var backend = require("./backend");

backend.ffi["@putch"] = [
	//["doAsk", ["concatenate:with:", "@putch ", ["getParam", 1]]]
	["doAsk", "@putch stub"]
];

console.log(JSON.stringify(IR));

for(var i = 0; i < IR.functions.length; ++i) {
	meow.addScript(backend.compileFunction(IR.functions[i]));
}

if(process.argv[3]) {
	meow.upload(process.argv[3], 'v426', process.argv[4], process.argv[5]);
} else {
	console.log(JSON.stringify(meow.serialize()));
}