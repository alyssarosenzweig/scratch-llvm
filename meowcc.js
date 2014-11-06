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
					["|", ["=", ["getParam", "param0", "r"], "13"], ["=", ["getParam", "param0", "r"], "10"]],
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
			["getLine:ofList:", ["+", ["getParam", "param0", "r"], ["readVariable", "_temp0"]], "DATA"],
			"0"],
		[["call",
				"@putch %s",
				["getLine:ofList:", ["+", ["getParam", "param0", "r"], ["readVariable", "_temp0"]], "DATA"]],
			["changeVar:by:", "_temp0", 1]]]
];

console.log(JSON.stringify(IR));

var tty = new (require("./meow")).ListTuple("TTY");
tty.classicTTY();
meow.lists.push(tty);

meow.addList("Stack");
meow.addList("Label Stack");

var rodata = new (require("./meow")).ListTuple(".rodata");
var rodataLength = 0;

IR.rootGlobal = {};

var rodataOffset = 1;

for(var i = 0; i < IR.globals.length; ++i) {
	var global = IR.globals[i];

	if(Array.isArray(global.val)) {
		global.ptr = rodataLength + rodataOffset;
		rodataLength += global.val.length;
		rodata.contents = rodata.contents.concat(global.val);
	} else {
		console.log("Warning: non-array global found. TODO: actually implement this");
	}

	IR.rootGlobal[global.name] = global;
}

meow.lists.push(rodata);

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
	meow.addScript(backend.compileFunction(IR.functions[i], IR));
}

meow.addVariable("return value", 0);
meow.addVariable("_temp0", 0);

meow.addList("DATA");
meow.addVariable("sp");
meow.addVariable(".data");

var dataSectionSize = 1024;

meow.addScript([
		["whenGreenFlag"],

		["deleteLine:ofList:", "all", "DATA"],
		["setVar:to:", "i", "1"],
		["doRepeat",
			dataSectionSize,
			[["append:toList:", ["*", ["getLine:ofList:", ["readVariable", "i"], ".rodata"], 1], "DATA"],
				["changeVar:by:", "i", 1]]],
		["setVar:to:", "sp", dataSectionSize - 1],
		["setVar:to:", ".data", "1"],

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