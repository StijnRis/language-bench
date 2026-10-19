require "json"

module Problem
  def self.setup(args); end

  def self.decode(data)
    data # the bytes are parsed inside solve
  end

  def self.solve(data)
    doc = JSON.parse(data)
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
    [objects, int_sum, str_len, trues, nulls]
  end

  def self.emit(r)
    r
  end
end
