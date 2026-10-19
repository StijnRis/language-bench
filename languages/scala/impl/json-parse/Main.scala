import java.nio.file.{Files, Paths}

// The Scala standard library has no JSON parser (the usual ones are separate libraries), so this is a
// small recursive-descent parser that builds a value tree.
sealed trait Value
final case class Obj(values: Array[Value]) extends Value
final case class Arr(values: Array[Value]) extends Value
final case class Str(length: Int) extends Value
final case class Num(value: Long) extends Value
final case class Bool(value: Boolean) extends Value
case object Null extends Value

final class Parser(s: Array[Byte]) {
  private var pos = 0

  private def skip(): Unit =
    while (pos < s.length && (s(pos) == ' ' || s(pos) == '\n' || s(pos) == '\r' || s(pos) == '\t')) pos += 1

  private def parseString(): Int = {
    pos += 1
    var n = 0
    while (s(pos) != '"') {
      if (s(pos) == '\\') pos += (if (s(pos + 1) == 'u') 6 else 2) else pos += 1
      n += 1
    }
    pos += 1
    n
  }

  def parseValue(): Value = {
    skip()
    s(pos) match {
      case '{' =>
        pos += 1
        skip()
        val items = scala.collection.mutable.ArrayBuffer.empty[Value]
        if (s(pos) == '}') pos += 1
        else {
          var fin = false
          while (!fin) {
            skip()
            parseString()
            skip()
            pos += 1
            items += parseValue()
            skip()
            val c = s(pos)
            pos += 1
            if (c == '}') fin = true
          }
        }
        Obj(items.toArray)
      case '[' =>
        pos += 1
        skip()
        val items = scala.collection.mutable.ArrayBuffer.empty[Value]
        if (s(pos) == ']') pos += 1
        else {
          var fin = false
          while (!fin) {
            items += parseValue()
            skip()
            val c = s(pos)
            pos += 1
            if (c == ']') fin = true
          }
        }
        Arr(items.toArray)
      case '"' => Str(parseString())
      case 't' => pos += 4; Bool(true)
      case 'f' => pos += 5; Bool(false)
      case 'n' => pos += 4; Null
      case _ =>
        val neg = s(pos) == '-'
        if (neg) pos += 1
        var v = 0L
        while (pos < s.length && s(pos) >= '0' && s(pos) <= '9') {
          v = v * 10 + (s(pos) - '0')
          pos += 1
        }
        Num(if (neg) -v else v)
    }
  }
}

object Main {
  def main(args: Array[String]): Unit = {
    val doc = new Parser(Files.readAllBytes(Paths.get(args(0)))).parseValue()

    var objects = 0L; var intSum = 0L; var strLen = 0L; var trues = 0L; var nulls = 0L
    val stack = scala.collection.mutable.ArrayBuffer[Value](doc)
    while (stack.nonEmpty) {
      stack.remove(stack.length - 1) match {
        case Obj(vs)  => objects += 1; stack ++= vs
        case Arr(vs)  => stack ++= vs
        case Str(l)   => strLen += l
        case Num(x)   => intSum += x
        case Bool(b)  => if (b) trues += 1
        case Null     => nulls += 1
      }
    }

    println(s"objects=$objects")
    println(s"int_sum=$intSum")
    println(s"string_length=$strLen")
    println(s"true=$trues")
    println(s"null=$nulls")
  }
}
