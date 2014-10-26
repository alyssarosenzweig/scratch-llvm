// takes an IR function object and returns a list of Scratch blocks

module.exports.ffi = {};

var functionContext = {
	locals: {},
	localDepth: 0,
	params: []
}

module.exports.generateFunctionHat = function(func) {
	var spec = func.funcName;
	var inputs = [];
	var defaults = [];

	functionContext.params = [];

	for(var i = 0; i < func.paramList.length; ++i) {
		var pName = "param" + i;

		if(func.paramList[i][1])
			pName = func.paramList[i][1];

		inputs.push(pName);
		functionContext.params.push(pName);
		
		defaults.push(defaultForType(func.paramList[i][0]));
		spec += " "+specifierForType(func.paramList[i][0]);
	}


	return ["procDef", spec, inputs, defaults, false];

}

module.exports.compileFunction = function(func) {
	console.log("Compiling "+JSON.stringify(func)+"...");

	var blockList = [module.exports.generateFunctionHat(func)]
					.concat(initLocal());

	functionContext.locals = {};
	functionContext.localDepth = 0;

	for(var i = 0; i < func.code.length; ++i) {
		console.log(func.code[i]);
		blockList = blockList.concat(compileInstruction(func.code[i]));
	}

	//blockList = blockList.concat(returnBlock());

	return blockList;
}

function compileInstruction(block) {
	if(block.type == "call") {
		// calling a (potentially foreign) function
		return callBlock(block);
	} else if(block.type == "ffi") {
		// FFI block
		// load the code from the options
		return module.exports.ffi[block.ffiBlock];
	} else if(block.type == "set") {
		return compileInstruction(block.computation)
				.concat(allocateLocal(block.val, block.name));
	} else if(block.type == "ret") {
		return returnBlock(block.value);
	}

	return [];
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
	console.log("FORMAT: "+type+","+value);

	if(value[0] == '%') {
		return fetchLocal(getOffset(value));
	}

	return value;
}

function getOffset(value) {
	return functionContext.localDepth - functionContext.locals[value];
}

// higher-level code generation
function initLocal() {
	return [
		["append:toList:", "0", "# of locals"]
	]
}

function allocateLocal(val, name) {
	if(name) {
		console.log(name+","+val);
		functionContext.locals[name] = ++functionContext.localDepth;
	}

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

function fetchLocal(local) {
	return ["getLine:ofList:", ["-", ["lineCountOfList:", "Stack"], local], "Stack"];
}

function returnBlock(val) {
	var proc = freeLocals();
	
	if(val) {
		proc.push(["setVar:to:", "return value", formatValue(val[0], val[1])]);
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
		["call", spec].concat(args)
	];
}