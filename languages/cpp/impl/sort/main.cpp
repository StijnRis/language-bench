#include <algorithm>
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
void *lb_solve(void *inst) {
  auto *a = static_cast<std::vector<int32_t> *>(inst);
  std::sort(a->begin(), a->end());
  return a;
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  for (int32_t v : *static_cast<std::vector<int32_t> *>(res)) sink(v);
}
void lb_release(void *inst, void *) { delete static_cast<std::vector<int32_t> *>(inst); }
