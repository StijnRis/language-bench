/* C has no JSON parser in its standard library: a small recursive-descent parser that aggregates
 * while parsing (it does not build a tree). */
#include <stdio.h>
#include <stdlib.h>

static const unsigned char *s;
static size_t i;
static long objects, str_len, trues, nulls;
static long long int_sum;

static void ws(void) {
  while (s[i] == ' ' || s[i] == '\n' || s[i] == '\r' || s[i] == '\t') i++;
}

static long string(void) {
  long n = 0;
  i++;
  for (;;) {
    unsigned char c = s[i];
    if (c == '"') {
      i++;
      return n;
    }
    if (c == '\\') {
      i += (s[i + 1] == 'u') ? 6 : 2;
    } else {
      i++;
    }
    n++;
  }
}

static void value(void) {
  ws();
  switch (s[i]) {
  case '{':
    objects++;
    i++;
    ws();
    if (s[i] == '}') {
      i++;
      return;
    }
    for (;;) {
      ws();
      string();
      ws();
      i++; /* ':' */
      value();
      ws();
      if (s[i++] == '}') return;
    }
  case '[':
    i++;
    ws();
    if (s[i] == ']') {
      i++;
      return;
    }
    for (;;) {
      value();
      ws();
      if (s[i++] == ']') return;
    }
  case '"':
    str_len += string();
    return;
  case 't':
    trues++;
    i += 4;
    return;
  case 'f':
    i += 5;
    return;
  case 'n':
    nulls++;
    i += 4;
    return;
  default: {
    int neg = s[i] == '-';
    if (neg) i++;
    long long v = 0;
    while (s[i] >= '0' && s[i] <= '9') v = v * 10 + (s[i++] - '0');
    int_sum += neg ? -v : v;
  }
  }
}

int main(int argc, char **argv) {
  FILE *f = fopen(argv[1], "rb");
  fseek(f, 0, SEEK_END);
  long size = ftell(f);
  fseek(f, 0, SEEK_SET);
  unsigned char *buf = malloc(size + 1);
  if (fread(buf, 1, size, f) != (size_t)size) return 1;
  buf[size] = 0;
  fclose(f);
  s = buf;
  value();
  printf("objects=%ld\n", objects);
  printf("int_sum=%lld\n", int_sum);
  printf("string_length=%ld\n", str_len);
  printf("true=%ld\n", trues);
  printf("null=%ld\n", nulls);
  free(buf);
  return 0;
}
