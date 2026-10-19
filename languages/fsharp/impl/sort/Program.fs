module Program

[<EntryPoint>]
let main argv =
    let n = int argv.[0]
    let mutable x = 1L
    let a = Array.zeroCreate<int> n
    for i in 0 .. n - 1 do
        x <- x * 48271L % 2147483647L
        a.[i] <- int x
    System.Array.Sort(a)
    let mutable checksum = 0L
    for i in 0 .. n - 1 do
        checksum <- (checksum + int64 i * int64 a.[i]) % 1000000007L
    printfn "first=%d" a.[0]
    printfn "last=%d" a.[n - 1]
    printfn "median=%d" a.[n / 2]
    printfn "checksum=%d" checksum
    0
