import java.nio.{ByteBuffer, ByteOrder}
import scala.collection.mutable

object Problem {
  def setup(args: Array[String]): Unit = ()

  def decode(data: Array[Byte]): Any = {
    val n = data.length / 8
    val keys = new Array[Int](n)
    val lookups = new Array[Int](n)
    val b = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN)
    b.asIntBuffer().get(keys)
    b.position(n * 4)
    b.asIntBuffer().get(lookups)
    Array(keys, lookups)
  }

  def solve(inst: Any): Any = {
    val io = inst.asInstanceOf[Array[Array[Int]]]
    val m = mutable.HashMap.empty[Int, Int]
    var i = 0
    while (i < io(0).length) {
      val k = io(0)(i)
      m.update(k, m.getOrElse(k, 0) + 1)
      i += 1
    }
    var checksum = 0L
    for ((k, c) <- m) checksum += k.toLong * c
    var hits = 0L
    i = 0
    while (i < io(1).length) {
      hits += m.getOrElse(io(1)(i), 0)
      i += 1
    }
    Array[Long](m.size, checksum, hits)
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[Array[Long]].foreach(v => sink(v))

  def release(inst: Any, res: Any): Unit = ()
}
