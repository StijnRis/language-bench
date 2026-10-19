# N-body simulation, after the Computer Language Benchmarks Game.
# Bodies are immutable tuples {x, y, z, vx, vy, vz, mass}; every step builds the next state.
defmodule NBody do
  @solar_mass 4 * :math.pi() * :math.pi()
  @days 365.24

  def bodies do
    [
      {0.0, 0.0, 0.0, 0.0, 0.0, 0.0, @solar_mass},
      {4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
       1.66007664274403694e-03 * @days, 7.69901118419740425e-03 * @days, -6.90460016972063023e-05 * @days,
       9.54791938424326609e-04 * @solar_mass},
      {8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
       -2.76742510726862411e-03 * @days, 4.99852801234917238e-03 * @days, 2.30417297573763929e-05 * @days,
       2.85885980666130812e-04 * @solar_mass},
      {1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
       2.96460137564761618e-03 * @days, 2.37847173959480950e-03 * @days, -2.96589568540237556e-05 * @days,
       4.36624404335156298e-05 * @solar_mass},
      {1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
       2.68067772490389322e-03 * @days, 1.62824170038242295e-03 * @days, -9.51592254519715870e-05 * @days,
       5.15138902046611451e-05 * @solar_mass}
    ]
  end

  def offset_momentum([{x, y, z, _, _, _, m} | rest] = all) do
    {px, py, pz} =
      Enum.reduce(all, {0.0, 0.0, 0.0}, fn {_, _, _, vx, vy, vz, bm}, {px, py, pz} ->
        {px + vx * bm, py + vy * bm, pz + vz * bm}
      end)

    [{x, y, z, -px / @solar_mass, -py / @solar_mass, -pz / @solar_mass, m} | rest]
  end

  def energy(bodies), do: energy(bodies, 0.0)
  defp energy([], e), do: e

  defp energy([{x, y, z, vx, vy, vz, m} | rest], e) do
    e = e + 0.5 * m * (vx * vx + vy * vy + vz * vz)

    e =
      Enum.reduce(rest, e, fn {x2, y2, z2, _, _, _, m2}, e ->
        dx = x - x2
        dy = y - y2
        dz = z - z2
        e - m * m2 / :math.sqrt(dx * dx + dy * dy + dz * dz)
      end)

    energy(rest, e)
  end

  # update the velocities of all pairs, then move every body
  defp velocities([], _dt), do: []

  defp velocities([b | rest], dt) do
    {b, rest} = interact(b, rest, dt, [])
    [b | velocities(rest, dt)]
  end

  defp interact(b, [], _dt, acc), do: {b, :lists.reverse(acc)}

  defp interact({x, y, z, vx, vy, vz, m}, [{x2, y2, z2, vx2, vy2, vz2, m2} | rest], dt, acc) do
    dx = x - x2
    dy = y - y2
    dz = z - z2
    d2 = dx * dx + dy * dy + dz * dz
    mag = dt / (d2 * :math.sqrt(d2))
    bm = m * mag
    cm = m2 * mag

    interact(
      {x, y, z, vx - dx * cm, vy - dy * cm, vz - dz * cm, m},
      rest,
      dt,
      [{x2, y2, z2, vx2 + dx * bm, vy2 + dy * bm, vz2 + dz * bm, m2} | acc]
    )
  end

  defp move([], _dt), do: []
  defp move([{x, y, z, vx, vy, vz, m} | rest], dt), do: [{x + dt * vx, y + dt * vy, z + dt * vz, vx, vy, vz, m} | move(rest, dt)]

  def advance(bodies, 0, _dt), do: bodies
  def advance(bodies, steps, dt), do: advance(move(velocities(bodies, dt), dt), steps - 1, dt)
end

[arg] = System.argv()
bodies = NBody.offset_momentum(NBody.bodies())
IO.puts(:erlang.float_to_binary(NBody.energy(bodies), decimals: 9))
bodies = NBody.advance(bodies, String.to_integer(arg), 0.01)
IO.puts(:erlang.float_to_binary(NBody.energy(bodies), decimals: 9))
