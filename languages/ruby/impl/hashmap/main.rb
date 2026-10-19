module Problem
  def self.setup(args); end

  def self.decode(data)
    a = data.unpack("l<*")
    n = a.length / 2
    [a[0, n], a[n, n]]
  end

  def self.solve(inst)
    keys, lookups = inst
    m = Hash.new(0)
    keys.each { |k| m[k] += 1 }
    checksum = 0
    m.each { |k, c| checksum += k * c }
    hits = 0
    lookups.each { |k| hits += m.fetch(k, 0) }
    [m.size, checksum, hits]
  end

  def self.emit(r)
    r
  end
end
