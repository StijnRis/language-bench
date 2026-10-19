defmodule Problem do
  def setup(_args), do: nil

  # B is stored by columns so each C[i][j] is a dot product of two lists
  def decode(_p, <<n::signed-little-32, rest::binary>>) do
    a = binary_part(rest, 0, n * n * 8)
    b = binary_part(rest, n * n * 8, n * n * 8)
    rows = for(<<f::float-little-64 <- a>>, do: f) |> Enum.chunk_every(n)
    brows = for(<<f::float-little-64 <- b>>, do: f) |> Enum.chunk_every(n)
    {rows, Enum.zip_with(brows, & &1)}
  end

  defp dot([], [], acc), do: acc
  defp dot([x | xs], [y | ys], acc), do: dot(xs, ys, acc + x * y)

  def solve(_p, {a, bt}), do: for(row <- a, do: for(col <- bt, do: dot(row, col, 0.0)))
  def emit(c), do: for(row <- c, v <- row, do: trunc(Float.floor(v + 0.5)))
end
