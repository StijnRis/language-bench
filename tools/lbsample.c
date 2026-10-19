/*
 * lbsample: samples the anonymous memory of a container's cgroup from the host, so the benchmarked
 * process is not touched by the measurement.
 *
 *   lbsample <memory.stat> [interval_us]     prints "<realtime ns> <bytes>" per sample until SIGTERM
 *
 * cgroup v2 reports `anon` (all processes of the group; page cache and tmpfs are excluded, which keeps
 * file-processing honest); cgroup v1 reports it as `total_rss`. Timestamps are CLOCK_REALTIME, which host
 * and container share; harnesses print the same clock at the start of their run to line samples up with
 * the timed regions.
 */
#define _GNU_SOURCE
#include <fcntl.h>
#include <signal.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

static volatile sig_atomic_t stop;
static void on_term(int s) { (void)s; stop = 1; }

int main(int argc, char **argv) {
  if (argc < 2) { fprintf(stderr, "usage: lbsample <memory.stat> [interval_us]\n"); return 2; }
  long interval = argc > 2 ? atol(argv[2]) : 5000;
  int fd = open(argv[1], O_RDONLY);
  if (fd < 0) { perror(argv[1]); return 1; }
  signal(SIGTERM, on_term); signal(SIGINT, on_term);
  static char buf[8192];
  setvbuf(stdout, NULL, _IOLBF, 0);
  struct timespec ts = {0, 0};
  while (!stop) {
    ssize_t n = pread(fd, buf, sizeof buf - 1, 0);
    if (n <= 0) break;
    buf[n] = 0;
    char *p = strstr(buf, "\nanon "); if (p) p += 1; else if (!strncmp(buf, "anon ", 5)) p = buf;
    uint64_t v = 0; int found = 0;
    if (p) { v = strtoull(p + 5, NULL, 10); found = 1; }
    else if ((p = strstr(buf, "\ntotal_rss "))) { v = strtoull(p + 11, NULL, 10); found = 1; }
    else if ((p = strstr(buf, "\nrss "))) { v = strtoull(p + 5, NULL, 10); found = 1; }
    if (!found) { fprintf(stderr, "lbsample: no anon/rss line in %s\n", argv[1]); return 1; }
    clock_gettime(CLOCK_REALTIME, &ts);
    printf("%lld %llu\n", (long long)ts.tv_sec * 1000000000LL + ts.tv_nsec, (unsigned long long)v);
    struct timespec d = {interval / 1000000, (interval % 1000000) * 1000};
    nanosleep(&d, NULL);
  }
  return 0;
}
