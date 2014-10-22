// parses LLVM IR code

var fs = require('fs');

var regexs = {
	define: /define ([^ ]+) ([^\(]+)\(([^\)]*)\)([^{]+){/
}

function parse(file) {
	var lines = file.split('\n');

	var mod = {
		functions: []
	};

	var inFunctionBlock = false;
	var functionBlock = {};

	for(var i = 0; i < lines.length; ++i) {
		if(!inFunctionBlock) {
			if(regexs.define.test(lines[i])) {
				var m = lines[i].match(regexs.define);

				var returnType = m[1];
				var funcName = m[2];
				var paramList = m[3];
				var modifiers = m[4];

				var params = paramList.split(',');
				var formattedParams = [];
				for(var j = 0; j < params.length; ++j) {
					formattedParams.push( params[j].trim().split(' ') );
				}

				functionBlock = {
					returnType: returnType,
					paramList: formattedParams,
					funcName: funcName,
					code: []
				};
				inFunctionBlock = true;
			}
		} else {
			if(lines[i] == "}") {
				mod.functions.push(functionBlock);
				inFunctionBlock = false;
			}
		}
	}

	return mod;
}

module.exports = function(filename) {
	return parse(fs.readFileSync(filename).toString());
}