#include <stdint.h>
#include <stdlib.h>

static long n_arg = 10000000;
static int64_t out[3];

void lb_setup(int argc, char **argv) { if (argc > 0) n_arg = atol(argv[0]); }
void *lb_decode(const unsigned char *data, size_t len) { (void)data; (void)len; return NULL; }
void *lb_solve(void *inst) {
  (void)inst;
  long n = n_arg;
  unsigned char *composite = calloc(n + 1, 1);
  for (long p = 2; p * p <= n; p++)
    if (!composite[p])
      for (long m = p * p; m <= n; m += p) composite[m] = 1;
  int64_t count = 0, last = 0, sum = 0;
  for (long i = 2; i <= n; i++)
    if (!composite[i]) { count++; last = i; sum += i; }
  free(composite);
  out[0] = count; out[1] = last; out[2] = sum;
  return out;
}
void lb_emit(void *res, void (*sink)(int64_t)) { int64_t *o = res; for (int i = 0; i < 3; i++) sink(o[i]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
