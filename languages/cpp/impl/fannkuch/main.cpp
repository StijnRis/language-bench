#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <vector>

namespace { int n_arg = 9; }

void lb_setup(int argc, char **argv) { if (argc > 0) n_arg = std::atoi(argv[0]); }
void *lb_decode(const unsigned char *, size_t) { return nullptr; }
void *lb_solve(void *) {
  int n = n_arg;
  std::vector<int> perm1(n), perm(n), count(n);
  for (int i = 0; i < n; i++) perm1[i] = i;
  int maxflips = 0, permcount = 0, r = n;
  int64_t checksum = 0;
  for (;;) {
    while (r != 1) { count[r - 1] = r; r--; }
    perm = perm1;
    int flips = 0, k;
    while ((k = perm[0]) != 0) {
      for (int i = 0, j = k; i < j; i++, j--) { int t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
      flips++;
    }
    if (flips > maxflips) maxflips = flips;
    checksum += (permcount % 2 == 0) ? flips : -flips;
    for (;;) {
      if (r == n) return new std::vector<int64_t>{checksum, maxflips};
      int p0 = perm1[0];
      for (int i = 0; i < r; i++) perm1[i] = perm1[i + 1];
      perm1[r] = p0;
      if (--count[r] > 0) break;
      r++;
    }
    permcount++;
  }
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  for (int64_t v : *static_cast<std::vector<int64_t> *>(res)) sink(v);
}
void lb_release(void *, void *res) { delete static_cast<std::vector<int64_t> *>(res); }
