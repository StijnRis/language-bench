// Binary trees, after the Computer Language Benchmarks Game.
final class Node(val left: Node, val right: Node)

object Problem {
  var depthArg = 14

  def make(d: Int): Node = if (d == 0) new Node(null, null) else new Node(make(d - 1), make(d - 1))

  def check(t: Node): Long = if (t.left == null) 1L else 1L + check(t.left) + check(t.right)

  def setup(args: Array[String]): Unit = if (args.nonEmpty) depthArg = args(0).toInt

  def decode(data: Array[Byte]): Any = null

  def solve(inst: Any): Any = {
    val minDepth = 4
    val maxDepth = math.max(minDepth + 2, depthArg)
    val out = scala.collection.mutable.ArrayBuffer[Long](check(make(maxDepth + 1)))
    val longLived = make(maxDepth)
    var depth = minDepth
    while (depth <= maxDepth) {
      val iterations = 1L << (maxDepth - depth + minDepth)
      var sum = 0L
      var i = 0L
      while (i < iterations) { sum += check(make(depth)); i += 1 }
      out += iterations
      out += sum
      depth += 2
    }
    out += check(longLived)
    out
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[scala.collection.mutable.ArrayBuffer[Long]].foreach(v => sink(v))

  def release(inst: Any, res: Any): Unit = ()
}
