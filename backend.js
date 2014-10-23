// takes an IR function object and returns a list of Scratch blocks

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
		if(code[i].type == "call") {
			// calling a (potentially foreign) function
			// stub
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