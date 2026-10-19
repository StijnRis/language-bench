module Program

[<EntryPoint>]
let main argv =
    let n = int argv.[0]
    let composite = Array.zeroCreate<bool> (n + 1)
    let mutable p = 2
    while p * p <= n do
        if not composite.[p] then
            let mutable m = p * p
            while m <= n do
                composite.[m] <- true
                m <- m + p
        p <- p + 1
    let mutable count = 0
    let mutable last = 0
    let mutable sum = 0L
    for i in 2 .. n do
        if not composite.[i] then
            count <- count + 1
            last <- i
            sum <- sum + int64 i
    printfn "count=%d" count
    printfn "last=%d" last
    printfn "sum=%d" sum
    0
