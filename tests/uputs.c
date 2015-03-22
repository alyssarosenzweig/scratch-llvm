void putchar(char);

void uputs(char* str) {
	for(; *str != 0; str++)
		putchar(*str);
}

void main() {
	uputs("Hello, World! uputs is magic.\n");
}
