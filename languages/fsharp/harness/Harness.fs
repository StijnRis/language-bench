// language-bench harness for F#: see harness/CONTRACT.md. Compiled after Problem.fs (the problem's Program.fs),
// a module Problem with setup, decode, solve, emit and release; instance and result are opaque objects.
module Harness

open System
open System.Diagnostics
open System.IO
open System.Text

let num (k: string) (d: float) =
    let v = Environment.GetEnvironmentVariable k
    if String.IsNullOrEmpty v then d
    else
        match Double.TryParse(v, Globalization.NumberStyles.Float, Globalization.CultureInfo.InvariantCulture) with
        | true, r -> r
        | _ -> d

let env (k: string) (d: string) =
    let v = Environment.GetEnvironmentVariable k
    if String.IsNullOrEmpty v then d else v

let fail (msg: string) : unit =
    Console.Error.WriteLine("harness: " + msg)
    exit 1

let readFull (s: Stream) (buf: byte[]) =
    let mutable off = 0
    while off < buf.Length do
        let k = s.Read(buf, off, buf.Length - off)
        if k <= 0 then fail "input ended early"
        off <- off + k

let mono () = int64 (float (Stopwatch.GetTimestamp()) * (1e9 / float Stopwatch.Frequency))

[<EntryPoint>]
let main argv =
    let input = env "LB_INPUT" "none"
    let budget = num "LB_BUDGET_SECONDS" 10.0 * 1e9
    let minIters = int64 (num "LB_MIN_ITERS" 3.0)
    let maxIters = int64 (num "LB_MAX_ITERS" 0.0)
    let start = int64 (num "LB_START" 0.0)
    let gen = env "LB_GEN" "/usr/local/bin/lbgen"
    let file = env "LB_FILE" "/dev/shm/lb-input"
    let problem = env "LB_PROBLEM" ""
    let fileReady = not (isNull (Environment.GetEnvironmentVariable "LB_FILE_READY"))
    let P1 = 2147483647L
    let P2 = 2147483629L

    Problem.setup argv
    let stdin = Console.OpenStandardInput()
    let rows = Collections.Generic.List<int64[]>()
    let mutable kernel = 0.0
    let mono0 = mono ()
    let wall0 = (DateTime.UtcNow.Ticks - DateTime.UnixEpoch.Ticks) * 100L
    let mutable reason = "budget"
    let mutable fin = false

    while not fin do
        let data =
            if input = "stream" then
                let hdr = Array.zeroCreate<byte> 8
                readFull stdin hdr
                let d = Array.zeroCreate<byte> (int (BitConverter.ToUInt64(hdr, 0)))
                readFull stdin d
                d
            elif input = "file" then
                if not fileReady then
                    let psi = ProcessStartInfo(gen)
                    psi.UseShellExecute <- false
                    for a in [ "file"; problem; string (start + int64 rows.Count); file ] do
                        psi.ArgumentList.Add a
                    use p = Process.Start psi
                    p.WaitForExit()
                    if p.ExitCode <> 0 then fail "generator failed"
                Encoding.UTF8.GetBytes file
            else
                Array.empty<byte>
        let inst = Problem.decode data
        let t0 = mono ()
        let res = Problem.solve inst
        let t1 = mono ()
        let mutable h1 = 17L
        let mutable h2 = 19L
        let mutable n = 0L
        Problem.emit res (fun w ->
            let m1 = ((w % P1) + P1) % P1
            let m2 = ((w % P2) + P2) % P2
            h1 <- (h1 * 1000003L + m1) % P1
            h2 <- (h2 * 999983L + m2) % P2
            n <- n + 1L)
        h1 <- (h1 * 1000003L + n % P1) % P1
        h2 <- (h2 * 999983L + n % P2) % P2
        Problem.release inst res
        if input = "file" && not fileReady && File.Exists file then File.Delete file
        rows.Add [| t0; t1; h1; h2 |]
        kernel <- kernel + float (t1 - t0)
        if maxIters > 0L && int64 rows.Count >= maxIters then
            reason <- "iters"
            fin <- true
        elif kernel >= budget && int64 rows.Count >= minIters then
            fin <- true

    let sb = StringBuilder()
    sb.Append("LB 1 clock=Stopwatch.GetTimestamp\nSTART mono=").Append(mono0).Append(" wall=").Append(wall0).Append('\n') |> ignore
    for i in 0 .. rows.Count - 1 do
        sb.Append("ITER ").Append(i + 1).Append(" t0=").Append(rows.[i].[0]).Append(" t1=").Append(rows.[i].[1]).Append(" check=").Append(rows.[i].[2]).Append(':').Append(rows.[i].[3]).Append('\n') |> ignore
    sb.Append("DONE iters=").Append(rows.Count).Append(" kernel_ns=").Append(int64 kernel).Append(" reason=").Append(reason).Append('\n') |> ignore
    Console.Out.Write(sb.ToString())
    Console.Out.Flush()
    0
