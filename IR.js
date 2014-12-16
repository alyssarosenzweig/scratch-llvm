// parses LLVM IR code

var fs = require('fs');

var regexs = {
	define: /^define ([^ ]+) ([^\(]+)\(([^\)]*)\)([^{]+){/,
	declare: /^declare ([^ ]+) ([^\(]+)([^\)]+)\)/,

	call: /^\s*call ([^ ]+) ([^\(]+)\((.+)/,
	ret: /^\s*ret (.+)/,

	alloca: /^\s*alloca (.+)/,
	store: /^\s+store ([^ ]+) ([^,]+), ([^ ]+) ([^,]+)/,

	load: /^load ([^ ]+) (.+)/,
	add: /^add ([^ ]+) ([^,]+), (.+)/,
	sub: /^sub ([^ ]+) ([^,]+), (.+)/,
	mul: /^mul ([^ ]+) ([^,]+), (.+)/,
	div: /^div ([^ ]+) ([^,]+), (.+)/,
	icmp: /^icmp ([^ ]+) ([^ ]+) ([^,]+), (.+)/,
	sext: /^sext i\d+ ([^ ]+) to i\d+/,
	getelementptr: /^getelementptr (inbounds )?([^ ]+) ([^,]+), ([^ ]+) (.+)/,

	localSet: /^\s+%([^ ]+) = (.+)/,

	label: /; <label>:(\d+)/,
	absoluteBranch: /\s+br label (.+)/,
	conditionalBranch: /\s+br i1 ([^,]+), label ([^,]+), label (.+)/,

	globalVar: /@([^ ]+) = (private )?(unnamed_addr )?(constant )?((\[([^\]])+\])|([^ ]+))(.+)/,

	inlineInstruction: /([a-zA-Z ]+)\(([^\(]+)\)/
}

function parse(file, ffi) {
	// strip out some really useless fields
	// if this turns out to be useful in the future
	// (aka I just broke something)
	// poke me

	file = file.replace(/zeroext /g, "");
	file = file.replace(/ zeroext/g, "");
	file = file.replace(/signext /g, "");
	file = file.replace(/ signext/g, "");
	file = file.replace(/, align \d/g, "");
	file = file.replace(/ nsw/g, "");
	file = file.replace(/ nuw/g, "");

	var lines = file.split('\n');

	var mod = {
		functions: [],
		globals: []
	};

	var inFunctionBlock = false;
	var functionBlock = {};

	function gotoComplex(initBranch) {
		if(!functionBlock.inGotoComplex) {
			functionBlock.inGotoComplex = true;
			functionBlock.code.push({
				type: "gotoComplex"
			});

		}
	}

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
					code: [],
					labels: {},
					inGotoComplex: false
				};
				inFunctionBlock = true;
			} else if(regexs.declare.test(lines[i])) {
				var m = lines[i].match(regexs.declare);

				var returnType = m[1];
				var funcName = m[2];
				var paramList = extractParamList(m[3]);

				codeBlock = [];
				hasFFI = false;

				if(ffi.indexOf(funcName) > -1) {
					codeBlock = [{
						type: "ffi",
						ffiBlock: funcName
					}];
					hasFFI = true;
				}

				mod.functions.push({
					returnType: returnType,
					paramList: paramList,
					funcName: funcName,
					code: codeBlock,
					hasFFI: hasFFI
				})

			} else if(regexs.globalVar.test(lines[i])) {
				var m = lines[i].match(regexs.globalVar);

				var name = m[1].trim();
				var type = m[5].trim();

				var val = null;
				
				if(m[9]) {
					val = formatValue(type, m[9].trim());
				}

				mod.globals.push({
					name: name,
					type: type,
					val: val
				});
			}
		} else {
			if(lines[i] == "}") {
				mod.functions.push(functionBlock);
				inFunctionBlock = false;
			} else if(regexs.label.test(lines[i])) {
				var m = lines[i].match(regexs.label);
				functionBlock.labels[m[1]] = functionBlock.code.length;

				// synthetic label block for enabling the backend to function properly
				// without the need of very messy hacks (iterating through labels, etc.)

				functionBlock.code.push({
					type: "label",
					label: m[1]
				});
			} else if(regexs.localSet.test(lines[i])) {
				var m = lines[i].match(regexs.localSet);

				var block = {
					type: "set",
					name: "%"+m[1],
					val: {},
					computation: []
				};

				if(regexs.call.test(m[2])) {
					block.val = {
						type: "return value"
					}
					block.computation = callBlock(m[2].match(regexs.call));

					functionBlock.code.push(block);
				} else if(regexs.alloca.test(m[2])) {
					// no computation work here, but it still needs a spot on the stack for now
					// todo: optimize alloca calls out
					
					var m = m[2].match(regexs.alloca);
					
					block.val = {
						vtype: m[1]+"*"
					}

					functionBlock.code.push(block);
				} else if(regexs.load.test(m[2])) {
					var m = m[2].match(regexs.load);

					block.val = {
						type: "variable",
						name: m[2],
						vtype: m[1]
					}

					functionBlock.code.push(block);
				} else if(regexs.add.test(m[2])) {
					var m = m[2].match(regexs.add);
					block.val = {
						type: "arithmetic",
						operation: "+",
						operand1: m[2],
						operand2: m[3]
					};

					functionBlock.code.push(block);
				} else if(regexs.sub.test(m[2])) {
					var m = m[2].match(regexs.add);
					block.val = {
						type: "arithmetic",
						operation: "-",
						operand1: m[2],
						operand2: m[3]
					};

					functionBlock.code.push(block);
				} else if(regexs.mul.test(m[2])) {
					var m = m[2].match(regexs.add);
					block.val = {
						type: "arithmetic",
						operation: "*",
						operand1: m[2],
						operand2: m[3]
					};

					functionBlock.code.push(block);
				} else if(regexs.div.test(m[2])) {
					var m = m[2].match(regexs.add);
					block.val = {
						type: "arithmetic",
						operation: "/",
						operand1: m[2],
						operand2: m[3]
					};

					functionBlock.code.push(block);
				} else if(regexs.icmp.test(m[2])) {
					var m = m[2].match(regexs.icmp);

					block.val = {
						type: "comparison",
						operation: m[1],
						left: m[3],
						right: m[4]
					}

					functionBlock.code.push(block);
				} else if(regexs.sext.test(m[2])) {
					var m = m[2].match(regexs.sext);

					block.val = {
						type: "signext",
						source: m[2],
						originalType: m[1],
						newType: m[3]
					}

					functionBlock.code.push(block);
				} else if(regexs.getelementptr.test(m[2])) {
					console.log("getelementptr todo");

					var m = m[2].match(regexs.getelementptr);

					block.val = {
						type: "addressOf",
						base: {
							name: m[2]
						}
					}

					functionBlock.code.push(block);
				} else {
					console.log("Unknown instruction equality: ");
					console.log(lines[i]);
				}
			} else if(regexs.call.test(lines[i])) {
				functionBlock.code.push(callBlock(lines[i].match(regexs.call)));
			} else if(regexs.ret.test(lines[i])) {
				functionBlock.code.push({
					type: "ret",
					value: extractTypeValue(lines[i].match(regexs.ret)[1])
				});
			} else if(regexs.store.test(lines[i])) {
				var m = lines[i].match(regexs.store);

				functionBlock.code.push({
					type: "store",
					src: {
						type: m[1],
						value: m[2]
					},
					destination: {
						type: m[3],
						value: m[4]
					}
				})

			} else if(regexs.absoluteBranch.test(lines[i])) {
				var label = lines[i].match(regexs.absoluteBranch)[1];
				gotoComplex();
				functionBlock.code.push({
					type: "branch",
					conditional: false,
					dest: label.slice(1)
				});
			} else if(regexs.conditionalBranch.test(lines[i])) {
				var match = lines[i].match(regexs.conditionalBranch);
				gotoComplex();

				functionBlock.code.push({
					type: "branch",
					conditional: true,
					dest: match[2],
					falseDest: match[3],
					condition: match[1]
				})
			} else {
				console.log("Unknown instruction line: ");
				console.log(lines[i]);
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
		var val = formatValue(type, glob.slice(type.length+1));
		return [type, val];
}

function hexToDec(digit) {
	return (digit >= '0' && digit <= '9') ?
				digit * 1
			: (digit >= 'A' && digit <= 'F') ?
				(digit.charCodeAt(0) - 65) + 10
			: (digit >= 'a' && digit <= 'f') ?
				(digit.charCodeAt(0) - 96) + 10
			: 0;
}

function hexPairToByte(pair) {
	return ( hexToDec(pair[0]) << 4) | hexToDec(pair[1]);
}

function extracti8ArrayFromString(str) {
	var strData = str.slice(2, -1);
	var i8array = [];

	for(var i = 0; i < strData.length; ++i) {
		if(strData[i] == "\\") {
			i8array.push(hexPairToByte(strData[++i] + strData[++i]));
		} else {
			i8array.push(strData.charCodeAt(i));
		}
	}

	return i8array;	
}

function extractArrayLiteral(str) {
	if(str[0] == 'c') {
		return extracti8ArrayFromString(str);
	} else if(str[0] == '[') {
		return JSON.parse(str);
	} else {
		return [];
	}
}

function formatValue(type, value) {
	if(regexs.inlineInstruction.test(value)) {
		var m = value.match(regexs.inlineInstruction);
		return constantExpression(m[1].trim(), m[2]);
	} else if(type[0] == '[') {
		return extractArrayLiteral(value);
	}

	return value;
}

function constantExpression(func, params) {
	if(func == "getelementptr inbounds") {
		// TODO address computation
		var plist = params.split(",");
		var val = plist[0].split(" ").slice(-1);

		return {
			type: "getelementptr",
			base: {
				type: plist[0].slice(0, -(val[0].length+1)),
				val: val[0]
			}
		}
	} else {
		console.log("Unknown constantExpression");
		console.log(func+"("+params+")");
	}
	return 0;
}