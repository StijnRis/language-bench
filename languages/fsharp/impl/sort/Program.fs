module Problem

open System

let setup (args: string[]) = ()

let decode (data: byte[]) : obj =
    let a = Array.zeroCreate<int> (data.Length / 4)
    Buffer.BlockCopy(data, 0, a, 0, data.Length)
    box a

let solve (inst: obj) : obj =
    let a = unbox<int[]> inst
    System.Array.Sort(a)
    box a

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<int[]> res do
        sink (int64 v)

let release (inst: obj) (res: obj) = ()
