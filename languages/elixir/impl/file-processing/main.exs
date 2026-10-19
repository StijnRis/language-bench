defmodule FileProcessing do
  def run(path) do
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

    IO.puts("lines=#{lines}")
    IO.puts("sum=#{total}")
    IO.puts("distinct=#{map_size(freq)}")
    IO.puts("top=#{top} #{top_count}")
  end
end

[path] = System.argv()
FileProcessing.run(path)
