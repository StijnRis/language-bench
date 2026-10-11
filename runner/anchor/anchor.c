/*
 * HARDWARE ANCHOR - frozen. Never change this file: every session on every machine runs exactly
 * this program, and all benchmark times are divided by its time to cancel out hardware speed.
 * Five-body floating point kernel (scalar double precision), ~0.1-0.3 s.
 */
#include <math.h>
#include <stdio.h>

#define PI 3.141592653589793
#define SOLAR_MASS (4 * PI * PI)
#define DAYS 365.24

struct body { double x[3], v[3], mass; };

static struct body bodies[5] = {
  {{0, 0, 0}, {0, 0, 0}, SOLAR_MASS},
  {{4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01},
   {1.66007664274403694e-03 * DAYS, 7.69901118419740425e-03 * DAYS, -6.90460016972063023e-05 * DAYS},
   9.54791938424326609e-04 * SOLAR_MASS},
  {{8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01},
   {-2.76742510726862411e-03 * DAYS, 4.99852801234917238e-03 * DAYS, 2.30417297573763929e-05 * DAYS},
   2.85885980666130812e-04 * SOLAR_MASS},
  {{1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01},
   {2.96460137564761618e-03 * DAYS, 2.37847173959480950e-03 * DAYS, -2.96589568540237556e-05 * DAYS},
   4.36624404335156298e-05 * SOLAR_MASS},
  {{1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01},
   {2.68067772490389322e-03 * DAYS, 1.62824170038242295e-03 * DAYS, -9.51592254519715870e-05 * DAYS},
   5.15138902046611451e-05 * SOLAR_MASS},
};

int main(void) {
  for (long step = 0; step < 2000000; step++) {
    for (int i = 0; i < 5; i++)
      for (int j = i + 1; j < 5; j++) {
        double d[3], d2 = 0;
        for (int k = 0; k < 3; k++) { d[k] = bodies[i].x[k] - bodies[j].x[k]; d2 += d[k] * d[k]; }
        double mag = 0.01 / (d2 * sqrt(d2));
        for (int k = 0; k < 3; k++) {
          bodies[i].v[k] -= d[k] * bodies[j].mass * mag;
          bodies[j].v[k] += d[k] * bodies[i].mass * mag;
        }
      }
    for (int i = 0; i < 5; i++)
      for (int k = 0; k < 3; k++) bodies[i].x[k] += 0.01 * bodies[i].v[k];
  }
  printf("%.9f\n", bodies[0].x[0]);
  return 0;
}
