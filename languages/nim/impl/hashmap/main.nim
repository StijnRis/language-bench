import std/tables

type
  Instance* = tuple[keys, lookups: seq[int32]]
  Result* = array[3, int]

proc setup*(args: seq[string]) = discard

proc decode*(data: string): Instance =
  let n = data.len div 8
  result.keys = newSeq[int32](n)
  result.lookups = newSeq[int32](n)
  if n > 0:
    copyMem(addr result.keys[0], unsafeAddr data[0], n * 4)
    copyMem(addr result.lookups[0], unsafeAddr data[n * 4], n * 4)

proc solve*(inst: var Instance): Result =
  var m = initTable[int32, int]()
  for k in inst.keys: inc m.mgetOrPut(k, 0)
  var checksum = 0
  for k, c in m: checksum += int(k) * c
  var hits = 0
  for k in inst.lookups: hits += m.getOrDefault(k, 0)
  [m.len, checksum, hits]

proc emit*(r: Result, sink: proc (w: int)) =
  for w in r: sink(w)
