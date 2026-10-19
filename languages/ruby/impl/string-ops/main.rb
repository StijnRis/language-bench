module Problem
  def self.setup(args); end

  def self.decode(data)
    data.force_encoding("UTF-8")
  end

  def self.solve(text)
    checksum = text.tr(" ", "_").each_byte.sum
    [text.bytesize, text.length, text.count(" ") + 1, text.scan("er").length, checksum]
  end

  def self.emit(r)
    r
  end
end
