defmodule StringOps do
  @vocab {"the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog", "naïve", "café", "über", "résumé", "привет",
          "мир", "код", "日本語", "世界", "速度", "hello", "world"}

  defp words(0, _x, acc), do: acc

  defp words(i, x, acc) do
    x = rem(x * 48271, 2_147_483_647)
    words(i - 1, x, [elem(@vocab, rem(x, tuple_size(@vocab))) | acc])
  end

  def run(n) do
    text = n |> words(1, []) |> :lists.reverse() |> Enum.join(" ")
    codepoints = for <<_::utf8 <- text>>, reduce: 0, do: (acc -> acc + 1)
    checksum = for <<b <- text>>, reduce: 0, do: (acc -> acc + if(b == 32, do: 95, else: b))

    IO.puts("bytes=#{byte_size(text)}")
    IO.puts("codepoints=#{codepoints}")
    IO.puts("words=#{length(:binary.split(text, " ", [:global]))}")
    IO.puts("needle=#{length(:binary.matches(text, "er"))}")
    IO.puts("checksum=#{checksum}")
  end
end

[arg] = System.argv()
StringOps.run(String.to_integer(arg))
