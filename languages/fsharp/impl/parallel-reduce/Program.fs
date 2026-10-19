module Program

open System.Threading

let isPrime (n: int64) =
    if n < 2L then false
    elif n < 4L then true
    elif n % 2L = 0L then false
    else
        let mutable d = 3L
        let mutable prime = true
        while prime && d * d <= n do
            if n % d = 0L then prime <- false
            d <- d + 2L
        prime

[<EntryPoint>]
let main argv =
    let n = int64 argv.[0]
    let workers = int argv.[1]
    let counts = Array.zeroCreate<int64> workers
    let threads =
        Array.init workers (fun id ->
            let t =
                Thread(fun () ->
                    let mutable c = 0L
                    let mutable i = int64 id
                    while i < n do
                        if isPrime i then c <- c + 1L
                        i <- i + int64 workers
                    counts.[id] <- c)
            t.Start()
            t)
    for t in threads do
        t.Join()
    printfn "primes=%d" (Array.sum counts)
    0
