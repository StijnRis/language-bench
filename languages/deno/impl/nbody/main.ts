// N-body simulation, after the Computer Language Benchmarks Game.
let steps = 1000000;
export const setup = (args) => {
  if (args.length) steps = parseInt(args[0], 10);
};

class Body {
  constructor(x, y, z, vx, vy, vz, mass) {
    this.x = x; this.y = y; this.z = z;
    this.vx = vx; this.vy = vy; this.vz = vz;
    this.mass = mass;
  }
}

export const decode = (data) => {
  const bodies = [];
  const view = new DataView(data.buffer, data.byteOffset);
  for (let i = 0; i < 5; i++) {
    const f = (k: number) => view.getFloat64((i * 7 + k) * 8, true);
    bodies.push(new Body(f(0), f(1), f(2), f(3), f(4), f(5), f(6)));
  }
  return bodies;
};

function energy(bodies) {
  let e = 0;
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    e += 0.5 * bi.mass * (bi.vx * bi.vx + bi.vy * bi.vy + bi.vz * bi.vz);
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const dx = bi.x - bj.x, dy = bi.y - bj.y, dz = bi.z - bj.z;
      e -= (bi.mass * bj.mass) / Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  return e;
}

export const solve = (bodies) => {
  const SOLAR_MASS = 4 * Math.PI * Math.PI;
  let px = 0, py = 0, pz = 0;
  for (const b of bodies) { px += b.vx * b.mass; py += b.vy * b.mass; pz += b.vz * b.mass; }
  bodies[0].vx = -px / SOLAR_MASS; bodies[0].vy = -py / SOLAR_MASS; bodies[0].vz = -pz / SOLAR_MASS;
  const e0 = energy(bodies);
  const dt = 0.01, n = bodies.length;
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const bi = bodies[i];
      for (let j = i + 1; j < n; j++) {
        const bj = bodies[j];
        const dx = bi.x - bj.x, dy = bi.y - bj.y, dz = bi.z - bj.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        const mag = dt / (d2 * Math.sqrt(d2));
        const bm = bi.mass * mag, cm = bj.mass * mag;
        bi.vx -= dx * cm; bi.vy -= dy * cm; bi.vz -= dz * cm;
        bj.vx += dx * bm; bj.vy += dy * bm; bj.vz += dz * bm;
      }
    }
    for (const b of bodies) { b.x += dt * b.vx; b.y += dt * b.vy; b.z += dt * b.vz; }
  }
  return [e0, energy(bodies)];
};
export const emit = (r) => r.map((e) => Math.floor(e * 1e9 + 0.5));
