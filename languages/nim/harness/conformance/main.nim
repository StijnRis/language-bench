# conformance problem: sum, maximum and a checksum of 4096 int32 values
type
  Instance* = seq[int32]
  Result* = seq[int]

proc setup*(args: seq[string]) = discard

proc decode*(data: string): Instance =
  result = newSeq[int32](data.len div 4)
  if result.len > 0: copyMem(addr result[0], unsafeAddr data[0], result.len * 4)

proc solve*(a: var Instance): Result =
  var s, m, sq = 0
  for v in a:
    s += int(v)
    m = max(m, int(v))
    sq = (sq + int(v) * int(v)) mod 1000003
  @[s, m, sq, a.len]

proc emit*(r: Result, sink: proc (w: int)) =
  for w in r: sink(w)
