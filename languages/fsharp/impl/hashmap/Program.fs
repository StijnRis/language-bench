module Program

open System.Collections.Generic

[<EntryPoint>]
let main argv =
    let n = uint64 argv.[0]
    let mutable x = 1UL
    let m = Dictionary<uint32, uint32>()
    for _ in 0UL .. n - 1UL do
        x <- x * 48271UL % 2147483647UL
        let k = uint32 (x % (n / 2UL))
        let mutable c = 0u
        m.TryGetValue(k, &c) |> ignore
        m.[k] <- c + 1u
    let mutable checksum = 0UL
    for kv in m do
        checksum <- checksum + uint64 kv.Key * uint64 kv.Value
    let mutable hits = 0UL
    for _ in 0UL .. n - 1UL do
        x <- x * 48271UL % 2147483647UL
        let mutable c = 0u
        if m.TryGetValue(uint32 (x % n), &c) then hits <- hits + uint64 c
    printfn "distinct=%d" m.Count
    printfn "checksum=%d" checksum
    printfn "hits=%d" hits
    0
