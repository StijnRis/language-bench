// language-bench harness for Scala: see harness/CONTRACT.md. Compiled together with Problem.scala (the problem's
// Main.scala), an object Problem with setup, decode, solve, emit and release; instance and result are opaque Anys.
import java.io.{BufferedInputStream, DataInputStream, File, IOException}
import java.nio.charset.StandardCharsets
import java.time.Instant

object Harness {
  def num(k: String, d: Double): Double = {
    val v = System.getenv(k)
    if (v == null || v.isEmpty) d else try v.toDouble catch { case _: NumberFormatException => d }
  }

  def env(k: String, d: String): String = {
    val v = System.getenv(k)
    if (v == null || v.isEmpty) d else v
  }

  def fail(msg: String): Nothing = {
    System.err.println("harness: " + msg)
    sys.exit(1)
  }

  def main(args: Array[String]): Unit = {
    val input = env("LB_INPUT", "none")
    val budget = num("LB_BUDGET_SECONDS", 10) * 1e9
    val minIters = num("LB_MIN_ITERS", 3).toLong
    val maxIters = num("LB_MAX_ITERS", 0).toLong
    val start = num("LB_START", 0).toLong
    val gen = env("LB_GEN", "/usr/local/bin/lbgen")
    val file = env("LB_FILE", "/dev/shm/lb-input")
    val problem = env("LB_PROBLEM", "")
    val fileReady = System.getenv("LB_FILE_READY") != null
    val P1 = 2147483647L
    val P2 = 2147483629L

    Problem.setup(args)
    val in = new DataInputStream(new BufferedInputStream(System.in, 1 << 16))
    val rows = scala.collection.mutable.ArrayBuffer.empty[(Long, Long, Long, Long)]
    var kernel = 0.0
    val now = Instant.now()
    val mono0 = System.nanoTime()
    val wall0 = now.getEpochSecond * 1000000000L + now.getNano
    var reason = "budget"
    var fin = false

    while (!fin) {
      val data: Array[Byte] =
        if (input == "stream") {
          val hdr = new Array[Byte](8)
          try in.readFully(hdr) catch { case _: IOException => fail("input ended early") }
          var len = 0L
          var i = 7
          while (i >= 0) { len = (len << 8) | (hdr(i) & 0xff); i -= 1 }
          val d = new Array[Byte](len.toInt)
          try in.readFully(d) catch { case _: IOException => fail("input ended early") }
          d
        } else if (input == "file") {
          if (!fileReady) {
            val p = new ProcessBuilder(gen, "file", problem, (start + rows.length).toString, file).inheritIO().start()
            if (p.waitFor() != 0) fail("generator failed")
          }
          file.getBytes(StandardCharsets.UTF_8)
        } else Array.emptyByteArray
      val inst = Problem.decode(data)
      val t0 = System.nanoTime()
      val res = Problem.solve(inst)
      val t1 = System.nanoTime()
      var h1 = 17L
      var h2 = 19L
      var n = 0L
      Problem.emit(res, (w: Long) => {
        val m1 = ((w % P1) + P1) % P1
        val m2 = ((w % P2) + P2) % P2
        h1 = (h1 * 1000003L + m1) % P1
        h2 = (h2 * 999983L + m2) % P2
        n += 1
      })
      h1 = (h1 * 1000003L + n % P1) % P1
      h2 = (h2 * 999983L + n % P2) % P2
      Problem.release(inst, res)
      if (input == "file" && !fileReady) new File(file).delete()
      rows += ((t0, t1, h1, h2))
      kernel += (t1 - t0).toDouble
      if (maxIters > 0 && rows.length >= maxIters) { reason = "iters"; fin = true }
      else if (kernel >= budget && rows.length >= minIters) fin = true
    }

    val sb = new StringBuilder
    sb.append("LB 1 clock=System.nanoTime\nSTART mono=").append(mono0).append(" wall=").append(wall0).append('\n')
    for (((t0, t1, h1, h2), i) <- rows.zipWithIndex)
      sb.append("ITER ").append(i + 1).append(" t0=").append(t0).append(" t1=").append(t1).append(" check=").append(h1).append(':').append(h2).append('\n')
    sb.append("DONE iters=").append(rows.length).append(" kernel_ns=").append(kernel.toLong).append(" reason=").append(reason).append('\n')
    print(sb)
    System.out.flush()
  }
}
