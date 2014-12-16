void putch(char);

void uputs(char* str) {
	while(*str != 0) {
		putch(*str);
		str++;
	}
}

void main() {
	uputs("Hello, World! uputs is magic.\n");
}