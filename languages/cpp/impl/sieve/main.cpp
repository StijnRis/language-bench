#include <cstdio>
#include <cstdlib>
#include <vector>

int main(int argc, char **argv) {
  long n = std::atol(argv[1]);
  std::vector<unsigned char> s(n + 1, 1);
  s[0] = s[1] = 0;
  for (long p = 2; p * p <= n; p++)
    if (s[p])
      for (long m = p * p; m <= n; m += p) s[m] = 0;
  long count = 0, last = 0;
  unsigned long long sum = 0;
  for (long i = 2; i <= n; i++)
    if (s[i]) {
      count++;
      last = i;
      sum += i;
    }
  std::printf("count=%ld\nlast=%ld\nsum=%llu\n", count, last, sum);
  return 0;
}
