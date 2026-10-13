VOCAB = %w[
  the quick brown fox jumps over lazy dog naïve café
  über résumé привет мир
  код 日本語 世界 速度 hello world
].freeze

n = ARGV[0].to_i
x = 1
words = Array.new(n) do
  x = x * 48271 % 2147483647
  VOCAB[x % VOCAB.size]
end
text = words.join(" ")

puts "bytes=#{text.bytesize}"
puts "codepoints=#{text.length}"
puts "words=#{text.split(" ", -1).size}"
puts "needle=#{text.scan("er").size}"
puts "checksum=#{text.tr(" ", "_").bytes.sum}"
