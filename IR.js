// parses LLVM IR code

var fs = require('fs');

var regexs = {
	define: /define ([^ ]+) ([^\(]+)\(([^\)]*)\)([^{]+){/
}

function parse(file) {
	var lines = file.split('\n');

	for(var i = 0; i < lines.length; ++i) {
		if(regexs.define.test(lines[i])) {
			var m = lines[i].match(regexs.define);
			console.log(m);

			var returnType = m[1];
			var funcName = m[2];
			var paramList = m[3];
			var modifiers = m[4];

			var params = paramList.split(',');
			var formattedParams = [];
			for(var j = 0; j < params.length; ++j) {
				formattedParams.push( params[j].trim().split(' ') );
			}

			console.log(returnType+" "+funcName+"("+formattedParams+");");
		}
	}
}

module.exports = function(filename) {
	return parse(fs.readFileSync(filename).toString());
}