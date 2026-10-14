# N-body simulation, after the Computer Language Benchmarks Game.
using Printf

mutable struct Body
    x::Float64
    y::Float64
    z::Float64
    vx::Float64
    vy::Float64
    vz::Float64
    mass::Float64
end

const SOLAR_MASS = 4 * pi * pi
const DAYS = 365.24

function make_bodies()
    return [
        Body(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, SOLAR_MASS),
        Body(
            4.84143144246472090e0, -1.16032004402742839e0, -1.03622044471123109e-1,
            1.66007664274403694e-3 * DAYS, 7.69901118419740425e-3 * DAYS, -6.90460016972063023e-5 * DAYS,
            9.54791938424326609e-4 * SOLAR_MASS,
        ),
        Body(
            8.34336671824457987e0, 4.12479856412430479e0, -4.03523417114321381e-1,
            -2.76742510726862411e-3 * DAYS, 4.99852801234917238e-3 * DAYS, 2.30417297573763929e-5 * DAYS,
            2.85885980666130812e-4 * SOLAR_MASS,
        ),
        Body(
            1.28943695621391310e1, -1.51111514016986312e1, -2.23307578892655734e-1,
            2.96460137564761618e-3 * DAYS, 2.37847173959480950e-3 * DAYS, -2.96589568540237556e-5 * DAYS,
            4.36624404335156298e-5 * SOLAR_MASS,
        ),
        Body(
            1.53796971148509165e1, -2.59193146099879641e1, 1.79258772950371181e-1,
            2.68067772490389322e-3 * DAYS, 1.62824170038242295e-3 * DAYS, -9.51592254519715870e-5 * DAYS,
            5.15138902046611451e-5 * SOLAR_MASS,
        ),
    ]
end

function offset_momentum!(bodies)
    px = 0.0
    py = 0.0
    pz = 0.0
    for b in bodies
        px += b.vx * b.mass
        py += b.vy * b.mass
        pz += b.vz * b.mass
    end
    bodies[1].vx = -px / SOLAR_MASS
    bodies[1].vy = -py / SOLAR_MASS
    bodies[1].vz = -pz / SOLAR_MASS
end

function advance!(bodies, dt)
    n = length(bodies)
    for i in 1:n
        bi = bodies[i]
        for j in (i + 1):n
            bj = bodies[j]
            dx = bi.x - bj.x
            dy = bi.y - bj.y
            dz = bi.z - bj.z
            d2 = dx * dx + dy * dy + dz * dz
            mag = dt / (d2 * sqrt(d2))
            bi.vx -= dx * bj.mass * mag
            bi.vy -= dy * bj.mass * mag
            bi.vz -= dz * bj.mass * mag
            bj.vx += dx * bi.mass * mag
            bj.vy += dy * bi.mass * mag
            bj.vz += dz * bi.mass * mag
        end
    end
    for b in bodies
        b.x += dt * b.vx
        b.y += dt * b.vy
        b.z += dt * b.vz
    end
end

function energy(bodies)
    e = 0.0
    n = length(bodies)
    for i in 1:n
        bi = bodies[i]
        e += 0.5 * bi.mass * (bi.vx * bi.vx + bi.vy * bi.vy + bi.vz * bi.vz)
        for j in (i + 1):n
            bj = bodies[j]
            dx = bi.x - bj.x
            dy = bi.y - bj.y
            dz = bi.z - bj.z
            e -= (bi.mass * bj.mass) / sqrt(dx * dx + dy * dy + dz * dz)
        end
    end
    return e
end

function main()
    n = parse(Int, ARGS[1])
    bodies = make_bodies()
    offset_momentum!(bodies)
    println(@sprintf("%.9f", energy(bodies)))
    for _ in 1:n
        advance!(bodies, 0.01)
    end
    println(@sprintf("%.9f", energy(bodies)))
end

main()
