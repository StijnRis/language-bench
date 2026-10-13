#include <cstdio>
#include <cstdlib>
#include <thread>
#include <vector>

static bool is_prime(long n) {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 == 0) return false;
  for (long d = 3; d * d <= n; d += 2)
    if (n % d == 0) return false;
  return true;
}

int main(int, char **argv) {
  long n = std::atol(argv[1]);
  long workers = std::atol(argv[2]);
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
  std::printf("primes=%ld\n", total);
  return 0;
}
