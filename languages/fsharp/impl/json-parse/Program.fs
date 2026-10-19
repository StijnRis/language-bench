module Program

open System.IO
open System.Text.Json

[<EntryPoint>]
let main argv =
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
    let data = File.ReadAllBytes(argv.[0])
    use doc = JsonDocument.Parse(data)
    walk doc.RootElement
    printfn "objects=%d" c.[0]
    printfn "int_sum=%d" c.[1]
    printfn "string_length=%d" c.[2]
    printfn "true=%d" c.[3]
    printfn "null=%d" c.[4]
    0
