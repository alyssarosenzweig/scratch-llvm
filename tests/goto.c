void putchar(int);

int main() {
	mylabel:
	putchar('H');
	putchar('i');
	putchar(13);
	goto mylabel;
}
