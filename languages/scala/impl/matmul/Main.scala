import java.nio.{ByteBuffer, ByteOrder}

object Problem {
  def setup(args: Array[String]): Unit = ()

  def decode(data: Array[Byte]): Any = {
    val b = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN)
    val n = b.getInt()
    val a = new Array[Double](n * n)
    val c = new Array[Double](n * n)
    b.asDoubleBuffer().get(a)
    b.position(4 + n * n * 8)
    b.asDoubleBuffer().get(c)
    (n, a, c)
  }

  def solve(inst: Any): Any = {
    val (n, a, b) = inst.asInstanceOf[(Int, Array[Double], Array[Double])]
    val c = new Array[Double](n * n)
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
    c
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[Array[Double]].foreach(v => sink(math.floor(v + 0.5).toLong))

  def release(inst: Any, res: Any): Unit = ()
}
