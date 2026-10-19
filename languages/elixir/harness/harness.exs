# language-bench harness for Elixir: see harness/CONTRACT.md.
# usage: elixir harness.exs <problem.exs> [problem arguments]
# The problem file defines the module Problem with
#   setup(args) -> params, decode(params, bytes) -> instance, solve(params, instance) -> result,
#   emit(result) -> list of integers (the canonical result words).
defmodule Harness do
  @p1 2_147_483_647
  @p2 2_147_483_629

  defp num(k, d) do
    case System.get_env(k) do
      nil -> d
      "" -> d
      v -> elem(Float.parse(v), 0)
    end
  end

  defp env(k, d) do
    case System.get_env(k) do
      nil -> d
      "" -> d
      v -> v
    end
  end

  defp mono, do: :erlang.monotonic_time(:nanosecond)

  defp read_full(0), do: ""

  defp read_full(n) do
    case IO.binread(:stdio, n) do
      data when is_binary(data) and byte_size(data) == n ->
        data

      _ ->
        IO.puts(:stderr, "harness: input ended early")
        System.halt(1)
    end
  end

  def main([path | args]) do
    [{problem, _}] = Code.require_file(path) |> Enum.filter(fn {m, _} -> m == Problem end)
    :ok = :io.setopts(:standard_io, binary: true, encoding: :latin1)

    cfg = %{
      input: env("LB_INPUT", "none"),
      budget: num("LB_BUDGET_SECONDS", 10.0) * 1.0e9,
      min_iters: trunc(num("LB_MIN_ITERS", 3.0)),
      max_iters: trunc(num("LB_MAX_ITERS", 0.0)),
      start: trunc(num("LB_START", 0.0)),
      gen: env("LB_GEN", "/usr/local/bin/lbgen"),
      file: env("LB_FILE", "/dev/shm/lb-input"),
      pname: env("LB_PROBLEM", ""),
      file_ready: System.get_env("LB_FILE_READY") != nil
    }

    params = problem.setup(args)
    mono0 = mono()
    wall0 = :os.system_time(:nanosecond)
    {rows, kernel, reason} = loop(problem, params, cfg, 0, 0, [])

    iters =
      rows
      |> Enum.reverse()
      |> Enum.with_index(1)
      |> Enum.map(fn {{t0, t1, a, b}, i} -> "ITER #{i} t0=#{t0} t1=#{t1} check=#{a}:#{b}\n" end)

    IO.write([
      "LB 1 clock=:erlang.monotonic_time(:nanosecond)\nSTART mono=#{mono0} wall=#{wall0}\n",
      iters,
      "DONE iters=#{length(rows)} kernel_ns=#{kernel} reason=#{reason}\n"
    ])
  end

  defp loop(problem, params, cfg, i, kernel, rows) do
    data =
      case cfg.input do
        "stream" ->
          <<len::unsigned-little-64>> = read_full(8)
          read_full(len)

        "file" ->
          if not cfg.file_ready do
            {_, 0} = System.cmd(cfg.gen, ["file", cfg.pname, "#{cfg.start + i}", cfg.file])
          end

          cfg.file

        _ ->
          ""
      end

    inst = problem.decode(params, data)
    t0 = mono()
    res = problem.solve(params, inst)
    t1 = mono()
    words = problem.emit(res)

    {h1, h2, n} =
      Enum.reduce(words, {17, 19, 0}, fn w, {a, b, n} ->
        {rem(a * 1_000_003 + Integer.mod(w, @p1), @p1), rem(b * 999_983 + Integer.mod(w, @p2), @p2), n + 1}
      end)

    h1 = rem(h1 * 1_000_003 + Integer.mod(n, @p1), @p1)
    h2 = rem(h2 * 999_983 + Integer.mod(n, @p2), @p2)
    if cfg.input == "file" and not cfg.file_ready, do: File.rm(cfg.file)

    rows = [{t0, t1, h1, h2} | rows]
    i = i + 1
    kernel = kernel + (t1 - t0)

    cond do
      cfg.max_iters > 0 and i >= cfg.max_iters -> {rows, kernel, "iters"}
      kernel >= cfg.budget and i >= cfg.min_iters -> {rows, kernel, "budget"}
      true -> loop(problem, params, cfg, i, kernel, rows)
    end
  end
end

Harness.main(System.argv())
