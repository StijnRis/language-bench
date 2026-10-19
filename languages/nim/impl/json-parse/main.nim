import std/[json, os]

let doc = parseFile(paramStr(1))

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

echo "objects=", objects
echo "int_sum=", intSum
echo "string_length=", strLen
echo "true=", trues
echo "null=", nulls
