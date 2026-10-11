// Binary trees, after the Computer Language Benchmarks Game.
package main

import (
	"fmt"
	"os"
	"strconv"
)

type Node struct{ left, right *Node }

func makeTree(d int) *Node {
	if d == 0 {
		return &Node{}
	}
	return &Node{makeTree(d - 1), makeTree(d - 1)}
}

func (n *Node) check() int {
	if n.left == nil {
		return 1
	}
	return 1 + n.left.check() + n.right.check()
}

func main() {
	n, _ := strconv.Atoi(os.Args[1])
	minDepth := 4
	maxDepth := max(minDepth+2, n)
	stretch := maxDepth + 1

	fmt.Printf("stretch tree of depth %d\t check: %d\n", stretch, makeTree(stretch).check())
	longLived := makeTree(maxDepth)

	for depth := minDepth; depth <= maxDepth; depth += 2 {
		iterations := 1 << (maxDepth - depth + minDepth)
		sum := 0
		for i := 0; i < iterations; i++ {
			sum += makeTree(depth).check()
		}
		fmt.Printf("%d\t trees of depth %d\t check: %d\n", iterations, depth, sum)
	}

	fmt.Printf("long lived tree of depth %d\t check: %d\n", maxDepth, longLived.check())
}
