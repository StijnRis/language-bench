#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
  int n = atoi(argv[1]);
  double *a = malloc((size_t)n * n * sizeof *a);
  double *b = malloc((size_t)n * n * sizeof *b);
  double *c = calloc((size_t)n * n, sizeof *c);
  for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++) {
      a[i * n + j] = (double)((i * 31 + j * 17) % 10 + 1);
      b[i * n + j] = (double)((i * 13 + j * 7) % 10 - 4);
    }

  for (int i = 0; i < n; i++)
    for (int k = 0; k < n; k++) {
      double aik = a[i * n + k];
      for (int j = 0; j < n; j++) c[i * n + j] += aik * b[k * n + j];
    }

  double trace = 0, sum = 0;
  for (int i = 0; i < n; i++) trace += c[i * n + i];
  for (long i = 0; i < (long)n * n; i++) sum += c[i];
  printf("trace=%lld\n", (long long)trace);
  printf("sum=%lld\n", (long long)sum);
  printf("c00=%lld\n", (long long)c[0]);
  printf("clast=%lld\n", (long long)c[(long)n * n - 1]);
  free(a);
  free(b);
  free(c);
  return 0;
}
