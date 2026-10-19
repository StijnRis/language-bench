# start-up: the harness runs one empty iteration; only the end-to-end run is measured for this problem
defmodule Problem do
  def setup(_args), do: nil
  def decode(_p, _data), do: nil
  def solve(_p, _inst), do: :ok
  def emit(_r), do: [1]
end
