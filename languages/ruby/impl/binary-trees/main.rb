# Binary trees, after the Computer Language Benchmarks Game. A node is a two-element array.

def make_tree(d)
  d == 0 ? [nil, nil] : [make_tree(d - 1), make_tree(d - 1)]
end

def check(t)
  t[0] ? 1 + check(t[0]) + check(t[1]) : 1
end

n = ARGV[0].to_i
min_depth = 4
max_depth = n > min_depth + 2 ? n : min_depth + 2
stretch = max_depth + 1

puts "stretch tree of depth #{stretch}\t check: #{check(make_tree(stretch))}"
long_lived = make_tree(max_depth)

min_depth.step(max_depth, 2) do |depth|
  iterations = 1 << (max_depth - depth + min_depth)
  sum = 0
  iterations.times { sum += check(make_tree(depth)) }
  puts "#{iterations}\t trees of depth #{depth}\t check: #{sum}"
end

puts "long lived tree of depth #{max_depth}\t check: #{check(long_lived)}"
