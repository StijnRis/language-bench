# N-body simulation, after the Computer Language Benchmarks Game.
steps = 1000000
setup(args) = (isempty(args) || (global steps = parse(Int, args[1])); nothing)

mutable struct Body
    x::Float64
    y::Float64
    z::Float64
    vx::Float64
    vy::Float64
    vz::Float64
    mass::Float64
end

function decode(data::Vector{UInt8})
    v = reinterpret(Float64, data)
    return [Body(v[i * 7 + 1], v[i * 7 + 2], v[i * 7 + 3], v[i * 7 + 4], v[i * 7 + 5], v[i * 7 + 6], v[i * 7 + 7]) for i in 0:4]
end

function energy(b::Vector{Body})
    e = 0.0
    for i in 1:5
        e += 0.5 * b[i].mass * (b[i].vx^2 + b[i].vy^2 + b[i].vz^2)
        for j in (i + 1):5
            dx = b[i].x - b[j].x
            dy = b[i].y - b[j].y
            dz = b[i].z - b[j].z
            e -= b[i].mass * b[j].mass / sqrt(dx * dx + dy * dy + dz * dz)
        end
    end
    return e
end

function advance!(b::Vector{Body}, dt::Float64)
    @inbounds for i in 1:5
        for j in (i + 1):5
            dx = b[i].x - b[j].x
            dy = b[i].y - b[j].y
            dz = b[i].z - b[j].z
            d2 = dx * dx + dy * dy + dz * dz
            mag = dt / (d2 * sqrt(d2))
            bm = b[i].mass * mag
            cm = b[j].mass * mag
            b[i].vx -= dx * cm
            b[i].vy -= dy * cm
            b[i].vz -= dz * cm
            b[j].vx += dx * bm
            b[j].vy += dy * bm
            b[j].vz += dz * bm
        end
    end
    @inbounds for i in 1:5
        b[i].x += dt * b[i].vx
        b[i].y += dt * b[i].vy
        b[i].z += dt * b[i].vz
    end
end

function solve(b::Vector{Body})
    solar = 4 * pi * pi
    px = py = pz = 0.0
    for o in b
        px += o.vx * o.mass
        py += o.vy * o.mass
        pz += o.vz * o.mass
    end
    b[1].vx = -px / solar
    b[1].vy = -py / solar
    b[1].vz = -pz / solar
    e0 = energy(b)
    for _ in 1:steps
        advance!(b, 0.01)
    end
    return [e0, energy(b)]
end

emit(r) = [floor(Int, e * 1e9 + 0.5) for e in r]
