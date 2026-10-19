/* C has no standard hash map: word counts live in a small open-addressing table of strdup'd keys. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CAP 32768

static char *keys[CAP];
static long counts[CAP];
static long distinct;
static const char *path;
static int64_t out[64];
static int nout;

static uint32_t hash(const char *s, size_t n) {
  uint32_t h = 2166136261u;
  for (size_t i = 0; i < n; i++) h = (h ^ (unsigned char)s[i]) * 16777619u;
  return h ^ (h >> 15) ^ (h >> 7); /* FNV-1a low bits are weak: fold the high bits in */
}

void lb_setup(int argc, char **argv) { (void)argc; (void)argv; }
void *lb_decode(const unsigned char *data, size_t len) { (void)len; path = (const char *)data; return (void *)data; }
void *lb_solve(void *inst) {
  (void)inst;
  memset(keys, 0, sizeof keys); memset(counts, 0, sizeof counts); distinct = 0;
  FILE *f = fopen(path, "r");
  setvbuf(f, NULL, _IOFBF, 1 << 16);
  char *line = NULL;
  size_t cap = 0;
  long lines = 0;
  long long total = 0;
  while (getline(&line, &cap, f) > 0) {
    char *c1 = strchr(line, ',');
    char *c2 = strchr(c1 + 1, ',');
    size_t wl = (size_t)(c2 - (c1 + 1));
    total += atoll(c2 + 1);
    uint32_t h = hash(c1 + 1, wl) & (CAP - 1);
    while (keys[h] && !(strlen(keys[h]) == wl && memcmp(keys[h], c1 + 1, wl) == 0)) h = (h + 1) & (CAP - 1);
    if (!keys[h]) { keys[h] = strndup(c1 + 1, wl); distinct++; }
    counts[h]++;
    lines++;
  }
  fclose(f);
  free(line);
  const char *top = NULL;
  long top_count = -1;
  for (int h = 0; h < CAP; h++) {
    if (!keys[h]) continue;
    if (counts[h] > top_count || (counts[h] == top_count && strcmp(keys[h], top) < 0)) { top = keys[h]; top_count = counts[h]; }
  }
  nout = 0;
  out[nout++] = lines; out[nout++] = total; out[nout++] = distinct; out[nout++] = top_count; out[nout++] = (int64_t)strlen(top);
  for (const char *p = top; *p; p++) out[nout++] = (unsigned char)*p;
  return out;
}
void lb_emit(void *res, void (*sink)(int64_t)) { int64_t *o = res; for (int i = 0; i < nout; i++) sink(o[i]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; for (int h = 0; h < CAP; h++) free(keys[h]); }
