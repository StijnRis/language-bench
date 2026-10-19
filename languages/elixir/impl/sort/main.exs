defmodule Sort do
  defp generate(0, _x, acc), do: acc

  defp generate(i, x, acc) do
    x = rem(x * 48271, 2_147_483_647)
    generate(i - 1, x, [x | acc])
  end

  defp checksum([], _i, acc), do: acc
  defp checksum([v | rest], i, acc), do: checksum(rest, i + 1, rem(acc + i * v, 1_000_000_007))

  def run(n) do
    sorted = n |> generate(1, []) |> Enum.sort()
    IO.puts("first=#{hd(sorted)}")
    IO.puts("last=#{List.last(sorted)}")
    IO.puts("median=#{Enum.at(sorted, div(n, 2))}")
    IO.puts("checksum=#{checksum(sorted, 0, 0)}")
  end
end

[arg] = System.argv()
Sort.run(String.to_integer(arg))
