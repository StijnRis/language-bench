-- N-body simulation, after the Computer Language Benchmarks Game.
local P = {}
local sqrt = math.sqrt
local steps = 1000000
function P.setup(args) if #args > 0 then steps = math.tointeger(tonumber(args[1])) end end
function P.decode(data)
  local bodies, pos = {}, 1
  for i = 1, 5 do
    local x, y, z, vx, vy, vz, mass
    x, y, z, vx, vy, vz, mass, pos = string.unpack("<ddddddd", data, pos)
    bodies[i] = { x = x, y = y, z = z, vx = vx, vy = vy, vz = vz, mass = mass }
  end
  return bodies
end
local function energy(bodies)
  local e = 0.0
  for i = 1, 5 do
    local b = bodies[i]
    e = e + 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy + b.vz * b.vz)
    for j = i + 1, 5 do
      local c = bodies[j]
      local dx, dy, dz = b.x - c.x, b.y - c.y, b.z - c.z
      e = e - b.mass * c.mass / sqrt(dx * dx + dy * dy + dz * dz)
    end
  end
  return e
end
function P.solve(bodies)
  local solar = 4 * math.pi * math.pi
  local px, py, pz = 0.0, 0.0, 0.0
  for i = 1, 5 do
    local b = bodies[i]
    px = px + b.vx * b.mass; py = py + b.vy * b.mass; pz = pz + b.vz * b.mass
  end
  bodies[1].vx = -px / solar
  bodies[1].vy = -py / solar
  bodies[1].vz = -pz / solar
  local e0 = energy(bodies)
  local dt = 0.01
  for _ = 1, steps do
    for i = 1, 5 do
      local b = bodies[i]
      for j = i + 1, 5 do
        local c = bodies[j]
        local dx, dy, dz = b.x - c.x, b.y - c.y, b.z - c.z
        local d2 = dx * dx + dy * dy + dz * dz
        local mag = dt / (d2 * sqrt(d2))
        local bm, cm = b.mass * mag, c.mass * mag
        b.vx = b.vx - dx * cm; b.vy = b.vy - dy * cm; b.vz = b.vz - dz * cm
        c.vx = c.vx + dx * bm; c.vy = c.vy + dy * bm; c.vz = c.vz + dz * bm
      end
    end
    for i = 1, 5 do
      local b = bodies[i]
      b.x = b.x + dt * b.vx
      b.y = b.y + dt * b.vy
      b.z = b.z + dt * b.vz
    end
  end
  return { e0, energy(bodies) }
end
function P.emit(r) return { math.floor(r[1] * 1e9 + 0.5), math.floor(r[2] * 1e9 + 0.5) } end
return P
