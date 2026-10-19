/*
 * lbgen: the one deterministic instance generator of language-bench, and the reference solvers.
 *
 *   lbgen stream <problem> [start]         endless stream of instances start, start+1, ... on stdout
 *   lbgen instance <problem> <i>           exactly one instance (used for end-to-end runs)
 *   lbgen file <problem> <i> <path>        the instance written as a file (file-processing; run inside the container)
 *   lbgen ref <problem> <count> [start]    one line "<i> <h1>:<h2>" per instance: hash of the reference result
 *   lbgen words <problem> <i>              the canonical result words of instance i (debugging, tests)
 *   lbgen params <problem>                 the program arguments of the problem (must equal problem.json args)
 *
 * Instance i of a problem is a pure function of i (seed i). Wire format of an instance: u64 little-endian
 * length, then that many bytes. Instances are produced in small chunks, so the process blocks on the pipe as
 * soon as the reader stops consuming: it does no meaningful work while a benchmark is being timed.
 * Everything is little-endian; numbers are int32 / float64.
 *
 * The hash of a result ("CHECK") is computed over its canonical words, in order (see harness/CONTRACT.md):
 *   h1 = (h1 * 1000003 + w mod 2147483647) mod 2147483647, h2 likewise with 999983 and 2147483629,
 *   starting at 17 and 19, then the word count is mixed in as one more word. Printed as "h1:h2".
 * Every constant is small enough that products stay below 2^53, so even a language whose only number
 * type is a double computes it exactly.
 */
#define _GNU_SOURCE
#include <errno.h>
#include <inttypes.h>
#include <math.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

typedef int64_t i64;

/* ------------------------------------------------------------------ sinks */

typedef struct { void *ctx; void (*put)(void *ctx, const void *p, size_t n); } Sink;

static unsigned char chunk[4096];
static size_t chunkn;

static void write_all(const void *p, size_t n) {
  const unsigned char *q = p;
  while (n) {
    ssize_t k = write(1, q, n);
    if (k < 0) {
      if (errno == EINTR) continue;
      _exit(0); /* reader went away: normal end of a stream */
    }
    q += k; n -= (size_t)k;
  }
}
static void stdout_put(void *ctx, const void *p, size_t n) {
  (void)ctx;
  const unsigned char *q = p;
  while (n) {
    size_t room = sizeof chunk - chunkn, k = n < room ? n : room;
    memcpy(chunk + chunkn, q, k); chunkn += k; q += k; n -= k;
    if (chunkn == sizeof chunk) { write_all(chunk, chunkn); chunkn = 0; }
  }
}
static void stdout_flush(void) { if (chunkn) { write_all(chunk, chunkn); chunkn = 0; } }

typedef struct { unsigned char *p; size_t n, cap; } Mem;
static void mem_put(void *ctx, const void *p, size_t n) {
  Mem *m = ctx;
  if (m->n + n > m->cap) { m->cap = (m->n + n) * 2; m->p = realloc(m->p, m->cap); if (!m->p) abort(); }
  memcpy(m->p + m->n, p, n); m->n += n;
}

static void put(Sink *s, const void *p, size_t n) { s->put(s->ctx, p, n); }
static void put_str(Sink *s, const char *str) { put(s, str, strlen(str)); }
static void put_i32(Sink *s, int32_t v) { unsigned char b[4] = {v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255}; put(s, b, 4); }
static void put_f64(Sink *s, double d) { uint64_t u; memcpy(&u, &d, 8); unsigned char b[8]; for (int i = 0; i < 8; i++) b[i] = (u >> (8 * i)) & 255; put(s, b, 8); }
static void put_len(Sink *s, uint64_t n) { unsigned char b[8]; for (int i = 0; i < 8; i++) b[i] = (n >> (8 * i)) & 255; put(s, b, 8); }

/* ------------------------------------------------------------------ words + hash */

