/*
front-end to the compiler
*/

var IR = (require('./IR'))(
	{
		filename: process.argv[2],
		ffi: ["@putch", "@puts"]
	}
);

console.log(IR.globals);

var meow = require("./meow").instance();
var backend = require("./backend");

backend.ffi["@putch"] = [
	["doIfElse",
					["=", ["getParam", "param0", "r"], "13"],
					[["append:toList:", "", "TTY"]],
					[["setLine:ofList:to:",
							["lineCountOfList:", "TTY"],
							"TTY",
							["concatenate:with:", ["getLine:ofList:", ["lineCountOfList:", "TTY"], "TTY"], ["letter:of:", ["+", ["getParam", "param0", "r"], 1], ["readVariable", "alphabet"]]]]]]
];

backend.ffi["@puts"] = [
	["setVar:to:", "_temp0", 0],
	["doUntil",
		["=",
			["getLine:ofList:", ["+", ["getParam", "param0", "r"], ["readVariable", "_temp0"]], "Data"],
			"0"],
		[["call",
				"@putch %s",
				["getLine:ofList:", ["+", ["getParam", "param0", "r"], ["readVariable", "_temp0"]], "Data"]],
			["changeVar:by:", "_temp0", 1]]]
];

console.log(JSON.stringify(IR));

var tty = new (require("./meow")).ListTuple("TTY");
tty.classicTTY();
meow.lists.push(tty);

meow.addList("Stack");
meow.addList("Label Stack");

var data = new (require("./meow")).ListTuple("Data");
var dataLength = 0;

for(var i = 0; i < IR.globals.length; ++i) {
	var global = IR.globals[i];

	if(Array.isArray(global.val)) {
		dataLength += global.val.length;
		data.contents = data.contents.concat(global.val);
		global.ptr = dataLength;
	} else {
		console.log("Warning: non-array global found. TODO: actually implement this");
	}
}

meow.lists.push(data);

var alphabet = "";
for(var i = 0; i < 256; ++i) {
	if(i >= 32 && i < 127) {
		c = String.fromCharCode(i);
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
meow.addVariable("_temp0", 0);

meow.addScript([
		["whenGreenFlag"],
		["deleteLine:ofList:", "all", "Label Stack"],
		["deleteLine:ofList:", "all", "Stack"],
		["deleteLine:ofList:", "all", "TTY"],
		["append:toList:", "", "TTY"],
		["call", "@main"] // TODO: argc + argv
	])

if(process.argv[3]) {
	meow.upload(process.argv[3], 'v426', process.argv[4], process.argv[5]);
} else {
	console.log(JSON.stringify(meow.serialize()));
}