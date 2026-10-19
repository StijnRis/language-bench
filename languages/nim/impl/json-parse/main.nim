import std/json

type
  Instance* = string
  Result* = array[5, int]

proc setup*(args: seq[string]) = discard
proc decode*(data: string): Instance = data

proc solve*(s: var Instance): Result =
  let doc = parseJson(s)
  var objects = 0
  var intSum = 0
  var strLen = 0
  var trues = 0
  var nulls = 0
  var stack = @[doc]
  while stack.len > 0:
    let v = stack.pop()
    case v.kind
    of JObject:
      inc objects
      for _, x in v: stack.add x
    of JArray:
      for x in v.elems: stack.add x
    of JString: strLen += v.str.len
    of JInt: intSum += int(v.num)
    of JBool:
      if v.bval: inc trues
    of JNull: inc nulls
    of JFloat: discard
  [objects, intSum, strLen, trues, nulls]

proc emit*(r: Result, sink: proc (w: int)) =
  for w in r: sink(w)
