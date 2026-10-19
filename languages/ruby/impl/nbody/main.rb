# N-body simulation, after the Computer Language Benchmarks Game.
module Problem
  @steps = 1_000_000

  def self.setup(args)
    @steps = args[0].to_i unless args.empty?
  end

  def self.decode(data)
    v = data.unpack("E35")
    (0...5).map { |i| v[i * 7, 7] } # x y z vx vy vz mass
  end

  def self.energy(b)
    e = 0.0
    5.times do |i|
      bi = b[i]
      e += 0.5 * bi[6] * (bi[3] * bi[3] + bi[4] * bi[4] + bi[5] * bi[5])
      ((i + 1)...5).each do |j|
        bj = b[j]
        dx = bi[0] - bj[0]
        dy = bi[1] - bj[1]
        dz = bi[2] - bj[2]
        e -= bi[6] * bj[6] / Math.sqrt(dx * dx + dy * dy + dz * dz)
      end
    end
    e
  end

  def self.solve(b)
    solar = 4 * Math::PI * Math::PI
    px = py = pz = 0.0
    b.each { |o| px += o[3] * o[6]; py += o[4] * o[6]; pz += o[5] * o[6] }
    b[0][3] = -px / solar
    b[0][4] = -py / solar
    b[0][5] = -pz / solar
    e0 = energy(b)
    dt = 0.01
    pairs = []
    5.times { |i| ((i + 1)...5).each { |j| pairs << [b[i], b[j]] } }
    @steps.times do
      pairs.each do |bi, bj|
        dx = bi[0] - bj[0]
        dy = bi[1] - bj[1]
        dz = bi[2] - bj[2]
        d2 = dx * dx + dy * dy + dz * dz
        mag = dt / (d2 * Math.sqrt(d2))
        bm = bi[6] * mag
        cm = bj[6] * mag
        bi[3] -= dx * cm
        bi[4] -= dy * cm
        bi[5] -= dz * cm
        bj[3] += dx * bm
        bj[4] += dy * bm
        bj[5] += dz * bm
      end
      b.each do |o|
        o[0] += dt * o[3]
        o[1] += dt * o[4]
        o[2] += dt * o[5]
      end
    end
    [e0, energy(b)]
  end

  def self.emit(r)
    r.map { |e| (e * 1e9 + 0.5).floor }
  end
end
