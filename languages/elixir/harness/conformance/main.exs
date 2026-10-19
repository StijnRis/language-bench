# conformance problem: sum, maximum and a checksum of 4096 int32 values
defmodule Problem do
  def setup(_args), do: nil
  def decode(_p, data), do: for(<<v::signed-little-32 <- data>>, do: v)

  def solve(_p, a) do
    [Enum.sum(a), Enum.max(a, fn -> 0 end) |> max(0), Enum.reduce(a, 0, fn v, acc -> rem(acc + v * v, 1_000_003) end), length(a)]
  end

  def emit(r), do: r
end
