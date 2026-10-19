// N-body simulation, after the Computer Language Benchmarks Game.
import 'dart:math' as math;
import 'dart:typed_data';

var steps = 1000000;

void setup(List<String> args) {
  if (args.isNotEmpty) steps = int.parse(args[0]);
}

class Body {
  double x, y, z, vx, vy, vz, mass;
  Body(this.x, this.y, this.z, this.vx, this.vy, this.vz, this.mass);
}

Object? decode(Uint8List data) {
  final v = ByteData.sublistView(data);
  double f(int i) => v.getFloat64(8 * i, Endian.little);
  return List<Body>.generate(5, (i) => Body(f(i * 7), f(i * 7 + 1), f(i * 7 + 2), f(i * 7 + 3), f(i * 7 + 4), f(i * 7 + 5), f(i * 7 + 6)));
}

double energy(List<Body> b) {
  var e = 0.0;
  for (var i = 0; i < 5; i++) {
    e += 0.5 * b[i].mass * (b[i].vx * b[i].vx + b[i].vy * b[i].vy + b[i].vz * b[i].vz);
    for (var j = i + 1; j < 5; j++) {
      final dx = b[i].x - b[j].x, dy = b[i].y - b[j].y, dz = b[i].z - b[j].z;
      e -= b[i].mass * b[j].mass / math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  return e;
}

Object? solve(Object? inst) {
  final b = inst as List<Body>;
  final solar = 4 * math.pi * math.pi;
  var px = 0.0, py = 0.0, pz = 0.0;
  for (final o in b) {
    px += o.vx * o.mass;
    py += o.vy * o.mass;
    pz += o.vz * o.mass;
  }
  b[0].vx = -px / solar;
  b[0].vy = -py / solar;
  b[0].vz = -pz / solar;
  final e0 = energy(b);
  const dt = 0.01;
  for (var s = 0; s < steps; s++) {
    for (var i = 0; i < 5; i++) {
      for (var j = i + 1; j < 5; j++) {
        final dx = b[i].x - b[j].x, dy = b[i].y - b[j].y, dz = b[i].z - b[j].z;
        final d2 = dx * dx + dy * dy + dz * dz;
        final mag = dt / (d2 * math.sqrt(d2));
        final bm = b[i].mass * mag, cm = b[j].mass * mag;
        b[i].vx -= dx * cm;
        b[i].vy -= dy * cm;
        b[i].vz -= dz * cm;
        b[j].vx += dx * bm;
        b[j].vy += dy * bm;
        b[j].vz += dz * bm;
      }
    }
    for (final o in b) {
      o.x += dt * o.vx;
      o.y += dt * o.vy;
      o.z += dt * o.vz;
    }
  }
  return <double>[e0, energy(b)];
}

List<int> emit(Object? res) => (res as List<double>).map((e) => (e * 1e9 + 0.5).floor()).toList();
