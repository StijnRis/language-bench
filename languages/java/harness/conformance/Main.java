// conformance problem: sum, maximum and a checksum of 4096 int32 values
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.function.LongConsumer;

final class Problem {
    static void setup(String[] args) {}

    static Object decode(byte[] data) {
        int[] a = new int[data.length / 4];
        ByteBuffer.wrap(data).order(ByteOrder.LITTLE_ENDIAN).asIntBuffer().get(a);
        return a;
    }

    static Object solve(Object inst) {
        int[] a = (int[]) inst;
        long sum = 0, mx = 0, sq = 0;
        for (int x : a) { long v = x; sum += v; if (v > mx) mx = v; sq = (sq + v * v) % 1000003; }
        return new long[] {sum, mx, sq, a.length};
    }

    static void emit(Object res, LongConsumer sink) {
        for (long v : (long[]) res) sink.accept(v);
    }

    static void release(Object inst, Object res) {}
}
