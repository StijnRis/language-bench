defmodule Problem do
  def setup(_args), do: nil
  def decode(_p, path), do: path

  def solve(_p, path) do
    {lines, total, freq} =
      path
      |> File.read!()
      |> :binary.split("\n", [:global])
      |> Enum.reduce({0, 0, %{}}, fn
        "", acc ->
          acc

        line, {lines, total, freq} ->
          [_, word, value] = :binary.split(line, ",", [:global])
          {lines + 1, total + String.to_integer(value), Map.update(freq, word, 1, &(&1 + 1))}
      end)

    {top, top_count} =
      Enum.reduce(freq, {"", -1}, fn {w, c}, {tw, tc} ->
        if c > tc or (c == tc and w < tw), do: {w, c}, else: {tw, tc}
      end)

    [lines, total, map_size(freq), top_count, byte_size(top)] ++ :binary.bin_to_list(top)
  end

  def emit(words), do: words
end
