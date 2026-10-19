// N-body simulation, after the Computer Language Benchmarks Game.
final class Body(var x: Double, var y: Double, var z: Double, var vx: Double, var vy: Double, var vz: Double, val mass: Double)

object Main {
  val SolarMass: Double = 4 * math.Pi * math.Pi
  val Days = 365.24

  val bodies: Array[Body] = Array(
    new Body(0, 0, 0, 0, 0, 0, SolarMass),
    new Body(4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
      1.66007664274403694e-03 * Days, 7.69901118419740425e-03 * Days, -6.90460016972063023e-05 * Days, 9.54791938424326609e-04 * SolarMass),
    new Body(8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
      -2.76742510726862411e-03 * Days, 4.99852801234917238e-03 * Days, 2.30417297573763929e-05 * Days, 2.85885980666130812e-04 * SolarMass),
    new Body(1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
      2.96460137564761618e-03 * Days, 2.37847173959480950e-03 * Days, -2.96589568540237556e-05 * Days, 4.36624404335156298e-05 * SolarMass),
    new Body(1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
      2.68067772490389322e-03 * Days, 1.62824170038242295e-03 * Days, -9.51592254519715870e-05 * Days, 5.15138902046611451e-05 * SolarMass)
  )

  def energy(): Double = {
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

  def advance(dt: Double): Unit = {
    val nb = bodies.length
    var i = 0
    while (i < nb) {
      val b = bodies(i)
      var j = i + 1
      while (j < nb) {
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
    while (i < nb) {
      val b = bodies(i)
      b.x += dt * b.vx; b.y += dt * b.vy; b.z += dt * b.vz
      i += 1
    }
  }

  def main(args: Array[String]): Unit = {
    var px = 0.0; var py = 0.0; var pz = 0.0
    for (b <- bodies) { px += b.vx * b.mass; py += b.vy * b.mass; pz += b.vz * b.mass }
    bodies(0).vx = -px / SolarMass
    bodies(0).vy = -py / SolarMass
    bodies(0).vz = -pz / SolarMass
    println("%.9f".formatLocal(java.util.Locale.ROOT, energy()))
    var s = 0
    val steps = args(0).toInt
    while (s < steps) { advance(0.01); s += 1 }
    println("%.9f".formatLocal(java.util.Locale.ROOT, energy()))
  }
}
