import java.io.{BufferedReader, FileInputStream, InputStreamReader}
import java.nio.charset.StandardCharsets
import scala.collection.mutable

object Problem {
  def setup(args: Array[String]): Unit = ()

  def decode(data: Array[Byte]): Any = new String(data, StandardCharsets.UTF_8) // path of the file

  def solve(inst: Any): Any = {
    val freq = mutable.HashMap.empty[String, Int]
    var lines = 0L
    var total = 0L
    val reader = new BufferedReader(new InputStreamReader(new FileInputStream(inst.asInstanceOf[String]), StandardCharsets.ISO_8859_1), 1 << 16)
    var line = reader.readLine()
    while (line != null) {
      val c1 = line.indexOf(',')
      val c2 = line.indexOf(',', c1 + 1)
      val word = line.substring(c1 + 1, c2)
      total += line.substring(c2 + 1).toLong
      freq.update(word, freq.getOrElse(word, 0) + 1)
      lines += 1
      line = reader.readLine()
    }
    reader.close()
    var top: String = null
    var topCount = -1
    for ((w, c) <- freq) {
      if (c > topCount || (c == topCount && w.compareTo(top) < 0)) { top = w; topCount = c }
    }
    val out = mutable.ArrayBuffer[Long](lines, total, freq.size, topCount, top.length)
    for (ch <- top) out += ch.toLong
    out
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[mutable.ArrayBuffer[Long]].foreach(v => sink(v))

  def release(inst: Any, res: Any): Unit = ()
}
