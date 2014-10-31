void putch(int);

void main() {
	for(int i = 0; i < 10; ++i) {
		if(i > 5) {
			putch('A' + i);
		} else {
			putch('0' + i);
		}
	}
}