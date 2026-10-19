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
    java.util.Arrays.sort(a) // what scala.util.Sorting and Array.sorted call for primitive arrays
    a
  }

  def emit(res: Any, sink: Long => Unit): Unit = {
    val a = res.asInstanceOf[Array[Int]]
    var i = 0
    while (i < a.length) { sink(a(i)); i += 1 }
  }

  def release(inst: Any, res: Any): Unit = ()
}
