function LLVMType(str) {
	if(str[0] == "[") {
		str = str.slice(1, -1).split(" x ");

		this.isArray = true;
		this.arraySize = str[0] * 1;
		this.elementType = new LLVMType(str[1]);
		this.typeSize = this.arraySize * getTypeSize(this.elementType);
	} else if(/i\d+/.test(str)) {
		this.isInteger = true;
		this.integerBits = str.slice(1) * 1;
		this.typeSize = getIntegerSize(this.integerBits);
	}
}

function getTypeSize(type) {
	return type.typeSize;
}

function getIntegerSize(size) {
	return (size == 1 || size == 8) ? 1 : 
			(size == 16) ? 2 :
			(size == 32) ? 4 :
			(size == 64) ? 8 :
			1;
}

module.exports = LLVMType;