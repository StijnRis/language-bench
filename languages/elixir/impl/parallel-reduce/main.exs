defmodule Problem do
  def setup([a, b | _]), do: {String.to_integer(a), String.to_integer(b)}
  def setup(_), do: {2_000_000, 4}
  def decode(_p, _data), do: nil

  def prime?(n) when n < 2, do: false
  def prime?(n) when n < 4, do: true
  def prime?(n) when rem(n, 2) == 0, do: false
  def prime?(n), do: odd_divisor_free?(n, 3)

  defp odd_divisor_free?(n, d) when d * d > n, do: true
  defp odd_divisor_free?(n, d) when rem(n, d) == 0, do: false
  defp odd_divisor_free?(n, d), do: odd_divisor_free?(n, d + 2)

  def count(i, n, _workers, acc) when i >= n, do: acc
  def count(i, n, workers, acc), do: count(i + workers, n, workers, if(prime?(i), do: acc + 1, else: acc))

  def solve({n, workers}, _inst) do
    total =
      0..(workers - 1)
      |> Task.async_stream(fn t -> count(t, n, workers, 0) end, max_concurrency: workers, timeout: :infinity)
      |> Enum.reduce(0, fn {:ok, c}, acc -> acc + c end)

    [total]
  end

  def emit(words), do: words
end
