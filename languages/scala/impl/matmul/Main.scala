object Main {
  def main(args: Array[String]): Unit = {
    val n = args(0).toInt
    val a = new Array[Double](n * n)
    val b = new Array[Double](n * n)
    val c = new Array[Double](n * n)
    for (i <- 0 until n; j <- 0 until n) {
      a(i * n + j) = (i * 31 + j * 17) % 10 + 1
      b(i * n + j) = (i * 13 + j * 7) % 10 - 4
    }
    var i = 0
    while (i < n) {
      var k = 0
      while (k < n) {
        val aik = a(i * n + k)
        var j = 0
        while (j < n) {
          c(i * n + j) += aik * b(k * n + j)
          j += 1
        }
        k += 1
      }
      i += 1
    }
    var trace = 0.0
    var sum = 0.0
    i = 0
    while (i < n) { trace += c(i * n + i); i += 1 }
    i = 0
    while (i < c.length) { sum += c(i); i += 1 }
    println(s"trace=${trace.toLong}")
    println(s"sum=${sum.toLong}")
    println(s"c00=${c(0).toLong}")
    println(s"clast=${c(n * n - 1).toLong}")
  }
}
