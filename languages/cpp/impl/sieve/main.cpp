#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <vector>

namespace { long n_arg = 10000000; }

void lb_setup(int argc, char **argv) { if (argc > 0) n_arg = std::atol(argv[0]); }
void *lb_decode(const unsigned char *, size_t) { return nullptr; }
void *lb_solve(void *) {
  long n = n_arg;
  std::vector<unsigned char> composite(n + 1, 0);
  for (long p = 2; p * p <= n; p++)
    if (!composite[p])
      for (long m = p * p; m <= n; m += p) composite[m] = 1;
  int64_t count = 0, last = 0, sum = 0;
  for (long i = 2; i <= n; i++)
    if (!composite[i]) { count++; last = i; sum += i; }
  return new std::vector<int64_t>{count, last, sum};
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  for (int64_t v : *static_cast<std::vector<int64_t> *>(res)) sink(v);
}
void lb_release(void *, void *res) { delete static_cast<std::vector<int64_t> *>(res); }
