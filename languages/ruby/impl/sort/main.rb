n = ARGV[0].to_i
x = 1
a = Array.new(n) do
  x = x * 48271 % 2147483647
end

a.sort!

checksum = 0
a.each_with_index { |v, i| checksum = (checksum + i * v) % 1000000007 }

puts "first=#{a[0]}"
puts "last=#{a[n - 1]}"
puts "median=#{a[n / 2]}"
puts "checksum=#{checksum}"
