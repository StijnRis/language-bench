// Binary trees, after the Computer Language Benchmarks Game (plain new/delete, no arena).
#include <cstdio>
#include <cstdlib>

struct Node {
  Node *left, *right;
};

static Node *make_tree(int d) {
  Node *n = new Node;
  if (d == 0) {
    n->left = n->right = nullptr;
  } else {
    n->left = make_tree(d - 1);
    n->right = make_tree(d - 1);
  }
  return n;
}

static long check(const Node *n) { return n->left == nullptr ? 1 : 1 + check(n->left) + check(n->right); }

static void free_tree(Node *n) {
  if (n->left) {
    free_tree(n->left);
    free_tree(n->right);
  }
  delete n;
}

int main(int, char **argv) {
  int n = std::atoi(argv[1]);
  int min_depth = 4;
  int max_depth = n > min_depth + 2 ? n : min_depth + 2;
  int stretch = max_depth + 1;

  Node *t = make_tree(stretch);
  std::printf("stretch tree of depth %d\t check: %ld\n", stretch, check(t));
  free_tree(t);

  Node *long_lived = make_tree(max_depth);

  for (int depth = min_depth; depth <= max_depth; depth += 2) {
    long iterations = 1L << (max_depth - depth + min_depth);
    long sum = 0;
    for (long i = 0; i < iterations; i++) {
      Node *tt = make_tree(depth);
      sum += check(tt);
      free_tree(tt);
    }
    std::printf("%ld\t trees of depth %d\t check: %ld\n", iterations, depth, sum);
  }

  std::printf("long lived tree of depth %d\t check: %ld\n", max_depth, check(long_lived));
  free_tree(long_lived);
  return 0;
}
