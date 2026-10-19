import std/[strutils, unicode]

type
  Instance* = string
  Result* = array[5, int]

proc setup*(args: seq[string]) = discard
proc decode*(data: string): Instance = data

proc solve*(text: var Instance): Result =
  let encoded = text.replace(' ', '_')
  var checksum = 0
  for c in encoded: checksum += int(c)
  [text.len, text.runeLen, text.count(' ') + 1, text.count("er"), checksum]

proc emit*(r: Result, sink: proc (w: int)) =
  for w in r: sink(w)
