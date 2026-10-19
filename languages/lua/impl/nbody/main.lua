-- N-body simulation, after the Computer Language Benchmarks Game.
local sqrt = math.sqrt
local PI = 3.141592653589793
local SOLAR_MASS = 4 * PI * PI
local DAYS = 365.24

local bodies = {
  { x = 0, y = 0, z = 0, vx = 0, vy = 0, vz = 0, mass = SOLAR_MASS },
  { x = 4.84143144246472090e+00, y = -1.16032004402742839e+00, z = -1.03622044471123109e-01,
    vx = 1.66007664274403694e-03 * DAYS, vy = 7.69901118419740425e-03 * DAYS, vz = -6.90460016972063023e-05 * DAYS,
    mass = 9.54791938424326609e-04 * SOLAR_MASS },
  { x = 8.34336671824457987e+00, y = 4.12479856412430479e+00, z = -4.03523417114321381e-01,
    vx = -2.76742510726862411e-03 * DAYS, vy = 4.99852801234917238e-03 * DAYS, vz = 2.30417297573763929e-05 * DAYS,
    mass = 2.85885980666130812e-04 * SOLAR_MASS },
  { x = 1.28943695621391310e+01, y = -1.51111514016986312e+01, z = -2.23307578892655734e-01,
    vx = 2.96460137564761618e-03 * DAYS, vy = 2.37847173959480950e-03 * DAYS, vz = -2.96589568540237556e-05 * DAYS,
    mass = 4.36624404335156298e-05 * SOLAR_MASS },
  { x = 1.53796971148509165e+01, y = -2.59193146099879641e+01, z = 1.79258772950371181e-01,
    vx = 2.68067772490389322e-03 * DAYS, vy = 1.62824170038242295e-03 * DAYS, vz = -9.51592254519715870e-05 * DAYS,
    mass = 5.15138902046611451e-05 * SOLAR_MASS },
}
local nb = #bodies

local function energy()
  local e = 0.0
  for i = 1, nb do
    local b = bodies[i]
    e = e + 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy + b.vz * b.vz)
    for j = i + 1, nb do
      local c = bodies[j]
      local dx, dy, dz = b.x - c.x, b.y - c.y, b.z - c.z
      e = e - b.mass * c.mass / sqrt(dx * dx + dy * dy + dz * dz)
    end
  end
  return e
end

local function advance(dt)
  for i = 1, nb do
    local b = bodies[i]
    for j = i + 1, nb do
      local c = bodies[j]
      local dx, dy, dz = b.x - c.x, b.y - c.y, b.z - c.z
      local d2 = dx * dx + dy * dy + dz * dz
      local mag = dt / (d2 * sqrt(d2))
      local bm, cm = b.mass * mag, c.mass * mag
      b.vx = b.vx - dx * cm; b.vy = b.vy - dy * cm; b.vz = b.vz - dz * cm
      c.vx = c.vx + dx * bm; c.vy = c.vy + dy * bm; c.vz = c.vz + dz * bm
    end
  end
  for i = 1, nb do
    local b = bodies[i]
    b.x = b.x + dt * b.vx
    b.y = b.y + dt * b.vy
    b.z = b.z + dt * b.vz
  end
end

local px, py, pz = 0.0, 0.0, 0.0
for i = 1, nb do
  local b = bodies[i]
  px = px + b.vx * b.mass; py = py + b.vy * b.mass; pz = pz + b.vz * b.mass
end
bodies[1].vx = -px / SOLAR_MASS
bodies[1].vy = -py / SOLAR_MASS
bodies[1].vz = -pz / SOLAR_MASS

print(string.format("%.9f", energy()))
for _ = 1, tonumber(arg[1]) do advance(0.01) end
print(string.format("%.9f", energy()))
