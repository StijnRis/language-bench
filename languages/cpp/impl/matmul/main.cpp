#include <cstddef>
#include <cstdint>
#include <cstring>
#include <vector>

struct Instance {
  int n;
  std::vector<double> a, b;
};

void lb_setup(int, char **) {}
void *lb_decode(const unsigned char *data, size_t) {
  auto *in = new Instance;
  int32_t n;
  std::memcpy(&n, data, 4);
  in->n = n;
  in->a.resize((size_t)n * n);
  in->b.resize((size_t)n * n);
  std::memcpy(in->a.data(), data + 4, (size_t)n * n * 8);
  std::memcpy(in->b.data(), data + 4 + (size_t)n * n * 8, (size_t)n * n * 8);
  return in;
}
void *lb_solve(void *p) {
  auto *in = static_cast<Instance *>(p);
  int n = in->n;
  auto *c = new std::vector<double>((size_t)n * n, 0.0);
  for (int i = 0; i < n; i++)
    for (int k = 0; k < n; k++) {
      double aik = in->a[(size_t)i * n + k];
      for (int j = 0; j < n; j++) (*c)[(size_t)i * n + j] += aik * in->b[(size_t)k * n + j];
    }
  return c;
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  for (double v : *static_cast<std::vector<double> *>(res)) sink((int64_t)(v + (v < 0 ? -0.5 : 0.5)));
}
void lb_release(void *inst, void *res) {
  delete static_cast<Instance *>(inst);
  delete static_cast<std::vector<double> *>(res);
}
