/* Binary trees, after the Computer Language Benchmarks Game (plain malloc/free, no arena). */
#include <stdint.h>
#include <stdlib.h>

struct node {
  struct node *left, *right;
};

static struct node *make_tree(int d) {
  struct node *n = malloc(sizeof *n);
  if (d == 0) {
    n->left = n->right = NULL;
  } else {
    n->left = make_tree(d - 1);
    n->right = make_tree(d - 1);
  }
  return n;
}

static long check(const struct node *n) { return n->left == NULL ? 1 : 1 + check(n->left) + check(n->right); }

static void free_tree(struct node *n) {
  if (n->left) { free_tree(n->left); free_tree(n->right); }
  free(n);
}

static int depth_arg = 14;
static int64_t out[32];
static int nout;

void lb_setup(int argc, char **argv) { if (argc > 0) depth_arg = atoi(argv[0]); }
void *lb_decode(const unsigned char *data, size_t len) { (void)data; (void)len; return NULL; }
void *lb_solve(void *inst) {
  (void)inst;
  int min_depth = 4, max_depth = depth_arg > min_depth + 2 ? depth_arg : min_depth + 2, stretch = max_depth + 1;
  nout = 0;
  struct node *t = make_tree(stretch);
  out[nout++] = check(t);
  free_tree(t);
  struct node *long_lived = make_tree(max_depth);
  for (int depth = min_depth; depth <= max_depth; depth += 2) {
    long iterations = 1L << (max_depth - depth + min_depth), sum = 0;
    for (long i = 0; i < iterations; i++) {
      struct node *tt = make_tree(depth);
      sum += check(tt);
      free_tree(tt);
    }
    out[nout++] = iterations;
    out[nout++] = sum;
  }
  out[nout++] = check(long_lived);
  free_tree(long_lived);
  return out;
}
void lb_emit(void *res, void (*sink)(int64_t)) { int64_t *o = res; for (int i = 0; i < nout; i++) sink(o[i]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
