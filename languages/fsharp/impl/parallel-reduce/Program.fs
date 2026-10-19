module Problem

open System.Threading

let mutable nArg = 2000000L
let mutable workersArg = 4

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

let setup (args: string[]) =
    if args.Length > 1 then
        nArg <- int64 args.[0]
        workersArg <- int args.[1]

let decode (data: byte[]) : obj = null

let solve (inst: obj) : obj =
    let n = nArg
    let workers = workersArg
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
    box [| Array.sum counts |]

let emit (res: obj) (sink: int64 -> unit) = sink (unbox<int64[]> res).[0]

let release (inst: obj) (res: obj) = ()
