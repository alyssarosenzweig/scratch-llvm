void putchar(int);
void puts(char*);

void putnum(int num) {
  putchar( '0' + ((num - (num % 10)) / 10) );
  putchar( '0' + (num % 10));
}

void main() {
  for(int i = 0; i < 100; ++i) {
    if( (i % 15) == 0) {
      puts("Fizzbuzz\n");
    } else if( (i % 3) == 0) {
      puts("Fizz\n");
    } else if( (i % 5) == 0) {
      puts("Buzz\n");
    } else {
      putnum(i);
    }
  }
}
