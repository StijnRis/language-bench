// Binary trees, after the Computer Language Benchmarks Game (plain new/delete, no arena).
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <vector>

namespace {
struct Node { Node *left, *right; };

Node *make_tree(int d) {
  Node *n = new Node;
  if (d == 0) {
    n->left = n->right = nullptr;
  } else {
    n->left = make_tree(d - 1);
    n->right = make_tree(d - 1);
  }
  return n;
}
long check(const Node *n) { return n->left == nullptr ? 1 : 1 + check(n->left) + check(n->right); }
void free_tree(Node *n) {
  if (n->left) { free_tree(n->left); free_tree(n->right); }
  delete n;
}
int depth_arg = 14;
}  // namespace

void lb_setup(int argc, char **argv) { if (argc > 0) depth_arg = std::atoi(argv[0]); }
void *lb_decode(const unsigned char *, size_t) { return nullptr; }
void *lb_solve(void *) {
  int min_depth = 4, max_depth = depth_arg > min_depth + 2 ? depth_arg : min_depth + 2, stretch = max_depth + 1;
  auto *out = new std::vector<int64_t>;
  Node *t = make_tree(stretch);
  out->push_back(check(t));
  free_tree(t);
  Node *long_lived = make_tree(max_depth);
  for (int depth = min_depth; depth <= max_depth; depth += 2) {
    long iterations = 1L << (max_depth - depth + min_depth), sum = 0;
    for (long i = 0; i < iterations; i++) {
      Node *tt = make_tree(depth);
      sum += check(tt);
      free_tree(tt);
    }
    out->push_back(iterations);
    out->push_back(sum);
  }
  out->push_back(check(long_lived));
  free_tree(long_lived);
  return out;
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  for (int64_t v : *static_cast<std::vector<int64_t> *>(res)) sink(v);
}
void lb_release(void *, void *res) { delete static_cast<std::vector<int64_t> *>(res); }
