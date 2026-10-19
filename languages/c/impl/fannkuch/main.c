#include <stdint.h>
#include <stdlib.h>
#include <string.h>

static int n_arg = 9;
static int64_t out[2];

void lb_setup(int argc, char **argv) { if (argc > 0) n_arg = atoi(argv[0]); }
void *lb_decode(const unsigned char *data, size_t len) { (void)data; (void)len; return NULL; }
void *lb_solve(void *inst) {
  (void)inst;
  int n = n_arg;
  int *perm1 = malloc(n * sizeof(int)), *perm = malloc(n * sizeof(int)), *count = malloc(n * sizeof(int));
  for (int i = 0; i < n; i++) perm1[i] = i;
  int maxflips = 0, permcount = 0, r = n;
  int64_t checksum = 0;
  for (;;) {
    while (r != 1) { count[r - 1] = r; r--; }
    memcpy(perm, perm1, n * sizeof(int));
    int flips = 0, k;
    while ((k = perm[0]) != 0) {
      for (int i = 0, j = k; i < j; i++, j--) { int t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
      flips++;
    }
    if (flips > maxflips) maxflips = flips;
    checksum += (permcount % 2 == 0) ? flips : -flips;
    for (;;) {
      if (r == n) { out[0] = checksum; out[1] = maxflips; free(perm1); free(perm); free(count); return out; }
      int p0 = perm1[0];
      for (int i = 0; i < r; i++) perm1[i] = perm1[i + 1];
      perm1[r] = p0;
      if (--count[r] > 0) break;
      r++;
    }
    permcount++;
  }
}
void lb_emit(void *res, void (*sink)(int64_t)) { int64_t *o = res; sink(o[0]); sink(o[1]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
