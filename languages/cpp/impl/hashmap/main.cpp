#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <unordered_map>

int main(int, char **argv) {
  uint64_t n = std::strtoull(argv[1], nullptr, 10);
  uint64_t x = 1;
  std::unordered_map<uint32_t, uint32_t> m;

  for (uint64_t i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    m[(uint32_t)(x % (n / 2))]++;
  }

  uint64_t checksum = 0;
  for (const auto &kv : m) checksum += (uint64_t)kv.first * kv.second;

  uint64_t hits = 0;
  for (uint64_t i = 0; i < n; i++) {
    x = x * 48271 % 2147483647;
    auto it = m.find((uint32_t)(x % n));
    if (it != m.end()) hits += it->second;
  }

  std::printf("distinct=%zu\n", m.size());
  std::printf("checksum=%llu\n", (unsigned long long)checksum);
  std::printf("hits=%llu\n", (unsigned long long)hits);
  return 0;
}
