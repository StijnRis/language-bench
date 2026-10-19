import std/[algorithm, os, strutils]

let n = parseInt(paramStr(1))
var x = 1
var a = newSeq[int32](n)
for i in 0 ..< n:
  x = x * 48271 mod 2147483647
  a[i] = int32(x)

a.sort()

var checksum = 0
for i in 0 ..< n:
  checksum = (checksum + i * int(a[i])) mod 1000000007

echo "first=", a[0]
echo "last=", a[n - 1]
echo "median=", a[n div 2]
echo "checksum=", checksum
