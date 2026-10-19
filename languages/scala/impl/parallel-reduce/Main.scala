object Problem {
  var nArg = 2000000L
  var workersArg = 4

  def isPrime(n: Long): Boolean = {
    if (n < 2) return false
    if (n < 4) return true
    if (n % 2 == 0) return false
    var d = 3L
    while (d * d <= n) {
      if (n % d == 0) return false
      d += 2
    }
    true
  }

  def setup(args: Array[String]): Unit = if (args.length > 1) { nArg = args(0).toLong; workersArg = args(1).toInt }

  def decode(data: Array[Byte]): Any = null

  def solve(inst: Any): Any = {
    val n = nArg
    val workers = workersArg
    val counts = new Array[Long](workers)
    val threads = Array.tabulate(workers) { id =>
      val t = new Thread(() => {
        var c = 0L
        var i = id.toLong
        while (i < n) {
          if (isPrime(i)) c += 1
          i += workers
        }
        counts(id) = c
      })
      t.start()
      t
    }
    threads.foreach(_.join())
    Array(counts.sum)
  }

  def emit(res: Any, sink: Long => Unit): Unit = sink(res.asInstanceOf[Array[Long]](0))

  def release(inst: Any, res: Any): Unit = ()
}