typedef struct { i64 *w; size_t n, cap; } Words;
static void wpush(Words *ws, i64 v) {
  if (ws->n == ws->cap) { ws->cap = ws->cap ? ws->cap * 2 : 64; ws->w = realloc(ws->w, ws->cap * sizeof(i64)); if (!ws->w) abort(); }
  ws->w[ws->n++] = v;
}
static i64 rnd9(double x) { return (i64)floor(x * 1e9 + 0.5); }

#define P1 2147483647LL
#define P2 2147483629LL
static void hash_words(const Words *ws, i64 *h1, i64 *h2) {
  i64 a = 17, b = 19;
  for (size_t i = 0; i <= ws->n; i++) {
    i64 w = i < ws->n ? ws->w[i] : (i64)ws->n;
    i64 m1 = ((w % P1) + P1) % P1, m2 = ((w % P2) + P2) % P2;
    a = (a * 1000003 + m1) % P1;
    b = (b * 999983 + m2) % P2;
  }
  *h1 = a; *h2 = b;
}

/* ------------------------------------------------------------------ problems */

#define MINSTD(x) ((x) = (x) * 48271 % 2147483647)

enum { SORT_N = 2000000, HASH_N = 1000000, MAT_N = 256, STR_WORDS = 1000000, STR_LEN = 6700000,
       JSON_LEN = 20000000, JSON_RECORDS = 90000, CSV_LINES = 1900000, CONF_N = 4096 };
static const i64 NBODY_STEPS = 1000000;

typedef struct {
  const char *name;
  const char *kind;       /* stream | file | none */
  const char *params;     /* program arguments, space separated */
} ProblemInfo;
static const ProblemInfo PROBLEMS[] = {
  {"conformance", "stream", ""},
  {"sort", "stream", ""},
  {"hashmap", "stream", ""},
  {"matmul", "stream", ""},
  {"nbody", "stream", "1000000"},
  {"string-ops", "stream", ""},
  {"json-parse", "stream", ""},
  {"file-processing", "file", ""},
  {"binary-trees", "none", "14"},
  {"fannkuch", "none", "9"},
  {"sieve", "none", "10000000"},
  {"parallel-reduce", "none", "2000000 4"},
  {"startup", "none", ""},
};
static const ProblemInfo *find_problem(const char *n) {
  for (size_t i = 0; i < sizeof PROBLEMS / sizeof *PROBLEMS; i++) if (!strcmp(PROBLEMS[i].name, n)) return &PROBLEMS[i];
  fprintf(stderr, "lbgen: unknown problem %s\n", n); exit(2);
}

/* ---- conformance: a tiny problem used by the harness conformance test ---- */
static void gen_conformance(Sink *s, i64 seed) {
  put_len(s, CONF_N * 4);
  i64 x = 1 + seed;
  for (int j = 0; j < CONF_N; j++) { MINSTD(x); put_i32(s, (int32_t)(x % 100000)); }
}
static void ref_conformance(const unsigned char *d, size_t n, Words *out) {
  i64 sum = 0, mx = 0, sq = 0; size_t cnt = n / 4;
  for (size_t j = 0; j < cnt; j++) { int32_t v; memcpy(&v, d + 4 * j, 4); sum += v; if (v > mx) mx = v; sq = (sq + (i64)v * v) % 1000003; }
  wpush(out, sum); wpush(out, mx); wpush(out, sq); wpush(out, (i64)cnt);
}

/* ---- sort ---- */
static void gen_sort(Sink *s, i64 seed) {
  put_len(s, (uint64_t)SORT_N * 4);
  i64 x = 1 + seed;
  for (int j = 0; j < SORT_N; j++) { MINSTD(x); put_i32(s, (int32_t)x); }
}
static int cmp_i32(const void *a, const void *b) { int32_t p = *(const int32_t *)a, q = *(const int32_t *)b; return (p > q) - (p < q); }
static void ref_sort(const unsigned char *d, size_t n, Words *out) {
  size_t cnt = n / 4; int32_t *a = malloc(n);
  memcpy(a, d, n); qsort(a, cnt, 4, cmp_i32);
  for (size_t j = 0; j < cnt; j++) wpush(out, a[j]);
  free(a);
}

