/* C has no standard hash map: a simple open-addressing table with linear probing. */
#include <stdint.h>
#include <stdlib.h>

#define CAP (1u << 21)

static uint32_t *keys; /* key + 1, 0 = empty */
static uint32_t *vals;
static uint32_t distinct;
static const int32_t *ins, *look;
static size_t n;
static uint64_t out[3];

static uint32_t slot(uint32_t k) {
  uint32_t h = (k * 2654435761u) >> 11; /* Fibonacci hashing into 21 bits */
  while (keys[h] != 0 && keys[h] != k + 1) h = (h + 1) & (CAP - 1);
  return h;
}

void lb_setup(int argc, char **argv) { (void)argc; (void)argv; }
void *lb_decode(const unsigned char *data, size_t len) { n = len / 8; ins = (const int32_t *)data; look = ins + n; return out; }
void *lb_solve(void *inst) {
  keys = calloc(CAP, sizeof *keys);
  vals = calloc(CAP, sizeof *vals);
  distinct = 0;
  for (size_t i = 0; i < n; i++) {
    uint32_t k = (uint32_t)ins[i];
    uint32_t h = slot(k);
    if (keys[h] == 0) { keys[h] = k + 1; distinct++; }
    vals[h]++;
  }
  uint64_t checksum = 0;
  for (uint32_t h = 0; h < CAP; h++)
    if (keys[h]) checksum += ((uint64_t)keys[h] - 1) * (uint64_t)vals[h];
  uint64_t hits = 0;
  for (size_t i = 0; i < n; i++) {
    uint32_t h = slot((uint32_t)look[i]);
    if (keys[h]) hits += vals[h];
  }
  out[0] = distinct; out[1] = checksum; out[2] = hits;
  return inst;
}
void lb_emit(void *res, void (*sink)(int64_t)) { (void)res; for (int i = 0; i < 3; i++) sink((int64_t)out[i]); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; free(keys); free(vals); }
