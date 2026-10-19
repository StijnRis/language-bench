import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.function.LongConsumer;

final class Problem {
    static void setup(String[] args) {}

    static Object decode(byte[] data) {
        ByteBuffer b = ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN);
        int n = b.getInt();
        double[] a = new double[n * n], c = new double[n * n];
        b.asDoubleBuffer().get(a);
        b.position(4 + n * n * 8);
        b.asDoubleBuffer().get(c);
        return new double[][] {a, c, {n}};
    }

    static Object solve(Object inst) {
        double[][] in = (double[][]) inst;
        int n = (int) in[2][0];
        double[] a = in[0], b = in[1], c = new double[n * n];
        for (int i = 0; i < n; i++)
            for (int k = 0; k < n; k++) {
                double aik = a[i * n + k];
                for (int j = 0; j < n; j++) c[i * n + j] += aik * b[k * n + j];
            }
        return c;
    }

    static void emit(Object res, LongConsumer sink) {
        for (double v : (double[]) res) sink.accept((long) Math.floor(v + 0.5));
    }

    static void release(Object inst, Object res) {}
}
