# Binary trees, after the Computer Language Benchmarks Game.
defmodule Problem do
  def setup([depth | _]), do: String.to_integer(depth)
  def setup(_), do: 14
  def decode(_p, _data), do: nil

  def make(0), do: {nil, nil}
  def make(d), do: {make(d - 1), make(d - 1)}

  def check({nil, _}), do: 1
  def check({l, r}), do: 1 + check(l) + check(r)

  def solve(n, _inst) do
    min_depth = 4
    max_depth = max(min_depth + 2, n)
    stretch = check(make(max_depth + 1))
    long_lived = make(max_depth)

    rest =
      for depth <- min_depth..max_depth//2 do
        iterations = Bitwise.bsl(1, max_depth - depth + min_depth)
        sum = Enum.reduce(1..iterations, 0, fn _, acc -> acc + check(make(depth)) end)
        [iterations, sum]
      end

    [stretch | List.flatten(rest)] ++ [check(long_lived)]
  end

  def emit(words), do: words
end
