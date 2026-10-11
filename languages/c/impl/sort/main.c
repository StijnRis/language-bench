#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>

static int cmp(const void *a, const void *b) {
  int32_t x = *(const int32_t *)a, y = *(const int32_t *)b;
  return (x > y) - (x < y);
}

int main(int argc, char **argv) {
  long n = atol(argv[1]);
  uint64_t x = 1;
  int32_t *a = malloc(n * sizeof *a);
  for (long i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    a[i] = (int32_t)x;
  }

  qsort(a, n, sizeof *a, cmp);

  uint64_t checksum = 0;
  for (long i = 0; i < n; i++) checksum = (checksum + (uint64_t)i * (uint64_t)a[i]) % 1000000007;

  printf("first=%d\n", a[0]);
  printf("last=%d\n", a[n - 1]);
  printf("median=%d\n", a[n / 2]);
  printf("checksum=%llu\n", (unsigned long long)checksum);
  free(a);
  return 0;
}
