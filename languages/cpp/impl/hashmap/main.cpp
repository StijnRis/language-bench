#include <cstddef>
#include <cstdint>
#include <cstring>
#include <unordered_map>
#include <vector>

struct Instance {
  std::vector<int32_t> keys;
  std::vector<int32_t> lookups;
};
struct Result {
  uint64_t distinct, checksum, hits;
};

void lb_setup(int, char **) {}
void *lb_decode(const unsigned char *data, size_t len) {
  size_t n = len / 8;
  auto *in = new Instance;
  in->keys.resize(n);
  in->lookups.resize(n);
  std::memcpy(in->keys.data(), data, n * 4);
  std::memcpy(in->lookups.data(), data + n * 4, n * 4);
  return in;
}
void *lb_solve(void *p) {
  auto *in = static_cast<Instance *>(p);
  std::unordered_map<uint32_t, uint32_t> m;
  for (int32_t k : in->keys) m[(uint32_t)k]++;
  uint64_t checksum = 0;
  for (const auto &kv : m) checksum += (uint64_t)kv.first * kv.second;
  uint64_t hits = 0;
  for (int32_t k : in->lookups) {
    auto it = m.find((uint32_t)k);
    if (it != m.end()) hits += it->second;
  }
  return new Result{m.size(), checksum, hits};
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  auto *r = static_cast<Result *>(res);
  sink((int64_t)r->distinct);
  sink((int64_t)r->checksum);
  sink((int64_t)r->hits);
}
void lb_release(void *inst, void *res) {
  delete static_cast<Instance *>(inst);
  delete static_cast<Result *>(res);
}
