// Binary trees, after the Computer Language Benchmarks Game.
final class Node(val left: Node, val right: Node)

object Main {
  def make(d: Int): Node = if (d == 0) new Node(null, null) else new Node(make(d - 1), make(d - 1))

  def check(t: Node): Long = if (t.left == null) 1L else 1L + check(t.left) + check(t.right)

  def main(args: Array[String]): Unit = {
    val n = args(0).toInt
    val minDepth = 4
    val maxDepth = math.max(minDepth + 2, n)
    val stretch = maxDepth + 1

    println(s"stretch tree of depth $stretch\t check: ${check(make(stretch))}")
    val longLived = make(maxDepth)

    var depth = minDepth
    while (depth <= maxDepth) {
      val iterations = 1L << (maxDepth - depth + minDepth)
      var sum = 0L
      var i = 0L
      while (i < iterations) {
        sum += check(make(depth))
        i += 1
      }
      println(s"$iterations\t trees of depth $depth\t check: $sum")
      depth += 2
    }

    println(s"long lived tree of depth $maxDepth\t check: ${check(longLived)}")
  }
}
