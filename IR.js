// parses LLVM IR code

var fs = require('fs');

var regexs = {
	define: /define ([^ ]+) ([^\(]+)\(([^\)]*)\)([^{]+){/,
	declare: /declare ([^ ]+) ([^\(]+)([^\)]+)\)/,

	call: /\s*call ([^ ]+) ([^\(]+)\((.+)/,
	ret: /\s*ret (.+)/,

	alloca: /\s*alloca (.+)/,

	localSet: /\s+%([^ ]+) = (.+)/,
}

function parse(file, ffi) {
	// strip out some really useless fields
	// if this turns out to be useful in the future
	// (aka I just broke something)
	// poke me

	file = file.replace("zeroext ", "");
	file = file.replace(" zeroext", "");
	file = file.replace("signext ", "");
	file = file.replace(", align 4", "");

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

				codeBlock = [];

				if(ffi.indexOf(funcName) > -1) {
					codeBlock = [{
						type: "ffi",
						ffiBlock: funcName
					}];
				}

				mod.functions.push({
					returnType: returnType,
					paramList: paramList,
					funcName: funcName,
					code: codeBlock
				})

				console.log(m);
			}
		} else {
			if(lines[i] == "}") {
				mod.functions.push(functionBlock);
				inFunctionBlock = false;
			} else if(regexs.localSet.test(lines[i])) {
				var m = lines[i].match(regexs.localSet);
				console.log(m);

				var block = {
					type: "set",
					name: "%"+m[1],
					val: 0,
					computation: []
				};

				if(regexs.call.test(m[2])) {
					block.val = ["readVariable", "return value"];
					block.computation = callBlock(m[2].match(regexs.call));

					functionBlock.code.push(block);
				} else if(regexs.alloca.test(m[2])) {
					// no computation work here, but it still needs a spot on the stack for now
					// todo: optimize alloca calls out
					
					functionBlock.code.push(block);
				}
			} else if(regexs.call.test(lines[i])) {
				functionBlock.code.push(callBlock(lines[i].match(regexs.call)));
			} else if(regexs.ret.test(lines[i])) {
				functionBlock.code.push({
					type: "ret",
					value: extractTypeValue(lines[i].match(regexs.ret)[1])
				});
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

module.exports = function(options) {
	return parse(fs.readFileSync(options.filename).toString(), options.ffi || []);
}

// block definitions
function callBlock(m) {
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
			if(temp.length)
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
		params[j] = extractTypeValue(params[j]);
	}

	return {
			type: "call",
			returnType: returnType,
			funcName: funcName,
			paramList: params
	};
}

function extractTypeValue(glob) {
		var type = glob.split(' ')[0];
		var val = glob.slice(type.length+1);
		return [type, val];
}