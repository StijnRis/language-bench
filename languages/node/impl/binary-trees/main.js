// Binary trees, after the Computer Language Benchmarks Game.
"use strict";

class TreeNode {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
}

function makeTree(d) {
  return d === 0 ? new TreeNode(null, null) : new TreeNode(makeTree(d - 1), makeTree(d - 1));
}

function check(t) {
  return t.left === null ? 1 : 1 + check(t.left) + check(t.right);
}

const n = parseInt(process.argv[2], 10);
const minDepth = 4;
const maxDepth = Math.max(minDepth + 2, n);
const stretch = maxDepth + 1;

console.log(`stretch tree of depth ${stretch}\t check: ${check(makeTree(stretch))}`);
const longLived = makeTree(maxDepth);

for (let depth = minDepth; depth <= maxDepth; depth += 2) {
  const iterations = 1 << (maxDepth - depth + minDepth);
  let sum = 0;
  for (let i = 0; i < iterations; i++) sum += check(makeTree(depth));
  console.log(`${iterations}\t trees of depth ${depth}\t check: ${sum}`);
}

console.log(`long lived tree of depth ${maxDepth}\t check: ${check(longLived)}`);
