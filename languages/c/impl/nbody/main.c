/* N-body simulation, after the Computer Language Benchmarks Game. */
#include <math.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

static const double SOLAR_MASS = 4 * 3.141592653589793 * 3.141592653589793;
static long steps;
static double body[5][7]; /* x y z vx vy vz mass */
static double energies[2];

static double energy(void) {
  double e = 0.0;
  for (int i = 0; i < 5; i++) {
    e += 0.5 * body[i][6] * (body[i][3] * body[i][3] + body[i][4] * body[i][4] + body[i][5] * body[i][5]);
    for (int j = i + 1; j < 5; j++) {
      double dx = body[i][0] - body[j][0], dy = body[i][1] - body[j][1], dz = body[i][2] - body[j][2];
      e -= body[i][6] * body[j][6] / sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  return e;
}

void lb_setup(int argc, char **argv) { steps = argc > 0 ? atol(argv[0]) : 1000000; }
void *lb_decode(const unsigned char *data, size_t len) { (void)len; memcpy(body, data, sizeof body); return body; }
void *lb_solve(void *inst) {
  (void)inst;
  double px = 0, py = 0, pz = 0;
  for (int i = 0; i < 5; i++) { px += body[i][3] * body[i][6]; py += body[i][4] * body[i][6]; pz += body[i][5] * body[i][6]; }
  body[0][3] = -px / SOLAR_MASS; body[0][4] = -py / SOLAR_MASS; body[0][5] = -pz / SOLAR_MASS;
  energies[0] = energy();
  const double dt = 0.01;
  for (long s = 0; s < steps; s++) {
    for (int i = 0; i < 5; i++)
      for (int j = i + 1; j < 5; j++) {
        double dx = body[i][0] - body[j][0], dy = body[i][1] - body[j][1], dz = body[i][2] - body[j][2];
        double d2 = dx * dx + dy * dy + dz * dz, mag = dt / (d2 * sqrt(d2));
        double bm = body[i][6] * mag, cm = body[j][6] * mag;
        body[i][3] -= dx * cm; body[i][4] -= dy * cm; body[i][5] -= dz * cm;
        body[j][3] += dx * bm; body[j][4] += dy * bm; body[j][5] += dz * bm;
      }
    for (int i = 0; i < 5; i++) { body[i][0] += dt * body[i][3]; body[i][1] += dt * body[i][4]; body[i][2] += dt * body[i][5]; }
  }
  energies[1] = energy();
  return energies;
}
void lb_emit(void *res, void (*sink)(int64_t)) { double *e = res; for (int i = 0; i < 2; i++) sink((int64_t)floor(e[i] * 1e9 + 0.5)); }
void lb_release(void *inst, void *res) { (void)inst; (void)res; }
