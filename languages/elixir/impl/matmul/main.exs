defmodule MatMul do
  defp dot([], [], acc), do: acc
  defp dot([x | xs], [y | ys], acc), do: dot(xs, ys, acc + x * y)

  def run(n) do
    a = for i <- 0..(n - 1), do: for(j <- 0..(n - 1), do: (rem(i * 31 + j * 17, 10) + 1) * 1.0)
    # B is stored by columns so each C[i][j] is a dot product of two lists
    bt = for j <- 0..(n - 1), do: for(i <- 0..(n - 1), do: (rem(i * 13 + j * 7, 10) - 4) * 1.0)
    c = for row <- a, do: for(col <- bt, do: dot(row, col, 0.0))

    trace = c |> Enum.with_index() |> Enum.reduce(0.0, fn {row, i}, acc -> acc + Enum.at(row, i) end)
    sum = Enum.reduce(c, 0.0, fn row, acc -> Enum.reduce(row, acc, &(&1 + &2)) end)
    IO.puts("trace=#{trunc(trace)}")
    IO.puts("sum=#{trunc(sum)}")
    IO.puts("c00=#{trunc(c |> hd() |> hd())}")
    IO.puts("clast=#{trunc(c |> List.last() |> List.last())}")
  end
end

[arg] = System.argv()
MatMul.run(String.to_integer(arg))
