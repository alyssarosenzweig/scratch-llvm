void putch(int);

void alphabet(int letter) {
	putch(letter);
	alphabet(letter + 1);
}

void main() {
	alphabet(0);
}