module Program

[<EntryPoint>]
let main argv =
    let n = int argv.[0]
    let a = Array.zeroCreate<float> (n * n)
    let b = Array.zeroCreate<float> (n * n)
    let c = Array.zeroCreate<float> (n * n)
    for i in 0 .. n - 1 do
        for j in 0 .. n - 1 do
            a.[i * n + j] <- float ((i * 31 + j * 17) % 10 + 1)
            b.[i * n + j] <- float ((i * 13 + j * 7) % 10 - 4)
    for i in 0 .. n - 1 do
        for k in 0 .. n - 1 do
            let aik = a.[i * n + k]
            for j in 0 .. n - 1 do
                c.[i * n + j] <- c.[i * n + j] + aik * b.[k * n + j]
    let mutable trace = 0.0
    let mutable sum = 0.0
    for i in 0 .. n - 1 do
        trace <- trace + c.[i * n + i]
    for v in c do
        sum <- sum + v
    printfn "trace=%d" (int64 trace)
    printfn "sum=%d" (int64 sum)
    printfn "c00=%d" (int64 c.[0])
    printfn "clast=%d" (int64 c.[n * n - 1])
    0
