defmodule Problem do
  def setup(_args), do: nil

  def decode(_p, data) do
    n = div(byte_size(data), 8)
    {for(<<v::signed-little-32 <- binary_part(data, 0, n * 4)>>, do: v), for(<<v::signed-little-32 <- binary_part(data, n * 4, n * 4)>>, do: v)}
  end

  def solve(_p, {keys, lookups}) do
    m = Enum.reduce(keys, %{}, fn k, m -> Map.update(m, k, 1, &(&1 + 1)) end)
    checksum = Enum.reduce(m, 0, fn {k, c}, acc -> acc + k * c end)
    hits = Enum.reduce(lookups, 0, fn k, acc -> acc + Map.get(m, k, 0) end)
    [map_size(m), checksum, hits]
  end

  def emit(r), do: r
end
