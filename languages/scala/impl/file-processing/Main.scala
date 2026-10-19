import java.io.{BufferedReader, FileInputStream, InputStreamReader}
import java.nio.charset.StandardCharsets
import scala.collection.mutable

object Main {
  def main(args: Array[String]): Unit = {
    val freq = mutable.HashMap.empty[String, Int]
    var lines = 0L
    var total = 0L
    val reader = new BufferedReader(new InputStreamReader(new FileInputStream(args(0)), StandardCharsets.ISO_8859_1), 1 << 16)
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
      if (c > topCount || (c == topCount && w.compareTo(top) < 0)) {
        top = w
        topCount = c
      }
    }

    println(s"lines=$lines")
    println(s"sum=$total")
    println(s"distinct=${freq.size}")
    println(s"top=$top $topCount")
  }
}
