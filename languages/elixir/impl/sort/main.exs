defmodule Problem do
  def setup(_args), do: nil
  def decode(_p, data), do: for(<<v::signed-little-32 <- data>>, do: v)
  def solve(_p, a), do: Enum.sort(a)
  def emit(sorted), do: sorted
end
