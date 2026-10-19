object Problem {
  var nArg = 9

  def setup(args: Array[String]): Unit = if (args.nonEmpty) nArg = args(0).toInt

  def decode(data: Array[Byte]): Any = null

  def solve(inst: Any): Any = {
    val n = nArg
    val perm1 = Array.tabulate(n)(identity)
    val perm = new Array[Int](n)
    val count = new Array[Int](n)
    var maxflips = 0
    var permcount = 0
    var checksum = 0L
    var r = n
    var done = false
    while (!done) {
      while (r != 1) { count(r - 1) = r; r -= 1 }
      System.arraycopy(perm1, 0, perm, 0, n)
      var flips = 0
      var k = perm(0)
      while (k != 0) {
        var i = 0
        var j = k
        while (i < j) { val t = perm(i); perm(i) = perm(j); perm(j) = t; i += 1; j -= 1 }
        flips += 1
        k = perm(0)
      }
      if (flips > maxflips) maxflips = flips
      checksum += (if (permcount % 2 == 0) flips else -flips)
      var searching = true
      while (searching && !done) {
        if (r == n) done = true
        else {
          val p0 = perm1(0)
          var i = 0
          while (i < r) { perm1(i) = perm1(i + 1); i += 1 }
          perm1(r) = p0
          count(r) -= 1
          if (count(r) > 0) searching = false else r += 1
        }
      }
      permcount += 1
    }
    Array[Long](checksum, maxflips)
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[Array[Long]].foreach(v => sink(v))

  def release(inst: Any, res: Any): Unit = ()
}
