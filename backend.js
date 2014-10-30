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

		var hasGotoComplex = functionContext.gotoComplex && functionContext.gotoComplex.okToUse; // this MUST be before compileInstruction for branching to work
		var instruction = compileInstruction(functionContext, func.code[i]);

		if(hasGotoComplex) {
			if(functionContext.gotoComplex.currentContext[2]) {
				functionContext.gotoComplex.currentContext[2] =
					functionContext.gotoComplex.currentContext[2].concat(instruction);
			} else {
				functionContext.gotoComplex.currentContext[2] = instruction;
			}
		} else {
			blockList = blockList.concat(instruction);
		}
	}

	//blockList = blockList.concat(returnBlock());

	return blockList;
}

function compileInstruction(ctx, block) {
	if(block.type == "call") {
		// calling a (potentially foreign) function
		return callBlock(block);
	} else if(block.type == "ffi") {
		// FFI block
		// load the code from the options
		return module.exports.ffi[block.ffiBlock];
	} else if(block.type == "set") {
		var val = 0;

		console.log("SET: "+JSON.stringify(block));

		if(block.val.type == "return value") {
			val = ["readVariable", "return value"];
		} else if(block.val.type == "variable") {
			val = fetchByName(block.val.name);
		} else if(block.val.type == "arithmetic") {
			val = [block.val.operation, fetchByName(block.val.operand1), fetchByName(block.val.operand2)];
		} else if(block.val.type == "comparison") {
			val = [specForComparison(block.val.operation), fetchByName(block.val.left), fetchByName(block.val.right)];
		}

		return compileInstruction(ctx, block.computation)
				.concat(allocateLocal(val, block.name));
	} else if(block.type == "ret") {
		return returnBlock(block.value);
	} else if(block.type == "store") {
		return dereferenceAndSet(block.destination.value, block.src.value);
	} else if(block.type == "gotoComplex") {
		ctx.gotoComplex = {
			context: [],
			okToUse: false,
			forever: ["doForever", []]
		}

		return [ctx.gotoComplex.forever];
	} else if(block.type == "label") {
		var chunk = ["doIfElse", ["=", getCurrentLabel(), block.label], [], []];

		if(ctx.gotoComplex.currentContext) {
			ctx.gotoComplex.currentContext[3] = [chunk];
			ctx.gotoComplex.currentContext = ctx.gotoComplex.currentContext[3];
		} else {
			ctx.gotoComplex.currentContext = chunk;
			ctx.gotoComplex.context = ctx.gotoComplex.currentContext;
			ctx.gotoComplex.forever[1] = [ctx.gotoComplex.context];
		}

	} else if(block.type == "branch") {
		ctx.gotoComplex.okToUse = true;
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
		return fetchByName(value);
	}

	return value;
}

function getOffset(value) {
	return functionContext.localDepth - functionContext.locals[value];
}

function stackPosFromOffset(offset) {
	return ["-", ["lineCountOfList:", "Stack"], offset];
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

function fetchByName(n) {
	if(functionContext.locals[n])
		return ["getLine:ofList:", stackPosFromOffset(getOffset(n)), "Stack"];
	else if(functionContext.params.indexOf(n) > -1)
		return ["getParam", n, "r"];
	else if( (n * 1) == n)
		return n
	else
		return 0;
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

// TODO: more robust implementation to support heap

function dereferenceAndSet(ptr, content) {
	return [
		[
			"setLine:ofList:to:",
			stackPosFromOffset(getOffset(ptr)),
			"Stack",
			fetchByName(content)
		]
	];
}

function specForComparison(comp) {
	if(comp == "eq") {
		return "=";
	}
	return "undefined";
}

function getCurrentLabel() {
	return ["getLine:ofList:", "last", "Label Stack"];
}