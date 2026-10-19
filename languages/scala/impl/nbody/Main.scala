// N-body simulation, after the Computer Language Benchmarks Game.
import java.nio.{ByteBuffer, ByteOrder}

final class Body(var x: Double, var y: Double, var z: Double, var vx: Double, var vy: Double, var vz: Double, val mass: Double)

object Problem {
  val SolarMass: Double = 4 * math.Pi * math.Pi
  var steps = 1000000L

  def setup(args: Array[String]): Unit = if (args.nonEmpty) steps = args(0).toLong

  def decode(data: Array[Byte]): Any = {
    val b = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN)
    Array.fill(5)(new Body(b.getDouble(), b.getDouble(), b.getDouble(), b.getDouble(), b.getDouble(), b.getDouble(), b.getDouble()))
  }

  def energy(bodies: Array[Body]): Double = {
    var e = 0.0
    for (i <- bodies.indices) {
      val b = bodies(i)
      e += 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy + b.vz * b.vz)
      for (j <- i + 1 until bodies.length) {
        val c = bodies(j)
        val dx = b.x - c.x; val dy = b.y - c.y; val dz = b.z - c.z
        e -= b.mass * c.mass / math.sqrt(dx * dx + dy * dy + dz * dz)
      }
    }
    e
  }

  def solve(inst: Any): Any = {
    val bodies = inst.asInstanceOf[Array[Body]]
    var px = 0.0; var py = 0.0; var pz = 0.0
    for (b <- bodies) { px += b.vx * b.mass; py += b.vy * b.mass; pz += b.vz * b.mass }
    bodies(0).vx = -px / SolarMass
    bodies(0).vy = -py / SolarMass
    bodies(0).vz = -pz / SolarMass
    val e0 = energy(bodies)
    val dt = 0.01
    var s = 0L
    while (s < steps) {
      var i = 0
      while (i < 5) {
        val b = bodies(i)
        var j = i + 1
        while (j < 5) {
          val c = bodies(j)
          val dx = b.x - c.x; val dy = b.y - c.y; val dz = b.z - c.z
          val d2 = dx * dx + dy * dy + dz * dz
          val mag = dt / (d2 * math.sqrt(d2))
          val bm = b.mass * mag
          val cm = c.mass * mag
          b.vx -= dx * cm; b.vy -= dy * cm; b.vz -= dz * cm
          c.vx += dx * bm; c.vy += dy * bm; c.vz += dz * bm
          j += 1
        }
        i += 1
      }
      i = 0
      while (i < 5) {
        val b = bodies(i)
        b.x += dt * b.vx; b.y += dt * b.vy; b.z += dt * b.vz
        i += 1
      }
      s += 1
    }
    Array(e0, energy(bodies))
  }

  def emit(res: Any, sink: Long => Unit): Unit = res.asInstanceOf[Array[Double]].foreach(e => sink(math.floor(e * 1e9 + 0.5).toLong))

  def release(inst: Any, res: Any): Unit = ()
}
