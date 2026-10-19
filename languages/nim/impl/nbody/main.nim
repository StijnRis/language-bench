# N-body simulation, after the Computer Language Benchmarks Game.
import std/[math, strutils]

const solarMass = 4.0 * PI * PI

type
  Body = object
    x, y, z, vx, vy, vz, mass: float64
  Instance* = array[5, Body]
  Result* = tuple[e0, e1: float64]

var steps = 1000000

proc setup*(args: seq[string]) =
  if args.len > 0: steps = parseInt(args[0])

proc decode*(data: string): Instance =
  copyMem(addr result[0], unsafeAddr data[0], sizeof(Instance))

proc energy(bodies: Instance): float64 =
  for i in 0 ..< 5:
    result += 0.5 * bodies[i].mass * (bodies[i].vx * bodies[i].vx + bodies[i].vy * bodies[i].vy + bodies[i].vz * bodies[i].vz)
    for j in i + 1 ..< 5:
      let dx = bodies[i].x - bodies[j].x
      let dy = bodies[i].y - bodies[j].y
      let dz = bodies[i].z - bodies[j].z
      result -= bodies[i].mass * bodies[j].mass / sqrt(dx * dx + dy * dy + dz * dz)

proc advance(bodies: var Instance, dt: float64) =
  for i in 0 ..< 5:
    for j in i + 1 ..< 5:
      let dx = bodies[i].x - bodies[j].x
      let dy = bodies[i].y - bodies[j].y
      let dz = bodies[i].z - bodies[j].z
      let d2 = dx * dx + dy * dy + dz * dz
      let mag = dt / (d2 * sqrt(d2))
      let bm = bodies[i].mass * mag
      let cm = bodies[j].mass * mag
      bodies[i].vx -= dx * cm; bodies[i].vy -= dy * cm; bodies[i].vz -= dz * cm
      bodies[j].vx += dx * bm; bodies[j].vy += dy * bm; bodies[j].vz += dz * bm
  for i in 0 ..< 5:
    bodies[i].x += dt * bodies[i].vx
    bodies[i].y += dt * bodies[i].vy
    bodies[i].z += dt * bodies[i].vz

proc solve*(bodies: var Instance): Result =
  var px, py, pz = 0.0
  for b in bodies:
    px += b.vx * b.mass
    py += b.vy * b.mass
    pz += b.vz * b.mass
  bodies[0].vx = -px / solarMass
  bodies[0].vy = -py / solarMass
  bodies[0].vz = -pz / solarMass
  let e0 = energy(bodies)
  for _ in 1 .. steps:
    advance(bodies, 0.01)
  (e0, energy(bodies))

proc emit*(r: Result, sink: proc (w: int)) =
  sink(int(floor(r.e0 * 1e9 + 0.5)))
  sink(int(floor(r.e1 * 1e9 + 0.5)))
