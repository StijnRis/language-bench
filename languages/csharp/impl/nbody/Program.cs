// N-body simulation, after the Computer Language Benchmarks Game.
public static class Problem
{
    const double SOLAR_MASS = 4 * Math.PI * Math.PI;
    static long steps = 1000000;

    sealed class Body
    {
        public double X, Y, Z, Vx, Vy, Vz, Mass;
    }

    public static void Setup(string[] args)
    {
        if (args.Length > 0) steps = long.Parse(args[0]);
    }

    public static object Decode(byte[] data)
    {
        var bodies = new Body[5];
        for (int i = 0; i < 5; i++)
        {
            double F(int k) => BitConverter.ToDouble(data, (i * 7 + k) * 8);
            bodies[i] = new Body { X = F(0), Y = F(1), Z = F(2), Vx = F(3), Vy = F(4), Vz = F(5), Mass = F(6) };
        }
        return bodies;
    }

    static double Energy(Body[] bodies)
    {
        double e = 0.0;
        for (int i = 0; i < 5; i++)
        {
            Body b = bodies[i];
            e += 0.5 * b.Mass * (b.Vx * b.Vx + b.Vy * b.Vy + b.Vz * b.Vz);
            for (int j = i + 1; j < 5; j++)
            {
                Body c = bodies[j];
                double dx = b.X - c.X, dy = b.Y - c.Y, dz = b.Z - c.Z;
                e -= b.Mass * c.Mass / Math.Sqrt(dx * dx + dy * dy + dz * dz);
            }
        }
        return e;
    }

    public static object Solve(object inst)
    {
        var bodies = (Body[])inst;
        double px = 0, py = 0, pz = 0;
        foreach (var b in bodies) { px += b.Vx * b.Mass; py += b.Vy * b.Mass; pz += b.Vz * b.Mass; }
        bodies[0].Vx = -px / SOLAR_MASS; bodies[0].Vy = -py / SOLAR_MASS; bodies[0].Vz = -pz / SOLAR_MASS;
        double e0 = Energy(bodies);
        const double dt = 0.01;
        for (long s = 0; s < steps; s++)
        {
            for (int i = 0; i < 5; i++)
            {
                Body b = bodies[i];
                for (int j = i + 1; j < 5; j++)
                {
                    Body c = bodies[j];
                    double dx = b.X - c.X, dy = b.Y - c.Y, dz = b.Z - c.Z;
                    double d2 = dx * dx + dy * dy + dz * dz;
                    double mag = dt / (d2 * Math.Sqrt(d2));
                    double bm = b.Mass * mag, cm = c.Mass * mag;
                    b.Vx -= dx * cm; b.Vy -= dy * cm; b.Vz -= dz * cm;
                    c.Vx += dx * bm; c.Vy += dy * bm; c.Vz += dz * bm;
                }
            }
            foreach (var b in bodies) { b.X += dt * b.Vx; b.Y += dt * b.Vy; b.Z += dt * b.Vz; }
        }
        return new double[] { e0, Energy(bodies) };
    }

    public static void Emit(object res, Action<long> sink)
    {
        foreach (double e in (double[])res) sink((long)Math.Floor(e * 1e9 + 0.5));
    }

    public static void Release(object inst, object res) { }
}
