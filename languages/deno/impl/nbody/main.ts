// N-body simulation, after the Computer Language Benchmarks Game.
const PI = Math.PI;
const SOLAR_MASS = 4 * PI * PI;
const DAYS = 365.24;

class Body {
  constructor(
    public x: number, public y: number, public z: number,
    public vx: number, public vy: number, public vz: number,
    public mass: number,
  ) {}
}

const bodies: Body[] = [
  new Body(0, 0, 0, 0, 0, 0, SOLAR_MASS),
  new Body(
    4.84143144246472090e0, -1.16032004402742839e0, -1.03622044471123109e-1,
    1.66007664274403694e-3 * DAYS, 7.69901118419740425e-3 * DAYS, -6.90460016972063023e-5 * DAYS,
    9.54791938424326609e-4 * SOLAR_MASS,
  ),
  new Body(
    8.34336671824457987e0, 4.12479856412430479e0, -4.03523417114321381e-1,
    -2.76742510726862411e-3 * DAYS, 4.99852801234917238e-3 * DAYS, 2.30417297573763929e-5 * DAYS,
    2.85885980666130812e-4 * SOLAR_MASS,
  ),
  new Body(
    1.28943695621391310e1, -1.51111514016986312e1, -2.23307578892655734e-1,
    2.96460137564761618e-3 * DAYS, 2.37847173959480950e-3 * DAYS, -2.96589568540237556e-5 * DAYS,
    4.36624404335156298e-5 * SOLAR_MASS,
  ),
  new Body(
    1.53796971148509165e1, -2.59193146099879641e1, 1.79258772950371181e-1,
    2.68067772490389322e-3 * DAYS, 1.62824170038242295e-3 * DAYS, -9.51592254519715870e-5 * DAYS,
    5.15138902046611451e-5 * SOLAR_MASS,
  ),
];

function offsetMomentum(): void {
  let px = 0, py = 0, pz = 0;
  for (const b of bodies) {
    px += b.vx * b.mass;
    py += b.vy * b.mass;
    pz += b.vz * b.mass;
  }
  bodies[0].vx = -px / SOLAR_MASS;
  bodies[0].vy = -py / SOLAR_MASS;
  bodies[0].vz = -pz / SOLAR_MASS;
}

function advance(dt: number): void {
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const dx = bi.x - bj.x;
      const dy = bi.y - bj.y;
      const dz = bi.z - bj.z;
      const d2 = dx * dx + dy * dy + dz * dz;
      const mag = dt / (d2 * Math.sqrt(d2));
      bi.vx -= dx * bj.mass * mag;
      bi.vy -= dy * bj.mass * mag;
      bi.vz -= dz * bj.mass * mag;
      bj.vx += dx * bi.mass * mag;
      bj.vy += dy * bi.mass * mag;
      bj.vz += dz * bi.mass * mag;
    }
  }
  for (const b of bodies) {
    b.x += dt * b.vx;
    b.y += dt * b.vy;
    b.z += dt * b.vz;
  }
}

function energy(): number {
  let e = 0;
  const n = bodies.length;
  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    e += 0.5 * bi.mass * (bi.vx * bi.vx + bi.vy * bi.vy + bi.vz * bi.vz);
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const dx = bi.x - bj.x;
      const dy = bi.y - bj.y;
      const dz = bi.z - bj.z;
      e -= (bi.mass * bj.mass) / Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  return e;
}

const n = parseInt(Deno.args[0], 10);
offsetMomentum();
console.log(energy().toFixed(9));
for (let i = 0; i < n; i++) advance(0.01);
console.log(energy().toFixed(9));
