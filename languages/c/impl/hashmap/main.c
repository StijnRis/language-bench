/* C has no standard hash map: a simple open-addressing table with linear probing. */
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

#define CAP (1u << 21)

static uint32_t *keys; /* key + 1, 0 = empty */
static uint32_t *vals;
static uint32_t distinct;

static uint32_t slot(uint32_t k) {
  uint32_t h = (k * 2654435761u) >> 11; /* Fibonacci hashing into 21 bits */
  while (keys[h] != 0 && keys[h] != k + 1) h = (h + 1) & (CAP - 1);
  return h;
}

int main(int argc, char **argv) {
  uint64_t n = strtoull(argv[1], NULL, 10);
  uint64_t x = 1;
  keys = calloc(CAP, sizeof *keys);
  vals = calloc(CAP, sizeof *vals);

  for (uint64_t i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    uint32_t k = (uint32_t)(x % (n / 2));
    uint32_t h = slot(k);
    if (keys[h] == 0) {
      keys[h] = k + 1;
      distinct++;
    }
    vals[h]++;
  }

  uint64_t checksum = 0;
  for (uint32_t h = 0; h < CAP; h++)
    if (keys[h]) checksum += (uint64_t)(keys[h] - 1) * vals[h];

  uint64_t hits = 0;
  for (uint64_t i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    uint32_t h = slot((uint32_t)(x % n));
    if (keys[h]) hits += vals[h];
  }

  printf("distinct=%u\n", distinct);
  printf("checksum=%llu\n", (unsigned long long)checksum);
  printf("hits=%llu\n", (unsigned long long)hits);
  free(keys);
  free(vals);
  return 0;
}
