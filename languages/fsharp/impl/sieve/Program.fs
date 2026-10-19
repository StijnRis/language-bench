module Problem

let mutable nArg = 10000000

let setup (args: string[]) =
    if args.Length > 0 then nArg <- int args.[0]

let decode (data: byte[]) : obj = null

let solve (inst: obj) : obj =
    let n = nArg
    let composite = Array.zeroCreate<bool> (n + 1)
    let mutable p = 2
    while p * p <= n do
        if not composite.[p] then
            let mutable m = p * p
            while m <= n do
                composite.[m] <- true
                m <- m + p
        p <- p + 1
    let mutable count = 0L
    let mutable last = 0L
    let mutable sum = 0L
    for i in 2 .. n do
        if not composite.[i] then
            count <- count + 1L
            last <- int64 i
            sum <- sum + int64 i
    box [| count; last; sum |]

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<int64[]> res do
        sink v

let release (inst: obj) (res: obj) = ()
