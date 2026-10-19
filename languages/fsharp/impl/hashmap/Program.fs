module Problem

open System

open System.Collections.Generic

let setup (args: string[]) = ()

let decode (data: byte[]) : obj =
    let n = data.Length / 8
    let keys = Array.zeroCreate<uint32> n
    let lookups = Array.zeroCreate<uint32> n
    Buffer.BlockCopy(data, 0, keys, 0, n * 4)
    Buffer.BlockCopy(data, n * 4, lookups, 0, n * 4)
    box [| keys; lookups |]

let solve (inst: obj) : obj =
    let io = unbox<uint32[][]> inst
    let m = Dictionary<uint32, uint32>()
    for k in io.[0] do
        let mutable c = 0u
        m.TryGetValue(k, &c) |> ignore
        m.[k] <- c + 1u
    let mutable checksum = 0UL
    for kv in m do
        checksum <- checksum + uint64 kv.Key * uint64 kv.Value
    let mutable hits = 0UL
    for k in io.[1] do
        let mutable c = 0u
        if m.TryGetValue(k, &c) then hits <- hits + uint64 c
    box [| int64 m.Count; int64 checksum; int64 hits |]

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<int64[]> res do
        sink v

let release (inst: obj) (res: obj) = ()
