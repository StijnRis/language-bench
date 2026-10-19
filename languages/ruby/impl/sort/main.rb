module Problem
  def self.setup(args); end

  def self.decode(data)
    data.unpack("l<*")
  end

  def self.solve(a)
    a.sort! # Array#sort! on plain integers: quicksort in C
  end

  def self.emit(a)
    a
  end
end
