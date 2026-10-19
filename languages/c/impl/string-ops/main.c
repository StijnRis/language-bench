/* Strings are plain UTF-8 byte arrays in C; there is no string library beyond <string.h>. */
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

static char *text;
static size_t len;
static int64_t out[5];

void lb_setup(int argc, char **argv) { (void)argc; (void)argv; }
void *lb_decode(const unsigned char *data, size_t n) { text = (char *)data; len = n; return text; }  /* already UTF-8, NUL terminated by the harness */
void *lb_solve(void *inst) {
  (void)inst;
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
  free(replaced);
  out[0] = (int64_t)len; out[1] = codepoints; out[2] = words; out[3] = needle; out[4] = (int64_t)checksum;
  return out;
}
void lb_emit(void *res, void (*sink)(int64_t)) { int64_t *o = res; for (int i = 0; i < 5; i++) sink(o[i]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
