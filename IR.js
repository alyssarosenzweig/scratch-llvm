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
		}
	}
}

module.exports = function(filename) {
	return parse(fs.readFileSync(filename).toString());
}