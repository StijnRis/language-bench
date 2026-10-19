// N-body simulation, after the Computer Language Benchmarks Game.
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.function.LongConsumer;

final class Problem {
    static final double SOLAR_MASS = 4 * Math.PI * Math.PI;
    static long steps = 1000000;

    static final class Body {
        double x, y, z, vx, vy, vz, mass;
    }

    static void setup(String[] args) {
        if (args.length > 0) steps = Long.parseLong(args[0]);
    }

    static Object decode(byte[] data) {
        ByteBuffer b = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
        Body[] bodies = new Body[5];
        for (int i = 0; i < 5; i++) {
            Body o = new Body();
            o.x = b.getDouble(); o.y = b.getDouble(); o.z = b.getDouble();
            o.vx = b.getDouble(); o.vy = b.getDouble(); o.vz = b.getDouble(); o.mass = b.getDouble();
            bodies[i] = o;
        }
        return bodies;
    }

    static double energy(Body[] b) {
        double e = 0;
        for (int i = 0; i < b.length; i++) {
            e += 0.5 * b[i].mass * (b[i].vx * b[i].vx + b[i].vy * b[i].vy + b[i].vz * b[i].vz);
            for (int j = i + 1; j < b.length; j++) {
                double dx = b[i].x - b[j].x, dy = b[i].y - b[j].y, dz = b[i].z - b[j].z;
                e -= b[i].mass * b[j].mass / Math.sqrt(dx * dx + dy * dy + dz * dz);
            }
        }
        return e;
    }

    static Object solve(Object inst) {
        Body[] b = (Body[]) inst;
        double px = 0, py = 0, pz = 0;
        for (Body o : b) { px += o.vx * o.mass; py += o.vy * o.mass; pz += o.vz * o.mass; }
        b[0].vx = -px / SOLAR_MASS; b[0].vy = -py / SOLAR_MASS; b[0].vz = -pz / SOLAR_MASS;
        double e0 = energy(b);
        final double dt = 0.01;
        for (long s = 0; s < steps; s++) {
            for (int i = 0; i < 5; i++)
                for (int j = i + 1; j < 5; j++) {
                    double dx = b[i].x - b[j].x, dy = b[i].y - b[j].y, dz = b[i].z - b[j].z;
                    double d2 = dx * dx + dy * dy + dz * dz, mag = dt / (d2 * Math.sqrt(d2));
                    double bm = b[i].mass * mag, cm = b[j].mass * mag;
                    b[i].vx -= dx * cm; b[i].vy -= dy * cm; b[i].vz -= dz * cm;
                    b[j].vx += dx * bm; b[j].vy += dy * bm; b[j].vz += dz * bm;
                }
            for (Body o : b) { o.x += dt * o.vx; o.y += dt * o.vy; o.z += dt * o.vz; }
        }
        return new double[] {e0, energy(b)};
    }

    static void emit(Object res, LongConsumer sink) {
        for (double e : (double[]) res) sink.accept((long) Math.floor(e * 1e9 + 0.5));
    }

    static void release(Object inst, Object res) {}
}
