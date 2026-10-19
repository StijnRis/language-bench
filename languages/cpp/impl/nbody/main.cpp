// N-body simulation, after the Computer Language Benchmarks Game.
#include <cmath>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>

namespace {
const double SOLAR_MASS = 4 * 3.141592653589793 * 3.141592653589793;
long steps = 1000000;

struct Body { double x, y, z, vx, vy, vz, mass; };
struct System { Body b[5]; };

double energy(const System &s) {
  double e = 0.0;
  for (int i = 0; i < 5; i++) {
    const Body &a = s.b[i];
    e += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy + a.vz * a.vz);
    for (int j = i + 1; j < 5; j++) {
      const Body &c = s.b[j];
      double dx = a.x - c.x, dy = a.y - c.y, dz = a.z - c.z;
      e -= a.mass * c.mass / std::sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  return e;
}
}  // namespace

void lb_setup(int argc, char **argv) { if (argc > 0) steps = std::atol(argv[0]); }
void *lb_decode(const unsigned char *data, size_t) {
  auto *s = new System;
  std::memcpy(s, data, sizeof(System));
  return s;
}
void *lb_solve(void *p) {
  auto *s = static_cast<System *>(p);
  double px = 0, py = 0, pz = 0;
  for (auto &b : s->b) { px += b.vx * b.mass; py += b.vy * b.mass; pz += b.vz * b.mass; }
  s->b[0].vx = -px / SOLAR_MASS; s->b[0].vy = -py / SOLAR_MASS; s->b[0].vz = -pz / SOLAR_MASS;
  auto *e = new double[2];
  e[0] = energy(*s);
  const double dt = 0.01;
  for (long step = 0; step < steps; step++) {
    for (int i = 0; i < 5; i++)
      for (int j = i + 1; j < 5; j++) {
        Body &a = s->b[i], &c = s->b[j];
        double dx = a.x - c.x, dy = a.y - c.y, dz = a.z - c.z;
        double d2 = dx * dx + dy * dy + dz * dz, mag = dt / (d2 * std::sqrt(d2));
        double bm = a.mass * mag, cm = c.mass * mag;
        a.vx -= dx * cm; a.vy -= dy * cm; a.vz -= dz * cm;
        c.vx += dx * bm; c.vy += dy * bm; c.vz += dz * bm;
      }
    for (auto &b : s->b) { b.x += dt * b.vx; b.y += dt * b.vy; b.z += dt * b.vz; }
  }
  e[1] = energy(*s);
  return e;
}
void lb_emit(void *res, void (*sink)(int64_t)) {
  double *e = static_cast<double *>(res);
  for (int i = 0; i < 2; i++) sink((int64_t)std::floor(e[i] * 1e9 + 0.5));
}
void lb_release(void *inst, void *res) {
  delete static_cast<System *>(inst);
  delete[] static_cast<double *>(res);
}
