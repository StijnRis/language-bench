# :atomics is the BEAM's mutable array (1-based): index i + 1 holds the flag of the number i.
defmodule Problem do
  def setup([n | _]), do: String.to_integer(n)
  def setup(_), do: 10_000_000
  def decode(_p, _data), do: nil

  def solve(n, _inst) do
    s = :atomics.new(n + 1, signed: false)
    outer(2, n, s)
    {count, last, sum} = tally(2, n, s, 0, 0, 0)
    [count, last, sum]
  end

  def emit(words), do: words

  defp outer(p, n, _s) when p * p > n, do: :ok

  defp outer(p, n, s) do
    if :atomics.get(s, p + 1) == 0, do: mark(p * p, p, n, s)
    outer(p + 1, n, s)
  end

  defp mark(m, _p, n, _s) when m > n, do: :ok

  defp mark(m, p, n, s) do
    :atomics.put(s, m + 1, 1)
    mark(m + p, p, n, s)
  end

  defp tally(i, n, _s, count, last, sum) when i > n, do: {count, last, sum}

  defp tally(i, n, s, count, last, sum) do
    if :atomics.get(s, i + 1) == 0,
      do: tally(i + 1, n, s, count + 1, i, sum + i),
      else: tally(i + 1, n, s, count, last, sum)
  end
end
