module Problem

open System
open System.Collections.Generic
open System.IO
open System.Text

let setup (args: string[]) = ()

let decode (data: byte[]) : obj = box (Encoding.UTF8.GetString data) // path of the file

let solve (inst: obj) : obj =
    let freq = Dictionary<string, int>()
    let mutable lines = 0L
    let mutable total = 0L
    use reader = new StreamReader(unbox<string> inst, Encoding.Latin1, false, 1 <<< 16)
    let mutable line = reader.ReadLine()
    while not (isNull line) do
        let c1 = line.IndexOf(',')
        let c2 = line.IndexOf(',', c1 + 1)
        let word = line.Substring(c1 + 1, c2 - c1 - 1)
        total <- total + Int64.Parse(line.Substring(c2 + 1))
        let mutable c = 0
        freq.TryGetValue(word, &c) |> ignore
        freq.[word] <- c + 1
        lines <- lines + 1L
        line <- reader.ReadLine()
    let mutable top: string = null
    let mutable topCount = -1
    for kv in freq do
        if kv.Value > topCount || (kv.Value = topCount && String.CompareOrdinal(kv.Key, top) < 0) then
            top <- kv.Key
            topCount <- kv.Value
    let out = List<int64>()
    out.AddRange [ lines; total; int64 freq.Count; int64 topCount; int64 top.Length ]
    for ch in top do
        out.Add(int64 ch)
    box out

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<List<int64>> res do
        sink v

let release (inst: obj) (res: obj) = ()
