# language-bench harness for Nim: see harness/CONTRACT.md. Built together with problem.nim (the problem's main.nim),
# which exports Instance, Result, setup(args), decode(data), solve(var Instance), emit(Result, sink).
import std/[monotimes, os, osproc, strutils, times]
import problem

const p1 = 2147483647
const p2 = 2147483629

proc envNum(k: string, d: float): float =
  let v = getEnv(k)
  if v.len == 0: d else: parseFloat(v)

proc envStr(k, d: string): string =
  let v = getEnv(k)
  if v.len == 0: d else: v

proc mono(): int64 = getMonoTime().ticks
proc wall(): int64 =
  let t = getTime()
  t.toUnix * 1_000_000_000'i64 + t.nanosecond

proc readFull(n: int): string =
  result = newString(n)
  if n > 0 and stdin.readBuffer(addr result[0], n) < n:
    stderr.writeLine "harness: input ended early"
    quit(1)

proc main() =
  let input = envStr("LB_INPUT", "none")
  let budget = envNum("LB_BUDGET_SECONDS", 10) * 1e9
  let minIters = int(envNum("LB_MIN_ITERS", 3))
  let maxIters = int(envNum("LB_MAX_ITERS", 0))
  let start = int(envNum("LB_START", 0))
  let gen = envStr("LB_GEN", "/usr/local/bin/lbgen")
  let file = envStr("LB_FILE", "/dev/shm/lb-input")
  let pname = envStr("LB_PROBLEM", "")
  let fileReady = existsEnv("LB_FILE_READY")

  setup(commandLineParams())
  var rows: seq[string]
  var iters = 0
  var kernel = 0.0
  var reason = "budget"
  let mono0 = mono()
  let wall0 = wall()
  var h1, h2, nwords: int
  proc mix(w: int) =
    let m1 = ((w mod p1) + p1) mod p1
    let m2 = ((w mod p2) + p2) mod p2
    h1 = (h1 * 1000003 + m1) mod p1
    h2 = (h2 * 999983 + m2) mod p2
  proc sink(w: int) =
    mix(w)
    inc nwords

  while true:
    var inst: Instance
    case input
    of "stream":
      let hdr = readFull(8)
      var len = 0'u64
      for i in countdown(7, 0): len = (len shl 8) or uint64(ord(hdr[i]))
      inst = decode(readFull(int(len)))
    of "file":
      if not fileReady:
        if execCmd(quoteShell(gen) & " file " & pname & " " & $(start + iters) & " " & quoteShell(file)) != 0:
          stderr.writeLine "harness: generator failed"
          quit(1)
      inst = decode(file)
    else:
      inst = decode("")
    let t0 = mono()
    let res = solve(inst)
    let t1 = mono()
    h1 = 17; h2 = 19; nwords = 0
    emit(res, sink)
    mix(nwords)
    if input == "file" and not fileReady:
      try: removeFile(file) except OSError: discard
    rows.add "ITER " & $(iters + 1) & " t0=" & $t0 & " t1=" & $t1 & " check=" & $h1 & ":" & $h2
    inc iters
    kernel += float(t1 - t0)
    if maxIters > 0 and iters >= maxIters:
      reason = "iters"
      break
    if kernel >= budget and iters >= minIters: break

  var o = "LB 1 clock=std/monotimes.getMonoTime\nSTART mono=" & $mono0 & " wall=" & $wall0 & "\n"
  for r in rows: o.add r & "\n"
  o.add "DONE iters=" & $iters & " kernel_ns=" & $int64(kernel) & " reason=" & reason & "\n"
  stdout.write o
  stdout.flushFile()

main()
