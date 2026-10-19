/* sort: the instance is the int32 array of the harness buffer, sorted in place with qsort. */
#include <stdint.h>
#include <stdlib.h>

static int cmp(const void *a, const void *b) {
  int32_t x = *(const int32_t *)a, y = *(const int32_t *)b;
  return (x > y) - (x < y);
}

typedef struct { int32_t *a; size_t n; } Array;
static Array arr;

void lb_setup(int argc, char **argv) { (void)argc; (void)argv; }
void *lb_decode(const unsigned char *data, size_t len) { arr.a = (int32_t *)data; arr.n = len / 4; return &arr; }
void *lb_solve(void *inst) { Array *a = inst; qsort(a->a, a->n, sizeof(int32_t), cmp); return a; }
void lb_emit(void *res, void (*sink)(int64_t)) { Array *a = res; for (size_t i = 0; i < a->n; i++) sink(a->a[i]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
