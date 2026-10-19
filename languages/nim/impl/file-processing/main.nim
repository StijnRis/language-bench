import std/[os, strutils, tables]

var lines = 0
var total = 0
var freq = initTable[string, int]()
for line in lines(paramStr(1)):
  let c1 = line.find(',')
  let c2 = line.find(',', c1 + 1)
  let word = line[c1 + 1 ..< c2]
  total += parseInt(line[c2 + 1 .. ^1])
  inc freq.mgetOrPut(word, 0)
  inc lines

var top = ""
var topCount = -1
for w, c in freq:
  if c > topCount or (c == topCount and w < top):
    top = w
    topCount = c

echo "lines=", lines
echo "sum=", total
echo "distinct=", freq.len
echo "top=", top, " ", topCount
