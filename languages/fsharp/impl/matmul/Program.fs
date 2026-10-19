module Problem

open System

let setup (args: string[]) = ()

let decode (data: byte[]) : obj =
    let n = BitConverter.ToInt32(data, 0)
    let a = Array.zeroCreate<float> (n * n)
    let b = Array.zeroCreate<float> (n * n)
    Buffer.BlockCopy(data, 4, a, 0, n * n * 8)
    Buffer.BlockCopy(data, 4 + n * n * 8, b, 0, n * n * 8)
    box (n, a, b)

let solve (inst: obj) : obj =
    let (n, a, b) = unbox<int * float[] * float[]> inst
    let c = Array.zeroCreate<float> (n * n)
    for i in 0 .. n - 1 do
        for k in 0 .. n - 1 do
            let aik = a.[i * n + k]
            for j in 0 .. n - 1 do
                c.[i * n + j] <- c.[i * n + j] + aik * b.[k * n + j]
    box c

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<float[]> res do
        sink (int64 (Math.Floor(v + 0.5)))

let release (inst: obj) (res: obj) = ()
