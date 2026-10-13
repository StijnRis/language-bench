freq = Hash.new(0)
lines = 0
total = 0

File.open(ARGV[0], "rb") do |f|
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

puts "lines=#{lines}"
puts "sum=#{total}"
puts "distinct=#{freq.size}"
puts "top=#{top} #{top_count}"
