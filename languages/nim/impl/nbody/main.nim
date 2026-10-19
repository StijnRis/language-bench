# N-body simulation, after the Computer Language Benchmarks Game.
import std/[math, os, strutils]

const
  solarMass = 4.0 * PI * PI
  daysPerYear = 365.24

type Body = object
  x, y, z, vx, vy, vz, mass: float64

var bodies = [
  Body(mass: solarMass),
  Body(x: 4.84143144246472090e+00, y: -1.16032004402742839e+00, z: -1.03622044471123109e-01,
       vx: 1.66007664274403694e-03 * daysPerYear, vy: 7.69901118419740425e-03 * daysPerYear, vz: -6.90460016972063023e-05 * daysPerYear,
       mass: 9.54791938424326609e-04 * solarMass),
  Body(x: 8.34336671824457987e+00, y: 4.12479856412430479e+00, z: -4.03523417114321381e-01,
       vx: -2.76742510726862411e-03 * daysPerYear, vy: 4.99852801234917238e-03 * daysPerYear, vz: 2.30417297573763929e-05 * daysPerYear,
       mass: 2.85885980666130812e-04 * solarMass),
  Body(x: 1.28943695621391310e+01, y: -1.51111514016986312e+01, z: -2.23307578892655734e-01,
       vx: 2.96460137564761618e-03 * daysPerYear, vy: 2.37847173959480950e-03 * daysPerYear, vz: -2.96589568540237556e-05 * daysPerYear,
       mass: 4.36624404335156298e-05 * solarMass),
  Body(x: 1.53796971148509165e+01, y: -2.59193146099879641e+01, z: 1.79258772950371181e-01,
       vx: 2.68067772490389322e-03 * daysPerYear, vy: 1.62824170038242295e-03 * daysPerYear, vz: -9.51592254519715870e-05 * daysPerYear,
       mass: 5.15138902046611451e-05 * solarMass),
]

proc energy(): float64 =
  for i in 0 ..< bodies.len:
    result += 0.5 * bodies[i].mass * (bodies[i].vx * bodies[i].vx + bodies[i].vy * bodies[i].vy + bodies[i].vz * bodies[i].vz)
    for j in i + 1 ..< bodies.len:
      let dx = bodies[i].x - bodies[j].x
      let dy = bodies[i].y - bodies[j].y
      let dz = bodies[i].z - bodies[j].z
      result -= bodies[i].mass * bodies[j].mass / sqrt(dx * dx + dy * dy + dz * dz)

proc advance(dt: float64) =
  for i in 0 ..< bodies.len:
    for j in i + 1 ..< bodies.len:
      let dx = bodies[i].x - bodies[j].x
      let dy = bodies[i].y - bodies[j].y
      let dz = bodies[i].z - bodies[j].z
      let d2 = dx * dx + dy * dy + dz * dz
      let mag = dt / (d2 * sqrt(d2))
      let bm = bodies[i].mass * mag
      let cm = bodies[j].mass * mag
      bodies[i].vx -= dx * cm; bodies[i].vy -= dy * cm; bodies[i].vz -= dz * cm
      bodies[j].vx += dx * bm; bodies[j].vy += dy * bm; bodies[j].vz += dz * bm
  for i in 0 ..< bodies.len:
    bodies[i].x += dt * bodies[i].vx
    bodies[i].y += dt * bodies[i].vy
    bodies[i].z += dt * bodies[i].vz

var px, py, pz = 0.0
for b in bodies:
  px += b.vx * b.mass
  py += b.vy * b.mass
  pz += b.vz * b.mass
bodies[0].vx = -px / solarMass
bodies[0].vy = -py / solarMass
bodies[0].vz = -pz / solarMass

echo formatFloat(energy(), ffDecimal, 9)
for _ in 1 .. parseInt(paramStr(1)):
  advance(0.01)
echo formatFloat(energy(), ffDecimal, 9)
