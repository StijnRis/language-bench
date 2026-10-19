object Main {
  def main(args: Array[String]): Unit = {
    val n = args(0).toInt
    var x = 1L
    val a = new Array[Int](n)
    var i = 0
    while (i < n) {
      x = x * 48271 % 2147483647
      a(i) = x.toInt
      i += 1
    }

    java.util.Arrays.sort(a) // what scala.util.Sorting and Array.sorted call for primitive arrays

    var checksum = 0L
    i = 0
    while (i < n) {
      checksum = (checksum + i.toLong * a(i)) % 1000000007L
      i += 1
    }

    println(s"first=${a(0)}")
    println(s"last=${a(n - 1)}")
    println(s"median=${a(n / 2)}")
    println(s"checksum=$checksum")
  }
}
