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

	var blockList = [module.exports.generateFunctionHat(func)];

	for(var i = 0; i < func.code.length; ++i) {
		console.log(func.code[i]);
		if(func.code[i].type == "call") {
			// calling a (potentially foreign) function
			// stub

			console.log(func.code[i]);

			var spec = func.code[i].funcName;
			var args = [];


			for(var a = 0; a < func.code[i].paramList.length; ++a) {
				args.push(formatValue(func.code[i].paramList[a][0], func.code[i].paramList[a][1]));
				spec += " "+specifierForType(func.code[i].paramList[a][0]);
			}



			blockList.push(
				[
					"call",
					spec
				].concat(args)
			)
		} else if(func.code[i].type == "ffi") {
			// FFI block
			// load the code from the options
			blockList = blockList.concat(module.exports.ffi[func.code[i].ffiBlock]);
		}
	}

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