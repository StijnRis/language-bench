#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <thread>
#include <vector>

namespace {
long n_arg = 2000000, workers_arg = 4;

bool is_prime(long n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 == 0) return false;
  for (long d = 3; d * d <= n; d += 2)
    if (n % d == 0) return false;
  return true;
}
}  // namespace

void lb_setup(int argc, char **argv) {
  if (argc > 1) { n_arg = std::atol(argv[0]); workers_arg = std::atol(argv[1]); }
}
void *lb_decode(const unsigned char *, size_t) { return nullptr; }
void *lb_solve(void *) {
  long n = n_arg, workers = workers_arg;
  std::vector<long> counts(workers, 0);
  std::vector<std::thread> threads;
  for (long t = 0; t < workers; t++) {
    threads.emplace_back([&counts, n, workers, t] {
      long c = 0;
      for (long i = t; i < n; i += workers)
        if (is_prime(i)) c++;
      counts[t] = c;
    });
  }
  long total = 0;
  for (long t = 0; t < workers; t++) {
    threads[t].join();
    total += counts[t];
  }
  return new std::vector<int64_t>{total};
}
void lb_emit(void *res, void (*sink)(int64_t)) { sink((*static_cast<std::vector<int64_t> *>(res))[0]); }
void lb_release(void *, void *res) { delete static_cast<std::vector<int64_t> *>(res); }
