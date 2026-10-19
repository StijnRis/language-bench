/* conformance problem: sum, maximum and a checksum of 4096 int32 values */
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

typedef struct { const int32_t *a; size_t n; } Inst;
typedef struct { int64_t sum, mx, sq, cnt; } Res;

void lb_setup(int argc, char **argv) { (void)argc; (void)argv; }
void *lb_decode(const unsigned char *data, size_t len) {
  Inst *in = malloc(sizeof *in); int32_t *a = malloc(len); memcpy(a, data, len); in->a = a; in->n = len / 4; return in;
}
void *lb_solve(void *p) {
  Inst *in = p; Res *r = calloc(1, sizeof *r);
  for (size_t i = 0; i < in->n; i++) { int64_t v = in->a[i]; r->sum += v; if (v > r->mx) r->mx = v; r->sq = (r->sq + v * v) % 1000003; }
  r->cnt = (int64_t)in->n; return r;
}
void lb_emit(void *p, void (*sink)(int64_t)) { Res *r = p; sink(r->sum); sink(r->mx); sink(r->sq); sink(r->cnt); }
void lb_release(void *i, void *r) { Inst *in = i; free((void *)in->a); free(in); free(r); }
