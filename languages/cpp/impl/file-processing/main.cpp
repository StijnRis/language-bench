#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <fstream>
#include <string>
#include <unordered_map>
#include <vector>

void lb_setup(int, char **) {}
void *lb_decode(const unsigned char *data, size_t len) { return new std::string(reinterpret_cast<const char *>(data), len); }
void *lb_solve(void *p) {
  std::ifstream in(*static_cast<std::string *>(p));
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
  for (const auto &kv : freq) {
    if (kv.second > top_count || (kv.second == top_count && kv.first < *top)) {
      top = &kv.first;
      top_count = kv.second;
    }
  }
  auto *out = new std::vector<int64_t>{lines, total, (int64_t)freq.size(), top_count, (int64_t)top->size()};
  for (unsigned char c : *top) out->push_back(c);
  return out;
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  for (int64_t v : *static_cast<std::vector<int64_t> *>(res)) sink(v);
}
void lb_release(void *inst, void *res) {
  delete static_cast<std::string *>(inst);
  delete static_cast<std::vector<int64_t> *>(res);
}
