// Binary trees, after the Computer Language Benchmarks Game.
let depthArg = 14;
export const setup = (args) => {
  if (args.length) depthArg = parseInt(args[0], 10);
};

class TreeNode {
  constructor(left, right) {
    this.left = left;
    this.right = right;
  }
}
const makeTree = (d) => (d === 0 ? new TreeNode(null, null) : new TreeNode(makeTree(d - 1), makeTree(d - 1)));
const check = (t) => (t.left === null ? 1 : 1 + check(t.left) + check(t.right));

export const decode = () => null;
export const solve = () => {
  const minDepth = 4;
  const maxDepth = Math.max(minDepth + 2, depthArg);
  const out = [check(makeTree(maxDepth + 1))];
  const longLived = makeTree(maxDepth);
  for (let depth = minDepth; depth <= maxDepth; depth += 2) {
    const iterations = 1 << (maxDepth - depth + minDepth);
    let sum = 0;
    for (let i = 0; i < iterations; i++) sum += check(makeTree(depth));
    out.push(iterations, sum);
  }
  out.push(check(longLived));
  return out;
};
export const emit = (r) => r;
