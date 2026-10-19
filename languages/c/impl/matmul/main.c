#include <stdint.h>
#include <stdlib.h>
#include <string.h>

static int n;
static const double *a, *b;
static double *c;

void lb_setup(int argc, char **argv) { (void)argc; (void)argv; }
void *lb_decode(const unsigned char *data, size_t len) {
  (void)len;
  int32_t m; memcpy(&m, data, 4); n = m;
  a = (const double *)(data + 4); b = a + (size_t)n * n;   /* the harness buffer is 16-byte aligned, +4 is not: copy */
  double *ac = malloc(2 * (size_t)n * n * sizeof(double)); memcpy(ac, data + 4, 2 * (size_t)n * n * sizeof(double));
  a = ac; b = ac + (size_t)n * n;
  return ac;
}
void *lb_solve(void *inst) {
  (void)inst;
  c = calloc((size_t)n * n, sizeof(double));
  for (int i = 0; i < n; i++)
    for (int k = 0; k < n; k++) {
      double aik = a[(size_t)i * n + k];
      for (int j = 0; j < n; j++) c[(size_t)i * n + j] += aik * b[(size_t)k * n + j];
    }
  return c;
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  double *r = res;
  for (size_t i = 0; i < (size_t)n * n; i++) sink((int64_t)(r[i] + (r[i] < 0 ? -0.5 : 0.5)));
}
void lb_release(void *inst, void *res) { free(inst); free(res); }
