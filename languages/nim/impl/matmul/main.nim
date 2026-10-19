import std/[os, strutils]

let n = parseInt(paramStr(1))
var a = newSeq[float64](n * n)
var b = newSeq[float64](n * n)
var c = newSeq[float64](n * n)
for i in 0 ..< n:
  for j in 0 ..< n:
    a[i * n + j] = float64((i * 31 + j * 17) mod 10 + 1)
    b[i * n + j] = float64((i * 13 + j * 7) mod 10 - 4)

for i in 0 ..< n:
  for k in 0 ..< n:
    let aik = a[i * n + k]
    for j in 0 ..< n:
      c[i * n + j] += aik * b[k * n + j]

var trace = 0.0
var total = 0.0
for i in 0 ..< n: trace += c[i * n + i]
for v in c: total += v
echo "trace=", int(trace)
echo "sum=", int(total)
echo "c00=", int(c[0])
echo "clast=", int(c[n * n - 1])
