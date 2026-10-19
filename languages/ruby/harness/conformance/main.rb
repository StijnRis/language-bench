# conformance problem: sum, maximum and a checksum of 4096 int32 values
module Problem
  def self.setup(args); end

  def self.decode(data)
    data.unpack("l<*")
  end

  def self.solve(a)
    sq = 0
    a.each { |v| sq = (sq + v * v) % 1000003 }
    [a.sum, a.max, sq, a.length]
  end

  def self.emit(r)
    r
  end
end
