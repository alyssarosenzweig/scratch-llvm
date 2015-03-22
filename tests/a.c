void putchar(int);

void alphabet(int letter) {
	putchar(letter);
	alphabet(letter + 1);
}

void main() {
	alphabet(0);
}
