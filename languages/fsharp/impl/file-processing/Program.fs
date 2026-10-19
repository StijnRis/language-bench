module Program

open System
open System.Collections.Generic
open System.IO
open System.Text

[<EntryPoint>]
let main argv =
    let freq = Dictionary<string, int>()
    let mutable lines = 0L
    let mutable total = 0L
    use reader = new StreamReader(argv.[0], Encoding.Latin1, false, 1 <<< 16)
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
    printfn "lines=%d" lines
    printfn "sum=%d" total
    printfn "distinct=%d" freq.Count
    printfn "top=%s %d" top topCount
    0
