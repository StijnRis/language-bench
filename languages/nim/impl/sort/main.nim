import std/algorithm

type
  Instance* = seq[int32]
  Result* = seq[int32]

proc setup*(args: seq[string]) = discard

proc decode*(data: string): Instance =
  result = newSeq[int32](data.len div 4)
  if result.len > 0: copyMem(addr result[0], unsafeAddr data[0], result.len * 4)

proc solve*(a: var Instance): Result =
  a.sort()
  a

proc emit*(r: Result, sink: proc (w: int)) =
  for v in r: sink(int(v))
