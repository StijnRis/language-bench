import java.nio.charset.StandardCharsets

object Problem {
  def setup(args: Array[String]): Unit = ()

  def decode(data: Array[Byte]): Any = new String(data, StandardCharsets.UTF_8)

  def solve(inst: Any): Any = {
    val text = inst.asInstanceOf[String]
    val bytes = text.getBytes(StandardCharsets.UTF_8).length
    val codepoints = text.codePointCount(0, text.length)
    var spaces = 0L
    var i = 0
    while (i < text.length) { if (text.charAt(i) == ' ') spaces += 1; i += 1 }
    var needle = 0L
    var p = text.indexOf("er")
    while (p != -1) {
      needle += 1
      p = text.indexOf("er", p + 2)
    }
    var checksum = 0L
    for (b <- text.replace(' ', '_').getBytes(StandardCharsets.UTF_8)) checksum += (b & 0xff)
    Array[Long](bytes, codepoints, spaces + 1, needle, checksum)
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[Array[Long]].foreach(v => sink(v))

  def release(inst: Any, res: Any): Unit = ()
}
