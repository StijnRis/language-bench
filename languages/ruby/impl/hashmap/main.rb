n = ARGV[0].to_i
x = 1
m = Hash.new(0)

n.times do
  x = x * 48271 % 2147483647
  m[x % (n / 2)] += 1
end

checksum = 0
m.each { |k, c| checksum += k * c }

hits = 0
n.times do
  x = x * 48271 % 2147483647
  hits += m.fetch(x % n, 0)
end

puts "distinct=#{m.size}"
puts "checksum=#{checksum}"
puts "hits=#{hits}"
