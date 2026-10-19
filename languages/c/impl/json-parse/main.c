/* C has no JSON parser in its standard library: a small recursive-descent parser that aggregates
 * while parsing (it does not build a tree). */
#include <stdint.h>
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

static int64_t out[5];

void lb_setup(int argc, char **argv) { (void)argc; (void)argv; }
void *lb_decode(const unsigned char *data, size_t len) { (void)len; s = data; return (void *)data; }
void *lb_solve(void *inst) {
  (void)inst;
  i = 0; objects = str_len = trues = nulls = 0; int_sum = 0;
  value();
  out[0] = objects; out[1] = int_sum; out[2] = str_len; out[3] = trues; out[4] = nulls;
  return out;
}
void lb_emit(void *res, void (*sink)(int64_t)) { int64_t *o = res; for (int k = 0; k < 5; k++) sink(o[k]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
