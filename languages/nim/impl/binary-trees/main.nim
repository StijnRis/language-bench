# Binary trees, after the Computer Language Benchmarks Game.
import std/strutils

type
  Node = ref object
    left, right: Node
  Instance* = int
  Result* = seq[int]

var depth = 14

proc setup*(args: seq[string]) =
  if args.len > 0: depth = parseInt(args[0])

proc decode*(data: string): Instance = 0

proc makeTree(d: int): Node =
  if d == 0:
    Node()
  else:
    Node(left: makeTree(d - 1), right: makeTree(d - 1))

proc check(t: Node): int =
  if t.left == nil: 1 else: 1 + check(t.left) + check(t.right)

proc solve*(inst: var Instance): Result =
  let minDepth = 4
  let maxDepth = max(minDepth + 2, depth)
  let stretch = maxDepth + 1
  result.add check(makeTree(stretch))
  let longLived = makeTree(maxDepth)
  var d = minDepth
  while d <= maxDepth:
    let iterations = 1 shl (maxDepth - d + minDepth)
    var sum = 0
    for _ in 1 .. iterations:
      sum += check(makeTree(d))
    result.add iterations
    result.add sum
    d += 2
  result.add check(longLived)

proc emit*(r: Result, sink: proc (w: int)) =
  for w in r: sink(w)