/* ---- hashmap: n insert keys (x mod n/2), then n lookup keys (x mod n), all int32 ---- */
static void gen_hashmap(Sink *s, i64 seed) {
  put_len(s, (uint64_t)HASH_N * 2 * 4);
  i64 x = 1 + seed;
  for (int j = 0; j < HASH_N; j++) { MINSTD(x); put_i32(s, (int32_t)(x % (HASH_N / 2))); }
  for (int j = 0; j < HASH_N; j++) { MINSTD(x); put_i32(s, (int32_t)(x % HASH_N)); }
}
static void ref_hashmap(const unsigned char *d, size_t n, Words *out) {
  size_t cnt = n / 8; const int32_t *a = (const int32_t *)d;
  int32_t *counts = calloc(cnt, 4); /* keys < n/2 */
  i64 distinct = 0, checksum = 0, hits = 0;
  for (size_t j = 0; j < cnt; j++) { if (counts[a[j]]++ == 0) distinct++; }
  for (size_t k = 0; k < cnt; k++) if (counts[k]) checksum += (i64)k * counts[k];
  for (size_t j = 0; j < cnt; j++) { int32_t k = a[cnt + j]; if ((size_t)k < cnt && counts[k]) hits += counts[k]; }
  wpush(out, distinct); wpush(out, checksum); wpush(out, hits);
  free(counts);
}

/* ---- matmul: u32 n, A and B as row-major float64 ---- */
static void gen_matmul(Sink *s, i64 seed) {
  put_len(s, 4 + 2 * (uint64_t)MAT_N * MAT_N * 8);
  put_i32(s, MAT_N);
  for (int i = 0; i < MAT_N; i++) for (int j = 0; j < MAT_N; j++) put_f64(s, (double)((i * 31 + j * 17 + 3 * seed) % 10 + 1));
  for (int i = 0; i < MAT_N; i++) for (int j = 0; j < MAT_N; j++) put_f64(s, (double)((i * 13 + j * 7 + seed) % 10 - 4));
}
static void ref_matmul(const unsigned char *d, size_t n, Words *out) {
  (void)n; int32_t m; memcpy(&m, d, 4);
  const double *a = (const double *)(d + 4), *b = a + (size_t)m * m;
  double *c = calloc((size_t)m * m, 8);
  for (int i = 0; i < m; i++) for (int k = 0; k < m; k++) { double aik = a[(size_t)i * m + k]; for (int j = 0; j < m; j++) c[(size_t)i * m + j] += aik * b[(size_t)k * m + j]; }
  for (size_t j = 0; j < (size_t)m * m; j++) wpush(out, (i64)floor(c[j] + 0.5));
  free(c);
}

