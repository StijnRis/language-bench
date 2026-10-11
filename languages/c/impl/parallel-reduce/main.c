#include <pthread.h>
#include <stdio.h>
#include <stdlib.h>

struct job {
  long n, workers, t, count;
};

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

int main(int argc, char **argv) {
  long n = atol(argv[1]);
  long workers = atol(argv[2]);
  pthread_t *th = malloc(workers * sizeof *th);
  struct job *jobs = malloc(workers * sizeof *jobs);
  for (long t = 0; t < workers; t++) {
    jobs[t] = (struct job){n, workers, t, 0};
    pthread_create(&th[t], NULL, run, &jobs[t]);
  }
  long total = 0;
  for (long t = 0; t < workers; t++) {
    pthread_join(th[t], NULL);
    total += jobs[t].count;
  }
  printf("primes=%ld\n", total);
  free(th);
  free(jobs);
  return 0;
}
