// N-body simulation, after the Computer Language Benchmarks Game.
import 'dart:math';

const solarMass = 4 * pi * pi;
const days = 365.24;

class Body {
  double x, y, z, vx, vy, vz, mass;
  Body(this.x, this.y, this.z, this.vx, this.vy, this.vz, this.mass);
}

final bodies = <Body>[
  Body(0, 0, 0, 0, 0, 0, solarMass),
  Body(
    4.84143144246472090e0, -1.16032004402742839e0, -1.03622044471123109e-1,
    1.66007664274403694e-3 * days, 7.69901118419740425e-3 * days, -6.90460016972063023e-5 * days,
    9.54791938424326609e-4 * solarMass,
  ),
  Body(
    8.34336671824457987e0, 4.12479856412430479e0, -4.03523417114321381e-1,
    -2.76742510726862411e-3 * days, 4.99852801234917238e-3 * days, 2.30417297573763929e-5 * days,
    2.85885980666130812e-4 * solarMass,
  ),
  Body(
    1.28943695621391310e1, -1.51111514016986312e1, -2.23307578892655734e-1,
    2.96460137564761618e-3 * days, 2.37847173959480950e-3 * days, -2.96589568540237556e-5 * days,
    4.36624404335156298e-5 * solarMass,
  ),
  Body(
    1.53796971148509165e1, -2.59193146099879641e1, 1.79258772950371181e-1,
    2.68067772490389322e-3 * days, 1.62824170038242295e-3 * days, -9.51592254519715870e-5 * days,
    5.15138902046611451e-5 * solarMass,
  ),
];

void offsetMomentum() {
  var px = 0.0, py = 0.0, pz = 0.0;
  for (final b in bodies) {
    px += b.vx * b.mass;
    py += b.vy * b.mass;
    pz += b.vz * b.mass;
  }
  bodies[0].vx = -px / solarMass;
  bodies[0].vy = -py / solarMass;
  bodies[0].vz = -pz / solarMass;
}

void advance(double dt) {
  final n = bodies.length;
  for (var i = 0; i < n; i++) {
    final bi = bodies[i];
    for (var j = i + 1; j < n; j++) {
      final bj = bodies[j];
      final dx = bi.x - bj.x;
      final dy = bi.y - bj.y;
      final dz = bi.z - bj.z;
      final d2 = dx * dx + dy * dy + dz * dz;
      final mag = dt / (d2 * sqrt(d2));
      bi.vx -= dx * bj.mass * mag;
      bi.vy -= dy * bj.mass * mag;
      bi.vz -= dz * bj.mass * mag;
      bj.vx += dx * bi.mass * mag;
      bj.vy += dy * bi.mass * mag;
      bj.vz += dz * bi.mass * mag;
    }
  }
  for (final b in bodies) {
    b.x += dt * b.vx;
    b.y += dt * b.vy;
    b.z += dt * b.vz;
  }
}

double energy() {
  var e = 0.0;
  final n = bodies.length;
  for (var i = 0; i < n; i++) {
    final bi = bodies[i];
    e += 0.5 * bi.mass * (bi.vx * bi.vx + bi.vy * bi.vy + bi.vz * bi.vz);
    for (var j = i + 1; j < n; j++) {
      final bj = bodies[j];
      final dx = bi.x - bj.x;
      final dy = bi.y - bj.y;
      final dz = bi.z - bj.z;
      e -= (bi.mass * bj.mass) / sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  return e;
}

void main(List<String> args) {
  final n = int.parse(args[0]);
  offsetMomentum();
  print(energy().toStringAsFixed(9));
  for (var i = 0; i < n; i++) {
    advance(0.01);
  }
  print(energy().toStringAsFixed(9));
}
