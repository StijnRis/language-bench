import std/[os, strutils, tables]

let n = parseInt(paramStr(1))
var x = 1
template next(): int =
  x = x * 48271 mod 2147483647
  x

var m = initTable[int, int]()
let half = n div 2
for _ in 1 .. n:
  inc m.mgetOrPut(next() mod half, 0)

var checksum = 0
for k, c in m: checksum += k * c

var hits = 0
for _ in 1 .. n:
  hits += m.getOrDefault(next() mod n, 0)

echo "distinct=", m.len
echo "checksum=", checksum
echo "hits=", hits
