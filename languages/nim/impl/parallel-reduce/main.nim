import std/[os, strutils]

type Job = tuple[n, workers, t: int, res: ptr int]

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

let n = parseInt(paramStr(1))
let workers = parseInt(paramStr(2))
var results = newSeq[int](workers)
var threads = newSeq[Thread[Job]](workers)
for t in 0 ..< workers:
  createThread(threads[t], worker, (n, workers, t, addr results[t]))
joinThreads(threads)

var total = 0
for c in results: total += c
echo "primes=", total
