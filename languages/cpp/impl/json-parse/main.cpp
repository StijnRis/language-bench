// C++ has no JSON parser in its standard library: a small recursive-descent parser that aggregates
// while parsing (it does not build a tree).
#include <cstddef>
#include <cstdint>
#include <vector>

static const unsigned char *s;
static size_t i;
static long objects, str_len, trues, nulls;
static long long int_sum;

static void ws() {
  while (s[i] == ' ' || s[i] == '\n' || s[i] == '\r' || s[i] == '\t') i++;
}

static long string() {
  long n = 0;
  i++;
  for (;;) {
    unsigned char c = s[i];
    if (c == '"') {
      i++;
      return n;
    }
    if (c == '\\')
      i += (s[i + 1] == 'u') ? 6 : 2;
    else
      i++;
    n++;
  }
}

static void value() {
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
      i++; // ':'
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
    bool neg = s[i] == '-';
    if (neg) i++;
    long long v = 0;
    while (s[i] >= '0' && s[i] <= '9') v = v * 10 + (s[i++] - '0');
    int_sum += neg ? -v : v;
  }
  }
}

void lb_setup(int, char **) {}
void *lb_decode(const unsigned char *data, size_t) {
  s = data;  // the bytes of the harness buffer, NUL terminated
  return const_cast<unsigned char *>(data);
}
void *lb_solve(void *) {
  i = 0; objects = str_len = trues = nulls = 0; int_sum = 0;
  value();
  return new std::vector<int64_t>{objects, int_sum, str_len, trues, nulls};
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  for (int64_t v : *static_cast<std::vector<int64_t> *>(res)) sink(v);
}
void lb_release(void *, void *res) { delete static_cast<std::vector<int64_t> *>(res); }
