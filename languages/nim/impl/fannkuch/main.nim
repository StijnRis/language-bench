import std/[os, strutils]

let n = parseInt(paramStr(1))
var perm1 = newSeq[int](n)
var perm = newSeq[int](n)
var count = newSeq[int](n)
for i in 0 ..< n: perm1[i] = i
var maxflips = 0
var permcount = 0
var checksum = 0
var r = n
while true:
  while r != 1:
    count[r - 1] = r
    dec r
  for i in 0 ..< n: perm[i] = perm1[i]
  var flips = 0
  var k = perm[0]
  while k != 0:
    var i = 0
    var j = k
    while i < j:
      swap(perm[i], perm[j])
      inc i
      dec j
    inc flips
    k = perm[0]
  if flips > maxflips: maxflips = flips
  checksum += (if permcount mod 2 == 0: flips else: -flips)
  while true:
    if r == n:
      echo "checksum=", checksum
      echo "maxflips=", maxflips
      quit(0)
    let p0 = perm1[0]
    for i in 0 ..< r: perm1[i] = perm1[i + 1]
    perm1[r] = p0
    dec count[r]
    if count[r] > 0: break
    inc r
  inc permcount
