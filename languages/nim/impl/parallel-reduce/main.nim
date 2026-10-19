import std/strutils

type
  Job = tuple[n, workers, t: int, res: ptr int]
  Instance* = int
  Result* = int

var n = 2000000
var workers = 4

proc setup*(args: seq[string]) =
  if args.len > 1:
    n = parseInt(args[0])
    workers = parseInt(args[1])

proc decode*(data: string): Instance = 0

proc isPrime(n: int): bool =
  if n < 2: return false
  if n < 4: return true
  if n mod 2 == 0: return false
  var d = 3
  while d * d <= n:
    if n mod d == 0: return false
    d += 2
  true

proc worker(job: Job) {.thread.} =
  var count = 0
  var i = job.t
  while i < job.n:
    if isPrime(i): inc count
    i += job.workers
  job.res[] = count

proc solve*(inst: var Instance): Result =
  var results = newSeq[int](workers)
  var threads = newSeq[Thread[Job]](workers)
  for t in 0 ..< workers:
    createThread(threads[t], worker, (n, workers, t, addr results[t]))
  joinThreads(threads)
  for c in results: result += c

proc emit*(r: Result, sink: proc (w: int)) = sink(r)
