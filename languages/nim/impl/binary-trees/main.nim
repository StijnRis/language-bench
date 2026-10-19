# Binary trees, after the Computer Language Benchmarks Game.
import std/[os, strutils]

type Node = ref object
  left, right: Node

proc makeTree(d: int): Node =
  if d == 0:
    Node()
  else:
    Node(left: makeTree(d - 1), right: makeTree(d - 1))

proc check(t: Node): int =
  if t.left == nil: 1 else: 1 + check(t.left) + check(t.right)

let n = parseInt(paramStr(1))
let minDepth = 4
let maxDepth = max(minDepth + 2, n)
let stretch = maxDepth + 1

echo "stretch tree of depth ", stretch, "\t check: ", check(makeTree(stretch))
let longLived = makeTree(maxDepth)

var depth = minDepth
while depth <= maxDepth:
  let iterations = 1 shl (maxDepth - depth + minDepth)
  var sum = 0
  for _ in 1 .. iterations:
    sum += check(makeTree(depth))
  echo iterations, "\t trees of depth ", depth, "\t check: ", sum
  depth += 2

echo "long lived tree of depth ", maxDepth, "\t check: ", check(longLived)
