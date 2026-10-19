module Program

open System
open System.Text

let vocab =
    [| "the"; "quick"; "brown"; "fox"; "jumps"; "over"; "lazy"; "dog"; "naïve"; "café"
       "über"; "résumé"; "привет"; "мир"
       "код"; "日本語"; "世界"; "速度"; "hello"; "world" |]

[<EntryPoint>]
let main argv =
    let n = int argv.[0]
    let mutable x = 1L
    let sb = StringBuilder()
    for i in 0 .. n - 1 do
        x <- x * 48271L % 2147483647L
        if i > 0 then sb.Append(' ') |> ignore
        sb.Append(vocab.[int (x % int64 vocab.Length)]) |> ignore
    let text = sb.ToString()
    let bytes = Encoding.UTF8.GetByteCount text
    // code points: every UTF-16 unit except the low half of a surrogate pair
    let mutable codepoints = 0L
    for ch in text do
        if not (Char.IsLowSurrogate ch) then codepoints <- codepoints + 1L
    let words = text.Split(' ').Length
    let mutable needle = 0L
    let mutable p = text.IndexOf("er", StringComparison.Ordinal)
    while p <> -1 do
        needle <- needle + 1L
        p <- text.IndexOf("er", p + 2, StringComparison.Ordinal)
    let mutable checksum = 0L
    for b in Encoding.UTF8.GetBytes(text.Replace(' ', '_')) do
        checksum <- checksum + int64 b
    printfn "bytes=%d" bytes
    printfn "codepoints=%d" codepoints
    printfn "words=%d" words
    printfn "needle=%d" needle
    printfn "checksum=%d" checksum
    0
