// C++ has no JSON parser in its standard library: a small recursive-descent parser that aggregates
// while parsing (it does not build a tree).
#include <cstdio>
#include <fstream>
#include <iterator>
#include <string>

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

int main(int, char **argv) {
  std::ifstream in(argv[1], std::ios::binary);
  std::string buf((std::istreambuf_iterator<char>(in)), std::istreambuf_iterator<char>());
  s = reinterpret_cast<const unsigned char *>(buf.c_str());
  value();
  std::printf("objects=%ld\n", objects);
  std::printf("int_sum=%lld\n", int_sum);
  std::printf("string_length=%ld\n", str_len);
  std::printf("true=%ld\n", trues);
  std::printf("null=%ld\n", nulls);
  return 0;
}
