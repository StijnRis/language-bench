// Binary trees, after the Computer Language Benchmarks Game.
class Node {
  final Node? left;
  final Node? right;
  Node(this.left, this.right);
}

Node make(int d) => d == 0 ? Node(null, null) : Node(make(d - 1), make(d - 1));

int check(Node t) => t.left == null ? 1 : 1 + check(t.left!) + check(t.right!);

void main(List<String> args) {
  final n = int.parse(args[0]);
  const minDepth = 4;
  final maxDepth = n > minDepth + 2 ? n : minDepth + 2;
  final stretch = maxDepth + 1;

  print('stretch tree of depth $stretch\t check: ${check(make(stretch))}');
  final longLived = make(maxDepth);

  for (var depth = minDepth; depth <= maxDepth; depth += 2) {
    final iterations = 1 << (maxDepth - depth + minDepth);
    var sum = 0;
    for (var i = 0; i < iterations; i++) {
      sum += check(make(depth));
    }
    print('$iterations\t trees of depth $depth\t check: $sum');
  }

  print('long lived tree of depth $maxDepth\t check: ${check(longLived)}');
}
