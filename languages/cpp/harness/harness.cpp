/* language-bench harness for C++: see harness/CONTRACT.md. Linked with a problem that defines lb_*(). */
#define _GNU_SOURCE
#include <cerrno>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <unistd.h>

void lb_setup(int argc, char **argv);
void *lb_decode(const unsigned char *data, size_t len); /* stream: the bytes; file: the path; none: NULL */
void *lb_solve(void *instance);
void lb_emit(void *result, void (*sink)(int64_t));
void lb_release(void *instance, void *result);

static int64_t h1, h2, nwords;
static void mix(int64_t w) {
  int64_t m1 = ((w % 2147483647LL) + 2147483647LL) % 2147483647LL, m2 = ((w % 2147483629LL) + 2147483629LL) % 2147483629LL;
  h1 = (h1 * 1000003 + m1) % 2147483647LL;
  h2 = (h2 * 999983 + m2) % 2147483629LL;
}
static void sink(int64_t w) { mix(w); nwords++; }

static int64_t now_ns(clockid_t c) { struct timespec t; clock_gettime(c, &t); return (int64_t)t.tv_sec * 1000000000LL + t.tv_nsec; }
static double env_num(const char *k, double d) { const char *v = getenv(k); return v && *v ? atof(v) : d; }

static void read_full(unsigned char *p, size_t n) {
  while (n) {
    ssize_t k = read(0, p, n);
    if (k < 0 && errno == EINTR) continue;
    if (k <= 0) { fprintf(stderr, "harness: input ended early\n"); exit(1); }
    p += k; n -= (size_t)k;
  }
}

int main(int argc, char **argv) {
  const char *input = getenv("LB_INPUT") ? getenv("LB_INPUT") : "none";
  double budget = env_num("LB_BUDGET_SECONDS", 10) * 1e9;
  long min_iters = (long)env_num("LB_MIN_ITERS", 3), max_iters = (long)env_num("LB_MAX_ITERS", 0);
  long start = (long)env_num("LB_START", 0);
  const char *gen = getenv("LB_GEN") ? getenv("LB_GEN") : "/usr/local/bin/lbgen";
  const char *file = getenv("LB_FILE") ? getenv("LB_FILE") : "/dev/shm/lb-input";
  const char *problem = getenv("LB_PROBLEM") ? getenv("LB_PROBLEM") : "";

  lb_setup(argc - 1, argv + 1);
  size_t cap = 0; int64_t cap_iters = 1024;
  int64_t *t0s = (int64_t *)malloc(cap_iters * 8), *t1s = (int64_t *)malloc(cap_iters * 8), *c1 = (int64_t *)malloc(cap_iters * 8), *c2 = (int64_t *)malloc(cap_iters * 8);
  unsigned char *buf = nullptr;
  long iters = 0; double kernel = 0; const char *reason = "budget"; int64_t mono0, wall0;
  mono0 = now_ns(CLOCK_MONOTONIC); wall0 = now_ns(CLOCK_REALTIME);

  for (;;) {
    void *inst;
    if (!strcmp(input, "stream")) {
      unsigned char hdr[8]; read_full(hdr, 8);
      uint64_t len = 0; for (int i = 7; i >= 0; i--) len = (len << 8) | hdr[i];
      if (len + 1 > cap) { cap = len + 1; buf = (unsigned char *)realloc(buf, cap); if (!buf) { fprintf(stderr, "harness: out of memory\n"); return 1; } }
      read_full(buf, len);
      buf[len] = 0;
      inst = lb_decode(buf, len);
    } else if (!strcmp(input, "file")) {
      if (!getenv("LB_FILE_READY")) {
        char cmd[1024]; snprintf(cmd, sizeof cmd, "'%s' file %s %ld '%s'", gen, problem, start + iters, file);
        if (system(cmd) != 0) { fprintf(stderr, "harness: generator failed\n"); return 1; }
      }
      inst = lb_decode((const unsigned char *)file, strlen(file));
    } else {
      inst = lb_decode(nullptr, 0);
    }
    int64_t t0 = now_ns(CLOCK_MONOTONIC);
    void *res = lb_solve(inst);
    int64_t t1 = now_ns(CLOCK_MONOTONIC);
    h1 = 17; h2 = 19; nwords = 0;
    lb_emit(res, sink);
    mix(nwords);
    lb_release(inst, res);
    if (!strcmp(input, "file") && !getenv("LB_FILE_READY")) unlink(file);

    if (iters == cap_iters) { cap_iters *= 2; t0s = (int64_t *)realloc(t0s, cap_iters * 8); t1s = (int64_t *)realloc(t1s, cap_iters * 8); c1 = (int64_t *)realloc(c1, cap_iters * 8); c2 = (int64_t *)realloc(c2, cap_iters * 8); }
    t0s[iters] = t0; t1s[iters] = t1; c1[iters] = h1; c2[iters] = h2; iters++;
    kernel += (double)(t1 - t0);
    if (max_iters && iters >= max_iters) { reason = "iters"; break; }
    if (kernel >= budget && iters >= min_iters) break;
  }

  printf("LB 1 clock=CLOCK_MONOTONIC\nSTART mono=%lld wall=%lld\n", (long long)mono0, (long long)wall0);
  for (long i = 0; i < iters; i++) printf("ITER %ld t0=%lld t1=%lld check=%lld:%lld\n", i + 1, (long long)t0s[i], (long long)t1s[i], (long long)c1[i], (long long)c2[i]);
  printf("DONE iters=%ld kernel_ns=%lld reason=%s\n", iters, (long long)kernel, reason);
  return 0;
}
