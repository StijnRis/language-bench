// Binary trees, after the Computer Language Benchmarks Game.
package main

import "strconv"

type Node struct{ left, right *Node }

var depthArg = 14

func makeTree(d int) *Node {
	if d == 0 {
		return &Node{}
	}
	return &Node{makeTree(d - 1), makeTree(d - 1)}
}

func (n *Node) check() int64 {
	if n.left == nil {
		return 1
	}
	return 1 + n.left.check() + n.right.check()
}

func Setup(args []string) {
	if len(args) > 0 {
		depthArg, _ = strconv.Atoi(args[0])
	}
}

func Decode(data []byte) any { return nil }

func Solve(inst any) any {
	minDepth := 4
	maxDepth := max(minDepth+2, depthArg)
	stretch := maxDepth + 1
	out := []int64{makeTree(stretch).check()}
	longLived := makeTree(maxDepth)
	for depth := minDepth; depth <= maxDepth; depth += 2 {
		iterations := int64(1) << (maxDepth - depth + minDepth)
		var sum int64
		for i := int64(0); i < iterations; i++ {
			sum += makeTree(depth).check()
		}
		out = append(out, iterations, sum)
	}
	return append(out, longLived.check())
}

func Emit(res any, sink func(int64)) {
	for _, v := range res.([]int64) {
		sink(v)
	}
}
