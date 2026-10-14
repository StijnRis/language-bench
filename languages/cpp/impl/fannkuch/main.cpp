#include <algorithm>
#include <cstdio>
#include <cstdlib>
#include <vector>

int main(int argc, char **argv) {
  int n = std::atoi(argv[1]);
  std::vector<int> perm1(n), perm(n), count(n);
  for (int i = 0; i < n; i++) perm1[i] = i;
  int maxflips = 0, permcount = 0, r = n;
  long checksum = 0;
  for (;;) {
    while (r != 1) {
      count[r - 1] = r;
      r--;
    }
    perm = perm1;
    int flips = 0, k;
    while ((k = perm[0]) != 0) {
      std::reverse(perm.begin(), perm.begin() + k + 1);
      flips++;
    }
    maxflips = std::max(maxflips, flips);
    checksum += (permcount % 2 == 0) ? flips : -flips;
    for (;;) {
      if (r == n) {
        std::printf("checksum=%ld\nmaxflips=%d\n", checksum, maxflips);
        return 0;
      }
      int p0 = perm1[0];
      for (int i = 0; i < r; i++) perm1[i] = perm1[i + 1];
      perm1[r] = p0;
      if (--count[r] > 0) break;
      r++;
    }
    permcount++;
  }
}
