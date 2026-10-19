# Binary trees, after the Computer Language Benchmarks Game.
module Problem
  @depth = 14

  def self.setup(args)
    @depth = args[0].to_i unless args.empty?
  end

  def self.decode(data)
    nil
  end

  def self.make_tree(d)
    return [nil, nil] if d == 0
    d -= 1
    [make_tree(d), make_tree(d)]
  end

  def self.check_tree(node)
    left, right = node
    return 1 if left.nil?
    1 + check_tree(left) + check_tree(right)
  end

  def self.solve(_)
    min_depth = 4
    max_depth = [min_depth + 2, @depth].max
    out = [check_tree(make_tree(max_depth + 1))]
    long_lived = make_tree(max_depth)
    (min_depth..max_depth).step(2) do |depth|
      iterations = 1 << (max_depth - depth + min_depth)
      check = 0
      iterations.times { check += check_tree(make_tree(depth)) }
      out << iterations << check
    end
    out << check_tree(long_lived)
    out
  end

  def self.emit(r)
    r
  end
end
