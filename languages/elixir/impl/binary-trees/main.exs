# Binary trees, after the Computer Language Benchmarks Game.
defmodule BinaryTrees do
  def make(0), do: {nil, nil}
  def make(d), do: {make(d - 1), make(d - 1)}

  def check({nil, _}), do: 1
  def check({l, r}), do: 1 + check(l) + check(r)

  def run(n) do
    min_depth = 4
    max_depth = max(min_depth + 2, n)
    stretch = max_depth + 1

    IO.puts("stretch tree of depth #{stretch}\t check: #{check(make(stretch))}")
    long_lived = make(max_depth)

    for depth <- min_depth..max_depth//2 do
      iterations = Bitwise.bsl(1, max_depth - depth + min_depth)
      sum = Enum.reduce(1..iterations, 0, fn _, acc -> acc + check(make(depth)) end)
      IO.puts("#{iterations}\t trees of depth #{depth}\t check: #{sum}")
    end

    IO.puts("long lived tree of depth #{max_depth}\t check: #{check(long_lived)}")
  end
end

[arg] = System.argv()
BinaryTrees.run(String.to_integer(arg))
