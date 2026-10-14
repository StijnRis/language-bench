n = ARGV[0].to_i
# a byte string is Ruby's compact byte array: 1 = prime candidate, 0 = composite
s = "\x01" * (n + 1)
s.setbyte(0, 0)
s.setbyte(1, 0)
p = 2
while p * p <= n
  if s.getbyte(p) == 1
    m = p * p
    while m <= n
      s.setbyte(m, 0)
      m += p
    end
  end
  p += 1
end
count = 0
last = 0
sum = 0
i = 2
while i <= n
  if s.getbyte(i) == 1
    count += 1
    last = i
    sum += i
  end
  i += 1
end
puts "count=#{count}"
puts "last=#{last}"
puts "sum=#{sum}"
