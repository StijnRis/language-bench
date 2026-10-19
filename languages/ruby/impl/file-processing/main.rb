module Problem
  def self.setup(args); end

  def self.decode(data)
    data # path of the file
  end

  def self.solve(path)
    freq = Hash.new(0)
    lines = 0
    total = 0
    File.open(path, "rb") do |f|
      f.each_line do |line|
        _, word, value = line.split(",")
        total += value.to_i
        freq[word] += 1
        lines += 1
      end
    end
    top = nil
    top_count = -1
    freq.each do |w, c|
      if c > top_count || (c == top_count && w < top)
        top = w
        top_count = c
      end
    end
    [lines, total, freq.size, top_count, top]
  end

  def self.emit(r)
    lines, total, distinct, count, word = r
    [lines, total, distinct, count, word.bytesize] + word.bytes
  end
end
