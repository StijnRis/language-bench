// N-body simulation, after the Computer Language Benchmarks Game.
module Program

open System

let solarMass = 4.0 * Math.PI * Math.PI
let days = 365.24

type Body =
    { mutable X: float; mutable Y: float; mutable Z: float
      mutable Vx: float; mutable Vy: float; mutable Vz: float
      Mass: float }

let body x y z vx vy vz m = { X = x; Y = y; Z = z; Vx = vx; Vy = vy; Vz = vz; Mass = m }

let bodies =
    [| body 0.0 0.0 0.0 0.0 0.0 0.0 solarMass
       body 4.84143144246472090e+00 -1.16032004402742839e+00 -1.03622044471123109e-01
            (1.66007664274403694e-03 * days) (7.69901118419740425e-03 * days) (-6.90460016972063023e-05 * days)
            (9.54791938424326609e-04 * solarMass)
       body 8.34336671824457987e+00 4.12479856412430479e+00 -4.03523417114321381e-01
            (-2.76742510726862411e-03 * days) (4.99852801234917238e-03 * days) (2.30417297573763929e-05 * days)
            (2.85885980666130812e-04 * solarMass)
       body 1.28943695621391310e+01 -1.51111514016986312e+01 -2.23307578892655734e-01
            (2.96460137564761618e-03 * days) (2.37847173959480950e-03 * days) (-2.96589568540237556e-05 * days)
            (4.36624404335156298e-05 * solarMass)
       body 1.53796971148509165e+01 -2.59193146099879641e+01 1.79258772950371181e-01
            (2.68067772490389322e-03 * days) (1.62824170038242295e-03 * days) (-9.51592254519715870e-05 * days)
            (5.15138902046611451e-05 * solarMass) |]

let energy () =
    let mutable e = 0.0
    for i in 0 .. bodies.Length - 1 do
        let b = bodies.[i]
        e <- e + 0.5 * b.Mass * (b.Vx * b.Vx + b.Vy * b.Vy + b.Vz * b.Vz)
        for j in i + 1 .. bodies.Length - 1 do
            let c = bodies.[j]
            let dx = b.X - c.X
            let dy = b.Y - c.Y
            let dz = b.Z - c.Z
            e <- e - b.Mass * c.Mass / Math.Sqrt(dx * dx + dy * dy + dz * dz)
    e

let advance (dt: float) =
    for i in 0 .. bodies.Length - 1 do
        let b = bodies.[i]
        for j in i + 1 .. bodies.Length - 1 do
            let c = bodies.[j]
            let dx = b.X - c.X
            let dy = b.Y - c.Y
            let dz = b.Z - c.Z
            let d2 = dx * dx + dy * dy + dz * dz
            let mag = dt / (d2 * Math.Sqrt d2)
            let bm = b.Mass * mag
            let cm = c.Mass * mag
            b.Vx <- b.Vx - dx * cm
            b.Vy <- b.Vy - dy * cm
            b.Vz <- b.Vz - dz * cm
            c.Vx <- c.Vx + dx * bm
            c.Vy <- c.Vy + dy * bm
            c.Vz <- c.Vz + dz * bm
    for b in bodies do
        b.X <- b.X + dt * b.Vx
        b.Y <- b.Y + dt * b.Vy
        b.Z <- b.Z + dt * b.Vz

[<EntryPoint>]
let main argv =
    let n = int argv.[0]
    let mutable px = 0.0
    let mutable py = 0.0
    let mutable pz = 0.0
    for b in bodies do
        px <- px + b.Vx * b.Mass
        py <- py + b.Vy * b.Mass
        pz <- pz + b.Vz * b.Mass
    bodies.[0].Vx <- -px / solarMass
    bodies.[0].Vy <- -py / solarMass
    bodies.[0].Vz <- -pz / solarMass
    printfn "%s" ((energy ()).ToString("F9", Globalization.CultureInfo.InvariantCulture))
    for _ in 1 .. n do
        advance 0.01
    printfn "%s" ((energy ()).ToString("F9", Globalization.CultureInfo.InvariantCulture))
    0
