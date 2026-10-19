import std/strutils

type
  Instance* = int
  Result* = array[3, int]

var n = 10000000

proc setup*(args: seq[string]) =
  if args.len > 0: n = parseInt(args[0])

proc decode*(data: string): Instance = 0

proc solve*(inst: var Instance): Result =
  var composite = newSeq[bool](n + 1)
  var p = 2
  while p * p <= n:
    if not composite[p]:
      var m = p * p
      while m <= n:
        composite[m] = true
        m += p
    inc p
  var count = 0
  var last = 0
  var total = 0
  for i in 2 .. n:
    if not composite[i]:
      inc count
      last = i
      total += i
  [count, last, total]

proc emit*(r: Result, sink: proc (w: int)) =
  for w in r: sink(w)
