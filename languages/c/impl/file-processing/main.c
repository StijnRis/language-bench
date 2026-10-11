/* C has no standard hash map: word counts live in a small open-addressing table of strdup'd keys. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define CAP 32768

static char *keys[CAP];
static long counts[CAP];
static long distinct;

static uint32_t hash(const char *s, size_t n) {
  uint32_t h = 2166136261u;
  for (size_t i = 0; i < n; i++) h = (h ^ (unsigned char)s[i]) * 16777619u;
  return h ^ (h >> 15) ^ (h >> 7); /* FNV-1a low bits are weak: fold the high bits in */
}

int main(int argc, char **argv) {
  FILE *f = fopen(argv[1], "r");
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
    if (!keys[h]) {
      keys[h] = strndup(c1 + 1, wl);
      distinct++;
    }
    counts[h]++;
    lines++;
  }
  fclose(f);

  const char *top = NULL;
  long top_count = -1;
  for (int h = 0; h < CAP; h++) {
    if (!keys[h]) continue;
    if (counts[h] > top_count || (counts[h] == top_count && strcmp(keys[h], top) < 0)) {
      top = keys[h];
      top_count = counts[h];
    }
  }

  printf("lines=%ld\n", lines);
  printf("sum=%lld\n", total);
  printf("distinct=%ld\n", distinct);
  printf("top=%s %ld\n", top, top_count);
  return 0;
}
