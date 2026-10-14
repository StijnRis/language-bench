#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
  long n = atol(argv[1]);
  unsigned char *s = malloc(n + 1);
  for (long i = 0; i <= n; i++) s[i] = 1;
  s[0] = s[1] = 0;
  for (long p = 2; p * p <= n; p++)
    if (s[p])
      for (long m = p * p; m <= n; m += p) s[m] = 0;
  long count = 0, last = 0;
  unsigned long long sum = 0;
  for (long i = 2; i <= n; i++)
    if (s[i]) {
      count++;
      last = i;
      sum += i;
    }
  printf("count=%ld\nlast=%ld\nsum=%llu\n", count, last, sum);
  free(s);
  return 0;
}
