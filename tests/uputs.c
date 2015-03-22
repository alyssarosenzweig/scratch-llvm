void putch(char);

void uputs(char* str) {
	for(; *str != 0; str++)
		putch(*str);
}

void main() {
	uputs("Hello, World! uputs is magic.\n");
}
