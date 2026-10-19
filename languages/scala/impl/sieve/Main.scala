object Problem {
  var nArg = 10000000

  def setup(args: Array[String]): Unit = if (args.nonEmpty) nArg = args(0).toInt

  def decode(data: Array[Byte]): Any = null

  def solve(inst: Any): Any = {
    val n = nArg
    val composite = new Array[Boolean](n + 1)
    var p = 2
    while (p.toLong * p <= n) {
      if (!composite(p)) {
        var m = p * p
        while (m <= n) { composite(m) = true; m += p }
      }
      p += 1
    }
    var count = 0L
    var last = 0L
    var sum = 0L
    var i = 2
    while (i <= n) {
      if (!composite(i)) { count += 1; last = i; sum += i }
      i += 1
    }
    Array(count, last, sum)
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[Array[Long]].foreach(v => sink(v))

  def release(inst: Any, res: Any): Unit = ()
}
