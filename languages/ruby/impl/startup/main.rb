# start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
module Problem
  def self.setup(args); end

  def self.decode(data)
    nil
  end

  def self.solve(_)
    nil
  end

  def self.emit(r)
    [1]
  end
end
