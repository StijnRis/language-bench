// N-body simulation, after the Computer Language Benchmarks Game.
using System.Globalization;

const double PI = 3.141592653589793;
const double SOLAR_MASS = 4 * PI * PI;
const double DAYS = 365.24;

Body[] bodies =
{
    new(0, 0, 0, 0, 0, 0, SOLAR_MASS),
    new(4.84143144246472090e+00, -1.16032004402742839e+00, -1.03622044471123109e-01,
        1.66007664274403694e-03 * DAYS, 7.69901118419740425e-03 * DAYS, -6.90460016972063023e-05 * DAYS,
        9.54791938424326609e-04 * SOLAR_MASS),
    new(8.34336671824457987e+00, 4.12479856412430479e+00, -4.03523417114321381e-01,
        -2.76742510726862411e-03 * DAYS, 4.99852801234917238e-03 * DAYS, 2.30417297573763929e-05 * DAYS,
        2.85885980666130812e-04 * SOLAR_MASS),
    new(1.28943695621391310e+01, -1.51111514016986312e+01, -2.23307578892655734e-01,
        2.96460137564761618e-03 * DAYS, 2.37847173959480950e-03 * DAYS, -2.96589568540237556e-05 * DAYS,
        4.36624404335156298e-05 * SOLAR_MASS),
    new(1.53796971148509165e+01, -2.59193146099879641e+01, 1.79258772950371181e-01,
        2.68067772490389322e-03 * DAYS, 1.62824170038242295e-03 * DAYS, -9.51592254519715870e-05 * DAYS,
        5.15138902046611451e-05 * SOLAR_MASS),
};

double Energy()
{
    double e = 0.0;
    for (int i = 0; i < 5; i++)
    {
        Body b = bodies[i];
        e += 0.5 * b.Mass * (b.Vx * b.Vx + b.Vy * b.Vy + b.Vz * b.Vz);
        for (int j = i + 1; j < 5; j++)
        {
            Body b2 = bodies[j];
            double dx = b.X - b2.X, dy = b.Y - b2.Y, dz = b.Z - b2.Z;
            e -= (b.Mass * b2.Mass) / Math.Sqrt(dx * dx + dy * dy + dz * dz);
        }
    }
    return e;
}

void Advance(double dt)
{
    for (int i = 0; i < 5; i++)
    {
        Body b = bodies[i];
        for (int j = i + 1; j < 5; j++)
        {
            Body b2 = bodies[j];
            double dx = b.X - b2.X, dy = b.Y - b2.Y, dz = b.Z - b2.Z;
            double d2 = dx * dx + dy * dy + dz * dz;
            double mag = dt / (d2 * Math.Sqrt(d2));
            b.Vx -= dx * b2.Mass * mag;
            b.Vy -= dy * b2.Mass * mag;
            b.Vz -= dz * b2.Mass * mag;
            b2.Vx += dx * b.Mass * mag;
            b2.Vy += dy * b.Mass * mag;
            b2.Vz += dz * b.Mass * mag;
        }
    }
    foreach (Body b in bodies)
    {
        b.X += dt * b.Vx;
        b.Y += dt * b.Vy;
        b.Z += dt * b.Vz;
    }
}

long n = long.Parse(args[0]);
double px = 0, py = 0, pz = 0;
foreach (Body b in bodies)
{
    px += b.Vx * b.Mass;
    py += b.Vy * b.Mass;
    pz += b.Vz * b.Mass;
}
bodies[0].Vx = -px / SOLAR_MASS;
bodies[0].Vy = -py / SOLAR_MASS;
bodies[0].Vz = -pz / SOLAR_MASS;

Console.WriteLine(Energy().ToString("F9", CultureInfo.InvariantCulture));
for (long i = 0; i < n; i++) Advance(0.01);
Console.WriteLine(Energy().ToString("F9", CultureInfo.InvariantCulture));

sealed class Body
{
    public double X, Y, Z, Vx, Vy, Vz, Mass;

    public Body(double x, double y, double z, double vx, double vy, double vz, double mass)
    {
        X = x;
        Y = y;
        Z = z;
        Vx = vx;
        Vy = vy;
        Vz = vz;
        Mass = mass;
    }
}
