#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <string>
#include <unordered_map>

int main(int, char **argv) {
  std::ifstream in(argv[1]);
  std::unordered_map<std::string, long> freq;
  std::string line;
  long lines = 0;
  long long total = 0;

  while (std::getline(in, line)) {
    size_t c1 = line.find(',');
    size_t c2 = line.find(',', c1 + 1);
    total += std::atoll(line.c_str() + c2 + 1);
    freq[line.substr(c1 + 1, c2 - c1 - 1)]++;
    lines++;
  }

  const std::string *top = nullptr;
  long top_count = -1;
  for (const auto &[w, c] : freq) {
    if (c > top_count || (c == top_count && w < *top)) {
      top = &w;
      top_count = c;
    }
  }

  std::printf("lines=%ld\n", lines);
  std::printf("sum=%lld\n", total);
  std::printf("distinct=%zu\n", freq.size());
  std::printf("top=%s %ld\n", top->c_str(), top_count);
  return 0;
}