/* ---- nbody: 5 bodies x (x y z vx vy vz mass) float64, velocities already per year ---- */
static const double SOLAR = 4 * 3.141592653589793 * 3.141592653589793, DAYS = 365.24;
static void nbody_initial(double b[5][7], i64 seed) {
  static const double base[5][7] = {
    {0, 0, 0, 0, 0, 0, 1},
    {4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01, 1.66007664274403694e-03, 7.69901118419740425e-03, -6.90460016972063023e-05, 9.54791938424326609e-04},
    {8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01, -2.76742510726862411e-03, 4.99852801234917238e-03, 2.30417297573763929e-05, 2.85885980666130812e-04},
    {1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01, 2.96460137564761618e-03, 2.37847173959480950e-03, -2.96589568540237556e-05, 4.36624404335156298e-05},
    {1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01, 2.68067772490389322e-03, 1.62824170038242295e-03, -9.51592254519715870e-05, 5.15138902046611451e-05}};
  double scale = 1.0 + (double)(seed % 997) * 1e-5;   /* seed 0 is the classic benchmark */
  for (int i = 0; i < 5; i++) {
    for (int k = 0; k < 3; k++) b[i][k] = base[i][k] * (i ? scale : 1.0);
    for (int k = 3; k < 6; k++) b[i][k] = base[i][k] * DAYS;
    b[i][6] = base[i][6] * SOLAR;
  }
}
static void gen_nbody(Sink *s, i64 seed) {
  put_len(s, 5 * 7 * 8);
  double b[5][7]; nbody_initial(b, seed);
  for (int i = 0; i < 5; i++) for (int k = 0; k < 7; k++) put_f64(s, b[i][k]);
}
static double nb_energy(double b[5][7]) {
  double e = 0.0;
  for (int i = 0; i < 5; i++) {
    e += 0.5 * b[i][6] * (b[i][3] * b[i][3] + b[i][4] * b[i][4] + b[i][5] * b[i][5]);
    for (int j = i + 1; j < 5; j++) {
      double dx = b[i][0] - b[j][0], dy = b[i][1] - b[j][1], dz = b[i][2] - b[j][2];
      e -= b[i][6] * b[j][6] / sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  return e;
}
static void ref_nbody(const unsigned char *d, size_t n, Words *out) {
  (void)n; double b[5][7]; memcpy(b, d, sizeof b);
  double px = 0, py = 0, pz = 0;
  for (int i = 0; i < 5; i++) { px += b[i][3] * b[i][6]; py += b[i][4] * b[i][6]; pz += b[i][5] * b[i][6]; }
  b[0][3] = -px / SOLAR; b[0][4] = -py / SOLAR; b[0][5] = -pz / SOLAR;
  wpush(out, rnd9(nb_energy(b)));
  const double dt = 0.01;
  for (i64 step = 0; step < NBODY_STEPS; step++) {
    for (int i = 0; i < 5; i++) for (int j = i + 1; j < 5; j++) {
      double dx = b[i][0] - b[j][0], dy = b[i][1] - b[j][1], dz = b[i][2] - b[j][2];
      double d2 = dx * dx + dy * dy + dz * dz, mag = dt / (d2 * sqrt(d2));
      double bm = b[i][6] * mag, cm = b[j][6] * mag;
      b[i][3] -= dx * cm; b[i][4] -= dy * cm; b[i][5] -= dz * cm;
      b[j][3] += dx * bm; b[j][4] += dy * bm; b[j][5] += dz * bm;
    }
    for (int i = 0; i < 5; i++) { b[i][0] += dt * b[i][3]; b[i][1] += dt * b[i][4]; b[i][2] += dt * b[i][5]; }
  }
  wpush(out, rnd9(nb_energy(b)));
}

/* ---- string-ops: UTF-8 text of 1,000,000 words padded with spaces to a fixed length ---- */
static const char *VOCAB[20] = {"the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
  "über", "résumé", "привет", "мир", "код", "日本語", "世界", "速度", "hello", "world"};
static void gen_strings(Sink *s, i64 seed) {
  put_len(s, STR_LEN);
  i64 x = 1 + seed; size_t total = 0;
  for (int j = 0; j < STR_WORDS; j++) {
    MINSTD(x); const char *w = VOCAB[x % 20];
    if (j) { put(s, " ", 1); total++; }
    put_str(s, w); total += strlen(w);
  }
  if (total > STR_LEN) { fprintf(stderr, "lbgen: string instance longer than STR_LEN\n"); exit(3); }
  static const char spaces[256] = "                                                                                                                                                                                                                                                               ";
  for (size_t left = STR_LEN - total; left;) { size_t k = left < 256 ? left : 256; put(s, spaces, k); left -= k; }
}
static void ref_strings(const unsigned char *d, size_t n, Words *out) {
  i64 codepoints = 0, spaces = 0, needle = 0, checksum = 0;
  for (size_t i = 0; i < n; i++) {
    unsigned c = d[i];
    if ((c & 0xC0) != 0x80) codepoints++;
    if (c == ' ') { spaces++; checksum += '_'; } else checksum += c;
  }
  for (size_t i = 0; i + 1 < n;) { if (d[i] == 'e' && d[i + 1] == 'r') { needle++; i += 2; } else i++; }
  wpush(out, (i64)n); wpush(out, codepoints); wpush(out, spaces + 1); wpush(out, needle); wpush(out, checksum);
}

/* ---- json-parse: the document of the old generator, padded with whitespace to a fixed length ---- */
typedef struct { i64 x; i64 objects, int_sum, str_len, trues, nulls; } JStats;
static i64 jrnd(JStats *st) { return MINSTD(st->x); }
static const char *JWORDS[20] = {"alpha", "bravo", "charlie", "delta", "echo", "foxtrot", "golf", "hotel", "india", "juliet", "kilo", "lima", "mike", "november", "oscar", "papa", "quebec", "romeo", "sierra", "tango"};
static size_t digits(i64 v) { return (size_t)snprintf(NULL, 0, "%" PRId64, v); }
static void jputs(Sink *s, const char *str) { put(s, str, strlen(str)); }
static void jputi(Sink *s, i64 v) { char b[32]; int n = snprintf(b, sizeof b, "%" PRId64, v); put(s, b, (size_t)n); }

/* the evaluation order of rnd() calls follows the original generate.mjs exactly */
static void json_body(Sink *s, i64 seed, JStats *st) {
  memset(st, 0, sizeof *st); st->x = 12345 + seed;
  jputs(s, "[");
  for (int i = 0; i < JSON_RECORDS; i++) {
    i64 ntags = jrnd(st) % 6;
    char tags[6][48]; size_t taglen[6];
    for (int t = 0; t < ntags; t++) {
      const char *w = JWORDS[jrnd(st) % 20]; i64 num = jrnd(st) % 1000;
      snprintf(tags[t], sizeof tags[t], "\"%s-%" PRId64 "\"", w, num);
      taglen[t] = strlen(w) + 1 + digits(num);
    }
    jputs(s, "{\"id\":"); jputi(s, i + 1); st->int_sum += i + 1;
    jputs(s, ",\"name\":");
    { const char *w1 = JWORDS[jrnd(st) % 20]; const char *w2 = JWORDS[jrnd(st) % 20]; i64 num = jrnd(st) % 100000;
      /* JSON text of the string  w1 w2 \"num\"  with real backslashes: ... \\\"num\\\" */
      jputs(s, "\""); jputs(s, w1); jputs(s, " "); jputs(s, w2); jputs(s, " \\\\\\\""); jputi(s, num); jputs(s, "\\\\\\\"\"");
      st->str_len += (i64)(strlen(w1) + 1 + strlen(w2) + 1 + 2 + digits(num) + 2); }
    { int active = jrnd(st) % 3 != 0; jputs(s, ",\"active\":"); jputs(s, active ? "true" : "false"); if (active) st->trues++; }
    { i64 sc = (jrnd(st) % 2000000) - 1000000; jputs(s, ",\"score\":"); jputi(s, sc); st->int_sum += sc; }
    jputs(s, ",\"tags\":[");
    for (int t = 0; t < ntags; t++) { if (t) jputs(s, ","); jputs(s, tags[t]); st->str_len += (i64)taglen[t]; }
    { i64 mx = jrnd(st) % 1000, my = jrnd(st) % 1000;
      jputs(s, "],\"meta\":{\"x\":"); jputi(s, mx); jputs(s, ",\"y\":"); jputi(s, my); jputs(s, ",\"note\":"); st->int_sum += mx + my; st->objects++; }
    if (jrnd(st) % 4 == 0) { jputs(s, "null"); st->nulls++; }
    else { const char *w = JWORDS[jrnd(st) % 20]; i64 rep = 1 + jrnd(st) % 8; jputs(s, "\"");
      for (i64 r = 0; r < rep; r++) jputs(s, w);
      jputs(s, "\""); st->str_len += (i64)strlen(w) * rep; }
    jputs(s, ",\"history\":[");
    { i64 hn = jrnd(st) % 12; for (i64 h = 0; h < hn; h++) { if (h) jputs(s, ","); i64 v = jrnd(st) % 100000; jputi(s, v); st->int_sum += v; } }
    jputs(s, "]}}"); st->objects++;
    jputs(s, i == JSON_RECORDS - 1 ? "]\n" : ",\n");
  }
}
typedef struct { Sink *inner; size_t n; } Count;
static void count_put(void *ctx, const void *p, size_t n) { Count *c = ctx; c->n += n; put(c->inner, p, n); }
static const char SPACES[256] = "                                                                                                                                                                                                                                                               ";
static void gen_json_stats(Sink *s, i64 seed, JStats *st) {
  put_len(s, JSON_LEN);
  Count c = {s, 0}; Sink cs = {&c, count_put};
  json_body(&cs, seed, st);
  if (c.n > JSON_LEN) { fprintf(stderr, "lbgen: json instance longer than JSON_LEN (%zu)\n", c.n); exit(3); }
  for (size_t left = JSON_LEN - c.n; left;) { size_t k = left < 256 ? left : 256; put(s, SPACES, k); left -= k; }
}
static void gen_json(Sink *s, i64 seed) { JStats st; gen_json_stats(s, seed, &st); }
/* the reference result is tallied while generating: run the generator into a sink that drops the bytes */
static void null_put(void *ctx, const void *p, size_t n) { (void)ctx; (void)p; (void)n; }
static void ref_json_seed(i64 seed, Words *out) {
  Sink null = {NULL, null_put}; JStats st; Count c = {&null, 0}; Sink cs = {&c, count_put};
  json_body(&cs, seed, &st);
  wpush(out, st.objects); wpush(out, st.int_sum); wpush(out, st.str_len); wpush(out, st.trues); wpush(out, st.nulls);
}

/* ---- file-processing: the CSV "id,word,value" of the old generator, written as a file ---- */
static void csv_vocab(char vocab[5000][32]) {
  static const char *syll[15] = {"ka", "to", "mi", "re", "su", "no", "ha", "li", "ve", "do", "an", "or", "el", "um", "ix"};
  for (int i = 0; i < 5000; i++) {
    char w[32] = ""; long n = i + 7;
    for (int k = 0; k < 3 + (i % 3); k++) { strcat(w, syll[n % 15]); n = n / 3 + k * 5 + 1; }
    snprintf(vocab[i], 32, "%s%d", w, i);
  }
}
typedef struct { i64 lines, sum, distinct, top_count; char top[32]; } CsvStats;
static void gen_csv(Sink *s, i64 seed, CsvStats *st) {
  static char vocab[5000][32]; static int counts[5000]; csv_vocab(vocab);
  memset(counts, 0, sizeof counts); memset(st, 0, sizeof *st);
  i64 x = 987654321 + seed;
  for (int i = 1; i <= CSV_LINES; i++) {
    double u = (double)(MINSTD(x) % 100000) / 100000.0;
    int w = (int)floor(u * u * 5000);
    i64 v = MINSTD(x) % 100000;
    char b[96]; int n = snprintf(b, sizeof b, "%d,%s,%" PRId64 "\n", i, vocab[w], v);
    put(s, b, (size_t)n);
    st->lines++; st->sum += v; counts[w]++;
  }
  for (int w = 0; w < 5000; w++) if (counts[w]) {
    st->distinct++;
    if (counts[w] > st->top_count || (counts[w] == st->top_count && strcmp(vocab[w], st->top) < 0)) { st->top_count = counts[w]; snprintf(st->top, 32, "%s", vocab[w]); }
  }
}
static void ref_csv_words(const CsvStats *st, Words *out) {
  wpush(out, st->lines); wpush(out, st->sum); wpush(out, st->distinct); wpush(out, st->top_count);
  wpush(out, (i64)strlen(st->top)); for (const char *p = st->top; *p; p++) wpush(out, (unsigned char)*p);
}

/* ---- problems without an instance ---- */
static void ref_binary_trees(Words *out) {
  const int n = 14, min_depth = 4, max_depth = n > 6 ? n : 6, stretch = max_depth + 1;
  wpush(out, (1LL << (stretch + 1)) - 1);
  for (int d = min_depth; d <= max_depth; d += 2) { i64 it = 1LL << (max_depth - d + min_depth); wpush(out, it); wpush(out, it * ((1LL << (d + 1)) - 1)); }
  wpush(out, (1LL << (max_depth + 1)) - 1);
}
static void ref_fannkuch(Words *out) {
  const int n = 9; int perm1[16], perm[16], count[16], maxflips = 0, permcount = 0; i64 checksum = 0; int r = n;
  for (int i = 0; i < n; i++) perm1[i] = i;
  for (;;) {
    while (r != 1) { count[r - 1] = r; r--; }
    memcpy(perm, perm1, sizeof perm1);
    int flips = 0, k;
    while ((k = perm[0]) != 0) { for (int i = 0, j = k; i < j; i++, j--) { int t = perm[i]; perm[i] = perm[j]; perm[j] = t; } flips++; }
    if (flips > maxflips) maxflips = flips;
    checksum += permcount % 2 == 0 ? flips : -flips;
    for (;;) {
      if (r == n) { wpush(out, checksum); wpush(out, maxflips); return; }
      int p0 = perm1[0]; for (int i = 0; i < r; i++) perm1[i] = perm1[i + 1]; perm1[r] = p0;
      if (--count[r] > 0) break;
      r++;
    }
    permcount++;
  }
}
static void ref_sieve(Words *out) {
  const int n = 10000000; unsigned char *c = calloc(n + 1, 1);
  for (long p = 2; p * p <= n; p++) if (!c[p]) for (long m = p * p; m <= n; m += p) c[m] = 1;
  i64 count = 0, last = 0, sum = 0;
  for (int i = 2; i <= n; i++) if (!c[i]) { count++; last = i; sum += i; }
  wpush(out, count); wpush(out, last); wpush(out, sum); free(c);
}
static void ref_parallel_reduce(Words *out) {
  i64 count = 0;
  for (i64 n = 0; n < 2000000; n++) {
    int prime = 1;
    if (n < 2) prime = 0; else if (n < 4) prime = 1; else if (n % 2 == 0) prime = 0;
    else for (i64 d = 3; d * d <= n; d += 2) if (n % d == 0) { prime = 0; break; }
    count += prime;
  }
  wpush(out, count);
}

/* ------------------------------------------------------------------ driver */

typedef void (*GenFn)(Sink *, i64);
typedef void (*RefFn)(const unsigned char *, size_t, Words *);
static GenFn gen_of(const char *p) {
  if (!strcmp(p, "conformance")) return gen_conformance;
  if (!strcmp(p, "sort")) return gen_sort;
  if (!strcmp(p, "hashmap")) return gen_hashmap;
  if (!strcmp(p, "matmul")) return gen_matmul;
  if (!strcmp(p, "nbody")) return gen_nbody;
  if (!strcmp(p, "string-ops")) return gen_strings;
  if (!strcmp(p, "json-parse")) return gen_json;
  return NULL;
}
static RefFn ref_of(const char *p) {
  if (!strcmp(p, "conformance")) return ref_conformance;
  if (!strcmp(p, "sort")) return ref_sort;
  if (!strcmp(p, "hashmap")) return ref_hashmap;
  if (!strcmp(p, "matmul")) return ref_matmul;
  if (!strcmp(p, "nbody")) return ref_nbody;
  if (!strcmp(p, "string-ops")) return ref_strings;
  return NULL;
}

/* the words of instance i of any problem */
static void words_of(const char *p, i64 i, Words *out) {
  if (!strcmp(p, "json-parse")) { ref_json_seed(i, out); return; }
  if (!strcmp(p, "file-processing")) {
    Sink null = {NULL, null_put}; CsvStats st; gen_csv(&null, i, &st); ref_csv_words(&st, out); return;
  }
  if (!strcmp(p, "binary-trees")) { ref_binary_trees(out); return; }
  if (!strcmp(p, "fannkuch")) { ref_fannkuch(out); return; }
  if (!strcmp(p, "sieve")) { ref_sieve(out); return; }
  if (!strcmp(p, "parallel-reduce")) { ref_parallel_reduce(out); return; }
  if (!strcmp(p, "startup")) { wpush(out, 1); return; }
  GenFn g = gen_of(p); RefFn r = ref_of(p);
  Mem m = {0}; Sink s = {&m, mem_put}; g(&s, i);
  r(m.p + 8, m.n - 8, out); free(m.p);
}

static void file_put(void *ctx, const void *p, size_t n) { if (fwrite(p, 1, n, ctx) != n) { perror("write"); exit(1); } }

int main(int argc, char **argv) {
  if (argc < 3) { fprintf(stderr, "usage: lbgen stream|instance|file|ref|words|params <problem> ...\n"); return 2; }
  const char *mode = argv[1], *problem = argv[2];
  const ProblemInfo *info = find_problem(problem);
  if (!strcmp(mode, "params")) { puts(info->params); return 0; }
  if (!strcmp(mode, "stream") || !strcmp(mode, "instance")) {
    GenFn g = gen_of(problem); if (!g) { fprintf(stderr, "lbgen: %s has no streamed instances\n", problem); return 2; }
    Sink s = {NULL, stdout_put};
    if (!strcmp(mode, "instance")) { g(&s, argc > 3 ? atoll(argv[3]) : 0); stdout_flush(); return 0; }
    for (i64 i = argc > 3 ? atoll(argv[3]) : 0;; i++) { g(&s, i); stdout_flush(); }
  }
  if (!strcmp(mode, "file")) {
    if (argc < 5 || strcmp(problem, "file-processing")) { fprintf(stderr, "usage: lbgen file file-processing <i> <path>\n"); return 2; }
    FILE *f = fopen(argv[4], "wb"); if (!f) { perror(argv[4]); return 1; }
    static char big[1 << 16]; setvbuf(f, big, _IOFBF, sizeof big);
    Sink s = {f, file_put}; CsvStats st;
    gen_csv(&s, atoll(argv[3]), &st);
    return fclose(f) ? 1 : 0;
  }
  if (!strcmp(mode, "words") || !strcmp(mode, "ref")) {
    i64 count = !strcmp(mode, "ref") ? atoll(argc > 3 ? argv[3] : "1") : 1;
    i64 start = !strcmp(mode, "ref") ? (argc > 4 ? atoll(argv[4]) : 0) : atoll(argc > 3 ? argv[3] : "0");
    int fixed = !strcmp(info->kind, "none");
    Words fixedw = {0};
    for (i64 i = 0; i < count; i++) {
      Words w = {0};
      if (fixed && fixedw.n) { w = fixedw; } else { words_of(problem, start + i, &w); if (fixed) fixedw = w; }
      if (!strcmp(mode, "words")) { for (size_t k = 0; k < w.n; k++) printf("%" PRId64 "\n", w.w[k]); return 0; }
      i64 h1, h2; hash_words(&w, &h1, &h2);
      printf("%" PRId64 " %" PRId64 ":%" PRId64 "\n", start + i, h1, h2); fflush(stdout);
      if (!fixed) free(w.w);
    }
    return 0;
  }
  fprintf(stderr, "lbgen: unknown mode %s\n", mode);
  return 2;
}
