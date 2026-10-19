// conformance problem: sum, maximum and a checksum of 4096 int32 values
#include <cstddef>
#include <cstdint>
#include <cstring>
#include <vector>

void lb_setup(int, char **) {}
void *lb_decode(const unsigned char *data, size_t len) {
  auto *a = new std::vector<int32_t>(len / 4);
  std::memcpy(a->data(), data, len);
  return a;
}
void *lb_solve(void *p) {
  auto &a = *static_cast<std::vector<int32_t> *>(p);
  int64_t sum = 0, mx = 0, sq = 0;
  for (int32_t x : a) { int64_t v = x; sum += v; if (v > mx) mx = v; sq = (sq + v * v) % 1000003; }
  return new std::vector<int64_t>{sum, mx, sq, (int64_t)a.size()};
}
void lb_emit(void *res, void (*sink)(int64_t)) { for (int64_t v : *static_cast<std::vector<int64_t> *>(res)) sink(v); }
void lb_release(void *inst, void *res) { delete static_cast<std::vector<int32_t> *>(inst); delete static_cast<std::vector<int64_t> *>(res); }
