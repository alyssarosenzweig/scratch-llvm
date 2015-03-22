void putchar(int);

void main() {
	for(int i = 0; i < 10; ++i) {
		if(i > 5) {
			putchar('A' + i);
		} else {
			putchar('0' + i);
		}
	}
}
