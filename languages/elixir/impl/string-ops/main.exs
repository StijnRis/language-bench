defmodule Problem do
  def setup(_args), do: nil
  def decode(_p, data), do: data

  def solve(_p, text) do
    codepoints = for <<_::utf8 <- text>>, reduce: 0, do: (acc -> acc + 1)
    checksum = for <<b <- text>>, reduce: 0, do: (acc -> acc + if(b == 32, do: 95, else: b))
    [byte_size(text), codepoints, length(:binary.matches(text, " ")) + 1, length(:binary.matches(text, "er")), checksum]
  end

  def emit(r), do: r
end
