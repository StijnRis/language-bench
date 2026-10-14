n = ARGV[0].to_i
a = Array.new(n) { |i| Array.new(n) { |j| ((i * 31 + j * 17) % 10 + 1).to_f } }
b = Array.new(n) { |i| Array.new(n) { |j| ((i * 13 + j * 7) % 10 - 4).to_f } }
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

trace = 0.0
sum = 0.0
n.times do |i|
  trace += c[i][i]
  sum += c[i].inject(0.0) { |s, v| s + v }
end
puts "trace=#{trace.to_i}"
puts "sum=#{sum.to_i}"
puts "c00=#{c[0][0].to_i}"
puts "clast=#{c[n - 1][n - 1].to_i}"
