module Problem

open System.Text.Json

let setup (args: string[]) = ()

let decode (data: byte[]) : obj = box data // the bytes are parsed inside solve

let solve (inst: obj) : obj =
    // objects, int sum, string length, trues, nulls
    let c = Array.zeroCreate<int64> 5
    let rec walk (v: JsonElement) =
        match v.ValueKind with
        | JsonValueKind.Object ->
            c.[0] <- c.[0] + 1L
            for p in v.EnumerateObject() do
                walk p.Value
        | JsonValueKind.Array ->
            for e in v.EnumerateArray() do
                walk e
        | JsonValueKind.Number -> c.[1] <- c.[1] + v.GetInt64()
        | JsonValueKind.String -> c.[2] <- c.[2] + int64 (v.GetString().Length)
        | JsonValueKind.True -> c.[3] <- c.[3] + 1L
        | JsonValueKind.Null -> c.[4] <- c.[4] + 1L
        | _ -> ()
    use doc = JsonDocument.Parse(unbox<byte[]> inst)
    walk doc.RootElement
    box c

let emit (res: obj) (sink: int64 -> unit) =
    for v in unbox<int64[]> res do
        sink v

let release (inst: obj) (res: obj) = ()
