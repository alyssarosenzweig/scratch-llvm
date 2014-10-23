// parses LLVM IR code

var fs = require('fs');

var regexs = {
	define: /define ([^ ]+) ([^\(]+)\(([^\)]*)\)([^{]+){/,
	declare: /declare ([^ ]+) ([^\(]+)([^\)]+)\)/,

	call: /\s*call ([^ ]+) ([^\(]+)\((.+)/
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

				functionBlock = {
					returnType: returnType,
					paramList: extractParamList(paramList),
					funcName: funcName,
					code: []
				};
				inFunctionBlock = true;
			} else if(regexs.declare.test(lines[i])) {
				var m = lines[i].match(regexs.declare);

				var returnType = m[1];
				var funcName = m[2];
				var paramList = extractParamList(m[3]);

				// TODO: stub

				mod.functions.push({
					returnType: returnType,
					paramList: paramList,
					funcName: funcName,
					code: [

					]
				})

				console.log(m);
			}
		} else {
			if(lines[i] == "}") {
				mod.functions.push(functionBlock);
				inFunctionBlock = false;
			} else if(regexs.call.test(lines[i])) {
				var m = lines[i].match(regexs.call);
				console.log(m);

				var returnType = m[1];
				var funcName = m[2];
				var paramList = m[3];
				var params = [];

				// due to the shear complexity of IR, we have to manually parse
				var p = 0;
				var temp = "";

				var paranDepth = 0;

				while(p < paramList.length) {
					if(paranDepth == 0 && (paramList[p] == ',' || paramList[p] == ')')) {
						params.push(temp);
						temp = "";
					} else {
						temp += paramList[p];

						if(paramList[p] == "(") {
							paranDepth++;
						} else if(paramList[p] == ")") {
							paranDepth--;
						}
					}

					++p;
				}

				for(var j = 0; j < params.length; ++j) {
					var type = params[j].split(' ')[0];
					var val = params[j].slice(type.length+1);
					params[j] = [type, val];
				}

				functionBlock.code.push(
				{
					type: "call",
					returnType: returnType,
					funcName: funcName,
					paramList: params
				})
			}
		}
	}

	return mod;
}

function extractParamList(params) {
	var params = params.split(',');
	var formattedParams = [];
	for(var j = 0; j < params.length; ++j) {
		if(params[j].length)
			formattedParams.push( params[j].trim().split(' ') );
	}
	return formattedParams;
}

module.exports = function(filename) {
	return parse(fs.readFileSync(filename).toString());
}