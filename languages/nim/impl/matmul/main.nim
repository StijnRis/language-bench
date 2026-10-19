type
  Instance* = tuple[n: int, a, b: seq[float64]]
  Result* = tuple[n: int, c: seq[float64]]

proc setup*(args: seq[string]) = discard

proc decode*(data: string): Instance =
  var n32: int32
  copyMem(addr n32, unsafeAddr data[0], 4)
  let n = int(n32)
  result.n = n
  result.a = newSeq[float64](n * n)
  result.b = newSeq[float64](n * n)
  copyMem(addr result.a[0], unsafeAddr data[4], n * n * 8)
  copyMem(addr result.b[0], unsafeAddr data[4 + n * n * 8], n * n * 8)

proc solve*(inst: var Instance): Result =
  let n = inst.n
  var c = newSeq[float64](n * n)
  for i in 0 ..< n:
    for k in 0 ..< n:
      let aik = inst.a[i * n + k]
      for j in 0 ..< n:
        c[i * n + j] += aik * inst.b[k * n + j]
  (n, c)

proc emit*(r: Result, sink: proc (w: int)) =
  for v in r.c: sink(int(v + 0.5) - (if v + 0.5 < 0 and float(int(v + 0.5)) != v + 0.5: 1 else: 0))
