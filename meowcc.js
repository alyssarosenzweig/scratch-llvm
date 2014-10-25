/*
front-end to the compiler
*/

var IR = (require('./IR'))(
	{
		filename: process.argv[2],
		ffi: ["@putch"]
	}
);

var meow = require("./meow").instance();
var backend = require("./backend");

backend.ffi["@putch"] = [
	//["doAsk", ["concatenate:with:", "@putch ", ["getParam", "param0", "r"]]]

	["doIfElse",
					["=", ["getParam", "param0", "r"], "13"],
					[["append:toList:", "", "TTY"]],
					[["setLine:ofList:to:",
							["lineCountOfList:", "TTY"],
							"TTY",
							["concatenate:with:", ["getLine:ofList:", ["lineCountOfList:", "TTY"], "TTY"], ["letter:of:", ["+", ["getParam", "param0", "r"], 2], ["readVariable", "alphabet"]]]]]]
];

console.log(JSON.stringify(IR));

var tty = new (require("./meow")).ListTuple("TTY");
tty.classicTTY();
meow.lists.push(tty);

meow.addList("Stack");
meow.addList("# of locals");

var alphabet = "";
for(var i = 0; i < 256; ++i) {
	if(i >= 32 && i < 127) {
		c = String.fromCharCode(i);
		if(c == "\\" || c == "\"")
			c = "\\"+c;
		alphabet += c;
	} else {
		alphabet += ".";
	}
}

meow.addVariable("alphabet", alphabet);

for(var i = 0; i < IR.functions.length; ++i) {
	meow.addScript(backend.compileFunction(IR.functions[i]));
}

meow.addVariable("return value", 0);

meow.addScript([
		["whenGreenFlag"],
		["call", "init tty"],
		["call", "@main"] // TODO: argc + argv
	])
meow.addScript([
		["procDef", "init tty", [], [], false],
		["append:toList:", "", "TTY"]
	])

if(process.argv[3]) {
	meow.upload(process.argv[3], 'v426', process.argv[4], process.argv[5]);
} else {
	console.log(JSON.stringify(meow.serialize()));
}