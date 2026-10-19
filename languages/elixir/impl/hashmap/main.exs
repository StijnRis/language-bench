defmodule HashMap do
  defp next(x), do: rem(x * 48271, 2_147_483_647)

  defp build(0, x, m, _half), do: {x, m}

  defp build(i, x, m, half) do
    x = next(x)
    build(i - 1, x, Map.update(m, rem(x, half), 1, &(&1 + 1)), half)
  end

  defp probe(0, _x, _m, _n, hits), do: hits

  defp probe(i, x, m, n, hits) do
    x = next(x)
    probe(i - 1, x, m, n, hits + Map.get(m, rem(x, n), 0))
  end

  def run(n) do
    {x, m} = build(n, 1, %{}, div(n, 2))
    checksum = Enum.reduce(m, 0, fn {k, c}, acc -> acc + k * c end)
    IO.puts("distinct=#{map_size(m)}")
    IO.puts("checksum=#{checksum}")
    IO.puts("hits=#{probe(n, x, m, n, 0)}")
  end
end

[arg] = System.argv()
HashMap.run(String.to_integer(arg))
