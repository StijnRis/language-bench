// N-body simulation, after the Computer Language Benchmarks Game.
module Problem

open System

let mutable steps = 1000000L

type Body =
    { mutable X: float; mutable Y: float; mutable Z: float
      mutable Vx: float; mutable Vy: float; mutable Vz: float
      Mass: float }

let setup (args: string[]) =
    if args.Length > 0 then steps <- int64 args.[0]

let decode (data: byte[]) : obj =
    let f (i: int) = BitConverter.ToDouble(data, i * 8)
    box [| for i in 0 .. 4 -> { X = f (i * 7); Y = f (i * 7 + 1); Z = f (i * 7 + 2); Vx = f (i * 7 + 3); Vy = f (i * 7 + 4); Vz = f (i * 7 + 5); Mass = f (i * 7 + 6) } |]

let energy (bodies: Body[]) =
    let mutable e = 0.0
    for i in 0 .. 4 do
        let b = bodies.[i]
        e <- e + 0.5 * b.Mass * (b.Vx * b.Vx + b.Vy * b.Vy + b.Vz * b.Vz)
        for j in i + 1 .. 4 do
            let c = bodies.[j]
            let dx = b.X - c.X
            let dy = b.Y - c.Y
            let dz = b.Z - c.Z
            e <- e - b.Mass * c.Mass / Math.Sqrt(dx * dx + dy * dy + dz * dz)
    e

let solve (inst: obj) : obj =
    let bodies = unbox<Body[]> inst
    let solar = 4.0 * Math.PI * Math.PI
    let mutable px = 0.0
    let mutable py = 0.0
    let mutable pz = 0.0
    for b in bodies do
        px <- px + b.Vx * b.Mass
        py <- py + b.Vy * b.Mass
        pz <- pz + b.Vz * b.Mass
    bodies.[0].Vx <- -px / solar
    bodies.[0].Vy <- -py / solar
    bodies.[0].Vz <- -pz / solar
    let e0 = energy bodies
    let dt = 0.01
    let mutable s = 0L
    while s < steps do
        for i in 0 .. 4 do
            let b = bodies.[i]
            for j in i + 1 .. 4 do
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
        s <- s + 1L
    box [| e0; energy bodies |]

let emit (res: obj) (sink: int64 -> unit) =
    for e in unbox<float[]> res do
        sink (int64 (Math.Floor(e * 1e9 + 0.5)))

let release (inst: obj) (res: obj) = ()
