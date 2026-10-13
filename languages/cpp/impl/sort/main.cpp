#include <algorithm>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <vector>

int main(int, char **argv) {
  long n = std::atol(argv[1]);
  uint64_t x = 1;
  std::vector<int32_t> a(n);
  for (long i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    a[i] = (int32_t)x;
  }

  std::sort(a.begin(), a.end());

  uint64_t checksum = 0;
  for (long i = 0; i < n; i++) checksum = (checksum + (uint64_t)i * (uint64_t)a[i]) % 1000000007;

  std::printf("first=%d\n", a[0]);
  std::printf("last=%d\n", a[n - 1]);
  std::printf("median=%d\n", a[n / 2]);
  std::printf("checksum=%llu\n", (unsigned long long)checksum);
  return 0;
}
