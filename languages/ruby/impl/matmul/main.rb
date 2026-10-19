module Problem
  def self.setup(args); end

  def self.decode(data)
    n = data.unpack1("l<")
    vals = data.byteslice(4, 16 * n * n).unpack("E*")
    [n, vals[0, n * n].each_slice(n).to_a, vals[n * n, n * n].each_slice(n).to_a]
  end

  def self.solve(inst)
    n, a, b = inst
    c = Array.new(n) { Array.new(n, 0.0) }
    n.times do |i|
      ci = c[i]
      ai = a[i]
      n.times do |k|
        aik = ai[k]
        bk = b[k]
        j = 0
        while j < n
          ci[j] += aik * bk[j]
          j += 1
        end
      end
    end
    c
  end

  def self.emit(c)
    c.flatten.map { |v| (v + 0.5).floor }
  end
end
