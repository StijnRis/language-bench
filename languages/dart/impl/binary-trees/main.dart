// Binary trees, after the Computer Language Benchmarks Game.
import 'dart:typed_data';

var depthArg = 14;

void setup(List<String> args) {
  if (args.isNotEmpty) depthArg = int.parse(args[0]);
}

class Node {
  final Node? left, right;
  Node(this.left, this.right);
}

Node makeTree(int d) => d == 0 ? Node(null, null) : Node(makeTree(d - 1), makeTree(d - 1));

int check(Node t) => t.left == null ? 1 : 1 + check(t.left!) + check(t.right!);

Object? decode(Uint8List data) => null;

Object? solve(Object? inst) {
  const minDepth = 4;
  final maxDepth = depthArg > minDepth + 2 ? depthArg : minDepth + 2;
  final out = <int>[check(makeTree(maxDepth + 1))];
  final longLived = makeTree(maxDepth);
  for (var depth = minDepth; depth <= maxDepth; depth += 2) {
    final iterations = 1 << (maxDepth - depth + minDepth);
    var sum = 0;
    for (var i = 0; i < iterations; i++) {
      sum += check(makeTree(depth));
    }
    out.add(iterations);
    out.add(sum);
  }
  out.add(check(longLived));
  return out;
}

List<int> emit(Object? res) => res as List<int>;
