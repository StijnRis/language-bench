# Immutable data is the wrong tool for in-place permutations, so the three arrays are :atomics
# (the BEAM's mutable integer arrays, 1-based).
defmodule Problem do
  def setup([n | _]), do: String.to_integer(n)
  def setup(_), do: 9
  def decode(_p, _data), do: nil

  def solve(n, _inst) do
    perm1 = :atomics.new(n, signed: true)
    perm = :atomics.new(n, signed: true)
    count = :atomics.new(n, signed: true)
    for i <- 0..(n - 1), do: :atomics.put(perm1, i + 1, i)
    outer(n, n, perm1, perm, count, 0, 0, 0)
  end

  def emit(words), do: words

  defp fill(1, _count), do: 1

  defp fill(r, count) do
    :atomics.put(count, r, r)
    fill(r - 1, count)
  end

  defp flips(perm1, perm, n) do
    for i <- 1..n, do: :atomics.put(perm, i, :atomics.get(perm1, i))
    flip_loop(perm, 0)
  end

  defp flip_loop(perm, flips) do
    case :atomics.get(perm, 1) do
      0 ->
        flips

      k ->
        reverse(perm, 1, k + 1)
        flip_loop(perm, flips + 1)
    end
  end

  defp reverse(perm, i, j) when i < j do
    a = :atomics.get(perm, i)
    :atomics.put(perm, i, :atomics.get(perm, j))
    :atomics.put(perm, j, a)
    reverse(perm, i + 1, j - 1)
  end

  defp reverse(_perm, _i, _j), do: :ok

  defp outer(r0, n, perm1, perm, count, maxflips, permcount, checksum) do
    r = fill(r0, count)
    f = flips(perm1, perm, n)
    maxflips = max(maxflips, f)
    checksum = if rem(permcount, 2) == 0, do: checksum + f, else: checksum - f

    case advance(r, n, perm1, count) do
      :done -> [checksum, maxflips]
      r -> outer(r, n, perm1, perm, count, maxflips, permcount + 1, checksum)
    end
  end

  # rotate perm1[0..r] left by one, then decrement count[r]; repeat with larger r until it stays positive
  defp advance(r, n, _perm1, _count) when r == n, do: :done

  defp advance(r, n, perm1, count) do
    p0 = :atomics.get(perm1, 1)
    for i <- 1..r, do: :atomics.put(perm1, i, :atomics.get(perm1, i + 1))
    :atomics.put(perm1, r + 1, p0)
    c = :atomics.get(count, r + 1) - 1
    :atomics.put(count, r + 1, c)
    if c > 0, do: r, else: advance(r + 1, n, perm1, count)
  end
end
