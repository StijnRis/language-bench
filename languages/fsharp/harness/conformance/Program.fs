// conformance problem: sum, maximum and a checksum of 4096 int32 values
module Problem

let setup (args: string[]) = ()

let decode (data: byte[]) : obj =
    let a = Array.zeroCreate<int> (data.Length / 4)
    System.Buffer.BlockCopy(data, 0, a, 0, data.Length)
    box a

let solve (inst: obj) : obj =
    let a = unbox<int[]> inst
    let mutable sum = 0L
    let mutable mx = 0L
    let mutable sq = 0L
    for x in a do
        let v = int64 x
        sum <- sum + v
        if v > mx then mx <- v
        sq <- (sq + v * v) % 1000003L
    box [| sum; mx; sq; int64 a.Length |]

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<int64[]> res do
        sink v

let release (inst: obj) (res: obj) = ()
