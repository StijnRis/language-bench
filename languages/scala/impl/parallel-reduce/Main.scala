object Main {
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

  def main(args: Array[String]): Unit = {
    val n = args(0).toLong
    val workers = args(1).toInt
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
    println(s"primes=${counts.sum}")
  }
}
