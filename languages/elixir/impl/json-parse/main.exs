# Elixir ships a JSON module only from 1.18 and Jason is a Hex package, so this is a small
# recursive-descent parser written with binary pattern matching.
defmodule JsonDoc do
  def skip(<<c, rest::binary>>) when c in [?\s, ?\n, ?\r, ?\t], do: skip(rest)
  def skip(bin), do: bin

  def value(bin) do
    case skip(bin) do
      <<?{, rest::binary>> -> object(skip(rest), [])
      <<?[, rest::binary>> -> array(skip(rest), [])
      <<?", rest::binary>> -> string(rest, 0)
      <<"true", rest::binary>> -> {true, rest}
      <<"false", rest::binary>> -> {false, rest}
      <<"null", rest::binary>> -> {nil, rest}
      <<?-, rest::binary>> -> number(rest, 0, -1)
      rest -> number(rest, 0, 1)
    end
  end

  # strings are reduced to their length in characters
  defp string(<<?", rest::binary>>, n), do: {{:str, n}, rest}
  defp string(<<?\\, ?u, _::binary-size(4), rest::binary>>, n), do: string(rest, n + 1)
  defp string(<<?\\, _, rest::binary>>, n), do: string(rest, n + 1)
  defp string(<<_, rest::binary>>, n), do: string(rest, n + 1)

  defp number(<<c, rest::binary>>, acc, sign) when c in ?0..?9, do: number(rest, acc * 10 + c - ?0, sign)
  defp number(rest, acc, sign), do: {{:int, sign * acc}, rest}

  defp array(<<?], rest::binary>>, []), do: {{:arr, []}, rest}

  defp array(bin, acc) do
    {v, rest} = value(bin)

    case skip(rest) do
      <<?,, rest::binary>> -> array(skip(rest), [v | acc])
      <<?], rest::binary>> -> {{:arr, [v | acc]}, rest}
    end
  end

  defp object(<<?}, rest::binary>>, []), do: {{:obj, []}, rest}

  defp object(<<?", rest::binary>>, acc) do
    {_key, rest} = string(rest, 0)
    <<?:, rest::binary>> = skip(rest)
    {v, rest} = value(rest)

    case skip(rest) do
      <<?,, rest::binary>> -> object(skip(rest), [v | acc])
      <<?}, rest::binary>> -> {{:obj, [v | acc]}, rest}
    end
  end

  def walk([], stats), do: stats
  def walk([{:obj, vs} | rest], {o, i, l, t, n}), do: walk(vs ++ rest, {o + 1, i, l, t, n})
  def walk([{:arr, vs} | rest], stats), do: walk(vs ++ rest, stats)
  def walk([{:str, len} | rest], {o, i, l, t, n}), do: walk(rest, {o, i, l + len, t, n})
  def walk([{:int, x} | rest], {o, i, l, t, n}), do: walk(rest, {o, i + x, l, t, n})
  def walk([true | rest], {o, i, l, t, n}), do: walk(rest, {o, i, l, t + 1, n})
  def walk([false | rest], stats), do: walk(rest, stats)
  def walk([nil | rest], {o, i, l, t, n}), do: walk(rest, {o, i, l, t, n + 1})
end

defmodule Problem do
  def setup(_args), do: nil
  def decode(_p, data), do: data

  def solve(_p, data) do
    {doc, _} = JsonDoc.value(data)
    {objects, int_sum, str_len, trues, nulls} = JsonDoc.walk([doc], {0, 0, 0, 0, 0})
    [objects, int_sum, str_len, trues, nulls]
  end

  def emit(words), do: words
end
