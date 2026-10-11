/* Strings are plain UTF-8 byte arrays in C; there is no string library beyond <string.h>. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static const char *VOCAB[20] = {
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world",
};

int main(int argc, char **argv) {
  long n = atol(argv[1]);
  uint64_t x = 1;
  size_t cap = 1 << 20, len = 0;
  char *text = malloc(cap);
  for (long i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    const char *w = VOCAB[x % 20];
    size_t wl = strlen(w);
    if (len + wl + 2 > cap) {
      cap *= 2;
      text = realloc(text, cap);
    }
    if (i > 0) text[len++] = ' ';
    memcpy(text + len, w, wl);
    len += wl;
  }
  text[len] = 0;

  long codepoints = 0, words = 1;
  for (size_t i = 0; i < len; i++) {
    if (((unsigned char)text[i] & 0xC0) != 0x80) codepoints++;
    if (text[i] == ' ') words++;
  }

  long needle = 0;
  for (const char *p = strstr(text, "er"); p; p = strstr(p + 2, "er")) needle++;

  char *replaced = malloc(len + 1);
  for (size_t i = 0; i < len; i++) replaced[i] = text[i] == ' ' ? '_' : text[i];
  uint64_t checksum = 0;
  for (size_t i = 0; i < len; i++) checksum += (unsigned char)replaced[i];

  printf("bytes=%zu\n", len);
  printf("codepoints=%ld\n", codepoints);
  printf("words=%ld\n", words);
  printf("needle=%ld\n", needle);
  printf("checksum=%llu\n", (unsigned long long)checksum);
  free(text);
  free(replaced);
  return 0;
}
