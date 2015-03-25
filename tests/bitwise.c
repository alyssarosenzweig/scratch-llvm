void putchar(int n);

void print_hexdigit(int d) {
  if(d < 0xA) putchar('0' + d);
  else        putchar('A' + d - 0xA);
}

void print_hex(int n) {
  print_hexdigit((n & 0xF0) >> 4);
  print_hexdigit(n & 0x0F);
}

void main() {
  print_hex(0xDE);
  print_hex(0xAD);
  print_hex(0xBE);
  print_hex(0xEF);
}
