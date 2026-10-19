import std/[os, strutils]

let n = parseInt(paramStr(1))
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
echo "count=", count
echo "last=", last
echo "sum=", total
