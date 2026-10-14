#include <cstdio>
#include <cstdlib>
#include <vector>

int main(int argc, char **argv) {
  int n = std::atoi(argv[1]);
  std::vector<double> a(n * n), b(n * n), c(n * n, 0.0);
  for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++) {
      a[i * n + j] = (i * 31 + j * 17) % 10 + 1;
      b[i * n + j] = (i * 13 + j * 7) % 10 - 4;
    }

  for (int i = 0; i < n; i++)
    for (int k = 0; k < n; k++) {
      double aik = a[i * n + k];
      for (int j = 0; j < n; j++) c[i * n + j] += aik * b[k * n + j];
    }

  double trace = 0, sum = 0;
  for (int i = 0; i < n; i++) trace += c[i * n + i];
  for (size_t i = 0; i < c.size(); i++) sum += c[i];
  std::printf("trace=%lld\n", (long long)trace);
  std::printf("sum=%lld\n", (long long)sum);
  std::printf("c00=%lld\n", (long long)c[0]);
  std::printf("clast=%lld\n", (long long)c[c.size() - 1]);
  return 0;
}
