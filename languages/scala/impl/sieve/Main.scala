object Main {
  def main(args: Array[String]): Unit = {
    val n = args(0).toInt
    val composite = new Array[Boolean](n + 1)
    var p = 2
    while (p.toLong * p <= n) {
      if (!composite(p)) {
        var m = p * p
        while (m <= n) {
          composite(m) = true
          m += p
        }
      }
      p += 1
    }
    var count = 0
    var last = 0
    var sum = 0L
    var i = 2
    while (i <= n) {
      if (!composite(i)) { count += 1; last = i; sum += i }
      i += 1
    }
    println(s"count=$count")
    println(s"last=$last")
    println(s"sum=$sum")
  }
}
