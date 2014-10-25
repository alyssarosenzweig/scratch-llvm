// takes an IR function object and returns a list of Scratch blocks

module.exports.ffi = {};

module.exports.generateFunctionHat = function(func) {
	var spec = func.funcName;
	var inputs = [];
	var defaults = [];

	for(var i = 0; i < func.paramList.length; ++i) {
		if(func.paramList[i][1])
			inputs.push(func.paramList[i][1]);
		else
			inputs.push("param"+i);
		
		defaults.push(defaultForType(func.paramList[i][0]));
		spec += " "+specifierForType(func.paramList[i][0]);
	}


	return ["procDef", spec, inputs, defaults, false];

}

module.exports.compileFunction = function(func) {
	console.log("Compiling "+JSON.stringify(func)+"...");

	var blockList = [module.exports.generateFunctionHat(func)]
					.concat(initLocal());

	for(var i = 0; i < func.code.length; ++i) {
		console.log(func.code[i]);
		if(func.code[i].type == "call") {
			// calling a (potentially foreign) function

			blockList = blockList.concat(callBlock(func.code[i]));
			
		} else if(func.code[i].type == "ffi") {
			// FFI block
			// load the code from the options
			blockList = blockList.concat(module.exports.ffi[func.code[i].ffiBlock]);
		}
	}

	blockList = blockList.concat(returnBlock());

	return blockList;
}

// fixme: stub
function defaultForType(type) {
	console.log(type);
	return 0;
}

// fixme: stub
function specifierForType(type) {
	return "%s";
}

// fixme: stub
function formatValue(type, value) { 
	return value;
}

// higher-level code generation
function initLocal() {
	return [
		["append:toList:", "0", "# of locals"]
	]
}

function allocateLocal(val) {
	return [
		["setLine:ofList:to:", "last", "# of locals", ["+", ["getLine:ofList:", "last", "# of locals"], 1]],
		["append:toList:", val, "Stack"]
	];
}

function freeLocals() {
	return [
		["doRepeat", ["getLine:ofList:", "last", "# of locals"], [["deleteLine:ofList:", "last", "Stack"]]],
		["deleteLine:ofList:", "last", "# of locals"]
	];
}

function returnBlock(val) {
	var proc = freeLocals();
	
	if(val) {
		proc.push(["setVar:to:", "return value", val]);
	}

	proc.push(["stopScripts", "this script"]);

	return proc;
}

function callBlock(block) {
	var spec = block.funcName;
	var args = [];


	for(var a = 0; a < block.paramList.length; ++a) {
		args.push(formatValue(block.paramList[a][0], block.paramList[a][1]));
		spec += " "+specifierForType(block.paramList[a][0]);
	}

	return [
		["call", spec]
	];
}