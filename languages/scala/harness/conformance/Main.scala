// conformance problem: sum, maximum and a checksum of 4096 int32 values
import java.nio.{ByteBuffer, ByteOrder}

object Problem {
  def setup(args: Array[String]): Unit = ()

  def decode(data: Array[Byte]): Any = {
    val a = new Array[Int](data.length / 4)
    ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN).asIntBuffer().get(a)
    a
  }

  def solve(inst: Any): Any = {
    val a = inst.asInstanceOf[Array[Int]]
    var sum = 0L; var mx = 0L; var sq = 0L
    for (x <- a) { val v = x.toLong; sum += v; if (v > mx) mx = v; sq = (sq + v * v) % 1000003 }
    Array(sum, mx, sq, a.length.toLong)
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[Array[Long]].foreach(v => sink(v))

  def release(inst: Any, res: Any): Unit = ()
}
