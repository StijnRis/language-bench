/* Binary trees, after the Computer Language Benchmarks Game (plain malloc/free, no arena). */
#include <stdio.h>
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

static long check(const struct node *n) {
  return n->left == NULL ? 1 : 1 + check(n->left) + check(n->right);
}

static void free_tree(struct node *n) {
  if (n->left) {
    free_tree(n->left);
    free_tree(n->right);
  }
  free(n);
}

int main(int argc, char **argv) {
  int n = atoi(argv[1]);
  int min_depth = 4;
  int max_depth = n > min_depth + 2 ? n : min_depth + 2;
  int stretch = max_depth + 1;

  struct node *t = make_tree(stretch);
  printf("stretch tree of depth %d\t check: %ld\n", stretch, check(t));
  free_tree(t);

  struct node *long_lived = make_tree(max_depth);

  for (int depth = min_depth; depth <= max_depth; depth += 2) {
    long iterations = 1L << (max_depth - depth + min_depth);
    long sum = 0;
    for (long i = 0; i < iterations; i++) {
      struct node *tt = make_tree(depth);
      sum += check(tt);
      free_tree(tt);
    }
    printf("%ld\t trees of depth %d\t check: %ld\n", iterations, depth, sum);
  }

  printf("long lived tree of depth %d\t check: %ld\n", max_depth, check(long_lived));
  free_tree(long_lived);
  return 0;
}
