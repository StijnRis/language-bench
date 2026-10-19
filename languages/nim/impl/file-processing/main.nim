import std/[strutils, tables]

type
  Instance* = string # path of the CSV file
  Result* = seq[int]

proc setup*(args: seq[string]) = discard
proc decode*(data: string): Instance = data

proc solve*(path: var Instance): Result =
  var nlines = 0
  var total = 0
  var freq = initTable[string, int]()
  for line in lines(path):
    let c1 = line.find(',')
    let c2 = line.find(',', c1 + 1)
    let word = line[c1 + 1 ..< c2]
    total += parseInt(line[c2 + 1 .. ^1])
    inc freq.mgetOrPut(word, 0)
    inc nlines
  var top = ""
  var topCount = -1
  for w, c in freq:
    if c > topCount or (c == topCount and w < top):
      top = w
      topCount = c
  result = @[nlines, total, freq.len, topCount, top.len]
  for ch in top: result.add int(ch)

proc emit*(r: Result, sink: proc (w: int)) =
  for w in r: sink(w)
