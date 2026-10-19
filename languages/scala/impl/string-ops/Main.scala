import java.nio.charset.StandardCharsets

object Main {
  val Vocab: Array[String] = Array(
    "the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café",
    "über", "résumé", "привет", "мир",
    "код", "日本語", "世界", "速度", "hello", "world"
  )

  def main(args: Array[String]): Unit = {
    val n = args(0).toInt
    var x = 1L
    val sb = new java.lang.StringBuilder
    var i = 0
    while (i < n) {
      x = x * 48271 % 2147483647
      if (i > 0) sb.append(' ')
      sb.append(Vocab((x % Vocab.length).toInt))
      i += 1
    }
    val text = sb.toString

    val bytes = text.getBytes(StandardCharsets.UTF_8).length
    val codepoints = text.codePointCount(0, text.length)
    val words = text.split(' ').length

    var needle = 0L
    var p = text.indexOf("er")
    while (p != -1) {
      needle += 1
      p = text.indexOf("er", p + 2)
    }

    var checksum = 0L
    for (b <- text.replace(' ', '_').getBytes(StandardCharsets.UTF_8)) checksum += (b & 0xff)

    println(s"bytes=$bytes")
    println(s"codepoints=$codepoints")
    println(s"words=$words")
    println(s"needle=$needle")
    println(s"checksum=$checksum")
  }
}
