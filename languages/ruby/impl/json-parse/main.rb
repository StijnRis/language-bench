require "json"

doc = JSON.parse(File.read(ARGV[0]))

objects = int_sum = str_len = trues = nulls = 0
stack = [doc]
until stack.empty?
  v = stack.pop
  case v
  when Hash
    objects += 1
    stack.concat(v.values)
  when Array
    stack.concat(v)
  when String
    str_len += v.length
  when true
    trues += 1
  when nil
    nulls += 1
  when Integer
    int_sum += v
  end
end

puts "objects=#{objects}"
puts "int_sum=#{int_sum}"
puts "string_length=#{str_len}"
puts "true=#{trues}"
puts "null=#{nulls}"
