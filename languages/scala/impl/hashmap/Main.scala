import scala.collection.mutable

object Main {
  def main(args: Array[String]): Unit = {
    val n = args(0).toLong
    var x = 1L
    val m = mutable.HashMap.empty[Int, Int]
    var i = 0L
    while (i < n) {
      x = x * 48271 % 2147483647
      val k = (x % (n / 2)).toInt
      m.update(k, m.getOrElse(k, 0) + 1)
      i += 1
    }

    var checksum = 0L
    for ((k, c) <- m) checksum += k.toLong * c

    var hits = 0L
    i = 0
    while (i < n) {
      x = x * 48271 % 2147483647
      hits += m.getOrElse((x % n).toInt, 0)
      i += 1
    }

    println(s"distinct=${m.size}")
    println(s"checksum=$checksum")
    println(s"hits=$hits")
  }
}
