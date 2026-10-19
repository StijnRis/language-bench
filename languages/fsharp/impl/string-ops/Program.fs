module Problem

open System
open System.Text

let setup (args: string[]) = ()

let decode (data: byte[]) : obj = box (Encoding.UTF8.GetString data)

let solve (inst: obj) : obj =
    let text = unbox<string> inst
    let bytes = Encoding.UTF8.GetByteCount text
    // code points: every UTF-16 unit except the low half of a surrogate pair
    let mutable codepoints = 0L
    let mutable spaces = 0L
    for ch in text do
        if not (Char.IsLowSurrogate ch) then codepoints <- codepoints + 1L
        if ch = ' ' then spaces <- spaces + 1L
    let mutable needle = 0L
    let mutable p = text.IndexOf("er", StringComparison.Ordinal)
    while p <> -1 do
        needle <- needle + 1L
        p <- text.IndexOf("er", p + 2, StringComparison.Ordinal)
    let mutable checksum = 0L
    for b in Encoding.UTF8.GetBytes(text.Replace(' ', '_')) do
        checksum <- checksum + int64 b
    box [| int64 bytes; codepoints; spaces + 1L; needle; checksum |]

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<int64[]> res do
        sink v

let release (inst: obj) (res: obj) = ()
