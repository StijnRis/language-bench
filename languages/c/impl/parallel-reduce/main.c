#include <pthread.h>
#include <stdint.h>
#include <stdlib.h>

struct job { long n, workers, t, count; };
static long n_arg = 2000000, workers_arg = 4;
static int64_t out[1];

static int is_prime(long n) {
  if (n < 2) return 0;
  if (n < 4) return 1;
  if (n % 2 == 0) return 0;
  for (long d = 3; d * d <= n; d += 2)
    if (n % d == 0) return 0;
  return 1;
}

static void *run(void *arg) {
  struct job *j = arg;
  long c = 0;
  for (long i = j->t; i < j->n; i += j->workers)
    if (is_prime(i)) c++;
  j->count = c;
  return NULL;
}

void lb_setup(int argc, char **argv) { if (argc > 1) { n_arg = atol(argv[0]); workers_arg = atol(argv[1]); } }
void *lb_decode(const unsigned char *data, size_t len) { (void)data; (void)len; return NULL; }
void *lb_solve(void *inst) {
  (void)inst;
  long workers = workers_arg;
  pthread_t *th = malloc(workers * sizeof *th);
  struct job *jobs = malloc(workers * sizeof *jobs);
  for (long t = 0; t < workers; t++) {
    jobs[t] = (struct job){n_arg, workers, t, 0};
    pthread_create(&th[t], NULL, run, &jobs[t]);
  }
  long total = 0;
  for (long t = 0; t < workers; t++) { pthread_join(th[t], NULL); total += jobs[t].count; }
  free(th); free(jobs);
  out[0] = total;
  return out;
}
void lb_emit(void *res, void (*sink)(int64_t)) { sink(((int64_t *)res)[0]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
