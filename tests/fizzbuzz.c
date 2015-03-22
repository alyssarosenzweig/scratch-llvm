void putchar(int);
void puts(char*);

void putnum(int num) {
  putchar( '0' + ((num - (num % 10)) / 10) );
  putchar( '0' + (num % 10));
  putchar('\n');
}

void main() {
  for(int i = 1; i < 100; ++i) {
    if( (i % 15) == 0) {
      puts("Fizzbuzz");
    } else if( (i % 3) == 0) {
      puts("Fizz");
    } else if( (i % 5) == 0) {
      puts("Buzz");
    } else {
      putnum(i);
    }
  }
}
